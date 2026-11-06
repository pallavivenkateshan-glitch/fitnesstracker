import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseStrengthNotes } from '@/lib/parseStrength'

async function refreshStravaToken(refreshToken: string) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  return res.json()
}

async function fetchActivityDetail(activityId: number, accessToken: string) {
  const res = await fetch(
    `https://www.strava.com/api/v3/activities/${activityId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  return res.json()
}

async function parseAndSaveStrength(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  notes: string,
  userId: string,
  activityId: string,
  loggedAt: string,
  existingLogId?: string
): Promise<boolean> {
  try {
    const strengthData = await parseStrengthNotes(notes)

    if (!strengthData) return false

    const hasStrengthData =
      strengthData.squat?.weight_kg ||
      strengthData.bench?.weight_kg ||
      strengthData.deadlift?.weight_kg ||
      (strengthData.extras?.length ?? 0) > 0

    if (!hasStrengthData) return false

    const row = {
      user_id: userId,
      activity_id: activityId,
      squat_weight: strengthData.squat?.weight_kg,
      squat_sets: strengthData.squat?.sets,
      squat_reps: strengthData.squat?.reps,
      bench_weight: strengthData.bench?.weight_kg,
      bench_sets: strengthData.bench?.sets,
      bench_reps: strengthData.bench?.reps,
      deadlift_weight: strengthData.deadlift?.weight_kg,
      deadlift_sets: strengthData.deadlift?.sets,
      deadlift_reps: strengthData.deadlift?.reps,
      extras: strengthData.extras ?? [],
      logged_at: loggedAt,
    }

    if (existingLogId) {
      await supabase.from('strength_logs').update(row).eq('id', existingLogId)
    } else {
      await supabase.from('strength_logs').insert(row)
    }
    return true
  } catch (e) {
    console.error('Strength parse error for activity', activityId, e)
    return false
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get stored tokens
    const { data: tokenRow } = await supabase
      .from('strava_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!tokenRow) {
      return NextResponse.json({ error: 'Strava not connected' }, { status: 400 })
    }

    let accessToken = tokenRow.access_token

    // Refresh if expired (with 5min buffer)
    if (tokenRow.expires_at < Math.floor(Date.now() / 1000) + 300) {
      const refreshed = await refreshStravaToken(tokenRow.refresh_token)
      if (refreshed.access_token) {
        accessToken = refreshed.access_token
        await supabase.from('strava_tokens').update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          expires_at: refreshed.expires_at,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id)
      }
    }

    // Fetch last 30 activities from Strava
    const activitiesRes = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=30',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    const stravaActivities = await activitiesRes.json()

    if (!Array.isArray(stravaActivities)) {
      return NextResponse.json({ error: 'Failed to fetch Strava activities' }, { status: 500 })
    }

    let synced = 0    // new activities inserted
    let updated = 0   // existing activities updated with notes
    let parsed = 0    // strength logs created

    for (const activity of stravaActivities) {
      // Check if already imported
      const { data: existing } = await supabase
        .from('activities')
        .select('id, notes_raw')
        .eq('strava_id', activity.id.toString())
        .single()

      // Fetch full activity detail to get private_note
      let notes = ''
      try {
        const detail = await fetchActivityDetail(activity.id, accessToken)
        // Prefer private_note, fall back to description
        notes = detail.private_note?.trim() || detail.description?.trim() || ''
      } catch (e) {
        console.error('Failed to fetch detail for activity', activity.id, e)
        notes = activity.description?.trim() || ''
      }

      if (existing) {
        // ── UPDATE PATH: existing activity ──
        const notesToUse = notes || existing.notes_raw || ''

        // Update notes_raw if we now have better notes (private_note > old value)
        if (notes && existing.notes_raw !== notes) {
          await supabase
            .from('activities')
            .update({ notes_raw: notes })
            .eq('id', existing.id)
          updated++
        }

        // Parse strength if there's no log yet, or re-parse an existing log when the notes
        // changed or it was saved before exercise categories/durations were captured
        if (notesToUse) {
          const { data: existingStrength } = await supabase
            .from('strength_logs')
            .select('id, extras')
            .eq('activity_id', existing.id)
            .maybeSingle()

          const notesChanged = !!notes && existing.notes_raw !== notes
          const legacyExtras =
            Array.isArray(existingStrength?.extras) &&
            existingStrength.extras.some((e: { category?: string }) => !e.category)

          if (!existingStrength || notesChanged || legacyExtras) {
            const didParse = await parseAndSaveStrength(
              supabase,
              notesToUse,
              user.id,
              existing.id,
              activity.start_date,
              existingStrength?.id
            )
            if (didParse) parsed++
          }
        }
        continue
      }

      // ── INSERT PATH: brand new activity ──
      const { data: inserted } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          strava_id: activity.id.toString(),
          type: activity.type,
          name: activity.name,
          distance: activity.distance,
          duration: activity.moving_time,
          heart_rate_avg: activity.average_heartrate,
          elevation: activity.total_elevation_gain,
          pace: activity.average_speed,
          notes_raw: notes,
          logged_at: activity.start_date,
        })
        .select()
        .single()

      if (inserted) {
        synced++

        if (notes) {
          const didParse = await parseAndSaveStrength(
            supabase,
            notes,
            user.id,
            inserted.id,
            activity.start_date
          )
          if (didParse) parsed++
        }
      }
    }

    return NextResponse.json({
      synced,
      updated,
      parsed,
      message: `Synced ${synced} new activities, updated ${updated} with notes, parsed ${parsed} strength logs`,
    })
  } catch (error) {
    console.error('Strava sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
