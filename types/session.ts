/**
 * Session and Program type definitions
 */

/**
 * Session type used by the existing Challenge flow.
 */
export type Session = {
  index: number // 1-based
  totalReps: number
  sets: number[] // length = program.exercise.sets
}

export type SessionPhase = 'warmup' | 'working' | 'break' | 'done'

/**
 * Represents a single completed set during a workout session.
 * Accumulated in memory and sent to the API when the session completes.
 */
export interface AccumulatedSet {
  exerciseId: string
  reps: number
  weight?: number
  isBodyweight: boolean
  timestamp: string // ISO datetime
}
