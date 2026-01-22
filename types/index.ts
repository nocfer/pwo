/**
 * Centralized type exports
 */

// Storage types
export type {
  EventRecord,
  HistoryEntry,
  HistoryFile,
  SessionState,
  StepCompletionAttempt,
  StepCompletionRecord,
  StepCompletionState,
  StepStatus,
  StreakEntry
} from "./storage";

// Event types
export type { DataEvent, DataEventCallback, DataEventType } from "./events";

// Session types
export type { Session, SessionPhase } from "./session";

// Data state types
export type { DataAction, DataState } from "./challenge";

// Exercise types
export type { Exercise, ExerciseCategory, ExerciseSource } from "./exercise";

// Program types
export type {
  ChallengeConfig,
  Program,
  ProgramBlock,
  ProgramExerciseBlock,
  ProgramSession,
  ProgramSource
} from "./program";

// Progress types
export type {
  ChallengeProgress,
  ExerciseProgress, PersonalRecord,
  PersonalRecordType, PRHistory, ProgramProgress,
  ProgressHistory,
  ProgressHistoryEntry,
  SessionProgress, // Legacy alias for WorkoutProgress
  SetRecord,
  WeeklyStats,
  WorkoutProgress
} from "./progress";

// Enhanced types
export type {
  AuditAction,
  AuditLogEntry,
  ConflictResolution,
  CustomValidator,
  DataType,
  DateRange,
  DependencyCheck,
  DependencyResult,
  EnhancedChallenge,
  EnhancedChallengeConfig,
  EnhancedDataActions,
  EnhancedDataState,
  EnhancedExercise,
  EnhancedProgram,
  ExportData,
  FieldValidation,
  ImportData, ImportedItem, ImportError,
  ImportErrorCode,
  ImportResult, OperationStatus,
  SearchFacets,
  SearchQuery,
  SearchResult,
  SearchState,
  SkippedItem,
  UsageStats,
  UsageTrend,
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
  ValidationSchema,
  ValidationWarning,
  ValidationWarningCode
} from "./enhanced";

