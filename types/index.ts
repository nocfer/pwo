/**
 * Centralized type exports
 */

// Storage types
export type {
  EventRecord,
  HistoryEntry,
  HistoryFile,
  SessionState,
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
  LegacyProgram,
  LegacyProgramBlock,
  LegacyProgramSession,
  Program,
  ProgramBlock,
  ProgramExerciseBlock,
  ProgramRestBlock,
  ProgramSession,
  ProgramSource,
  ProgramWarmupBlock
} from "./program";

// Progress types
export type {
  ChallengeProgress,
  ExerciseProgress,
  PersonalRecord,
  PersonalRecordType,
  PRHistory,
  ProgramProgress,
  ProgressHistory,
  ProgressHistoryEntry,
  SessionProgress,
  SetRecord,
  WeeklyStats
} from "./progress";
