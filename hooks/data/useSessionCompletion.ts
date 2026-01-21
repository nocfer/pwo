/**
 * useSessionCompletion - Hook for tracking completed sessions
 *
 * Uses unified storage and subscribes to session completion events
 * for automatic UI updates.
 */

import { useRefreshVersions } from '@/context/DataContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { storage } from '@/lib/storage'
import { useCallback } from 'react'

export function useSessionCompletion(slug: string | undefined) {
  const { completedVersion } = useRefreshVersions()

  const fetcher = useCallback(async (): Promise<Set<number>> => {
    if (!slug) return new Set()
    return storage.loadCompletedSessions(slug)
  }, [slug])

  const { data, loading, error } = useAsyncData(
    fetcher,
    [slug, completedVersion],
    {
      skip: !slug,
      initialData: new Set<number>()
    }
  )

  return { completed: data ?? new Set<number>(), loading, error } as const
}
