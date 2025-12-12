/**
 * Exercise model (user-managed library)
 */

export type ExerciseSource = "builtin" | "user";

export type ExerciseCategory = "strength" | "cardio" | "flexibility" | "skill";

export type Exercise = {
  id: string;
  name: string;
  category?: ExerciseCategory;
  /**
   * Ionicons glyph name (e.g. "barbell", "walk", "fitness")
   * Stored as string to keep the model platform-agnostic.
   */
  icon?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  source: ExerciseSource;
};
