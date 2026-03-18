import type { Program } from '@/types'
import type { ExerciseState, SetStatus, WorkoutState } from '@/types/workout'
import type { PrefillMap } from '@/types/workout'

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
      exerciseName: exerciseNameById.get(block.exerciseId) ?? block.exerciseId,
      restDurationMs: (block.restBetweenSets ?? 60) * 1000,
      sets: Array.from({ length: block.sets ?? 1 }, (_, i) => ({
        ...resolveSetValues(block, i, prefillMap),
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
