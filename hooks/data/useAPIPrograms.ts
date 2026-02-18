/**
 * useAPIPrograms - Hook for fetching programs from API
 *
 * Fetches workouts from the backend API and converts them to frontend
 * Program format using the workout mapper. Follows the same pattern
 * as useAPIExercises.
 *
 * Note: The DataContext already integrates API fetching automatically,
 * so you typically don't need to use this hook directly. Use usePrograms()
 * from the DataContext instead.
 */

import { APIError, fetchWorkouts, isAPIAvailable } from '@/lib/api'
import { workoutToProgram } from '@/lib/mappers/workout'
import type { Program } from '@/types'
import { useEffect, useState } from 'react'

export interface UseAPIProgramsState {
  data: Program[]
  loading: boolean
  error: APIError | null
  isAPIAvailable: boolean
}

export function useAPIPrograms(): UseAPIProgramsState {
  const [data, setData] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<APIError | null>(null)

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

        const workouts = await fetchWorkouts()
        if (mounted) {
          setData(workouts.map(workoutToProgram))
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof APIError
              ? err
              : new APIError(
                  'UNKNOWN_ERROR',
                  'Failed to fetch programs',
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
  }, [])

  return {
    data,
    loading,
    error,
    isAPIAvailable: isAPIAvailable()
  }
}
