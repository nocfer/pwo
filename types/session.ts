/**
 * Session and Program type definitions
 */

import type { Challenge } from "./challenge";

/**
 * @deprecated Use Challenge type instead. Program is kept for backwards compatibility.
 */
export type Program = Challenge;

export type Session = {
  index: number; // 1-based
  totalReps: number;
  sets: number[]; // length = program.exercise.sets
};

export type SessionPhase = "warmup" | "working" | "break" | "done";
