/**
 * usePRs - Hook for loading and managing personal records
 *
 * Fetches personal records from the backend Stats API and maps the response
 * to frontend PersonalRecord types. Builds prsByExercise and bestPRs maps
 * from the mapped results.
 */

import { useRefreshVersions } from '@/context/DataContext'
import { APIError, fetchExercisePRs, fetchPRs, isAPIAvailable } from '@/lib/api'
import { mapPR } from '@/lib/mappers/stats'
import type { PersonalRecord, PersonalRecordType } from '@/types'
import { useEffect, useState } from 'react'

export type PRsData = {
  latestPRs: PersonalRecord[]
  prsByExercise: Map<string, PersonalRecord[]>
  bestPRs: Map<string, Map<PersonalRecordType, PersonalRecord>>
}

export function usePRs(limit: number = 10): {
  data: PRsData | null
  loading: boolean
  error: Error | null
} {
  const { progressVersion } = useRefreshVersions()

  const [data, setData] = useState<PRsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        if (!isAPIAvailable()) {
          if (mounted) {
            setError(
              new APIError(
                'API_DISABLED',
                'API is not available or not configured'
              )
            )
            setLoading(false)
          }
          return
        }

        const apiPRs = await fetchPRs(limit)
        if (mounted) {
          const latestPRs = apiPRs.map(mapPR)

          // Build prsByExercise map
          const prsByExercise = new Map<string, PersonalRecord[]>()
          for (const pr of latestPRs) {
            const existing = prsByExercise.get(pr.exerciseId) ?? []
            existing.push(pr)
            prsByExercise.set(pr.exerciseId, existing)
          }

          // Build bestPRs map (best PR for each type per exercise)
          const bestPRs = new Map<
            string,
            Map<PersonalRecordType, PersonalRecord>
          >()
          for (const pr of latestPRs) {
            let exerciseBest = bestPRs.get(pr.exerciseId)
            if (!exerciseBest) {
              exerciseBest = new Map<PersonalRecordType, PersonalRecord>()
              bestPRs.set(pr.exerciseId, exerciseBest)
            }
            const existing = exerciseBest.get(pr.type)
            if (!existing || pr.value > existing.value) {
              exerciseBest.set(pr.type, pr)
            }
          }

          setData({ latestPRs, prsByExercise, bestPRs })
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof APIError
              ? err
              : new APIError(
                  'UNKNOWN_ERROR',
                  'Failed to fetch PRs',
                  undefined,
                  err
                )
          )
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [progressVersion, limit])

  return { data, loading, error }
}

/**
 * Hook to get PRs for a specific exercise
 */
export function useExercisePRs(exerciseId: string): {
  prs: PersonalRecord[]
  bestPRs: Map<PersonalRecordType, PersonalRecord>
  loading: boolean
  error: Error | null
} {
  const { progressVersion } = useRefreshVersions()

  const [prs, setPrs] = useState<PersonalRecord[]>([])
  const [bestPRs, setBestPRs] = useState<
    Map<PersonalRecordType, PersonalRecord>
  >(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        if (!isAPIAvailable()) {
          if (mounted) {
            setError(
              new APIError(
                'API_DISABLED',
                'API is not available or not configured'
              )
            )
            setLoading(false)
          }
          return
        }

        const apiPRs = await fetchExercisePRs(exerciseId, true)
        if (mounted) {
          const mapped = apiPRs.map(mapPR)

          // Build bestPRs map (best PR for each type)
          const best = new Map<PersonalRecordType, PersonalRecord>()
          for (const pr of mapped) {
            const existing = best.get(pr.type)
            if (!existing || pr.value > existing.value) {
              best.set(pr.type, pr)
            }
          }

          setPrs(mapped)
          setBestPRs(best)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof APIError
              ? err
              : new APIError(
                  'UNKNOWN_ERROR',
                  'Failed to fetch exercise PRs',
                  undefined,
                  err
                )
          )
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [progressVersion, exerciseId])

  return { prs, bestPRs, loading, error }
}

/**
 * Check if a PR was achieved recently (within the last N days)
 */
export function isPRRecent(pr: PersonalRecord, days: number = 7): boolean {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return new Date(pr.achievedAt) >= cutoff
}
