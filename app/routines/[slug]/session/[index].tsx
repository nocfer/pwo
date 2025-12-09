import { StepCard } from "@/components/StepCard";
import { TimerControls } from "@/components/TimerControls";
import { useProgramSessions } from "@/hooks/useProgramSessions";
import { useSessionSteps } from "@/hooks/useSessionSteps";
import { appendEvent, appendHistory, loadSessionState, saveSessionState } from "@/lib/persist";
import { theme } from "@/theme/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

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
  const [warmupDone, setWarmupDone] = useState(warmUpSeconds === 0);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{program.exercise.name}</Text>
      <Text style={styles.subtitle}>Session {session.index} • Total {session.totalReps} reps</Text>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Sets: {completedSets}/{totalSets}</Text>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={steps}
        keyExtractor={(item) => item.key}
        extraData={{ phase, timer, currentSet, isPaused, currentStepIndex: currentStepIndex }}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
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
          const rightTick = isDone ? <Text style={styles.tick}>✓</Text> : undefined;

          if (item.type === "warmup") {
            return (
              <StepCard title="Warm-up" active={isActive} done={isDone} locked={isLocked} right={rightTick}>
                {isActive && phase === "warmup" && (
                  <>
                    <Text style={styles.timerText}>{formatTime(timer)}</Text>
                    <View style={styles.rowGap}>
                      <TimerControls
                        isPaused={isPaused}
                        onPause={() => {
                          pauseTimer();
                          if (session) void appendEvent({ slug, sessionIndex: session.index, type: "warmup_paused" });
                        }}
                        onResume={() => {
                          resumeTimer();
                          if (session) void appendEvent({ slug, sessionIndex: session.index, type: "warmup_resumed" });
                        }}
                        onSkip={() => {
                          clearTimer();
                          setTimer(0);
                          setIsPaused(false);
                          setWarmupDone(true);
                          setPhase("working");
                          if (session) void appendEvent({ slug, sessionIndex: session.index, type: "warmup_skipped" });
                        }}
                      />
                      <Text style={styles.muted}>Automatically starts work sets when finished.</Text>
                    </View>
                  </>
                )}
              </StepCard>
            );
          }

          if (item.type === "set") {
            const setNum = item.set;
            const isCurrentSet = isActive && phase === "working" && currentSet === setNum;
            return (
              <StepCard
                title={`Set ${setNum} of ${session.sets.length}`}
                active={isActive}
                done={isDone || (phase === "done" && index < steps.length)}
                locked={isLocked}
                right={(isDone || (phase === "done" && index < steps.length)) ? <Text style={styles.tick}>✓</Text> : undefined}
              >
                <View style={styles.setPill}><Text style={styles.setPillText}>{item.reps} reps</Text></View>
                {isCurrentSet && (
                  <Pressable
                    style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                    onPress={() => {
                      if (breakSeconds > 0 && setNum < session.sets.length) {
                        setPhase("break");
                        startTimer(breakSeconds);
                        void appendEvent({ slug, sessionIndex: session.index, type: "set_completed", data: { set: setNum, reps: item.reps } });
                        void appendEvent({ slug, sessionIndex: session.index, type: "break_started", data: { afterSet: setNum } });
                      } else {
                        const next = setNum + 1;
                        void appendEvent({ slug, sessionIndex: session.index, type: "set_completed", data: { set: setNum, reps: item.reps } });
                        if (next > session.sets.length) {
                          setPhase("done");
                          void appendEvent({ slug, sessionIndex: session.index, type: "session_completed" });
                          void appendHistory(slug, {
                            date: new Date().toISOString().slice(0, 10),
                            summary: `${program?.exercise.name ?? slug} ${session.sets.length} sets, ${session.totalReps} reps`,
                          });
                        } else {
                          setCurrentSet(next);
                        }
                      }
                    }}
                  >
                    <Text style={styles.ctaText}>Complete set</Text>
                  </Pressable>
                )}
              </StepCard>
            );
          }

          // break
          const after = item.afterSet;
          const isCurrentBreak = isActive && phase === "break" && currentSet === after;
          return (
            <StepCard title="Break" active={isActive} done={isDone} locked={isLocked} right={rightTick}>
              {isCurrentBreak && (
                <>
                  <Text style={styles.timerText}>{formatTime(timer)}</Text>
                  <TimerControls
                    isPaused={isPaused}
                    onPause={() => {
                      pauseTimer();
                      void appendEvent({ slug, sessionIndex: session!.index, type: "break_paused" });
                    }}
                    onResume={() => {
                      resumeTimer();
                      void appendEvent({ slug, sessionIndex: session!.index, type: "break_resumed" });
                    }}
                    onSkip={() => {
                      // skip break
                      clearTimer();
                      setTimer(0);
                      setIsPaused(false);
                      setPhase("working");
                      const next = currentSet + 1;
                      if (next <= session.sets.length) setCurrentSet(next);
                      void appendEvent({ slug, sessionIndex: session!.index, type: "break_skipped" });
                    }}
                  />
                </>
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
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
  },
  subtitle: {
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
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
    height: 8,
    width: "100%",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
})
