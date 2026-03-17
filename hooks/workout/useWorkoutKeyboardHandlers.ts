import { useCallback } from 'react'
import type { KeypadState } from './useKeypadState'
import { useWebKeyboardShortcuts } from './useWebKeyboardShortcuts'
import type { WorkoutState } from '@/types/workout'

type WorkoutKeyboardHandlersConfig = {
  state: WorkoutState
  keypadState: KeypadState
  onSetConfirm: (exerciseIndex: number, setIndex: number) => void
  openKeypad: (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight'
  ) => void
  switchField: (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight'
  ) => void
  dismissKeypad: () => void
  onDigit: (digit: number) => void
  onBackspace: () => void
}

export function useWorkoutKeyboardHandlers(
  config: WorkoutKeyboardHandlersConfig
) {
  const {
    state,
    keypadState,
    onSetConfirm,
    openKeypad,
    switchField,
    dismissKeypad,
    onDigit,
    onBackspace
  } = config

  const handleEnterConfirm = useCallback(() => {
    const set =
      state.exercises[state.expandedExerciseIndex]?.sets[state.activeSetIndex]
    if (!set || (set.status !== 'active' && set.status !== 'editing'))
      return false
    onSetConfirm(state.expandedExerciseIndex, state.activeSetIndex)
    return true
  }, [
    state.exercises,
    state.expandedExerciseIndex,
    state.activeSetIndex,
    onSetConfirm
  ])

  const handleTabAdvance = useCallback(() => {
    if (!keypadState.visible || !keypadState.focus) {
      openKeypad(state.expandedExerciseIndex, state.activeSetIndex, 'reps')
      return true
    }
    const { exerciseIndex, setIndex, field } = keypadState.focus
    if (field === 'reps') {
      switchField(exerciseIndex, setIndex, 'weight')
      return true
    }
    const ex = state.exercises[exerciseIndex]
    if (ex) {
      for (let i = setIndex + 1; i < ex.sets.length; i++) {
        const s = ex.sets[i]
        if (s.status === 'pending' || s.status === 'active') {
          switchField(exerciseIndex, i, 'reps')
          return true
        }
      }
    }
    dismissKeypad()
    return true
  }, [
    keypadState,
    state.exercises,
    state.expandedExerciseIndex,
    state.activeSetIndex,
    openKeypad,
    switchField,
    dismissKeypad
  ])

  const handleEscapeDismiss = useCallback(() => {
    if (!keypadState.visible) return false
    dismissKeypad()
    return true
  }, [keypadState.visible, dismissKeypad])

  useWebKeyboardShortcuts({
    onEnter: handleEnterConfirm,
    onTab: handleTabAdvance,
    onEscape: handleEscapeDismiss,
    onDigit: keypadState.visible ? onDigit : undefined,
    onBackspace: keypadState.visible ? onBackspace : undefined,
    enabled: !state.isCompleted
  })
}
