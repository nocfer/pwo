/**
 * useWeeklyStats - Hook for loading weekly statistics
 *
 * Fetches weekly stats from the backend Stats API and maps the response
 * to the frontend WeeklyStats type. Replaces the old local storage-based
 * computation with a single API call.
 */

import { useRefreshVersions } from '@/context/DataContext'
import { APIError, fetchWeeklyStats, isAPIAvailable } from '@/lib/api'
import { mapWeeklyStats } from '@/lib/mappers/stats'
import type { WeeklyStats } from '@/types'
import { useEffect, useState } from 'react'

export function useWeeklyStats(weekStart?: Date): {
  stats: WeeklyStats | null
  loading: boolean
  error: Error | null
} {
  const { progressVersion } = useRefreshVersions()

  const [stats, setStats] = useState<WeeklyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        if (!isAPIAvailable()) {
          if (mounted) {
            setError(
              new APIError(
                'API_DISABLED',
                'API is not available or not configured'
              )
            )
            setLoading(false)
          }
          return
        }

        const weekStartStr = weekStart?.toISOString().split('T')[0]
        const apiWeekly = await fetchWeeklyStats(weekStartStr)
        if (mounted) {
          setStats(mapWeeklyStats(apiWeekly))
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof APIError
              ? err
              : new APIError(
                  'UNKNOWN_ERROR',
                  'Failed to fetch weekly stats',
                  undefined,
                  err
                )
          )
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [progressVersion, weekStart?.toISOString()])

  return { stats, loading, error }
}

/**
 * Hook to get the current week's completion percentage
 */
export function useWeeklyCompletion(): {
  completed: number
  goal: number
  percentage: number
  loading: boolean
} {
  const { stats, loading } = useWeeklyStats()

  const completed = stats?.workoutsCompleted ?? 0
  const goal = stats?.workoutGoal ?? 4
  const percentage = goal > 0 ? Math.min(100, (completed / goal) * 100) : 0

  return { completed, goal, percentage, loading }
}
