/**
 * useSessionCompletion - Hook for tracking completed sessions
 *
 * TODO: The backend does not yet support per-program completed session tracking.
 * Currently derives completed session indices from the aggregated progress
 * recentActivity entries that match the program slug. Once the backend adds
 * a per-program completed sessions endpoint, this hook should be updated
 * to use it for accurate session-level tracking.
 */

import { useRefreshVersions } from '@/context/DataContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { APIError, fetchProgress, isAPIAvailable } from '@/lib/api'
import { useCallback } from 'react'

export function useSessionCompletion(slug: string | undefined) {
  const { completedVersion } = useRefreshVersions()

  const fetcher = useCallback(async (): Promise<Set<number>> => {
    if (!slug) return new Set()

    if (!isAPIAvailable()) {
      throw new APIError(
        'API_DISABLED',
        'API is not available or not configured'
      )
    }

    const progress = await fetchProgress()

    // Derive completed session indices from recentActivity entries matching this slug.
    // Each matching entry is treated as one completed session, numbered sequentially.
    const matchingEntries = progress.recentActivity.filter(
      entry => entry.workoutId === slug
    )

    const completedIndices = new Set<number>()
    for (let i = 0; i < matchingEntries.length; i++) {
      completedIndices.add(i + 1) // Session indices are 1-based
    }

    return completedIndices
  }, [slug])

  const { data, loading, error } = useAsyncData(
    fetcher,
    [slug, completedVersion],
    {
      skip: !slug,
      initialData: new Set<number>()
    }
  )

  return { completed: data ?? new Set<number>(), loading, error } as const
}
