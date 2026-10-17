export const instant = false

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MealForm from '@/components/meals/MealForm'
import type { MealType } from '@/lib/types'

export default async function EditMealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: meal } = await supabase
    .from('meals')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!meal) notFound()

  const { data: libraryMeals } = await supabase
    .from('meal_library')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Edit Meal</h1>
        <p className="text-gray-500 text-sm mt-1">{meal.name}</p>
      </div>
      <MealForm
        defaultType={meal.type as MealType}
        libraryMeals={libraryMeals ?? []}
        userId={user.id}
        initialMeal={{
          id: meal.id,
          name: meal.name,
          type: meal.type as MealType,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          notes: meal.notes,
        }}
      />
    </div>
  )
}
