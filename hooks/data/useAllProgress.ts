/**
 * useAllProgress - Hook for aggregating progress across all programs and challenges
 *
 * Provides overall statistics and recent activity timeline.
 */

import { useRefreshVersions } from "@/context/DataContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { storage } from "@/lib/storage";
import { getActivityDates } from "@/lib/utils/progress";
import type { ChallengeProgress, ProgramProgress } from "@/types";
import { useCallback, useMemo } from "react";

export type AggregatedProgress = {
  totalWorkoutsCompleted: number;
  totalTimeSpentSeconds: number;
  totalRepsCompleted: number;
  activeChallenges: number;
  activePrograms: number;
  currentStreak: number;
  recentActivity: {
    date: string;
    type: "challenge" | "program";
    id: string;
    sessionIndex: number;
  }[];
};

type AllProgressData = {
  programProgress: ProgramProgress[];
  challengeProgress: ChallengeProgress[];
};

export function useAllProgress(): {
  data: AggregatedProgress | null;
  loading: boolean;
  error: Error | null;
} {
  const { progressVersion } = useRefreshVersions();

  const fetcher = useCallback(async (): Promise<AllProgressData> => {
    const [programProgress, challengeProgress] = await Promise.all([
      storage.loadAllProgramProgress(),
      storage.loadAllChallengeProgress()
    ]);
    return { programProgress, challengeProgress };
  }, []);

  const {
    data: progressData,
    loading,
    error
  } = useAsyncData(fetcher, [progressVersion]);

  const data = useMemo((): AggregatedProgress | null => {
    if (loading || !progressData) return null;

    const { programProgress, challengeProgress } = progressData;

    let totalWorkoutsCompleted = 0;
    let totalTimeSpentSeconds = 0;
    let totalRepsCompleted = 0;
    const recentActivity: AggregatedProgress["recentActivity"] = [];

    // Process program progress (across all runs)
    programProgress.forEach((progress) => {
      const runs = progress.runs ?? [];
      runs.forEach((run) => {
        const completedSessions = run.sessions.filter((s) => s.completed);
        totalWorkoutsCompleted += completedSessions.length;
        totalTimeSpentSeconds += run.totalTimeSpentSeconds || 0;

        completedSessions.forEach((session) => {
          if (session.completedAt) {
            recentActivity.push({
              date: session.completedAt,
              type: "program",
              id: progress.programId,
              sessionIndex: session.sessionIndex
            });
          }
        });
      });
    });

    // Process challenge progress
    challengeProgress.forEach((progress) => {
      const completedSessions = progress.sessions.filter((s) => s.completed);
      totalWorkoutsCompleted += completedSessions.length;
      totalRepsCompleted += progress.totalRepsCompleted || 0;

      completedSessions.forEach((session) => {
        if (session.completedAt) {
          recentActivity.push({
            date: session.completedAt,
            type: "challenge",
            id: progress.challengeId,
            sessionIndex: session.sessionIndex
          });
        }
      });
    });

    // Sort recent activity by date (most recent first)
    recentActivity.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate overall streak using activity dates
    let currentStreak = 0;
    const activityDates = getActivityDates(
      recentActivity.map((a) => ({ completedAt: a.date }))
    );
    const sortedDates = Array.from(activityDates).sort().reverse();

    if (sortedDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let checkDate = new Date(today);

      for (const dateStr of sortedDates) {
        const activityDate = new Date(dateStr);
        activityDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor(
          (checkDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 0 || (currentStreak === 0 && daysDiff <= 1)) {
          currentStreak++;
          checkDate = new Date(activityDate);
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Count active programs/challenges
    const activePrograms = programProgress.filter((p) => {
      const runs = p.runs ?? [];
      const currentRun = runs[runs.length - 1];
      if (!currentRun) return false;
      const completed = currentRun.sessions.filter((s) => s.completed).length;
      const total = currentRun.sessions.length;
      return completed > 0 && total > 0 && completed < total;
    }).length;

    const activeChallenges = challengeProgress.filter((c) => {
      const completed = c.sessions.filter((s) => s.completed).length;
      return completed > 0 && completed < c.sessions.length;
    }).length;

    return {
      totalWorkoutsCompleted,
      totalTimeSpentSeconds,
      totalRepsCompleted,
      activeChallenges,
      activePrograms,
      currentStreak,
      recentActivity: recentActivity.slice(0, 20)
    };
  }, [progressData, loading]);

  return { data, loading, error };
}
