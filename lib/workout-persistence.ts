import { storage } from '@/lib/mmkv'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import type { WorkoutState } from '@/types/workout'

export function readPersistedWorkout(): WorkoutState | null {
  const json = storage.getString(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)
  if (!json) return null

  try {
    const parsed = JSON.parse(json) as WorkoutState

    if (
      !parsed.workoutId ||
      !parsed.programSlug ||
      !parsed.sessionName ||
      typeof parsed.sessionIndex !== 'number' ||
      !Array.isArray(parsed.exercises) ||
      parsed.exercises.length === 0 ||
      typeof parsed.startedAt !== 'number' ||
      parsed.startedAt <= 0
    ) {
      storage.remove(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)
      return null
    }

    const hasInvalidExercise = parsed.exercises.some(
      ex =>
        !ex.exerciseId ||
        !ex.exerciseName ||
        !Array.isArray(ex.sets) ||
        ex.sets.length === 0
    )
    if (hasInvalidExercise) {
      storage.remove(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)
      return null
    }

    if (parsed.isCompleted) {
      storage.remove(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)
      return null
    }

    return parsed
  } catch {
    storage.remove(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)
    return null
  }
}
