import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    let synced = 0
    let parsed = 0

    for (const activity of stravaActivities) {
      // Check if already imported
      const { data: existing } = await supabase
        .from('activities')
        .select('id')
        .eq('strava_id', activity.id.toString())
        .single()

      if (existing) continue

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
          notes_raw: activity.description,
          logged_at: activity.start_date,
        })
        .select()
        .single()

      if (inserted) {
        synced++

        // Parse strength data from notes if present
        if (activity.description?.trim()) {
          try {
            const parseRes = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL}/api/parse-strength`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: activity.description }),
              }
            )
            const { data: strengthData } = await parseRes.json()

            if (strengthData) {
              const hasStrengthData =
                strengthData.squat?.weight_kg ||
                strengthData.bench?.weight_kg ||
                strengthData.deadlift?.weight_kg ||
                strengthData.extras?.length > 0

              if (hasStrengthData) {
                await supabase.from('strength_logs').insert({
                  user_id: user.id,
                  activity_id: inserted.id,
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
                  logged_at: activity.start_date,
                })
                parsed++
              }
            }
          } catch (e) {
            console.error('Strength parse error for activity', activity.id, e)
          }
        }
      }
    }

    return NextResponse.json({ synced, parsed, message: `Synced ${synced} new activities, parsed ${parsed} strength logs` })
  } catch (error) {
    console.error('Strava sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
