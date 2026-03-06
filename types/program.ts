/**
 * Training Program model
 */

export type ProgramSource = 'builtin' | 'user' | 'pt'

export type ProgramExerciseBlock = {
  type: 'exercise'
  exerciseId: string
  /**
   * Optional rep target for the exercise.
   * Can be a single number (same reps for all sets) or an array (per-set targets).
   * If omitted, the step is self-guided (user does their reps).
   * @example targetReps: 12 // 12 reps for all sets
   * @example targetReps: [12, 10, 8] // 12 reps for set 1, 10 for set 2, 8 for set 3
   */
  targetReps?: number | number[]
  /**
   * Optional timed work (seconds). If set, the runner will start a timer.
   */
  durationSeconds?: number
  /**
   * Optional short note (e.g. form cue, load).
   */
  note?: string
  /**
   * Number of sets for this exercise block (defaults to 1).
   */
  sets?: number
  /**
   * Rest duration in seconds between consecutive sets (defaults to 60).
   */
  restBetweenSets?: number
}

export type ProgramBlock = ProgramExerciseBlock

export type ProgramSession = {
  index: number // 1-based
  name?: string
  blocks: ProgramBlock[]
}

export type ChallengeConfig = {
  exerciseId: string
  sets: number
  initialReps?: number
  targetReps: number
  warmUpSeconds: number
  breakSeconds: number
  /**
   * Weekly increase percentage for rep progression (default: 10%).
   * Each week increases total reps by this percentage.
   */
  weeklyIncreasePercent?: number
}

export type Program = {
  id: string
  name: string
  description?: string
  blocks: ProgramBlock[]
  createdAt: string // ISO
  updatedAt: string // ISO
  source: ProgramSource
  /**
   * If present, this program is a challenge that generates blocks dynamically.
   * Blocks will be generated from 20 reps to targetReps, with configurable
   * percentage increase per session (default: 10%).
   */
  challengeConfig?: ChallengeConfig
  /**
   * Optional initial warmup configuration for the program.
   * When configured, displays as a distinct warmup block at the start.
   */
  initialWarmup?: {
    seconds: number
  }
  /**
   * Default rest duration in seconds between different exercises.
   * Applied when transitioning between exercises unless overridden.
   * Defaults to 60 seconds if not specified.
   */
  defaultRestBetweenExercises?: number
}
