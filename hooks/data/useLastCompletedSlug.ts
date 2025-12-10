/**
 * useLastCompletedSlug - Hook for getting the last completed routine slug
 * 
 * Uses the DataContext for reactive updates.
 */

import { useContext, useEffect, useState } from "react";
import DataContext from "@/context/DataContext";
import { storage } from "@/lib/storage";

export function useLastCompletedSlug(): string | null {
  const context = useContext(DataContext);
  
  // If we're inside DataProvider, use context
  if (context) {
    return context.state.lastCompletedSlug;
  }
  
  // Fallback for usage outside provider
  const [slug, setSlug] = useState<string | null>(null);

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

  return slug;
}
