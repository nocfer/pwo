/**
 * Program Prioritization Utilities
 *
 * Provides logic to prioritize programs based on recent usage and favorites.
 * Ensures consistent ordering across app sessions.
 */

import { storage } from "@/lib/storage";
import type { Program } from "@/types";

export interface ProgramWithPriority extends Program {
  lastUsed?: string;
  usageCount?: number;
  priorityScore: number;
}

/**
 * Calculate priority score for a program based on usage patterns
 */
function calculatePriorityScore(
  lastUsed?: string,
  usageCount: number = 0
): number {
  let score = 0;

  // Base score from usage count (more usage = higher priority)
  score += Math.min(usageCount * 10, 100); // Cap at 100 points for usage

  if (lastUsed) {
    const lastUsedDate = new Date(lastUsed);
    const now = new Date();
    const daysSinceLastUse = Math.floor(
      (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Recent usage bonus (decays over time)
    if (daysSinceLastUse === 0) {
      score += 1000; // Used today - highest priority
    } else if (daysSinceLastUse <= 1) {
      score += 500; // Used yesterday
    } else if (daysSinceLastUse <= 3) {
      score += 200; // Used in last 3 days
    } else if (daysSinceLastUse <= 7) {
      score += 100; // Used in last week
    } else if (daysSinceLastUse <= 30) {
      score += 50; // Used in last month
    }
    // No bonus for older usage
  }

  return score;
}

/**
 * Get usage statistics for programs from progress data
 */
async function getProgramUsageStats(): Promise<
  Map<string, { lastUsed?: string; usageCount: number }>
> {
  const [programProgress, challengeProgress] = await Promise.all([
    storage.loadAllProgramProgress(),
    storage.loadAllChallengeProgress()
  ]);

  const usageStats = new Map<
    string,
    { lastUsed?: string; usageCount: number }
  >();

  // Process regular program progress
  for (const progress of programProgress) {
    const programId = progress.programId;
    let totalSessions = 0;
    let latestActivity: string | undefined;

    // Count sessions across all runs
    for (const run of progress.runs ?? []) {
      const completedSessions = run.sessions?.filter((s) => s.completed) ?? [];
      totalSessions += completedSessions.length;

      // Track latest activity
      if (run.lastActivityAt) {
        if (
          !latestActivity ||
          new Date(run.lastActivityAt) > new Date(latestActivity)
        ) {
          latestActivity = run.lastActivityAt;
        }
      }
    }

    // Use progress-level lastActivityAt if available and more recent
    if (progress.lastActivityAt) {
      if (
        !latestActivity ||
        new Date(progress.lastActivityAt) > new Date(latestActivity)
      ) {
        latestActivity = progress.lastActivityAt;
      }
    }

    usageStats.set(programId, {
      lastUsed: latestActivity,
      usageCount: totalSessions
    });
  }

  // Process challenge progress
  for (const progress of challengeProgress) {
    const challengeId = progress.challengeId;
    const completedSessions =
      progress.sessions?.filter((s) => s.completed) ?? [];
    const usageCount = completedSessions.length;

    usageStats.set(challengeId, {
      lastUsed: progress.lastActivityAt || undefined,
      usageCount
    });
  }

  return usageStats;
}

/**
 * Prioritize programs based on recent usage and activity
 * Returns programs sorted by priority (highest first)
 */
export async function prioritizePrograms(
  programs: Program[]
): Promise<ProgramWithPriority[]> {
  if (programs.length === 0) {
    return [];
  }

  const usageStats = await getProgramUsageStats();

  // Add priority information to programs
  const programsWithPriority: ProgramWithPriority[] = programs.map(
    (program) => {
      const stats = usageStats.get(program.id) || { usageCount: 0 };
      const priorityScore = calculatePriorityScore(
        stats.lastUsed,
        stats.usageCount
      );

      return {
        ...program,
        lastUsed: stats.lastUsed,
        usageCount: stats.usageCount,
        priorityScore
      };
    }
  );

  // Sort by priority score (highest first), then by name for consistency
  programsWithPriority.sort((a, b) => {
    if (a.priorityScore !== b.priorityScore) {
      return b.priorityScore - a.priorityScore; // Higher score first
    }
    // If same priority, sort by name for consistent ordering
    return a.name.localeCompare(b.name);
  });

  return programsWithPriority;
}

/**
 * Get the top N prioritized programs for quick access
 */
export async function getTopPriorityPrograms(
  programs: Program[],
  limit: number = 5
): Promise<ProgramWithPriority[]> {
  const prioritized = await prioritizePrograms(programs);
  return prioritized.slice(0, limit);
}

/**
 * Check if a program has been used recently (within last 7 days)
 */
export function isRecentlyUsed(program: ProgramWithPriority): boolean {
  if (!program.lastUsed) return false;

  const lastUsedDate = new Date(program.lastUsed);
  const now = new Date();
  const daysSinceLastUse = Math.floor(
    (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceLastUse <= 7;
}

/**
 * Group programs by usage status for display
 */
export async function groupProgramsByUsage(programs: Program[]): Promise<{
  recentlyUsed: ProgramWithPriority[];
  other: ProgramWithPriority[];
}> {
  const prioritized = await prioritizePrograms(programs);

  const recentlyUsed = prioritized.filter(isRecentlyUsed);
  const other = prioritized.filter((p) => !isRecentlyUsed(p));

  return { recentlyUsed, other };
}
