import { storage } from '@/lib/mmkv'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { useEffect, useRef } from 'react'
import { useWorkoutExecution } from './useWorkoutExecution'

function generateSessionId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export function useWorkoutPersistence(): { sessionId: string } {
  const { state } = useWorkoutExecution()
  const sessionIdRef = useRef<string>('')

  if (sessionIdRef.current === '') {
    const hasActiveWorkout = storage.getString(
      STORAGE_KEYS.WORKOUT_ACTIVE_STATE
    )
    if (hasActiveWorkout) {
      const existing = storage.getString(STORAGE_KEYS.WORKOUT_SESSION_ID)
      sessionIdRef.current = existing ?? generateSessionId()
    } else {
      sessionIdRef.current = generateSessionId()
    }
  }

  useEffect(() => {
    storage.set(STORAGE_KEYS.WORKOUT_SESSION_ID, sessionIdRef.current)
  }, [])

  useEffect(() => {
    if (state.isCompleted) {
      storage.remove(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)
      return
    }
    storage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(state))
  }, [state])

  return { sessionId: sessionIdRef.current }
}
