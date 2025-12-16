/**
 * Formatting utility functions
 */

/**
 * Format seconds into M:SS format (e.g., "5:30")
 */
export function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Format seconds into human-readable duration.
 *
 * @param seconds - Total seconds
 * @param style - 'short' for hh:mm format, 'long' for "5 minutes" or "1 hour 30 minutes"
 * @returns Formatted duration string
 */
export function formatDuration(
  seconds: number,
  style: "short" | "long" = "short"
): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (style === "short") {
    // hh:mm format
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  }

  // Long format
  const hourText = hours === 1 ? "hour" : "hours";
  const minuteText = minutes === 1 ? "minute" : "minutes";

  if (hours > 0) {
    return minutes > 0
      ? `${hours} ${hourText} ${minutes} ${minuteText}`
      : `${hours} ${hourText}`;
  }
  return `${minutes} ${minuteText}`;
}

/**
 * Format rep count with proper pluralization
 */
export function formatReps(count: number): string {
  return count === 1 ? "1 rep" : `${count} reps`;
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
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}
