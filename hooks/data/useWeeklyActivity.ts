/**
 * useWeeklyActivity - Hook for aggregating weekly activity across all challenges
 *
 * Loads all streaks and merges them into a single weekly array showing
 * if any workout was completed on each day.
 */

import { useRefreshVersions } from "@/context/DataContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { storage } from "@/lib/storage";
import { useCallback } from "react";

export function useWeeklyActivity() {
  const { progressVersion } = useRefreshVersions();

  const fetcher = useCallback(async (): Promise<number[]> => {
    const allStreaks = await storage.loadAllStreaks();

    // Merge: if any challenge has activity on a day, mark it as 1
    const merged = [0, 0, 0, 0, 0, 0, 0];
    for (const entry of allStreaks) {
      for (let i = 0; i < 7; i++) {
        if (entry.streak[i]) merged[i] = 1;
      }
    }
    return merged;
  }, []);

  const { data, loading } = useAsyncData(fetcher, [progressVersion], {
    initialData: [0, 0, 0, 0, 0, 0, 0]
  });

  return { data: data ?? [0, 0, 0, 0, 0, 0, 0], loading };
}
