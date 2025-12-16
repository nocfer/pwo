/**
 * useWeeklyStats - Hook for loading weekly statistics
 */

import { useRefreshVersions } from "@/context/DataContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { storage } from "@/lib/storage";
import type { WeeklyStats } from "@/types";
import { useCallback } from "react";

export function useWeeklyStats(weekStart?: Date): {
  stats: WeeklyStats | null;
  loading: boolean;
  error: Error | null;
} {
  const { progressVersion } = useRefreshVersions();

  const fetcher = useCallback(async (): Promise<WeeklyStats> => {
    return storage.getWeeklyStats(weekStart);
  }, [weekStart]);

  const { data, loading, error } = useAsyncData(fetcher, [
    progressVersion,
    weekStart?.toISOString()
  ]);

  return { stats: data, loading, error };
}

/**
 * Hook to get the current week's completion percentage
 */
export function useWeeklyCompletion(): {
  completed: number;
  goal: number;
  percentage: number;
  loading: boolean;
} {
  const { stats, loading } = useWeeklyStats();

  const completed = stats?.workoutsCompleted ?? 0;
  const goal = stats?.workoutGoal ?? 4;
  const percentage = goal > 0 ? Math.min(100, (completed / goal) * 100) : 0;

  return { completed, goal, percentage, loading };
}

/**
 * Format time in seconds to human-readable string
 */
export function formatDurationShort(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

