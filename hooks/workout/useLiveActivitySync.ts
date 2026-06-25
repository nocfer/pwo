/**
 * useLiveActivitySync — bridges the live WorkoutState to the iOS Live Activity
 * / Dynamic Island / Android notification. Mount once inside the session route
 * (within the provider).
 *
 * Lifecycle (per the handoff spec): start on workout start, update on rest
 * start / +15s and set advancement, end on workout complete. The native
 * countdown ticks itself from `restEndsAtMs`, so we only push on actual state
 * transitions — not every second.
 *
 * We deliberately do NOT end the activity when this hook unmounts: leaving the
 * session screen for a tab is exactly when the cross-app surface matters most,
 * so it must survive navigation and only end when the workout completes.
 */

import { selectActiveWorkout } from '@/lib/activeWorkout'
import {
  endLiveActivity,
  startLiveActivity,
  updateLiveActivity,
  type LiveActivityContent
} from '@/modules/live-activity'
import type { WorkoutState } from '@/types/workout'
import { useEffect, useRef } from 'react'
import { useWorkoutExecution } from './useWorkoutExecution'

function buildContent(state: WorkoutState): LiveActivityContent | null {
  const active = selectActiveWorkout(state, Date.now())
  if (!active) return null

  return {
    programName: state.sessionName,
    isResting: active.isResting,
    restEndsAtMs: active.restEndsAtMs,
    startedAtMs: state.startedAt,
    setNumber: active.setNumber,
    exerciseName: active.exercise.exerciseName,
    weight: active.set?.weight ?? 0,
    reps: active.set?.reps ?? 0
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
}
