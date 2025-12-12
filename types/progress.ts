/**
 * Progress tracking type definitions
 * Separate tracking systems for challenges and training programs
 */

/**
 * Exercise-level progress tracking
 */
export type ExerciseProgress = {
  exerciseId: string;
  repsCompleted: number;
  setsCompleted: number;
  lastCompletedAt: string; // ISO date
};

/**
 * Session-level progress tracking
 */
export type SessionProgress = {
  sessionIndex: number;
  completed: boolean;
  completedAt?: string; // ISO date
  timeSpentSeconds?: number; // Duration of the session
  exercises: ExerciseProgress[]; // Exercise-level progress for this session
};

/**
 * Program-level progress tracking (for regular training programs)
 */
export type ProgramProgress = {
  programId: string;
  startedAt: string; // ISO date
  completedAt?: string; // ISO date
  sessions: SessionProgress[]; // Progress for each session
  totalTimeSpentSeconds: number; // Total time across all sessions
  lastActivityAt: string; // ISO date of last session completion
  updatedAt: string; // ISO date of last update
};

/**
 * Challenge-specific progress tracking
 */
export type ChallengeProgress = {
  challengeId: string;
  startedAt: string; // ISO date
  completedAt?: string; // ISO date
  sessions: SessionProgress[]; // Progress for each session
  totalRepsCompleted: number; // Total reps across all sessions
  targetReps: number; // Target reps from challenge config
  lastActivityAt: string; // ISO date of last session completion
  updatedAt: string; // ISO date of last update
};

/**
 * Historical snapshot for charts and trends
 */
export type ProgressHistoryEntry = {
  date: string; // ISO date
  programId?: string; // For program progress
  challengeId?: string; // For challenge progress
  sessionsCompleted: number;
  totalReps?: number; // For challenges
  timeSpentSeconds?: number; // For programs
};

export type ProgressHistory = ProgressHistoryEntry[];
