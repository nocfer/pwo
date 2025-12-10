/**
 * useSessionCompletion - Hook for tracking completed sessions
 * 
 * Uses unified storage and subscribes to session completion events
 * for automatic UI updates.
 */

import { useRefreshVersions } from "@/context/DataContext";
import { storage } from "@/lib/storage";
import { useEffect, useState } from "react";

export function useSessionCompletion(slug: string | undefined) {
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Get version from context to trigger re-fetches
  const { completedVersion } = useRefreshVersions();

  useEffect(() => {
    let mounted = true;
    
    async function loadCompleted() {
      try {
        if (!slug) {
          if (mounted) {
            setCompleted(new Set());
            setLoading(false);
          }
          return;
        }
        
        setLoading(true);
        const completedSet = await storage.loadCompletedSessions(slug);
        
        if (mounted) {
          setCompleted(completedSet);
        }
      } catch (e) {
        if (mounted) setError(e as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    loadCompleted();
    
    return () => {
      mounted = false;
    };
  }, [slug, completedVersion]);

  return { completed, loading, error } as const;
}
