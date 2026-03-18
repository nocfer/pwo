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
