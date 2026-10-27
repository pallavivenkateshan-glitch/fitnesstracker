export const instant = false

import { createClient } from '@/lib/supabase/server'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import MacroProgress from '@/components/dashboard/MacroProgress'
import TodayMeals from '@/components/dashboard/TodayMeals'
import WeeklyCalorieChart from '@/components/dashboard/WeeklyCalorieChart'
import DailyInsightCard from '@/components/dashboard/DailyInsightCard'
import RecentActivities from '@/components/dashboard/RecentActivities'
import WeightWidget from '@/components/dashboard/WeightWidget'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date()
  const todayStart = startOfDay(today).toISOString()
  const todayEnd = endOfDay(today).toISOString()
  const weekAgo = subDays(today, 6).toISOString()

  // Run all queries in parallel instead of sequentially
  const [
    { data: todayMeals },
    { data: weekMeals },
    { data: settings },
    { data: insight },
    { data: activities },
    { data: weightLogs },
  ] = await Promise.all([
    supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', todayStart)
      .lte('logged_at', todayEnd)
      .order('logged_at', { ascending: true }),

    supabase
      .from('meals')
      .select('calories, logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', weekAgo)
      .order('logged_at', { ascending: true }),

    supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single(),

    supabase
      .from('daily_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', format(today, 'yyyy-MM-dd'))
      .single(),

    supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(5),

    supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(8),
  ])

  const macroTargets = settings ?? {
    calorie_target: 2000,
    protein_target: 150,
    carbs_target: 200,
    fat_target: 65,
  }

  const todayTotals = (todayMeals ?? []).reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories ?? 0),
      protein: acc.protein + (meal.protein ?? 0),
      carbs: acc.carbs + (meal.carbs ?? 0),
      fat: acc.fat + (meal.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{format(today, 'EEEE, MMMM d')}</p>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>
        <Link
          href="/meals/log"
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Log Meal
        </Link>
      </div>

      {/* AI Insight */}
      <DailyInsightCard insight={insight} userId={user.id} />

      {/* Macro progress */}
      <MacroProgress totals={todayTotals} targets={macroTargets} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TodayMeals meals={todayMeals ?? []} />
        </div>
        <div className="space-y-6">
          <WeightWidget weightLogs={weightLogs ?? []} unit={settings?.weight_unit ?? 'kg'} />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyCalorieChart meals={weekMeals ?? []} target={macroTargets.calorie_target} />
        <RecentActivities activities={activities ?? []} />
      </div>
    </div>
  )
}
