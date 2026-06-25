/**
 * useActiveWorkoutSurface — cross-app selector for the global active-workout
 * surfaces (mini-bar, and later the iOS Live Activity / Android notification).
 *
 * The WorkoutExecutionProvider is scoped to the session route, so screens
 * outside it (e.g. the tab navigator) cannot read that React context. The
 * session persists WorkoutState to MMKV on every change, so MMKV is the shared
 * source of truth here: we read it reactively and, for +15s / Skip, apply the
 * existing pure workoutReducer to the persisted state and write it back — no
 * new reducer cases, no dependency on the provider being mounted.
 */

import { workoutReducer } from '@/context/workoutReducer'
import { storage } from '@/lib/mmkv'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { readPersistedWorkout } from '@/lib/workout-persistence'
import { consumePendingRestAction } from '@/modules/live-activity'
import type { WorkoutAction, WorkoutState } from '@/types/workout'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

export type ActiveWorkoutSurface = {
  /** Mini-bar is "resting" (cyan ring) when a rest timer is live, else "in progress" (lime). */
  variant: 'resting' | 'inProgress'
  programSlug: string
  sessionIndex: number
  sessionName: string
  exerciseName: string
  /** 1-based index of the active set within its exercise. */
  setNumber: number
  setCount: number
  /** Overall completed/total across the whole workout, 0..1. */
  progress: number
  /** Live rest countdown (resting variant). */
  remainingMs: number
  durationMs: number
  /** Live elapsed since workout start (in-progress variant). */
  elapsedMs: number
}

export type UseActiveWorkoutSurfaceReturn = {
  /** Null when no surface should be shown (no workout, completed, or invalid). */
  surface: ActiveWorkoutSurface | null
  extendRest: () => void
  skipRest: () => void
  openSession: () => void
}

function deriveCounts(state: WorkoutState): {
  completed: number
  total: number
} {
  let completed = 0
  let total = 0
  for (const ex of state.exercises) {
    for (const set of ex.sets) {
      total += 1
      if (set.status === 'completed' || set.status === 'skipped') completed += 1
    }
  }
  return { completed, total }
}

function buildSurface(
  state: WorkoutState,
  now: number
): ActiveWorkoutSurface | null {
  const exercise = state.exercises[state.expandedExerciseIndex]
  if (!exercise) return null

  const { restTimer } = state
  const remainingMs = restTimer.isActive
    ? Math.max(0, restTimer.startedAt + restTimer.durationMs - now)
    : 0
  // A rest timer can naturally run out while we're off the session screen (the
  // session's countdown loop that dismisses it isn't mounted). Treat remaining
  // <= 0 as "no longer resting" so the bar falls back to the in-progress face.
  const isResting = restTimer.isActive && remainingMs > 0

  const { completed, total } = deriveCounts(state)

  return {
    variant: isResting ? 'resting' : 'inProgress',
    programSlug: state.programSlug,
    sessionIndex: state.sessionIndex,
    sessionName: state.sessionName,
    exerciseName: exercise.exerciseName,
    setNumber: state.activeSetIndex + 1,
    setCount: exercise.sets.length,
    progress: total > 0 ? completed / total : 0,
    remainingMs,
    durationMs: restTimer.durationMs,
    elapsedMs: Math.max(0, now - state.startedAt)
  }
}

/** Apply a pure reducer action to the persisted workout and write it back. */
function mutatePersisted(action: WorkoutAction): void {
  const state = readPersistedWorkout()
  if (!state) return
  const next = workoutReducer(state, action)
  if (next === state) return
  storage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(next))
}

export function useActiveWorkoutSurface(): UseActiveWorkoutSurfaceReturn {
  const router = useRouter()
  const [state, setState] = useState<WorkoutState | null>(() =>
    readPersistedWorkout()
  )
  // A 1s tick drives the live countdown / elapsed without re-reading storage.
  const [now, setNow] = useState(() => Date.now())

  const refresh = useCallback(() => {
    setState(readPersistedWorkout())
    setNow(Date.now())
  }, [])

  // Refresh whenever the persisted workout changes (the session writes on every
  // reducer step; our own +15s / Skip writes land here too).
  useEffect(() => {
    const listener = storage.addOnValueChangedListener(key => {
      if (key === STORAGE_KEYS.WORKOUT_ACTIVE_STATE) refresh()
    })
    return () => listener.remove()
  }, [refresh])

  // Re-read on focus (a workout may have started/ended on another screen).
  useFocusEffect(refresh)

  // Tick once per second only while a workout exists, to advance the clocks.
  const hasWorkout = state != null && !state.isCompleted
  useEffect(() => {
    if (!hasWorkout) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [hasWorkout])

  const extendRest = useCallback(() => {
    mutatePersisted({ type: 'EXTEND_REST', now: Date.now() })
  }, [])

  const skipRest = useCallback(() => {
    mutatePersisted({ type: 'DISMISS_REST_TIMER' })
  }, [])

  // Reconcile actions taken from the lock screen / Dynamic Island / notification
  // while backgrounded: drain the queued +15s / Skip and apply it to persisted
  // state (no-op when the native module is absent).
  useEffect(() => {
    const apply = () => {
      const action = consumePendingRestAction()
      if (action === 'extend') extendRest()
      else if (action === 'skip') skipRest()
    }
    apply() // also handle the case where we mount already-foregrounded
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') apply()
    })
    return () => sub.remove()
  }, [extendRest, skipRest])

  const surfaceRef = useRef<ActiveWorkoutSurface | null>(null)
  surfaceRef.current =
    state && !state.isCompleted ? buildSurface(state, now) : null

  const openSession = useCallback(() => {
    const s = surfaceRef.current
    if (!s) return
    router.push(`/programs/${s.programSlug}/session/${s.sessionIndex}`)
  }, [router])

  return {
    surface: surfaceRef.current,
    extendRest,
    skipRest,
    openSession
  }
}
