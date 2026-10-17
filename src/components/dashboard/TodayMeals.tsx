'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Utensils, Trash2, Edit2, Camera } from 'lucide-react'
import type { Meal } from '@/lib/types'

const mealTypeColors: Record<string, string> = {
  breakfast: 'text-amber-400 bg-amber-400/10',
  lunch: 'text-blue-400 bg-blue-400/10',
  snack: 'text-purple-400 bg-purple-400/10',
  dinner: 'text-emerald-400 bg-emerald-400/10',
}

export default function TodayMeals({ meals }: { meals: Meal[] }) {
  const supabase = createClient()
  const [localMeals, setLocalMeals] = useState<Meal[]>(meals)

  async function deleteMeal(id: string) {
    await supabase.from('meals').delete().eq('id', id)
    setLocalMeals((prev) => prev.filter((m) => m.id !== id))
  }

  if (localMeals.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-sm font-medium text-gray-400 mb-4">Today&apos;s Meals</h2>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Utensils className="w-10 h-10 text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">No meals logged yet today</p>
          <Link
            href="/meals/log"
            className="mt-4 text-sm text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Log your first meal →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-400">Today&apos;s Meals</h2>
        <Link href="/meals" className="text-xs text-emerald-400 hover:text-emerald-300">
          View all →
        </Link>
      </div>
      <div className="space-y-3">
        {localMeals.map((meal) => (
          <div
            key={meal.id}
            className="flex items-center gap-4 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition"
          >
            {/* Meal photo or icon */}
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-700 flex items-center justify-center">
              {meal.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={meal.photo_url} alt={meal.name} className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-5 h-5 text-gray-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white font-medium text-sm truncate">{meal.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${mealTypeColors[meal.type] ?? ''}`}>
                  {meal.type}
                </span>
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span>{Math.round(meal.calories)} kcal</span>
                <span>P: {Math.round(meal.protein)}g</span>
                <span>C: {Math.round(meal.carbs)}g</span>
                <span>F: {Math.round(meal.fat)}g</span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Link
                href={`/meals/edit/${meal.id}`}
                className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-700 transition"
              >
                <Edit2 className="w-4 h-4" />
              </Link>
              <button
                onClick={() => deleteMeal(meal.id)}
                className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-700 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
