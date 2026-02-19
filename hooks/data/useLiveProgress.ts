/**
 * useLiveProgress - Hook for accessing live progress/streak data
 *
 * Fetches aggregated progress from the API and derives a 7-day streak array
 * from recentActivity. Replaces the old storage-based implementation.
 */

import { useRefreshVersions } from '@/context/DataContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { APIError, fetchProgress, isAPIAvailable } from '@/lib/api'
import { getMondayBasedDayIndex, getWeekStart } from '@/lib/utils/date'
import { useCallback } from 'react'

export type LiveProgress = {
  slug: string
  streak: number[]
}

/**
 * Build a 7-element streak array (Mon=0 … Sun=6) from recentActivity dates.
 * Each element is the count of workouts on that day of the current week.
 */
function buildStreakFromActivity(
  recentActivity: { date: string; workoutId: string }[]
): number[] {
  const streak = [0, 0, 0, 0, 0, 0, 0]
  const today = new Date()
  const weekStart = getWeekStart(today)

  for (const entry of recentActivity) {
    const entryDate = new Date(entry.date)
    // Only count entries from the current week
    if (entryDate >= weekStart && entryDate <= today) {
      const dayIndex = getMondayBasedDayIndex(entryDate)
      streak[dayIndex]++
    }
  }

  return streak
}

export function useLiveProgress(slug: string | undefined) {
  const { progressVersion } = useRefreshVersions()

  const fetcher = useCallback(async (): Promise<LiveProgress> => {
    if (!isAPIAvailable()) {
      throw new APIError(
        'API_DISABLED',
        'API is not available or not configured'
      )
    }

    const apiProgress = await fetchProgress()
    const streak = buildStreakFromActivity(apiProgress.recentActivity)

    return {
      slug: slug!,
      streak
    }
  }, [slug])

  const { data, loading, error } = useAsyncData(
    fetcher,
    [slug, progressVersion],
    { skip: !slug }
  )

  return { data, loading, error } as const
}
