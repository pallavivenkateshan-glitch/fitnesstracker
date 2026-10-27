export const instant = false

import { createClient } from '@/lib/supabase/server'
import StravaPage from '@/components/strava/StravaPage'

export default async function StravaServerPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Run both queries in parallel
  const [{ data: tokenRow }, { data: activities }] = await Promise.all([
    supabase
      .from('strava_tokens')
      .select('expires_at, updated_at')
      .eq('user_id', user.id)
      .single(),

    supabase
      .from('activities')
      .select(`
        id,
        strava_id,
        type,
        name,
        distance,
        duration,
        heart_rate_avg,
        elevation,
        notes_raw,
        logged_at,
        strength_logs (
          squat_weight, squat_sets, squat_reps,
          bench_weight, bench_sets, bench_reps,
          deadlift_weight, deadlift_sets, deadlift_reps,
          extras
        )
      `)
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(30),
  ])

  return (
    <StravaPage
      isConnected={!!tokenRow}
      activities={activities ?? []}
      justConnected={params.connected === 'true'}
      errorParam={params.error}
    />
  )
}
