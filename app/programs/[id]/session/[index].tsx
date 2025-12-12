import { ConfettiCelebration, StepCard } from "@/components";
import { useDataActions } from "@/context/DataContext";
import { useExercises, usePrograms } from "@/hooks/data";
import { useWorkoutSteps } from "@/hooks/session/useWorkoutSteps";
import { useWorkoutTimer } from "@/hooks/session/useWorkoutTimer";
import { formatTime } from "@/lib/utils/format";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProgramSessionRunner() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const index = Number(params.index);

  const actions = useDataActions();
  const { data: programs, loading: programsLoading } = usePrograms();
  const { data: exercises } = useExercises();

  const program = useMemo(
    () => programs?.find((p) => p.id === id) ?? null,
    [programs, id]
  );

  const exerciseNameById = useMemo(() => {
    const map = new Map<string, string>();
    (exercises ?? []).forEach((e) => map.set(e.id, e.name));
    return map;
  }, [exercises]);

  const { session, steps } = useWorkoutSteps(program, index);
  const timer = useWorkoutTimer({
    slug: id,
    program,
    sessionIndex: index,
    steps,
    actions
  });

  const listRef = useRef<FlatList<any> | null>(null);
  const currentStepIndex = timer.currentIndex;

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

  if (programsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.muted}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!program || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.muted}>Session unavailable.</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.secondaryBtnPressed
            ]}
          >
            <Text style={styles.secondaryBtnText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const title = session.name ?? `Session ${session.index}`;
  const current = timer.currentStep;
  const next = steps[currentStepIndex + 1] ?? null;

  const phaseKind =
    timer.phase === "done"
      ? "done"
      : current?.type === "warmup"
        ? "warmup"
        : current?.type === "rest"
          ? "break"
          : "working";
  const phaseBg =
    phaseKind === "warmup"
      ? theme.colors.phases.warmupBg
      : phaseKind === "break"
        ? theme.colors.phases.breakBg
        : phaseKind === "working"
          ? theme.colors.phases.workingBg
          : theme.colors.phases.doneBg;
  const phaseAccent =
    phaseKind === "warmup"
      ? theme.colors.phases.warmup
      : phaseKind === "break"
        ? theme.colors.phases.break
        : phaseKind === "working"
          ? theme.colors.phases.working
          : theme.colors.phases.done;

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

  return (
    <View style={[styles.container, { backgroundColor: phaseBg }]}>
      <ConfettiCelebration
        show={timer.showConfetti}
        onComplete={() => timer.setShowConfetti(false)}
        message="Session Complete!"
        subMessage="Nice work."
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
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
              <Ionicons
                name="chevron-back"
                size={24}
                color={theme.colors.text}
              />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{program.name}</Text>
              <Text style={styles.headerSubtitle}>
                {title} • {currentStepIndex + 1}/{steps.length}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.round(timer.progress * 100)}%`,
                      backgroundColor: phaseAccent
                    }
                  ]}
                />
              </View>
            </View>
          </View>

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
                  backgroundColor: theme.colors.surface
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
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface
                }
              ]}
            >
              <Text style={styles.focusTitle}>Ready</Text>
              <Text style={styles.focusSub}>
                {nextLabel ? `Next: ${nextLabel}` : "Start the next step"}
              </Text>
            </View>
          )}
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
          renderItem={({ item, index: idx }) => {
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
              <Ionicons
                name="lock-closed"
                size={16}
                color={theme.colors.muted}
              />
            ) : isActive ? (
              <View style={styles.nowPill}>
                <Text style={styles.nowPillText}>Now</Text>
              </View>
            ) : undefined;

            if (item.type === "warmup") {
              return (
                <StepCard
                  title="Warm-up"
                  active={isActive}
                  done={isDone}
                  locked={isLocked}
                  right={right}
                >
                  <Text style={styles.stepMeta}>{item.seconds}s</Text>
                </StepCard>
              );
            }

            if (item.type === "rest") {
              return (
                <StepCard
                  title={item.label ? `Rest • ${item.label}` : "Rest"}
                  active={isActive}
                  done={isDone}
                  locked={isLocked}
                  right={right}
                >
                  <Text style={styles.stepMeta}>{item.seconds}s</Text>
                </StepCard>
              );
            }

            // exercise
            const exName = exerciseNameById.get(item.exerciseId) ?? "Exercise";
            return (
              <StepCard
                title={exName}
                active={isActive}
                done={isDone}
                locked={isLocked}
                right={right}
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

      {/* Bottom controls */}
      {timer.phase !== "done" && (
        <SafeAreaView style={styles.footer} edges={["bottom"]}>
          <View style={styles.footerContent}>
            {timer.phase === "timed" ? (
              <View style={styles.secondaryRow}>
                <Pressable
                  onPress={timer.handlePauseResume}
                  style={({ pressed }) => [
                    styles.secondaryBtnInline,
                    pressed && styles.secondaryBtnPressedInline
                  ]}
                >
                  <Ionicons
                    name={timer.isPaused ? "play" : "pause"}
                    size={20}
                    color={theme.colors.text}
                  />
                  <Text style={styles.secondaryBtnTextInline}>
                    {timer.isPaused ? "Resume" : "Pause"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={timer.handleSkip}
                  style={({ pressed }) => [
                    styles.secondaryBtnInline,
                    pressed && styles.secondaryBtnPressedInline
                  ]}
                >
                  <Ionicons
                    name="play-skip-forward"
                    size={20}
                    color={theme.colors.text}
                  />
                  <Text style={styles.secondaryBtnTextInline}>Skip timer</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.secondaryRow}>
                  <Pressable
                    onPress={timer.handleSkip}
                    style={({ pressed }) => [
                      styles.secondaryBtnInline,
                      pressed && styles.secondaryBtnPressedInline
                    ]}
                  >
                    <Ionicons
                      name="play-skip-forward"
                      size={20}
                      color={theme.colors.text}
                    />
                    <Text style={styles.secondaryBtnTextInline}>Skip</Text>
                  </Pressable>
                  <View style={{ flex: 1 }} />
                </View>

                <Pressable
                  onPress={timer.handleComplete}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.primaryBtnPressed
                  ]}
                >
                  <Ionicons
                    name={
                      timer.currentStep?.type === "exercise"
                        ? "checkmark-circle"
                        : "play"
                    }
                    size={24}
                    color={theme.colors.primaryTextOn}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <Text style={styles.primaryBtnText}>
                    {timer.currentStep?.type === "warmup"
                      ? "Start Warm-up"
                      : timer.currentStep?.type === "rest"
                        ? "Start Rest"
                        : timer.currentStep?.type === "exercise"
                          ? timer.currentStep.durationSeconds
                            ? "Start Exercise Timer"
                            : "Complete Exercise"
                          : "Continue"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { ...theme.typography.body, color: theme.colors.muted },
  headerSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md
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
  progressTrack: {
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.card,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: theme.radius.full
  },

  // (kept for potential reuse)
  headerClose: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface
  },
  headerClosePressed: { backgroundColor: theme.colors.card },
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
  },
  phaseChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.card
  },
  phaseChipDot: { width: 8, height: 8, borderRadius: 4 },
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
  stepMeta: { ...theme.typography.caption, color: theme.colors.muted },
  stepNote: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    marginTop: theme.spacing.xs
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
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    ...theme.shadows.lg
  },
  footerContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md
  },
  secondaryRow: { flexDirection: "row", gap: theme.spacing.md },
  secondaryBtnInline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card
  },
  secondaryBtnPressedInline: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.98 }]
  },
  secondaryBtnTextInline: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md
  },
  primaryBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  primaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn,
    fontSize: 16
  },

  secondaryBtn: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  secondaryBtnPressed: { backgroundColor: theme.colors.card },
  secondaryBtnText: { ...theme.typography.bodyBold, color: theme.colors.text }
});
