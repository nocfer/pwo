/**
 * Formatting utility functions
 */

/**
 * Format seconds into M:SS format (e.g., "5:30")
 */
export function formatTime(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
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
