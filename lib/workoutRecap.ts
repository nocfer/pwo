/**
 * Pure helpers for the Workout Session completion recap.
 *
 * PR detection: an exercise scores a PR when its top completed weight this
 * session beats the all-time best (max_weight) recorded before the session.
 * An unknown prior best (no record) is treated as "no PR" — matching the
 * prototype's conservative behavior.
 */

import type { ExerciseState } from '@/types/workout'

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

export function formatRecapTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad2 = (n: number) => String(n).padStart(2, '0')
  if (hours > 0) return `${hours}:${pad2(minutes)}:${pad2(seconds)}`
  return `${minutes}:${pad2(seconds)}`
}

function topCompletedWeight(exercise: ExerciseState): number {
  return exercise.sets.reduce((max, s) => {
    if (s.status !== 'completed') return max
    const w = s.confirmedWeight ?? s.weight
    return w > max ? w : max
  }, 0)
}

export function buildWorkoutRecap(
  exercises: ExerciseState[],
  elapsedMs: number,
  bestWeightById: Map<string, number>
): WorkoutRecap {
  let setsCount = 0
  let volume = 0
  let totalSkipped = 0

  const rows: RecapRow[] = exercises.map(ex => {
    const completed = ex.sets.filter(s => s.status === 'completed')
    const skipped = ex.sets.filter(s => s.status === 'skipped').length
    const topW = topCompletedWeight(ex)

    setsCount += completed.length
    totalSkipped += skipped
    for (const s of completed) {
      volume += (s.confirmedWeight ?? s.weight) * (s.confirmedReps ?? s.reps)
    }

    const best = bestWeightById.get(ex.exerciseId)
    const isPR = best !== undefined && topW > best

    let detail: string
    if (completed.length === 0) {
      detail = `${skipped} ${skipped === 1 ? 'set' : 'sets'} skipped`
    } else {
      detail =
        `${completed.length} ${completed.length === 1 ? 'set' : 'sets'} · top ${topW} lb` +
        (skipped ? ` · ${skipped} skipped` : '')
    }

    return { exerciseId: ex.exerciseId, name: ex.exerciseName, detail, isPR }
  })

  return {
    timeStr: formatRecapTime(elapsedMs),
    setsCount,
    volume,
    totalSkipped,
    rows
  }
}
