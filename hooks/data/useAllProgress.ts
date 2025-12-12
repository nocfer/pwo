/**
 * useAllProgress - Hook for aggregating progress across all programs and challenges
 *
 * Provides overall statistics and recent activity timeline.
 */

import { useRefreshVersions } from "@/context/DataContext";
import { storage } from "@/lib/storage";
import type { ChallengeProgress, ProgramProgress } from "@/types";
import { useEffect, useMemo, useState } from "react";

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

export function useAllProgress(): {
  data: AggregatedProgress | null;
  loading: boolean;
  error: Error | null;
} {
  const [programProgress, setProgramProgress] = useState<ProgramProgress[]>([]);
  const [challengeProgress, setChallengeProgress] = useState<
    ChallengeProgress[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { progressVersion } = useRefreshVersions();

  useEffect(() => {
    let mounted = true;

    async function loadAllProgress() {
      try {
        setLoading(true);
        const [programs, challenges] = await Promise.all([
          storage.loadAllProgramProgress(),
          storage.loadAllChallengeProgress()
        ]);

        if (mounted) {
          setProgramProgress(programs);
          setChallengeProgress(challenges);
        }
      } catch (e) {
        if (mounted) setError(e as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAllProgress();

    return () => {
      mounted = false;
    };
  }, [progressVersion]);

  const data = useMemo((): AggregatedProgress | null => {
    if (loading) return null;

    let totalWorkoutsCompleted = 0;
    let totalTimeSpentSeconds = 0;
    let totalRepsCompleted = 0;
    const recentActivity: AggregatedProgress["recentActivity"] = [];

    // Process program progress
    programProgress.forEach((progress) => {
      const completedSessions = progress.sessions.filter((s) => s.completed);
      totalWorkoutsCompleted += completedSessions.length;
      totalTimeSpentSeconds += progress.totalTimeSpentSeconds || 0;

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

    // Calculate overall streak (longest streak across all programs/challenges)
    let currentStreak = 0;
    const allLastActivity = [
      ...programProgress.map((p) => p.lastActivityAt).filter(Boolean),
      ...challengeProgress.map((c) => c.lastActivityAt).filter(Boolean)
    ];

    if (allLastActivity.length > 0) {
      const mostRecent = new Date(
        Math.max(...allLastActivity.map((d) => new Date(d).getTime()))
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      mostRecent.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 1) {
        // Count consecutive days with activity
        const activityDates = new Set(
          recentActivity.map((a) => a.date.slice(0, 10))
        );
        const sortedDates = Array.from(activityDates).sort().reverse();

        let checkDate = new Date(today);
        for (const dateStr of sortedDates) {
          const activityDate = new Date(dateStr);
          activityDate.setHours(0, 0, 0, 0);

          const daysDiff2 = Math.floor(
            (checkDate.getTime() - activityDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (daysDiff2 === 0 || (currentStreak === 0 && daysDiff2 <= 1)) {
            currentStreak++;
            checkDate = new Date(activityDate);
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // Count active programs/challenges (those with at least one session completed but not all)
    const activePrograms = programProgress.filter((p) => {
      const completed = p.sessions.filter((s) => s.completed).length;
      return completed > 0 && completed < p.sessions.length;
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
      recentActivity: recentActivity.slice(0, 20) // Last 20 activities
    };
  }, [programProgress, challengeProgress, loading]);

  return { data, loading, error };
}
