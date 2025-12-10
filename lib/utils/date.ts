/**
 * Date utility functions
 */

/**
 * Calculate the number of days between two dates (ignoring time)
 */
export function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const aDate = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bDate = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bDate.getTime() - aDate.getTime()) / MS_PER_DAY);
}

/**
 * Normalize a streak array by shifting days and padding with zeros
 * Returns the last 7 entries
 */
export function normalizeStreak(streak: number[], daysDiff: number): number[] {
  const base = streak.slice(-7);
  let shifted = base;
  if (daysDiff > 0) {
    shifted = [...base, ...Array(daysDiff).fill(0)];
  }
  return shifted.slice(-7);
}

/**
 * Format a date to YYYY-MM-DD string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}
