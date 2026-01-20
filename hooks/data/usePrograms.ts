/**
 * usePrograms - Hook for accessing training programs
 *
 * Uses the DataContext for reactive updates.
 */

import { useDataContext } from "@/context/DataContext";

export function usePrograms() {
  const { state } = useDataContext();

  return {
    data: state.programs,
    loading: state.programsLoading,
    error: null
  } as const;
}
