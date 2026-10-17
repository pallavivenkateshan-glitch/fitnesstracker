'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Utensils } from 'lucide-react'
import type { MealLibraryItem, MealType } from '@/lib/types'

const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner']

const mealTypeColors: Record<MealType, string> = {
  breakfast: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  lunch: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  snack: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  dinner: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
}

export default function MealLibrary({
  meals,
  userId,
}: {
  meals: MealLibraryItem[]
  userId: string
}) {
  const supabase = createClient()
  const [items, setItems] = useState<MealLibraryItem[]>(meals)
  const [filter, setFilter] = useState<MealType | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'breakfast' as MealType,
    calories: '', protein: '', carbs: '', fat: '', notes: '',
  })

  const filtered = filter === 'all' ? items : items.filter((m) => m.type === filter)

  async function deleteItem(id: string) {
    await supabase.from('meal_library').delete().eq('id', id)
    setItems((prev) => prev.filter((m) => m.id !== id))
  }

  async function saveItem() {
    if (!form.name) return
    setSaving(true)
    const { data } = await supabase
      .from('meal_library')
      .insert({
        user_id: userId,
        name: form.name,
        type: form.type,
        calories: parseFloat(form.calories) || 0,
        protein: parseFloat(form.protein) || 0,
        carbs: parseFloat(form.carbs) || 0,
        fat: parseFloat(form.fat) || 0,
        notes: form.notes || null,
      })
      .select()
      .single()

    if (data) setItems((prev) => [data, ...prev])
    setForm({ name: '', type: 'breakfast', calories: '', protein: '', carbs: '', fat: '', notes: '' })
    setShowForm(false)
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-xl text-sm font-medium transition cursor-pointer ${
            filter === 'all' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'
          }`}
        >
          All
        </button>
        {mealTypes.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition cursor-pointer ${
              filter === t ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Add new */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 w-full p-4 border-2 border-dashed border-gray-700 hover:border-gray-600 rounded-2xl text-gray-500 hover:text-gray-400 transition cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">Add meal to library</span>
        </button>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium text-white">New saved meal</p>
          <div className="grid grid-cols-4 gap-2">
            {mealTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={`py-2 rounded-xl border text-xs font-medium capitalize transition cursor-pointer ${
                  form.type === t ? `${mealTypeColors[t]}` : 'border-gray-700 text-gray-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Meal name"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="grid grid-cols-2 gap-2">
            {(['calories', 'protein', 'carbs', 'fat'] as const).map((field) => (
              <input
                key={field}
                type="number"
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)}${field === 'calories' ? ' kcal' : ' g'}`}
                className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-800 text-gray-400 py-2 rounded-xl text-sm cursor-pointer hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={saveItem}
              disabled={saving || !form.name}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-medium cursor-pointer transition"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Library items */}
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <Utensils className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No saved meals yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((meal) => (
            <div
              key={meal.id}
              className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium text-sm truncate">{meal.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${mealTypeColors[meal.type]}`}>
                    {meal.type}
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>{meal.calories} kcal</span>
                  <span>P {meal.protein}g</span>
                  <span>C {meal.carbs}g</span>
                  <span>F {meal.fat}g</span>
                </div>
              </div>
              <button
                onClick={() => deleteItem(meal.id)}
                className="p-2 text-gray-600 hover:text-red-400 rounded-lg hover:bg-gray-800 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
