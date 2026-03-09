import { findNextPendingSet, workoutReducer } from '@/context/workoutReducer'
import type { ExerciseState, WorkoutState } from '@/types/workout'
import { describe, expect, it } from 'vitest'

// ---------------------------------------------------------------------------
// Test factory
// ---------------------------------------------------------------------------

function createMockWorkoutState(
  overrides?: Partial<WorkoutState>
): WorkoutState {
  return {
    workoutId: 'w1',
    programSlug: 'prog-1',
    sessionIndex: 1,
    sessionName: 'Test Session',
    exercises: [
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
    ],
    expandedExerciseIndex: 0,
    activeSetIndex: 0,
    restTimer: { isActive: false, startedAt: 0, durationMs: 0 },
    startedAt: 1000,
    completedAt: null,
    isCompleted: false,
    ...overrides
  }
}

// ---------------------------------------------------------------------------
// findNextPendingSet
// ---------------------------------------------------------------------------

describe('findNextPendingSet', () => {
  const exercises: ExerciseState[] = [
    {
      exerciseId: 'ex1',
      exerciseName: 'A',
      sets: [
        { reps: 10, weight: 0, status: 'completed' },
        { reps: 10, weight: 0, status: 'pending' },
        { reps: 10, weight: 0, status: 'pending' }
      ]
    },
    {
      exerciseId: 'ex2',
      exerciseName: 'B',
      sets: [
        { reps: 8, weight: 0, status: 'pending' },
        { reps: 8, weight: 0, status: 'pending' }
      ]
    }
  ]

  it('finds next pending set in same exercise', () => {
    const result = findNextPendingSet(exercises, 0, 0)
    expect(result).toEqual({ exerciseIndex: 0, setIndex: 1 })
  })

  it('finds first pending set in next exercise when current is exhausted', () => {
    const ex: ExerciseState[] = [
      {
        exerciseId: 'ex1',
        exerciseName: 'A',
        sets: [
          { reps: 10, weight: 0, status: 'completed' },
          { reps: 10, weight: 0, status: 'completed' }
        ]
      },
      {
        exerciseId: 'ex2',
        exerciseName: 'B',
        sets: [{ reps: 8, weight: 0, status: 'pending' }]
      }
    ]
    const result = findNextPendingSet(ex, 0, 1)
    expect(result).toEqual({ exerciseIndex: 1, setIndex: 0 })
  })

  it('wraps around to first exercise when scanning past the end', () => {
    const ex: ExerciseState[] = [
      {
        exerciseId: 'ex1',
        exerciseName: 'A',
        sets: [
          { reps: 10, weight: 0, status: 'pending' },
          { reps: 10, weight: 0, status: 'completed' }
        ]
      },
      {
        exerciseId: 'ex2',
        exerciseName: 'B',
        sets: [
          { reps: 8, weight: 0, status: 'completed' },
          { reps: 8, weight: 0, status: 'completed' }
        ]
      }
    ]
    const result = findNextPendingSet(ex, 1, 1)
    expect(result).toEqual({ exerciseIndex: 0, setIndex: 0 })
  })

  it('returns null when no pending sets exist anywhere', () => {
    const ex: ExerciseState[] = [
      {
        exerciseId: 'ex1',
        exerciseName: 'A',
        sets: [{ reps: 10, weight: 0, status: 'completed' }]
      },
      {
        exerciseId: 'ex2',
        exerciseName: 'B',
        sets: [{ reps: 8, weight: 0, status: 'skipped' }]
      }
    ]
    const result = findNextPendingSet(ex, 0, 0)
    expect(result).toBeNull()
  })

  it('returns null for empty exercises array', () => {
    expect(findNextPendingSet([], 0, 0)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// workoutReducer — EXPAND_EXERCISE
// ---------------------------------------------------------------------------

describe('workoutReducer — EXPAND_EXERCISE', () => {
  it('collapses previous exercise and expands new one', () => {
    const state = createMockWorkoutState()
    const next = workoutReducer(state, {
      type: 'EXPAND_EXERCISE',
      exerciseIndex: 1
    })

    expect(next.expandedExerciseIndex).toBe(1)
    expect(next.exercises[0].sets[0].status).toBe('pending')
    expect(next.exercises[1].sets[0].status).toBe('active')
  })

  it('is a no-op when expanding already-expanded exercise', () => {
    const state = createMockWorkoutState()
    const next = workoutReducer(state, {
      type: 'EXPAND_EXERCISE',
      exerciseIndex: 0
    })

    expect(next).toBe(state)
  })

  it('sets activeSetIndex to the first active set in new exercise', () => {
    const state = createMockWorkoutState({
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [{ reps: 10, weight: 0, status: 'active' }]
        },
        {
          exerciseId: 'ex2',
          exerciseName: 'B',
          sets: [
            { reps: 8, weight: 0, status: 'completed' },
            { reps: 8, weight: 0, status: 'pending' }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'EXPAND_EXERCISE',
      exerciseIndex: 1
    })

    expect(next.activeSetIndex).toBe(1)
    expect(next.exercises[1].sets[1].status).toBe('active')
  })
})

// ---------------------------------------------------------------------------
// workoutReducer — LOG_SET
// ---------------------------------------------------------------------------

describe('workoutReducer — LOG_SET', () => {
  it('updates reps and weight on target set', () => {
    const state = createMockWorkoutState()
    const next = workoutReducer(state, {
      type: 'LOG_SET',
      exerciseIndex: 0,
      setIndex: 0,
      reps: 12,
      weight: 70
    })

    expect(next.exercises[0].sets[0].reps).toBe(12)
    expect(next.exercises[0].sets[0].weight).toBe(70)
    expect(next.exercises[0].sets[0].status).toBe('active')
  })

  it('does not affect other sets', () => {
    const state = createMockWorkoutState()
    const next = workoutReducer(state, {
      type: 'LOG_SET',
      exerciseIndex: 0,
      setIndex: 0,
      reps: 12,
      weight: 70
    })

    expect(next.exercises[0].sets[1]).toEqual(state.exercises[0].sets[1])
    expect(next.exercises[1]).toEqual(state.exercises[1])
  })
})
