/**
 * Session and Program type definitions
 */

export type Program = {
  id: number;
  slug: string;
  exercise: {
    name: string;
    warmUp?: number; // seconds
    break?: number; // seconds between sets
    sets: number; // fixed 5 in our case
    reps?: number[]; // optional baseline
  };
};

export type Session = {
  index: number; // 1-based
  totalReps: number;
  sets: number[]; // length = program.exercise.sets
};

export type SessionPhase = "warmup" | "working" | "break" | "done";
