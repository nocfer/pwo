import { formatClock } from '@/lib/utils/format'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useEffect } from 'react'
import { useElapsedTimer } from '@/hooks/workout/useElapsedTimer'

vi.mock('react', () => ({
  useState: vi.fn((initial: number) => [initial, vi.fn()]),
  useRef: (initial: unknown) => ({ current: initial }),
  useEffect: vi.fn()
}))

// ---------------------------------------------------------------------------
// formatClock — pure function tests
// ---------------------------------------------------------------------------

describe('formatClock', () => {
  it('formats 0ms as "0:00"', () => {
    expect(formatClock(0)).toBe('0:00')
  })

  it('formats 5 seconds as "0:05"', () => {
    expect(formatClock(5000)).toBe('0:05')
  })

  it('formats 65 seconds as "1:05"', () => {
    expect(formatClock(65000)).toBe('1:05')
  })

  it('formats 605 seconds as "10:05"', () => {
    expect(formatClock(605000)).toBe('10:05')
  })

  it('formats 3661 seconds as "1:01:01"', () => {
    expect(formatClock(3661000)).toBe('1:01:01')
  })

  it('formats exactly 1 hour as "1:00:00"', () => {
    expect(formatClock(3600000)).toBe('1:00:00')
  })

  it('formats 59:59 correctly', () => {
    expect(formatClock(3599000)).toBe('59:59')
  })

  it('handles sub-second values by truncating to seconds', () => {
    expect(formatClock(1500)).toBe('0:01')
    expect(formatClock(999)).toBe('0:00')
  })

  it('treats negative values as 0:00', () => {
    expect(formatClock(-5000)).toBe('0:00')
  })
})

// ---------------------------------------------------------------------------
// useElapsedTimer — hook tests (mocked React, verifies hook behavior)
// ---------------------------------------------------------------------------

describe('useElapsedTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes elapsed from now() - startedAt for active workouts', () => {
    const result = useElapsedTimer({ startedAt: 1000, now: () => 6000 })
    expect(result.elapsedMs).toBe(5000)
  })

  it('freezes at completedAt - startedAt when workout is completed', () => {
    const result = useElapsedTimer({
      startedAt: 1000,
      isCompleted: true,
      completedAt: 61000
    })
    expect(result.elapsedMs).toBe(60000)
  })

  it('clamps elapsed to 0 when now() is before startedAt', () => {
    const result = useElapsedTimer({ startedAt: 5000, now: () => 3000 })
    expect(result.elapsedMs).toBe(0)
  })

  it('freezes at 0 when completedAt equals startedAt', () => {
    const result = useElapsedTimer({
      startedAt: 1000,
      isCompleted: true,
      completedAt: 1000
    })
    expect(result.elapsedMs).toBe(0)
  })

  it('uses injected now() function for elapsed computation', () => {
    const result = useElapsedTimer({ startedAt: 0, now: () => 10000 })
    expect(result.elapsedMs).toBe(10000)
  })

  it('registers a useEffect for the rAF timer loop', () => {
    useElapsedTimer({ startedAt: 0, now: () => 5000 })
    expect(useEffect).toHaveBeenCalled()
  })

  it('does not clamp completed elapsed time (allows full duration)', () => {
    const result = useElapsedTimer({
      startedAt: 0,
      isCompleted: true,
      completedAt: 7200000
    })
    expect(result.elapsedMs).toBe(7200000)
    expect(formatClock(result.elapsedMs)).toBe('2:00:00')
  })
})
