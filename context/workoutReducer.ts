/**
 * Pure reducer and helpers for the WorkoutExecution state machine.
 */

import type {
  ExerciseState,
  WorkoutAction,
  WorkoutState
} from '@/types/workout'

// ---------------------------------------------------------------------------
// Forward-scan helper (pure)
// ---------------------------------------------------------------------------

export function findNextPendingSet(
  exercises: ExerciseState[],
  currentExerciseIndex: number,
  currentSetIndex: number
): { exerciseIndex: number; setIndex: number } | null {
  const total = exercises.length
  if (total === 0) return null

  // 1. Check remaining sets in the current exercise
  const currentSets = exercises[currentExerciseIndex].sets
  for (let s = currentSetIndex + 1; s < currentSets.length; s++) {
    if (currentSets[s].status === 'pending') {
      return { exerciseIndex: currentExerciseIndex, setIndex: s }
    }
  }

  // 2. Forward scan through subsequent exercises, wrapping around
  for (let offset = 1; offset < total; offset++) {
    const eIdx = (currentExerciseIndex + offset) % total
    const sets = exercises[eIdx].sets
    for (let s = 0; s < sets.length; s++) {
      if (sets[s].status === 'pending') {
        return { exerciseIndex: eIdx, setIndex: s }
      }
    }
  }

  // 3. Check sets before currentSetIndex in the current exercise (full wrap)
  for (let s = 0; s <= currentSetIndex; s++) {
    if (currentSets[s].status === 'pending') {
      return { exerciseIndex: currentExerciseIndex, setIndex: s }
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Activate a specific or first-pending set in an exercise (pure)
// ---------------------------------------------------------------------------

function activateInExercise(
  ex: ExerciseState,
  targetSetIndex?: number
): ExerciseState {
  if (targetSetIndex !== undefined) {
    const target = ex.sets[targetSetIndex]
    if (!target || target.status !== 'pending') return ex
    return {
      ...ex,
      sets: ex.sets.map((s, i) =>
        i === targetSetIndex ? { ...s, status: 'active' as const } : s
      )
    }
  }
  let activated = false
  return {
    ...ex,
    sets: ex.sets.map(s => {
      if (!activated && s.status === 'pending') {
        activated = true
        return { ...s, status: 'active' as const }
      }
      return s
    })
  }
}

// ---------------------------------------------------------------------------
// Reducer (pure function)
// ---------------------------------------------------------------------------

export function workoutReducer(
  state: WorkoutState,
  action: WorkoutAction
): WorkoutState {
  switch (action.type) {
    case 'EXPAND_EXERCISE': {
      const sameExercise = action.exerciseIndex === state.expandedExerciseIndex
      if (sameExercise && action.setIndex === undefined) return state

      const targetSetIndex = action.setIndex

      const exercises = state.exercises.map((ex, eIdx) => {
        if (eIdx === state.expandedExerciseIndex) {
          return {
            ...ex,
            sets: ex.sets.map(s =>
              s.status === 'active' ? { ...s, status: 'pending' as const } : s
            )
          }
        }
        if (!sameExercise && eIdx === action.exerciseIndex) {
          return activateInExercise(ex, targetSetIndex)
        }
        return ex
      })

      if (sameExercise) {
        exercises[action.exerciseIndex] = activateInExercise(
          exercises[action.exerciseIndex],
          targetSetIndex
        )
      }

      const resolvedIdx =
        targetSetIndex !== undefined
          ? targetSetIndex
          : exercises[action.exerciseIndex].sets.findIndex(
              s => s.status === 'active'
            )

      return {
        ...state,
        exercises,
        expandedExerciseIndex: action.exerciseIndex,
        activeSetIndex: resolvedIdx === -1 ? 0 : resolvedIdx
      }
    }

    case 'LOG_SET': {
      const exercises = state.exercises.map((ex, eIdx) =>
        eIdx === action.exerciseIndex
          ? {
              ...ex,
              sets: ex.sets.map((s, sIdx) =>
                sIdx === action.setIndex
                  ? { ...s, reps: action.reps, weight: action.weight }
                  : s
              )
            }
          : ex
      )
      return { ...state, exercises }
    }

    case 'CONFIRM_SET': {
      let exercises = state.exercises.map((ex, eIdx) =>
        eIdx === action.exerciseIndex
          ? {
              ...ex,
              sets: ex.sets.map((s, sIdx) =>
                sIdx === action.setIndex
                  ? {
                      ...s,
                      status: 'completed' as const,
                      confirmedReps: s.reps,
                      confirmedWeight: s.weight
                    }
                  : s
              )
            }
          : ex
      )

      const next = findNextPendingSet(
        exercises,
        action.exerciseIndex,
        action.setIndex
      )

      if (next) {
        exercises = exercises.map((ex, eIdx) =>
          eIdx === next.exerciseIndex
            ? {
                ...ex,
                sets: ex.sets.map((s, sIdx) =>
                  sIdx === next.setIndex
                    ? { ...s, status: 'active' as const }
                    : s
                )
              }
            : ex
        )
        return {
          ...state,
          exercises,
          expandedExerciseIndex: next.exerciseIndex,
          activeSetIndex: next.setIndex
        }
      }

      return { ...state, exercises }
    }

    case 'SKIP_SET': {
      let exercises = state.exercises.map((ex, eIdx) =>
        eIdx === action.exerciseIndex
          ? {
              ...ex,
              sets: ex.sets.map((s, sIdx) =>
                sIdx === action.setIndex
                  ? { ...s, status: 'skipped' as const }
                  : s
              )
            }
          : ex
      )

      const next = findNextPendingSet(
        exercises,
        action.exerciseIndex,
        action.setIndex
      )

      if (next) {
        exercises = exercises.map((ex, eIdx) =>
          eIdx === next.exerciseIndex
            ? {
                ...ex,
                sets: ex.sets.map((s, sIdx) =>
                  sIdx === next.setIndex
                    ? { ...s, status: 'active' as const }
                    : s
                )
              }
            : ex
        )
        return {
          ...state,
          exercises,
          expandedExerciseIndex: next.exerciseIndex,
          activeSetIndex: next.setIndex
        }
      }

      return { ...state, exercises }
    }

    case 'START_REST_TIMER':
      return {
        ...state,
        restTimer: {
          isActive: true,
          startedAt: action.startedAt,
          durationMs: action.durationMs
        }
      }

    case 'DISMISS_REST_TIMER':
      return {
        ...state,
        restTimer: { ...state.restTimer, isActive: false }
      }

    case 'COMPLETE_WORKOUT': {
      const exercises = state.exercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(s =>
          s.status === 'pending' || s.status === 'active'
            ? { ...s, status: 'skipped' as const }
            : s
        )
      }))
      return {
        ...state,
        exercises,
        isCompleted: true,
        completedAt: action.completedAt
      }
    }

    case 'RESTORE_STATE':
      return action.state

    default:
      return state
  }
}
