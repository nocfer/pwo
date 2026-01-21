/**
 * Components barrel export
 */

// Common components
export {
  AnimatedCard,
  AnimatedProgressBar,
  Button,
  EmptyState,
  ErrorScreen,
  FadeIn,
  IconButton,
  LoadingScreen,
  NoHistoryEmpty,
  NoProgressEmpty,
  NoSearchResultsEmpty,
  PulseAnimation,
  ScreenHeader,
  SearchInput,
  SessionListItem,
  Skeleton,
  SkeletonCard,
  SkeletonChallengeButton,
  SkeletonSessionCard,
  SkeletonStreakDots
} from './common'

// Session components
export { StepCard } from './cards'

// Progress components
export {
  ChallengeProgressView,
  CompactEmptyState,
  ConsistencyHeatmap,
  EnhancedExerciseProgressionChart,
  LineChart,
  PersonalRecordsCard,
  PRItem,
  ProgramProgressView,
  ProgressCalendar,
  ProgressCard,
  ProgressEmptyState,
  ProgressStats,
  ProgressView,
  ProgressViewBase,
  RingChart,
  TargetView,
  WeeklyChart,
  WeeklyChartCompact,
  WeeklySummaryCard
} from './progress'

export { ChallengeView } from './challenge'

// Data management components
export {
  DataList,
  FilterControls,
  LoadingStateList,
  SearchableList,
  SortControls,
  UnifiedDataManager
} from './data'

export { ConfettiCelebration } from './ConfettiCelebration'
export { default as ImageViewer } from './ImageViewer'

export { default as TimerControls } from './TimerControls'
