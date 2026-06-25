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
  expandExercise: (exerciseIndex: number, setIndex?: number) => void
  logSet: (
    exerciseIndex: number,
    setIndex: number,
    reps: number,
    weight: number
  ) => void
  logDuration: (
    exerciseIndex: number,
    setIndex: number,
    durationSeconds: number
  ) => void
  confirmSet: (
    exerciseIndex: number,
    setIndex: number,
    durationSeconds?: number
  ) => void
  skipSet: (exerciseIndex: number, setIndex: number) => void
  startRestTimer: (durationMs: number) => void
  dismissRestTimer: () => void
  editSet: (exerciseIndex: number, setIndex: number) => void
  completeWorkout: () => void
  restoreState: (state: WorkoutState) => void
  addSet: (exerciseIndex: number) => void
  moveExercise: (from: number, to: number) => void
  extendRest: () => void
  unlogSet: (exerciseIndex: number, setIndex: number) => void
  restoreSet: (exerciseIndex: number, setIndex: number) => void
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
    (exerciseIndex: number, setIndex?: number) =>
      dispatch({ type: 'EXPAND_EXERCISE', exerciseIndex, setIndex }),
    []
  )

  const logSet = useCallback(
    (exerciseIndex: number, setIndex: number, reps: number, weight: number) =>
      dispatch({ type: 'LOG_SET', exerciseIndex, setIndex, reps, weight }),
    []
  )

  const logDuration = useCallback(
    (exerciseIndex: number, setIndex: number, durationSeconds: number) =>
      dispatch({
        type: 'LOG_DURATION',
        exerciseIndex,
        setIndex,
        durationSeconds
      }),
    []
  )

  const confirmSet = useCallback(
    (exerciseIndex: number, setIndex: number, durationSeconds?: number) =>
      dispatch({ type: 'CONFIRM_SET', exerciseIndex, setIndex, durationSeconds }),
    []
  )

  const skipSet = useCallback(
    (exerciseIndex: number, setIndex: number) =>
      dispatch({ type: 'SKIP_SET', exerciseIndex, setIndex }),
    []
  )

  const editSet = useCallback(
    (exerciseIndex: number, setIndex: number) =>
      dispatch({ type: 'EDIT_SET', exerciseIndex, setIndex }),
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

  const addSet = useCallback(
    (exerciseIndex: number) => dispatch({ type: 'ADD_SET', exerciseIndex }),
    []
  )

  const moveExercise = useCallback(
    (from: number, to: number) =>
      dispatch({ type: 'MOVE_EXERCISE', from, to }),
    []
  )

  const extendRest = useCallback(
    () => dispatch({ type: 'EXTEND_REST', now: Date.now() }),
    []
  )

  const unlogSet = useCallback(
    (exerciseIndex: number, setIndex: number) =>
      dispatch({ type: 'UNLOG_SET', exerciseIndex, setIndex }),
    []
  )

  const restoreSet = useCallback(
    (exerciseIndex: number, setIndex: number) =>
      dispatch({ type: 'RESTORE_SET', exerciseIndex, setIndex }),
    []
  )

  const value = useMemo<WorkoutExecutionContextValue>(
    () => ({
      state,
      expandExercise,
      logSet,
      logDuration,
      confirmSet,
      skipSet,
      editSet,
      startRestTimer,
      dismissRestTimer,
      completeWorkout,
      restoreState,
      addSet,
      moveExercise,
      extendRest,
      unlogSet,
      restoreSet
    }),
    [
      state,
      expandExercise,
      logSet,
      logDuration,
      confirmSet,
      skipSet,
      editSet,
      startRestTimer,
      dismissRestTimer,
      completeWorkout,
      restoreState,
      addSet,
      moveExercise,
      extendRest,
      unlogSet,
      restoreSet
    ]
  )

  return (
    <WorkoutExecutionContext.Provider value={value}>
      {children}
    </WorkoutExecutionContext.Provider>
  )
}
