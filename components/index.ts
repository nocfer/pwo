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
} from "./common";

// Session components
export { StepCard } from "./cards";

// Progress components
export {
  ChallengeProgressView,
  CompactEmptyState,
  ConsistencyHeatmap,
  ExerciseProgressionChart,
  LineChart,
  PRItem,
  PersonalRecordsCard,
  ProgramProgressView,
  ProgressCalendar,
  ProgressCard,
  ProgressEmptyState,
  ProgressStats,
  ProgressView,
  ProgressViewBase,
  RepsProgressionChart,
  RingChart,
  SessionsCompletedChart,
  TargetView,
  WeeklyChart,
  WeeklyChartCompact,
  WeeklySummaryCard
} from "./progress";

export { ChallengeView } from "./challenge";

// Data management components
export {
  DataList,
  FilterControls,
  LoadingStateList,
  SearchableList,
  SortControls,
  UnifiedDataManager
} from "./data";

// Individual components (not moved)
export { ConfettiCelebration } from "./ConfettiCelebration";
export { default as ImageViewer } from "./ImageViewer";
export { default as TimerControls } from "./TimerControls";
