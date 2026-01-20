/**
 * useLastCompletedSlug - Hook for getting the last completed challenge slug
 *
 * Uses the DataContext for reactive updates.
 */

import { useDataContext } from "@/context/DataContext";

export function useLastCompletedSlug(): string | null {
  const { state } = useDataContext();
  return state.lastCompletedSlug;
}
