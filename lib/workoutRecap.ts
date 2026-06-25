/**
 * Pure helpers for the Workout Session completion recap.
 *
 * PR detection: an exercise scores a PR when its top completed weight this
 * session beats the all-time best (max_weight) recorded before the session.
 * An unknown prior best (no record) is treated as "no PR" — matching the
 * prototype's conservative behavior.
 */

import type { ExerciseState } from '@/types/workout'
import { isTimedSet } from '@/types/workout'
import { formatClock, formatCount } from '@/lib/utils/format'

export type RecapRow = {
  exerciseId: string
  name: string
  detail: string
  isPR: boolean
}

export type WorkoutRecap = {
  timeStr: string
  setsCount: number
  volume: number
  totalSkipped: number
  rows: RecapRow[]
}

function topCompletedWeight(exercise: ExerciseState): number {
  return exercise.sets.reduce((max, s) => {
    if (s.status !== 'completed') return max
    const w = s.confirmedWeight ?? s.weight
    return w > max ? w : max
  }, 0)
}

/** Longest completed hold (seconds) for a timed exercise. */
function topCompletedHold(exercise: ExerciseState): number {
  return exercise.sets.reduce((max, s) => {
    if (s.status !== 'completed') return max
    const d = s.confirmedDurationSeconds ?? s.durationSeconds ?? 0
    return d > max ? d : max
  }, 0)
}

export function buildWorkoutRecap(
  exercises: ExerciseState[],
  elapsedMs: number,
  bestWeightById: Map<string, number>,
  /**
   * All-time best hold (seconds) per timed exercise, before this session.
   * Optional/empty until a duration-PR source exists; an unknown prior best is
   * treated as "no PR" — the same conservative rule as weight PRs.
   */
  bestDurationById?: Map<string, number>
): WorkoutRecap {
  let setsCount = 0
  let volume = 0
  let totalSkipped = 0

  const rows: RecapRow[] = exercises.map(ex => {
    const completed = ex.sets.filter(s => s.status === 'completed')
    const skipped = ex.sets.filter(s => s.status === 'skipped').length

    setsCount += completed.length
    totalSkipped += skipped

    // Timed exercises summarize and PR on the longest hold, not weight×reps.
    const timed = ex.sets.some(isTimedSet)

    let detail: string
    let isPR: boolean

    if (timed) {
      const topHold = topCompletedHold(ex)
      const best = bestDurationById?.get(ex.exerciseId)
      isPR = best !== undefined && topHold > best
      if (completed.length === 0) {
        detail = `${formatCount(skipped, 'set')} skipped`
      } else {
        detail =
          `${formatCount(completed.length, 'set')} · top ${formatClock(topHold * 1000)}` +
          (skipped ? ` · ${skipped} skipped` : '')
      }
    } else {
      const topW = topCompletedWeight(ex)
      for (const s of completed) {
        volume += (s.confirmedWeight ?? s.weight) * (s.confirmedReps ?? s.reps)
      }
      const best = bestWeightById.get(ex.exerciseId)
      isPR = best !== undefined && topW > best
      if (completed.length === 0) {
        detail = `${formatCount(skipped, 'set')} skipped`
      } else {
        detail =
          `${formatCount(completed.length, 'set')} · top ${topW} lb` +
          (skipped ? ` · ${skipped} skipped` : '')
      }
    }

    return { exerciseId: ex.exerciseId, name: ex.exerciseName, detail, isPR }
  })

  return {
    timeStr: formatClock(elapsedMs),
    setsCount,
    volume,
    totalSkipped,
    rows
  }
}
