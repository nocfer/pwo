/**
 * Utility functions barrel export
 */

export { daysBetween, formatDate } from './date'
export { formatCategoryLabel, getCategoryColors } from './exerciseCategory'
export { getSourceBadge, type ItemSource } from './sourceBadge'
export {
  formatCount,
  formatDuration,
  formatReps,
  formatTime,
  getFirstReps,
  getTotalReps
} from './format'
export {
  getTopPriorityPrograms,
  groupProgramsByUsage,
  isRecentlyUsed,
  prioritizePrograms,
  type ProgramWithPriority,
  type RecentActivityEntry
} from './programPrioritization'
