/**
 * Progress utility functions
 *
 * Shared logic for calculating streaks, finding next sessions,
 * and other progress-related computations.
 */

type SessionWithCompletedAt = {
  completedAt?: string | null;
};

/**
 * Calculate current streak from a list of sessions with completion dates.
 * A streak is the number of consecutive days with activity ending today or yesterday.
 *
 * @param sessions - Array of sessions with optional completedAt timestamps
 * @returns Current streak count (0 if no recent activity)
 */
export function calculateStreak(sessions: SessionWithCompletedAt[]): number {
  const completedSessions = sessions.filter((s) => s.completedAt);

  if (completedSessions.length === 0) {
    return 0;
  }

  // Sort by date descending (most recent first)
  const sortedByDate = [...completedSessions].sort(
    (a, b) =>
      new Date(b.completedAt || "").getTime() -
      new Date(a.completedAt || "").getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let checkDate = new Date(today);

  for (const session of sortedByDate) {
    if (!session.completedAt) continue;

    const sessionDate = new Date(session.completedAt);
    sessionDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (checkDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Allow starting streak from today or yesterday
    if (daysDiff === 0 || (currentStreak === 0 && daysDiff <= 1)) {
      currentStreak++;
      checkDate = new Date(sessionDate);
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return currentStreak;
}

/**
 * Find the next session index that hasn't been completed.
 *
 * @param completedIndices - Set of session indices that have been completed
 * @param totalSessions - Total number of sessions available
 * @returns The next session index (1-based), or null if all completed
 */
export function findNextSessionIndex(
  completedIndices: Set<number>,
  totalSessions: number
): number | null {
  for (let i = 1; i <= totalSessions; i++) {
    if (!completedIndices.has(i)) {
      return i;
    }
  }
  return null;
}

/**
 * Calculate completion percentage
 *
 * @param completed - Number of completed items
 * @param total - Total number of items
 * @returns Percentage (0-100)
 */
export function calculateCompletionPercentage(
  completed: number,
  total: number
): number {
  if (total <= 0) return 0;
  return (completed / total) * 100;
}

/**
 * Get unique activity dates from sessions
 *
 * @param sessions - Array of sessions with optional completedAt timestamps
 * @returns Set of date strings (YYYY-MM-DD format)
 */
export function getActivityDates(
  sessions: SessionWithCompletedAt[]
): Set<string> {
  const dates = new Set<string>();

  for (const session of sessions) {
    if (session.completedAt) {
      dates.add(session.completedAt.slice(0, 10));
    }
  }

  return dates;
}

