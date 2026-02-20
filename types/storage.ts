/**
 * Storage-related type definitions
 */

export type SessionState = {
  slug: string
  sessionIndex: number
  phase: 'warmup' | 'working' | 'break' | 'done'
  currentSet: number
  timer: number
  isPaused: boolean
  warmupDone: boolean
  sessionElapsedSeconds: number // Total elapsed time for the session
}

export type EventRecord = {
  ts: string
  slug: string
  sessionIndex: number
  type:
    | 'warmup_started'
    | 'warmup_paused'
    | 'warmup_resumed'
    | 'warmup_skipped'
    | 'warmup_completed'
    | 'set_completed'
    | 'set_skipped'
    | 'break_started'
    | 'break_paused'
    | 'break_resumed'
    | 'break_skipped'
    | 'break_completed'
    | 'session_completed'
    | 'step_jumped_to'
    | 'step_repeated'
  data?: Record<string, unknown>
}

/**
 * Status of a single step in the workout
 */
export type StepStatus = 'pending' | 'completed' | 'skipped'

/**
 * Record of a single step completion attempt
 */
export type StepCompletionAttempt = {
  /** Actual reps performed (for exercise steps) */
  actualReps?: number
  /** Timestamp when this attempt was completed */
  timestamp: string
}

/**
 * Completion record for a single workout step
 * Tracks status and all completion attempts (supports repeats)
 */
export type StepCompletionRecord = {
  /** Index of the step in the workout steps array */
  stepIndex: number
  /** Current status of the step */
  status: StepStatus
  /** All completion attempts for this step (multiple if repeated) */
  completions: StepCompletionAttempt[]
}

/**
 * Full completion state for a workout session
 * Maps step indices to their completion records
 */
export type StepCompletionState = {
  /** Program slug */
  slug: string
  /** Session index (1-based) */
  sessionIndex: number
  /** Completion records keyed by step index */
  steps: Record<number, StepCompletionRecord>
  /** Total steps in the workout */
  totalSteps: number
}
