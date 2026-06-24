import { beforeEach, describe, expect, it, vi } from 'vitest'

import { haptics } from '@/lib/haptics'
import { useRestTimer } from '@/hooks/workout/useRestTimer'

const mockDismissRestTimer = vi.fn()
const mockStartRestTimer = vi.fn()
let mockState = {
  restTimer: { isActive: false, startedAt: 0, durationMs: 0 },
  exercises: [],
  expandedExerciseIndex: 0,
  startedAt: 0,
  isCompleted: false,
  sessionId: 'test',
  programSlug: 'test',
  sessionIndex: 0,
  sessionName: 'Test'
}

vi.mock('@/hooks/workout/useWorkoutExecution', () => ({
  useWorkoutExecution: () => ({
    state: mockState,
    dismissRestTimer: mockDismissRestTimer,
    startRestTimer: mockStartRestTimer,
    expandExercise: vi.fn(),
    editSet: vi.fn(),
    confirmSet: vi.fn(),
    skipSet: vi.fn()
  })
}))

vi.mock('@/lib/haptics', () => ({
  haptics: {
    restTimerFinished: vi.fn()
  }
}))

vi.mock('@/lib/notifications', () => ({
  scheduleRestTimerNotification: vi.fn(async () => 'notif-123'),
  cancelRestTimerNotification: vi.fn(async () => {}),
  requestNotificationPermission: vi.fn(async () => true)
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useState: vi.fn((initial: unknown) => {
      if (typeof initial === 'function') {
        return [(initial as () => unknown)(), vi.fn()]
      }
      return [initial, vi.fn()]
    }),
    useRef: (initial: unknown) => ({ current: initial }),
    useEffect: vi.fn(),
    useCallback: (fn: unknown) => fn
  }
})

describe('useRestTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState = {
      restTimer: { isActive: false, startedAt: 0, durationMs: 0 },
      exercises: [],
      expandedExerciseIndex: 0,
      startedAt: 0,
      isCompleted: false,
      sessionId: 'test',
      programSlug: 'test',
      sessionIndex: 0,
      sessionName: 'Test'
    }
  })

  it('returns isActive: false and remainingMs: 0 when no timer is active', () => {
    const result = useRestTimer()
    expect(result.isActive).toBe(false)
    expect(result.remainingMs).toBe(0)
  })

  it('computes correct remainingMs from absolute timestamps', () => {
    mockState.restTimer = {
      isActive: true,
      startedAt: 10000,
      durationMs: 60000
    }
    const result = useRestTimer({ now: () => 30000 })
    expect(result.remainingMs).toBe(40000)
  })

  it('returns isActive: true when timer is active', () => {
    mockState.restTimer = {
      isActive: true,
      startedAt: 10000,
      durationMs: 60000
    }
    const result = useRestTimer({ now: () => 30000 })
    expect(result.isActive).toBe(true)
  })

  it('clamps remainingMs to 0 when timer is expired', () => {
    mockState.restTimer = {
      isActive: true,
      startedAt: 10000,
      durationMs: 60000
    }
    const result = useRestTimer({ now: () => 80000 })
    expect(result.remainingMs).toBe(0)
  })

  it('provides a dismiss function that calls dismissRestTimer', () => {
    const result = useRestTimer()
    result.dismiss()
    expect(mockDismissRestTimer).toHaveBeenCalled()
  })

  it('injectable now() function works for deterministic testing', () => {
    mockState.restTimer = {
      isActive: true,
      startedAt: 0,
      durationMs: 120000
    }
    const result1 = useRestTimer({ now: () => 60000 })
    expect(result1.remainingMs).toBe(60000)

    mockState.restTimer = {
      isActive: true,
      startedAt: 0,
      durationMs: 120000
    }
    const result2 = useRestTimer({ now: () => 90000 })
    expect(result2.remainingMs).toBe(30000)
  })

  it('haptics.restTimerFinished exists and is callable', () => {
    expect(typeof haptics.restTimerFinished).toBe('function')
    haptics.restTimerFinished()
    expect(haptics.restTimerFinished).toHaveBeenCalled()
  })
})
