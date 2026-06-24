import { beforeEach, describe, expect, it, vi } from 'vitest'

import { readPersistedWorkout } from '@/lib/workout-persistence'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import type { WorkoutState } from '@/types/workout'

const mockStorage = vi.hoisted(() => ({
  set: vi.fn(),
  getString: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn()
}))

vi.mock('@/lib/mmkv', () => ({
  storage: mockStorage
}))

function createValidState(overrides?: Partial<WorkoutState>): WorkoutState {
  return {
    workoutId: 'w-123',
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

describe('readPersistedWorkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when no persisted state exists', () => {
    mockStorage.getString.mockReturnValue(undefined)

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).not.toHaveBeenCalled()
  })

  it('returns valid WorkoutState when JSON is valid and isCompleted is false', () => {
    const state = createValidState()
    mockStorage.getString.mockReturnValue(JSON.stringify(state))

    const result = readPersistedWorkout()

    expect(result).toEqual(state)
    expect(mockStorage.remove).not.toHaveBeenCalled()
  })

  it('returns null and clears MMKV when JSON is corrupted/unparseable', () => {
    mockStorage.getString.mockReturnValue('{{bad json}}}')

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
  })

  it('returns null and clears MMKV when isCompleted is true', () => {
    const state = createValidState({
      isCompleted: true,
      completedAt: Date.now()
    })
    mockStorage.getString.mockReturnValue(JSON.stringify(state))

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
  })

  it('returns null and clears MMKV when workoutId is missing', () => {
    const state = createValidState()
    const json = JSON.stringify({ ...state, workoutId: '' })
    mockStorage.getString.mockReturnValue(json)

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
  })

  it('returns null and clears MMKV when programSlug is missing', () => {
    const state = createValidState()
    const json = JSON.stringify({ ...state, programSlug: '' })
    mockStorage.getString.mockReturnValue(json)

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
  })

  it('returns null and clears MMKV when exercises is empty array', () => {
    const state = createValidState({ exercises: [] })
    mockStorage.getString.mockReturnValue(JSON.stringify(state))

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
  })

  it('returns null and clears MMKV when startedAt is 0', () => {
    const state = createValidState({ startedAt: 0 })
    mockStorage.getString.mockReturnValue(JSON.stringify(state))

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
  })

  it('returns null and clears MMKV when startedAt is negative', () => {
    const state = createValidState({ startedAt: -100 })
    mockStorage.getString.mockReturnValue(JSON.stringify(state))

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
  })

  it('returns null and clears MMKV when sessionIndex is not a number', () => {
    const state = createValidState()
    const raw = { ...state, sessionIndex: 'abc' }
    mockStorage.getString.mockReturnValue(JSON.stringify(raw))

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
  })

  it('returns null and clears MMKV when sessionName is missing', () => {
    const state = createValidState()
    const json = JSON.stringify({ ...state, sessionName: '' })
    mockStorage.getString.mockReturnValue(json)

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
  })

  it('returns null and clears MMKV when exercises is null', () => {
    const state = createValidState()
    const json = JSON.stringify({ ...state, exercises: null })
    mockStorage.getString.mockReturnValue(json)

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
  })

  it('returns null and clears MMKV when an exercise is missing exerciseId', () => {
    const state = createValidState({
      exercises: [
        {
          exerciseId: '',
          exerciseName: 'Bench Press',
          sets: [{ reps: 8, weight: 135, status: 'active' }]
        }
      ]
    })
    mockStorage.getString.mockReturnValue(JSON.stringify(state))

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
  })

  it('returns null and clears MMKV when an exercise is missing exerciseName', () => {
    const state = createValidState({
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: '',
          sets: [{ reps: 8, weight: 135, status: 'active' }]
        }
      ]
    })
    mockStorage.getString.mockReturnValue(JSON.stringify(state))

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
  })

  it('returns null and clears MMKV when an exercise has empty sets array', () => {
    const state = createValidState({
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'Bench Press',
          sets: []
        }
      ]
    })
    mockStorage.getString.mockReturnValue(JSON.stringify(state))

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
  })

  it('returns null when getString returns empty string', () => {
    mockStorage.getString.mockReturnValue('')

    expect(readPersistedWorkout()).toBeNull()
    expect(mockStorage.remove).not.toHaveBeenCalled()
  })
})
