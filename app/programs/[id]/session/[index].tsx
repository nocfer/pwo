import { ConfettiCelebration, StepCard } from "@/components";
import { useDataActions } from "@/context/DataContext";
import { useExercises, usePrograms } from "@/hooks/data";
import { useWorkoutSteps } from "@/hooks/session/useWorkoutSteps";
import { useWorkoutTimer } from "@/hooks/session/useWorkoutTimer";
import { formatTime } from "@/lib/utils/format";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useRef } from "react";
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
    [programs, id],
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
    actions,
  });

  const listRef = useRef<FlatList<any> | null>(null);
  const currentStepIndex = timer.currentIndex;

  // Auto-scroll to active step
  useMemo(() => {
    try {
      if (!listRef.current) return;
      if (currentStepIndex < 0 || currentStepIndex >= steps.length) return;
      listRef.current.scrollToIndex({
        index: currentStepIndex,
        animated: true,
        viewPosition: 0.5,
      });
    } catch { }
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
              pressed && styles.secondaryBtnPressed,
            ]}
          >
            <Text style={styles.secondaryBtnText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const title = session.name ?? `Session ${session.index}`;

  return (
    <View style={styles.container}>
      <ConfettiCelebration
        show={timer.showConfetti}
        onComplete={() => timer.setShowConfetti(false)}
        message="Session Complete!"
        subMessage="Nice work."
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{program.name}</Text>
              <Text style={styles.subtitle}>
                {title} • {currentStepIndex + 1}/{steps.length}
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.headerClose,
                pressed && styles.headerClosePressed,
              ]}
            >
              <Ionicons name="close" size={18} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Timer / focus card */}
          {timer.phase === "timed" && (
            <View style={styles.focusCard}>
              <Text style={styles.timerHero}>{formatTime(timer.timer)}</Text>
              <Text style={styles.focusLabel}>
                {timer.currentStep?.type === "warmup"
                  ? "Warm-up"
                  : timer.currentStep?.type === "rest"
                    ? (timer.currentStep.label ?? "Rest")
                    : "Timer"}
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
          onScrollToIndexFailed={() => { }}
          renderItem={({ item, index: idx }) => {
            const isDone = idx < currentStepIndex || timer.phase === "done";
            const isActive = idx === currentStepIndex && timer.phase !== "done";
            const isLocked = idx > currentStepIndex || timer.phase === "done";

            if (item.type === "warmup") {
              return (
                <StepCard
                  title="Warm-up"
                  active={isActive}
                  done={isDone}
                  locked={isLocked}
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
                >
                  <Text style={styles.stepMeta}>{item.seconds}s</Text>
                </StepCard>
              );
            }

            // exercise set
            const exName = exerciseNameById.get(item.exerciseId) ?? "Exercise";
            return (
              <StepCard
                title={`${exName} • Set ${item.setIndex}/${item.totalSets}`}
                active={isActive}
                done={isDone}
                locked={isLocked}
              >
                <Text style={styles.stepMeta}>
                  {item.reps != null ? `${item.reps} reps` : "Do your reps"}
                  {item.restSecondsBetweenSets
                    ? ` • rest ${item.restSecondsBetweenSets}s`
                    : ""}
                </Text>
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
                    pressed && styles.buttonPressed,
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
            <View style={styles.secondaryRow}>
              <Pressable
                disabled={timer.phase !== "timed"}
                onPress={timer.handlePauseResume}
                style={({ pressed }) => [
                  styles.secondaryBtnInline,
                  timer.phase !== "timed" && styles.btnDisabled,
                  pressed && styles.secondaryBtnPressedInline,
                ]}
              >
                <Ionicons
                  name={timer.isPaused ? "play" : "pause"}
                  size={20}
                  color={
                    timer.phase !== "timed"
                      ? theme.colors.muted
                      : theme.colors.text
                  }
                />
                <Text
                  style={[
                    styles.secondaryBtnTextInline,
                    timer.phase !== "timed" && styles.textDisabled,
                  ]}
                >
                  {timer.isPaused ? "Resume" : "Pause"}
                </Text>
              </Pressable>

              <Pressable
                onPress={timer.handleSkip}
                style={({ pressed }) => [
                  styles.secondaryBtnInline,
                  pressed && styles.secondaryBtnPressedInline,
                ]}
              >
                <Ionicons
                  name="play-skip-forward"
                  size={20}
                  color={theme.colors.text}
                />
                <Text style={styles.secondaryBtnTextInline}>Skip</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={timer.handleComplete}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
              ]}
            >
              <Ionicons
                name={
                  timer.currentStep?.type === "exercise_set"
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
                    : timer.currentStep?.type === "exercise_set"
                      ? "Complete Set"
                      : "Continue"}
              </Text>
            </Pressable>
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
    gap: theme.spacing.md,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  title: { ...theme.typography.h2, color: theme.colors.text },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
  },
  headerClose: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  headerClosePressed: { backgroundColor: theme.colors.card },
  focusCard: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.text,
  },
  focusLabel: { ...theme.typography.body, color: theme.colors.muted },
  listContent: { paddingHorizontal: theme.spacing.lg, paddingBottom: 220 },
  stepMeta: { ...theme.typography.caption, color: theme.colors.muted },

  doneCard: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.successLight,
    borderColor: theme.colors.success,
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    alignItems: "center",
    ...theme.shadows.md,
  },
  doneTitle: {
    ...theme.typography.h2,
    color: theme.colors.success,
    marginTop: theme.spacing.sm,
  },
  doneSubtitle: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    marginTop: theme.spacing.xs,
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
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

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
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
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
    backgroundColor: theme.colors.card,
  },
  secondaryBtnPressedInline: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.98 }],
  },
  secondaryBtnTextInline: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  },
  btnDisabled: { opacity: 0.5 },
  textDisabled: { color: theme.colors.muted },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  primaryBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  primaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn,
    fontSize: 16,
  },

  secondaryBtn: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryBtnPressed: { backgroundColor: theme.colors.card },
  secondaryBtnText: { ...theme.typography.bodyBold, color: theme.colors.text },
});
