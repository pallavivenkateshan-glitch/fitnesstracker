export const instant = false

import { createClient } from '@/lib/supabase/server'
import StrengthDashboard from '@/components/strength/StrengthDashboard'

export default async function StrengthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: strengthLogs } = await supabase
    .from('strength_logs')
    .select(`
      *,
      activities (name, type, logged_at)
    `)
    .eq('user_id', user.id)
    .order('logged_at', { ascending: true })

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Strength Progress</h1>
      <StrengthDashboard logs={strengthLogs ?? []} />
    </div>
  )
}
