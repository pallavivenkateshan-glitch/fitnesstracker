'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { format, subDays, parseISO, startOfDay } from 'date-fns'

interface Meal {
  calories: number
  logged_at: string
}

function buildWeekData(meals: Meal[], target: number) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i)
    return {
      date: format(date, 'EEE'),
      fullDate: startOfDay(date).toISOString(),
      calories: 0,
      target,
    }
  })

  meals.forEach((meal) => {
    const mealDay = startOfDay(parseISO(meal.logged_at)).toISOString()
    const day = days.find((d) => d.fullDate === mealDay)
    if (day) day.calories += meal.calories
  })

  return days.map((d) => ({ ...d, calories: Math.round(d.calories) }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{payload[0].value} kcal</p>
    </div>
  )
}

export default function WeeklyCalorieChart({
  meals,
  target,
}: {
  meals: Meal[]
  target: number
}) {
  const data = buildWeekData(meals, target)

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-400">7-Day Calories</h2>
        <span className="text-xs text-gray-600">Target: {target} kcal</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={24}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1f2937' }} />
          <ReferenceLine y={target} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Bar
            dataKey="calories"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
