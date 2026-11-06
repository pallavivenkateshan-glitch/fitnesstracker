import type { ExtraCategory, ExtraExercise } from '@/lib/types'

export type Unit = 'kg' | 'lbs'

export function kgToLbs(kg: number) {
  return kg * 2.205
}

export function displayWeight(kg: number, unit: Unit) {
  return unit === 'lbs' ? `${kgToLbs(kg).toFixed(1)} lbs` : `${Math.round(kg * 10) / 10} kg`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

/** Epley estimated one-rep max. A single rep is the weight itself. */
export function epley(weight: number, reps?: number | null) {
  const r = reps && reps > 0 ? reps : 1
  return r === 1 ? weight : weight * (1 + r / 30)
}

/** Total volume = weight x sets x reps (missing sets/reps count as 1). */
export function sessionVolume(weight: number, sets?: number | null, reps?: number | null) {
  return weight * (sets && sets > 0 ? sets : 1) * (reps && reps > 0 ? reps : 1)
}

/** Category from the parser, or a name-based fallback for rows saved before categories existed. */
export function classifyExtra(ex: ExtraExercise): ExtraCategory {
  if (ex.category) return ex.category
  const name = ex.exercise.toLowerCase()
  if (/farmer|suitcase carry/.test(name)) return 'farmers_walk'
  if (/side[\s-]*plank/.test(name)) return 'side_plank'
  if (/plank/.test(name)) return 'plank'
  return 'accessory'
}
