/**
 * useLiveProgress - Hook for accessing live progress/streak data
 *
 * Uses unified storage and subscribes to progress update events
 * for automatic UI updates.
 */

import { useRefreshVersions } from "@/context/DataContext";
import { storage } from "@/lib/storage";
import { useEffect, useState } from "react";

export type LiveProgress = {
  slug: string;
  streak: number[];
};

export function useLiveProgress(slug: string | undefined) {
  const [data, setData] = useState<LiveProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get version from context to trigger re-fetches
  const { progressVersion } = useRefreshVersions();

  useEffect(() => {
    let mounted = true;

    async function loadProgress() {
      try {
        if (!slug) {
          if (mounted) {
            setData(null);
            setLoading(false);
          }
          return;
        }

        setLoading(true);
        const streak = await storage.loadStreak(slug);

        if (!mounted) return;

        if (streak) {
          setData({ slug, streak });
        } else {
          // No progress data yet - return empty streak
          setData({ slug, streak: [0, 0, 0, 0, 0, 0, 0] });
        }
      } catch (e) {
        if (mounted) setError(e as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProgress();

    return () => {
      mounted = false;
    };
  }, [slug, progressVersion]);

  return { data, loading, error } as const;
}
