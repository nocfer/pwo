/**
 * useAPIExercises - Hook for fetching exercises from API
 *
 * This hook demonstrates how to use the API SDK to fetch exercises
 * with proper error handling and loading states.
 *
 * Note: The DataContext already integrates API fetching automatically,
 * so you typically don't need to use this hook directly. Use useExercises()
 * from the DataContext instead.
 */

import { APIError, fetchExercises, isAPIAvailable } from '@/lib/api'
import type { Exercise } from '@/types'
import { useEffect, useState } from 'react'

export interface UseAPIExercisesState {
  data: Exercise[]
  loading: boolean
  error: APIError | null
  isAPIAvailable: boolean
}

export function useAPIExercises(): UseAPIExercisesState {
  const [data, setData] = useState<Exercise[]>([])
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

        const response = await fetchExercises(1)
        if (mounted) {
          setData(response.data)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof APIError
              ? err
              : new APIError(
                  'UNKNOWN_ERROR',
                  'Failed to fetch exercises',
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
