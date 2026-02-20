/**
 * useExerciseProgression - Hook for loading exercise progression data for charts
 *
 * Fetches exercise progression from the backend Stats API. The API returns
 * ProgressionPoint[] which matches the frontend ProgressionDataPoint shape,
 * so no mapper is needed. Local calculateTrend() logic is retained since
 * the API returns raw data points, not computed trends.
 */

import { useRefreshVersions } from '@/context/DataContext'
import { APIError, fetchExerciseProgression, isAPIAvailable } from '@/lib/api'
import { useEffect, useState } from 'react'

export type ProgressionDataPoint = {
  date: string
  reps: number
  maxWeight?: number
  volume?: number
}

export type ProgressionTrend = {
  direction: 'up' | 'down' | 'stable'
  delta: number
  percentChange: number
}

export type ExerciseProgressionData = {
  dataPoints: ProgressionDataPoint[]
  trend: ProgressionTrend
  hasWeightData: boolean
}

export function useExerciseProgression(
  exerciseId: string | null,
  days: number = 30
): {
  data: ExerciseProgressionData | null
  loading: boolean
  error: Error | null
} {
  const { progressVersion } = useRefreshVersions()

  const [data, setData] = useState<ExerciseProgressionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      if (!exerciseId) {
        if (mounted) {
          setData(null)
          setLoading(false)
        }
        return
      }

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

        const dataPoints: ProgressionDataPoint[] =
          await fetchExerciseProgression(exerciseId, days)

        if (!mounted) return

        if (dataPoints.length === 0) {
          setData({
            dataPoints: [],
            trend: { direction: 'stable', delta: 0, percentChange: 0 },
            hasWeightData: false
          })
          setError(null)
          setLoading(false)
          return
        }

        const hasWeightData = dataPoints.some(dp => dp.maxWeight !== undefined)
        const trend = calculateTrend(dataPoints, hasWeightData)

        setData({ dataPoints, trend, hasWeightData })
        setError(null)
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof APIError
              ? err
              : new APIError(
                  'UNKNOWN_ERROR',
                  'Failed to fetch exercise progression',
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
  }, [progressVersion, exerciseId, days])

  return { data, loading, error }
}

function calculateTrend(
  dataPoints: ProgressionDataPoint[],
  useWeight: boolean
): ProgressionTrend {
  if (dataPoints.length < 2) {
    return { direction: 'stable', delta: 0, percentChange: 0 }
  }

  // Compare first half average to second half average
  const midpoint = Math.floor(dataPoints.length / 2)
  const firstHalf = dataPoints.slice(0, midpoint)
  const secondHalf = dataPoints.slice(midpoint)

  const getValue = (dp: ProgressionDataPoint) =>
    useWeight && dp.maxWeight !== undefined ? dp.maxWeight : dp.reps

  const firstAvg =
    firstHalf.reduce((sum, dp) => sum + getValue(dp), 0) / firstHalf.length
  const secondAvg =
    secondHalf.reduce((sum, dp) => sum + getValue(dp), 0) / secondHalf.length

  const delta = secondAvg - firstAvg
  const percentChange = firstAvg > 0 ? (delta / firstAvg) * 100 : 0

  let direction: 'up' | 'down' | 'stable'
  if (percentChange > 5) {
    direction = 'up'
  } else if (percentChange < -5) {
    direction = 'down'
  } else {
    direction = 'stable'
  }

  return {
    direction,
    delta: Math.round(delta * 10) / 10,
    percentChange: Math.round(percentChange * 10) / 10
  }
}

/**
 * Hook to get list of exercises that have progression data
 *
 * Fetches from the API's progress endpoint and returns the exercisesWithData field.
 */
export function useExercisesWithProgression(): {
  exerciseIds: string[]
  loading: boolean
} {
  const { progressVersion } = useRefreshVersions()

  const [exerciseIds, setExerciseIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        if (!isAPIAvailable()) {
          if (mounted) {
            setExerciseIds([])
            setLoading(false)
          }
          return
        }

        const { fetchProgress } = await import('@/lib/api')
        const progress = await fetchProgress()

        if (mounted) {
          setExerciseIds(progress.exercisesWithData)
        }
      } catch {
        if (mounted) {
          setExerciseIds([])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [progressVersion])

  return { exerciseIds, loading }
}
