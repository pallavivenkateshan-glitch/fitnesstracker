'use client'

import { useState } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { Trophy, Dumbbell, TrendingUp, TrendingDown } from 'lucide-react'
import type { ExtraExercise } from '@/lib/types'
import {
  type Unit,
  displayWeight,
  formatDuration,
  epley,
  sessionVolume,
  classifyExtra,
} from '@/lib/strength'

interface StrengthLog {
  id: string
  squat_weight?: number; squat_sets?: number; squat_reps?: number
  bench_weight?: number; bench_sets?: number; bench_reps?: number
  deadlift_weight?: number; deadlift_sets?: number; deadlift_reps?: number
  extras?: ExtraExercise[]
  logged_at: string
  activities?: { name: string; type: string; logged_at: string }
}

type LiftKey = 'squat' | 'bench' | 'deadlift'

const LIFTS: { key: LiftKey; label: string; color: string }[] = [
  { key: 'squat', label: 'Squat', color: '#a855f7' },
  { key: 'bench', label: 'Bench Press', color: '#3b82f6' },
  { key: 'deadlift', label: 'Deadlift', color: '#ef4444' },
]

interface Session {
  id: string
  lift: LiftKey
  date: string
  weight: number
  sets?: number
  reps?: number
  volume: number
  e1rm: number
}

const CARD = 'bg-gray-900 border border-gray-800 rounded-2xl p-6'
const TH = 'text-left pb-3 font-medium pr-6 text-gray-500 text-xs'
const DASH = <span className="text-gray-600">—</span>

function buildSessions(logs: StrengthLog[], lift: LiftKey): Session[] {
  return logs
    .filter((l) => l[`${lift}_weight`])
    .map((l) => {
      const weight = l[`${lift}_weight`] as number
      const sets = l[`${lift}_sets`]
      const reps = l[`${lift}_reps`]
      return {
        id: l.id,
        lift,
        date: l.logged_at,
        weight,
        sets,
        reps,
        volume: sessionVolume(weight, sets, reps),
        e1rm: epley(weight, reps),
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

function scheme(s: { weight: number; sets?: number; reps?: number }, unit: Unit) {
  const w = displayWeight(s.weight, unit)
  if (s.sets && s.reps) return `${w} × ${s.sets}×${s.reps}`
  if (s.reps) return `${w} × ${s.reps}`
  return w
}

function LiftCard({
  label,
  color,
  sessions,
  unit,
}: {
  label: string
  color: string
  sessions: Session[]
  unit: Unit
}) {
  if (sessions.length === 0) {
    return (
      <div className={CARD}>
        <h3 className="text-white font-semibold mb-3">{label}</h3>
        <div className="flex flex-col items-center justify-center py-6">
          <Dumbbell className="w-8 h-8 text-gray-700 mb-2" />
          <p className="text-gray-500 text-sm">No data yet</p>
          <p className="text-gray-600 text-xs mt-1">Add notes to your Strava activities and sync</p>
        </div>
      </div>
    )
  }

  const last = sessions[sessions.length - 1]
  const pr = sessions.reduce((best, s) => (s.e1rm > best.e1rm ? s : best))
  const cutoff = subDays(parseISO(last.date), 28).toISOString()
  const earlier = [...sessions].reverse().find((s) => s.date <= cutoff)
  const delta = earlier ? last.e1rm - earlier.e1rm : null
  const isPr = last.id === pr.id && last.e1rm === pr.e1rm

  return (
    <div className={CARD} style={{ borderTopColor: color, borderTopWidth: 2 }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">{label}</h3>
        {isPr && (
          <span className="flex items-center gap-1 text-xs text-amber-400">
            <Trophy className="w-3.5 h-3.5" /> New PR
          </span>
        )}
      </div>

      <p className="text-gray-500 text-xs">Estimated 1RM</p>
      <p className="text-3xl font-bold text-white leading-tight">{displayWeight(last.e1rm, unit)}</p>
      <div className="h-5 mt-1 text-xs">
        {delta === null ? (
          <span className="text-gray-600">No data from 4+ weeks ago</span>
        ) : (
          <span className={`flex items-center gap-1 ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {delta >= 0 ? '+' : '−'}
            {displayWeight(Math.abs(delta), unit)} vs 4 weeks ago
          </span>
        )}
      </div>

      <dl className="mt-4 pt-4 border-t border-gray-800 space-y-2 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Best e1RM</dt>
          <dd className="text-amber-400 text-right">
            {displayWeight(pr.e1rm, unit)}{' '}
            <span className="text-gray-500">({scheme(pr, unit)})</span>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Last session</dt>
          <dd className="text-gray-300 text-right">
            {scheme(last, unit)} · {format(parseISO(last.date), 'MMM d')}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Sessions</dt>
          <dd className="text-gray-300">{sessions.length}</dd>
        </div>
      </dl>
    </div>
  )
}

function SessionsTable({ sessions, unit }: { sessions: Session[]; unit: Unit }) {
  const [filter, setFilter] = useState<'all' | LiftKey>('all')
  const [expanded, setExpanded] = useState(false)

  if (sessions.length === 0) return null

  const bestByLift = new Map<LiftKey, number>()
  sessions.forEach((s) => bestByLift.set(s.lift, Math.max(bestByLift.get(s.lift) ?? 0, s.e1rm)))

  const filtered = sessions
    .filter((s) => filter === 'all' || s.lift === filter)
    .sort((a, b) => b.date.localeCompare(a.date))
  const limit = filter === 'all' ? 15 : 10
  const rows = expanded ? filtered : filtered.slice(0, limit)

  return (
    <div className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-white font-semibold">Recent Sessions</h2>
        <div className="flex bg-gray-800 rounded-xl p-1">
          {(['all', ...LIFTS.map((l) => l.key)] as const).map((k) => (
            <button
              key={k}
              onClick={() => { setFilter(k); setExpanded(false) }}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                filter === k ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className={TH}>Date</th>
              <th className={TH}>Lift</th>
              <th className={TH}>Weight × Sets × Reps</th>
              <th className={TH}>Volume</th>
              <th className={`${TH} pr-0`}>e1RM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {rows.map((s) => {
              const lift = LIFTS.find((l) => l.key === s.lift)!
              const isBest = s.e1rm === bestByLift.get(s.lift)
              return (
                <tr key={`${s.lift}-${s.id}`} className="text-gray-300 hover:bg-gray-800/30 transition">
                  <td className="py-2.5 pr-6 text-gray-400 text-xs whitespace-nowrap">
                    {format(parseISO(s.date), 'MMM d, yyyy')}
                  </td>
                  <td className="py-2.5 pr-6 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full" style={{ background: lift.color }} />
                      {lift.label}
                    </span>
                  </td>
                  <td className="py-2.5 pr-6 text-xs whitespace-nowrap">{scheme(s, unit)}</td>
                  <td className="py-2.5 pr-6 text-xs whitespace-nowrap text-gray-400">
                    {displayWeight(s.volume, unit)}
                  </td>
                  <td className="py-2.5 text-xs whitespace-nowrap">
                    <span className={isBest ? 'text-amber-400 inline-flex items-center gap-1' : ''}>
                      {isBest && <Trophy className="w-3 h-3" />}
                      {displayWeight(s.e1rm, unit)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > limit && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-gray-400 hover:text-white cursor-pointer"
        >
          {expanded ? 'Show less' : `Show all ${filtered.length}`}
        </button>
      )}
    </div>
  )
}

interface ExtraEntry extends ExtraExercise {
  date: string
}

const CORE_SECTIONS = [
  { key: 'plank', label: 'Plank' },
  { key: 'side_plank', label: 'Side Plank' },
  { key: 'farmers_walk', label: "Farmer's Walk" },
] as const

function CoreAndCarries({ entries, unit }: { entries: Record<string, ExtraEntry[]>; unit: Unit }) {
  const sections = CORE_SECTIONS.filter((s) => entries[s.key]?.length)
  if (sections.length === 0) return null

  return (
    <div className={CARD}>
      <h2 className="text-white font-semibold mb-4">Core &amp; Carries</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className={TH}>Date</th>
              <th className={TH}>Sets</th>
              <th className={TH}>Time</th>
              <th className={TH}>Weight</th>
              <th className={`${TH} pr-0`}>Distance</th>
            </tr>
          </thead>
          {sections.map(({ key, label }) => {
            const list = entries[key]
            const bestTime = Math.max(0, ...list.map((e) => e.duration_seconds ?? 0))
            const bestLoad = Math.max(0, ...list.map((e) => e.weight_kg ?? 0))
            return (
              <tbody key={key} className="divide-y divide-gray-800/50">
                <tr>
                  <td colSpan={5} className="pt-5 pb-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-white font-medium">{label}</span>
                      {bestTime > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <Trophy className="w-3 h-3" /> Best hold {formatDuration(bestTime)}
                        </span>
                      )}
                      {key === 'farmers_walk' && bestLoad > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <Trophy className="w-3 h-3" /> Best load {displayWeight(bestLoad, unit)}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                {[...list].reverse().map((e, i) => (
                  <tr key={`${key}-${i}`} className="text-gray-300 hover:bg-gray-800/30 transition">
                    <td className="py-2 pr-6 text-gray-400 text-xs whitespace-nowrap">{e.date}</td>
                    <td className="py-2 pr-6 text-xs">{e.sets ?? DASH}</td>
                    <td className="py-2 pr-6 text-xs whitespace-nowrap">
                      {e.duration_seconds ? (
                        <span className="text-blue-400">{formatDuration(e.duration_seconds)}</span>
                      ) : DASH}
                    </td>
                    <td className="py-2 pr-6 text-xs whitespace-nowrap">
                      {e.weight_kg ? (
                        <span className="text-emerald-400">{displayWeight(e.weight_kg, unit)}</span>
                      ) : DASH}
                    </td>
                    <td className="py-2 text-xs whitespace-nowrap">
                      {e.distance_m ? `${e.distance_m} m` : DASH}
                    </td>
                  </tr>
                ))}
              </tbody>
            )
          })}
        </table>
      </div>
    </div>
  )
}

function AccessoryTable({ entries, unit }: { entries: Record<string, ExtraEntry[]>; unit: Unit }) {
  const names = Object.keys(entries).sort()
  if (names.length === 0) return null

  return (
    <div className={CARD}>
      <h2 className="text-white font-semibold mb-4">Accessory Work</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className={TH}>Date</th>
              <th className={TH}>Weight</th>
              <th className={TH}>Sets</th>
              <th className={TH}>Reps</th>
              <th className={`${TH} pr-0`}>Time</th>
            </tr>
          </thead>
          {names.map((name) => (
            <tbody key={name} className="divide-y divide-gray-800/50">
              <tr>
                <td colSpan={5} className="pt-5 pb-2 text-white font-medium capitalize">{name}</td>
              </tr>
              {[...entries[name]].reverse().map((e, i) => (
                <tr key={`${name}-${i}`} className="text-gray-300 hover:bg-gray-800/30 transition">
                  <td className="py-2 pr-6 text-gray-400 text-xs whitespace-nowrap">{e.date}</td>
                  <td className="py-2 pr-6 text-xs whitespace-nowrap">
                    {e.weight_kg ? (
                      <span className="text-emerald-400">{displayWeight(e.weight_kg, unit)}</span>
                    ) : DASH}
                  </td>
                  <td className="py-2 pr-6 text-xs">{e.sets ?? DASH}</td>
                  <td className="py-2 pr-6 text-xs">{e.reps ?? DASH}</td>
                  <td className="py-2 text-xs whitespace-nowrap">
                    {e.duration_seconds ? (
                      <span className="text-blue-400">{formatDuration(e.duration_seconds)}</span>
                    ) : DASH}
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  )
}

export default function StrengthDashboard({ logs }: { logs: StrengthLog[] }) {
  const [unit, setUnit] = useState<Unit>('kg')

  const sessionsByLift = Object.fromEntries(
    LIFTS.map((l) => [l.key, buildSessions(logs, l.key)])
  ) as Record<LiftKey, Session[]>
  const allSessions = LIFTS.flatMap((l) => sessionsByLift[l.key])

  // Group extras: planks / farmer's walks by category, everything else by lowercased name
  const core: Record<string, ExtraEntry[]> = {}
  const accessory: Record<string, ExtraEntry[]> = {}
  logs.forEach((log) => {
    const date = format(parseISO(log.logged_at), 'MMM d, yyyy')
    ;(log.extras ?? []).forEach((ex) => {
      const category = classifyExtra(ex)
      if (category === 'accessory') {
        const name = ex.exercise.toLowerCase()
        ;(accessory[name] ??= []).push({ ...ex, date })
      } else {
        ;(core[category] ??= []).push({ ...ex, date })
      }
    })
  })

  return (
    <div className="space-y-6">
      {/* Unit toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Unit:</span>
        <div className="flex bg-gray-800 rounded-xl p-1">
          {(['kg', 'lbs'] as Unit[]).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                unit === u ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Main lifts: estimated 1RM so lighter, higher-rep days still count */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LIFTS.map((l) => (
          <LiftCard key={l.key} label={l.label} color={l.color} sessions={sessionsByLift[l.key]} unit={unit} />
        ))}
      </div>
      {allSessions.length > 0 && (
        <p className="text-xs text-gray-600 -mt-3">
          Estimated 1RM = weight × (1 + reps ÷ 30). It lets a 90 kg × 10 day compare fairly with a heavier, lower-rep day.
        </p>
      )}

      <SessionsTable sessions={allSessions} unit={unit} />
      <CoreAndCarries entries={core} unit={unit} />
      <AccessoryTable entries={accessory} unit={unit} />

      {logs.length === 0 && (
        <div className="text-center py-16">
          <Dumbbell className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No strength data yet</p>
          <p className="text-gray-600 text-sm max-w-sm mx-auto">
            Add workout notes to your Strava activities (e.g. &quot;Squat 100kg 3x5, Bench 80kg 3x5&quot;) and sync to start tracking progress.
          </p>
        </div>
      )}
    </div>
  )
}
