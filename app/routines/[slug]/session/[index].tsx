import { StepCard } from "@/components/StepCard";
import { useProgramSessions } from "@/hooks/useProgramSessions";
import { useSessionSteps } from "@/hooks/useSessionSteps";
import { appendEvent, appendHistory, loadSessionState, saveSessionState, saveStreakHit } from "@/lib/persistPlatform";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
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

  // const repsForSet = session?.sets[currentSet - 1] ?? 0;

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

  // Ensure warm-up is honored once the program loads. On first render, warmUpSeconds may be 0,
  // which would set phase to "working". When program arrives with warmUpSeconds > 0, switch to warmup.
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }
  if (error || !program || !session) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Session unavailable.</Text>
      </View>
    );
  }

  const phaseBg = phase === "warmup" ? theme.colors.phases.warmupBg : phase === "working" ? theme.colors.phases.workingBg : phase === "break" ? theme.colors.phases.breakBg : theme.colors.phases.doneBg;
  const phaseFg = phase === "warmup" ? theme.colors.phases.warmup : phase === "working" ? theme.colors.phases.working : phase === "break" ? theme.colors.phases.break : theme.colors.phases.done;
  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={[styles.rowBetween, styles.headerWrap]}>
          <View>
            <Text style={styles.title}>{program.exercise.name}</Text>
            <Text style={styles.subtitle}>Session {session.index} • Total {session.totalReps} reps</Text>
          </View>
          <View style={[
            styles.phaseChip,
            { backgroundColor: phaseBg, borderColor: phaseFg },
          ]}
          >
            <Text style={styles.phaseChipText}>
              {phase === "warmup" ? "Warm-up" : phase === "working" ? "Working" : phase === "break" ? "Break" : "Done"}
            </Text>
          </View>
        </View>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Sets: {completedSets}/{totalSets}</Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: phaseFg }]} />
          </View>
        </View>

        {phase !== "working" && phase !== "done" ? (
          <View style={styles.focusCard}>
            <Text style={[styles.timerHero, { color: phase === "warmup" ? theme.colors.phases.warmup : theme.colors.phases.break }]}>{formatTime(timer)}</Text>
            <Text style={styles.muted}>
              {phase === "warmup" ? "Get ready" : `Rest after set ${currentSet}`}
            </Text>
          </View>
        ) : (
          <View style={styles.focusRow}>
            <View style={[styles.setPillBig, { backgroundColor: phaseBg, borderColor: phaseFg }]}>
              <Ionicons name="barbell-outline" size={16} color={theme.colors.text} />
              <Text style={styles.setPillBigText}>Set {currentSet} of {session.sets.length}</Text>
            </View>
            <View style={[styles.setPillBig, { backgroundColor: phaseBg, borderColor: phaseFg }]}>
              <Ionicons name="repeat-outline" size={16} color={theme.colors.text} />
              <Text style={styles.setPillBigText}>{session.sets[currentSet - 1] ?? 0} reps</Text>
            </View>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={steps}
          keyExtractor={(item) => item.key}
          extraData={{ phase, timer, currentSet, isPaused, currentStepIndex: currentStepIndex }}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
          contentContainerStyle={styles.listContent}
          onScrollToIndexFailed={(info) => {
            // Fallback: scroll to closest and retry
            try {
              if (!listRef.current) return;
              const validIndex = Math.min(info.highestMeasuredFrameIndex, info.index);
              listRef.current.scrollToIndex({ index: Math.max(0, validIndex), animated: true });
            } catch {}
          }}
          renderItem={({ item, index }) => {
          const isDone = index < currentStepIndex;
          const isActive = index === currentStepIndex && phase !== "done";
          const isLocked = index > currentStepIndex || phase === "done";
          const rightTick = isDone ? <Text style={[styles.tick, { color: phaseFg }]}>✓</Text> : undefined;

          if (item.type === "warmup") {
            return (
              <StepCard title="Warm-up" active={isActive} done={isDone} locked={isLocked} right={rightTick}>
                {isActive && phase === "warmup" && (
                  <>
                    <Text style={styles.timerText}>{formatTime(timer)}</Text>
                  </>
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
                done={isDone || (phase === "done" && index < steps.length)}
                locked={isLocked}
                right={(isDone || (phase === "done" && index < steps.length)) ? <Text style={styles.tick}>✓</Text> : undefined}
              >
                <View style={styles.setPill}><Text style={styles.setPillText}>{item.reps} reps</Text></View>
                {/* Complete set moved to global footer */}
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
            <View style={[styles.card, styles.cardDone]}>
              <Text style={[styles.cardTitle, styles.cardTitleDone]}>Session complete</Text>
              <Pressable
                style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                onPress={() => router.back()}
              >
                <Text style={styles.ctaText}>Back</Text>
              </Pressable>
            </View>
          ) : null
        }
        />
      </View>

      {/* Sticky global controls footer */}
      <SafeAreaView style={[
        styles.footer,
      ]}>
        <View style={[styles.footerBar, { backgroundColor: phaseBg, borderColor: phaseFg, borderWidth: 1 }]}>
          {/* Pause/Resume */}
          <Pressable
            disabled={phase === "working" || phase === "done"}
            onPress={() => {
              if (phase === "working" || phase === "done") return;
              if (isPaused) {
                resumeTimer();
                void appendEvent({ slug, sessionIndex: session.index, type: phase === "warmup" ? "warmup_resumed" : "break_resumed" });
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } else {
                pauseTimer();
                void appendEvent({ slug, sessionIndex: session.index, type: phase === "warmup" ? "warmup_paused" : "break_paused" });
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            style={({ pressed }) => [
              styles.footerBtn,
              styles.footerBtnPause,
              (phase === "working" || phase === "done") && styles.footerBtnDisabled,
              pressed && styles.footerBtnPressed,
            ]}
          >
            <Ionicons
              name={isPaused ? "play-outline" : "pause-outline"}
              size={20}
              color={theme.colors.primaryTextOn}
              style={styles.footerBtnIcon}
            />
            <Text style={styles.footerBtnText}>{isPaused ? "Resume" : "Pause"}</Text>
          </Pressable>

          {/* Skip */}
          <Pressable
            disabled={phase === "done"}
            onPress={() => {
              if (phase === "warmup") {
                clearTimer();
                setTimer(0);
                setIsPaused(false);
                setWarmupDone(true);
                setPhase("working");
                void appendEvent({ slug, sessionIndex: session.index, type: "warmup_skipped" });
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                return;
              }
              if (phase === "working") {
                // Skip current set
                if (breakSeconds > 0 && currentSet < session.sets.length) {
                  setPhase("break");
                  startTimer(breakSeconds);
                  void appendEvent({ slug, sessionIndex: session.index, type: "set_skipped", data: { set: currentSet } });
                  void appendEvent({ slug, sessionIndex: session.index, type: "break_started", data: { afterSet: currentSet } });
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } else {
                  const next = currentSet + 1;
                  void appendEvent({ slug, sessionIndex: session.index, type: "set_skipped", data: { set: currentSet } });
                  if (next > session.sets.length) {
                    setPhase("done");
                    void appendEvent({ slug, sessionIndex: session.index, type: "session_completed" });
                    void appendHistory(slug, {
                      date: new Date().toISOString().slice(0, 10),
                      summary: `${program?.exercise.name ?? slug} ${session.sets.length} sets, ${session.totalReps} reps`,
                    });
                    void saveStreakHit(slug, new Date().toISOString());
                    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } else {
                    setCurrentSet(next);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }
              }
            }}
            style={({ pressed }) => [
              styles.footerBtn,
              styles.footerBtnSkip,
              phase === "done" && styles.footerBtnDisabled,
              pressed && styles.footerBtnPressed,
            ]}
          >
            <Ionicons name="play-skip-forward-outline" size={20} color={theme.colors.primaryTextOn} style={styles.footerBtnIcon} />
            <Text style={styles.footerBtnText}>Skip</Text>
          </Pressable>

          {/* Complete Set */}
          <Pressable
            disabled={phase !== "working"}
            onPress={() => {
              if (phase !== "working") return;
              const setNum = currentSet;
              const reps = session.sets[setNum - 1] ?? 0;
              if (breakSeconds > 0 && setNum < session.sets.length) {
                setPhase("break");
                startTimer(breakSeconds);
                void appendEvent({ slug, sessionIndex: session.index, type: "set_completed", data: { set: setNum, reps } });
                void appendEvent({ slug, sessionIndex: session.index, type: "break_started", data: { afterSet: setNum } });
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } else {
                const next = setNum + 1;
                void appendEvent({ slug, sessionIndex: session.index, type: "set_completed", data: { set: setNum, reps } });
                if (next > session.sets.length) {
                  setPhase("done");
                  void appendEvent({ slug, sessionIndex: session.index, type: "session_completed" });
                  void appendHistory(slug, {
                    date: new Date().toISOString().slice(0, 10),
                    summary: `${program?.exercise.name ?? slug} ${session.sets.length} sets, ${session.totalReps} reps`,
                  });
                  void saveStreakHit(slug, new Date().toISOString());
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } else {
                  setCurrentSet(next);
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }
            }}
            style={({ pressed }) => [
              styles.footerBtn,
              styles.footerBtnComplete,
              phase !== "working" && styles.footerBtnDisabled,
              pressed && styles.footerBtnPressed,
            ]}
          >
            <Ionicons name="checkmark-done-outline" size={20} color={theme.colors.primaryTextOn} style={styles.footerBtnIcon} />
            <Text style={styles.footerBtnText}>Complete</Text>
          </Pressable>
        </View>
      </SafeAreaView>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
  },
  subtitle: {
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  cardActive: {
    borderColor: theme.colors.primary,
  },
  cardDone: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.card,
  },
  cardLocked: {
    opacity: 0.6,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: theme.spacing.sm,
  },
  cardTitleDone: {
    color: theme.colors.success,
  },
  cardTitleLocked: {
    color: theme.colors.muted,
  },
  timerText: {
    color: theme.colors.text,
    fontSize: 32,
    fontVariant: ["tabular-nums"],
    marginBottom: theme.spacing.sm,
  },
  cta: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    color: theme.colors.primaryTextOn,
    fontWeight: "600",
  },
  ctaSecondary: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  ctaSecondaryPressed: {
    backgroundColor: theme.colors.card,
  },
  ctaSecondaryText: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  rowGap: {
    gap: theme.spacing.sm,
  },
  rowH: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  setPill: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
  },
  setPillText: {
    color: theme.colors.text,
  },
  tick: {
    color: theme.colors.success,
    fontWeight: "700",
    fontSize: 18,
  },
  muted: {
    color: theme.colors.muted,
  },
  progressHeader: {
    gap: theme.spacing.sm,
  },
  progressLabel: {
    color: theme.colors.subtext,
  },
  progressBarTrack: {
    height: 10,
    width: "100%",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
  headerWrap: {
    marginBottom: theme.spacing.sm,
  },
  listContent: {
    paddingBottom: 120,
  },
  // Floating footer container
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  // Inner rounded bar with shadow and phase-tinted background
  footerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    // Android shadow
    elevation: 6,
  },
  footerBarWarmup: {
    backgroundColor: "#FEF3C7", // amber-100
  },
  footerBarWorking: {
    backgroundColor: "#DBEAFE", // blue-100
  },
  footerBarBreak: {
    backgroundColor: "#E5E7EB", // gray-200
  },
  footerBarDone: {
    backgroundColor: "#DCFCE7", // green-100
  },
  footerBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.xxl,
    flexDirection: "row",
    minHeight: 48,
  },
  footerBtnPause: {
    backgroundColor: theme.colors.warning,
  },
  footerBtnSkip: {
    backgroundColor: theme.colors.danger,
  },
  footerBtnComplete: {
    backgroundColor: theme.colors.success,
  },
  footerBtnDisabled: {
    opacity: 0.6,
  },
  footerBtnPressed: {
    opacity: 0.9,
  },
  footerBtnIcon: {
    marginRight: 6,
  },
  footerBtnText: {
    color: theme.colors.primaryTextOn,
    fontWeight: "700",
    fontSize: 15,
  },
  // Header phase chip
  phaseChip: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.card,
  },
  phaseChipWarmup: { backgroundColor: "#FEF3C7" },
  phaseChipWorking: { backgroundColor: "#DBEAFE" },
  phaseChipBreak: { backgroundColor: "#E5E7EB" },
  phaseChipDone: { backgroundColor: "#DCFCE7" },
  phaseChipText: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  // Focus elements
  focusCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    paddingVertical: theme.spacing.xl,
    alignItems: "center",
    // subtle shadow
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  timerHero: {
    color: theme.colors.text,
    fontSize: 44,
    fontVariant: ["tabular-nums"],
    marginBottom: theme.spacing.xs,
  },
  focusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  setPillBig: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
  },
  setPillBigText: {
    color: theme.colors.text,
    fontWeight: "700",
  },
})
