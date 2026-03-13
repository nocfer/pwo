import type { ExerciseState } from '@/types/workout'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockLogSet = vi.fn()
let mockExercises: ExerciseState[] = []

vi.mock('@/hooks/workout/useWorkoutExecution', () => ({
  useWorkoutExecution: () => ({
    state: { exercises: mockExercises },
    logSet: mockLogSet
  })
}))

type KeypadState = {
  visible: boolean
  focus: {
    exerciseIndex: number
    setIndex: number
    field: 'reps' | 'weight'
  } | null
  isFirstDigit: boolean
}

let currentState: KeypadState = {
  visible: false,
  focus: null,
  isFirstDigit: false
}
const mockSetState = vi.fn((updater: unknown) => {
  if (typeof updater === 'function') {
    currentState = (updater as (prev: KeypadState) => KeypadState)(currentState)
  } else {
    currentState = updater as KeypadState
  }
})

vi.mock('react', () => ({
  useState: vi.fn((initial: unknown) => {
    currentState = initial as KeypadState
    return [currentState, mockSetState]
  }),
  useCallback: (fn: (...args: unknown[]) => unknown) => fn
}))

import { useKeypadState } from '@/hooks/workout/useKeypadState'
import { useState } from 'react'

function makeExercises(): ExerciseState[] {
  return [
    {
      exerciseId: 'bench',
      exerciseName: 'Bench Press',
      sets: [
        { reps: 8, weight: 135, status: 'active' },
        { reps: 8, weight: 135, status: 'pending' }
      ]
    },
    {
      exerciseId: 'squat',
      exerciseName: 'Squat',
      sets: [
        { reps: 5, weight: 225, status: 'pending' },
        { reps: 5, weight: 225, status: 'pending' }
      ]
    }
  ]
}

function initHookWithState(state: KeypadState) {
  vi.mocked(useState).mockReturnValueOnce([state, mockSetState] as unknown as [
    never,
    never
  ])
  return useKeypadState()
}

describe('useKeypadState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExercises = makeExercises()
    currentState = { visible: false, focus: null, isFirstDigit: false }
  })

  describe('openKeypad', () => {
    it('sets visible, focus target, and isFirstDigit to true', () => {
      const { openKeypad } = useKeypadState()
      openKeypad(0, 1, 'reps')
      expect(mockSetState).toHaveBeenCalledWith({
        visible: true,
        focus: { exerciseIndex: 0, setIndex: 1, field: 'reps' },
        isFirstDigit: true
      })
    })

    it('sets field to weight when weight is specified', () => {
      const { openKeypad } = useKeypadState()
      openKeypad(1, 0, 'weight')
      expect(mockSetState).toHaveBeenCalledWith({
        visible: true,
        focus: { exerciseIndex: 1, setIndex: 0, field: 'weight' },
        isFirstDigit: true
      })
    })
  })

  describe('handleDigit — first digit replace', () => {
    it('replaces value on first digit (calls logSet with just the digit)', () => {
      const repsState: KeypadState = {
        visible: true,
        focus: { exerciseIndex: 0, setIndex: 0, field: 'reps' },
        isFirstDigit: true
      }
      const { handleDigit } = initHookWithState(repsState)
      handleDigit(3)
      expect(mockLogSet).toHaveBeenCalledWith(0, 0, 3, 135)
    })

    it('replaces weight value on first digit', () => {
      const weightState: KeypadState = {
        visible: true,
        focus: { exerciseIndex: 0, setIndex: 0, field: 'weight' },
        isFirstDigit: true
      }
      const { handleDigit } = initHookWithState(weightState)
      handleDigit(2)
      expect(mockLogSet).toHaveBeenCalledWith(0, 0, 8, 2)
    })
  })

  describe('handleDigit — append behavior', () => {
    it('appends digit when isFirstDigit is false (value * 10 + digit)', () => {
      const state: KeypadState = {
        visible: true,
        focus: { exerciseIndex: 0, setIndex: 0, field: 'weight' },
        isFirstDigit: false
      }
      mockExercises[0].sets[0].weight = 13
      const { handleDigit } = initHookWithState(state)
      handleDigit(5)
      expect(mockLogSet).toHaveBeenCalledWith(0, 0, 8, 135)
    })

    it('rejects digit that would exceed 9999', () => {
      const state: KeypadState = {
        visible: true,
        focus: { exerciseIndex: 0, setIndex: 0, field: 'weight' },
        isFirstDigit: false
      }
      mockExercises[0].sets[0].weight = 1000
      const { handleDigit } = initHookWithState(state)
      handleDigit(1)
      expect(mockLogSet).not.toHaveBeenCalled()
    })

    it('allows value up to 9999', () => {
      const state: KeypadState = {
        visible: true,
        focus: { exerciseIndex: 0, setIndex: 0, field: 'weight' },
        isFirstDigit: false
      }
      mockExercises[0].sets[0].weight = 999
      const { handleDigit } = initHookWithState(state)
      handleDigit(9)
      expect(mockLogSet).toHaveBeenCalledWith(0, 0, 8, 9999)
    })
  })

  describe('handleBackspace', () => {
    it('removes last digit (Math.floor(value / 10))', () => {
      expect(Math.floor(135 / 10)).toBe(13)
      expect(Math.floor(13 / 10)).toBe(1)
      expect(Math.floor(1 / 10)).toBe(0)
    })

    it('minimum value is 0', () => {
      expect(Math.floor(0 / 10)).toBe(0)
    })

    it('dispatches logSet with reduced value', () => {
      const state: KeypadState = {
        visible: true,
        focus: { exerciseIndex: 0, setIndex: 0, field: 'weight' },
        isFirstDigit: false
      }
      const { handleBackspace } = initHookWithState(state)
      handleBackspace()
      expect(mockLogSet).toHaveBeenCalledWith(0, 0, 8, Math.floor(135 / 10))
    })
  })

  describe('handleDone', () => {
    it('moves focus from reps to weight on same set (keypad stays open)', () => {
      const repsState: KeypadState = {
        visible: true,
        focus: { exerciseIndex: 0, setIndex: 0, field: 'reps' },
        isFirstDigit: false
      }
      const { handleDone } = initHookWithState(repsState)
      handleDone()

      expect(mockSetState).toHaveBeenCalled()
      const updater = mockSetState.mock.calls[0][0]
      const result = (updater as (prev: KeypadState) => KeypadState)(repsState)
      expect(result.focus?.field).toBe('weight')
      expect(result.isFirstDigit).toBe(true)
      expect(result.visible).toBe(true)
    })

    it('dismisses keypad when field is weight (Done on weight = dismiss)', () => {
      const weightState: KeypadState = {
        visible: true,
        focus: { exerciseIndex: 0, setIndex: 0, field: 'weight' },
        isFirstDigit: false
      }
      const { handleDone } = initHookWithState(weightState)
      handleDone()

      expect(mockSetState).toHaveBeenCalled()
      const arg = mockSetState.mock.calls[0][0]
      const result = arg as KeypadState
      expect(result.visible).toBe(false)
      expect(result.focus).toBeNull()
    })

    it('does nothing when focus is null', () => {
      const noFocusState: KeypadState = {
        visible: false,
        focus: null,
        isFirstDigit: false
      }
      const { handleDone } = initHookWithState(noFocusState)
      handleDone()
      expect(mockSetState).not.toHaveBeenCalled()
    })
  })

  describe('switchField', () => {
    it('changes focus without dismissing keypad', () => {
      const { switchField } = useKeypadState()
      switchField(1, 0, 'weight')
      expect(mockSetState).toHaveBeenCalledWith({
        visible: true,
        focus: { exerciseIndex: 1, setIndex: 0, field: 'weight' },
        isFirstDigit: true
      })
    })

    it('resets isFirstDigit to true', () => {
      const { switchField } = useKeypadState()
      switchField(0, 1, 'reps')
      const call =
        mockSetState.mock.calls[mockSetState.mock.calls.length - 1][0]
      expect((call as Record<string, unknown>).isFirstDigit).toBe(true)
    })
  })

  describe('dismissKeypad', () => {
    it('sets visible to false and clears focus', () => {
      const { dismissKeypad } = useKeypadState()
      dismissKeypad()
      expect(mockSetState).toHaveBeenCalledWith({
        visible: false,
        focus: null,
        isFirstDigit: false
      })
    })
  })

  describe('initial state', () => {
    it('starts with keypad not visible', () => {
      const { keypadState } = useKeypadState()
      expect(keypadState.visible).toBe(false)
      expect(keypadState.focus).toBeNull()
      expect(keypadState.isFirstDigit).toBe(false)
    })
  })
})
