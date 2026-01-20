/**
 * useExercises - Hook for accessing exercise library
 *
 * Uses the DataContext for reactive updates.
 */

import { useDataContext } from "@/context/DataContext";

export function useExercises() {
  const { state } = useDataContext();

  return {
    data: state.exercises,
    loading: state.exercisesLoading,
    error: null
  } as const;
}
