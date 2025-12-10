/**
 * useSessionTimer - Session timer state machine hook
 *
 * Manages all timer-related state and transitions for workout sessions.
 */

import { haptics } from "@/lib/haptics";
import type {
  EventRecord,
  Program,
  Session,
  SessionPhase,
  SessionState,
} from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

type TimerActions = {
  recordEvent: (
    event: Omit<EventRecord, "ts"> & { ts?: string }
  ) => Promise<void>;
  completeSession: (
    slug: string,
    sessionIndex: number,
    summary: string
  ) => Promise<void>;
  saveSessionState: (state: SessionState) => Promise<void>;
  loadSessionState: (
    slug: string,
    sessionIndex: number
  ) => Promise<SessionState | null>;
};

type UseSessionTimerOptions = {
  slug: string;
  session: Session | undefined;
  program: Program | null | undefined;
  actions: TimerActions;
};

export type UseSessionTimerReturn = {
  // State
  phase: SessionPhase;
  currentSet: number;
  timer: number;
  isPaused: boolean;
  warmupDone: boolean;
  showConfetti: boolean;
  progress: number;

  // Derived
  warmUpSeconds: number;
  breakSeconds: number;

  // Actions
  handlePauseResume: () => void;
  handleSkip: () => void;
  handleComplete: () => void;
  setShowConfetti: (show: boolean) => void;
};

export function useSessionTimer({
  slug,
  session,
  program,
  actions,
}: UseSessionTimerOptions): UseSessionTimerReturn {
  const { recordEvent, completeSession, saveSessionState, loadSessionState } =
    actions;

  const warmUpSeconds = program?.exercise?.warmUp ?? 0;
  const breakSeconds = program?.exercise?.break ?? 0;

  const [phase, setPhase] = useState<SessionPhase>(
    warmUpSeconds > 0 ? "warmup" : "working"
  );
  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState(() =>
    phase === "warmup" ? warmUpSeconds : 0
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [warmupDone, setWarmupDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Timer control functions
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
    [clearTimer]
  );

  const pauseTimer = useCallback(() => {
    clearTimer();
    setIsPaused(true);
  }, [clearTimer]);

  const resumeTimer = useCallback(() => {
    if (timer > 0 && isPaused) {
      startTimer(timer);
    }
  }, [isPaused, startTimer, timer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Load previously saved state
  useEffect(() => {
    if (!program || !session) return;
    let active = true;
    (async () => {
      const saved = await loadSessionState(slug, session.index);
      if (!active || !saved) return;
      setPhase(saved.phase);
      setCurrentSet(saved.currentSet);
      setTimer(saved.timer);
      setIsPaused(saved.isPaused);
      setWarmupDone(saved.warmupDone);
      if (
        (saved.phase === "warmup" || saved.phase === "break") &&
        saved.timer > 0 &&
        !saved.isPaused
      ) {
        startTimer(saved.timer);
      }
    })();
    return () => {
      active = false;
    };
  }, [program, session, slug, startTimer, loadSessionState]);

  // Save state whenever it changes
  useEffect(() => {
    if (!session) return;
    void saveSessionState({
      slug,
      sessionIndex: session.index,
      phase,
      currentSet,
      timer,
      isPaused,
      warmupDone,
    });
  }, [
    slug,
    session,
    phase,
    currentSet,
    timer,
    isPaused,
    warmupDone,
    saveSessionState,
  ]);

  // Start warmup timer when phase changes to warmup
  useEffect(() => {
    if (phase === "warmup" && warmUpSeconds > 0) {
      startTimer(warmUpSeconds);
      void recordEvent({
        slug,
        sessionIndex: session?.index ?? 0,
        type: "warmup_started",
      });
    }
  }, [phase, warmUpSeconds, startTimer, slug, session?.index, recordEvent]);

  // If the program has no warm-up, mark warmupDone once program is known
  useEffect(() => {
    if (program && (program.exercise?.warmUp ?? 0) === 0 && !warmupDone) {
      setWarmupDone(true);
    }
  }, [program, warmupDone]);

  // Ensure warm-up is honored once the program loads
  useEffect(() => {
    if (
      program &&
      warmUpSeconds > 0 &&
      !warmupDone &&
      phase === "working" &&
      currentSet === 1 &&
      timer === 0
    ) {
      setPhase("warmup");
      startTimer(warmUpSeconds);
    }
  }, [
    program,
    warmUpSeconds,
    warmupDone,
    phase,
    currentSet,
    timer,
    startTimer,
  ]);

  // Handle timer completion transitions
  useEffect(() => {
    if (timer === 0 && phase === "warmup") {
      setPhase("working");
      setWarmupDone(true);
      void recordEvent({
        slug,
        sessionIndex: session?.index ?? 0,
        type: "warmup_completed",
      });
    }
    if (timer === 0 && phase === "break") {
      if (!session) return;
      const next = currentSet + 1;
      if (next > session.sets.length) {
        setPhase("done");
        void recordEvent({
          slug,
          sessionIndex: session.index,
          type: "break_completed",
        });
        const summary = `${program?.exercise?.name ?? slug} ${
          session.sets.length
        } sets, ${session.totalReps} reps`;
        void completeSession(slug, session.index, summary);
      } else {
        setCurrentSet(next);
        setPhase("working");
        void recordEvent({
          slug,
          sessionIndex: session.index,
          type: "break_completed",
        });
      }
    }
  }, [
    timer,
    phase,
    currentSet,
    session,
    slug,
    program?.exercise?.name,
    recordEvent,
    completeSession,
  ]);

  // Handler functions
  const handlePauseResume = useCallback(() => {
    if (phase === "working" || phase === "done" || !session) return;
    if (isPaused) {
      resumeTimer();
      void recordEvent({
        slug,
        sessionIndex: session.index,
        type: phase === "warmup" ? "warmup_resumed" : "break_resumed",
      });
      void haptics.resumeTimer();
    } else {
      pauseTimer();
      void recordEvent({
        slug,
        sessionIndex: session.index,
        type: phase === "warmup" ? "warmup_paused" : "break_paused",
      });
      void haptics.pauseTimer();
    }
  }, [phase, isPaused, session, slug, resumeTimer, pauseTimer, recordEvent]);

  const handleSkip = useCallback(() => {
    if (!session) return;
    if (phase === "warmup") {
      clearTimer();
      setTimer(0);
      setIsPaused(false);
      setWarmupDone(true);
      setPhase("working");
      void recordEvent({
        slug,
        sessionIndex: session.index,
        type: "warmup_skipped",
      });
      void haptics.skipAction();
      return;
    }
    if (phase === "break") {
      clearTimer();
      setTimer(0);
      setIsPaused(false);
      setPhase("working");
      const next = currentSet + 1;
      if (next <= session.sets.length) setCurrentSet(next);
      void recordEvent({
        slug,
        sessionIndex: session.index,
        type: "break_skipped",
      });
      void haptics.skipAction();
      return;
    }
    if (phase === "working") {
      if (breakSeconds > 0 && currentSet < session.sets.length) {
        setPhase("break");
        startTimer(breakSeconds);
        void recordEvent({
          slug,
          sessionIndex: session.index,
          type: "set_skipped",
          data: { set: currentSet },
        });
        void recordEvent({
          slug,
          sessionIndex: session.index,
          type: "break_started",
          data: { afterSet: currentSet },
        });
        void haptics.skipAction();
      } else {
        const next = currentSet + 1;
        void recordEvent({
          slug,
          sessionIndex: session.index,
          type: "set_skipped",
          data: { set: currentSet },
        });
        if (next > session.sets.length) {
          setPhase("done");
          setShowConfetti(true);
          const summary = `${program?.exercise?.name ?? slug} ${
            session.sets.length
          } sets, ${session.totalReps} reps`;
          void completeSession(slug, session.index, summary);
          void haptics.sessionComplete();
        } else {
          setCurrentSet(next);
          void haptics.buttonTap();
        }
      }
    }
  }, [
    session,
    phase,
    currentSet,
    breakSeconds,
    slug,
    program?.exercise?.name,
    clearTimer,
    startTimer,
    recordEvent,
    completeSession,
  ]);

  const handleComplete = useCallback(() => {
    if (phase !== "working" || !session) return;
    const setNum = currentSet;
    const reps = session.sets[setNum - 1] ?? 0;
    if (breakSeconds > 0 && setNum < session.sets.length) {
      setPhase("break");
      startTimer(breakSeconds);
      void recordEvent({
        slug,
        sessionIndex: session.index,
        type: "set_completed",
        data: { set: setNum, reps },
      });
      void recordEvent({
        slug,
        sessionIndex: session.index,
        type: "break_started",
        data: { afterSet: setNum },
      });
      void haptics.setComplete();
    } else {
      const next = setNum + 1;
      void recordEvent({
        slug,
        sessionIndex: session.index,
        type: "set_completed",
        data: { set: setNum, reps },
      });
      if (next > session.sets.length) {
        setPhase("done");
        setShowConfetti(true);
        const summary = `${program?.exercise?.name ?? slug} ${
          session.sets.length
        } sets, ${session.totalReps} reps`;
        void completeSession(slug, session.index, summary);
        void haptics.sessionComplete();
      } else {
        setCurrentSet(next);
        void haptics.setComplete();
      }
    }
  }, [
    phase,
    session,
    currentSet,
    breakSeconds,
    slug,
    program?.exercise?.name,
    startTimer,
    recordEvent,
    completeSession,
  ]);

  // Calculate progress
  const totalSets = session?.sets.length ?? 0;
  const completedSets =
    phase === "done" ? totalSets : Math.max(0, currentSet - 1);
  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  return {
    // State
    phase,
    currentSet,
    timer,
    isPaused,
    warmupDone,
    showConfetti,
    progress,

    // Derived
    warmUpSeconds,
    breakSeconds,

    // Actions
    handlePauseResume,
    handleSkip,
    handleComplete,
    setShowConfetti,
  };
}
