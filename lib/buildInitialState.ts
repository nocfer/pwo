import type { Program } from '@/types'
import type { ExerciseState, SetStatus, WorkoutState } from '@/types/workout'

export function buildInitialState(
  program: Program,
  sessionIndex: number,
  exerciseNameById: Map<string, string>
): WorkoutState {
  const exercises: ExerciseState[] = program.blocks
    .filter(block => block.type === 'exercise')
    .map(block => ({
      exerciseId: block.exerciseId,
      exerciseName: exerciseNameById.get(block.exerciseId) ?? block.exerciseId,
      sets: Array.from({ length: block.sets ?? 1 }, () => ({
        reps:
          typeof block.targetReps === 'number'
            ? block.targetReps
            : Array.isArray(block.targetReps) && block.targetReps.length > 0
              ? block.targetReps[0]
              : 0,
        weight: 0,
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
