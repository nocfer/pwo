import { useExercises } from "@/hooks";
import { UseWorkoutTimerReturn, WorkoutStep } from "@/hooks/session";
import { formatTime } from "@/lib/utils";
import { getPhaseInfo } from "@/lib/utils/colors";
import { theme } from "@/theme/theme";
import { Program, ProgramSession } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedCard, AnimatedProgressBar } from "../common";
import { StepCard } from "../session";

type Props = {
  session: ProgramSession;
  timer: UseWorkoutTimerReturn;
  steps: WorkoutStep[];
  program: Program;
};

export default function ProgramSessionView({
  session,
  timer,
  steps,
  program
}: Props) {
  const title = session.name ?? `Session ${session.index}`;
  const current = timer.currentStep;
  const currentStepIndex = timer.currentIndex;
  const { phaseAccent, phaseBg } = getPhaseInfo(timer.phase, current?.type);

  const { data: exercises } = useExercises();

  const exerciseNameById = useMemo(() => {
    const map = new Map<string, string>();
    (exercises ?? []).forEach((e) => map.set(e.id, e.name));
    return map;
  }, [exercises]);

  const next = steps[currentStepIndex + 1] ?? null;

  const currentExerciseName =
    current && current.type === "exercise"
      ? (exerciseNameById.get(current.exerciseId) ?? "Exercise")
      : null;
  const nextLabel =
    next?.type === "warmup"
      ? "Warm-up"
      : next?.type === "rest"
        ? (next.label ?? "Rest")
        : next?.type === "exercise"
          ? (exerciseNameById.get(next.exerciseId) ?? "Exercise")
          : null;

  const listRef = useRef<FlatList<any> | null>(null);

  // Auto-scroll to active step
  useEffect(() => {
    try {
      if (!listRef.current) return;
      if (currentStepIndex < 0 || currentStepIndex >= steps.length) return;
      listRef.current.scrollToIndex({
        index: currentStepIndex,
        animated: true,
        viewPosition: 0.5
      });
    } catch {}
  }, [currentStepIndex, steps.length]);

  // Auto-start timer for rest steps
  useEffect(() => {
    if (
      timer.currentStep?.type === "rest" &&
      timer.phase !== "timed" &&
      timer.phase !== "done"
    ) {
      timer.handleComplete();
    }
  }, [timer, timer.currentStep?.key, timer.phase]);

  return (
    <SafeAreaView
      style={{ flex: 1, borderBottomRightRadius: theme.radius.xl }}
      edges={["top"]}
    >
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [
              styles.headerBack,
              pressed && styles.headerBackPressed
            ]}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{program.name}</Text>
            <Text style={styles.headerSubtitle}>
              {title} • {currentStepIndex + 1}/{steps.length}
            </Text>
          </View>
        </View>
        <AnimatedCard>
          {/* Progress bar */}
          <AnimatedProgressBar
            color={phaseAccent}
            progress={timer.progress}
          ></AnimatedProgressBar>
          {/* Focus card - action-oriented */}
          {timer.phase === "done" ? (
            <View style={[styles.focusCard, styles.focusCardComplete]}>
              <View style={styles.focusIconContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={32}
                  color={theme.colors.success}
                />
              </View>
              <Text style={styles.focusTitle}>Session Complete</Text>
              <Text style={styles.focusSub}>
                {"Great work! You've finished all exercises."}
              </Text>
            </View>
          ) : timer.phase === "timed" ? (
            <View
              style={[
                styles.focusCard,
                {
                  borderColor: phaseAccent,
                  backgroundColor: phaseBg
                }
              ]}
            >
              <View style={styles.focusTopRow}>
                <View
                  style={[
                    styles.focusIconSmall,
                    { backgroundColor: phaseAccent + "20" }
                  ]}
                >
                  <Ionicons
                    name={
                      current?.type === "warmup"
                        ? "flame"
                        : current?.type === "rest"
                          ? "pause-circle"
                          : "time"
                    }
                    size={20}
                    color={phaseAccent}
                  />
                </View>
                <Text style={[styles.phaseChipText, { color: phaseAccent }]}>
                  {current?.type === "warmup"
                    ? "Warming up"
                    : current?.type === "rest"
                      ? "Resting"
                      : "Timer running"}
                </Text>
              </View>
              <Text style={[styles.timerHero, { color: phaseAccent }]}>
                {formatTime(timer.timer)}
              </Text>
              <Text style={styles.focusLabel}>
                {current?.type === "warmup"
                  ? "Get ready for your workout"
                  : current?.type === "rest"
                    ? `Rest before ${nextLabel ?? "next exercise"}`
                    : current?.type === "exercise"
                      ? `Complete ${currentExerciseName ?? "exercise"}`
                      : "Continue"}
              </Text>
            </View>
          ) : current?.type === "exercise" ? (
            <View
              style={[
                styles.focusCard,
                {
                  borderColor: phaseAccent,
                  backgroundColor: phaseBg
                }
              ]}
            >
              <View style={styles.focusTopRow}>
                <View
                  style={[
                    styles.focusIconSmall,
                    { backgroundColor: phaseAccent + "15" }
                  ]}
                >
                  <Ionicons name="barbell" size={20} color={phaseAccent} />
                </View>
                <Text style={[styles.phaseChipText, { color: phaseAccent }]}>
                  Current Exercise
                </Text>
              </View>
              <Text style={styles.focusTitle}>{currentExerciseName}</Text>
              <View style={styles.focusMetrics}>
                {current.targetReps != null && (
                  <View style={styles.focusMetric}>
                    <Ionicons
                      name="repeat"
                      size={16}
                      color={theme.colors.muted}
                    />
                    <Text style={styles.focusMetricText}>
                      {current.targetReps} reps
                    </Text>
                  </View>
                )}
                {current.durationSeconds != null && (
                  <View style={styles.focusMetric}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={theme.colors.muted}
                    />
                    <Text style={styles.focusMetricText}>
                      {current.durationSeconds}s
                    </Text>
                  </View>
                )}
              </View>
              {current.note && (
                <View style={styles.focusNoteContainer}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={theme.colors.subtext}
                  />
                  <Text style={styles.focusNote}>{current.note}</Text>
                </View>
              )}
            </View>
          ) : current?.type === "warmup" ? (
            <View
              style={[
                styles.focusCard,
                {
                  borderColor: phaseAccent,
                  backgroundColor: phaseBg
                }
              ]}
            >
              <View style={styles.focusTopRow}>
                <View
                  style={[
                    styles.focusIconSmall,
                    { backgroundColor: phaseAccent + "20" }
                  ]}
                >
                  <Ionicons name="flame" size={20} color={phaseAccent} />
                </View>
                <Text style={[styles.phaseChipText, { color: phaseAccent }]}>
                  Ready to start
                </Text>
              </View>
              <Text style={styles.focusTitle}>Warm-up</Text>
              <Text style={styles.focusSub}>
                {current.seconds} seconds • Tap to begin
              </Text>
            </View>
          ) : current?.type === "rest" ? (
            <View
              style={[
                styles.focusCard,
                {
                  borderColor: phaseAccent,
                  backgroundColor: phaseBg
                }
              ]}
            >
              <View style={styles.focusTopRow}>
                <View
                  style={[
                    styles.focusIconSmall,
                    { backgroundColor: phaseAccent + "20" }
                  ]}
                >
                  <Ionicons name="pause-circle" size={20} color={phaseAccent} />
                </View>
                <Text style={[styles.phaseChipText, { color: phaseAccent }]}>
                  Rest period
                </Text>
              </View>
              <Text style={styles.focusTitle}>
                {current.label ? current.label : "Rest"}
              </Text>
              <Text style={styles.focusSub}>
                {current.seconds} seconds • Tap to start timer
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.focusCard,
                {
                  borderColor: phaseAccent,
                  backgroundColor: phaseBg
                }
              ]}
            >
              <Text style={styles.focusTitle}>Ready</Text>
              <Text style={styles.focusSub}>
                {nextLabel ? `Next: ${nextLabel}` : "Start the next step"}
              </Text>
            </View>
          )}
        </AnimatedCard>
      </View>

      <FlatList
        ref={listRef}
        data={steps}
        keyExtractor={(item) => item.key}
        ItemSeparatorComponent={() => (
          <View style={{ height: theme.spacing.sm }} />
        )}
        contentContainerStyle={styles.listContent}
        onScrollToIndexFailed={() => {}}
        renderItem={({
          item,
          index: idx
        }: {
          item: WorkoutStep;
          index: number;
        }) => {
          const isDone = idx < currentStepIndex || timer.phase === "done";
          const isActive = idx === currentStepIndex && timer.phase !== "done";
          const isLocked = idx > currentStepIndex || timer.phase === "done";
          const right = isDone ? (
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={theme.colors.success}
            />
          ) : isLocked ? (
            <Ionicons name="lock-closed" size={16} color={theme.colors.muted} />
          ) : isActive ? (
            <View
              style={{
                ...styles.nowPill,
                backgroundColor: phaseAccent
              }}
            >
              <Text style={styles.nowPillText}>Now</Text>
            </View>
          ) : undefined;

          if (item.type === "warmup") {
            return (
              <StepCard
                title="Warm-up"
                stepType={item.type}
                active={isActive}
                done={isDone}
                locked={isLocked}
                right={right}
                delayMultiplier={idx}
              >
                <Text style={styles.stepMeta}>{item.seconds}s</Text>
              </StepCard>
            );
          }

          if (item.type === "rest") {
            return (
              <StepCard
                title={item.label ? `Rest • ${item.label}` : "Rest"}
                stepType={item.type}
                active={isActive}
                done={isDone}
                locked={isLocked}
                right={right}
                delayMultiplier={idx}
              >
                <Text style={styles.stepMeta}>{item.seconds}s</Text>
              </StepCard>
            );
          }

          // exercise
          const exName = exerciseNameById.get(item.exerciseId) ?? "Exercise";
          return (
            <StepCard
              stepType={item.type}
              title={exName}
              active={isActive}
              done={isDone}
              locked={isLocked}
              right={right}
              delayMultiplier={idx}
            >
              <Text style={styles.stepMeta}>
                {item.targetReps != null
                  ? `${item.targetReps} reps`
                  : "No target reps"}
                {item.durationSeconds != null
                  ? ` • ${item.durationSeconds}s`
                  : ""}
              </Text>
              {item.note ? (
                <Text style={styles.stepNote}>{item.note}</Text>
              ) : null}
            </StepCard>
          );
        }}
        ListFooterComponent={
          timer.phase === "done" ? (
            <View style={styles.doneCard}>
              <Ionicons
                name="checkmark-circle"
                size={48}
                color={theme.colors.success}
              />
              <Text style={styles.doneTitle}>All done</Text>
              <Text style={styles.doneSubtitle}>Back to program</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.doneButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={() => router.back()}
              >
                <Ionicons
                  name="arrow-back"
                  size={18}
                  color={theme.colors.primaryTextOn}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text style={styles.doneButtonText}>Back</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md
  },
  headerBack: {
    padding: theme.spacing.xs,
    marginTop: -theme.spacing.xs,
    marginLeft: -theme.spacing.xs
  },
  headerBackPressed: { opacity: 0.6 },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm
  },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  focusLabel: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    textAlign: "center"
  },
  focusTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: "center"
  },
  focusSub: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center"
  },
  focusMetrics: {
    flexDirection: "row",
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    justifyContent: "center"
  },
  focusMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs
  },
  focusMetricText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold
  },
  focusNoteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  phaseChipText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  timerHero: {
    fontSize: 64,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginBottom: theme.spacing.sm,
    textAlign: "center"
  },
  focusNote: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    flex: 1,
    lineHeight: 18
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 220
  },
  nowPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.primary
  },
  nowPillText: {
    ...theme.typography.caption,
    color: theme.colors.primaryTextOn,
    fontFamily: theme.fonts.semiBold
  },
  stepMeta: { ...theme.typography.caption, color: theme.colors.muted },
  doneCard: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.successLight,
    borderColor: theme.colors.success,
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    alignItems: "center",
    ...theme.shadows.md
  },
  doneTitle: {
    ...theme.typography.h2,
    color: theme.colors.success,
    marginTop: theme.spacing.sm
  },
  doneSubtitle: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.success,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    ...theme.shadows.md
  },
  doneButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  stepNote: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    marginTop: theme.spacing.xs
  },
  focusCard: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.md
  },
  focusCardComplete: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successLight,
    alignItems: "center"
  },
  focusTopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md
  },
  focusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm
  },
  focusIconSmall: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center"
  }
});
