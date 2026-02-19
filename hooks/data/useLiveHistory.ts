/**
 * useLiveHistory - Hook for accessing workout history
 *
 * Fetches aggregated progress from the API and extracts recentActivity
 * entries. Optionally filters by workoutId (slug) when provided.
 * Replaces the old storage-based implementation.
 */

import { useRefreshVersions } from '@/context/DataContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { APIError, fetchProgress, isAPIAvailable } from '@/lib/api'
import { useCallback } from 'react'

export type HistoryEntry = {
  date: string
  workoutId: string
}

export function useLiveHistory(slug: string | undefined) {
  const { progressVersion } = useRefreshVersions()

  const fetcher = useCallback(async (): Promise<HistoryEntry[]> => {
    if (!isAPIAvailable()) {
      throw new APIError(
        'API_DISABLED',
        'API is not available or not configured'
      )
    }

    const apiProgress = await fetchProgress()

    // Extract recentActivity and optionally filter by slug (workoutId)
    const entries: HistoryEntry[] = apiProgress.recentActivity
      .filter(entry => !slug || entry.workoutId === slug)
      .map(entry => ({
        date: entry.date,
        workoutId: entry.workoutId
      }))

    // Sort by date descending
    return entries.sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    )
  }, [slug])

  const { data, loading, error } = useAsyncData(
    fetcher,
    [slug, progressVersion],
    { skip: !slug }
  )

  return { data, loading, error } as const
}
