export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export interface Meal {
  id: string
  user_id: string
  name: string
  type: MealType
  calories: number
  protein: number
  carbs: number
  fat: number
  photo_url?: string
  notes?: string
  ai_assumptions?: string
  logged_at: string
  created_at: string
}

export interface MealLibraryItem {
  id: string
  user_id: string
  name: string
  type: MealType
  calories: number
  protein: number
  carbs: number
  fat: number
  notes?: string
  created_at: string
}

export interface Activity {
  id: string
  user_id: string
  strava_id: string
  type: string
  name: string
  distance?: number
  duration?: number
  heart_rate_avg?: number
  elevation?: number
  pace?: number
  notes_raw?: string
  logged_at: string
  created_at: string
}

export interface StrengthLog {
  id: string
  user_id: string
  activity_id: string
  squat_weight?: number
  squat_sets?: number
  squat_reps?: number
  bench_weight?: number
  bench_sets?: number
  bench_reps?: number
  deadlift_weight?: number
  deadlift_sets?: number
  deadlift_reps?: number
  extras?: ExtraExercise[]
  logged_at: string
}

export interface ExtraExercise {
  exercise: string
  sets?: number
  reps?: number
}

export interface WeightLog {
  id: string
  user_id: string
  weight_kg: number
  logged_at: string
  created_at: string
}

export interface DailyInsight {
  id: string
  user_id: string
  content: string
  generated_at: string
  date: string
}

export interface MacroTargets {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface StravaTokens {
  access_token: string
  refresh_token: string
  expires_at: number
}

export interface ParsedStrengthData {
  squat: { weight_kg: number | null; sets: number | null; reps: number | null }
  bench: { weight_kg: number | null; sets: number | null; reps: number | null }
  deadlift: { weight_kg: number | null; sets: number | null; reps: number | null }
  extras: ExtraExercise[]
  raw_notes: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
