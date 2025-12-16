/**
 * Progress components barrel export
 */

// Legacy components (kept for backward compatibility)
export { default as ChallengeProgressView } from "./ChallengeProgressView";
export { default as ProgramProgressView } from "./ProgramProgressView";
export { default as ProgressCalendar } from "./ProgressCalendar";
export { default as ProgressCard } from "./ProgressCard";
export { RepsProgressionChart, SessionsCompletedChart } from "./ProgressCharts";
export { default as ProgressStats } from "./ProgressStats";
export { default as ProgressView } from "./ProgressView";
export { ProgressViewBase, type StatItem } from "./ProgressViewBase";
export { TargetView } from "./TargetView";
export { WeeklyChart, WeeklyChartCompact } from "./WeeklyChart";

// New progress components
export { default as ConsistencyHeatmap } from "./ConsistencyHeatmap";
export { default as ExerciseProgressionChart } from "./ExerciseProgressionChart";
export { default as LineChart, type DataPoint } from "./LineChart";
export { default as PersonalRecordsCard } from "./PersonalRecordsCard";
export { default as PRItem } from "./PRItem";
export {
  CompactEmptyState,
  default as ProgressEmptyState
} from "./ProgressEmptyState";
export { default as RingChart } from "./RingChart";
export { default as WeeklySummaryCard } from "./WeeklySummaryCard";
