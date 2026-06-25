/**
 * useHoldTimer — drives a single timed-exercise hold. The count-up counterpart
 * to {@link useRestTimer}: instead of counting a fixed rest down to zero, it
 * counts elapsed hold time *up* toward a target and auto-completes when reached.
 *
 * Unlike useRestTimer (whose state lives in the reducer so it survives remount),
 * a hold is transient local state — a hold is short and the session screen stays
 * mounted for its duration. Elapsed time is derived from wall-clock timestamps,
 * not tick counts, so it stays accurate across app backgrounding.
 *
 * Haptics are intentionally NOT fired here: the owning session fires the success
 * pop + completion cue in its `onComplete` handler (mirroring how the session's
 * log handler — not SetRow — owns the confirm haptic). Keeps this hook pure and
 * trivially testable via an injectable `now()`.
 */

import {
  activateKeepAwakeAsync,
  deactivateKeepAwake
} from 'expo-keep-awake'
import { useCallback, useEffect, useRef, useState } from 'react'

const KEEP_AWAKE_TAG = 'workout-hold-timer'

/** Why the hold finished — auto-complete at target vs. user tapped Done early. */
export type HoldCompletionReason = 'target' | 'manual'

/**
 * Pure elapsed-time math for a hold. Elapsed = time banked across previous
 * (paused) segments plus, while running, the live wall-clock delta of the
 * current segment. Timestamp-based so it stays correct across backgrounding.
 */
export function holdElapsedMs(
  bankedMs: number,
  segmentStartedAt: number,
  now: number,
  running: boolean
): number {
  return running ? bankedMs + (now - segmentStartedAt) : bankedMs
}

type UseHoldTimerOptions = {
  /** Target hold in seconds; auto-completes when elapsed reaches it. */
  targetSeconds: number
  /** Fired once when the hold completes (auto at target, or manual/Done early). */
  onComplete: (heldSeconds: number, reason: HoldCompletionReason) => void
  /** Injectable clock for deterministic tests (defaults to Date.now). */
  now?: () => number
}

type UseHoldTimerReturn = {
  elapsedMs: number
  isRunning: boolean
  isPaused: boolean
  /** Begin the hold from zero. */
  start: () => void
  /** Freeze the hold, banking elapsed time. */
  pause: () => void
  /** Resume a paused hold. */
  resume: () => void
  /** Finish the hold now (Done early), logging the actual elapsed seconds. */
  done: () => void
}

export function useHoldTimer(options: UseHoldTimerOptions): UseHoldTimerReturn {
  const { targetSeconds, onComplete } = options

  const nowRef = useRef(options.now ?? Date.now)
  nowRef.current = options.now ?? Date.now

  // Latest onComplete without re-arming the tick loop when the callback
  // identity changes between renders.
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Time banked across previous (paused) segments, plus the timestamp the
  // current running segment began. elapsed = banked + (running ? now - start : 0).
  const bankedMsRef = useRef(0)
  const segmentStartRef = useRef(0)
  const completedRef = useRef(false)

  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const lastSecondRef = useRef(-1)

  const targetMs = Math.max(0, targetSeconds * 1000)

  const computeElapsed = useCallback(() => {
    return holdElapsedMs(
      bankedMsRef.current,
      segmentStartRef.current,
      nowRef.current(),
      isRunning
    )
  }, [isRunning])

  const setKeepAwake = useCallback((on: boolean) => {
    if (on) {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {})
    } else {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {})
    }
  }, [])

  // Shared finish path for both auto-complete and Done early.
  const finish = useCallback(
    (heldMs: number, reason: HoldCompletionReason) => {
      if (completedRef.current) return
      completedRef.current = true
      bankedMsRef.current = heldMs
      setIsRunning(false)
      setIsPaused(false)
      setElapsedMs(heldMs)
      setKeepAwake(false)
      onCompleteRef.current(Math.round(heldMs / 1000), reason)
    },
    [setKeepAwake]
  )

  const start = useCallback(() => {
    completedRef.current = false
    bankedMsRef.current = 0
    segmentStartRef.current = nowRef.current()
    lastSecondRef.current = -1
    setElapsedMs(0)
    setIsPaused(false)
    setIsRunning(true)
    setKeepAwake(true)
  }, [setKeepAwake])

  const pause = useCallback(() => {
    if (!isRunning) return
    bankedMsRef.current += nowRef.current() - segmentStartRef.current
    setIsRunning(false)
    setIsPaused(true)
    setElapsedMs(bankedMsRef.current)
    setKeepAwake(false)
  }, [isRunning, setKeepAwake])

  const resume = useCallback(() => {
    if (isRunning || completedRef.current) return
    segmentStartRef.current = nowRef.current()
    lastSecondRef.current = -1
    setIsPaused(false)
    setIsRunning(true)
    setKeepAwake(true)
  }, [isRunning, setKeepAwake])

  const done = useCallback(() => {
    finish(computeElapsed(), 'manual')
  }, [finish, computeElapsed])

  // Count-up loop: ticks per animation frame, updates the label once per second,
  // and auto-completes the moment elapsed reaches the target.
  useEffect(() => {
    if (!isRunning) return

    let rafId: number
    const tick = () => {
      const current = computeElapsed()
      if (current >= targetMs) {
        // Log the exact target on auto-complete (not the rAF-overshot value).
        finish(targetMs, 'target')
        return
      }
      const second = Math.floor(current / 1000)
      if (second !== lastSecondRef.current) {
        setElapsedMs(current)
        lastSecondRef.current = second
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isRunning, targetMs, computeElapsed, finish])

  // Release the wake lock if the hold is torn down mid-flight (e.g. navigation).
  useEffect(() => {
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {})
    }
  }, [])

  return { elapsedMs, isRunning, isPaused, start, pause, resume, done }
}
