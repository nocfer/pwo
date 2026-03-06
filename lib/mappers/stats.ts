/**
 * Stats Mapper — pure functions for converting API response shapes to frontend types.
 *
 * Handles field differences between the backend Stats API and the frontend:
 * - PR: drops userId and isCurrent
 * - Progress: maps activeWorkouts as single field, recentActivity as-is
 * - WeeklyStats: all shared fields mapped directly
 * - Consistency: converts entry array to Map<date, workoutCount>
 */

import type { AggregatedProgress } from '@/hooks/data/useAllProgress'
import type {
  APIPR,
  APIProgress,
  APIWeeklyStats,
  ConsistencyEntry
} from '@/lib/api'
import type { PersonalRecord, WeeklyStats } from '@/types'

// ─── Mapper Functions ────────────────────────────────────────────────────────

/** Convert API PR to frontend PersonalRecord (drops userId, isCurrent) */
export function mapPR(apiPR: APIPR): PersonalRecord {
  const pr: PersonalRecord = {
    id: apiPR.id,
    exerciseId: apiPR.exerciseId,
    type: apiPR.type,
    value: apiPR.value,
    achievedAt: apiPR.achievedAt
  }

  if (apiPR.workoutId !== undefined) {
    pr.workoutId = apiPR.workoutId
  }

  if (apiPR.details !== undefined) {
    pr.details = apiPR.details
  }

  return pr
}

/** Convert API progress to frontend AggregatedProgress */
export function mapProgress(apiProgress: APIProgress): AggregatedProgress {
  return {
    totalWorkoutsCompleted: apiProgress.totalWorkoutsCompleted,
    totalTimeSpentSeconds: apiProgress.totalTimeSpentSeconds,
    totalRepsCompleted: apiProgress.totalRepsCompleted,
    activeWorkouts: apiProgress.activeWorkouts,
    currentStreak: apiProgress.currentStreak,
    recentActivity: apiProgress.recentActivity.map(entry => ({
      date: entry.date,
      workoutId: entry.workoutId
    })),
    exercisesWithData: [...apiProgress.exercisesWithData]
  }
}

/** Convert API weekly stats to frontend WeeklyStats */
export function mapWeeklyStats(apiWeekly: APIWeeklyStats): WeeklyStats {
  return {
    weekStart: apiWeekly.weekStart,
    weekEnd: apiWeekly.weekEnd,
    workoutsCompleted: apiWeekly.workoutsCompleted,
    workoutGoal: apiWeekly.workoutGoal,
    totalTimeSeconds: apiWeekly.totalTimeSeconds,
    totalVolume: apiWeekly.totalVolume,
    totalReps: apiWeekly.totalReps,
    exercisesPerformed: [...apiWeekly.exercisesPerformed],
    currentStreak: apiWeekly.currentStreak
  }
}

/** Convert consistency entries to Map<date, workoutCount> (only entries with count >= 1) */
export function mapConsistencyEntries(
  entries: ConsistencyEntry[]
): Map<string, number> {
  const map = new Map<string, number>()
  for (const entry of entries) {
    if (entry.workoutCount >= 1) {
      map.set(entry.date, entry.workoutCount)
    }
  }
  return map
}
