/**
 * useChallengeProgress - Hook for calculating challenge-specific progress metrics
 *
 * Calculates completion percentage, reps progress, progression over time,
 * and other challenge-specific metrics.
 */

import { useRefreshVersions } from "@/context/DataContext";
import { storage } from "@/lib/storage";
import type { ChallengeProgress, Program } from "@/types";
import { useEffect, useMemo, useState } from "react";
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
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { progressVersion } = useRefreshVersions();

  const challengeId = challenge?.id;
  const isChallenge = Boolean(challenge?.challengeConfig);

  // Generate sessions to know total count
  const sessions = useMemo(() => {
    if (!challenge || !isChallenge) return [];
    return generateChallengeSessions(challenge.challengeConfig!);
  }, [challenge, isChallenge]);

  useEffect(() => {
    let mounted = true;

    async function loadProgress() {
      try {
        if (!challengeId || !isChallenge) {
          if (mounted) {
            setProgress(null);
            setLoading(false);
          }
          return;
        }

        setLoading(true);
        const loaded = await storage.loadChallengeProgress(challengeId);

        if (mounted) {
          setProgress(loaded);
        }
      } catch (e) {
        if (mounted) setError(e as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProgress();

    return () => {
      mounted = false;
    };
  }, [challengeId, isChallenge, progressVersion]);

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

    const completedSessions = progress.sessions.filter((s) => s.completed);
    const sessionsCompleted = completedSessions.length;
    const completionPercentage =
      totalSessions > 0 ? (sessionsCompleted / totalSessions) * 100 : 0;

    const totalRepsCompleted = progress.totalRepsCompleted;
    const repsProgressPercentage =
      targetReps > 0
        ? Math.min(100, (totalRepsCompleted / targetReps) * 100)
        : 0;

    // Calculate current streak (consecutive days with activity)
    let currentStreak = 0;
    if (completedSessions.length > 0) {
      const sortedByDate = [...completedSessions].sort(
        (a, b) =>
          new Date(b.completedAt || "").getTime() -
          new Date(a.completedAt || "").getTime()
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let checkDate = new Date(today);

      for (const session of sortedByDate) {
        if (!session.completedAt) continue;
        const sessionDate = new Date(session.completedAt);
        sessionDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor(
          (checkDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 0 || (currentStreak === 0 && daysDiff <= 1)) {
          currentStreak++;
          checkDate = new Date(sessionDate);
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Find next session to complete
    const completedIndices = new Set(
      completedSessions.map((s) => s.sessionIndex)
    );
    let nextSessionIndex: number | null = null;
    for (let i = 1; i <= totalSessions; i++) {
      if (!completedIndices.has(i)) {
        nextSessionIndex = i;
        break;
      }
    }

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
