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
}

export type ExerciseState = {
  exerciseId: string
  exerciseName: string
  sets: ExerciseSetState[]
  restDurationMs?: number
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
  | { type: 'CONFIRM_SET'; exerciseIndex: number; setIndex: number }
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
