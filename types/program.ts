/**
 * Training Program model (multi-exercise sessions)
 */

export type ProgramSource = "builtin" | "user";

export type ProgramWarmupBlock = {
  type: "warmup";
  seconds: number;
};

export type ProgramRestBlock = {
  type: "rest";
  seconds: number;
  label?: string;
};

export type ProgramExerciseBlock = {
  type: "exercise";
  exerciseId: string;
  /**
   * Optional rep target for the exercise.
   * If omitted, the step is self-guided (user does their reps).
   */
  targetReps?: number;
  /**
   * Optional timed work (seconds). If set, the runner will start a timer.
   */
  durationSeconds?: number;
  /**
   * Optional short note (e.g. form cue, load, previous sets info after migration).
   */
  note?: string;
  /**
   * Number of sets for this exercise block (defaults to 1).
   */
  sets?: number;
  /**
   * Rest duration in seconds between consecutive sets (defaults to 60).
   */
  restBetweenSets?: number;
};

export type ProgramBlock =
  | ProgramWarmupBlock
  | ProgramExerciseBlock
  | ProgramRestBlock;

export type ProgramSession = {
  index: number; // 1-based
  name?: string;
  blocks: ProgramBlock[];
};

export type ChallengeConfig = {
  exerciseId: string;
  sets: number;
  initialReps?: number;
  targetReps: number;
  warmUpSeconds: number;
  breakSeconds: number;
  /**
   * Weekly increase percentage for rep progression (default: 10%).
   * Each week increases total reps by this percentage.
   */
  weeklyIncreasePercent?: number;
};

export type Program = {
  id: string;
  name: string;
  description?: string;
  blocks: ProgramBlock[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  source: ProgramSource;
  /**
   * If present, this program is a challenge that generates blocks dynamically.
   * Blocks will be generated from 20 reps to targetReps, with configurable
   * percentage increase per session (default: 10%).
   */
  challengeConfig?: ChallengeConfig;
  /**
   * Optional initial warmup configuration for the program.
   * When configured, displays as a distinct warmup block at the start.
   */
  initialWarmup?: {
    seconds: number;
  };
  /**
   * Default rest duration in seconds between different exercises.
   * Applied when transitioning between exercises unless overridden.
   * Defaults to 60 seconds if not specified.
   */
  defaultRestBetweenExercises?: number;
};

/**
 * Legacy program block format (used for migration from old data format)
 * Supports old repsPerSet/sets structure for backward compatibility
 */
export type LegacyProgramBlock = {
  type: "warmup" | "exercise" | "rest";
  exerciseId?: string;
  seconds?: number;
  label?: string;
  sets?: number;
  repsPerSet?: number | number[];
  restSecondsBetweenSets?: number;
  targetReps?: number;
  durationSeconds?: number;
  note?: string;
};

/**
 * Legacy program session format (used for migration from old data format)
 */
export type LegacyProgramSession = {
  index?: number;
  name?: string;
  blocks?: LegacyProgramBlock[];
};

/**
 * Legacy program format with sessions (used for migration from old data format)
 */
export type LegacyProgramWithSessions = {
  id?: string;
  name?: string;
  description?: string;
  sessions?: LegacyProgramSession[];
  createdAt?: string;
  updatedAt?: string;
  source?: ProgramSource;
  challengeConfig?: Partial<ChallengeConfig>;
};

/**
 * Legacy program format (used for migration from old data format)
 */
export type LegacyProgram = {
  id?: string;
  name?: string;
  description?: string;
  sessions?: LegacyProgramSession[];
  createdAt?: string;
  updatedAt?: string;
  source?: ProgramSource;
  challengeConfig?: Partial<ChallengeConfig>;
};
