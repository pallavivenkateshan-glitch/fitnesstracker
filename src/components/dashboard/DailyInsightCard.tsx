'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'

interface Insight {
  content: string
  generated_at: string
}

export default function DailyInsightCard({
  insight,
  userId,
}: {
  insight: Insight | null
  userId: string
}) {
  const [currentInsight, setCurrentInsight] = useState<Insight | null>(insight)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generateInsight() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, force: true }),
      })
      const data = await res.json()
      if (data.insight) {
        setCurrentInsight({ content: data.insight, generated_at: new Date().toISOString() })
      } else {
        setError('Could not generate insight. Try logging some meals first.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-2xl p-6 border border-emerald-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">AI Daily Insight</span>
        </div>
        <button
          onClick={generateInsight}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating…' : 'Refresh'}
        </button>
      </div>

      {currentInsight ? (
        <p className="text-gray-200 text-sm leading-relaxed">{currentInsight.content}</p>
      ) : loading ? (
        <div className="space-y-2">
          <div className="h-4 bg-gray-700/50 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-700/50 rounded animate-pulse w-4/5" />
          <div className="h-4 bg-gray-700/50 rounded animate-pulse w-3/5" />
        </div>
      ) : (
        <div>
          <p className="text-gray-500 text-sm mb-3">
            No insight generated yet. Log some meals and sync Strava to get your first insight.
          </p>
          <button
            onClick={generateInsight}
            className="text-sm text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
          >
            Generate now →
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  )
}
