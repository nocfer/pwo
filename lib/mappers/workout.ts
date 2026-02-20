/**
 * Bidirectional mapper between backend Workout API model and frontend Program model.
 *
 * The backend uses "workouts" with array-based reps/rests/durations per block,
 * while the frontend uses "programs" with scalar values and a sets count.
 */

import type { ChallengeConfig, Program, ProgramBlock } from '@/types'

// ─── API Types ───────────────────────────────────────────────────────────────

/** Expanded exercise object (from ?expand=blocks.exercise) */
export interface APIExercise {
  id: string
  name: string
  source: string
  createdAt: string
  updatedAt: string
  category?: string
  icon?: string
  createdBy?: string
}

export interface APIWorkoutBlock {
  exerciseId: string
  reps: number[]
  rests: number[]
  durations: number[] // Always present in API response (e.g. [0])
  note?: string
  exercise?: APIExercise // Present when using ?expand=blocks.exercise
}

export interface APIWorkout {
  id: string
  name: string
  description?: string
  blocks: APIWorkoutBlock[]
  source: 'builtin' | 'user' | 'pt'
  initialWarmup: number
  defaultRestBetweenExercises: number
  createdBy?: string | Record<string, unknown>
  createdAt: string
  updatedAt: string
  deletedAt?: string
  challengeConfig?: Record<string, unknown>
}

/** Create/update input — only fields the backend accepts */
export type APIWorkoutCreateInput = {
  name: string
  description?: string
  blocks: Omit<APIWorkoutBlock, 'exercise'>[]
  initialWarmup: number
  defaultRestBetweenExercises: number
}

// ─── API → Frontend ──────────────────────────────────────────────────────────

/**
 * Convert an API workout block to a frontend ProgramBlock.
 *
 * - reps[] → targetReps: single-element → number, multi-element → array, empty → undefined
 * - reps.length → sets (default 1)
 * - rests[0] → restBetweenSets (default 60)
 * - durations → durationSeconds: first non-zero element, or undefined if all zeros/empty
 * - type is always 'exercise'
 * - expanded exercise field is stripped
 */
export function workoutBlockToProgram(block: APIWorkoutBlock): ProgramBlock {
  const { reps, rests, durations, exerciseId, note } = block

  // Derive sets from reps length, default 1
  const sets = reps.length > 0 ? reps.length : 1

  // Derive targetReps
  let targetReps: number | number[] | undefined
  if (reps.length === 1) {
    targetReps = reps[0]
  } else if (reps.length > 1) {
    targetReps = [...reps]
  }
  // else: undefined (empty reps)

  // Derive restBetweenSets from first element, default 60
  const restBetweenSets = rests.length > 0 ? rests[0] : 60

  // Derive durationSeconds: first non-zero element, or undefined
  let durationSeconds: number | undefined
  if (durations && durations.length > 0) {
    const firstNonZero = durations.find(d => d !== 0)
    durationSeconds = firstNonZero ?? undefined
  }

  const result: ProgramBlock = {
    type: 'exercise',
    exerciseId,
    sets,
    restBetweenSets
  }

  if (targetReps !== undefined) {
    result.targetReps = targetReps
  }
  if (durationSeconds !== undefined) {
    result.durationSeconds = durationSeconds
  }
  if (note !== undefined) {
    result.note = note
  }

  return result
}

/**
 * Convert a full API Workout to a frontend Program.
 *
 * - initialWarmup (number) → initialWarmup ({ seconds }) — 0 maps to undefined
 * - challengeConfig passed through if present (cast to ChallengeConfig)
 * - createdBy, deletedAt are dropped
 */
export function workoutToProgram(workout: APIWorkout): Program {
  const program: Program = {
    id: workout.id,
    name: workout.name,
    blocks: workout.blocks.map(workoutBlockToProgram),
    source: workout.source,
    createdAt: workout.createdAt,
    updatedAt: workout.updatedAt,
    defaultRestBetweenExercises: workout.defaultRestBetweenExercises
  }

  if (workout.description !== undefined) {
    program.description = workout.description
  }

  // initialWarmup: 0 → undefined, non-zero → { seconds }
  if (workout.initialWarmup > 0) {
    program.initialWarmup = { seconds: workout.initialWarmup }
  }

  // Forward-compatible challengeConfig passthrough
  if (workout.challengeConfig !== undefined) {
    program.challengeConfig = workout.challengeConfig as ChallengeConfig
  }

  return program
}

// ─── Frontend → API ──────────────────────────────────────────────────────────

/**
 * Convert a frontend ProgramBlock to an API workout block (without expanded exercise).
 *
 * - targetReps → reps[]: number expanded to array of length sets, array as-is, undefined → []
 * - restBetweenSets → rests[]: array of length max(0, sets-1) filled with restBetweenSets
 * - durationSeconds → durations[]: expanded to array of length sets if defined, [] if undefined
 */
export function programBlockToWorkout(
  block: ProgramBlock
): Omit<APIWorkoutBlock, 'exercise'> {
  const sets = block.sets ?? 1
  const restBetweenSets = block.restBetweenSets ?? 60

  // Build reps array
  let reps: number[]
  if (block.targetReps === undefined) {
    reps = []
  } else if (typeof block.targetReps === 'number') {
    reps = Array(sets).fill(block.targetReps)
  } else {
    reps = [...block.targetReps]
  }

  // Build rests array: length max(0, sets - 1)
  const restsLength = Math.max(0, sets - 1)
  const rests = Array(restsLength).fill(restBetweenSets)

  // Build durations array
  let durations: number[]
  if (block.durationSeconds !== undefined) {
    durations = Array(sets).fill(block.durationSeconds)
  } else {
    durations = []
  }

  const result: Omit<APIWorkoutBlock, 'exercise'> = {
    exerciseId: block.exerciseId,
    reps,
    rests,
    durations
  }

  if (block.note !== undefined) {
    result.note = block.note
  }

  return result
}

/**
 * Convert a frontend Program to an API create/update input.
 *
 * Only includes fields the backend accepts:
 * name, description, blocks, initialWarmup, defaultRestBetweenExercises
 *
 * Excludes: id, source, challengeConfig, createdBy, createdAt, updatedAt, deletedAt
 */
export function programToWorkoutInput(program: Program): APIWorkoutCreateInput {
  const input: APIWorkoutCreateInput = {
    name: program.name,
    blocks: program.blocks.map(programBlockToWorkout),
    initialWarmup: program.initialWarmup?.seconds ?? 0,
    defaultRestBetweenExercises: program.defaultRestBetweenExercises ?? 60
  }

  if (program.description !== undefined) {
    input.description = program.description
  }

  return input
}
