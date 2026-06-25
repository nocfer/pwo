import type { Program } from '@/types'
import type { ExerciseState, SetStatus, WorkoutState , PrefillMap } from '@/types/workout'

function resolveSetValues(
  block: Program['blocks'][number],
  setIndex: number,
  prefillMap?: PrefillMap
): { reps: number; weight: number } {
  const prefill =
    block.type === 'exercise' ? prefillMap?.get(block.exerciseId) : undefined

  if (prefill) {
    return { reps: prefill.reps, weight: prefill.weight }
  }

  if (block.type !== 'exercise') return { reps: 0, weight: 0 }

  const { targetReps } = block
  let reps = 0
  if (typeof targetReps === 'number') {
    reps = targetReps
  } else if (Array.isArray(targetReps) && targetReps.length > 0) {
    reps = targetReps[setIndex] ?? targetReps[targetReps.length - 1]
  }
  return { reps, weight: 0 }
}

/** Rest after a given set (ms). Mirrors per-set reps resolution. */
function resolveSetRestMs(
  block: Program['blocks'][number],
  setIndex: number
): number {
  const rest = block.type === 'exercise' ? block.restBetweenSets : undefined
  if (typeof rest === 'number') return rest * 1000
  if (Array.isArray(rest) && rest.length > 0) {
    return (rest[setIndex] ?? rest[rest.length - 1]) * 1000
  }
  return 60_000
}

export function buildInitialState(
  program: Program,
  sessionIndex: number,
  exerciseNameById: Map<string, string>,
  prefillMap?: PrefillMap
): WorkoutState {
  const exercises: ExerciseState[] = program.blocks
    .filter(block => block.type === 'exercise')
    .map(block => ({
      exerciseId: block.exerciseId,
      exerciseName:
        block.exerciseName ??
        exerciseNameById.get(block.exerciseId) ??
        block.exerciseId,
      restDurationMs: resolveSetRestMs(block, 0),
      sets: Array.from({ length: block.sets ?? 1 }, (_, i) => ({
        ...resolveSetValues(block, i, prefillMap),
        // Timed blocks seed each set's target hold (seconds); reps/weight stay 0.
        ...(block.type === 'exercise' && block.durationSeconds != null
          ? { durationSeconds: block.durationSeconds }
          : {}),
        restDurationMs: resolveSetRestMs(block, i),
        status: 'pending' as SetStatus
      }))
    }))

  if (exercises.length > 0 && exercises[0].sets.length > 0) {
    exercises[0].sets[0].status = 'active'
  }

  return {
    workoutId: `${program.id}_${sessionIndex}_${Date.now()}`,
    programSlug: program.id,
    sessionIndex,
    sessionName: program.name,
    exercises,
    expandedExerciseIndex: 0,
    activeSetIndex: 0,
    restTimer: { isActive: false, startedAt: 0, durationMs: 0 },
    startedAt: Date.now(),
    completedAt: null,
    isCompleted: false
  }
}
