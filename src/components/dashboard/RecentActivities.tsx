'use client'

import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { Activity, Bike, Dumbbell, Footprints, Waves, ChevronRight } from 'lucide-react'
import type { Activity as ActivityType } from '@/lib/types'

function activityIcon(type: string) {
  const t = type.toLowerCase()
  if (t.includes('run')) return <Footprints className="w-4 h-4" />
  if (t.includes('ride') || t.includes('cycle')) return <Bike className="w-4 h-4" />
  if (t.includes('swim')) return <Waves className="w-4 h-4" />
  if (t.includes('weight') || t.includes('strength')) return <Dumbbell className="w-4 h-4" />
  return <Activity className="w-4 h-4" />
}

function formatDuration(seconds?: number) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m}m`
}

function formatDistance(meters?: number) {
  if (!meters) return null
  return `${(meters / 1000).toFixed(1)} km`
}

export default function RecentActivities({
  activities,
}: {
  activities: ActivityType[]
}) {
  if (activities.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-sm font-medium text-gray-400 mb-4">Recent Activities</h2>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Activity className="w-10 h-10 text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">No activities synced yet</p>
          <Link href="/strava" className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 font-medium">
            Connect Strava →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-400">Recent Activities</h2>
        <Link href="/strava" className="text-xs text-emerald-400 hover:text-emerald-300">
          View all →
        </Link>
      </div>
      <div className="space-y-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
              {activityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{activity.name}</p>
              <div className="flex gap-2 text-xs text-gray-500">
                <span>{format(parseISO(activity.logged_at), 'MMM d')}</span>
                <span>{formatDuration(activity.duration ?? undefined)}</span>
                {formatDistance(activity.distance ?? undefined) && (
                  <span>{formatDistance(activity.distance ?? undefined)}</span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </div>
        ))}
      </div>
    </div>
  )
}
