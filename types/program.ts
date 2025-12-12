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

export type Program = {
  id: string;
  name: string;
  description?: string;
  sessions: ProgramSession[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  source: ProgramSource;
};

