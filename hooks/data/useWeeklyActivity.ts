/**
 * useWeeklyActivity - Hook for weekly activity data
 *
 * Fetches weekly stats from the API and maps the response to a
 * day-of-week activity array (7 elements, 0 or 1 per day).
 *
 * Since the APIWeeklyStats endpoint provides aggregate counts rather than
 * per-day breakdown, we use the consistency endpoint to derive per-day
 * activity for the current week.
 */

import { useRefreshVersions } from '@/context/DataContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { APIError, fetchConsistency, isAPIAvailable } from '@/lib/api'
import { useCallback } from 'react'

/**
 * Map consistency entries for the current week into a 7-element activity array.
 * Index 0 = Monday, index 6 = Sunday (ISO week).
 */
function buildWeeklyActivity(
  entries: { date: string; workoutCount: number }[]
): number[] {
  const activity = [0, 0, 0, 0, 0, 0, 0]

  for (const entry of entries) {
    if (entry.workoutCount > 0) {
      // Parse the date and get the day of week (Monday=0 .. Sunday=6)
      const date = new Date(entry.date + 'T00:00:00')
      const jsDay = date.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
      const mondayIndex = jsDay === 0 ? 6 : jsDay - 1
      activity[mondayIndex] = 1
    }
  }

  return activity
}

export function useWeeklyActivity() {
  const { progressVersion } = useRefreshVersions()

  const fetcher = useCallback(async (): Promise<number[]> => {
    if (!isAPIAvailable()) {
      throw new APIError(
        'API_DISABLED',
        'API is not available or not configured'
      )
    }

    // Fetch 1 week of consistency data to get per-day activity
    const entries = await fetchConsistency(1)
    return buildWeeklyActivity(entries)
  }, [])

  const { data, loading, error } = useAsyncData(fetcher, [progressVersion], {
    initialData: [0, 0, 0, 0, 0, 0, 0]
  })

  return { data: data ?? [0, 0, 0, 0, 0, 0, 0], loading, error }
}
