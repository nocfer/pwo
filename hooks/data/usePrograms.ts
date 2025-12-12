/**
 * usePrograms - Hook for accessing training programs
 *
 * Uses the DataContext for reactive updates.
 */

import DataContext from "@/context/DataContext";
import { useContext } from "react";

export function usePrograms() {
  const context = useContext(DataContext);
  if (!context) {
    // Should not happen in normal app usage
    return { data: null, loading: false, error: null } as const;
  }

  return {
    data: context.state.programs,
    loading: context.state.programsLoading,
    error: null,
  } as const;
}

