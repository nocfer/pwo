import { useWorkoutExecution } from '@/hooks/workout/useWorkoutExecution'
import { useCallback, useState } from 'react'

export type KeypadFocus = {
  exerciseIndex: number
  setIndex: number
  field: 'reps' | 'weight'
}

export type KeypadState = {
  visible: boolean
  focus: KeypadFocus | null
  isFirstDigit: boolean
}

const INITIAL_STATE: KeypadState = {
  visible: false,
  focus: null,
  isFirstDigit: false
}

const MAX_VALUE = 9999
const MAX_DIGITS = 4

export function useKeypadState() {
  const { state, logSet } = useWorkoutExecution()
  const [keypadState, setKeypadState] = useState<KeypadState>(INITIAL_STATE)

  const getCurrentValue = useCallback(
    (focus: KeypadFocus): number => {
      const exercise = state.exercises[focus.exerciseIndex]
      if (!exercise) return 0
      const set = exercise.sets[focus.setIndex]
      if (!set) return 0
      return focus.field === 'reps' ? set.reps : set.weight
    },
    [state.exercises]
  )

  const dispatchValue = useCallback(
    (focus: KeypadFocus, newFieldValue: number) => {
      const exercise = state.exercises[focus.exerciseIndex]
      if (!exercise) return
      const set = exercise.sets[focus.setIndex]
      if (!set) return
      const reps = focus.field === 'reps' ? newFieldValue : set.reps
      const weight = focus.field === 'weight' ? newFieldValue : set.weight
      logSet(focus.exerciseIndex, focus.setIndex, reps, weight)
    },
    [state.exercises, logSet]
  )

  const openKeypad = useCallback(
    (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight') => {
      setKeypadState({
        visible: true,
        focus: { exerciseIndex, setIndex, field },
        isFirstDigit: true
      })
    },
    []
  )

  const handleDigit = useCallback(
    (digit: number) => {
      if (!keypadState.focus) return
      const focus = keypadState.focus
      const currentValue = getCurrentValue(focus)

      let newValue: number
      if (keypadState.isFirstDigit) {
        newValue = digit
      } else {
        const appended = currentValue * 10 + digit
        if (appended > MAX_VALUE || String(appended).length > MAX_DIGITS) return
        newValue = appended
      }

      dispatchValue(focus, newValue)
      setKeypadState(prev => ({ ...prev, isFirstDigit: false }))
    },
    [
      keypadState.focus,
      keypadState.isFirstDigit,
      getCurrentValue,
      dispatchValue
    ]
  )

  const handleBackspace = useCallback(() => {
    if (!keypadState.focus) return
    const focus = keypadState.focus
    const currentValue = getCurrentValue(focus)
    const newValue = Math.floor(currentValue / 10)
    dispatchValue(focus, newValue)
    setKeypadState(prev => ({ ...prev, isFirstDigit: false }))
  }, [keypadState.focus, getCurrentValue, dispatchValue])

  const handleDone = useCallback(() => {
    if (!keypadState.focus) return
    if (keypadState.focus.field === 'reps') {
      setKeypadState(prev => ({
        ...prev,
        focus: prev.focus ? { ...prev.focus, field: 'weight' } : null,
        isFirstDigit: true
      }))
    } else {
      setKeypadState(INITIAL_STATE)
    }
  }, [keypadState.focus])

  const switchField = useCallback(
    (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight') => {
      setKeypadState({
        visible: true,
        focus: { exerciseIndex, setIndex, field },
        isFirstDigit: true
      })
    },
    []
  )

  const dismissKeypad = useCallback(() => {
    setKeypadState(INITIAL_STATE)
  }, [])

  return {
    keypadState,
    openKeypad,
    handleDigit,
    handleBackspace,
    handleDone,
    switchField,
    dismissKeypad
  }
}
