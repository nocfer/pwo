/**
 * Date utility functions
 */

/**
 * Calculate the number of days between two dates (ignoring time)
 */
export function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const aDate = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const bDate = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((bDate.getTime() - aDate.getTime()) / MS_PER_DAY)
}

/**
 * Get the Monday-based day of week index (0 = Monday, 6 = Sunday)
 */
export function getMondayBasedDayIndex(date: Date): number {
  // JavaScript getDay() returns 0 for Sunday, 1 for Monday, etc.
  // We want 0 for Monday, 6 for Sunday
  return (date.getDay() + 6) % 7
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const dayIndex = getMondayBasedDayIndex(d)
  d.setDate(d.getDate() - dayIndex)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Check if two dates are in the same calendar week (Mon-Sun)
 */
export function isSameWeek(a: Date, b: Date): boolean {
  const weekStartA = getWeekStart(a)
  const weekStartB = getWeekStart(b)
  return weekStartA.getTime() === weekStartB.getTime()
}

/**
 * Normalize a streak array for calendar week display.
 * If dates are in different weeks, returns a fresh array.
 * Otherwise returns the existing streak.
 */
export function normalizeStreak(
  streak: number[],
  lastDate: Date,
  today: Date
): number[] {
  // If in a different week, reset the streak
  if (!isSameWeek(lastDate, today)) {
    return Array(7).fill(0)
  }
  // Same week - return existing streak (padded/trimmed to 7)
  const base = streak.slice(-7)
  while (base.length < 7) {
    base.unshift(0)
  }
  return base
}

/**
 * Format a date to YYYY-MM-DD string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().slice(0, 10)
}

/**
 * Get today's Monday-based day index
 */
export function getTodayIndex(): number {
  return getMondayBasedDayIndex(new Date())
}
