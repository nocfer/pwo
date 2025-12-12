/**
 * useLastCompletedSlug - Hook for getting the last completed challenge slug
 *
 * Uses the DataContext for reactive updates.
 */

import DataContext from "@/context/DataContext";
import { storage } from "@/lib/storage";
import { useContext, useEffect, useState } from "react";

export function useLastCompletedSlug(): string | null {
  const context = useContext(DataContext);

  const [slug, setSlug] = useState<string | null>(null);

  // Fallback for usage outside provider

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const lastSlug = await storage.getLastCompletedSlug();
        if (mounted) setSlug(lastSlug);
      } catch {
        if (mounted) setSlug(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // If we're inside DataProvider, use context
  if (context) {
    return context.state.lastCompletedSlug;
  }

  return slug;
}
