/**
 * useWeeklyActivity - Hook for aggregating weekly activity across all routines
 *
 * Loads all streaks and merges them into a single weekly array showing
 * if any workout was completed on each day.
 */

import { useRefreshVersions } from "@/context/DataContext";
import { storage } from "@/lib/storage";
import { useEffect, useState } from "react";

export function useWeeklyActivity() {
  const [data, setData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const { progressVersion } = useRefreshVersions();

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const allStreaks = await storage.loadAllStreaks();
        if (!mounted) return;

        // Merge: if any routine has activity on a day, mark it as 1
        const merged = [0, 0, 0, 0, 0, 0, 0];
        for (const entry of allStreaks) {
          for (let i = 0; i < 7; i++) {
            if (entry.streak[i]) merged[i] = 1;
          }
        }
        setData(merged);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [progressVersion]);

  return { data, loading };
}
