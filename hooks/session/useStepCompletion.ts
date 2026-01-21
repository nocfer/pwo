import type {
  StepCompletionRecord,
  StepCompletionState,
  StepStatus
} from '@/types'
import { useCallback, useMemo, useState } from 'react'

export type UseStepCompletionReturn = {
  /** Current completion state for all steps */
  completionState: StepCompletionState

  /** Get the status of a specific step */
  getStepStatus: (stepIndex: number) => StepStatus

  /** Get the completion record for a specific step */
  getStepRecord: (stepIndex: number) => StepCompletionRecord | undefined

  /** Get the number of times a step has been completed */
  getCompletionCount: (stepIndex: number) => number

  /** Get total completed steps (unique, not counting repeats) */
  completedStepCount: number

  /** Get total skipped steps */
  skippedStepCount: number

  /** Mark a step as completed with optional actual reps */
  markCompleted: (stepIndex: number, actualReps?: number) => void

  /** Mark a step as skipped */
  markSkipped: (stepIndex: number) => void

  /** Reset a step back to pending (for re-doing) */
  resetStep: (stepIndex: number) => void

  /** Reset all steps to pending */
  resetAll: () => void

  /** Initialize completion state from saved state */
  initFromSaved: (saved: StepCompletionState) => void
}

/**
 * Hook for tracking per-step completion status during workout execution.
 * Supports tracking completed, skipped, and repeated steps with timestamps.
 */
export function useStepCompletion(
  slug: string,
  sessionIndex: number,
  totalSteps: number
): UseStepCompletionReturn {
  const [steps, setSteps] = useState<Record<number, StepCompletionRecord>>({})

  // Mark a step as completed
  // Note: This OVERWRITES any previous completion (no history, latest is source of truth)
  const markCompleted = useCallback(
    (stepIndex: number, actualReps?: number) => {
      setSteps(prev => {
        return {
          ...prev,
          [stepIndex]: {
            stepIndex,
            status: 'completed',
            // Single completion record - overwrites any previous (per spec: "latest is single source of truth")
            completions: [
              {
                actualReps,
                timestamp: new Date().toISOString()
              }
            ]
          }
        }
      })
    },
    []
  )

  // Mark a step as skipped
  const markSkipped = useCallback((stepIndex: number) => {
    setSteps(prev => {
      const record = prev[stepIndex] ?? {
        stepIndex,
        status: 'pending',
        completions: []
      }

      return {
        ...prev,
        [stepIndex]: {
          ...record,
          status: 'skipped'
        }
      }
    })
  }, [])

  // Reset a step back to pending (for re-doing after completion)
  const resetStep = useCallback((stepIndex: number) => {
    setSteps(prev => {
      const record = prev[stepIndex]
      if (!record) return prev

      return {
        ...prev,
        [stepIndex]: {
          ...record,
          status: 'pending'
        }
      }
    })
  }, [])

  // Reset all steps
  const resetAll = useCallback(() => {
    setSteps({})
  }, [])

  // Initialize from saved state
  const initFromSaved = useCallback((saved: StepCompletionState) => {
    setSteps(saved.steps)
  }, [])

  // Get step status
  const getStepStatus = useCallback(
    (stepIndex: number): StepStatus => {
      return steps[stepIndex]?.status ?? 'pending'
    },
    [steps]
  )

  // Get step record
  const getStepRecord = useCallback(
    (stepIndex: number): StepCompletionRecord | undefined => {
      return steps[stepIndex]
    },
    [steps]
  )

  // Get completion count for a step
  const getCompletionCount = useCallback(
    (stepIndex: number): number => {
      return steps[stepIndex]?.completions.length ?? 0
    },
    [steps]
  )

  // Count completed steps (unique)
  const completedStepCount = useMemo(() => {
    return Object.values(steps).filter(s => s.status === 'completed').length
  }, [steps])

  // Count skipped steps
  const skippedStepCount = useMemo(() => {
    return Object.values(steps).filter(s => s.status === 'skipped').length
  }, [steps])

  // Build completion state object
  const completionState = useMemo<StepCompletionState>(
    () => ({
      slug,
      sessionIndex,
      steps,
      totalSteps
    }),
    [slug, sessionIndex, steps, totalSteps]
  )

  return {
    completionState,
    getStepStatus,
    getStepRecord,
    getCompletionCount,
    completedStepCount,
    skippedStepCount,
    markCompleted,
    markSkipped,
    resetStep,
    resetAll,
    initFromSaved
  }
}
