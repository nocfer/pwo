/**
 * Shared derivation of the "active" part of a WorkoutState — the current
 * exercise/set and rest-timer status. Single source of truth for every surface
 * that presents an in-progress workout (mini-bar, Live Activity, notification),
 * so they never disagree about which set is active or whether we're resting.
 */

import type {
  ExerciseSetState,
  ExerciseState,
  WorkoutState
} from '@/types/workout'

export type ActiveWorkoutView = {
  exercise: ExerciseState
  set: ExerciseSetState | undefined
  /** 1-based index of the active set within its exercise. */
  setNumber: number
  setCount: number
  /** Epoch ms when the current rest ends; 0 when not resting. */
  restEndsAtMs: number
  /** True only while a rest timer is active AND still has time left at `now`. */
  isResting: boolean
}

export function selectActiveWorkout(
  state: WorkoutState,
  now: number
): ActiveWorkoutView | null {
  const exercise = state.exercises[state.expandedExerciseIndex]
  if (!exercise) return null

  const { restTimer } = state
  const restEndsAtMs = restTimer.isActive
    ? restTimer.startedAt + restTimer.durationMs
    : 0

  return {
    exercise,
    set: exercise.sets[state.activeSetIndex],
    setNumber: state.activeSetIndex + 1,
    setCount: exercise.sets.length,
    restEndsAtMs,
    // A rest timer can run out while the session screen (which dismisses it) is
    // unmounted, so treat expired-but-active as no longer resting.
    isResting: restTimer.isActive && restEndsAtMs > now
  }
}

/** Fraction of sets completed across the whole workout, 0..1. Matches the
 * session screen's overall progress bar (completed only, not skipped). */
export function workoutProgress(state: WorkoutState): number {
  let completed = 0
  let total = 0
  for (const ex of state.exercises) {
    for (const set of ex.sets) {
      total += 1
      if (set.status === 'completed') completed += 1
    }
  }
  return total > 0 ? completed / total : 0
}
