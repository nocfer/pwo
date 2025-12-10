/**
 * Session and Program type definitions
 */

import type { Routine } from "./routine";

/**
 * @deprecated Use Routine type instead. Program is kept for backwards compatibility.
 */
export type Program = Routine;

export type Session = {
  index: number; // 1-based
  totalReps: number;
  sets: number[]; // length = program.exercise.sets
};

export type SessionPhase = "warmup" | "working" | "break" | "done";
