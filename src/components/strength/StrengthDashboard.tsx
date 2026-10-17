'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from 'recharts'
import { Trophy, Dumbbell } from 'lucide-react'

interface StrengthLog {
  id: string
  squat_weight?: number; squat_sets?: number; squat_reps?: number
  bench_weight?: number; bench_sets?: number; bench_reps?: number
  deadlift_weight?: number; deadlift_sets?: number; deadlift_reps?: number
  extras?: { exercise: string; sets?: number; reps?: number }[]
  logged_at: string
  activities?: { name: string; type: string; logged_at: string }
}

type Unit = 'kg' | 'lbs'

function kgToLbs(kg: number) { return kg * 2.205 }
function displayWeight(kg: number, unit: Unit) {
  return unit === 'lbs' ? `${(kgToLbs(kg)).toFixed(1)} lbs` : `${kg} kg`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">
        {unit === 'lbs'
          ? `${(payload[0].value * 2.205).toFixed(1)} lbs`
          : `${payload[0].value} kg`}
      </p>
    </div>
  )
}

function LiftChart({
  logs,
  weightField,
  setField,
  repField,
  label,
  color,
  unit,
}: {
  logs: StrengthLog[]
  weightField: 'squat_weight' | 'bench_weight' | 'deadlift_weight'
  setField: 'squat_sets' | 'bench_sets' | 'deadlift_sets'
  repField: 'squat_reps' | 'bench_reps' | 'deadlift_reps'
  label: string
  color: string
  unit: Unit
}) {
  const data = logs
    .filter((l) => l[weightField])
    .map((l) => ({
      date: format(parseISO(l.logged_at), 'MMM d'),
      weight: l[weightField] as number,
      sets: l[setField],
      reps: l[repField],
      id: l.id,
    }))

  const maxWeight = data.length > 0 ? Math.max(...data.map((d) => d.weight)) : 0
  const prEntry = data.find((d) => d.weight === maxWeight)

  if (data.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-3">{label}</h3>
        <div className="flex flex-col items-center justify-center py-8">
          <Dumbbell className="w-8 h-8 text-gray-700 mb-2" />
          <p className="text-gray-500 text-sm">No data yet</p>
          <p className="text-gray-600 text-xs mt-1">Add notes to your Strava activities and sync</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-white font-semibold">{label}</h3>
        {prEntry && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <Trophy className="w-3.5 h-3.5" />
            PR: {displayWeight(maxWeight, unit)}
          </div>
        )}
      </div>
      <p className="text-gray-500 text-xs mb-4">{data.length} sessions logged</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Line
            type="monotone"
            dataKey="weight"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />
          {prEntry && (
            <ReferenceDot
              x={prEntry.date}
              y={prEntry.weight}
              r={6}
              fill="#f59e0b"
              stroke="#fbbf24"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function StrengthDashboard({ logs }: { logs: StrengthLog[] }) {
  const [unit, setUnit] = useState<Unit>('kg')

  // Collect all unique accessory exercises
  const accessoryMap: Record<string, { date: string; sets?: number; reps?: number }[]> = {}
  logs.forEach((log) => {
    const extras = log.extras ?? []
    extras.forEach((ex) => {
      const name = ex.exercise.toLowerCase()
      if (!accessoryMap[name]) accessoryMap[name] = []
      accessoryMap[name].push({
        date: format(parseISO(log.logged_at), 'MMM d'),
        sets: ex.sets ?? undefined,
        reps: ex.reps ?? undefined,
      })
    })
  })

  const accessoryNames = Object.keys(accessoryMap).sort()

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

      {/* Main lifts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LiftChart logs={logs} weightField="squat_weight" setField="squat_sets" repField="squat_reps" label="Squat" color="#a855f7" unit={unit} />
        <LiftChart logs={logs} weightField="bench_weight" setField="bench_sets" repField="bench_reps" label="Bench Press" color="#3b82f6" unit={unit} />
        <LiftChart logs={logs} weightField="deadlift_weight" setField="deadlift_sets" repField="deadlift_reps" label="Deadlift" color="#ef4444" unit={unit} />
      </div>

      {/* Accessory work */}
      {accessoryNames.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Accessory Work</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs">
                  <th className="text-left pb-3 font-medium">Exercise</th>
                  <th className="text-left pb-3 font-medium">Recent entries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {accessoryNames.map((name) => (
                  <tr key={name} className="text-gray-300">
                    <td className="py-3 pr-4 capitalize font-medium text-white">{name}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {accessoryMap[name].slice(-5).map((entry, i) => (
                          <span key={i} className="text-xs bg-gray-800 px-2 py-1 rounded-lg">
                            {entry.date}: {entry.sets ? `${entry.sets}×` : ''}{entry.reps ?? '—'}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
