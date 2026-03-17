import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkoutState } from '@/types/workout'

const mockStorage = vi.hoisted(() => {
  const store = new Map<string, string>()
  return {
    set: vi.fn((key: string, value: string) => store.set(key, value)),
    getString: vi.fn((key: string) => store.get(key)),
    remove: vi.fn((key: string) => store.delete(key)),
    contains: vi.fn((key: string) => store.has(key)),
    _store: store
  }
})

vi.mock('@/lib/mmkv', () => ({
  storage: mockStorage
}))

import { readPersistedWorkout } from '@/lib/workout-persistence'
import { STORAGE_KEYS } from '@/lib/storage-keys'

function createValidState(overrides?: Partial<WorkoutState>): WorkoutState {
  return {
    workoutId: 'w-int-test',
    programSlug: 'push-pull',
    sessionIndex: 0,
    sessionName: 'Push Day',
    exercises: [
      {
        exerciseId: 'ex1',
        exerciseName: 'Bench Press',
        sets: [{ reps: 8, weight: 135, status: 'active' }]
      }
    ],
    expandedExerciseIndex: 0,
    activeSetIndex: 0,
    restTimer: { isActive: false, startedAt: 0, durationMs: 0 },
    startedAt: Date.now() - 60000,
    completedAt: null,
    isCompleted: false,
    ...overrides
  }
}

describe('Workout persistence integration', () => {
  beforeEach(() => {
    mockStorage._store.clear()
    vi.clearAllMocks()
  })

  it('full cycle: persist state via JSON.stringify → readPersistedWorkout returns identical state', () => {
    const state = createValidState()
    const serialized = JSON.stringify(state)
    mockStorage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, serialized)

    const restored = readPersistedWorkout()

    expect(restored).toEqual(state)
    expect(restored).not.toBe(state)
    expect(JSON.stringify(restored)).toBe(serialized)
  })

  it('timer recalculation: persisted startedAt produces correct elapsed time', () => {
    const thirtyMinAgo = Date.now() - 30 * 60 * 1000
    const state = createValidState({ startedAt: thirtyMinAgo })
    mockStorage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(state))

    const restored = readPersistedWorkout()
    expect(restored).not.toBeNull()

    const elapsed = Date.now() - restored!.startedAt
    const thirtyMinMs = 30 * 60 * 1000
    expect(elapsed).toBeGreaterThanOrEqual(thirtyMinMs - 100)
    expect(elapsed).toBeLessThanOrEqual(thirtyMinMs + 1000)
  })

  it('session ID preservation: existing session ID reused when active state present', () => {
    const sessionId = 'session-abc-123'
    const state = createValidState()
    mockStorage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(state))
    mockStorage.set(STORAGE_KEYS.WORKOUT_SESSION_ID, sessionId)

    const restored = readPersistedWorkout()
    expect(restored).not.toBeNull()

    const retrievedId = mockStorage.getString(STORAGE_KEYS.WORKOUT_SESSION_ID)
    expect(retrievedId).toBe(sessionId)
  })

  it('session ID not reused when no active state (fresh workout scenario)', () => {
    const oldSessionId = 'old-session-from-completed-workout'
    mockStorage.set(STORAGE_KEYS.WORKOUT_SESSION_ID, oldSessionId)

    const restored = readPersistedWorkout()
    expect(restored).toBeNull()

    const activeState = mockStorage.getString(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)
    expect(activeState).toBeUndefined()
  })

  it('corrupted state recovery: garbage JSON is cleared and returns null', () => {
    mockStorage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, '{{bad json}}')

    const result = readPersistedWorkout()

    expect(result).toBeNull()
    expect(mockStorage._store.has(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)).toBe(
      false
    )
  })

  it('completed workout cleanup: isCompleted=true is cleared and returns null', () => {
    const state = createValidState({
      isCompleted: true,
      completedAt: Date.now()
    })
    mockStorage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(state))

    const result = readPersistedWorkout()

    expect(result).toBeNull()
    expect(mockStorage._store.has(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)).toBe(
      false
    )
  })

  it('mismatched workout: readPersistedWorkout returns state regardless of route', () => {
    const state = createValidState({
      programSlug: 'program-a',
      sessionIndex: 2
    })
    mockStorage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(state))

    const restored = readPersistedWorkout()

    expect(restored).toEqual(state)
    expect(restored!.programSlug).toBe('program-a')
    expect(restored!.sessionIndex).toBe(2)
  })

  it('preserves all exercise state through persist/restore cycle', () => {
    const state = createValidState({
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'Bench Press',
          sets: [
            {
              reps: 8,
              weight: 135,
              status: 'completed',
              confirmedReps: 8,
              confirmedWeight: 135
            },
            { reps: 10, weight: 130, status: 'active' }
          ]
        },
        {
          exerciseId: 'ex2',
          exerciseName: 'OHP',
          sets: [{ reps: 5, weight: 95, status: 'pending' }]
        }
      ],
      expandedExerciseIndex: 1,
      activeSetIndex: 0
    })
    mockStorage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(state))

    const restored = readPersistedWorkout()

    expect(restored!.exercises).toHaveLength(2)
    expect(restored!.exercises[0].sets[0].status).toBe('completed')
    expect(restored!.exercises[0].sets[0].confirmedReps).toBe(8)
    expect(restored!.exercises[0].sets[1].status).toBe('active')
    expect(restored!.exercises[1].exerciseName).toBe('OHP')
    expect(restored!.expandedExerciseIndex).toBe(1)
    expect(restored!.activeSetIndex).toBe(0)
  })

  it('state is preserved when readPersistedWorkout returns valid state', () => {
    const state = createValidState()
    mockStorage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(state))

    readPersistedWorkout()

    expect(mockStorage._store.has(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)).toBe(true)
  })
})
