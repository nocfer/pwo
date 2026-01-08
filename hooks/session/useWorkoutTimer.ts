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

export function useWorkoutTimer(opts: {
  slug: string;
  program: Program | null | undefined;
  sessionIndex: number;
  steps: WorkoutStep[];
  actions: TimerActions;
}): UseWorkoutTimerReturn {
  const { slug, program, sessionIndex, steps, actions } = opts;
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
    setCurrentIndex((i) => {
      const next = i + 1;
      if (next >= steps.length) {
        void completeWorkout();
        return i;
      }
      return next;
    });
  }, [steps.length, completeWorkout]);

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
    setShowConfetti
  };
}
