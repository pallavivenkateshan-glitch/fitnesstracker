'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Camera,
  Upload,
  RefreshCw,
  BookOpen,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { MealType, MealLibraryItem } from '@/lib/types'

const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner']

const mealTypeColors: Record<MealType, string> = {
  breakfast: 'border-amber-500 text-amber-400',
  lunch: 'border-blue-500 text-blue-400',
  snack: 'border-purple-500 text-purple-400',
  dinner: 'border-emerald-500 text-emerald-400',
}

function shrinkImage(dataUrl: string, maxSide = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('no canvas'))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

interface Props {
  defaultType: MealType
  libraryMeals: MealLibraryItem[]
  userId: string
  initialMeal?: {
    id: string
    name: string
    type: MealType
    calories: number
    protein: number
    carbs: number
    fat: number
    notes?: string
  }
}

export default function MealForm({ defaultType, libraryMeals, userId, initialMeal }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mealType, setMealType] = useState<MealType>(initialMeal?.type ?? defaultType)
  const [name, setName] = useState(initialMeal?.name ?? '')
  const [calories, setCalories] = useState(initialMeal?.calories?.toString() ?? '')
  const [protein, setProtein] = useState(initialMeal?.protein?.toString() ?? '')
  const [carbs, setCarbs] = useState(initialMeal?.carbs?.toString() ?? '')
  const [fat, setFat] = useState(initialMeal?.fat?.toString() ?? '')
  const [notes, setNotes] = useState(initialMeal?.notes ?? '')
  const [saveToLibrary, setSaveToLibrary] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [aiAssumptions, setAiAssumptions] = useState('')
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiError, setAiError] = useState('')
  const [reanalyzeNote, setReanalyzeNote] = useState('')
  const [addText, setAddText] = useState('')
  const [addPhoto, setAddPhoto] = useState<string | null>(null)
  const [addAnalyzing, setAddAnalyzing] = useState(false)
  const [addError, setAddError] = useState('')
  const [addedSummary, setAddedSummary] = useState('')
  const addFileInputRef = useRef<HTMLInputElement>(null)
  const [showLibrary, setShowLibrary] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filteredLibrary = libraryMeals.filter((m) => m.type === mealType)

  function selectFromLibrary(meal: MealLibraryItem) {
    setName(meal.name)
    setCalories(meal.calories.toString())
    setProtein(meal.protein.toString())
    setCarbs(meal.carbs.toString())
    setFat(meal.fat.toString())
    setNotes(meal.notes ?? '')
    setShowLibrary(false)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setAiError('')
    const reader = new FileReader()
    reader.onload = async () => {
      const original = reader.result as string
      try {
        setPhotoPreview(await shrinkImage(original))
      } catch {
        setPhotoPreview(original)
      }
    }
    reader.readAsDataURL(file)
  }

  async function analyzePhoto(note?: string) {
    if (!photoFile && !photoPreview) return
    setAiAnalyzing(true)
    setAiError('')

    try {
      // Convert file to base64
      const base64 = photoPreview?.split(',')[1]
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: photoPreview?.startsWith('data:image/jpeg') ? 'image/jpeg' : (photoFile?.type ?? 'image/jpeg'),
          note: note ?? '',
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        setAiError(
          res.status === 413
            ? 'Photo is too large to analyze. Try a smaller one or enter values manually.'
            : data?.error ?? `Analysis failed (${res.status}). Please try again or enter values manually.`
        )
      } else if (data.error) {
        setAiError(data.error)
      } else {
        setName(data.name ?? name)
        setCalories(data.calories?.toString() ?? '')
        setProtein(data.protein?.toString() ?? '')
        setCarbs(data.carbs?.toString() ?? '')
        setFat(data.fat?.toString() ?? '')
        setAiAssumptions(data.assumptions ?? '')
      }
    } catch {
      setAiError('Failed to analyze photo. Please enter values manually.')
    } finally {
      setAiAnalyzing(false)
    }
  }

  function handleAddPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const original = reader.result as string
      try {
        setAddPhoto(await shrinkImage(original))
      } catch {
        setAddPhoto(original)
      }
    }
    reader.readAsDataURL(file)
  }

  async function addItem() {
    if (!addPhoto && !addText.trim()) return
    setAddAnalyzing(true)
    setAddError('')
    setAddedSummary('')

    try {
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: addPhoto?.split(',')[1],
          mimeType: addPhoto?.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png',
          note: addText.trim(),
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok || !data || data.error) {
        setAddError(
          res.status === 413
            ? 'Photo is too large to analyze. Try a smaller one or describe the item instead.'
            : data?.error ?? `Analysis failed (${res.status}). Please try again.`
        )
        return
      }

      const add = (current: string, extra: unknown) =>
        String((parseFloat(current) || 0) + (Number(extra) || 0))
      setCalories((c) => add(c, data.calories))
      setProtein((p) => add(p, data.protein))
      setCarbs((c) => add(c, data.carbs))
      setFat((f) => add(f, data.fat))
      setName((n) => (data.name ? `${n} + ${data.name}` : n))
      setAiAssumptions((a) => [a, data.assumptions ? `Added ${data.name}: ${data.assumptions}` : ''].filter(Boolean).join('\n'))
      setAddedSummary(`Added ${data.name}: ${data.calories} kcal · P ${data.protein}g · C ${data.carbs}g · F ${data.fat}g`)
      setAddText('')
      setAddPhoto(null)
    } catch {
      setAddError('Failed to analyze item. Please try again or edit the values manually.')
    } finally {
      setAddAnalyzing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name) { setError('Please enter a meal name'); return }

    setSaving(true)
    setError('')

    let photoUrl = null

    // Upload photo to Supabase Storage if provided
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meal-photos')
        .upload(path, photoFile, { contentType: photoFile.type })

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('meal-photos')
          .getPublicUrl(uploadData.path)
        photoUrl = urlData.publicUrl
      }
    }

    const mealData = {
      user_id: userId,
      name,
      type: mealType,
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      notes,
      photo_url: photoUrl,
      ai_assumptions: aiAssumptions || null,
      logged_at: new Date().toISOString(),
    }

    if (initialMeal?.id) {
      // Update existing
      const { error: updateError } = await supabase
        .from('meals')
        .update(mealData)
        .eq('id', initialMeal.id)
      if (updateError) { setError(updateError.message); setSaving(false); return }
    } else {
      // Insert new
      const { error: insertError } = await supabase.from('meals').insert(mealData)
      if (insertError) { setError(insertError.message); setSaving(false); return }
    }

    // Save to library if checked
    if (saveToLibrary) {
      await supabase.from('meal_library').insert({
        user_id: userId,
        name,
        type: mealType,
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        notes,
      })
    }

    router.push('/meals')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Meal type selector */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Meal Type</label>
        <div className="grid grid-cols-4 gap-2">
          {mealTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMealType(type)}
              className={`py-2.5 rounded-xl border text-sm font-medium capitalize transition cursor-pointer ${
                mealType === type
                  ? `${mealTypeColors[type]} bg-opacity-10`
                  : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Saved meals from library */}
      {filteredLibrary.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowLibrary(!showLibrary)}
            className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Saved {mealType} meals ({filteredLibrary.length})
            </div>
            {showLibrary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showLibrary && (
            <div className="border-t border-gray-800 divide-y divide-gray-800">
              {filteredLibrary.map((meal) => (
                <button
                  key={meal.id}
                  type="button"
                  onClick={() => selectFromLibrary(meal)}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-800/50 transition text-left cursor-pointer"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{meal.name}</p>
                    <p className="text-gray-500 text-xs">
                      {meal.calories} kcal · P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
                    </p>
                  </div>
                  <Check className="w-4 h-4 text-gray-600" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photo upload */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-sm font-medium text-gray-400 mb-3">Photo (optional — AI will estimate macros)</p>

        {photoPreview ? (
          <div className="space-y-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Meal" className="w-full h-48 object-cover rounded-xl" />
              <button
                type="button"
                onClick={() => { setPhotoPreview(null); setPhotoFile(null); setAiAssumptions('') }}
                className="absolute top-2 right-2 bg-gray-900/80 p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {aiAssumptions && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
                <p className="font-medium mb-1">AI Assumptions:</p>
                <p>{aiAssumptions}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => analyzePhoto()}
                disabled={aiAnalyzing}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium py-2.5 rounded-xl hover:bg-blue-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {aiAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {aiAnalyzing ? 'Analyzing…' : 'Analyze Photo'}
              </button>
            </div>

            {/* Re-analyze with note */}
            {aiAssumptions && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reanalyzeNote}
                  onChange={(e) => setReanalyzeNote(e.target.value)}
                  placeholder='e.g. "larger portion, double serving"'
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => analyzePhoto(reanalyzeNote)}
                  disabled={aiAnalyzing}
                  className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-analyze
                </button>
              </div>
            )}

            {aiError && <p className="text-red-400 text-xs">{aiError}</p>}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-700 hover:border-gray-600 rounded-xl p-8 flex flex-col items-center gap-2 transition cursor-pointer"
          >
            <Upload className="w-8 h-8 text-gray-600" />
            <p className="text-sm text-gray-500">Click to upload a photo</p>
            <p className="text-xs text-gray-600">JPG, PNG, WEBP up to 10MB</p>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </div>

      {initialMeal && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-400">Add another item to this meal</p>
          <textarea
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            placeholder="Describe it, e.g. 1 banana and 2 tbsp peanut butter"
            rows={2}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
          {addPhoto && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={addPhoto} alt="Item" className="w-full h-32 object-cover rounded-xl" />
              <button
                type="button"
                onClick={() => setAddPhoto(null)}
                className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addFileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-gray-800 rounded-xl px-3 py-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" /> {addPhoto ? 'Change photo' : 'Attach photo'}
            </button>
            <button
              type="button"
              onClick={addItem}
              disabled={addAnalyzing || (!addPhoto && !addText.trim())}
              className="flex items-center gap-2 text-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white rounded-xl px-3 py-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {addAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {addAnalyzing ? 'Analyzing…' : 'Analyze & add'}
            </button>
          </div>
          <input
            ref={addFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAddPhotoChange}
            className="hidden"
          />
          {addError && <p className="text-sm text-red-400">{addError}</p>}
          {addedSummary && <p className="text-sm text-emerald-400">{addedSummary}. Totals below are updated — click Update Meal to save.</p>}
        </div>
      )}

      {/* Meal details */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Meal Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chicken & Rice"
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Calories</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Protein (g)</label>
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="0"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Carbs (g)</label>
            <input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="0"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Fat (g)</label>
            <input
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="0"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes…"
            rows={2}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Save to library */}
        {!initialMeal && (
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setSaveToLibrary(!saveToLibrary)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition cursor-pointer ${
                saveToLibrary ? 'border-emerald-500 bg-emerald-500' : 'border-gray-600'
              }`}
            >
              {saveToLibrary && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-gray-400">Save to meal library for quick reuse</span>
          </label>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition cursor-pointer"
        >
          {saving ? 'Saving…' : initialMeal ? 'Update Meal' : 'Log Meal'}
        </button>
      </div>
    </form>
  )
}
