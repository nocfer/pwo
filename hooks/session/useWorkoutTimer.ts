import { haptics } from "@/lib/haptics";
import type { EventRecord, Program, SessionState } from "@/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WorkoutStep } from "./useWorkoutSteps";

type TimerActions = {
  recordEvent: (
    event: Omit<EventRecord, "ts"> & { ts?: string },
  ) => Promise<void>;
  completeSession: (
    slug: string,
    sessionIndex: number,
    summary: string,
  ) => Promise<void>;
  saveSessionState: (state: SessionState) => Promise<void>;
  loadSessionState: (
    slug: string,
    sessionIndex: number,
  ) => Promise<SessionState | null>;
};

export type WorkoutPhase = "timed" | "working" | "done";

export type UseWorkoutTimerReturn = {
  phase: WorkoutPhase;
  currentIndex: number;
  timer: number;
  isPaused: boolean;
  showConfetti: boolean;

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

export function useWorkoutTimer(opts: {
  slug: string; // program id (reused across storage/events)
  program: Program | null | undefined;
  sessionIndex: number;
  steps: WorkoutStep[];
  actions: TimerActions;
}): UseWorkoutTimerReturn {
  const { slug, program, sessionIndex, steps, actions } = opts;
  const { recordEvent, completeSession, saveSessionState, loadSessionState } =
    actions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<WorkoutPhase>("working");
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const currentStep = steps[currentIndex] ?? null;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (seconds: number) => {
      clearTimer();
      setTimer(seconds);
      setPhase("timed");
      intervalRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearTimer();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      setIsPaused(false);
    },
    [clearTimer],
  );

  // Cleanup
  useEffect(() => () => clearTimer(), [clearTimer]);

  // Load saved state (reuse SessionState for simplicity)
  useEffect(() => {
    if (!program || steps.length === 0) return;
    let active = true;
    (async () => {
      const saved = await loadSessionState(slug, sessionIndex);
      if (!active || !saved) return;
      // Map existing SessionState fields into this runner
      setCurrentIndex(Math.max(0, saved.currentSet - 1));
      setPhase(
        saved.phase === "done" ? "done" : saved.timer > 0 ? "timed" : "working",
      );
      setTimer(saved.timer);
      setIsPaused(saved.isPaused);
      if (saved.timer > 0 && !saved.isPaused) startTimer(saved.timer);
    })();
    return () => {
      active = false;
    };
  }, [program, steps.length, slug, sessionIndex, loadSessionState, startTimer]);

  // Persist state
  useEffect(() => {
    void saveSessionState({
      slug,
      sessionIndex,
      phase:
        phase === "done" ? "done" : phase === "timed" ? "break" : "working",
      currentSet: currentIndex + 1,
      timer,
      isPaused,
      warmupDone: true,
    });
  }, [
    slug,
    sessionIndex,
    phase,
    currentIndex,
    timer,
    isPaused,
    saveSessionState,
  ]);

  const progress = useMemo(() => {
    const total = steps.length;
    if (total <= 0) return 0;
    const done = phase === "done" ? total : currentIndex;
    return Math.min(1, Math.max(0, done / total));
  }, [steps.length, phase, currentIndex]);

  // When timer hits 0, transition to next step
  useEffect(() => {
    if (timer !== 0 || phase !== "timed") return;
    setPhase("working");
    // Advance automatically after timed steps
    setCurrentIndex((i) => Math.min(i + 1, Math.max(0, steps.length - 1)));
  }, [timer, phase, steps.length]);

  const goDone = useCallback(async () => {
    setPhase("done");
    setShowConfetti(true);
    void haptics.sessionComplete();
    const summary = `${program?.name ?? slug} · Session ${sessionIndex} · ${steps.length} steps`;
    await completeSession(slug, sessionIndex, summary);
  }, [completeSession, program?.name, sessionIndex, slug, steps.length]);

  const handlePauseResume = useCallback(() => {
    if (phase !== "timed") return;
    if (isPaused) {
      startTimer(timer);
      void haptics.resumeTimer();
    } else {
      clearTimer();
      setIsPaused(true);
      void haptics.pauseTimer();
    }
  }, [phase, isPaused, timer, startTimer, clearTimer]);

  const handleSkip = useCallback(() => {
    if (!currentStep) return;

    // If timed, skip timer
    if (phase === "timed") {
      clearTimer();
      setTimer(0);
      setIsPaused(false);
      setPhase("working");
      void haptics.skipAction();
      setCurrentIndex((i) => {
        const next = i + 1;
        if (next >= steps.length) {
          void goDone();
          return i;
        }
        return next;
      });
      return;
    }

    // working: just move on
    void haptics.skipAction();
    setCurrentIndex((i) => {
      const next = i + 1;
      if (next >= steps.length) {
        void goDone();
        return i;
      }
      return next;
    });
  }, [currentStep, phase, clearTimer, steps.length, goDone]);

  const handleComplete = useCallback(() => {
    if (!currentStep) return;

    if (currentStep.type === "warmup") {
      startTimer(currentStep.seconds);
      void recordEvent({
        slug,
        sessionIndex,
        type: "warmup_started",
      });
      void haptics.buttonTap();
      return;
    }

    if (currentStep.type === "rest") {
      startTimer(currentStep.seconds);
      void recordEvent({
        slug,
        sessionIndex,
        type: "break_started",
        data: { label: currentStep.label },
      });
      void haptics.buttonTap();
      return;
    }

    // exercise set
    void recordEvent({
      slug,
      sessionIndex,
      type: "set_completed",
      data: {
        exerciseId: currentStep.exerciseId,
        set: currentStep.setIndex,
        reps: currentStep.reps,
      },
    });

    const rest = currentStep.restSecondsBetweenSets ?? 0;
    if (rest > 0 && currentStep.setIndex < currentStep.totalSets) {
      startTimer(rest);
      void recordEvent({
        slug,
        sessionIndex,
        type: "break_started",
        data: {
          afterSet: currentStep.setIndex,
          exerciseId: currentStep.exerciseId,
        },
      });
      void haptics.setComplete();
      return;
    }

    void haptics.setComplete();
    setCurrentIndex((i) => {
      const next = i + 1;
      if (next >= steps.length) {
        void goDone();
        return i;
      }
      return next;
    });
  }, [
    currentStep,
    goDone,
    haptics,
    recordEvent,
    sessionIndex,
    slug,
    startTimer,
    steps.length,
  ]);

  // Keep phase consistent if we land on a timed step without timer running
  useEffect(() => {
    if (!currentStep) return;
    if (phase === "done") return;
    if (timer > 0) return;
    setIsPaused(false);
    setPhase("working");
  }, [currentStep, phase, timer]);

  return {
    phase,
    currentIndex,
    timer,
    isPaused,
    showConfetti,
    currentStep,
    totalSteps: steps.length,
    progress,
    handlePauseResume,
    handleSkip,
    handleComplete,
    setShowConfetti,
  };
}
