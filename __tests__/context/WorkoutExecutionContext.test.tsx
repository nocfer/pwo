import { workoutReducer } from '@/context/workoutReducer'
import type { WorkoutState } from '@/types/workout'
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
// CONFIRM_SET
// ---------------------------------------------------------------------------

describe('workoutReducer — CONFIRM_SET', () => {
  it('marks set as completed with confirmed values', () => {
    const state = createMockWorkoutState()
    const next = workoutReducer(state, {
      type: 'CONFIRM_SET',
      exerciseIndex: 0,
      setIndex: 0
    })

    const set = next.exercises[0].sets[0]
    expect(set.status).toBe('completed')
    expect(set.confirmedReps).toBe(10)
    expect(set.confirmedWeight).toBe(60)
  })

  it('advances to next pending set in same exercise', () => {
    const state = createMockWorkoutState()
    const next = workoutReducer(state, {
      type: 'CONFIRM_SET',
      exerciseIndex: 0,
      setIndex: 0
    })

    expect(next.exercises[0].sets[1].status).toBe('active')
    expect(next.expandedExerciseIndex).toBe(0)
    expect(next.activeSetIndex).toBe(1)
  })

  it('auto-expands next exercise when last set of current exercise confirmed', () => {
    const state = createMockWorkoutState({
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [
            { reps: 10, weight: 60, status: 'completed' },
            { reps: 10, weight: 60, status: 'completed' },
            { reps: 10, weight: 60, status: 'active' }
          ]
        },
        {
          exerciseId: 'ex2',
          exerciseName: 'B',
          sets: [
            { reps: 8, weight: 80, status: 'pending' },
            { reps: 8, weight: 80, status: 'pending' }
          ]
        }
      ],
      activeSetIndex: 2
    })

    const next = workoutReducer(state, {
      type: 'CONFIRM_SET',
      exerciseIndex: 0,
      setIndex: 2
    })

    expect(next.expandedExerciseIndex).toBe(1)
    expect(next.exercises[1].sets[0].status).toBe('active')
    expect(next.activeSetIndex).toBe(0)
  })

  it('wraps around to first exercise with pending sets', () => {
    const state = createMockWorkoutState({
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [{ reps: 10, weight: 60, status: 'pending' }]
        },
        {
          exerciseId: 'ex2',
          exerciseName: 'B',
          sets: [{ reps: 8, weight: 80, status: 'active' }]
        }
      ],
      expandedExerciseIndex: 1,
      activeSetIndex: 0
    })

    const next = workoutReducer(state, {
      type: 'CONFIRM_SET',
      exerciseIndex: 1,
      setIndex: 0
    })

    expect(next.expandedExerciseIndex).toBe(0)
    expect(next.exercises[0].sets[0].status).toBe('active')
    expect(next.activeSetIndex).toBe(0)
  })

  it('does not auto-expand when all sets are done', () => {
    const state = createMockWorkoutState({
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'A',
          sets: [{ reps: 10, weight: 60, status: 'completed' }]
        },
        {
          exerciseId: 'ex2',
          exerciseName: 'B',
          sets: [{ reps: 8, weight: 80, status: 'active' }]
        }
      ],
      expandedExerciseIndex: 1,
      activeSetIndex: 0
    })

    const next = workoutReducer(state, {
      type: 'CONFIRM_SET',
      exerciseIndex: 1,
      setIndex: 0
    })

    expect(next.exercises[1].sets[0].status).toBe('completed')
    expect(next.expandedExerciseIndex).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// SKIP_SET
// ---------------------------------------------------------------------------

describe('workoutReducer — SKIP_SET', () => {
  it('marks set as skipped and advances to next pending set', () => {
    const state = createMockWorkoutState()
    const next = workoutReducer(state, {
      type: 'SKIP_SET',
      exerciseIndex: 0,
      setIndex: 0
    })

    expect(next.exercises[0].sets[0].status).toBe('skipped')
    expect(next.exercises[0].sets[1].status).toBe('active')
    expect(next.activeSetIndex).toBe(1)
  })

  it('does not set confirmedReps/confirmedWeight', () => {
    const state = createMockWorkoutState()
    const next = workoutReducer(state, {
      type: 'SKIP_SET',
      exerciseIndex: 0,
      setIndex: 0
    })

    expect(next.exercises[0].sets[0].confirmedReps).toBeUndefined()
    expect(next.exercises[0].sets[0].confirmedWeight).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// START_REST_TIMER / DISMISS_REST_TIMER
// ---------------------------------------------------------------------------

describe('workoutReducer — START_REST_TIMER', () => {
  it('activates rest timer with correct timestamps', () => {
    const state = createMockWorkoutState()
    const next = workoutReducer(state, {
      type: 'START_REST_TIMER',
      durationMs: 90000,
      startedAt: 5000
    })

    expect(next.restTimer.isActive).toBe(true)
    expect(next.restTimer.durationMs).toBe(90000)
    expect(next.restTimer.startedAt).toBe(5000)
  })
})

describe('workoutReducer — DISMISS_REST_TIMER', () => {
  it('deactivates rest timer', () => {
    const state = createMockWorkoutState({
      restTimer: { isActive: true, startedAt: 5000, durationMs: 90000 }
    })
    const next = workoutReducer(state, { type: 'DISMISS_REST_TIMER' })
    expect(next.restTimer.isActive).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// COMPLETE_WORKOUT
// ---------------------------------------------------------------------------

describe('workoutReducer — COMPLETE_WORKOUT', () => {
  it('sets isCompleted to true and completedAt', () => {
    const state = createMockWorkoutState()
    const next = workoutReducer(state, {
      type: 'COMPLETE_WORKOUT',
      completedAt: 5000
    })

    expect(next.isCompleted).toBe(true)
    expect(next.completedAt).toBe(5000)
  })

  it('marks all remaining pending sets as skipped', () => {
    const state = createMockWorkoutState()
    const next = workoutReducer(state, {
      type: 'COMPLETE_WORKOUT',
      completedAt: 5000
    })

    for (const ex of next.exercises) {
      for (const set of ex.sets) {
        expect(set.status).not.toBe('pending')
      }
    }
    expect(next.exercises[0].sets[0].status).toBe('skipped')
    expect(next.exercises[0].sets[1].status).toBe('skipped')
    expect(next.exercises[0].sets[2].status).toBe('skipped')
    expect(next.exercises[1].sets[0].status).toBe('skipped')
    expect(next.exercises[1].sets[1].status).toBe('skipped')
  })

  it('preserves already-completed sets', () => {
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
            },
            { reps: 10, weight: 60, status: 'pending' }
          ]
        }
      ]
    })

    const next = workoutReducer(state, {
      type: 'COMPLETE_WORKOUT',
      completedAt: 5000
    })

    expect(next.exercises[0].sets[0].status).toBe('completed')
    expect(next.exercises[0].sets[0].confirmedReps).toBe(10)
    expect(next.exercises[0].sets[1].status).toBe('skipped')
  })
})

// ---------------------------------------------------------------------------
// RESTORE_STATE
// ---------------------------------------------------------------------------

describe('workoutReducer — RESTORE_STATE', () => {
  it('replaces entire state with provided state', () => {
    const state = createMockWorkoutState()
    const restored = createMockWorkoutState({
      workoutId: 'restored-id',
      isCompleted: true,
      completedAt: 9999
    })

    const next = workoutReducer(state, {
      type: 'RESTORE_STATE',
      state: restored
    })

    expect(next).toEqual(restored)
    expect(next.workoutId).toBe('restored-id')
    expect(next.isCompleted).toBe(true)
  })
})
