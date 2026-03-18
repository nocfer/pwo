import { useEffect, useRef, useState } from 'react'

type UseElapsedTimerOptions = {
  startedAt: number
  isCompleted?: boolean
  completedAt?: number | null
  now?: () => number
}

export function useElapsedTimer({
  startedAt,
  isCompleted = false,
  completedAt = null,
  now
}: UseElapsedTimerOptions): { elapsedMs: number } {
  const nowRef = useRef(now ?? Date.now)
  nowRef.current = now ?? Date.now

  const frozenMs =
    isCompleted && completedAt != null
      ? Math.max(0, completedAt - startedAt)
      : null

  const [elapsedMs, setElapsedMs] = useState<number>(
    frozenMs ?? Math.max(0, nowRef.current() - startedAt)
  )
  const lastSecondRef = useRef(-1)

  useEffect(() => {
    if (frozenMs != null) {
      setElapsedMs(frozenMs)
      return
    }

    let rafId: number
    const tick = () => {
      const ms = Math.max(0, nowRef.current() - startedAt)
      const second = Math.floor(ms / 1000)
      if (second !== lastSecondRef.current) {
        setElapsedMs(ms)
        lastSecondRef.current = second
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [startedAt, frozenMs])

  return { elapsedMs }
}
