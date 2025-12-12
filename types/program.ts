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

export type ChallengeConfig = {
  exerciseId: string;
  sets: number;
  targetReps: number;
  warmUpSeconds: number;
  breakSeconds: number;
};

export type Program = {
  id: string;
  name: string;
  description?: string;
  sessions: ProgramSession[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  source: ProgramSource;
  /**
   * If present, this program is a challenge that generates sessions dynamically.
   * Sessions will be generated from 20 reps to targetReps, +12% per session.
   */
  challengeConfig?: ChallengeConfig;
};
