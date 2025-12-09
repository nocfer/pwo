import { useProgramSessions } from "@/hooks/useProgramSessions";
import { theme } from "@/theme/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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

  const repsForSet = session?.sets[currentSet - 1] ?? 0;

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
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    if (phase === "warmup" && warmUpSeconds > 0) {
      startTimer(warmUpSeconds);
    }
  }, [phase, warmUpSeconds, startTimer]);

  useEffect(() => {
    if (timer === 0 && phase === "warmup") {
      setPhase("working");
    }
    if (timer === 0 && phase === "break") {
      if (!session) return;
      const next = currentSet + 1;
      if (next > session.sets.length) {
        setPhase("done");
      } else {
        setCurrentSet(next);
        setPhase("working");
      }
    }
  }, [timer, phase, currentSet, session]);

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

      {phase === "warmup" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Warm-up</Text>
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            onPress={() => clearTimer()}
          >
            <Text style={styles.ctaText}>Pause</Text>
          </Pressable>
          <View style={styles.rowGap}>
            <Text style={styles.muted}>Automatically starts work sets when finished.</Text>
          </View>
        </View>
      )}

      {phase !== "warmup" && phase !== "done" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Set {currentSet} of {session.sets.length}</Text>
          <View style={styles.setPill}><Text style={styles.setPillText}>{repsForSet} reps</Text></View>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            onPress={() => {
              if (breakSeconds > 0 && currentSet < session.sets.length) {
                setPhase("break");
                startTimer(breakSeconds);
              } else {
                // last set or no break
                const next = currentSet + 1;
                if (next > session.sets.length) {
                  setPhase("done");
                } else {
                  setCurrentSet(next);
                }
              }
            }}
          >
            <Text style={styles.ctaText}>Complete set</Text>
          </Pressable>
        </View>
      )}

      {phase === "break" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Break</Text>
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
          <Pressable
            style={({ pressed }) => [styles.ctaSecondary, pressed && styles.ctaSecondaryPressed]}
            onPress={() => {
              // skip break
              clearTimer();
              setTimer(0);
              setPhase("working");
              const next = currentSet + 1;
              if (next <= session.sets.length) setCurrentSet(next);
            }}
          >
            <Text style={styles.ctaSecondaryText}>Skip break</Text>
          </Pressable>
        </View>
      )}

      {phase === "done" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session complete</Text>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            onPress={() => router.back()}
          >
            <Text style={styles.ctaText}>Back</Text>
          </Pressable>
        </View>
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
  cardTitle: {
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: theme.spacing.sm,
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
  muted: {
    color: theme.colors.muted,
  },
})
