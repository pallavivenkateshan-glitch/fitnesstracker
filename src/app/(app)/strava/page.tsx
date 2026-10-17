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

  const { data: tokenRow } = await supabase
    .from('strava_tokens')
    .select('expires_at, updated_at')
    .eq('user_id', user.id)
    .single()

  const { data: activities } = await supabase
    .from('activities')
    .select(`
      *,
      strength_logs (*)
    `)
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(20)

  return (
    <StravaPage
      isConnected={!!tokenRow}
      activities={activities ?? []}
      justConnected={params.connected === 'true'}
      errorParam={params.error}
    />
  )
}
