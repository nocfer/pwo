/**
 * usePRs - Hook for loading and managing personal records
 */

import { useRefreshVersions } from "@/context/DataContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { storage } from "@/lib/storage";
import type { PersonalRecord, PersonalRecordType } from "@/types";
import { useCallback, useMemo } from "react";

export type PRsData = {
  latestPRs: PersonalRecord[];
  prsByExercise: Map<string, PersonalRecord[]>;
  bestPRs: Map<string, Map<PersonalRecordType, PersonalRecord>>;
};

export function usePRs(limit: number = 10): {
  data: PRsData | null;
  loading: boolean;
  error: Error | null;
} {
  const { progressVersion } = useRefreshVersions();

  const fetcher = useCallback(async (): Promise<PRsData> => {
    const [latestPRs, allPRHistory] = await Promise.all([
      storage.getLatestPRs(limit),
      storage.loadAllPRs()
    ]);

    // Build prsByExercise map
    const prsByExercise = new Map<string, PersonalRecord[]>();
    for (const history of allPRHistory) {
      prsByExercise.set(history.exerciseId, history.records);
    }

    // Build bestPRs map (best PR for each type per exercise)
    const bestPRs = new Map<string, Map<PersonalRecordType, PersonalRecord>>();
    for (const history of allPRHistory) {
      const exerciseBest = new Map<PersonalRecordType, PersonalRecord>();
      for (const pr of history.records) {
        const existing = exerciseBest.get(pr.type);
        if (!existing || pr.value > existing.value) {
          exerciseBest.set(pr.type, pr);
        }
      }
      bestPRs.set(history.exerciseId, exerciseBest);
    }

    return { latestPRs, prsByExercise, bestPRs };
  }, [limit]);

  const { data, loading, error } = useAsyncData(fetcher, [progressVersion, limit]);

  return { data, loading, error };
}

/**
 * Hook to get PRs for a specific exercise
 */
export function useExercisePRs(exerciseId: string): {
  prs: PersonalRecord[];
  bestPRs: Map<PersonalRecordType, PersonalRecord>;
  loading: boolean;
  error: Error | null;
} {
  const { progressVersion } = useRefreshVersions();

  const fetcher = useCallback(async () => {
    const [prs, bestPRsMap] = await Promise.all([
      storage.loadPRsForExercise(exerciseId),
      storage.getCurrentPRs(exerciseId)
    ]);
    return { prs, bestPRsMap };
  }, [exerciseId]);

  const { data, loading, error } = useAsyncData(fetcher, [progressVersion]);

  const prs = useMemo(() => data?.prs ?? [], [data]);
  const bestPRs = useMemo(
    () => data?.bestPRsMap ?? new Map<PersonalRecordType, PersonalRecord>(),
    [data]
  );

  return { prs, bestPRs, loading, error };
}

/**
 * Check if a PR was achieved recently (within the last N days)
 */
export function isPRRecent(pr: PersonalRecord, days: number = 7): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(pr.achievedAt) >= cutoff;
}

