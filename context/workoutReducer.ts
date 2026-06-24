/**
 * Pure reducer for the WorkoutExecution state machine.
 */

import type { WorkoutAction, WorkoutState } from '@/types/workout'
import {
  activateInExercise,
  findNextPendingSet,
  revertEditingSets
} from './reducerHelpers'

export { findNextPendingSet, revertEditingSets } from './reducerHelpers'

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
      const reverted = revertEditingSets(state.exercises)

      const exercises = reverted.map((ex, eIdx) => {
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

    case 'EDIT_SET': {
      const target =
        state.exercises[action.exerciseIndex]?.sets[action.setIndex]
      if (!target || target.status !== 'completed') return state

      const reverted = revertEditingSets(state.exercises)
      const exercises = reverted.map((ex, eIdx) => {
        const isTarget = eIdx === action.exerciseIndex
        const hasActive = ex.sets.some(s => s.status === 'active')
        if (!isTarget && !hasActive) return ex
        return {
          ...ex,
          sets: ex.sets.map((s, sIdx) => {
            if (isTarget && sIdx === action.setIndex) {
              return { ...s, status: 'editing' as const }
            }
            if (s.status === 'active') {
              return { ...s, status: 'pending' as const }
            }
            return s
          })
        }
      })
      return {
        ...state,
        exercises,
        expandedExerciseIndex: action.exerciseIndex,
        activeSetIndex: action.setIndex
      }
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
      const reverted = revertEditingSets(state.exercises)
      const exercises = reverted.map(ex => ({
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
        completedAt: action.completedAt,
        restTimer: { isActive: false, startedAt: 0, durationMs: 0 }
      }
    }

    // ---- redesign extensions (ported from the Flow prototype) ----

    case 'ADD_SET': {
      const exercises = state.exercises.map((ex, eIdx) => {
        if (eIdx !== action.exerciseIndex) return ex
        const last = ex.sets[ex.sets.length - 1]
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              reps: last ? last.reps : 0,
              weight: last ? last.weight : 0,
              status: 'pending' as const
            }
          ]
        }
      })
      return { ...state, exercises }
    }

    case 'MOVE_EXERCISE': {
      const { from, to } = action
      const n = state.exercises.length
      if (to < 0 || to >= n) return state
      // Only reorder untouched, upcoming exercises — never the active one.
      if (
        from === state.expandedExerciseIndex ||
        to === state.expandedExerciseIndex
      ) {
        return state
      }
      const allPending = (ex: WorkoutState['exercises'][number]) =>
        ex.sets.every(s => s.status === 'pending')
      if (
        !allPending(state.exercises[from]) ||
        !allPending(state.exercises[to])
      ) {
        return state
      }
      const exercises = state.exercises.slice()
      const tmp = exercises[from]
      exercises[from] = exercises[to]
      exercises[to] = tmp
      return { ...state, exercises }
    }

    case 'EXTEND_REST':
      if (!state.restTimer.isActive) return state
      return {
        ...state,
        restTimer: {
          ...state.restTimer,
          startedAt: state.restTimer.startedAt + 15000
        }
      }

    case 'UNLOG_SET':
    case 'RESTORE_SET': {
      let exercises = state.exercises.map((ex, eIdx) =>
        eIdx === action.exerciseIndex
          ? {
              ...ex,
              sets: ex.sets.map((s, sIdx) =>
                sIdx === action.setIndex
                  ? { ...s, status: 'pending' as const }
                  : s
              )
            }
          : ex
      )

      const hasActive = exercises.some(ex =>
        ex.sets.some(s => s.status === 'active')
      )
      let expanded = state.expandedExerciseIndex
      let activeIdx = state.activeSetIndex
      if (!hasActive) {
        exercises = exercises.map((ex, eIdx) =>
          eIdx === action.exerciseIndex
            ? activateInExercise(ex, action.setIndex)
            : ex
        )
        expanded = action.exerciseIndex
        activeIdx = action.setIndex
      }

      return {
        ...state,
        exercises,
        expandedExerciseIndex: expanded,
        activeSetIndex: activeIdx,
        restTimer: { ...state.restTimer, isActive: false }
      }
    }

    case 'RESTORE_STATE':
      return action.state

    default:
      return state
  }
}
