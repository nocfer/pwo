/**
 * useExercises - Hook for accessing exercise library
 *
 * Uses the DataContext for reactive updates.
 */

import DataContext from "@/context/DataContext";
import { useContext } from "react";

export function useExercises() {
  const context = useContext(DataContext);
  if (!context) {
    // Should not happen in normal app usage
    return { data: null, loading: false, error: null } as const;
  }

  return {
    data: context.state.exercises,
    loading: context.state.exercisesLoading,
    error: null,
  } as const;
}
