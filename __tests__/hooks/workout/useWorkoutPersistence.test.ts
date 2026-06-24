import type { WorkoutState } from '@/types/workout'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { STORAGE_KEYS } from '@/lib/storage-keys'
import { useWorkoutPersistence } from '@/hooks/workout/useWorkoutPersistence'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockStorage = vi.hoisted(() => ({
  set: vi.fn(),
  getString: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn()
}))

const stateHolder = vi.hoisted(() => ({
  current: null as WorkoutState | null
}))

const effectCbs = vi.hoisted(() => ({
  list: [] as (() => void | (() => void))[]
}))

const refs = vi.hoisted(() => ({
  map: new Map<number, { current: unknown }>(),
  counter: 0
}))

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/mmkv', () => ({
  storage: mockStorage
}))

vi.mock('@/hooks/workout/useWorkoutExecution', () => ({
  useWorkoutExecution: () => ({
    state: stateHolder.current
  })
}))

vi.mock('react', () => ({
  useEffect: (cb: () => void | (() => void)) => {
    effectCbs.list.push(cb)
    cb()
  },
  useRef: (initial: unknown) => {
    const idx = refs.counter++
    if (!refs.map.has(idx)) {
      refs.map.set(idx, { current: initial })
    }
    return refs.map.get(idx)!
  }
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockState(overrides?: Partial<WorkoutState>): WorkoutState {
  return {
    workoutId: 'test-workout',
    programSlug: 'test-program',
    sessionIndex: 0,
    sessionName: 'Test Session',
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
    startedAt: Date.now(),
    completedAt: null,
    isCompleted: false,
    ...overrides
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useWorkoutPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stateHolder.current = createMockState()
    refs.counter = 0
    refs.map.clear()
    effectCbs.list.length = 0
  })

  it('writes initial state to MMKV on mount', () => {
    useWorkoutPersistence()

    expect(mockStorage.set).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE,
      JSON.stringify(stateHolder.current)
    )
  })

  it('uses correct storage key for active state', () => {
    useWorkoutPersistence()

    const calls = mockStorage.set.mock.calls
    const activeStateCall = calls.find(
      (c: unknown[]) => c[0] === STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
    expect(activeStateCall).toBeDefined()
  })

  it('serializes full WorkoutState as JSON string', () => {
    useWorkoutPersistence()

    const calls = mockStorage.set.mock.calls
    const activeStateCall = calls.find(
      (c: unknown[]) => c[0] === STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
    expect(activeStateCall![1]).toBe(JSON.stringify(stateHolder.current))
    const parsed = JSON.parse(activeStateCall![1] as string)
    expect(parsed.workoutId).toBe('test-workout')
    expect(parsed.exercises).toHaveLength(1)
    expect(parsed.isCompleted).toBe(false)
  })

  it('generates and stores session ID on mount', () => {
    useWorkoutPersistence()

    const sessionIdCall = mockStorage.set.mock.calls.find(
      (c: unknown[]) => c[0] === STORAGE_KEYS.WORKOUT_SESSION_ID
    )
    expect(sessionIdCall).toBeDefined()
    expect(typeof sessionIdCall![1]).toBe('string')
    expect((sessionIdCall![1] as string).length).toBeGreaterThan(0)
  })

  it('returns sessionId string from hook', () => {
    const result = useWorkoutPersistence()

    expect(typeof result.sessionId).toBe('string')
    expect(result.sessionId.length).toBeGreaterThan(0)
  })

  it('removes WORKOUT_ACTIVE_STATE when isCompleted is true', () => {
    stateHolder.current = createMockState({
      isCompleted: true,
      completedAt: Date.now()
    })

    useWorkoutPersistence()

    expect(mockStorage.remove).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
  })

  it('does NOT remove WORKOUT_SESSION_ID on completion', () => {
    stateHolder.current = createMockState({
      isCompleted: true,
      completedAt: Date.now()
    })

    useWorkoutPersistence()

    const removeSessionIdCall = mockStorage.remove.mock.calls.find(
      (c: unknown[]) => c[0] === STORAGE_KEYS.WORKOUT_SESSION_ID
    )
    expect(removeSessionIdCall).toBeUndefined()
  })

  it('does NOT write active state when workout is completed', () => {
    stateHolder.current = createMockState({
      isCompleted: true,
      completedAt: Date.now()
    })

    useWorkoutPersistence()

    const activeStateSetCall = mockStorage.set.mock.calls.find(
      (c: unknown[]) => c[0] === STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
    expect(activeStateSetCall).toBeUndefined()
  })

  it('preserves existing session ID from MMKV on resume (active state exists)', () => {
    const existingId = 'existing-session-id-abc'
    mockStorage.getString.mockImplementation((key: string) => {
      if (key === STORAGE_KEYS.WORKOUT_ACTIVE_STATE) return '{"some":"state"}'
      if (key === STORAGE_KEYS.WORKOUT_SESSION_ID) return existingId
      return undefined
    })

    const result = useWorkoutPersistence()

    expect(result.sessionId).toBe(existingId)
  })

  it('generates new session ID on fresh start even if old session ID exists in MMKV', () => {
    mockStorage.getString.mockImplementation((key: string) => {
      if (key === STORAGE_KEYS.WORKOUT_SESSION_ID) return 'stale-old-id'
      return undefined
    })

    const result = useWorkoutPersistence()

    expect(result.sessionId).not.toBe('stale-old-id')
    expect(result.sessionId.length).toBeGreaterThan(0)
  })

  it('generates new session ID when MMKV has no existing session ID', () => {
    mockStorage.getString.mockReturnValue(undefined)

    const result = useWorkoutPersistence()

    expect(result.sessionId).toBeTruthy()
    expect(result.sessionId.length).toBeGreaterThan(0)
  })

  it('writes updated state on subsequent state changes', () => {
    useWorkoutPersistence()
    vi.clearAllMocks()

    const updatedState = createMockState({
      expandedExerciseIndex: 1,
      activeSetIndex: 2
    })
    stateHolder.current = updatedState

    refs.counter = 0
    useWorkoutPersistence()

    expect(mockStorage.set).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE,
      JSON.stringify(updatedState)
    )
  })
})
