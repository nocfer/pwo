/**
 * useRoutines - Hook for accessing routines data
 *
 * Uses the DataContext for reactive updates.
 * Falls back to direct asset loading if used outside context.
 */

import { useContext, useEffect, useState } from "react";
import DataContext from "@/context/DataContext";
import type { Routine } from "@/types";

export function useRoutines() {
  const context = useContext(DataContext);

  // If we're inside DataProvider, use context
  if (context) {
    return {
      data: context.state.routines.length > 0 ? context.state.routines : null,
      loading: context.state.routinesLoading,
      error: null,
    };
  }

  // Fallback for usage outside provider (shouldn't happen normally)
  const [data, setData] = useState<Routine[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const mod = await import("@/assets/data/routines.json");
        if (!isMounted) return;
        setData((mod as any).default as Routine[]);
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
