/**
 * usePrefill — fetches last-logged reps/weight per exercise at workout start.
 * Falls back to empty map on error so callers use program targets.
 */

import { fetchPrefillData } from '@/lib/api'
import useAsyncData from '@/hooks/useAsyncData'
import type { PrefillData, PrefillMap } from '@/types/workout'
import { useMemo } from 'react'

export function usePrefill(exerciseIds: string[]) {
  const skip = exerciseIds.length === 0

  const { data, loading, error } = useAsyncData<PrefillData>(
    () => fetchPrefillData(exerciseIds),
    [exerciseIds.join(',')],
    { skip }
  )

  const prefillMap = useMemo<PrefillMap>(() => {
    const map: PrefillMap = new Map()
    if (!data) return map
    for (const entry of data) {
      map.set(entry.exerciseId, { reps: entry.reps, weight: entry.weight })
    }
    return map
  }, [data])

  return {
    prefillMap,
    isLoading: loading,
    error
  }
}
