/**
 * Progress tracking type definitions
 * Simplified structure without sessions - programs are tracked as individual workout completions
 */

/**
 * Individual set record with optional weight tracking
 */
export type SetRecord = {
  reps: number
  weight?: number // kg or lbs (undefined for bodyweight)
  isBodyweight: boolean
  timestamp: string // ISO date
}

/**
 * Exercise-level progress tracking
 */
export type ExerciseProgress = {
  exerciseId: string
  repsCompleted: number
  setsCompleted: number
  sets?: SetRecord[] // Detailed per-set tracking
  totalVolume?: number // weight x reps (for weighted exercises)
  lastCompletedAt: string // ISO date
}

/**
 * Personal Record type
 */
export type PersonalRecordType =
  | 'max_weight'
  | 'max_reps'
  | 'max_volume'
  | 'estimated_1rm'

/**
 * Personal Record entry
 */
export type PersonalRecord = {
  id: string // Unique PR identifier
  exerciseId: string
  type: PersonalRecordType
  value: number
  achievedAt: string // ISO date
  workoutId?: string // Reference to the workout where PR was achieved
  details?: {
    weight?: number
    reps?: number
  }
}

/**
 * PR history for an exercise
 */
export type PRHistory = {
  exerciseId: string
  records: PersonalRecord[] // Historical PRs for trends
}

/**
 * Weekly stats aggregation
 */
export type WeeklyStats = {
  weekStart: string // ISO date (Monday)
  weekEnd: string // ISO date (Sunday)
  workoutsCompleted: number
  workoutGoal: number // Target workouts per week (default: 4)
  totalTimeSeconds: number
  totalVolume: number // Sum of (weight x reps) for weighted exercises
  totalReps: number // Sum of all reps (bodyweight + weighted)
  exercisesPerformed: string[] // Unique exercise IDs
  currentStreak: number // Consecutive days with workouts ending in this week
}

/**
 * Single workout completion (replaces SessionProgress)
 */
export type WorkoutProgress = {
  workoutId: string // Unique identifier for this workout instance
  programId: string // Which program was completed
  completed: boolean
  completedAt?: string // ISO date
  timeSpentSeconds?: number // Duration of the workout
  exercises: ExerciseProgress[] // Exercise-level progress for this workout
}

/**
 * Program-level progress tracking (simplified)
 * Each program completion is tracked as a separate workout
 */
export type ProgramProgress = {
  programId: string
  workouts: WorkoutProgress[] // All completed workouts for this program
  lifetimeWorkoutsCompleted: number
  lifetimeTimeSpentSeconds: number
  lastActivityAt: string | null // ISO date of last workout completion
  updatedAt: string // ISO date of last update
}

/**
 * Challenge-specific progress tracking (simplified)
 * Challenges generate dynamic workouts based on progression
 */
export type ChallengeProgress = {
  challengeId: string
  startedAt: string // ISO date
  completedAt?: string // ISO date
  workouts: WorkoutProgress[] // Progress for each generated workout
  totalRepsCompleted: number // Total reps across all workouts
  targetReps: number // Target reps from challenge config
  lastActivityAt: string // ISO date of last workout completion
  updatedAt: string // ISO date of last update
}

/**
 * Historical snapshot for charts and trends
 */
export type ProgressHistoryEntry = {
  date: string // ISO date
  programId?: string // For program progress
  challengeId?: string // For challenge progress
  workoutsCompleted: number
  totalReps?: number // For challenges
  timeSpentSeconds?: number // For programs
}

export type ProgressHistory = ProgressHistoryEntry[]
