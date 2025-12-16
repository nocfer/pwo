/**
 * useLiveProgress - Hook for accessing live progress/streak data
 *
 * Uses unified storage and subscribes to progress update events
 * for automatic UI updates.
 */

import { useRefreshVersions } from "@/context/DataContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { storage } from "@/lib/storage";
import { useCallback } from "react";

export type LiveProgress = {
  slug: string;
  streak: number[];
};

export function useLiveProgress(slug: string | undefined) {
  const { progressVersion } = useRefreshVersions();

  const fetcher = useCallback(async (): Promise<LiveProgress | null> => {
    if (!slug) return null;

    const streak = await storage.loadStreak(slug);
    return {
      slug,
      streak: streak ?? [0, 0, 0, 0, 0, 0, 0]
    };
  }, [slug]);

  const { data, loading, error } = useAsyncData(fetcher, [slug, progressVersion], {
    skip: !slug
  });

  return { data, loading, error } as const;
}
