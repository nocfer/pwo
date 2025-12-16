/**
 * Progress tracking type definitions
 * Separate tracking systems for challenges and training programs
 */

/**
 * Individual set record with optional weight tracking
 */
export type SetRecord = {
  reps: number;
  weight?: number; // kg or lbs (undefined for bodyweight)
  isBodyweight: boolean;
  timestamp: string; // ISO date
};

/**
 * Exercise-level progress tracking (enhanced with set details)
 */
export type ExerciseProgress = {
  exerciseId: string;
  repsCompleted: number;
  setsCompleted: number;
  sets?: SetRecord[]; // Detailed per-set tracking (optional for backward compat)
  totalVolume?: number; // weight x reps (for weighted exercises)
  lastCompletedAt: string; // ISO date
};

/**
 * Personal Record type
 */
export type PersonalRecordType =
  | "max_weight"
  | "max_reps"
  | "max_volume"
  | "estimated_1rm";

/**
 * Personal Record entry
 */
export type PersonalRecord = {
  id: string; // Unique PR identifier
  exerciseId: string;
  type: PersonalRecordType;
  value: number;
  achievedAt: string; // ISO date
  sessionId?: string; // Reference to the session where PR was achieved
  details?: {
    weight?: number;
    reps?: number;
  };
};

/**
 * PR history for an exercise
 */
export type PRHistory = {
  exerciseId: string;
  records: PersonalRecord[]; // Historical PRs for trends
};

/**
 * Weekly stats aggregation
 */
export type WeeklyStats = {
  weekStart: string; // ISO date (Monday)
  weekEnd: string; // ISO date (Sunday)
  workoutsCompleted: number;
  workoutGoal: number; // Target workouts per week (default: 4)
  totalTimeSeconds: number;
  totalVolume: number; // Sum of (weight x reps) for weighted exercises
  totalReps: number; // Sum of all reps (bodyweight + weighted)
  exercisesPerformed: string[]; // Unique exercise IDs
  prsAchieved: number;
  currentStreak: number; // Consecutive days with workouts ending in this week
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
