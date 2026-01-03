/**
 * useExerciseProgression - Hook for loading exercise progression data for charts
 */

import { useRefreshVersions } from "@/context/DataContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { storage } from "@/lib/storage";
import { useCallback, useMemo } from "react";

export type ProgressionDataPoint = {
  date: string;
  reps: number;
  maxWeight?: number;
  volume?: number;
};

export type ProgressionTrend = {
  direction: "up" | "down" | "stable";
  delta: number;
  percentChange: number;
};

export type ExerciseProgressionData = {
  dataPoints: ProgressionDataPoint[];
  trend: ProgressionTrend;
  hasWeightData: boolean;
};

export function useExerciseProgression(
  exerciseId: string | null,
  days: number = 30
): {
  data: ExerciseProgressionData | null;
  loading: boolean;
  error: Error | null;
} {
  const { progressVersion } = useRefreshVersions();

  const fetcher =
    useCallback(async (): Promise<ExerciseProgressionData | null> => {
      if (!exerciseId) return null;

      const dataPoints = await storage.getExerciseProgression(exerciseId, days);

      if (dataPoints.length === 0) {
        return {
          dataPoints: [],
          trend: { direction: "stable", delta: 0, percentChange: 0 },
          hasWeightData: false
        };
      }

      // Check if any data point has weight data
      const hasWeightData = dataPoints.some((dp) => dp.maxWeight !== undefined);

      // Calculate trend based on reps (or weight if available)
      const trend = calculateTrend(dataPoints, hasWeightData);

      return { dataPoints, trend, hasWeightData };
    }, [exerciseId, days]);

  const { data, loading, error } = useAsyncData(fetcher, [
    progressVersion,
    exerciseId,
    days
  ]);

  return { data, loading, error };
}

function calculateTrend(
  dataPoints: ProgressionDataPoint[],
  useWeight: boolean
): ProgressionTrend {
  if (dataPoints.length < 2) {
    return { direction: "stable", delta: 0, percentChange: 0 };
  }

  // Compare first half average to second half average
  const midpoint = Math.floor(dataPoints.length / 2);
  const firstHalf = dataPoints.slice(0, midpoint);
  const secondHalf = dataPoints.slice(midpoint);

  const getValue = (dp: ProgressionDataPoint) =>
    useWeight && dp.maxWeight !== undefined ? dp.maxWeight : dp.reps;

  const firstAvg =
    firstHalf.reduce((sum, dp) => sum + getValue(dp), 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, dp) => sum + getValue(dp), 0) / secondHalf.length;

  const delta = secondAvg - firstAvg;
  const percentChange = firstAvg > 0 ? (delta / firstAvg) * 100 : 0;

  let direction: "up" | "down" | "stable";
  if (percentChange > 5) {
    direction = "up";
  } else if (percentChange < -5) {
    direction = "down";
  } else {
    direction = "stable";
  }

  return {
    direction,
    delta: Math.round(delta * 10) / 10,
    percentChange: Math.round(percentChange * 10) / 10
  };
}

/**
 * Hook to get list of exercises that have progression data
 */
export function useExercisesWithProgression(): {
  exerciseIds: string[];
  loading: boolean;
} {
  const { progressVersion } = useRefreshVersions();

  const fetcher = useCallback(async (): Promise<string[]> => {
    const [programProgress, challengeProgress] = await Promise.all([
      storage.loadAllProgramProgress(),
      storage.loadAllChallengeProgress()
    ]);

    const exerciseIds = new Set<string>();

    for (const prog of programProgress) {
      for (const run of prog.runs ?? []) {
        for (const session of run.sessions ?? []) {
          for (const ex of session.exercises ?? []) {
            exerciseIds.add(ex.exerciseId);
          }
        }
      }
    }

    for (const challenge of challengeProgress) {
      for (const session of challenge.sessions ?? []) {
        for (const ex of session.exercises ?? []) {
          exerciseIds.add(ex.exerciseId);
        }
      }
    }

    return Array.from(exerciseIds);
  }, []);

  const { data, loading } = useAsyncData(fetcher, [progressVersion]);

  return { exerciseIds: data ?? [], loading };
}
