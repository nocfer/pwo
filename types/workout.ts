/**
 * Workout Execution types for v1.2 state machine.
 *
 * These types define the contract for the new WorkoutExecutionContext
 * and are separate from the legacy session types in types/session.ts.
 */

export type SetStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'skipped'
  | 'editing'

export type ExerciseSetState = {
  reps: number
  weight: number
  status: SetStatus
  confirmedReps?: number
  confirmedWeight?: number
  /**
   * Target hold duration (seconds) for a timed set. Presence of this field is
   * what makes a set "timed" (see {@link isTimedSet}). Seeded from the program
   * target and adjustable via the stepper; unlike `reps` it is NOT overwritten
   * with the value actually performed — the seconds held land in
   * {@link confirmedDurationSeconds} so the target survives Add-set.
   */
  durationSeconds?: number
  /** Actual hold (seconds) held — committed on CONFIRM_SET, mirrors confirmedReps. */
  confirmedDurationSeconds?: number
  /** Rest after this set (ms). Falls back to ExerciseState.restDurationMs. */
  restDurationMs?: number
}

/** A set is timed (hold) rather than reps×weight when it carries a duration. */
export function isTimedSet(set: Pick<ExerciseSetState, 'durationSeconds'>): boolean {
  return set.durationSeconds != null
}

export type ExerciseState = {
  exerciseId: string
  exerciseName: string
  sets: ExerciseSetState[]
  /** Representative/default rest (ms) — used as fallback and for estimates. */
  restDurationMs?: number
}

/** A timed exercise: any set carries a hold duration. */
export function isTimedExercise(exercise: ExerciseState): boolean {
  return exercise.sets.some(isTimedSet)
}

/** Representative target hold (seconds) — the first timed set's target. */
export function timedTarget(exercise: ExerciseState): number {
  return exercise.sets.find(isTimedSet)?.durationSeconds ?? 0
}

/** Heaviest completed weight (lb) across an exercise's sets. */
export function topCompletedWeight(exercise: ExerciseState): number {
  return exercise.sets.reduce((max, s) => {
    if (s.status !== 'completed') return max
    const w = s.confirmedWeight ?? s.weight
    return w > max ? w : max
  }, 0)
}

/** Longest completed hold (seconds) across an exercise's sets. */
export function topCompletedHold(exercise: ExerciseState): number {
  return exercise.sets.reduce((max, s) => {
    if (s.status !== 'completed') return max
    const d = s.confirmedDurationSeconds ?? s.durationSeconds ?? 0
    return d > max ? d : max
  }, 0)
}

export type RestTimerState = {
  isActive: boolean
  startedAt: number
  durationMs: number
}

export type WorkoutState = {
  workoutId: string
  programSlug: string
  sessionIndex: number
  sessionName: string
  exercises: ExerciseState[]
  expandedExerciseIndex: number
  activeSetIndex: number
  restTimer: RestTimerState
  startedAt: number
  completedAt: number | null
  isCompleted: boolean
}

export type PrefillEntry = {
  exerciseId: string
  reps: number
  weight: number
}

export type PrefillData = PrefillEntry[]

export type PrefillMap = Map<string, { reps: number; weight: number }>

export type WorkoutAction =
  | { type: 'EXPAND_EXERCISE'; exerciseIndex: number; setIndex?: number }
  | {
      type: 'LOG_SET'
      exerciseIndex: number
      setIndex: number
      weight: number
      reps: number
    }
  | {
      type: 'LOG_DURATION'
      exerciseIndex: number
      setIndex: number
      durationSeconds: number
    }
  | {
      type: 'CONFIRM_SET'
      exerciseIndex: number
      setIndex: number
      /** Seconds actually held — committed to confirmedDurationSeconds (timed sets). */
      durationSeconds?: number
    }
  | { type: 'SKIP_SET'; exerciseIndex: number; setIndex: number }
  | { type: 'START_REST_TIMER'; durationMs: number; startedAt: number }
  | { type: 'DISMISS_REST_TIMER' }
  | { type: 'EDIT_SET'; exerciseIndex: number; setIndex: number }
  | { type: 'COMPLETE_WORKOUT'; completedAt: number }
  | { type: 'RESTORE_STATE'; state: WorkoutState }
  | { type: 'ADD_SET'; exerciseIndex: number }
  | { type: 'MOVE_EXERCISE'; from: number; to: number }
  | { type: 'EXTEND_REST'; now: number }
  | { type: 'UNLOG_SET'; exerciseIndex: number; setIndex: number }
  | { type: 'RESTORE_SET'; exerciseIndex: number; setIndex: number }
