/**
 * Data hooks barrel export
 */

export { useAllProgress, type AggregatedProgress } from './useAllProgress'
export { useAPIExercises, type UseAPIExercisesState } from './useAPIExercises'
export { useAPIPrograms, type UseAPIProgramsState } from './useAPIPrograms'
export {
  getDayLabels,
  useConsistencyData,
  useConsistencyPercentage,
  type ConsistencyData,
  type ConsistencyLevel,
  type DayData,
  type WeekData
} from './useConsistencyData'
export {
  useExerciseProgression,
  useExercisesWithProgression,
  type ExerciseProgressionData,
  type ProgressionDataPoint,
  type ProgressionTrend
} from './useExerciseProgression'
export { useExercises } from './useExercises'
export { useLastCompletedSlug } from './useLastCompletedSlug'
export { useLiveHistory, type HistoryEntry } from './useLiveHistory'
export { useLiveProgress, type LiveProgress } from './useLiveProgress'
export {
  useProgramProgress,
  type ProgramProgressMetrics
} from './useProgramProgress'
export { usePrograms } from './usePrograms'
export { isPRRecent, useExercisePRs, usePRs, type PRsData } from './usePRs'
export { useSessionCompletion } from './useSessionCompletion'
export { useWeeklyActivity } from './useWeeklyActivity'
export { useWeeklyCompletion, useWeeklyStats } from './useWeeklyStats'
