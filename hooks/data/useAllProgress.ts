/**
 * useAllProgress - Hook for aggregating progress across all programs and challenges
 *
 * Fetches aggregated progress from the backend Stats API and maps the response
 * to the frontend AggregatedProgress type. Replaces the old local storage-based
 * computation with a single API call.
 */

import { useRefreshVersions } from '@/context/DataContext'
import { APIError, fetchProgress, isAPIAvailable } from '@/lib/api'
import { mapProgress } from '@/lib/mappers/stats'
import { useEffect, useState } from 'react'

export type AggregatedProgress = {
  totalWorkoutsCompleted: number
  totalTimeSpentSeconds: number
  totalRepsCompleted: number
  activeWorkouts: number
  currentStreak: number
  recentActivity: { date: string; workoutId: string }[]
  exercisesWithData: string[]
}

export function useAllProgress(): {
  data: AggregatedProgress | null
  loading: boolean
  error: Error | null
} {
  const { progressVersion } = useRefreshVersions()

  const [data, setData] = useState<AggregatedProgress | null>(null)
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

        const apiProgress = await fetchProgress()
        if (mounted) {
          setData(mapProgress(apiProgress))
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof APIError
              ? err
              : new APIError(
                  'UNKNOWN_ERROR',
                  'Failed to fetch progress',
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
  }, [progressVersion])

  return { data, loading, error }
}
