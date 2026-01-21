import { haptics } from "@/lib/haptics";
import type { EventRecord, Program, SessionState } from "@/types";
import { useAudioPlayer } from "expo-audio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useProgramSessionTimer from "./useProgramSessionTimer";
import type { WorkoutStep } from "./useWorkoutSteps";

// ============================================================================
// Types
// ============================================================================

type TimerActions = {
  recordEvent: (
    event: Omit<EventRecord, "ts"> & { ts?: string }
  ) => Promise<void>;
  completeSession: (
    slug: string,
    sessionIndex: number,
    summary: string,
    providedTimeSpentSeconds?: number
  ) => Promise<void>;
  saveSessionState: (state: SessionState) => Promise<void>;
  loadSessionState: (
    slug: string,
    sessionIndex: number
  ) => Promise<SessionState | null>;
};

export type WorkoutPhase = "timed" | "working" | "done";

export type UseWorkoutTimerReturn = {
  phase: WorkoutPhase;
  currentIndex: number;
  timer: number;
  isPaused: boolean;
  showConfetti: boolean;
  sessionElapsedSeconds: number;

  // Derived
  currentStep: WorkoutStep | null;
  totalSteps: number;
  progress: number; // 0..1

  // Actions
  handlePauseResume: () => void;
  handleSkip: () => void;
  handleComplete: () => void;
  setShowConfetti: (show: boolean) => void;

  // Navigation Actions (Free Navigation)
  /** Jump to any step in the workout */
  goToStep: (index: number) => void;
  /** Go back to the previous step */
  goBack: () => void;
  /** Repeat the current step (records as repeat) */
  repeatStep: () => void;
  /** Check if can go back */
  canGoBack: boolean;
};

// ============================================================================
// Helper functions for event recording
// ============================================================================

type EventContext = {
  slug: string;
  sessionIndex: number;
  recordEvent: TimerActions["recordEvent"];
};

/** Records a step completion event based on step type */
function recordStepCompletion(step: WorkoutStep, ctx: EventContext) {
  const { slug, sessionIndex, recordEvent } = ctx;

  if (step.type === "warmup") {
    void recordEvent({ slug, sessionIndex, type: "warmup_completed" });
  } else if (step.type === "rest") {
    void recordEvent({ slug, sessionIndex, type: "break_completed" });
  } else if (step.type === "exercise") {
    void recordEvent({
      slug,
      sessionIndex,
      type: "set_completed",
      data: {
        exerciseId: step.exerciseId,
        reps: step.targetReps,
        durationSeconds: step.durationSeconds
      }
    });
  }
}

/** Records a step skipped event based on step type */
function recordStepSkipped(step: WorkoutStep, ctx: EventContext) {
  const { slug, sessionIndex, recordEvent } = ctx;

  if (step.type === "warmup") {
    void recordEvent({ slug, sessionIndex, type: "warmup_skipped" });
  } else if (step.type === "rest") {
    void recordEvent({ slug, sessionIndex, type: "break_skipped" });
  } else if (step.type === "exercise") {
    void recordEvent({
      slug,
      sessionIndex,
      type: "set_skipped",
      data: { exerciseId: step.exerciseId }
    });
  }
}

// ============================================================================
// Main Hook
// ============================================================================

type StepStatusGetter = (
  stepIndex: number
) => "pending" | "completed" | "skipped";

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
  const totalSteps = steps.length;
  if (totalSteps === 0) return -1;

  const currentStep = steps[currentIndex];

  // Build exercise step count map for multi-set exercise tracking
  const exerciseStepCount: Record<
    string,
    { total: number; completed: number; skipped: number }
  > = {};

  // Build exercise completion map
  steps.forEach((step, idx) => {
    if (step.type !== "exercise") return;
    const key = `${step.exerciseId}-${step.blockIndex ?? 0}`;
    if (!exerciseStepCount[key]) {
      exerciseStepCount[key] = { total: 0, completed: 0, skipped: 0 };
    }
    exerciseStepCount[key].total++;
    const status = getStepStatus(idx);
    if (status === "completed") {
      exerciseStepCount[key].completed++;
    } else if (status === "skipped") {
      exerciseStepCount[key].skipped++;
    }
  });

  // If current step is an exercise, check if same exercise has more uncompleted sets
  if (currentStep?.type === "exercise") {
    const currentKey = `${currentStep.exerciseId}-${currentStep.blockIndex ?? 0}`;
    const counts = exerciseStepCount[currentKey];

    // If not all sets of this exercise are done, find the next uncompleted set
    if (counts && counts.completed + counts.skipped < counts.total) {
      for (let i = currentIndex + 1; i < totalSteps; i++) {
        const step = steps[i];
        if (step.type !== "exercise") continue;
        const key = `${step.exerciseId}-${step.blockIndex ?? 0}`;
        if (key === currentKey && getStepStatus(i) === "pending") {
          return i;
        }
      }
    }
  }

  // Search forward from current position for next uncompleted exercise step
  const searchForUncompleted = (startIdx: number, endIdx: number): number => {
    for (let i = startIdx; i < endIdx; i++) {
      const step = steps[i];
      // Skip non-exercise steps (rest/warmup are handled automatically)
      if (step.type !== "exercise") continue;
      if (getStepStatus(i) === "pending") {
        return i;
      }
    }
    return -1;
  };

  // First, search from current+1 to end
  let nextIdx = searchForUncompleted(currentIndex + 1, totalSteps);
  if (nextIdx !== -1) return nextIdx;

  // Then, wrap around and search from beginning to current
  nextIdx = searchForUncompleted(0, currentIndex);
  if (nextIdx !== -1) return nextIdx;

  // No uncompleted exercise steps found - check if only skipped remain
  let hasSkipped = false;
  let hasUncompleted = false;
  for (let i = 0; i < totalSteps; i++) {
    const step = steps[i];
    if (step.type !== "exercise") continue;
    const status = getStepStatus(i);
    if (status === "skipped") hasSkipped = true;
    if (status === "pending") hasUncompleted = true;
  }

  if (hasSkipped && !hasUncompleted) {
    return -2; // Only skipped exercises remain - trigger safeguard
  }

  return -1; // All completed
}

export function useWorkoutTimer(opts: {
  slug: string;
  program: Program | null | undefined;
  sessionIndex: number;
  steps: WorkoutStep[];
  actions: TimerActions;
  /** Function to get step completion status */
  getStepStatus?: StepStatusGetter;
  /** Callback when session completion needs safeguard (skipped exercises exist) */
  onSessionSafeguard?: () => void;
}): UseWorkoutTimerReturn {
  const {
    slug,
    program,
    sessionIndex,
    steps,
    actions,
    getStepStatus,
    onSessionSafeguard
  } = opts;
  const { recordEvent, completeSession, saveSessionState, loadSessionState } =
    actions;

  // ---------------------------------------------------------------------------
  // Audio
  // ---------------------------------------------------------------------------
  const skipSound = useAudioPlayer(require("@/assets/sounds/skip.mp3"));
  const completeSound = useAudioPlayer(
    require("@/assets/sounds/completed.mp3")
  );
  const tickSound = useAudioPlayer(require("@/assets/sounds/tick.mp3"));

  // ---------------------------------------------------------------------------
  // Core State
  // ---------------------------------------------------------------------------
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<WorkoutPhase>("working");
  const [stepTimer, setStepTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [initialElapsedSeconds, setInitialElapsedSeconds] = useState(0);

  // Session-wide elapsed timer (persisted across interruptions)
  const { sessionTimer: sessionElapsedSeconds } = useProgramSessionTimer({
    phase,
    initialElapsedSeconds
  });

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const currentStep = steps[currentIndex] ?? null;
  const currentStepRef = useRef<WorkoutStep | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timedStepRef = useRef<WorkoutStep | null>(null);

  // Keep currentStepRef in sync
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  // ---------------------------------------------------------------------------
  // Event context for helper functions
  // ---------------------------------------------------------------------------
  const eventCtx: EventContext = useMemo(
    () => ({ slug, sessionIndex, recordEvent }),
    [slug, sessionIndex, recordEvent]
  );

  // ---------------------------------------------------------------------------
  // Step Timer Management
  // ---------------------------------------------------------------------------
  const clearStepTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startStepTimer = useCallback(
    (seconds: number) => {
      clearStepTimer();
      timedStepRef.current = currentStepRef.current;
      setStepTimer(seconds);
      setPhase("timed");
      setIsPaused(false);

      intervalRef.current = setInterval(() => {
        setStepTimer((t) => {
          if (t <= 1) {
            clearStepTimer();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    },
    [clearStepTimer]
  );

  // Cleanup timer on unmount
  useEffect(() => () => clearStepTimer(), [clearStepTimer]);

  // ---------------------------------------------------------------------------
  // Step Advancement
  // ---------------------------------------------------------------------------
  const completeWorkout = useCallback(async () => {
    setPhase("done");
    setShowConfetti(true);
    void haptics.sessionComplete();
    const summary = `${program?.name ?? slug} · Session ${sessionIndex} · ${steps.length} steps`;
    await completeSession(slug, sessionIndex, summary, sessionElapsedSeconds);
  }, [
    completeSession,
    program?.name,
    sessionIndex,
    slug,
    steps.length,
    sessionElapsedSeconds
  ]);

  const advanceToNextStep = useCallback(() => {
    // Default status getter for backward compatibility
    const statusGetter: StepStatusGetter =
      getStepStatus ??
      ((idx) => {
        // Legacy behavior: steps before current are "completed"
        return idx < currentIndex ? "completed" : "pending";
      });

    const nextIdx = findNextUncompletedStep(steps, currentIndex, statusGetter);

    if (nextIdx === -2) {
      // Only skipped exercises remain - trigger safeguard
      onSessionSafeguard?.();
      return; // Stay at current position until user decides
    }

    if (nextIdx === -1) {
      // All exercises completed
      void completeWorkout();
      return;
    }

    // Handle rest/warmup steps between current and next exercise
    // If the next step after current is a rest or warmup, go there first
    const immediateNext = currentIndex + 1;
    if (immediateNext < steps.length && immediateNext < nextIdx) {
      const nextStep = steps[immediateNext];
      if (nextStep?.type === "rest" || nextStep?.type === "warmup") {
        setCurrentIndex(immediateNext); // Let the rest/warmup play first
        return;
      }
    }

    setCurrentIndex(nextIdx);
  }, [steps, currentIndex, getStepStatus, onSessionSafeguard, completeWorkout]);

  // ---------------------------------------------------------------------------
  // State Persistence
  // ---------------------------------------------------------------------------

  // Load saved state on mount
  useEffect(() => {
    if (!program || steps.length === 0) return;
    let active = true;

    (async () => {
      const saved = await loadSessionState(slug, sessionIndex);
      if (!active || !saved) return;

      // If session was already completed, start fresh instead of loading done state
      if (saved.phase === "done") {
        setCurrentIndex(0);
        setPhase("working");
        setStepTimer(0);
        setIsPaused(false);
        setInitialElapsedSeconds(0);
        return;
      }

      setCurrentIndex(Math.max(0, saved.currentSet - 1));
      setPhase(saved.timer > 0 ? "timed" : "working");
      setStepTimer(saved.timer);
      setIsPaused(saved.isPaused);
      setInitialElapsedSeconds(saved.sessionElapsedSeconds ?? 0);

      if (saved.timer > 0 && !saved.isPaused) {
        startStepTimer(saved.timer);
      }
    })();

    return () => {
      active = false;
    };
  }, [
    program,
    steps.length,
    slug,
    sessionIndex,
    loadSessionState,
    startStepTimer
  ]);

  // Persist state on changes
  useEffect(() => {
    void saveSessionState({
      slug,
      sessionIndex,
      phase:
        phase === "done" ? "done" : phase === "timed" ? "break" : "working",
      currentSet: currentIndex + 1,
      timer: stepTimer,
      isPaused,
      warmupDone: true,
      sessionElapsedSeconds
    });
  }, [
    slug,
    sessionIndex,
    phase,
    currentIndex,
    stepTimer,
    isPaused,
    sessionElapsedSeconds,
    saveSessionState
  ]);

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------
  const progress = useMemo(() => {
    const total = steps.length;
    if (total <= 0) return 0;
    const done = phase === "done" ? total : currentIndex;
    return Math.min(1, Math.max(0, done / total));
  }, [steps.length, phase, currentIndex]);

  // ---------------------------------------------------------------------------
  // Timer Effects
  // ---------------------------------------------------------------------------

  // Handle timer completion - advance to next step
  useEffect(() => {
    if (stepTimer !== 0 || phase !== "timed") return;

    // Record completion for the timed step
    const finished = timedStepRef.current;
    if (finished) {
      recordStepCompletion(finished, eventCtx);
    }

    timedStepRef.current = null;
    setIsPaused(false);
    setPhase("working");
    advanceToNextStep();
  }, [stepTimer, phase, eventCtx, advanceToNextStep]);

  // Keep phase consistent when no timer is running
  useEffect(() => {
    if (!currentStep || phase === "done" || stepTimer > 0) return;
    setIsPaused(false);
    setPhase("working");
  }, [currentStep, phase, stepTimer]);

  // Auto-start rest timers when advancing to a rest step
  useEffect(() => {
    if (
      !currentStep ||
      currentStep.type !== "rest" ||
      phase !== "working" ||
      stepTimer > 0
    )
      return;
    startStepTimer(currentStep.seconds);
  }, [currentStep, phase, stepTimer, startStepTimer]);

  // Play tick sound for last 3 seconds
  useEffect(() => {
    if (stepTimer > 0 && stepTimer <= 3) {
      tickSound.seekTo(0);
      tickSound.play();
    }
  }, [stepTimer, tickSound]);

  // ---------------------------------------------------------------------------
  // User Actions
  // ---------------------------------------------------------------------------
  const handlePauseResume = useCallback(() => {
    if (phase !== "timed") return;

    if (isPaused) {
      startStepTimer(stepTimer);
      void haptics.resumeTimer();
    } else {
      clearStepTimer();
      setIsPaused(true);
      void haptics.pauseTimer();
    }
  }, [phase, isPaused, stepTimer, startStepTimer, clearStepTimer]);

  const handleSkip = useCallback(() => {
    if (!currentStep) return;

    void skipSound.seekTo(0);
    void skipSound.play();
    void haptics.skipAction();

    // Determine which step to record as skipped
    const stepToRecord =
      phase === "timed" ? (timedStepRef.current ?? currentStep) : currentStep;
    recordStepSkipped(stepToRecord, eventCtx);

    // Reset timer state if currently timed
    if (phase === "timed") {
      clearStepTimer();
      setStepTimer(0);
      setIsPaused(false);
      setPhase("working");
      timedStepRef.current = null;
    }

    advanceToNextStep();
  }, [
    currentStep,
    phase,
    skipSound,
    eventCtx,
    clearStepTimer,
    advanceToNextStep
  ]);

  const handleComplete = useCallback(() => {
    if (!currentStep) return;

    // Rest step: start timer silently (no completion sound)
    if (currentStep.type === "rest") {
      startStepTimer(currentStep.seconds);
      void recordEvent({
        slug,
        sessionIndex,
        type: "break_started",
        data: { label: currentStep.label }
      });
      void haptics.buttonTap();
      return;
    }

    // Play completion sound for non-rest steps
    completeSound.seekTo(0);
    completeSound.play();

    // Warmup step: start timer
    if (currentStep.type === "warmup") {
      startStepTimer(currentStep.seconds);
      void recordEvent({ slug, sessionIndex, type: "warmup_started" });
      void haptics.buttonTap();
      return;
    }

    // Exercise step: timed if has duration, otherwise immediate completion
    const duration = currentStep.durationSeconds ?? 0;
    if (duration > 0) {
      startStepTimer(duration);
      void recordEvent({
        slug,
        sessionIndex,
        type: "set_completed",
        data: {
          exerciseId: currentStep.exerciseId,
          started: true,
          durationSeconds: duration,
          reps: currentStep.targetReps
        }
      });
      void haptics.buttonTap();
      return;
    }

    // Immediate exercise completion (no timer)
    void recordEvent({
      slug,
      sessionIndex,
      type: "set_completed",
      data: {
        exerciseId: currentStep.exerciseId,
        reps: currentStep.targetReps
      }
    });
    void haptics.setComplete();
    advanceToNextStep();
  }, [
    currentStep,
    completeSound,
    slug,
    sessionIndex,
    recordEvent,
    startStepTimer,
    advanceToNextStep
  ]);

  // ---------------------------------------------------------------------------
  // Navigation Actions (Free Navigation)
  // ---------------------------------------------------------------------------

  /** Navigate to a specific step by index */
  const goToStep = useCallback(
    (targetIndex: number) => {
      // Validate target index
      if (targetIndex < 0 || targetIndex >= steps.length) return;
      if (phase === "done") return;

      // Clear any running timer
      if (phase === "timed") {
        clearStepTimer();
        setStepTimer(0);
        setIsPaused(false);
        timedStepRef.current = null;
      }

      // Record jump event
      void recordEvent({
        slug,
        sessionIndex,
        type: "step_jumped_to",
        data: {
          fromIndex: currentIndex,
          toIndex: targetIndex,
          fromStepKey: currentStep?.key,
          toStepKey: steps[targetIndex]?.key
        }
      });

      void haptics.buttonTap();
      setCurrentIndex(targetIndex);
      setPhase("working");
    },
    [
      steps,
      phase,
      currentIndex,
      currentStep,
      clearStepTimer,
      recordEvent,
      slug,
      sessionIndex
    ]
  );

  /** Go back to the previous step */
  const goBack = useCallback(() => {
    if (currentIndex <= 0 || phase === "done") return;
    goToStep(currentIndex - 1);
  }, [currentIndex, phase, goToStep]);

  /** Repeat the current step */
  const repeatStep = useCallback(() => {
    if (!currentStep || phase === "done") return;

    // Clear any running timer
    if (phase === "timed") {
      clearStepTimer();
      setStepTimer(0);
      setIsPaused(false);
      timedStepRef.current = null;
    }

    // Record repeat event
    void recordEvent({
      slug,
      sessionIndex,
      type: "step_repeated",
      data: {
        stepIndex: currentIndex,
        stepKey: currentStep.key,
        stepType: currentStep.type
      }
    });

    void haptics.buttonTap();

    // Reset to working phase to re-show the step
    setPhase("working");
  }, [
    currentStep,
    currentIndex,
    phase,
    clearStepTimer,
    recordEvent,
    slug,
    sessionIndex
  ]);

  /** Check if can go back */
  const canGoBack = currentIndex > 0 && phase !== "done";

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
  };
}
