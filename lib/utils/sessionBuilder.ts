import type {
  WorkoutLogExerciseInput,
  WorkoutLogInput,
  WorkoutLogSetInput
} from '@/lib/api'
import type { AccumulatedSet } from '@/types/session'

/**
 * Builds a WorkoutLogInput payload from accumulated session sets.
 *
 * Groups sets by exerciseId, preserves all set data (reps, weight, isBodyweight, timestamp),
 * and includes every accumulated set exactly once.
 */
export function buildWorkoutLog(
  slug: string,
  completedAt: string,
  timeSpentSeconds: number,
  accumulatedSets: AccumulatedSet[]
): WorkoutLogInput {
  // Group sets by exerciseId, preserving insertion order
  const grouped = new Map<string, AccumulatedSet[]>()
  for (const set of accumulatedSets) {
    const existing = grouped.get(set.exerciseId)
    if (existing) {
      existing.push(set)
    } else {
      grouped.set(set.exerciseId, [set])
    }
  }

  const exercises: WorkoutLogExerciseInput[] = Array.from(
    grouped.entries()
  ).map(([exerciseId, sets]) => {
    const mappedSets: WorkoutLogSetInput[] = sets.map(s => ({
      reps: s.reps,
      ...(s.weight !== undefined ? { weight: s.weight } : {}),
      isBodyweight: s.isBodyweight,
      timestamp: s.timestamp
    }))

    // lastCompletedAt is the latest timestamp among the exercise's sets
    const lastCompletedAt = sets.reduce(
      (latest, s) => (s.timestamp > latest ? s.timestamp : latest),
      sets[0].timestamp
    )

    return {
      exerciseId,
      sets: mappedSets,
      lastCompletedAt
    }
  })

  return {
    workoutId: slug,
    completedAt,
    timeSpentSeconds,
    exercises
  }
}
