/**
 * Pure helper functions for the workout reducer.
 * Extracted from workoutReducer.ts to keep file sizes under ~300 lines.
 */

import type { ExerciseSetState, ExerciseState } from '@/types/workout'

// ---------------------------------------------------------------------------
// Forward-scan helper (pure)
// ---------------------------------------------------------------------------

export function findNextPendingSet(
  exercises: ExerciseState[],
  currentExerciseIndex: number,
  currentSetIndex: number
): { exerciseIndex: number; setIndex: number } | null {
  const total = exercises.length
  if (total === 0) return null

  // 1. Check remaining sets in the current exercise
  const currentSets = exercises[currentExerciseIndex].sets
  for (let s = currentSetIndex + 1; s < currentSets.length; s++) {
    if (currentSets[s].status === 'pending') {
      return { exerciseIndex: currentExerciseIndex, setIndex: s }
    }
  }

  // 2. Forward scan through subsequent exercises, wrapping around
  for (let offset = 1; offset < total; offset++) {
    const eIdx = (currentExerciseIndex + offset) % total
    const sets = exercises[eIdx].sets
    for (let s = 0; s < sets.length; s++) {
      if (sets[s].status === 'pending') {
        return { exerciseIndex: eIdx, setIndex: s }
      }
    }
  }

  // 3. Check sets before currentSetIndex in the current exercise (full wrap)
  for (let s = 0; s <= currentSetIndex; s++) {
    if (currentSets[s].status === 'pending') {
      return { exerciseIndex: currentExerciseIndex, setIndex: s }
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Activate a specific or first-pending set in an exercise (pure)
// ---------------------------------------------------------------------------

export function activateInExercise(
  ex: ExerciseState,
  targetSetIndex?: number
): ExerciseState {
  if (targetSetIndex !== undefined) {
    const target = ex.sets[targetSetIndex]
    if (!target || target.status !== 'pending') return ex
    return {
      ...ex,
      sets: ex.sets.map((s, i) =>
        i === targetSetIndex ? { ...s, status: 'active' as const } : s
      )
    }
  }
  let activated = false
  return {
    ...ex,
    sets: ex.sets.map(s => {
      if (!activated && s.status === 'pending') {
        activated = true
        return { ...s, status: 'active' as const }
      }
      return s
    })
  }
}

// ---------------------------------------------------------------------------
// Revert any editing sets back to completed with original values (pure)
// ---------------------------------------------------------------------------

export function revertEditingSets(exercises: ExerciseState[]): ExerciseState[] {
  return exercises.map(ex => {
    const hasEditing = ex.sets.some(s => s.status === 'editing')
    if (!hasEditing) return ex
    return {
      ...ex,
      sets: ex.sets.map((s: ExerciseSetState) =>
        s.status === 'editing'
          ? {
              ...s,
              status: 'completed' as const,
              reps: s.confirmedReps ?? s.reps,
              weight: s.confirmedWeight ?? s.weight
            }
          : s
      )
    }
  })
}
