/**
 * useAsyncData - Generic hook for async data loading with automatic cleanup
 *
 * Eliminates the repetitive useState/useEffect/mounted pattern
 * used throughout data hooks.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export type AsyncDataResult<T> = {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Generic hook for loading async data with proper cleanup
 *
 * @param fetcher - Async function that returns the data
 * @param deps - Dependencies that trigger a refetch when changed
 * @param options - Optional configuration
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  options?: {
    /** Initial data before first fetch */
    initialData?: T
    /** Skip fetching if true */
    skip?: boolean
  }
): AsyncDataResult<T> {
  const [data, setData] = useState<T | null>(options?.initialData ?? null)
  const [loading, setLoading] = useState(!options?.skip)
  const [error, setError] = useState<Error | null>(null)

  // Track if component is mounted
  const mountedRef = useRef(true)
  // Track current fetch to handle race conditions
  const fetchIdRef = useRef(0)

  const executeFetch = useCallback(async () => {
    if (options?.skip) {
      setLoading(false)
      return
    }

    const fetchId = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()

      // Only update if this is the latest fetch and component is still mounted
      if (mountedRef.current && fetchId === fetchIdRef.current) {
        setData(result)
      }
    } catch (e) {
      if (mountedRef.current && fetchId === fetchIdRef.current) {
        setError(e instanceof Error ? e : new Error(String(e)))
      }
    } finally {
      if (mountedRef.current && fetchId === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [fetcher, options?.skip])

  useEffect(() => {
    mountedRef.current = true
    executeFetch()

    return () => {
      mountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const refetch = useCallback(() => {
    executeFetch()
  }, [executeFetch])

  return { data, loading, error, refetch }
}

export default useAsyncData
