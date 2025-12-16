/**
 * Components barrel export
 */

// Common components
export {
  AnimatedCard,
  AnimatedProgressBar,
  Button,
  EmptyState,
  FadeIn,
  NoChallengesEmpty,
  NoHistoryEmpty,
  NoProgressEmpty,
  NoSearchResultsEmpty,
  PulseAnimation,
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
  ProgramProgressView,
  ProgressCalendar,
  ProgressCard,
  ProgressStats,
  ProgressView,
  RepsProgressionChart,
  SessionsCompletedChart,
  TargetView,
  WeeklyChart,
  WeeklyChartCompact
} from "./progress";

// Individual components (not moved)
export { ConfettiCelebration } from "./ConfettiCelebration";
export { default as ImageViewer } from "./ImageViewer";
export { default as TimerControls } from "./TimerControls";
