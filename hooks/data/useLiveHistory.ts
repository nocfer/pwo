/**
 * useLiveHistory - Hook for accessing workout history
 *
 * Uses unified storage and subscribes to history update events
 * for automatic UI updates.
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
        const history = await storage.loadHistory(slug);

        if (!mounted) return;

        // Sort by date descending
        history.sort((a, b) =>
          a.date < b.date ? 1 : a.date > b.date ? -1 : 0
        );

        setData(history);
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
