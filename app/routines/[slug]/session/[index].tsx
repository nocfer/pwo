import { ConfettiCelebration } from "@/components/ConfettiCelebration";
import { StepCard } from "@/components/StepCard";
import { useProgramSessions } from "@/hooks/useProgramSessions";
import { useSessionSteps } from "@/hooks/useSessionSteps";
import { haptics } from "@/lib/haptics";
import { appendEvent, appendHistory, loadSessionState, saveSessionState, saveStreakHit } from "@/lib/persistPlatform";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function SessionDetail() {
  const params = useLocalSearchParams();
  const slug = params.slug as string;
  const index = Number(params.index);

  const { program, sessions, loading, error } = useProgramSessions(slug);
  const session = useMemo(() => sessions.find((s) => s.index === index), [sessions, index]);

  const warmUpSeconds = program?.exercise.warmUp ?? 0;
  const breakSeconds = program?.exercise.break ?? 0;

  const [phase, setPhase] = useState<"warmup" | "working" | "break" | "done">(
    warmUpSeconds > 0 ? "warmup" : "working"
  );
  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState(() => (phase === "warmup" ? warmUpSeconds : 0));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [warmupDone, setWarmupDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback((seconds: number) => {
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
  }, [clearTimer]);

  const pauseTimer = useCallback(() => {
    clearTimer();
    setIsPaused(true);
  }, [clearTimer]);

  const resumeTimer = useCallback(() => {
    if (timer > 0 && isPaused) {
      startTimer(timer);
    }
  }, [isPaused, startTimer, timer]);

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
      if ((saved.phase === "warmup" || saved.phase === "break") && saved.timer > 0 && !saved.isPaused) {
        startTimer(saved.timer);
      }
    })();
    return () => {
      active = false;
    };
  }, [program, session, slug, startTimer]);

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
  }, [slug, session, phase, currentSet, timer, isPaused, warmupDone]);

  useEffect(() => {
    if (phase === "warmup" && warmUpSeconds > 0) {
      startTimer(warmUpSeconds);
      void appendEvent({ slug, sessionIndex: session?.index ?? index, type: "warmup_started" });
    }
  }, [phase, warmUpSeconds, startTimer, slug, index, session?.index]);

  // If the program has no warm-up, mark warmupDone once program is known
  useEffect(() => {
    if (program && (program.exercise.warmUp ?? 0) === 0 && !warmupDone) {
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
  }, [program, warmUpSeconds, warmupDone, phase, currentSet, timer, startTimer]);

  useEffect(() => {
    if (timer === 0 && phase === "warmup") {
      setPhase("working");
      setWarmupDone(true);
      void appendEvent({ slug, sessionIndex: session?.index ?? index, type: "warmup_completed" });
    }
    if (timer === 0 && phase === "break") {
      if (!session) return;
      const next = currentSet + 1;
      if (next > session.sets.length) {
        setPhase("done");
        void appendEvent({ slug, sessionIndex: session.index, type: "break_completed" });
        void appendEvent({ slug, sessionIndex: session.index, type: "session_completed" });
        void appendHistory(slug, {
          date: new Date().toISOString().slice(0, 10),
          summary: `${program?.exercise.name ?? slug} ${session.sets.length} sets, ${session.totalReps} reps`,
        });
        void saveStreakHit(slug, new Date().toISOString());
      } else {
        setCurrentSet(next);
        setPhase("working");
        void appendEvent({ slug, sessionIndex: session.index, type: "break_completed" });
      }
    }
  }, [timer, phase, currentSet, session, slug, index, program?.exercise?.name]);

  const { steps, currentStepIndex, totalSets, completedSets } = useSessionSteps(
    warmUpSeconds,
    breakSeconds,
    session,
    phase,
    currentSet
  );

  // Auto-scroll to active step
  const listRef = useRef<FlatList<any> | null>(null);
  useEffect(() => {
    if (!listRef.current) return;
    if (currentStepIndex < 0 || currentStepIndex >= steps.length) return;
    try {
      listRef.current.scrollToIndex({ index: currentStepIndex, animated: true, viewPosition: 0.5 });
    } catch {}
  }, [currentStepIndex, steps.length]);

  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  // Handler functions
  const handlePauseResume = () => {
    if (phase === "working" || phase === "done") return;
    if (isPaused) {
      resumeTimer();
      void appendEvent({ slug, sessionIndex: session!.index, type: phase === "warmup" ? "warmup_resumed" : "break_resumed" });
      void haptics.resumeTimer();
    } else {
      pauseTimer();
      void appendEvent({ slug, sessionIndex: session!.index, type: phase === "warmup" ? "warmup_paused" : "break_paused" });
      void haptics.pauseTimer();
    }
  };

  const handleSkip = () => {
    if (!session) return;
    if (phase === "warmup") {
      clearTimer();
      setTimer(0);
      setIsPaused(false);
      setWarmupDone(true);
      setPhase("working");
      void appendEvent({ slug, sessionIndex: session.index, type: "warmup_skipped" });
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
      void appendEvent({ slug, sessionIndex: session.index, type: "break_skipped" });
      void haptics.skipAction();
      return;
    }
    if (phase === "working") {
      if (breakSeconds > 0 && currentSet < session.sets.length) {
        setPhase("break");
        startTimer(breakSeconds);
        void appendEvent({ slug, sessionIndex: session.index, type: "set_skipped", data: { set: currentSet } });
        void appendEvent({ slug, sessionIndex: session.index, type: "break_started", data: { afterSet: currentSet } });
        void haptics.skipAction();
      } else {
        const next = currentSet + 1;
        void appendEvent({ slug, sessionIndex: session.index, type: "set_skipped", data: { set: currentSet } });
        if (next > session.sets.length) {
          setPhase("done");
          setShowConfetti(true);
          void appendEvent({ slug, sessionIndex: session.index, type: "session_completed" });
          void appendHistory(slug, {
            date: new Date().toISOString().slice(0, 10),
            summary: `${program?.exercise.name ?? slug} ${session.sets.length} sets, ${session.totalReps} reps`,
          });
          void saveStreakHit(slug, new Date().toISOString());
          void haptics.sessionComplete();
        } else {
          setCurrentSet(next);
          void haptics.buttonTap();
        }
      }
    }
  };

  const handleComplete = () => {
    if (phase !== "working" || !session) return;
    const setNum = currentSet;
    const reps = session.sets[setNum - 1] ?? 0;
    if (breakSeconds > 0 && setNum < session.sets.length) {
      setPhase("break");
      startTimer(breakSeconds);
      void appendEvent({ slug, sessionIndex: session.index, type: "set_completed", data: { set: setNum, reps } });
      void appendEvent({ slug, sessionIndex: session.index, type: "break_started", data: { afterSet: setNum } });
      void haptics.setComplete();
    } else {
      const next = setNum + 1;
      void appendEvent({ slug, sessionIndex: session.index, type: "set_completed", data: { set: setNum, reps } });
      if (next > session.sets.length) {
        setPhase("done");
        setShowConfetti(true);
        void appendEvent({ slug, sessionIndex: session.index, type: "session_completed" });
        void appendHistory(slug, {
          date: new Date().toISOString().slice(0, 10),
          summary: `${program?.exercise.name ?? slug} ${session.sets.length} sets, ${session.totalReps} reps`,
        });
        void saveStreakHit(slug, new Date().toISOString());
        void haptics.sessionComplete();
      } else {
        setCurrentSet(next);
        void haptics.setComplete();
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.muted}>Loading…</Text>
        </View>
      </View>
    );
  }
  if (error || !program || !session) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.muted}>Session unavailable.</Text>
        </View>
      </View>
    );
  }

  const phaseBg = phase === "warmup" ? theme.colors.phases.warmupBg : phase === "working" ? theme.colors.phases.workingBg : phase === "break" ? theme.colors.phases.breakBg : theme.colors.phases.doneBg;
  const phaseFg = phase === "warmup" ? theme.colors.phases.warmup : phase === "working" ? theme.colors.phases.working : phase === "break" ? theme.colors.phases.break : theme.colors.phases.done;

  return (
    <View style={styles.container}>
      {/* Confetti Celebration */}
      <ConfettiCelebration
        show={showConfetti}
        onComplete={() => setShowConfetti(false)}
        message="Session Complete! 🎉"
        subMessage="You're crushing it!"
      />

      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{program.exercise.name}</Text>
              <Text style={styles.subtitle}>Session {session.index} • {session.totalReps} reps total</Text>
            </View>
            <View style={[styles.phaseChip, { backgroundColor: phaseBg, borderColor: phaseFg }]}>
              <View style={[styles.phaseChipDot, { backgroundColor: phaseFg }]} />
              <Text style={[styles.phaseChipText, { color: phaseFg }]}>
                {phase === "warmup" ? "Warm-up" : phase === "working" ? "Working" : phase === "break" ? "Break" : "Done"}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{completedSets}/{totalSets} sets</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: phaseFg }]} />
            </View>
          </View>
        </View>

        {/* Focus Card */}
        {phase !== "working" && phase !== "done" ? (
          <View style={[styles.focusCard, { backgroundColor: phaseBg, borderColor: phaseFg }]}>
            <Text style={[styles.timerHero, { color: phaseFg }]}>{formatTime(timer)}</Text>
            <Text style={styles.focusLabel}>
              {phase === "warmup" ? "Get ready for your workout" : `Rest after set ${currentSet}`}
            </Text>
          </View>
        ) : (
          <View style={styles.focusRow}>
            <View style={[styles.infoPill, { backgroundColor: phaseBg, borderColor: phaseFg }]}>
              <Ionicons name="barbell-outline" size={18} color={phaseFg} />
              <Text style={[styles.infoPillText, { color: phaseFg }]}>Set {currentSet}/{session.sets.length}</Text>
            </View>
            <View style={[styles.infoPill, { backgroundColor: phaseBg, borderColor: phaseFg }]}>
              <Ionicons name="repeat-outline" size={18} color={phaseFg} />
              <Text style={[styles.infoPillText, { color: phaseFg }]}>{session.sets[currentSet - 1] ?? 0} reps</Text>
            </View>
          </View>
        )}

        {/* Steps List */}
        <FlatList
          ref={listRef}
          data={steps}
          keyExtractor={(item) => item.key}
          extraData={{ phase, timer, currentSet, isPaused, currentStepIndex }}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
          contentContainerStyle={styles.listContent}
          onScrollToIndexFailed={(info) => {
            try {
              if (!listRef.current) return;
              const validIndex = Math.min(info.highestMeasuredFrameIndex, info.index);
              listRef.current.scrollToIndex({ index: Math.max(0, validIndex), animated: true });
            } catch {}
          }}
          renderItem={({ item, index: idx }) => {
            const isDone = idx < currentStepIndex;
            const isActive = idx === currentStepIndex && phase !== "done";
            const isLocked = idx > currentStepIndex || phase === "done";
            const rightTick = isDone ? <Text style={[styles.tick, { color: phaseFg }]}>✓</Text> : undefined;

            if (item.type === "warmup") {
              return (
                <StepCard title="Warm-up" active={isActive} done={isDone} locked={isLocked} right={rightTick}>
                  {isActive && phase === "warmup" && (
                    <Text style={styles.timerText}>{formatTime(timer)}</Text>
                  )}
                </StepCard>
              );
            }

            if (item.type === "set") {
              const setNum = item.set;
              return (
                <StepCard
                  title={`Set ${setNum} of ${session.sets.length}`}
                  active={isActive}
                  done={isDone || (phase === "done" && idx < steps.length)}
                  locked={isLocked}
                  right={(isDone || (phase === "done" && idx < steps.length)) ? <Text style={styles.tick}>✓</Text> : undefined}
                >
                  <View style={styles.setPill}>
                    <Text style={styles.setPillText}>{item.reps} reps</Text>
                  </View>
                </StepCard>
              );
            }

            // break
            const after = item.afterSet;
            const isCurrentBreak = isActive && phase === "break" && currentSet === after;
            return (
              <StepCard title="Break" active={isActive} done={isDone} locked={isLocked} right={rightTick}>
                {isCurrentBreak && (
                  <Text style={styles.timerText}>{formatTime(timer)}</Text>
                )}
              </StepCard>
            );
          }}
          ListFooterComponent={
            phase === "done" ? (
              <View style={styles.doneCard}>
                <View style={styles.doneIconContainer}>
                  <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
                </View>
                <Text style={styles.doneTitle}>Session Complete!</Text>
                <Text style={styles.doneSubtitle}>Great job finishing your workout</Text>
                <Pressable
                  style={({ pressed }) => [styles.doneButton, pressed && styles.buttonPressed]}
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={18} color={theme.colors.primaryTextOn} style={{ marginRight: theme.spacing.sm }} />
                  <Text style={styles.doneButtonText}>Back to Routine</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      </View>

      {/* Bottom Controls */}
      {phase !== "done" && (
        <SafeAreaView style={styles.footer}>
          <View style={styles.footerContent}>
            {/* Secondary actions row */}
            <View style={styles.secondaryRow}>
              <Pressable
                disabled={phase === "working"}
                onPress={handlePauseResume}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  (phase === "working") && styles.btnDisabled,
                  pressed && styles.secondaryBtnPressed,
                ]}
              >
                <Ionicons
                  name={isPaused ? "play" : "pause"}
                  size={20}
                  color={phase === "working" ? theme.colors.muted : theme.colors.text}
                />
                <Text style={[styles.secondaryBtnText, phase === "working" && styles.textDisabled]}>
                  {isPaused ? "Resume" : "Pause"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSkip}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.secondaryBtnPressed,
                ]}
              >
                <Ionicons name="play-skip-forward" size={20} color={theme.colors.text} />
                <Text style={styles.secondaryBtnText}>Skip</Text>
              </Pressable>
            </View>

            {/* Primary action */}
            <Pressable
              disabled={phase !== "working"}
              onPress={handleComplete}
              style={({ pressed }) => [
                styles.primaryBtn,
                phase !== "working" && styles.primaryBtnDisabled,
                pressed && phase === "working" && styles.primaryBtnPressed,
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.primaryTextOn}
                style={{ marginRight: theme.spacing.sm }}
              />
              <Text style={styles.primaryBtnText}>
                {phase === "working" ? `Complete Set ${currentSet}` : phase === "warmup" ? "Warming up..." : "Resting..."}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

function formatTime(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  phaseChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  phaseChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseChipText: {
    ...theme.typography.caption,
    fontWeight: "600",
  },
  progressSection: {
    gap: theme.spacing.xs,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
  },
  progressValue: {
    ...theme.typography.caption,
    fontWeight: "600",
    color: theme.colors.subtext,
  },
  progressBarTrack: {
    height: 8,
    width: "100%",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: theme.radius.sm,
  },
  focusCard: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    ...theme.shadows.md,
  },
  timerHero: {
    fontSize: 56,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginBottom: theme.spacing.xs,
  },
  focusLabel: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  focusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  infoPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  infoPillText: {
    ...theme.typography.bodyBold,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 200,
  },
  timerText: {
    ...theme.typography.h1,
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
    marginTop: theme.spacing.xs,
  },
  setPill: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  setPillText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  tick: {
    color: theme.colors.success,
    fontWeight: "700",
    fontSize: 18,
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  doneCard: {
    backgroundColor: theme.colors.successLight,
    borderColor: theme.colors.success,
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    alignItems: "center",
    ...theme.shadows.md,
  },
  doneIconContainer: {
    marginBottom: theme.spacing.md,
  },
  doneTitle: {
    ...theme.typography.h2,
    color: theme.colors.success,
    marginBottom: theme.spacing.xs,
  },
  doneSubtitle: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    marginBottom: theme.spacing.lg,
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.success,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    ...theme.shadows.md,
  },
  doneButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn,
  },

  // Footer styles
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    ...theme.shadows.lg,
  },
  footerContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  secondaryRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  secondaryBtnPressed: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.98 }],
  },
  secondaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  primaryBtnDisabled: {
    backgroundColor: theme.colors.muted,
  },
  primaryBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn,
    fontSize: 16,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: theme.colors.muted,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
