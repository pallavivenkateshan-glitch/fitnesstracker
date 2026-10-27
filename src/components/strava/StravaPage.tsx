'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Activity,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Bike,
  Footprints,
  Waves,
  Dumbbell,
  Link as LinkIcon,
  FileText,
} from 'lucide-react'

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

interface StrengthLog {
  squat_weight?: number; squat_sets?: number; squat_reps?: number
  bench_weight?: number; bench_sets?: number; bench_reps?: number
  deadlift_weight?: number; deadlift_sets?: number; deadlift_reps?: number
  extras?: { exercise: string; sets?: number; reps?: number }[]
}

interface ActivityWithStrength {
  id: string; strava_id: string; type: string; name: string
  distance?: number; duration?: number; heart_rate_avg?: number
  elevation?: number; notes_raw?: string; logged_at: string
  strength_logs?: StrengthLog[]
}

export default function StravaPage({
  isConnected,
  activities,
  justConnected,
  errorParam,
}: {
  isConnected: boolean
  activities: ActivityWithStrength[]
  justConnected?: boolean
  errorParam?: string
}) {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced?: number; parsed?: number; error?: string } | null>(null)

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/strava/sync', { method: 'POST' })
      const data = await res.json()
      setSyncResult(data)
      if (data.synced > 0) {
        window.location.reload()
      }
    } catch {
      setSyncResult({ error: 'Sync failed. Please try again.' })
    } finally {
      setSyncing(false)
    }
  }

  // Activities that have notes
  const activitiesWithNotes = activities.filter((a) => a.notes_raw?.trim())

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Strava Activities</h1>

      {/* Status messages */}
      {justConnected && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-4 text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          Strava connected! Click Sync to import your activities.
        </div>
      )}
      {errorParam && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {errorParam === 'access_denied' ? 'Strava access was denied.' : 'Something went wrong. Please try again.'}
        </div>
      )}

      {/* Connect / Sync card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/10 p-2 rounded-xl">
              <Activity className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-white font-medium">Strava Integration</p>
              <p className="text-gray-500 text-xs">
                {isConnected ? 'Connected — activities sync automatically on demand' : 'Not connected'}
              </p>
            </div>
          </div>

          {isConnected ? (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
          ) : (
            <a
              href="/api/strava/auth"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition"
            >
              <LinkIcon className="w-4 h-4" />
              Connect Strava
            </a>
          )}
        </div>

        {syncResult && (
          <div className={`mt-3 text-sm ${syncResult.error ? 'text-red-400' : 'text-emerald-400'}`}>
            {syncResult.error
              ? syncResult.error
              : `✓ Synced ${syncResult.synced} new ${syncResult.synced === 1 ? 'activity' : 'activities'}${syncResult.parsed ? `, parsed ${syncResult.parsed} strength logs` : ''}${syncResult.synced === 0 ? ' — already up to date' : ''}`}
          </div>
        )}
      </div>

      {/* Activities list */}
      {activities.length === 0 ? (
        <div className="text-center py-16">
          <Activity className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No activities imported yet</p>
          {isConnected && (
            <p className="text-gray-600 text-sm mt-2">Click Sync Now to import your Strava activities</p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {activities.map((activity) => {
              const strength = activity.strength_logs?.[0]
              return (
                <div key={activity.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {activityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-white font-medium text-sm">{activity.name}</p>
                        <span className="text-xs text-gray-500">
                          {format(parseISO(activity.logged_at), 'EEE, MMM d')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                        <span className="capitalize">{activity.type.replace(/_/g, ' ')}</span>
                        {activity.duration && <span>{formatDuration(activity.duration)}</span>}
                        {activity.distance && <span>{(activity.distance / 1000).toFixed(1)} km</span>}
                        {activity.heart_rate_avg && <span>❤ {Math.round(activity.heart_rate_avg)} bpm</span>}
                        {activity.elevation && <span>↑ {Math.round(activity.elevation)}m</span>}
                      </div>

                      {/* Strength data badges */}
                      {strength && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {strength.squat_weight && (
                            <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-lg">
                              Squat: {strength.squat_weight}kg {strength.squat_sets}×{strength.squat_reps}
                            </span>
                          )}
                          {strength.bench_weight && (
                            <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg">
                              Bench: {strength.bench_weight}kg {strength.bench_sets}×{strength.bench_reps}
                            </span>
                          )}
                          {strength.deadlift_weight && (
                            <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-lg">
                              Deadlift: {strength.deadlift_weight}kg {strength.deadlift_sets}×{strength.deadlift_reps}
                            </span>
                          )}
                          {(strength.extras as { exercise: string; sets?: number; reps?: number }[] ?? []).map((e, i) => (
                            <span key={i} className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded-lg">
                              {e.exercise}{e.reps ? `: ${e.sets ? e.sets + '×' : ''}${e.reps}` : ''}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Full notes — always shown when present, not truncated */}
                      {activity.notes_raw && (
                        <p className="text-xs text-gray-400 mt-2 whitespace-pre-wrap leading-relaxed">
                          {activity.notes_raw}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Workout Notes Table ── */}
          {activitiesWithNotes.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-white">Workout Notes</h2>
                <span className="text-xs text-gray-600 ml-1">({activitiesWithNotes.length} activities)</span>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 w-28">Date</th>
                      <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 w-40">Activity</th>
                      <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activitiesWithNotes.map((activity, i) => (
                      <tr
                        key={activity.id}
                        className={`border-b border-gray-800/50 ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap align-top">
                          {format(parseISO(activity.logged_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-xs align-top">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">{activityIcon(activity.type)}</span>
                            {activity.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-xs whitespace-pre-wrap leading-relaxed align-top">
                          {activity.notes_raw}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
