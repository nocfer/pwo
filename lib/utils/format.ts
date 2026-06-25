/**
 * Formatting utility functions
 */

import type { ProgramBlock } from '@/types'

/**
 * Format seconds into M:SS format (e.g., "5:30")
 */
export function formatTime(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Parse an "M:SS" (or bare-seconds) string into total seconds. Inverse of
 * formatTime; tolerant of empty / malformed input (returns 0).
 */
export function mmssToSeconds(mmss: string): number {
  const trimmed = mmss.trim()
  if (!trimmed) return 0
  if (trimmed.includes(':')) {
    const [mins, secs] = trimmed.split(':')
    return (parseInt(mins, 10) || 0) * 60 + (parseInt(secs, 10) || 0)
  }
  return parseInt(trimmed, 10) || 0
}

const SECONDS_PER_REP = 4 // rough work-rate used only for time estimates

/**
 * Estimate a single session's duration in minutes from its exercise blocks.
 * Shared by the program builder and import preview so both agree. Counts
 * work + (sets-1) inter-set rests per block + rest between exercises.
 */
export function estimateSessionMinutes(
  blocks: ProgramBlock[],
  opts: { warmupSeconds?: number; restBetweenExercises?: number } = {}
): number {
  const { warmupSeconds = 0, restBetweenExercises = 60 } = opts
  let total = warmupSeconds
  blocks.forEach((block, i) => {
    const sets = block.sets ?? 1
    const work =
      typeof block.durationSeconds === 'number'
        ? sets * block.durationSeconds
        : getTotalReps(block.targetReps, sets) * SECONDS_PER_REP
    total += work + getTotalRest(block.restBetweenSets, sets)
    if (i < blocks.length - 1) total += restBetweenExercises
  })
  return Math.max(1, Math.round(total / 60))
}

/**
 * Total inter-set rest (seconds) for an exercise across its (sets - 1) intervals.
 * Accepts a single rest value or a per-set array (padded with its last value).
 */
export function getTotalRest(
  restBetweenSets: number | number[] | undefined,
  sets: number
): number {
  const intervals = Math.max(0, sets - 1)
  if (restBetweenSets === undefined) return 60 * intervals
  if (typeof restBetweenSets === 'number') return restBetweenSets * intervals
  let total = 0
  for (let i = 0; i < intervals; i++) {
    total +=
      restBetweenSets[i] ?? restBetweenSets[restBetweenSets.length - 1] ?? 60
  }
  return total
}

/**
 * Format milliseconds into a clock string: M:SS, or H:MM:SS past an hour.
 * Shared by the workout session header, rest countdown, and recap.
 */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad2 = (n: number) => String(n).padStart(2, '0')
  return hours > 0
    ? `${hours}:${pad2(minutes)}:${pad2(seconds)}`
    : `${minutes}:${pad2(seconds)}`
}

/**
 * Format a hold/target duration given in *seconds* as a clock string. Thin
 * adapter over {@link formatClock} (which takes ms) for the timed-set surfaces,
 * so call sites don't repeat the `* 1000` conversion.
 */
export function formatHold(seconds: number): string {
  return formatClock(seconds * 1000)
}

/**
 * Format milliseconds as a screen-reader-friendly duration, e.g.
 * "2 minutes 5 seconds" or "45 seconds". Shared by the rest-timer surfaces
 * (RestSheet, ActiveWorkoutBar) for accessibility labels.
 */
export function spokenDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const parts: string[] = []
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`)
  if (seconds > 0 || minutes === 0)
    parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`)
  return parts.join(' ')
}

/**
 * Format seconds into human-readable duration.
 *
 * @param seconds - Total seconds
 * @param style - 'short' for hh:mm format, 'shortWithSuffix' for hh:mmh, 'long' for "5 minutes" or "1 hour 30 minutes"
 * @returns Formatted duration string
 */
export function formatDuration(
  seconds: number,
  style: 'short' | 'shortWithSuffix' | 'long' = 'short'
): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (style === 'short') {
    return `${hours}:${minutes.toString().padStart(2, '0')}`
  }

  if (style === 'shortWithSuffix') {
    return `${hours}:${minutes.toString().padStart(2, '0')}h`
  }

  // Long format
  const hourText = hours === 1 ? 'hour' : 'hours'
  const minuteText = minutes === 1 ? 'minute' : 'minutes'

  if (hours > 0) {
    return minutes > 0
      ? `${hours} ${hourText} ${minutes} ${minuteText}`
      : `${hours} ${hourText}`
  }
  return `${minutes} ${minuteText}`
}

/**
 * Format rep count with proper pluralization
 */
export function formatReps(count: number): string {
  return count === 1 ? '1 rep' : `${count} reps`
}

/**
 * Derive up-to-two-letter initials from a display name for avatars.
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Format a count with pluralization
 *
 * @param count - Number to format
 * @param singular - Singular form (e.g., "session")
 * @param plural - Optional plural form, defaults to singular + "s"
 */
export function formatCount(
  count: number,
  singular: string,
  plural?: string
): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`)
  return `${count} ${word}`
}

/**
 * Get total reps from a targetReps value that may be a single number or per-set array.
 * For arrays, returns the sum of all set reps.
 *
 * @param targetReps - Single number or array of per-set targets
 * @param sets - Number of sets (used when targetReps is a single number)
 * @returns Total reps across all sets
 */
export function getTotalReps(
  targetReps: number | number[] | undefined,
  sets: number = 1
): number {
  if (targetReps === undefined) return 0

  if (typeof targetReps === 'number') {
    return targetReps * sets
  }

  // Array of per-set targets - sum them
  return targetReps.reduce((sum, reps) => sum + reps, 0)
}

/**
 * Get the first/representative rep count from a targetReps value.
 * For arrays, returns the first element.
 *
 * @param targetReps - Single number or array of per-set targets
 * @returns First rep count, or 0 if undefined
 */
export function getFirstReps(
  targetReps: number | number[] | undefined
): number {
  if (targetReps === undefined) return 0

  if (typeof targetReps === 'number') {
    return targetReps
  }

  return targetReps[0] ?? 0
}
