import { haptics } from '@/lib/haptics'
import {
  cancelRestTimerNotification,
  requestNotificationPermission,
  scheduleRestTimerNotification
} from '@/lib/notifications'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkoutExecution } from './useWorkoutExecution'

type UseRestTimerOptions = {
  now?: () => number
}

type UseRestTimerReturn = {
  remainingMs: number
  isActive: boolean
  dismiss: () => void
}

export function useRestTimer(
  options?: UseRestTimerOptions
): UseRestTimerReturn {
  const { state, dismissRestTimer } = useWorkoutExecution()
  const { restTimer } = state

  const nowRef = useRef(options?.now ?? Date.now)
  nowRef.current = options?.now ?? Date.now

  const notificationIdRef = useRef<string | null>(null)
  const permissionRequestedRef = useRef(false)
  const didFireFinishRef = useRef(false)

  const computeRemaining = useCallback(() => {
    if (!restTimer.isActive) return 0
    return Math.max(
      0,
      restTimer.startedAt + restTimer.durationMs - nowRef.current()
    )
  }, [restTimer.isActive, restTimer.startedAt, restTimer.durationMs])

  const [remainingMs, setRemainingMs] = useState(computeRemaining)
  const lastSecondRef = useRef(-1)

  // Request notification permission once
  useEffect(() => {
    if (permissionRequestedRef.current) return
    permissionRequestedRef.current = true
    requestNotificationPermission()
  }, [])

  // Schedule/cancel notification when timer starts/stops
  useEffect(() => {
    if (restTimer.isActive) {
      didFireFinishRef.current = false
      const remaining =
        restTimer.startedAt + restTimer.durationMs - nowRef.current()
      if (remaining > 0) {
        scheduleRestTimerNotification(remaining).then(id => {
          notificationIdRef.current = id
        })
      }
    } else {
      if (notificationIdRef.current) {
        cancelRestTimerNotification(notificationIdRef.current)
        notificationIdRef.current = null
      }
    }
  }, [restTimer.isActive, restTimer.startedAt, restTimer.durationMs])

  // Countdown loop
  useEffect(() => {
    if (!restTimer.isActive) {
      setRemainingMs(0)
      lastSecondRef.current = -1
      return
    }

    const ms = computeRemaining()
    if (ms <= 0 && !didFireFinishRef.current) {
      didFireFinishRef.current = true
      setRemainingMs(0)
      haptics.restTimerFinished()
      if (notificationIdRef.current) {
        cancelRestTimerNotification(notificationIdRef.current)
        notificationIdRef.current = null
      }
      dismissRestTimer()
      return
    }

    let rafId: number
    const tick = () => {
      const current = computeRemaining()
      if (current <= 0 && !didFireFinishRef.current) {
        didFireFinishRef.current = true
        setRemainingMs(0)
        haptics.restTimerFinished()
        if (notificationIdRef.current) {
          cancelRestTimerNotification(notificationIdRef.current)
          notificationIdRef.current = null
        }
        dismissRestTimer()
        return
      }
      const second = Math.floor(current / 1000)
      if (second !== lastSecondRef.current) {
        setRemainingMs(current)
        lastSecondRef.current = second
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [
    restTimer.isActive,
    restTimer.startedAt,
    restTimer.durationMs,
    computeRemaining,
    dismissRestTimer
  ])

  // Clean up notification on unmount
  useEffect(() => {
    return () => {
      if (notificationIdRef.current) {
        cancelRestTimerNotification(notificationIdRef.current)
      }
    }
  }, [])

  const dismiss = useCallback(() => {
    if (notificationIdRef.current) {
      cancelRestTimerNotification(notificationIdRef.current)
      notificationIdRef.current = null
    }
    dismissRestTimer()
  }, [dismissRestTimer])

  return {
    remainingMs,
    isActive: restTimer.isActive,
    dismiss
  }
}
