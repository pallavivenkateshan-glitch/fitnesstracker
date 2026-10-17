'use client'

import { useState } from 'react'
import { Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import type { WeightLog } from '@/lib/types'

function kgToLbs(kg: number) {
  return (kg * 2.20462).toFixed(1)
}

export default function WeightWidget({
  weightLogs,
  unit,
}: {
  weightLogs: WeightLog[]
  unit: string
}) {
  const supabase = createClient()
  const [logs, setLogs] = useState<WeightLog[]>(weightLogs)
  const [inputWeight, setInputWeight] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()
  const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()

  const thisWeekLog = logs.find((l) => {
    const d = l.logged_at
    return d >= thisWeekStart && d <= thisWeekEnd
  })

  const latestWeight = logs[0]
  const prevWeight = logs[1]

  function displayWeight(kg: number) {
    return unit === 'lbs' ? `${kgToLbs(kg)} lbs` : `${kg.toFixed(1)} kg`
  }

  const trend =
    latestWeight && prevWeight
      ? latestWeight.weight_kg - prevWeight.weight_kg
      : null

  async function saveWeight() {
    const val = parseFloat(inputWeight)
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid weight')
      return
    }

    const weightKg = unit === 'lbs' ? val / 2.20462 : val
    setSaving(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date().toISOString()

    if (thisWeekLog) {
      // Update existing week's log
      const { data } = await supabase
        .from('weight_logs')
        .update({ weight_kg: weightKg, logged_at: now })
        .eq('id', thisWeekLog.id)
        .select()
        .single()
      if (data) {
        setLogs((prev) => prev.map((l) => (l.id === thisWeekLog.id ? data : l)))
      }
    } else {
      // Insert new
      const { data } = await supabase
        .from('weight_logs')
        .insert({ user_id: user.id, weight_kg: weightKg, logged_at: now })
        .select()
        .single()
      if (data) {
        setLogs((prev) => [data, ...prev])
      }
    }

    setInputWeight('')
    setSaving(false)
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-medium text-gray-400">Weekly Weight</h2>
      </div>

      {latestWeight ? (
        <div className="mb-4">
          <div className="text-3xl font-bold text-white">
            {displayWeight(latestWeight.weight_kg)}
          </div>
          <div className="flex items-center gap-1 mt-1">
            {trend !== null && (
              <>
                {trend < 0 ? (
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                ) : trend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-400" />
                ) : (
                  <Minus className="w-4 h-4 text-gray-400" />
                )}
                <span className={`text-sm ${trend < 0 ? 'text-emerald-400' : trend > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {trend === 0 ? 'No change' : `${trend > 0 ? '+' : ''}${unit === 'lbs' ? kgToLbs(trend) : trend.toFixed(1)} ${unit} from last week`}
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Logged {format(parseISO(latestWeight.logged_at), 'MMM d')}
          </p>
        </div>
      ) : (
        <p className="text-gray-500 text-sm mb-4">No weight logged yet</p>
      )}

      {/* Log this week */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          {thisWeekLog ? 'Update this week' : 'Log this week'}
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            value={inputWeight}
            onChange={(e) => setInputWeight(e.target.value)}
            placeholder={unit === 'lbs' ? 'lbs' : 'kg'}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            onClick={saveWeight}
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl text-sm transition cursor-pointer"
          >
            {saving ? '…' : 'Save'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    </div>
  )
}
