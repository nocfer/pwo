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
  sets: number;
  /**
   * Either a single number applied to all sets, or per-set reps.
   * If omitted, the runner will treat as an unprescribed set (user self-guided).
   */
  repsPerSet?: number | number[];
  /**
   * Optional rest between sets for this exercise block.
   * (This is separate from the generic `rest` block used between exercises.)
   */
  restSecondsBetweenSets?: number;
};

export type ProgramBlock = ProgramWarmupBlock | ProgramExerciseBlock | ProgramRestBlock;

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

