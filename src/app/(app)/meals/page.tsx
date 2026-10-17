export const instant = false

import { createClient } from '@/lib/supabase/server'
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns'
import Link from 'next/link'
import { Plus, Camera, Utensils } from 'lucide-react'

const mealTypeColors: Record<string, string> = {
  breakfast: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  lunch: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  snack: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  dinner: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
}

export default async function MealsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch last 7 days of meals
  const weekAgo = subDays(new Date(), 6)
  const { data: meals } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', user.id)
    .gte('logged_at', startOfDay(weekAgo).toISOString())
    .lte('logged_at', endOfDay(new Date()).toISOString())
    .order('logged_at', { ascending: false })

  // Group by day
  const grouped: Record<string, typeof meals> = {}
  ;(meals ?? []).forEach((meal) => {
    const day = format(parseISO(meal.logged_at), 'yyyy-MM-dd')
    if (!grouped[day]) grouped[day] = []
    grouped[day]!.push(meal)
  })

  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Meals</h1>
        <Link
          href="/meals/log"
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Log Meal
        </Link>
      </div>

      {/* Meal library link */}
      <Link
        href="/meals/library"
        className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-2xl mb-6 hover:border-gray-700 transition"
      >
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg">
            <Utensils className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Meal Library</p>
            <p className="text-gray-500 text-xs">Manage your saved recurring meals</p>
          </div>
        </div>
        <span className="text-gray-500 text-sm">→</span>
      </Link>

      {/* Meal history */}
      {days.length === 0 ? (
        <div className="text-center py-16">
          <Utensils className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No meals logged yet</p>
          <Link
            href="/meals/log"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Log your first meal
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map((day) => {
            const dayMeals = grouped[day] ?? []
            const totals = dayMeals.reduce(
              (acc, m) => ({
                calories: acc.calories + m.calories,
                protein: acc.protein + m.protein,
              }),
              { calories: 0, protein: 0 }
            )
            return (
              <div key={day}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-300">
                    {format(new Date(day), 'EEEE, MMM d')}
                  </h2>
                  <span className="text-xs text-gray-500">
                    {Math.round(totals.calories)} kcal · {Math.round(totals.protein)}g protein
                  </span>
                </div>
                <div className="space-y-2">
                  {dayMeals.map((meal) => (
                    <Link
                      key={meal.id}
                      href={`/meals/edit/${meal.id}`}
                      className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center">
                        {meal.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={meal.photo_url} alt={meal.name} className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium text-sm truncate">{meal.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${mealTypeColors[meal.type] ?? ''}`}>
                            {meal.type}
                          </span>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-500">
                          <span>{Math.round(meal.calories)} kcal</span>
                          <span>P {Math.round(meal.protein)}g</span>
                          <span>C {Math.round(meal.carbs)}g</span>
                          <span>F {Math.round(meal.fat)}g</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
