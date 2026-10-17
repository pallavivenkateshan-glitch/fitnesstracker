'use client'

interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface MacroTargets {
  calorie_target: number
  protein_target: number
  carbs_target: number
  fat_target: number
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  const over = value > max
  return (
    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${over ? 'bg-red-400' : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function MacroProgress({
  totals,
  targets,
}: {
  totals: MacroTotals
  targets: MacroTargets
}) {
  const macros = [
    {
      label: 'Calories',
      value: Math.round(totals.calories),
      target: targets.calorie_target,
      unit: 'kcal',
      color: 'bg-emerald-400',
    },
    {
      label: 'Protein',
      value: Math.round(totals.protein),
      target: targets.protein_target,
      unit: 'g',
      color: 'bg-blue-400',
    },
    {
      label: 'Carbs',
      value: Math.round(totals.carbs),
      target: targets.carbs_target,
      unit: 'g',
      color: 'bg-amber-400',
    },
    {
      label: 'Fat',
      value: Math.round(totals.fat),
      target: targets.fat_target,
      unit: 'g',
      color: 'bg-purple-400',
    },
  ]

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h2 className="text-sm font-medium text-gray-400 mb-4">Today&apos;s Nutrition</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {macros.map((m) => (
          <div key={m.label}>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm text-gray-400">{m.label}</span>
              <span className="text-xs text-gray-600">{m.target}{m.unit}</span>
            </div>
            <div className="text-2xl font-bold text-white mb-2">
              {m.value}
              <span className="text-sm font-normal text-gray-400 ml-1">{m.unit}</span>
            </div>
            <ProgressBar value={m.value} max={m.target} color={m.color} />
            <div className="text-xs text-gray-600 mt-1">
              {Math.max(0, m.target - m.value)} {m.unit} remaining
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
