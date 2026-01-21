/**
 * useConsistencyData - Hook for loading workout consistency data for heatmap
 */

import { useRefreshVersions } from '@/context/DataContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { storage } from '@/lib/storage'
import { useCallback, useMemo } from 'react'

export type ConsistencyLevel = 0 | 1 | 2 | 3 // 0: none, 1: light, 2: medium, 3: high

export type DayData = {
  date: string
  workoutCount: number
  level: ConsistencyLevel
  isToday: boolean
  isFuture: boolean
}

export type WeekData = {
  weekNumber: number
  days: DayData[]
}

export type ConsistencyData = {
  weeks: WeekData[]
  totalWorkouts: number
  activeDays: number
  maxWorkoutsPerDay: number
}

/** Day labels for heatmap header */
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const

/** Get consistency level based on workout count */
function getConsistencyLevel(count: number): ConsistencyLevel {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  return 3
}

/** Format date in local timezone to avoid UTC conversion issues */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useConsistencyData(weeks: number = 12): {
  data: ConsistencyData | null
  loading: boolean
  error: Error | null
} {
  const { progressVersion } = useRefreshVersions()

  const fetcher = useCallback(async (): Promise<ConsistencyData> => {
    const workoutCounts = await storage.getConsistencyData(weeks)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = formatLocalDate(today)

    // Get the start of the current week (Monday)
    const currentWeekStart = storage.getWeekStart(today)

    // Generate weeks data
    const weeksData: WeekData[] = []
    let totalWorkouts = 0
    let activeDays = 0
    let maxWorkoutsPerDay = 0

    for (let w = weeks - 1; w >= 0; w--) {
      const weekStart = new Date(currentWeekStart)
      weekStart.setDate(weekStart.getDate() - w * 7)

      const days: DayData[] = []
      let hasPastData = false

      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(weekStart)
        dayDate.setDate(dayDate.getDate() + d)
        const dateISO = formatLocalDate(dayDate)

        const workoutCount = workoutCounts.get(dateISO) ?? 0
        const isToday = dateISO === todayISO
        const isFuture = dayDate > today

        if (!isFuture) {
          hasPastData = true
        }

        if (workoutCount > 0 && !isFuture) {
          totalWorkouts += workoutCount
          activeDays++
          maxWorkoutsPerDay = Math.max(maxWorkoutsPerDay, workoutCount)
        }

        days.push({
          date: dateISO,
          workoutCount,
          level: isFuture ? 0 : getConsistencyLevel(workoutCount),
          isToday,
          isFuture
        })
      }

      // Only include weeks that have at least one day in the past
      // This prevents showing too many future-only weeks
      if (hasPastData) {
        weeksData.push({
          weekNumber: weeks - w,
          days
        })
      }
    }

    return {
      weeks: weeksData,
      totalWorkouts,
      activeDays,
      maxWorkoutsPerDay
    }
  }, [weeks])

  const { data, loading, error } = useAsyncData(fetcher, [
    progressVersion,
    weeks
  ])

  return { data, loading, error }
}

/**
 * Get day labels for heatmap header
 */
export function getDayLabels(): readonly string[] {
  return DAY_LABELS
}

/**
 * Calculate consistency percentage (active days / total days)
 */
export function useConsistencyPercentage(weeks: number = 12): {
  percentage: number
  loading: boolean
} {
  const { data, loading } = useConsistencyData(weeks)

  const percentage = useMemo(() => {
    if (!data) return 0
    const totalDays = weeks * 7
    return Math.round((data.activeDays / totalDays) * 100)
  }, [data, weeks])

  return { percentage, loading }
}
