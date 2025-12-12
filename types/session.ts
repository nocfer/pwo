/**
 * Session and Program type definitions
 */

/**
 * Session type used by the existing Challenge flow.
 */
export type Session = {
  index: number; // 1-based
  totalReps: number;
  sets: number[]; // length = program.exercise.sets
};

export type SessionPhase = "warmup" | "working" | "break" | "done";
