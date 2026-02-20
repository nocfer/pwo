/**
 * Program Prioritization Utilities
 *
 * Provides logic to prioritize programs based on recent usage and favorites.
 * Ensures consistent ordering across app sessions.
 *
 * All functions accept data as parameters — no storage or API calls are made here.
 */

import type { Program } from '@/types'

export interface ProgramWithPriority extends Program {
  lastUsed?: string
  usageCount?: number
  priorityScore: number
}

/** Shape of recent activity entries from the API progress endpoint */
export interface RecentActivityEntry {
  date: string
  workoutId: string
}

/**
 * Calculate priority score for a program based on usage patterns
 */
function calculatePriorityScore(
  lastUsed?: string,
  usageCount: number = 0
): number {
  let score = 0

  // Base score from usage count (more usage = higher priority)
  score += Math.min(usageCount * 10, 100) // Cap at 100 points for usage

  if (lastUsed) {
    const lastUsedDate = new Date(lastUsed)
    const now = new Date()
    const daysSinceLastUse = Math.floor(
      (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Recent usage bonus (decays over time)
    if (daysSinceLastUse === 0) {
      score += 1000 // Used today - highest priority
    } else if (daysSinceLastUse <= 1) {
      score += 500 // Used yesterday
    } else if (daysSinceLastUse <= 3) {
      score += 200 // Used in last 3 days
    } else if (daysSinceLastUse <= 7) {
      score += 100 // Used in last week
    } else if (daysSinceLastUse <= 30) {
      score += 50 // Used in last month
    }
    // No bonus for older usage
  }

  return score
}

/**
 * Derive per-program usage stats from API recent activity data.
 *
 * The `recentActivity` array comes from `fetchProgress().recentActivity`
 * where each entry has a `workoutId` (the program slug/id) and a `date`.
 */
export function getProgramUsageStats(
  recentActivity: RecentActivityEntry[]
): Map<string, { lastUsed?: string; usageCount: number }> {
  const usageStats = new Map<
    string,
    { lastUsed?: string; usageCount: number }
  >()

  for (const entry of recentActivity) {
    const existing = usageStats.get(entry.workoutId)

    if (existing) {
      existing.usageCount += 1
      if (
        !existing.lastUsed ||
        new Date(entry.date) > new Date(existing.lastUsed)
      ) {
        existing.lastUsed = entry.date
      }
    } else {
      usageStats.set(entry.workoutId, {
        lastUsed: entry.date,
        usageCount: 1
      })
    }
  }

  return usageStats
}

/**
 * Prioritize programs based on recent usage and activity.
 * Returns programs sorted by priority (highest first).
 *
 * @param programs - The list of programs to prioritize
 * @param recentActivity - Recent activity entries from the API progress endpoint
 */
export function prioritizePrograms(
  programs: Program[],
  recentActivity: RecentActivityEntry[] = []
): ProgramWithPriority[] {
  if (programs.length === 0) {
    return []
  }

  const usageStats = getProgramUsageStats(recentActivity)

  // Add priority information to programs
  const programsWithPriority: ProgramWithPriority[] = programs.map(program => {
    const stats = usageStats.get(program.id) || { usageCount: 0 }
    const priorityScore = calculatePriorityScore(
      stats.lastUsed,
      stats.usageCount
    )

    return {
      ...program,
      lastUsed: stats.lastUsed,
      usageCount: stats.usageCount,
      priorityScore
    }
  })

  // Sort by priority score (highest first), then by name for consistency
  programsWithPriority.sort((a, b) => {
    if (a.priorityScore !== b.priorityScore) {
      return b.priorityScore - a.priorityScore // Higher score first
    }
    return a.name.localeCompare(b.name)
  })

  return programsWithPriority
}

/**
 * Get the top N prioritized programs for quick access
 */
export function getTopPriorityPrograms(
  programs: Program[],
  recentActivity: RecentActivityEntry[] = [],
  limit: number = 5
): ProgramWithPriority[] {
  const prioritized = prioritizePrograms(programs, recentActivity)
  return prioritized.slice(0, limit)
}

/**
 * Check if a program has been used recently (within last 7 days)
 */
export function isRecentlyUsed(program: ProgramWithPriority): boolean {
  if (!program.lastUsed) return false

  const lastUsedDate = new Date(program.lastUsed)
  const now = new Date()
  const daysSinceLastUse = Math.floor(
    (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return daysSinceLastUse <= 7
}

/**
 * Group programs by usage status for display
 */
export function groupProgramsByUsage(
  programs: Program[],
  recentActivity: RecentActivityEntry[] = []
): {
  recentlyUsed: ProgramWithPriority[]
  other: ProgramWithPriority[]
} {
  const prioritized = prioritizePrograms(programs, recentActivity)

  const recentlyUsed = prioritized.filter(isRecentlyUsed)
  const other = prioritized.filter(p => !isRecentlyUsed(p))

  return { recentlyUsed, other }
}
