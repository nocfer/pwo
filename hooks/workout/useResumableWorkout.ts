import { readPersistedWorkout } from '@/lib/workout-persistence'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'

/**
 * Summary of a resumable (persisted, in-progress) workout, shaped for the
 * Home "Pick up where you left off" hero. Derived from the persisted
 * WorkoutState without mutating it.
 */
export type ResumableWorkout = {
  programSlug: string
  sessionIndex: number
  sessionName: string
  currentExerciseName: string
  setNumber: number
  setCount: number
  completedSets: number
  totalSets: number
  minutesLeft: number
}

// Rough per-remaining-set estimate when no rest duration is configured.
const DEFAULT_REST_MS = 60_000
const WORK_PER_SET_MS = 40_000

function buildSummary(): ResumableWorkout | null {
  const state = readPersistedWorkout()
  if (!state) return null

  const exercise = state.exercises[state.expandedExerciseIndex]
  if (!exercise) return null

  let completedSets = 0
  let totalSets = 0
  for (const ex of state.exercises) {
    for (const set of ex.sets) {
      totalSets += 1
      if (set.status === 'completed' || set.status === 'skipped') {
        completedSets += 1
      }
    }
  }

  const remaining = Math.max(0, totalSets - completedSets)
  const restMs = exercise.restDurationMs ?? DEFAULT_REST_MS
  const minutesLeft = Math.max(
    1,
    Math.round((remaining * (restMs + WORK_PER_SET_MS)) / 60_000)
  )

  return {
    programSlug: state.programSlug,
    sessionIndex: state.sessionIndex,
    sessionName: state.sessionName,
    currentExerciseName: exercise.exerciseName,
    setNumber: state.activeSetIndex + 1,
    setCount: exercise.sets.length,
    completedSets,
    totalSets,
    minutesLeft
  }
}

/**
 * Returns the resumable workout summary (refreshed whenever Home regains
 * focus) plus a `resume()` action that navigates into the live session.
 * Replaces the previous auto-redirect-into-session behavior on Home.
 */
export function useResumableWorkout(): {
  workout: ResumableWorkout | null
  resume: () => void
} {
  const router = useRouter()
  const [workout, setWorkout] = useState<ResumableWorkout | null>(null)

  useFocusEffect(
    useCallback(() => {
      setWorkout(buildSummary())
    }, [])
  )

  const resume = useCallback(() => {
    if (!workout) return
    router.replace(
      `/programs/${workout.programSlug}/session/${workout.sessionIndex}`
    )
  }, [router, workout])

  return { workout, resume }
}
