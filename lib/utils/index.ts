/**
 * Utility functions barrel export
 */

export { daysBetween, formatDate } from './date'
export { formatCategoryLabel, getCategoryColors } from './exerciseCategory'
export { getSourceBadge, type ItemSource } from './sourceBadge'
export {
  estimateSessionMinutes,
  formatCount,
  formatDuration,
  formatReps,
  formatTime,
  getFirstReps,
  getTotalReps,
  mmssToSeconds
} from './format'
export {
  getTopPriorityPrograms,
  groupProgramsByUsage,
  isRecentlyUsed,
  prioritizePrograms,
  type ProgramWithPriority,
  type RecentActivityEntry
} from './programPrioritization'
