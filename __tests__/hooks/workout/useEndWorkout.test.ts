import type { ExerciseState } from '@/types/workout'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocking setup
// ---------------------------------------------------------------------------

const mockCompleteWorkout = vi.fn()
let mockExercises: ExerciseState[] = []

vi.mock('@/hooks/workout/useWorkoutExecution', () => ({
  useWorkoutExecution: () => ({
    state: { exercises: mockExercises },
    completeWorkout: mockCompleteWorkout
  })
}))

const mockSetShowEndConfirmation = vi.fn()

vi.mock('react', () => ({
  useState: vi.fn((initial: boolean) => [initial, mockSetShowEndConfirmation]),
  useCallback: (fn: (...args: unknown[]) => unknown) => fn,
  useMemo: (fn: () => unknown) => fn()
}))

import { useEndWorkout } from '@/hooks/workout/useEndWorkout'

// Pure computation helper (mirrors hook logic for edge case coverage)
function computePendingSetsCount(exercises: ExerciseState[]): number {
  return exercises.reduce(
    (count, ex) =>
      count +
      ex.sets.filter(s => s.status === 'pending' || s.status === 'active')
        .length,
    0
  )
}

// ---------------------------------------------------------------------------
// pendingSetsCount computation — pure logic edge cases
// ---------------------------------------------------------------------------

describe('useEndWorkout — pendingSetsCount computation', () => {
  it('counts all pending and active sets', () => {
    const exercises: ExerciseState[] = [
      {
        exerciseId: 'ex1',
        exerciseName: 'Bench Press',
        sets: [
          { reps: 10, weight: 60, status: 'active' },
          { reps: 10, weight: 60, status: 'pending' },
          { reps: 10, weight: 60, status: 'pending' }
        ]
      },
      {
        exerciseId: 'ex2',
        exerciseName: 'Squat',
        sets: [
          { reps: 8, weight: 80, status: 'pending' },
          { reps: 8, weight: 80, status: 'pending' }
        ]
      }
    ]

    expect(computePendingSetsCount(exercises)).toBe(5)
  })

  it('excludes completed sets from count', () => {
    const exercises: ExerciseState[] = [
      {
        exerciseId: 'ex1',
        exerciseName: 'Bench Press',
        sets: [
          { reps: 10, weight: 60, status: 'completed' },
          { reps: 10, weight: 60, status: 'pending' }
        ]
      }
    ]

    expect(computePendingSetsCount(exercises)).toBe(1)
  })

  it('excludes skipped sets from count', () => {
    const exercises: ExerciseState[] = [
      {
        exerciseId: 'ex1',
        exerciseName: 'Bench Press',
        sets: [
          { reps: 10, weight: 60, status: 'skipped' },
          { reps: 10, weight: 60, status: 'active' }
        ]
      }
    ]

    expect(computePendingSetsCount(exercises)).toBe(1)
  })

  it('returns 0 when all sets are completed or skipped', () => {
    const exercises: ExerciseState[] = [
      {
        exerciseId: 'ex1',
        exerciseName: 'A',
        sets: [
          { reps: 10, weight: 60, status: 'completed' },
          { reps: 10, weight: 60, status: 'skipped' }
        ]
      }
    ]

    expect(computePendingSetsCount(exercises)).toBe(0)
  })

  it('returns 0 for empty exercises array', () => {
    expect(computePendingSetsCount([])).toBe(0)
  })

  it('handles exercises with no sets', () => {
    const exercises: ExerciseState[] = [
      { exerciseId: 'ex1', exerciseName: 'A', sets: [] }
    ]

    expect(computePendingSetsCount(exercises)).toBe(0)
  })

  it('counts active sets alongside pending', () => {
    const exercises: ExerciseState[] = [
      {
        exerciseId: 'ex1',
        exerciseName: 'A',
        sets: [
          { reps: 10, weight: 60, status: 'active' },
          { reps: 10, weight: 60, status: 'completed' },
          { reps: 10, weight: 60, status: 'pending' }
        ]
      }
    ]

    expect(computePendingSetsCount(exercises)).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// useEndWorkout — hook behavior tests (mocked React + context)
// ---------------------------------------------------------------------------

describe('useEndWorkout — hook behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExercises = [
      {
        exerciseId: 'ex1',
        exerciseName: 'Bench Press',
        sets: [
          { reps: 10, weight: 60, status: 'active' },
          { reps: 10, weight: 60, status: 'pending' }
        ]
      }
    ]
  })

  it('returns initial showEndConfirmation as false', () => {
    const result = useEndWorkout()
    expect(result.showEndConfirmation).toBe(false)
  })

  it('computes pendingSetsCount from context state', () => {
    const result = useEndWorkout()
    expect(result.pendingSetsCount).toBe(2)
  })

  it('computes 0 pending sets when all are completed', () => {
    mockExercises = [
      {
        exerciseId: 'ex1',
        exerciseName: 'Bench Press',
        sets: [{ reps: 10, weight: 60, status: 'completed' }]
      }
    ]
    const result = useEndWorkout()
    expect(result.pendingSetsCount).toBe(0)
  })

  it('requestEnd sets showEndConfirmation to true', () => {
    const result = useEndWorkout()
    result.requestEnd()
    expect(mockSetShowEndConfirmation).toHaveBeenCalledWith(true)
  })

  it('confirmEnd dispatches completeWorkout and hides modal', () => {
    const result = useEndWorkout()
    result.confirmEnd()
    expect(mockCompleteWorkout).toHaveBeenCalledTimes(1)
    expect(mockSetShowEndConfirmation).toHaveBeenCalledWith(false)
  })

  it('cancelEnd hides modal without completing workout', () => {
    const result = useEndWorkout()
    result.cancelEnd()
    expect(mockSetShowEndConfirmation).toHaveBeenCalledWith(false)
    expect(mockCompleteWorkout).not.toHaveBeenCalled()
  })
})
