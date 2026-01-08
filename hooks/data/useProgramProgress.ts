/**
 * useProgramProgress - Hook for calculating program-specific progress metrics
 *
 * Calculates completion percentage, time spent, exercise completion,
 * and other program-specific metrics.
 */

import { useRefreshVersions } from "@/context/DataContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { storage } from "@/lib/storage";
import {
    calculateCompletionPercentage,
    calculateStreak
} from "@/lib/utils/progress";
import type { Program, ProgramProgress } from "@/types";
import { useCallback, useMemo } from "react";

export type ProgramProgressMetrics = {
  programId: string;
  progress: ProgramProgress | null;
  totalSessions: number;
  // Current run metrics
  currentRunIndex: number | null;
  currentRunSessionsCompleted: number;
  currentRunCompletionPercentage: number;
  currentRunStartedAt: string | null;
  currentRunCompletedAt: string | null;
  // Lifetime aggregates
  lifetimeSessionsCompleted: number;
  lifetimeTimeSpentSeconds: number;
  averageTimePerSessionSeconds: number;
  currentStreak: number;
  nextSessionIndex: number | null;
  isCurrentRunCompleted: boolean;
  lastActivityAt: string | null;
  exerciseCompletion: Map<string, { completed: number; total: number }>;
};

export function useProgramProgress(program: Program | null | undefined): {
  metrics: ProgramProgressMetrics | null;
  loading: boolean;
  error: Error | null;
} {
  const { progressVersion } = useRefreshVersions();

  const programId = program?.id;
  const isChallenge = Boolean(program?.challengeConfig);

  const fetcher = useCallback(async (): Promise<ProgramProgress | null> => {
    if (!programId || isChallenge) return null;
    return storage.loadProgramProgress(programId);
  }, [programId, isChallenge]);

  const {
    data: progress,
    loading,
    error
  } = useAsyncData(fetcher, [programId, isChallenge, progressVersion], {
    skip: !programId || isChallenge
  });

  const metrics = useMemo((): ProgramProgressMetrics | null => {
    if (!program || isChallenge) {
      return null;
    }

    // For regular programs, there's only 1 session (the entire program)
    const totalSessions = 1;

    // Default values when there is no progress yet
    if (!progress) {
      return {
        programId: program.id,
        progress: null,
        totalSessions,
        currentRunIndex: null,
        currentRunSessionsCompleted: 0,
        currentRunCompletionPercentage: 0,
        currentRunStartedAt: null,
        currentRunCompletedAt: null,
        lifetimeSessionsCompleted: 0,
        lifetimeTimeSpentSeconds: 0,
        averageTimePerSessionSeconds: 0,
        currentStreak: 0,
        nextSessionIndex: totalSessions > 0 ? 1 : null,
        isCurrentRunCompleted: false,
        lastActivityAt: null,
        exerciseCompletion: new Map()
      };
    }

    const workouts = progress.workouts ?? [];
    const completedWorkouts = workouts.filter((w) => w.completed);
    const currentRunSessionsCompleted = completedWorkouts.length;
    const currentRunCompletionPercentage = calculateCompletionPercentage(
      currentRunSessionsCompleted,
      totalSessions
    );

    const lifetimeSessionsCompleted = progress.lifetimeWorkoutsCompleted ?? 0;
    const lifetimeTimeSpentSeconds = progress.lifetimeTimeSpentSeconds ?? 0;
    const averageTimePerSessionSeconds =
      lifetimeSessionsCompleted > 0
        ? Math.round(lifetimeTimeSpentSeconds / lifetimeSessionsCompleted)
        : 0;

    // Use shared utility for streak calculation
    const currentStreak = calculateStreak(completedWorkouts);

    // For regular programs, always allow re-running session 1
    // (unlike challenges where you progress through sessions)
    const nextSessionIndex = 1;

    // Calculate exercise completion
    const exerciseCompletion = new Map<
      string,
      { completed: number; total: number }
    >();

    // Count total occurrences of each exercise across all blocks
    program.blocks.forEach((block) => {
      if (block.type === "exercise") {
        const current = exerciseCompletion.get(block.exerciseId) || {
          completed: 0,
          total: 0
        };
        current.total++;
        exerciseCompletion.set(block.exerciseId, current);
      }
    });

    // Count completed occurrences from all workouts for exercise completion
    workouts.forEach((workout) => {
      if (workout.completed) {
        workout.exercises.forEach((exerciseProgress) => {
          const current = exerciseCompletion.get(exerciseProgress.exerciseId);
          if (current) {
            current.completed++;
          }
        });
      }
    });

    const isCurrentRunCompleted =
      totalSessions > 0 && currentRunSessionsCompleted === totalSessions;

    return {
      programId: program.id,
      progress,
      totalSessions,
      currentRunIndex: workouts.length > 0 ? 1 : null,
      currentRunSessionsCompleted,
      currentRunCompletionPercentage,
      currentRunStartedAt:
        workouts.length > 0 ? (workouts[0]?.completedAt ?? null) : null,
      currentRunCompletedAt: null,
      lifetimeSessionsCompleted,
      lifetimeTimeSpentSeconds,
      averageTimePerSessionSeconds,
      currentStreak,
      nextSessionIndex,
      isCurrentRunCompleted,
      lastActivityAt: progress.lastActivityAt ?? null,
      exerciseCompletion
    };
  }, [program, isChallenge, progress]);

  return { metrics, loading, error };
}
