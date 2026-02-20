/**
 * useChallengeProgress - Hook for calculating challenge-specific progress metrics
 *
 * TODO: The backend has no challenge-specific progress tracking.
 * Currently fetches aggregated progress from the API and derives placeholder
 * metrics from available data (e.g., totalRepsCompleted, currentStreak,
 * recentActivity entries matching the challenge slug). Once the backend adds
 * challenge-specific endpoints, this hook should be updated to use them for
 * accurate challenge-level metrics.
 */

import { useRefreshVersions } from '@/context/DataContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import {
  APIError,
  type APIProgress,
  fetchProgress,
  isAPIAvailable
} from '@/lib/api'
import type { Program } from '@/types'
import { useCallback, useMemo } from 'react'
import { generateChallengeSessions } from './useChallengeSessions'

export type ChallengeProgressMetrics = {
  challengeId: string
  progress: null
  totalSessions: number
  sessionsCompleted: number
  completionPercentage: number
  totalRepsCompleted: number
  targetReps: number
  repsProgressPercentage: number
  currentStreak: number
  nextSessionIndex: number | null
  isCompleted: boolean
  startedAt: string | null
  completedAt: string | null
  lastActivityAt: string | null
}

function deriveMetrics(
  challenge: Program,
  sessions: { sessionIndex: number }[],
  apiProgress: APIProgress
): ChallengeProgressMetrics {
  const challengeConfig = challenge.challengeConfig!
  const totalSessions = sessions.length
  const targetReps = challengeConfig.targetReps

  // Count recentActivity entries matching this challenge's slug as completed sessions
  const matchingActivity = apiProgress.recentActivity.filter(
    entry => entry.workoutId === challenge.slug
  )
  const sessionsCompleted = matchingActivity.length

  const completionPercentage =
    totalSessions > 0
      ? Math.round(
          (Math.min(sessionsCompleted, totalSessions) / totalSessions) * 100
        )
      : 0

  // Use global totalRepsCompleted as a rough proxy (no per-challenge breakdown)
  const totalRepsCompleted = apiProgress.totalRepsCompleted
  const repsProgressPercentage =
    targetReps > 0
      ? Math.min(100, Math.round((totalRepsCompleted / targetReps) * 100))
      : 0

  const lastEntry =
    matchingActivity.length > 0
      ? matchingActivity[matchingActivity.length - 1]
      : null

  // Derive next session index from completed count
  const nextSessionIndex =
    sessionsCompleted < totalSessions ? sessionsCompleted + 1 : null

  const isCompleted =
    sessionsCompleted >= totalSessions && totalRepsCompleted >= targetReps

  return {
    challengeId: challenge.id,
    progress: null, // No per-challenge ChallengeProgress from API
    totalSessions,
    sessionsCompleted,
    completionPercentage,
    totalRepsCompleted,
    targetReps,
    repsProgressPercentage,
    currentStreak: apiProgress.currentStreak,
    nextSessionIndex,
    isCompleted,
    startedAt: lastEntry?.date ?? null,
    completedAt: null, // Not available from API
    lastActivityAt: lastEntry?.date ?? null
  }
}

function buildEmptyMetrics(
  challengeId: string,
  totalSessions: number,
  targetReps: number
): ChallengeProgressMetrics {
  return {
    challengeId,
    progress: null,
    totalSessions,
    sessionsCompleted: 0,
    completionPercentage: 0,
    totalRepsCompleted: 0,
    targetReps,
    repsProgressPercentage: 0,
    currentStreak: 0,
    nextSessionIndex: totalSessions > 0 ? 1 : null,
    isCompleted: false,
    startedAt: null,
    completedAt: null,
    lastActivityAt: null
  }
}

export function useChallengeProgress(challenge: Program | null | undefined): {
  metrics: ChallengeProgressMetrics | null
  loading: boolean
  error: Error | null
} {
  const { progressVersion } = useRefreshVersions()

  const challengeId = challenge?.id
  const challengeConfig = challenge?.challengeConfig
  const isChallenge = Boolean(challengeConfig)

  // Generate sessions to know total count - only depends on config, not entire challenge
  const sessions = useMemo(() => {
    if (!challengeConfig) return []
    return generateChallengeSessions(challengeConfig)
  }, [challengeConfig])

  const fetcher = useCallback(async (): Promise<APIProgress> => {
    if (!isAPIAvailable()) {
      throw new APIError(
        'API_DISABLED',
        'API is not available or not configured'
      )
    }
    return fetchProgress()
  }, [])

  const {
    data: apiProgress,
    loading,
    error
  } = useAsyncData(fetcher, [challengeId, progressVersion], {
    skip: !challengeId || !isChallenge
  })

  const metrics = useMemo((): ChallengeProgressMetrics | null => {
    if (!challenge || !challengeConfig) {
      return null
    }

    const targetReps = challengeConfig.targetReps

    if (!apiProgress) {
      return buildEmptyMetrics(challenge.id, sessions.length, targetReps)
    }

    return deriveMetrics(challenge, sessions, apiProgress)
  }, [challenge, challengeConfig, apiProgress, sessions])

  return { metrics, loading, error }
}
