/**
 * useLiveHistory - Hook for accessing workout history
 *
 * Uses unified storage and subscribes to history update events
 * for automatic UI updates.
 */

import { useRefreshVersions } from "@/context/DataContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { storage } from "@/lib/storage";
import type { HistoryEntry } from "@/types";
import { useCallback } from "react";

export type { HistoryEntry };

export function useLiveHistory(slug: string | undefined) {
  const { historyVersion } = useRefreshVersions();

  const fetcher = useCallback(async (): Promise<HistoryEntry[] | null> => {
    if (!slug) return null;

    const history = await storage.loadHistory(slug);
    // Sort by date descending
    return history.sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    );
  }, [slug]);

  const { data, loading, error } = useAsyncData(
    fetcher,
    [slug, historyVersion],
    {
      skip: !slug
    }
  );

  return { data, loading, error } as const;
}
