import { describe, expect, it, vi } from 'vitest'

// expo-keep-awake pulls in expo-modules-core (references __DEV__) on import —
// stub it so the module graph loads under the node test env.
vi.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: vi.fn(async () => {}),
  deactivateKeepAwake: vi.fn(async () => {})
}))

import { holdElapsedMs } from '@/hooks/workout/useHoldTimer'

// ---------------------------------------------------------------------------
// holdElapsedMs — pure count-up elapsed math (the core of useHoldTimer)
// ---------------------------------------------------------------------------

describe('holdElapsedMs', () => {
  it('returns only banked time when paused/stopped (not running)', () => {
    // segmentStart/now are ignored while not running.
    expect(holdElapsedMs(12_000, 5_000, 999_999, false)).toBe(12_000)
  })

  it('adds the live segment delta to banked time while running', () => {
    // banked 0, segment started at t=10s, now t=30s → 20s elapsed.
    expect(holdElapsedMs(0, 10_000, 30_000, true)).toBe(20_000)
  })

  it('accumulates across a pause/resume (banked + new live segment)', () => {
    // Held 8s, paused (banked=8s), resumed at t=100s, now t=105s → 13s total.
    expect(holdElapsedMs(8_000, 100_000, 105_000, true)).toBe(13_000)
  })

  it('is monotonic with wall-clock — backgrounding does not lose time', () => {
    const start = 1_000
    const a = holdElapsedMs(0, start, start + 2_000, true)
    // App backgrounded for 30s; on the next tick the delta reflects real time.
    const b = holdElapsedMs(0, start, start + 32_000, true)
    expect(a).toBe(2_000)
    expect(b).toBe(32_000)
    expect(b).toBeGreaterThan(a)
  })
})
