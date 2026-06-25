/**
 * useLiveActivitySync — bridges the live WorkoutState to the iOS Live Activity
 * / Dynamic Island. Mount once inside the session route (within the provider).
 *
 * Lifecycle (per the handoff spec): start on workout start, update on rest
 * start / +15s and set advancement, end on workout complete / unmount. The
 * native countdown ticks itself from `restEndsAtMs`, so we only push on actual
 * state transitions — not every second.
 */

import {
  endLiveActivity,
  startLiveActivity,
  updateLiveActivity,
  type LiveActivityContent
} from '@/modules/live-activity'
import { useEffect, useRef } from 'react'
import { useWorkoutExecution } from './useWorkoutExecution'

function buildContent(
  state: ReturnType<typeof useWorkoutExecution>['state']
): LiveActivityContent | null {
  const exercise = state.exercises[state.expandedExerciseIndex]
  if (!exercise) return null
  const set = exercise.sets[state.activeSetIndex]

  const { restTimer } = state
  const restEndsAtMs = restTimer.isActive
    ? restTimer.startedAt + restTimer.durationMs
    : 0

  return {
    programName: state.sessionName,
    isResting: restTimer.isActive && restEndsAtMs > Date.now(),
    restEndsAtMs,
    startedAtMs: state.startedAt,
    setNumber: state.activeSetIndex + 1,
    exerciseName: exercise.exerciseName,
    weight: set?.weight ?? 0,
    reps: set?.reps ?? 0
  }
}

export function useLiveActivitySync(): void {
  const { state } = useWorkoutExecution()
  const startedRef = useRef(false)

  // Start once when a live workout first appears; end on completion.
  useEffect(() => {
    if (state.isCompleted) {
      if (startedRef.current) {
        endLiveActivity()
        startedRef.current = false
      }
      return
    }
    const content = buildContent(state)
    if (!content) return
    if (!startedRef.current) {
      startLiveActivity(content)
      startedRef.current = true
    } else {
      updateLiveActivity(content)
    }
    // buildContent reads many fields; re-run on any reducer change (cheap, and
    // never misses a rest-start / +15s / set-advance transition).
  }, [state])

  // End the activity if the session route unmounts mid-workout (e.g. the user
  // ends the workout via a path that just navigates away).
  useEffect(() => {
    return () => {
      if (startedRef.current) {
        endLiveActivity()
        startedRef.current = false
      }
    }
  }, [])
}
