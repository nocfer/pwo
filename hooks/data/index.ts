/**
 * Data hooks barrel export
 */

export { useAllProgress, type AggregatedProgress } from "./useAllProgress";
export {
  useChallengeProgress,
  type ChallengeProgressMetrics
} from "./useChallengeProgress";
export {
  calculateChallengeSessionCount,
  generateChallengeSessions,
  useChallengeSessions
} from "./useChallengeSessions";
export {
  getDayLabels,
  useConsistencyData,
  useConsistencyPercentage,
  type ConsistencyData,
  type ConsistencyLevel,
  type DayData,
  type WeekData
} from "./useConsistencyData";
export { useExercises } from "./useExercises";
export {
  useExerciseProgression,
  useExercisesWithProgression,
  type ExerciseProgressionData,
  type ProgressionDataPoint,
  type ProgressionTrend
} from "./useExerciseProgression";
export { useLastCompletedSlug } from "./useLastCompletedSlug";
export { useLiveHistory, type HistoryEntry } from "./useLiveHistory";
export { useLiveProgress, type LiveProgress } from "./useLiveProgress";
export { isPRRecent, useExercisePRs, usePRs, type PRsData } from "./usePRs";
export {
  useProgramProgress,
  type ProgramProgressMetrics
} from "./useProgramProgress";
export { usePrograms } from "./usePrograms";
export { useSessionCompletion } from "./useSessionCompletion";
export { useWeeklyActivity } from "./useWeeklyActivity";
export {
  formatDurationShort,
  useWeeklyCompletion,
  useWeeklyStats
} from "./useWeeklyStats";
