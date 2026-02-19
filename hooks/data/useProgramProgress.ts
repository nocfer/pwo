/**
 * useProgramProgress - Hook for calculating program-specific progress metrics
 *
 * TODO: The backend does not yet support per-program session tracking.
 * Currently fetches aggregated progress from the API and derives partial
 * metrics from available data (e.g., counting recentActivity entries that
 * match the program slug). Once the backend adds per-program endpoints,
 * this hook should be updated to use them for accurate per-program metrics.
 */

export type ProgramProgressMetrics = {
  programId: string
  progress: null
  totalSessions: number
  // Current run metrics
  currentRunIndex: number | null
  currentRunSessionsCompleted: number
  currentRunCompletionPercentage: number
  currentRunStartedAt: string | null
  currentRunCompletedAt: string | null
  // Lifetime aggregates
  lifetimeSessionsCompleted: number
  lifetimeTimeSpentSeconds: number
  averageTimePerSessionSeconds: number
  currentStreak: number
  nextSessionIndex: number | null
  isCurrentRunCompleted: boolean
  lastActivityAt: string | null
  exerciseCompletion: Map<string, { completed: number; total: number }>
}
/**
 * Derive partial program metrics from the aggregated API progress.
 *
 * Since the backend has no per-program breakdown, we estimate session count
 * by counting recentActivity entries whose workoutId matches the program slug.
 */
function deriveMetrics(
  program: Program,
  apiProgress: APIProgress
): ProgramProgressMetrics {
  const totalSessions = 1 // Regular programs have 1 session (the entire program)

  // Count recent activity entries that match this program's slug
  const matchingActivity = apiProgress.recentActivity.filter(
    entry => entry.workoutId === program.slug
  )
  const sessionsCompleted = matchingActivity.length

  const lastEntry =
    matchingActivity.length > 0
      ? matchingActivity[matchingActivity.length - 1]
      : null

  // Build exercise completion from program blocks (no per-program data from API)
  const exerciseCompletion = new Map<
    string,
    { completed: number; total: number }
  >()
  program.blocks.forEach(block => {
    if (block.type === 'exercise') {
      const current = exerciseCompletion.get(block.exerciseId) || {
        completed: 0,
        total: 0
      }
      current.total++
      exerciseCompletion.set(block.exerciseId, current)
    }
  })

  // Mark exercises as completed if we have at least one matching session
  if (sessionsCompleted > 0) {
    for (const [exerciseId, counts] of exerciseCompletion) {
      exerciseCompletion.set(exerciseId, {
        completed: Math.min(sessionsCompleted, counts.total),
        total: counts.total
      })
    }
  }

  const isCompleted = sessionsCompleted >= totalSessions

  return {
    programId: program.id,
    progress: null, // No per-program ProgramProgress from API
    totalSessions,
    currentRunIndex: sessionsCompleted > 0 ? 1 : null,
    currentRunSessionsCompleted: Math.min(sessionsCompleted, totalSessions),
    currentRunCompletionPercentage:
      totalSessions > 0
        ? Math.round(
            (Math.min(sessionsCompleted, totalSessions) / totalSessions) * 100
          )
        : 0,
    currentRunStartedAt: lastEntry?.date ?? null,
    currentRunCompletedAt: null,
    lifetimeSessionsCompleted: sessionsCompleted,
    lifetimeTimeSpentSeconds: 0, // Not available per-program from API
    averageTimePerSessionSeconds: 0, // Not available per-program from API
    currentStreak: apiProgress.currentStreak,
    nextSessionIndex: 1, // Regular programs always allow re-running session 1
    isCurrentRunCompleted: isCompleted,
    lastActivityAt: lastEntry?.date ?? null,
    exerciseCompletion
  }
}

function buildEmptyMetrics(programId: string): ProgramProgressMetrics {
  return {
    programId,
    progress: null,
    totalSessions: 1,
    currentRunIndex: null,
    currentRunSessionsCompleted: 0,
    currentRunCompletionPercentage: 0,
    currentRunStartedAt: null,
    currentRunCompletedAt: null,
    lifetimeSessionsCompleted: 0,
    lifetimeTimeSpentSeconds: 0,
    averageTimePerSessionSeconds: 0,
    currentStreak: 0,
    nextSessionIndex: 1,
    isCurrentRunCompleted: false,
    lastActivityAt: null,
    exerciseCompletion: new Map()
  }
}

export function useProgramProgress(program: Program | null | undefined): {
  metrics: ProgramProgressMetrics | null
  loading: boolean
  error: Error | null
} {
  const { progressVersion } = useRefreshVersions()

  const programId = program?.id
  const isChallenge = Boolean(program?.challengeConfig)

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
  } = useAsyncData(fetcher, [programId, progressVersion], {
    skip: !programId || isChallenge
  })

  const metrics = useMemo((): ProgramProgressMetrics | null => {
    if (!program || isChallenge) {
      return null
    }

    if (!apiProgress) {
      return buildEmptyMetrics(program.id)
    }

    return deriveMetrics(program, apiProgress)
  }, [program, isChallenge, apiProgress])

  return { metrics, loading, error }
}
