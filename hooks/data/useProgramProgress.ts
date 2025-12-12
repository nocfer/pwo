/**
 * useProgramProgress - Hook for calculating program-specific progress metrics
 *
 * Calculates completion percentage, time spent, exercise completion,
 * and other program-specific metrics.
 */

import { useRefreshVersions } from "@/context/DataContext";
import { storage } from "@/lib/storage";
import type { Program, ProgramProgress } from "@/types";
import { useEffect, useMemo, useState } from "react";

export type ProgramProgressMetrics = {
  programId: string;
  progress: ProgramProgress | null;
  totalSessions: number;
  sessionsCompleted: number;
  completionPercentage: number;
  totalTimeSpentSeconds: number;
  averageTimePerSessionSeconds: number;
  currentStreak: number;
  nextSessionIndex: number | null;
  isCompleted: boolean;
  startedAt: string | null;
  completedAt: string | null;
  lastActivityAt: string | null;
  exerciseCompletion: Map<string, { completed: number; total: number }>;
};

export function useProgramProgress(program: Program | null | undefined): {
  metrics: ProgramProgressMetrics | null;
  loading: boolean;
  error: Error | null;
} {
  const [progress, setProgress] = useState<ProgramProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { progressVersion } = useRefreshVersions();

  const programId = program?.id;
  const isChallenge = Boolean(program?.challengeConfig);

  useEffect(() => {
    let mounted = true;

    async function loadProgress() {
      try {
        if (!programId || isChallenge) {
          // Challenges use challenge progress, not program progress
          if (mounted) {
            setProgress(null);
            setLoading(false);
          }
          return;
        }

        setLoading(true);
        const loaded = await storage.loadProgramProgress(programId);

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
  }, [programId, isChallenge, progressVersion]);

  const metrics = useMemo((): ProgramProgressMetrics | null => {
    if (!program || isChallenge) {
      return null;
    }

    const totalSessions = program.sessions.length;

    if (!progress) {
      return {
        programId: program.id,
        progress: null,
        totalSessions,
        sessionsCompleted: 0,
        completionPercentage: 0,
        totalTimeSpentSeconds: 0,
        averageTimePerSessionSeconds: 0,
        currentStreak: 0,
        nextSessionIndex: totalSessions > 0 ? 1 : null,
        isCompleted: false,
        startedAt: null,
        completedAt: null,
        lastActivityAt: null,
        exerciseCompletion: new Map(),
      };
    }

    const completedSessions = progress.sessions.filter((s) => s.completed);
    const sessionsCompleted = completedSessions.length;
    const completionPercentage =
      totalSessions > 0 ? (sessionsCompleted / totalSessions) * 100 : 0;

    const totalTimeSpentSeconds = progress.totalTimeSpentSeconds;
    const averageTimePerSessionSeconds =
      sessionsCompleted > 0
        ? Math.round(totalTimeSpentSeconds / sessionsCompleted)
        : 0;

    // Calculate current streak (consecutive days with activity)
    let currentStreak = 0;
    if (completedSessions.length > 0) {
      const sortedByDate = [...completedSessions].sort(
        (a, b) =>
          new Date(b.completedAt || "").getTime() -
          new Date(a.completedAt || "").getTime(),
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let checkDate = new Date(today);

      for (const session of sortedByDate) {
        if (!session.completedAt) continue;
        const sessionDate = new Date(session.completedAt);
        sessionDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor(
          (checkDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24),
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
      completedSessions.map((s) => s.sessionIndex),
    );
    let nextSessionIndex: number | null = null;
    for (let i = 1; i <= totalSessions; i++) {
      if (!completedIndices.has(i)) {
        nextSessionIndex = i;
        break;
      }
    }

    // Calculate exercise completion
    const exerciseCompletion = new Map<
      string,
      { completed: number; total: number }
    >();

    // Count total occurrences of each exercise across all sessions
    program.sessions.forEach((session) => {
      session.blocks.forEach((block) => {
        if (block.type === "exercise") {
          const current = exerciseCompletion.get(block.exerciseId) || {
            completed: 0,
            total: 0,
          };
          current.total++;
          exerciseCompletion.set(block.exerciseId, current);
        }
      });
    });

    // Count completed occurrences from progress
    completedSessions.forEach((sessionProgress) => {
      sessionProgress.exercises.forEach((exerciseProgress) => {
        const current = exerciseCompletion.get(exerciseProgress.exerciseId);
        if (current) {
          current.completed++;
        }
      });
    });

    const isCompleted = sessionsCompleted === totalSessions;

    return {
      programId: program.id,
      progress,
      totalSessions,
      sessionsCompleted,
      completionPercentage,
      totalTimeSpentSeconds,
      averageTimePerSessionSeconds,
      currentStreak,
      nextSessionIndex,
      isCompleted,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt || null,
      lastActivityAt: progress.lastActivityAt,
      exerciseCompletion,
    };
  }, [program, isChallenge, progress]);

  return { metrics, loading, error };
}
