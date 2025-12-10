/**
 * Routine-related type definitions
 */

export type RoutineExercise = {
  name: string;
  warmUp?: number; // seconds
  break?: number; // seconds between sets
  sets: number;
  targetReps?: number;
};

export type Routine = {
  slug: string;
  name: string;
  description?: string;
  category?: "strength" | "cardio" | "flexibility";
  icon?: string;
  estimatedMinutes?: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  exercise?: RoutineExercise;
};

export type DataState = {
  // Routines (from static assets)
  routines: Routine[];
  routinesLoading: boolean;

  // Last completed slug
  lastCompletedSlug: string | null;

  // Refresh triggers (incremented to force re-fetch)
  progressVersion: number;
  historyVersion: number;
  completedVersion: number;
};

export type DataAction =
  | { type: "SET_ROUTINES"; routines: Routine[] }
  | { type: "SET_ROUTINES_LOADING"; loading: boolean }
  | { type: "SET_LAST_COMPLETED_SLUG"; slug: string | null }
  | { type: "INCREMENT_PROGRESS_VERSION" }
  | { type: "INCREMENT_HISTORY_VERSION" }
  | { type: "INCREMENT_COMPLETED_VERSION" }
  | { type: "REFRESH_ALL" };
