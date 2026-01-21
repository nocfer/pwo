/**
 * useAllProgress - Hook for aggregating progress across all programs and challenges
 *
 * Provides overall statistics and recent activity timeline.
 */

import { useRefreshVersions } from '@/context/DataContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { storage } from '@/lib/storage'
import { getActivityDates } from '@/lib/utils/progress'
import type { ChallengeProgress, ProgramProgress } from '@/types'
import { useCallback, useMemo } from 'react'

export type AggregatedProgress = {
  totalWorkoutsCompleted: number
  totalTimeSpentSeconds: number
  totalRepsCompleted: number
  activeChallenges: number
  activePrograms: number
  currentStreak: number
  recentActivity: {
    date: string
    type: 'challenge' | 'program'
    id: string
    sessionIndex: number
  }[]
}

type AllProgressData = {
  programProgress: ProgramProgress[]
  challengeProgress: ChallengeProgress[]
}

export function useAllProgress(): {
  data: AggregatedProgress | null
  loading: boolean
  error: Error | null
} {
  const { progressVersion } = useRefreshVersions()

  const fetcher = useCallback(async (): Promise<AllProgressData> => {
    const [programProgress, challengeProgress] = await Promise.all([
      storage.loadAllProgramProgress(),
      storage.loadAllChallengeProgress()
    ])
    return { programProgress, challengeProgress }
  }, [])

  const {
    data: progressData,
    loading,
    error
  } = useAsyncData(fetcher, [progressVersion])

  const data = useMemo((): AggregatedProgress | null => {
    if (!progressData) return null

    const { programProgress, challengeProgress } = progressData

    let totalWorkoutsCompleted = 0
    let totalTimeSpentSeconds = 0
    let totalRepsCompleted = 0
    const recentActivity: AggregatedProgress['recentActivity'] = []

    // Process program progress
    programProgress.forEach(progress => {
      const workouts = progress.workouts ?? []
      const completedWorkouts = workouts.filter(w => w.completed)
      totalWorkoutsCompleted += completedWorkouts.length
      totalTimeSpentSeconds += completedWorkouts.reduce(
        (sum, w) => sum + (w.timeSpentSeconds || 0),
        0
      )

      completedWorkouts.forEach(workout => {
        if (workout.completedAt) {
          recentActivity.push({
            date: workout.completedAt,
            type: 'program',
            id: progress.programId,
            sessionIndex: 0 // workoutId is now used instead of sessionIndex
          })
        }
      })
    })

    // Process challenge progress
    challengeProgress.forEach(progress => {
      const completedWorkouts = progress.workouts.filter(w => w.completed)
      totalWorkoutsCompleted += completedWorkouts.length
      totalRepsCompleted += progress.totalRepsCompleted || 0

      completedWorkouts.forEach(workout => {
        if (workout.completedAt) {
          recentActivity.push({
            date: workout.completedAt,
            type: 'challenge',
            id: progress.challengeId,
            sessionIndex: 0 // workoutId is now used instead of sessionIndex
          })
        }
      })
    })

    // Sort recent activity by date (most recent first)
    recentActivity.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Calculate overall streak using activity dates
    let currentStreak = 0
    const activityDates = getActivityDates(
      recentActivity.map(a => ({ completedAt: a.date }))
    )
    const sortedDates = Array.from(activityDates).sort().reverse()

    if (sortedDates.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let checkDate = new Date(today)

      for (const dateStr of sortedDates) {
        const activityDate = new Date(dateStr)
        activityDate.setHours(0, 0, 0, 0)

        const daysDiff = Math.floor(
          (checkDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysDiff === 0 || (currentStreak === 0 && daysDiff <= 1)) {
          currentStreak++
          checkDate = new Date(activityDate)
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    // Count active programs/challenges based on recent activity (within last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

    const activePrograms = programProgress.filter(p => {
      const workouts = p.workouts ?? []
      const completedWorkouts = workouts.filter(w => w.completed)
      if (completedWorkouts.length === 0) return false
      // Consider active if there's been activity in the last 30 days
      return completedWorkouts.some(
        w => w.completedAt && w.completedAt >= thirtyDaysAgoISO
      )
    }).length

    const activeChallenges = challengeProgress.filter(c => {
      const completedWorkouts = c.workouts.filter(w => w.completed)
      if (completedWorkouts.length === 0) return false
      // Challenge is active if not fully completed and has recent activity
      const hasRecentActivity = completedWorkouts.some(
        w => w.completedAt && w.completedAt >= thirtyDaysAgoISO
      )
      // Also check if challenge is not fully completed (no completedAt on the challenge itself)
      return hasRecentActivity && !c.completedAt
    }).length

    return {
      totalWorkoutsCompleted,
      totalTimeSpentSeconds,
      totalRepsCompleted,
      activeChallenges,
      activePrograms,
      currentStreak,
      recentActivity: recentActivity.slice(0, 20)
    }
  }, [progressData])

  return { data, loading, error }
}
