/**
 * Data state and action type definitions
 */

export type DataState = {
  // Exercises & Programs (seeded + user)
  exercises: import("./exercise").Exercise[];
  exercisesLoading: boolean;
  programs: import("./program").Program[];
  programsLoading: boolean;

  // Last completed slug
  lastCompletedSlug: string | null;

  // Refresh triggers (incremented to force re-fetch)
  progressVersion: number;
  historyVersion: number;
  completedVersion: number;
};

export type DataAction =
  | { type: "SET_EXERCISES"; exercises: import("./exercise").Exercise[] }
  | { type: "SET_EXERCISES_LOADING"; loading: boolean }
  | { type: "SET_PROGRAMS"; programs: import("./program").Program[] }
  | { type: "SET_PROGRAMS_LOADING"; loading: boolean }
  | { type: "SET_LAST_COMPLETED_SLUG"; slug: string | null }
  | { type: "INCREMENT_PROGRESS_VERSION" }
  | { type: "INCREMENT_HISTORY_VERSION" }
  | { type: "INCREMENT_COMPLETED_VERSION" }
  | { type: "REFRESH_ALL" };
