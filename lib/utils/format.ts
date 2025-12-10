/**
 * Formatting utility functions
 */

/**
 * Format seconds into M:SS format
 */
export function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Format rep count with proper pluralization
 */
export function formatReps(count: number): string {
  return count === 1 ? "1 rep" : `${count} reps`;
}
