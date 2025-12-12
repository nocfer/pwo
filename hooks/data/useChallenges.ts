/**
 * useChallenges - Hook for accessing challenges data
 *
 * Uses the DataContext for reactive updates.
 * Falls back to direct asset loading if used outside context.
 */

import DataContext from "@/context/DataContext";
import type { Challenge } from "@/types";
import { useContext, useEffect, useState } from "react";

export function useChallenges() {
  const context = useContext(DataContext);

  // If we're inside DataProvider, use context
  if (context) {
    return {
      data:
        context.state.challenges.length > 0 ? context.state.challenges : null,
      loading: context.state.challengesLoading,
      error: null,
    };
  }

  // Fallback for usage outside provider (shouldn't happen normally)
  const [data, setData] = useState<Challenge[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const mod = await import("@/assets/data/challenges.json");
        if (!isMounted) return;
        setData((mod as any).default as Challenge[]);
      } catch (e) {
        if (!isMounted) return;
        setError(e as Error);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error } as const;
}
