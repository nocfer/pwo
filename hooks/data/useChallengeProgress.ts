/**
 * useChallengeProgress - Hook for calculating challenge-specific progress metrics
 *
 * Calculates completion percentage, reps progress, progression over time,
 * and other challenge-specific metrics.
 */

import { useRefreshVersions } from "@/context/DataContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { storage } from "@/lib/storage";
import {
    calculateCompletionPercentage,
    calculateStreak,
    findNextSessionIndex
} from "@/lib/utils/progress";
import type { ChallengeProgress, Program } from "@/types";
import { useCallback, useMemo } from "react";
import { generateChallengeSessions } from "./useChallengeSessions";

export type ChallengeProgressMetrics = {
  challengeId: string;
  progress: ChallengeProgress | null;
  totalSessions: number;
  sessionsCompleted: number;
  completionPercentage: number;
  totalRepsCompleted: number;
  targetReps: number;
  repsProgressPercentage: number;
  currentStreak: number;
  nextSessionIndex: number | null;
  isCompleted: boolean;
  startedAt: string | null;
  completedAt: string | null;
  lastActivityAt: string | null;
};

export function useChallengeProgress(challenge: Program | null | undefined): {
  metrics: ChallengeProgressMetrics | null;
  loading: boolean;
  error: Error | null;
} {
  const { progressVersion } = useRefreshVersions();

  const challengeId = challenge?.id;
  const isChallenge = Boolean(challenge?.challengeConfig);

  // Generate sessions to know total count
  const sessions = useMemo(() => {
    if (!challenge || !isChallenge) return [];
    return generateChallengeSessions(challenge.challengeConfig!);
  }, [challenge, isChallenge]);

  const fetcher = useCallback(async (): Promise<ChallengeProgress | null> => {
    if (!challengeId || !isChallenge) return null;
    return storage.loadChallengeProgress(challengeId);
  }, [challengeId, isChallenge]);

  const {
    data: progress,
    loading,
    error
  } = useAsyncData(fetcher, [challengeId, isChallenge, progressVersion], {
    skip: !challengeId || !isChallenge
  });

  const metrics = useMemo((): ChallengeProgressMetrics | null => {
    if (!challenge || !isChallenge || !challenge.challengeConfig) {
      return null;
    }

    const totalSessions = sessions.length;
    const targetReps = challenge.challengeConfig.targetReps;

    if (!progress) {
      return {
        challengeId: challenge.id,
        progress: null,
        totalSessions,
        sessionsCompleted: 0,
        completionPercentage: 0,
        totalRepsCompleted: 0,
        targetReps,
        repsProgressPercentage: 0,
        currentStreak: 0,
        nextSessionIndex: totalSessions > 0 ? 1 : null,
        isCompleted: false,
        startedAt: null,
        completedAt: null,
        lastActivityAt: null
      };
    }

    const completedWorkouts = progress.workouts.filter((w) => w.completed);
    const sessionsCompleted = completedWorkouts.length;
    const completionPercentage = calculateCompletionPercentage(
      sessionsCompleted,
      totalSessions
    );

    const totalRepsCompleted = progress.totalRepsCompleted;
    const repsProgressPercentage =
      targetReps > 0
        ? Math.min(100, (totalRepsCompleted / targetReps) * 100)
        : 0;

    // Use shared utility for streak calculation
    const currentStreak = calculateStreak(completedWorkouts);

    // Use shared utility for finding next session
    const completedIndices = new Set(
      completedWorkouts.map((w, idx) => idx + 1)
    );
    const nextSessionIndex = findNextSessionIndex(
      completedIndices,
      totalSessions
    );

    const isCompleted =
      sessionsCompleted === totalSessions && totalRepsCompleted >= targetReps;

    return {
      challengeId: challenge.id,
      progress,
      totalSessions,
      sessionsCompleted,
      completionPercentage,
      totalRepsCompleted,
      targetReps,
      repsProgressPercentage,
      currentStreak,
      nextSessionIndex,
      isCompleted,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt || null,
      lastActivityAt: progress.lastActivityAt
    };
  }, [challenge, isChallenge, progress, sessions]);

  return { metrics, loading, error };
}
