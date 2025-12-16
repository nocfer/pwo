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
  LoadingScreen,
  NoChallengesEmpty,
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
export { FocusCard, StepCard } from "./cards";

// Progress components
export {
  ChallengeProgressView,
  CompactEmptyState,
  ConsistencyHeatmap,
  ExerciseProgressionChart,
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
  RepsProgressionChart,
  RingChart,
  SessionsCompletedChart,
  TargetView,
  WeeklyChart,
  WeeklyChartCompact,
  WeeklySummaryCard
} from "./progress";

export { ChallengesView, SwipeableChallengeButton } from "./challenge";

// Individual components (not moved)
export { ConfettiCelebration } from "./ConfettiCelebration";
export { default as ImageViewer } from "./ImageViewer";
export { default as TimerControls } from "./TimerControls";
