/**
 * useLiveHistory - Hook for accessing workout history
 *
 * Uses unified storage and subscribes to history update events
 * for automatic UI updates. Merges live data with static assets.
 */

import { useRefreshVersions } from "@/context/DataContext";
import { storage } from "@/lib/storage";
import type { HistoryEntry } from "@/types";
import { useEffect, useState } from "react";

export type { HistoryEntry };

export function useLiveHistory(slug: string | undefined) {
  const [data, setData] = useState<HistoryEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get version from context to trigger re-fetches
  const { historyVersion } = useRefreshVersions();

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        if (!slug) {
          if (mounted) {
            setData(null);
            setLoading(false);
          }
          return;
        }

        setLoading(true);

        // Load from storage
        const liveHistory = await storage.loadHistory(slug);

        // Load from static assets
        let assetHistory: HistoryEntry[] = [];
        try {
          const mod = await import("@/assets/data/history.json");
          const entries = (mod as any).default as {
            slug: string;
            recent: HistoryEntry[];
          }[];
          const entry = entries.find((e) => e.slug === slug);
          assetHistory = entry?.recent ?? [];
        } catch {
          // No asset data
        }

        if (!mounted) return;

        // Merge: live first, then unique asset entries
        const byKey = new Set(liveHistory.map((e) => `${e.date}-${e.summary}`));
        const merged = [
          ...liveHistory,
          ...assetHistory.filter((e) => !byKey.has(`${e.date}-${e.summary}`)),
        ];

        // Sort by date descending
        merged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

        setData(merged);
      } catch (e) {
        if (mounted) setError(e as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHistory();

    return () => {
      mounted = false;
    };
  }, [slug, historyVersion]);

  return { data, loading, error } as const;
}
