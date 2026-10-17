export const instant = false

import { createClient } from '@/lib/supabase/server'
import MealLibrary from '@/components/meals/MealLibrary'

export default async function MealLibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: meals } = await supabase
    .from('meal_library')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Meal Library</h1>
      <MealLibrary meals={meals ?? []} userId={user.id} />
    </div>
  )
}
