/**
 * Hooks barrel export
 */

// Data hooks
export {
  useExercises,
  useLastCompletedSlug,
  useLiveHistory,
  useLiveProgress,
  usePrograms,
  useSessionCompletion,
  type HistoryEntry,
  type LiveProgress
} from './data'

// Workout execution (v1.2)
export { useElapsedTimer, useEndWorkout, useWorkoutExecution } from './workout'

// Responsive layout
export { useResponsiveLayout } from './useResponsiveLayout'
