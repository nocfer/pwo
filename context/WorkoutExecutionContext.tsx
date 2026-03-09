/**
 * WorkoutExecutionContext — v1.2 workout state machine.
 *
 * Provides a useReducer-based state machine for workout execution.
 * Components consume state via the useWorkoutExecution hook and call
 * named action dispatchers — raw dispatch is never exposed.
 */

import type { WorkoutState } from '@/types/workout'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useMemo,
  useReducer
} from 'react'
import { workoutReducer } from './workoutReducer'

// Re-export reducer utilities so existing imports don't break
export { findNextPendingSet, workoutReducer } from './workoutReducer'

// ---------------------------------------------------------------------------
// Context value type
// ---------------------------------------------------------------------------

export type WorkoutExecutionContextValue = {
  state: WorkoutState
  expandExercise: (exerciseIndex: number) => void
  logSet: (
    exerciseIndex: number,
    setIndex: number,
    reps: number,
    weight: number
  ) => void
  confirmSet: (exerciseIndex: number, setIndex: number) => void
  skipSet: (exerciseIndex: number, setIndex: number) => void
  startRestTimer: (durationMs: number) => void
  dismissRestTimer: () => void
  completeWorkout: () => void
  restoreState: (state: WorkoutState) => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const WorkoutExecutionContext =
  createContext<WorkoutExecutionContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

type ProviderProps = {
  initialState: WorkoutState
  children: ReactNode
}

export function WorkoutExecutionProvider({
  initialState,
  children
}: ProviderProps) {
  const [state, dispatch] = useReducer(workoutReducer, initialState)

  const expandExercise = useCallback(
    (exerciseIndex: number) =>
      dispatch({ type: 'EXPAND_EXERCISE', exerciseIndex }),
    []
  )

  const logSet = useCallback(
    (exerciseIndex: number, setIndex: number, reps: number, weight: number) =>
      dispatch({ type: 'LOG_SET', exerciseIndex, setIndex, reps, weight }),
    []
  )

  const confirmSet = useCallback(
    (exerciseIndex: number, setIndex: number) =>
      dispatch({ type: 'CONFIRM_SET', exerciseIndex, setIndex }),
    []
  )

  const skipSet = useCallback(
    (exerciseIndex: number, setIndex: number) =>
      dispatch({ type: 'SKIP_SET', exerciseIndex, setIndex }),
    []
  )

  const startRestTimer = useCallback(
    (durationMs: number) =>
      dispatch({
        type: 'START_REST_TIMER',
        durationMs,
        startedAt: Date.now()
      }),
    []
  )

  const dismissRestTimer = useCallback(
    () => dispatch({ type: 'DISMISS_REST_TIMER' }),
    []
  )

  const completeWorkout = useCallback(
    () => dispatch({ type: 'COMPLETE_WORKOUT', completedAt: Date.now() }),
    []
  )

  const restoreState = useCallback(
    (s: WorkoutState) => dispatch({ type: 'RESTORE_STATE', state: s }),
    []
  )

  const value = useMemo<WorkoutExecutionContextValue>(
    () => ({
      state,
      expandExercise,
      logSet,
      confirmSet,
      skipSet,
      startRestTimer,
      dismissRestTimer,
      completeWorkout,
      restoreState
    }),
    [
      state,
      expandExercise,
      logSet,
      confirmSet,
      skipSet,
      startRestTimer,
      dismissRestTimer,
      completeWorkout,
      restoreState
    ]
  )

  return (
    <WorkoutExecutionContext.Provider value={value}>
      {children}
    </WorkoutExecutionContext.Provider>
  )
}
