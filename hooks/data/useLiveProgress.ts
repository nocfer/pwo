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
          // Fall back to static asset data
          try {
            const mod = await import("@/assets/data/progress.json");
            const entries = (mod as any).default as {
              slug: string;
              streak: (number | boolean | string)[];
            }[];
            const entry = entries.find((e) => e.slug === slug);
            if (entry && mounted) {
              // Convert to number array
              const numStreak = entry.streak.map((v) =>
                typeof v === "number" ? v : v ? 1 : 0,
              );
              setData({ slug, streak: numStreak.slice(-7) });
            } else if (mounted) {
              setData(null);
            }
          } catch {
            if (mounted) setData(null);
          }
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
