import { readPersistedWorkout } from '@/lib/workout-persistence'
import { useRouter, usePathname } from 'expo-router'
import { useEffect, useMemo, useRef } from 'react'

export function useActiveWorkoutRedirect(): { redirecting: boolean } {
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- synchronous MMKV check, only on mount
  const activeWorkout = useMemo(() => {
    if (pathname.includes('/session/')) return null
    return readPersistedWorkout()
  }, [])

  useEffect(() => {
    if (hasRedirected.current) return
    if (!activeWorkout) return

    hasRedirected.current = true
    router.replace(
      `/programs/${activeWorkout.programSlug}/session/${activeWorkout.sessionIndex}-v2`
    )
  }, [router, activeWorkout])

  return { redirecting: activeWorkout !== null && !hasRedirected.current }
}
