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
 * Program run - a single full pass through a program's sessions
 */
export type ProgramRun = {
  runId: string;
  startedAt: string; // ISO date
  completedAt?: string; // ISO date
  sessions: SessionProgress[]; // Progress for each session in this run
  totalTimeSpentSeconds: number; // Total time for this run
  lastActivityAt: string | null; // ISO date of last session completion within this run
  updatedAt: string; // ISO date of last update for this run
};

/**
 * Program-level progress tracking (for regular training programs)
 *
 * Programs are open-ended and can be repeated many times.
 * - `runs` captures each individual cycle through the program.
 * - `lifetime*` aggregates capture totals across all runs.
 *
 * The legacy single-run shape (`startedAt`, `completedAt`, `sessions`,
 * `totalTimeSpentSeconds`) is kept optional for migration/backwards
 * compatibility. New code should use runs + lifetime fields instead.
 */
export type ProgramProgress = {
  programId: string;
  runs: ProgramRun[];
  lifetimeSessionsCompleted: number;
  lifetimeTimeSpentSeconds: number;
  lastActivityAt: string | null; // ISO date of last session completion across all runs
  updatedAt: string; // ISO date of last update

  /**
   * Legacy single-run shape (deprecated, kept for migration/back-compat).
   * Do not rely on these fields in new code.
   */
  startedAt?: string; // ISO date
  completedAt?: string; // ISO date
  sessions?: SessionProgress[]; // Progress for each session (single run)
  totalTimeSpentSeconds?: number; // Total time across legacy sessions
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
