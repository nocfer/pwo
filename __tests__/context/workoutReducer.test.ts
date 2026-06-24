import { findNextPendingSet, revertEditingSets } from '@/context/reducerHelpers'
import { workoutReducer } from '@/context/workoutReducer'
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

  it('activates targeted pending set when setIndex is provided', () => {
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
            { reps: 8, weight: 0, status: 'pending' },
            { reps: 8, weight: 0, status: 'pending' },
            { reps: 8, weight: 0, status: 'pending' }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'EXPAND_EXERCISE',
      exerciseIndex: 1,
      setIndex: 2
    })

    expect(next.expandedExerciseIndex).toBe(1)
    expect(next.activeSetIndex).toBe(2)
    expect(next.exercises[1].sets[0].status).toBe('pending')
    expect(next.exercises[1].sets[1].status).toBe('pending')
    expect(next.exercises[1].sets[2].status).toBe('active')
  })

  it('does not change completed set status when targeted via setIndex', () => {
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
            {
              reps: 8,
              weight: 80,
              status: 'completed',
              confirmedReps: 8,
              confirmedWeight: 80
            },
            { reps: 8, weight: 0, status: 'pending' }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'EXPAND_EXERCISE',
      exerciseIndex: 1,
      setIndex: 0
    })

    expect(next.expandedExerciseIndex).toBe(1)
    expect(next.activeSetIndex).toBe(0)
    expect(next.exercises[1].sets[0].status).toBe('completed')
  })

  it('does not change skipped set status when targeted via setIndex', () => {
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
            { reps: 8, weight: 0, status: 'skipped' },
            { reps: 8, weight: 0, status: 'pending' }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'EXPAND_EXERCISE',
      exerciseIndex: 1,
      setIndex: 0
    })

    expect(next.expandedExerciseIndex).toBe(1)
    expect(next.activeSetIndex).toBe(0)
    expect(next.exercises[1].sets[0].status).toBe('skipped')
  })

  it('re-expands same exercise with different setIndex targeting a pending set', () => {
    const state = createMockWorkoutState({
      expandedExerciseIndex: 0,
      activeSetIndex: 0,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            { reps: 10, weight: 0, status: 'active' },
            { reps: 10, weight: 0, status: 'pending' },
            { reps: 10, weight: 0, status: 'pending' }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'EXPAND_EXERCISE',
      exerciseIndex: 0,
      setIndex: 2
    })

    expect(next.activeSetIndex).toBe(2)
    expect(next.exercises[0].sets[0].status).toBe('pending')
    expect(next.exercises[0].sets[2].status).toBe('active')
  })

  it('does not change completed set status when targeted on same exercise via setIndex', () => {
    const state = createMockWorkoutState({
      expandedExerciseIndex: 0,
      activeSetIndex: 1,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            {
              reps: 10,
              weight: 60,
              status: 'completed',
              confirmedReps: 10,
              confirmedWeight: 60
            },
            { reps: 10, weight: 60, status: 'active' },
            { reps: 10, weight: 60, status: 'pending' }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'EXPAND_EXERCISE',
      exerciseIndex: 0,
      setIndex: 0
    })

    expect(next.activeSetIndex).toBe(0)
    expect(next.exercises[0].sets[0].status).toBe('completed')
    expect(next.exercises[0].sets[1].status).toBe('pending')
  })

  it('does not change skipped set status when targeted on same exercise via setIndex', () => {
    const state = createMockWorkoutState({
      expandedExerciseIndex: 0,
      activeSetIndex: 1,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            { reps: 10, weight: 60, status: 'skipped' },
            { reps: 10, weight: 60, status: 'active' },
            { reps: 10, weight: 60, status: 'pending' }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'EXPAND_EXERCISE',
      exerciseIndex: 0,
      setIndex: 0
    })

    expect(next.activeSetIndex).toBe(0)
    expect(next.exercises[0].sets[0].status).toBe('skipped')
    expect(next.exercises[0].sets[1].status).toBe('pending')
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

// ---------------------------------------------------------------------------
// revertEditingSets
// ---------------------------------------------------------------------------

describe('revertEditingSets', () => {
  it('reverts editing set to completed with original confirmed values', () => {
    const exercises: ExerciseState[] = [
      {
        exerciseId: 'ex1',
        exerciseName: 'A',
        sets: [
          {
            reps: 99,
            weight: 99,
            status: 'editing',
            confirmedReps: 10,
            confirmedWeight: 60
          }
        ]
      }
    ]
    const result = revertEditingSets(exercises)
    expect(result[0].sets[0].status).toBe('completed')
    expect(result[0].sets[0].reps).toBe(10)
    expect(result[0].sets[0].weight).toBe(60)
  })

  it('returns exercises unchanged when no editing sets exist', () => {
    const exercises: ExerciseState[] = [
      {
        exerciseId: 'ex1',
        exerciseName: 'A',
        sets: [{ reps: 10, weight: 60, status: 'completed' }]
      }
    ]
    const result = revertEditingSets(exercises)
    expect(result[0]).toBe(exercises[0])
  })

  it('only reverts editing sets, leaving others untouched', () => {
    const exercises: ExerciseState[] = [
      {
        exerciseId: 'ex1',
        exerciseName: 'A',
        sets: [
          { reps: 10, weight: 60, status: 'pending' },
          {
            reps: 99,
            weight: 99,
            status: 'editing',
            confirmedReps: 8,
            confirmedWeight: 50
          },
          { reps: 10, weight: 60, status: 'active' }
        ]
      }
    ]
    const result = revertEditingSets(exercises)
    expect(result[0].sets[0].status).toBe('pending')
    expect(result[0].sets[1].status).toBe('completed')
    expect(result[0].sets[1].reps).toBe(8)
    expect(result[0].sets[2].status).toBe('active')
  })
})

// ---------------------------------------------------------------------------
// workoutReducer — EDIT_SET
// ---------------------------------------------------------------------------

describe('workoutReducer — EDIT_SET', () => {
  it('transitions completed set to editing state and deactivates active set', () => {
    const state = createMockWorkoutState({
      expandedExerciseIndex: 0,
      activeSetIndex: 1,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            {
              reps: 10,
              weight: 60,
              status: 'completed',
              confirmedReps: 10,
              confirmedWeight: 60
            },
            { reps: 10, weight: 60, status: 'active' },
            { reps: 10, weight: 60, status: 'pending' }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'EDIT_SET',
      exerciseIndex: 0,
      setIndex: 0
    })

    expect(next.exercises[0].sets[0].status).toBe('editing')
    expect(next.exercises[0].sets[1].status).toBe('pending')
    expect(next.exercises[0].sets[2].status).toBe('pending')
    expect(next.expandedExerciseIndex).toBe(0)
    expect(next.activeSetIndex).toBe(0)
  })

  it('is a no-op when target set is not completed', () => {
    const state = createMockWorkoutState({
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            { reps: 10, weight: 60, status: 'active' },
            { reps: 10, weight: 60, status: 'pending' }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'EDIT_SET',
      exerciseIndex: 0,
      setIndex: 0
    })

    expect(next).toBe(state)
  })

  it('is a no-op when target set is skipped', () => {
    const state = createMockWorkoutState({
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [{ reps: 10, weight: 60, status: 'skipped' }]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'EDIT_SET',
      exerciseIndex: 0,
      setIndex: 0
    })

    expect(next).toBe(state)
  })

  it('switches from one editing set to another', () => {
    const state = createMockWorkoutState({
      expandedExerciseIndex: 0,
      activeSetIndex: 0,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            {
              reps: 99,
              weight: 99,
              status: 'editing',
              confirmedReps: 10,
              confirmedWeight: 60
            },
            {
              reps: 8,
              weight: 50,
              status: 'completed',
              confirmedReps: 8,
              confirmedWeight: 50
            }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'EDIT_SET',
      exerciseIndex: 0,
      setIndex: 1
    })

    expect(next.exercises[0].sets[0].status).toBe('completed')
    expect(next.exercises[0].sets[0].reps).toBe(10)
    expect(next.exercises[0].sets[0].weight).toBe(60)
    expect(next.exercises[0].sets[1].status).toBe('editing')
    expect(next.activeSetIndex).toBe(1)
  })

  it('sets expandedExerciseIndex to the target exercise and deactivates active set in previous exercise', () => {
    const state = createMockWorkoutState({
      expandedExerciseIndex: 0,
      activeSetIndex: 0,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [{ reps: 10, weight: 60, status: 'active' }]
        },
        {
          exerciseId: 'ex2',
          exerciseName: 'B',
          sets: [
            {
              reps: 8,
              weight: 80,
              status: 'completed',
              confirmedReps: 8,
              confirmedWeight: 80
            }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'EDIT_SET',
      exerciseIndex: 1,
      setIndex: 0
    })

    expect(next.expandedExerciseIndex).toBe(1)
    expect(next.activeSetIndex).toBe(0)
    expect(next.exercises[1].sets[0].status).toBe('editing')
    expect(next.exercises[0].sets[0].status).toBe('pending')
  })

  it('does not produce dual-active state after re-confirm', () => {
    const state = createMockWorkoutState({
      expandedExerciseIndex: 0,
      activeSetIndex: 1,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            {
              reps: 10,
              weight: 60,
              status: 'completed',
              confirmedReps: 10,
              confirmedWeight: 60
            },
            { reps: 10, weight: 60, status: 'active' },
            { reps: 10, weight: 60, status: 'pending' }
          ]
        }
      ]
    })

    const edited = workoutReducer(state, {
      type: 'EDIT_SET',
      exerciseIndex: 0,
      setIndex: 0
    })

    const reconfirmed = workoutReducer(edited, {
      type: 'CONFIRM_SET',
      exerciseIndex: 0,
      setIndex: 0
    })

    const activeCount = reconfirmed.exercises[0].sets.filter(
      s => s.status === 'active'
    ).length
    expect(activeCount).toBe(1)
    expect(reconfirmed.exercises[0].sets[0].status).toBe('completed')
    expect(reconfirmed.exercises[0].sets[1].status).toBe('active')
    expect(reconfirmed.exercises[0].sets[2].status).toBe('pending')
  })
})

// ---------------------------------------------------------------------------
// workoutReducer — EXPAND_EXERCISE reverts editing sets
// ---------------------------------------------------------------------------

describe('workoutReducer — EXPAND_EXERCISE with editing set', () => {
  it('reverts editing set to completed with original values when switching exercises', () => {
    const state = createMockWorkoutState({
      expandedExerciseIndex: 0,
      activeSetIndex: 0,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            {
              reps: 99,
              weight: 99,
              status: 'editing',
              confirmedReps: 10,
              confirmedWeight: 60
            }
          ]
        },
        {
          exerciseId: 'ex2',
          exerciseName: 'B',
          sets: [{ reps: 8, weight: 80, status: 'pending' }]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'EXPAND_EXERCISE',
      exerciseIndex: 1
    })

    expect(next.exercises[0].sets[0].status).toBe('completed')
    expect(next.exercises[0].sets[0].reps).toBe(10)
    expect(next.exercises[0].sets[0].weight).toBe(60)
    expect(next.expandedExerciseIndex).toBe(1)
    expect(next.exercises[1].sets[0].status).toBe('active')
  })
})

// ---------------------------------------------------------------------------
// workoutReducer — CONFIRM_SET on editing set (re-confirm)
// ---------------------------------------------------------------------------

describe('workoutReducer — CONFIRM_SET on editing set', () => {
  it('re-confirms editing set with updated values', () => {
    const state = createMockWorkoutState({
      expandedExerciseIndex: 0,
      activeSetIndex: 0,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            {
              reps: 12,
              weight: 70,
              status: 'editing',
              confirmedReps: 10,
              confirmedWeight: 60
            },
            { reps: 10, weight: 60, status: 'pending' }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'CONFIRM_SET',
      exerciseIndex: 0,
      setIndex: 0
    })

    expect(next.exercises[0].sets[0].status).toBe('completed')
    expect(next.exercises[0].sets[0].confirmedReps).toBe(12)
    expect(next.exercises[0].sets[0].confirmedWeight).toBe(70)
    expect(next.exercises[0].sets[1].status).toBe('active')
    expect(next.activeSetIndex).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// workoutReducer — COMPLETE_WORKOUT reverts editing sets
// ---------------------------------------------------------------------------

describe('workoutReducer — COMPLETE_WORKOUT with editing set', () => {
  it('reverts editing set to completed (not skipped) before marking remaining as skipped', () => {
    const state = createMockWorkoutState({
      expandedExerciseIndex: 0,
      activeSetIndex: 0,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            {
              reps: 99,
              weight: 99,
              status: 'editing',
              confirmedReps: 10,
              confirmedWeight: 60
            },
            { reps: 10, weight: 60, status: 'pending' },
            { reps: 10, weight: 60, status: 'active' }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'COMPLETE_WORKOUT',
      completedAt: 9999
    })

    expect(next.exercises[0].sets[0].status).toBe('completed')
    expect(next.exercises[0].sets[0].reps).toBe(10)
    expect(next.exercises[0].sets[0].weight).toBe(60)
    expect(next.exercises[0].sets[1].status).toBe('skipped')
    expect(next.exercises[0].sets[2].status).toBe('skipped')
    expect(next.isCompleted).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// workoutReducer — ADD_SET
// ---------------------------------------------------------------------------

describe('workoutReducer — ADD_SET', () => {
  it('appends a pending set copying the last set reps/weight', () => {
    const state = createMockWorkoutState()
    const next = workoutReducer(state, { type: 'ADD_SET', exerciseIndex: 1 })

    expect(next.exercises[1].sets).toHaveLength(3)
    expect(next.exercises[1].sets[2]).toEqual({
      reps: 8,
      weight: 80,
      status: 'pending'
    })
  })

  it('does not affect other exercises', () => {
    const state = createMockWorkoutState()
    const next = workoutReducer(state, { type: 'ADD_SET', exerciseIndex: 1 })

    expect(next.exercises[0]).toBe(state.exercises[0])
  })

  it('appends a zeroed pending set when the exercise has no sets', () => {
    const state = createMockWorkoutState({
      exercises: [{ exerciseId: 'ex1', exerciseName: 'A', sets: [] }]
    })
    const next = workoutReducer(state, { type: 'ADD_SET', exerciseIndex: 0 })

    expect(next.exercises[0].sets).toEqual([
      { reps: 0, weight: 0, status: 'pending' }
    ])
  })
})

// ---------------------------------------------------------------------------
// workoutReducer — MOVE_EXERCISE
// ---------------------------------------------------------------------------

describe('workoutReducer — MOVE_EXERCISE', () => {
  function createReorderableState() {
    return createMockWorkoutState({
      expandedExerciseIndex: 0,
      activeSetIndex: 0,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'Active',
          sets: [{ reps: 10, weight: 60, status: 'active' }]
        },
        {
          exerciseId: 'ex2',
          exerciseName: 'Upcoming B',
          sets: [{ reps: 8, weight: 80, status: 'pending' }]
        },
        {
          exerciseId: 'ex3',
          exerciseName: 'Upcoming C',
          sets: [{ reps: 6, weight: 100, status: 'pending' }]
        }
      ]
    })
  }

  it('swaps two untouched upcoming exercises', () => {
    const state = createReorderableState()
    const next = workoutReducer(state, {
      type: 'MOVE_EXERCISE',
      from: 1,
      to: 2
    })

    expect(next.exercises[1].exerciseId).toBe('ex3')
    expect(next.exercises[2].exerciseId).toBe('ex2')
  })

  it('is a no-op when the target index is out of bounds', () => {
    const state = createReorderableState()
    expect(
      workoutReducer(state, { type: 'MOVE_EXERCISE', from: 2, to: 3 })
    ).toBe(state)
    expect(
      workoutReducer(state, { type: 'MOVE_EXERCISE', from: 1, to: -1 })
    ).toBe(state)
  })

  it('refuses to move the currently expanded/active exercise', () => {
    const state = createReorderableState()
    expect(
      workoutReducer(state, { type: 'MOVE_EXERCISE', from: 0, to: 1 })
    ).toBe(state)
    expect(
      workoutReducer(state, { type: 'MOVE_EXERCISE', from: 1, to: 0 })
    ).toBe(state)
  })

  it('refuses to move an exercise that has a non-pending set', () => {
    const state = createReorderableState()
    state.exercises[1].sets[0].status = 'completed'
    expect(
      workoutReducer(state, { type: 'MOVE_EXERCISE', from: 1, to: 2 })
    ).toBe(state)
  })
})

// ---------------------------------------------------------------------------
// workoutReducer — EXTEND_REST
// ---------------------------------------------------------------------------

describe('workoutReducer — EXTEND_REST', () => {
  it('adds 15s to the rest timer startedAt when active and under the cap', () => {
    const state = createMockWorkoutState({
      restTimer: { isActive: true, startedAt: 1000, durationMs: 60000 }
    })
    const next = workoutReducer(state, { type: 'EXTEND_REST', now: 5000 })

    expect(next.restTimer.startedAt).toBe(16000)
    expect(next.restTimer.durationMs).toBe(60000)
    expect(next.restTimer.isActive).toBe(true)
  })

  it('clamps remaining time at the 15-minute ceiling', () => {
    // remaining is already ~890s; +15s would exceed the 900s cap.
    const state = createMockWorkoutState({
      restTimer: { isActive: true, startedAt: 830000, durationMs: 60000 }
    })
    const next = workoutReducer(state, { type: 'EXTEND_REST', now: 0 })

    // capped: startedAt + durationMs - now === 900000 (MAX_REST_MS)
    expect(next.restTimer.startedAt).toBe(840000)
  })

  it('does not move startedAt backward once at the cap (tap is a no-op)', () => {
    const state = createMockWorkoutState({
      restTimer: { isActive: true, startedAt: 850000, durationMs: 60000 }
    })
    const next = workoutReducer(state, { type: 'EXTEND_REST', now: 0 })

    expect(next.restTimer.startedAt).toBe(850000)
  })

  it('is a no-op when the rest timer is not active', () => {
    const state = createMockWorkoutState({
      restTimer: { isActive: false, startedAt: 0, durationMs: 0 }
    })
    expect(workoutReducer(state, { type: 'EXTEND_REST', now: 0 })).toBe(state)
  })
})

// ---------------------------------------------------------------------------
// workoutReducer — LOG_SET guards committed sets
// ---------------------------------------------------------------------------

describe('workoutReducer — LOG_SET guards', () => {
  it('ignores a completed set (no silent overwrite)', () => {
    const state = createMockWorkoutState({
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            {
              reps: 10,
              weight: 60,
              status: 'completed',
              confirmedReps: 10,
              confirmedWeight: 60
            }
          ]
        }
      ]
    })
    const next = workoutReducer(state, {
      type: 'LOG_SET',
      exerciseIndex: 0,
      setIndex: 0,
      reps: 99,
      weight: 99
    })
    expect(next).toBe(state)
  })

  it('ignores a skipped set', () => {
    const state = createMockWorkoutState({
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [{ reps: 10, weight: 60, status: 'skipped' }]
        }
      ]
    })
    const next = workoutReducer(state, {
      type: 'LOG_SET',
      exerciseIndex: 0,
      setIndex: 0,
      reps: 99,
      weight: 99
    })
    expect(next).toBe(state)
  })

  it('still updates an editing set', () => {
    const state = createMockWorkoutState({
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            {
              reps: 10,
              weight: 60,
              status: 'editing',
              confirmedReps: 10,
              confirmedWeight: 60
            }
          ]
        }
      ]
    })
    const next = workoutReducer(state, {
      type: 'LOG_SET',
      exerciseIndex: 0,
      setIndex: 0,
      reps: 12,
      weight: 70
    })
    expect(next.exercises[0].sets[0].reps).toBe(12)
    expect(next.exercises[0].sets[0].weight).toBe(70)
    expect(next.exercises[0].sets[0].status).toBe('editing')
  })
})

// ---------------------------------------------------------------------------
// workoutReducer — UNLOG_SET / RESTORE_SET
// ---------------------------------------------------------------------------

describe('workoutReducer — UNLOG_SET / RESTORE_SET', () => {
  it('re-activates an unlogged set when nothing else is active and clears rest', () => {
    const state = createMockWorkoutState({
      expandedExerciseIndex: 1,
      activeSetIndex: 0,
      restTimer: { isActive: true, startedAt: 1000, durationMs: 60000 },
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            {
              reps: 10,
              weight: 60,
              status: 'completed',
              confirmedReps: 10,
              confirmedWeight: 60
            }
          ]
        },
        {
          exerciseId: 'ex2',
          exerciseName: 'B',
          sets: [{ reps: 8, weight: 80, status: 'completed' }]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'UNLOG_SET',
      exerciseIndex: 0,
      setIndex: 0
    })

    expect(next.exercises[0].sets[0].status).toBe('active')
    expect(next.expandedExerciseIndex).toBe(0)
    expect(next.activeSetIndex).toBe(0)
    expect(next.restTimer.isActive).toBe(false)
  })

  it('only sets the unlogged set to pending when another set is still active', () => {
    const state = createMockWorkoutState({
      expandedExerciseIndex: 0,
      activeSetIndex: 1,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            {
              reps: 10,
              weight: 60,
              status: 'completed',
              confirmedReps: 10,
              confirmedWeight: 60
            },
            { reps: 10, weight: 60, status: 'active' }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'UNLOG_SET',
      exerciseIndex: 0,
      setIndex: 0
    })

    expect(next.exercises[0].sets[0].status).toBe('pending')
    expect(next.exercises[0].sets[1].status).toBe('active')
    expect(next.expandedExerciseIndex).toBe(0)
    expect(next.activeSetIndex).toBe(1)
  })

  it('re-activates a restored (previously skipped) set when nothing is active', () => {
    const state = createMockWorkoutState({
      expandedExerciseIndex: 0,
      activeSetIndex: 0,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            { reps: 10, weight: 60, status: 'completed' },
            { reps: 10, weight: 60, status: 'skipped' }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'RESTORE_SET',
      exerciseIndex: 0,
      setIndex: 1
    })

    expect(next.exercises[0].sets[1].status).toBe('active')
    expect(next.expandedExerciseIndex).toBe(0)
    expect(next.activeSetIndex).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// workoutReducer — natural completion endpoint
// ---------------------------------------------------------------------------
// The screen (Phase 2) dispatches COMPLETE_WORKOUT when CONFIRM_SET on the last
// set yields no next pending set. This verifies that terminal handoff: the
// reducer stays pure and completion finalizes a fully-logged state.

describe('workoutReducer — natural completion endpoint', () => {
  it('confirming the last set leaves no next pending, then COMPLETE_WORKOUT finalizes', () => {
    const state = createMockWorkoutState({
      expandedExerciseIndex: 0,
      activeSetIndex: 0,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            {
              reps: 10,
              weight: 60,
              status: 'completed',
              confirmedReps: 10,
              confirmedWeight: 60
            },
            { reps: 10, weight: 60, status: 'active' }
          ]
        }
      ]
    })

    const confirmed = workoutReducer(state, {
      type: 'CONFIRM_SET',
      exerciseIndex: 0,
      setIndex: 1
    })

    // No next pending set anywhere -> the screen would now complete.
    expect(findNextPendingSet(confirmed.exercises, 0, 1)).toBeNull()
    expect(confirmed.isCompleted).toBe(false)

    const completed = workoutReducer(confirmed, {
      type: 'COMPLETE_WORKOUT',
      completedAt: 9999
    })

    expect(completed.isCompleted).toBe(true)
    expect(completed.completedAt).toBe(9999)
    expect(
      completed.exercises[0].sets.every(s => s.status === 'completed')
    ).toBe(true)
  })
})
