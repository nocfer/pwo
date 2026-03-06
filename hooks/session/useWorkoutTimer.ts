import { haptics } from '@/lib/haptics'
import type { AccumulatedSet, Program } from '@/types'
import { useAudioPlayer } from 'expo-audio'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useProgramSessionTimer from './useProgramSessionTimer'
import type { WorkoutStep } from './useWorkoutSteps'

// ============================================================================
// Types
// ============================================================================

type TimerActions = {
  completeSession: (
    slug: string,
    sessionIndex: number,
    summary: string,
    timeSpentSeconds: number,
    accumulatedSets: AccumulatedSet[]
  ) => Promise<void>
}

export type WorkoutPhase = 'timed' | 'working' | 'done'

export type UseWorkoutTimerReturn = {
  phase: WorkoutPhase
  currentIndex: number
  timer: number
  isPaused: boolean
  showConfetti: boolean
  sessionElapsedSeconds: number

  // Derived
  currentStep: WorkoutStep | null
  totalSteps: number
  progress: number // 0..1

  // Actions
  handlePauseResume: () => void
  handleSkip: () => void
  handleComplete: () => void
  setShowConfetti: (show: boolean) => void

  // Navigation Actions (Free Navigation)
  /** Jump to any step in the workout */
  goToStep: (index: number) => void
  /** Go back to the previous step */
  goBack: () => void
  /** Repeat the current step (records as repeat) */
  repeatStep: () => void
  /** Check if can go back */
  canGoBack: boolean
}

// ============================================================================
// Main Hook
// ============================================================================

type StepStatusGetter = (
  stepIndex: number
) => 'pending' | 'completed' | 'skipped'

/**
 * Finds the next uncompleted step in session order after completing a step.
 *
 * Algorithm:
 * 1. If the completed step is part of an exercise with remaining uncompleted sets,
 *    go to the first uncompleted set of that exercise.
 * 2. Otherwise, search forward from (currentIndex + 1) for the next uncompleted step.
 * 3. If none found after current, wrap around to the beginning.
 * 4. Returns -1 if no uncompleted steps exist (all completed or skipped).
 * 5. Returns -2 if only skipped steps remain (for session safeguard).
 */
function findNextUncompletedStep(
  steps: WorkoutStep[],
  currentIndex: number,
  getStepStatus: StepStatusGetter
): number {
  const totalSteps = steps.length
  if (totalSteps === 0) return -1

  const currentStep = steps[currentIndex]

  // Build exercise step count map for multi-set exercise tracking
  const exerciseStepCount: Record<
    string,
    { total: number; completed: number; skipped: number }
  > = {}

  // Build exercise completion map
  steps.forEach((step, idx) => {
    if (step.type !== 'exercise') return
    const key = `${step.exerciseId}-${step.blockIndex ?? 0}`
    if (!exerciseStepCount[key]) {
      exerciseStepCount[key] = { total: 0, completed: 0, skipped: 0 }
    }
    exerciseStepCount[key].total++
    const status = getStepStatus(idx)
    if (status === 'completed') {
      exerciseStepCount[key].completed++
    } else if (status === 'skipped') {
      exerciseStepCount[key].skipped++
    }
  })

  // If current step is an exercise, check if same exercise has more uncompleted sets
  if (currentStep?.type === 'exercise') {
    const currentKey = `${currentStep.exerciseId}-${currentStep.blockIndex ?? 0}`
    const counts = exerciseStepCount[currentKey]

    // If not all sets of this exercise are done, find the next uncompleted set
    if (counts && counts.completed + counts.skipped < counts.total) {
      for (let i = currentIndex + 1; i < totalSteps; i++) {
        const step = steps[i]
        if (step.type !== 'exercise') continue
        const key = `${step.exerciseId}-${step.blockIndex ?? 0}`
        if (key === currentKey && getStepStatus(i) === 'pending') {
          return i
        }
      }
    }
  }

  // Search forward from current position for next uncompleted exercise step
  const searchForUncompleted = (startIdx: number, endIdx: number): number => {
    for (let i = startIdx; i < endIdx; i++) {
      const step = steps[i]
      // Skip non-exercise steps (rest/warmup are handled automatically)
      if (step.type !== 'exercise') continue
      if (getStepStatus(i) === 'pending') {
        return i
      }
    }
    return -1
  }

  // First, search from current+1 to end
  let nextIdx = searchForUncompleted(currentIndex + 1, totalSteps)
  if (nextIdx !== -1) return nextIdx

  // Then, wrap around and search from beginning to current
  nextIdx = searchForUncompleted(0, currentIndex)
  if (nextIdx !== -1) return nextIdx

  // No uncompleted exercise steps found - check if only skipped remain
  let hasSkipped = false
  let hasUncompleted = false
  for (let i = 0; i < totalSteps; i++) {
    const step = steps[i]
    if (step.type !== 'exercise') continue
    const status = getStepStatus(i)
    if (status === 'skipped') hasSkipped = true
    if (status === 'pending') hasUncompleted = true
  }

  if (hasSkipped && !hasUncompleted) {
    return -2 // Only skipped exercises remain - trigger safeguard
  }

  return -1 // All completed
}

export function useWorkoutTimer(opts: {
  slug: string
  program: Program | null | undefined
  sessionIndex: number
  steps: WorkoutStep[]
  actions: TimerActions
  /** Function to get step completion status */
  getStepStatus?: StepStatusGetter
  /** Callback when session completion needs safeguard (skipped exercises exist) */
  onSessionSafeguard?: () => void
  /** Completed sets with actual reps from the session UI */
  completedSets?: {
    exerciseId: string
    actualReps: number
    setNumber: number
    totalSets: number
  }[]
}): UseWorkoutTimerReturn {
  const {
    slug,
    program,
    sessionIndex,
    steps,
    actions,
    getStepStatus,
    onSessionSafeguard,
    completedSets = []
  } = opts
  const { completeSession } = actions

  // ---------------------------------------------------------------------------
  // Audio
  // ---------------------------------------------------------------------------
  const skipSound = useAudioPlayer(require('@/assets/sounds/skip.mp3'))
  const completeSound = useAudioPlayer(require('@/assets/sounds/completed.mp3'))
  const tickSound = useAudioPlayer(require('@/assets/sounds/tick.mp3'))

  // ---------------------------------------------------------------------------
  // Core State
  // ---------------------------------------------------------------------------
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<WorkoutPhase>('working')
  const [stepTimer, setStepTimer] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [initialElapsedSeconds] = useState(0)

  // Session-wide elapsed timer (persisted across interruptions)
  const { sessionTimer: sessionElapsedSeconds } = useProgramSessionTimer({
    phase,
    initialElapsedSeconds
  })

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const currentStep = steps[currentIndex] ?? null
  const currentStepRef = useRef<WorkoutStep | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timedStepRef = useRef<WorkoutStep | null>(null)

  // Keep currentStepRef in sync
  useEffect(() => {
    currentStepRef.current = currentStep
  }, [currentStep])

  // ---------------------------------------------------------------------------
  // Step Timer Management
  // ---------------------------------------------------------------------------
  const clearStepTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startStepTimer = useCallback(
    (seconds: number) => {
      clearStepTimer()
      timedStepRef.current = currentStepRef.current
      setStepTimer(seconds)
      setPhase('timed')
      setIsPaused(false)

      intervalRef.current = setInterval(() => {
        setStepTimer(t => {
          if (t <= 1) {
            clearStepTimer()
            return 0
          }
          return t - 1
        })
      }, 1000)
    },
    [clearStepTimer]
  )

  // Cleanup timer on unmount
  useEffect(() => () => clearStepTimer(), [clearStepTimer])

  // ---------------------------------------------------------------------------
  // Step Advancement
  // ---------------------------------------------------------------------------
  const completeWorkout = useCallback(async () => {
    setPhase('done')
    setShowConfetti(true)
    void haptics.sessionComplete()
    const summary = `${program?.name ?? slug} · Session ${sessionIndex} · ${steps.length} steps`

    // Build accumulated sets from completed sets or program blocks
    const accumulatedSets: AccumulatedSet[] = []
    if (program) {
      const now = new Date().toISOString()

      // Create a map of completed sets by exerciseId for quick lookup
      const completedByExercise = new Map<string, (typeof completedSets)[0][]>()
      for (const set of completedSets) {
        const existing = completedByExercise.get(set.exerciseId) ?? []
        existing.push(set)
        completedByExercise.set(set.exerciseId, existing)
      }

      // For each block, use actual reps if available, otherwise use target reps
      program.blocks.forEach(block => {
        const completedSetsForExercise =
          completedByExercise.get(block.exerciseId) ?? []

        // If we have completed sets for this exercise, use their actual reps
        if (completedSetsForExercise.length > 0) {
          completedSetsForExercise.forEach(set => {
            accumulatedSets.push({
              exerciseId: block.exerciseId,
              reps: set.actualReps,
              isBodyweight: true,
              timestamp: now
            })
          })
        } else {
          // Fallback to target reps if no completed sets recorded
          const reps = Array.isArray(block.targetReps)
            ? (block.targetReps[0] ?? 0)
            : (block.targetReps ?? 0)
          accumulatedSets.push({
            exerciseId: block.exerciseId,
            reps,
            isBodyweight: true,
            timestamp: now
          })
        }
      })
    }

    await completeSession(
      slug,
      sessionIndex,
      summary,
      sessionElapsedSeconds,
      accumulatedSets
    )
  }, [
    completeSession,
    program,
    sessionIndex,
    slug,
    steps.length,
    sessionElapsedSeconds,
    completedSets
  ])

  const advanceToNextStep = useCallback(() => {
    // Default status getter for backward compatibility
    const statusGetter: StepStatusGetter =
      getStepStatus ??
      (idx => {
        // Legacy behavior: steps before current are "completed"
        return idx < currentIndex ? 'completed' : 'pending'
      })

    const nextIdx = findNextUncompletedStep(steps, currentIndex, statusGetter)

    if (nextIdx === -2) {
      // Only skipped exercises remain - trigger safeguard
      onSessionSafeguard?.()
      return // Stay at current position until user decides
    }

    if (nextIdx === -1) {
      // All exercises completed
      void completeWorkout()
      return
    }

    // Handle rest/warmup steps between current and next exercise
    // If the next step after current is a rest or warmup, go there first
    const immediateNext = currentIndex + 1
    if (immediateNext < steps.length && immediateNext < nextIdx) {
      const nextStep = steps[immediateNext]
      if (nextStep?.type === 'rest' || nextStep?.type === 'warmup') {
        setCurrentIndex(immediateNext) // Let the rest/warmup play first
        return
      }
    }

    setCurrentIndex(nextIdx)
  }, [steps, currentIndex, getStepStatus, onSessionSafeguard, completeWorkout])

  // ---------------------------------------------------------------------------
  // State Persistence (removed - API-only architecture)
  // Session state is now in-memory only and sent to API on completion
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------
  const progress = useMemo(() => {
    const total = steps.length
    if (total <= 0) return 0
    const done = phase === 'done' ? total : currentIndex
    return Math.min(1, Math.max(0, done / total))
  }, [steps.length, phase, currentIndex])

  // ---------------------------------------------------------------------------
  // Timer Effects
  // ---------------------------------------------------------------------------

  // Handle timer completion - advance to next step
  useEffect(() => {
    if (stepTimer !== 0 || phase !== 'timed') return

    // Timer completed - advance to next step
    // (Event recording removed - API-only architecture)
    timedStepRef.current = null
    setIsPaused(false)
    setPhase('working')
    advanceToNextStep()
  }, [stepTimer, phase, advanceToNextStep])

  // Keep phase consistent when no timer is running
  useEffect(() => {
    if (!currentStep || phase === 'done' || stepTimer > 0) return
    setIsPaused(false)
    setPhase('working')
  }, [currentStep, phase, stepTimer])

  // Auto-start rest timers when advancing to a rest step
  useEffect(() => {
    if (
      !currentStep ||
      currentStep.type !== 'rest' ||
      phase !== 'working' ||
      stepTimer > 0
    )
      return
    startStepTimer(currentStep.seconds)
  }, [currentStep, phase, stepTimer, startStepTimer])

  // Play tick sound for last 3 seconds
  useEffect(() => {
    if (stepTimer > 0 && stepTimer <= 3) {
      tickSound.seekTo(0)
      tickSound.play()
    }
  }, [stepTimer, tickSound])

  // ---------------------------------------------------------------------------
  // User Actions
  // ---------------------------------------------------------------------------
  const handlePauseResume = useCallback(() => {
    if (phase !== 'timed') return

    if (isPaused) {
      startStepTimer(stepTimer)
      void haptics.resumeTimer()
    } else {
      clearStepTimer()
      setIsPaused(true)
      void haptics.pauseTimer()
    }
  }, [phase, isPaused, stepTimer, startStepTimer, clearStepTimer])

  const handleSkip = useCallback(() => {
    if (!currentStep) return

    void skipSound.seekTo(0)
    void skipSound.play()
    void haptics.skipAction()

    // Reset timer state if currently timed
    if (phase === 'timed') {
      clearStepTimer()
      setStepTimer(0)
      setIsPaused(false)
      setPhase('working')
      timedStepRef.current = null
    }

    advanceToNextStep()
  }, [currentStep, phase, skipSound, clearStepTimer, advanceToNextStep])

  const handleComplete = useCallback(() => {
    if (!currentStep) return

    // Rest step: start timer silently (no completion sound)
    if (currentStep.type === 'rest') {
      startStepTimer(currentStep.seconds)
      void haptics.buttonTap()
      return
    }

    // Play completion sound for non-rest steps
    completeSound.seekTo(0)
    completeSound.play()

    // Warmup step: start timer
    if (currentStep.type === 'warmup') {
      startStepTimer(currentStep.seconds)
      void haptics.buttonTap()
      return
    }

    // Exercise step: timed if has duration, otherwise immediate completion
    const duration = currentStep.durationSeconds ?? 0
    if (duration > 0) {
      startStepTimer(duration)
      void haptics.buttonTap()
      return
    }

    // Immediate exercise completion (no timer)
    void haptics.setComplete()
    advanceToNextStep()
  }, [currentStep, completeSound, startStepTimer, advanceToNextStep])

  // ---------------------------------------------------------------------------
  // Navigation Actions (Free Navigation)
  // ---------------------------------------------------------------------------

  /** Navigate to a specific step by index */
  const goToStep = useCallback(
    (targetIndex: number) => {
      // Validate target index
      if (targetIndex < 0 || targetIndex >= steps.length) return
      if (phase === 'done') return

      // Clear any running timer
      if (phase === 'timed') {
        clearStepTimer()
        setStepTimer(0)
        setIsPaused(false)
        timedStepRef.current = null
      }

      void haptics.buttonTap()
      setCurrentIndex(targetIndex)
      setPhase('working')
    },
    [steps, phase, clearStepTimer]
  )

  /** Go back to the previous step */
  const goBack = useCallback(() => {
    if (currentIndex <= 0 || phase === 'done') return
    goToStep(currentIndex - 1)
  }, [currentIndex, phase, goToStep])

  /** Repeat the current step */
  const repeatStep = useCallback(() => {
    if (!currentStep || phase === 'done') return

    // Clear any running timer
    if (phase === 'timed') {
      clearStepTimer()
      setStepTimer(0)
      setIsPaused(false)
      timedStepRef.current = null
    }

    void haptics.buttonTap()

    // Reset to working phase to re-show the step
    setPhase('working')
  }, [currentStep, phase, clearStepTimer])

  /** Check if can go back */
  const canGoBack = currentIndex > 0 && phase !== 'done'

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    phase,
    currentIndex,
    timer: stepTimer,
    isPaused,
    showConfetti,
    sessionElapsedSeconds,
    currentStep,
    totalSteps: steps.length,
    progress,
    handlePauseResume,
    handleSkip,
    handleComplete,
    setShowConfetti,
    // Navigation
    goToStep,
    goBack,
    repeatStep,
    canGoBack
  }
}
