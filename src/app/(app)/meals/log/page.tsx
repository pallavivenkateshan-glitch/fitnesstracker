export const instant = false

import { createClient } from '@/lib/supabase/server'
import MealForm from '@/components/meals/MealForm'

export default async function LogMealPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Detect meal type from current time
  const hour = new Date().getHours()
  let defaultType: 'breakfast' | 'lunch' | 'snack' | 'dinner' = 'dinner'
  if (hour >= 6 && hour < 11) defaultType = 'breakfast'
  else if (hour >= 11 && hour < 14) defaultType = 'lunch'
  else if (hour >= 14 && hour < 17) defaultType = 'snack'
  else if (hour >= 17 && hour < 21) defaultType = 'dinner'

  // Fetch meal library filtered by default type
  const { data: libraryMeals } = await supabase
    .from('meal_library')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Log a Meal</h1>
        <p className="text-gray-500 text-sm mt-1">Upload a photo or enter details manually</p>
      </div>
      <MealForm
        defaultType={defaultType}
        libraryMeals={libraryMeals ?? []}
        userId={user.id}
      />
    </div>
  )
}
