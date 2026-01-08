import { useExercises } from "@/hooks";
import { UseWorkoutTimerReturn, WorkoutStep } from "@/hooks/session";
import { formatTime } from "@/lib/utils";
import { getPhaseInfo } from "@/lib/utils/colors";
import { theme } from "@/theme/theme";
import { Program, ProgramSession } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CurrentExerciseCard, FocusCard } from "../cards";
import { AnimatedCard, AnimatedProgressBar } from "../common";
import { CollapsibleStepsList } from "./CollapsibleStepsList";

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
  const { phaseAccent } = getPhaseInfo(timer.phase, current?.type);

  const { data: exercises } = useExercises();

  const exerciseNameById = useMemo(() => {
    const map = new Map<string, string>();
    (exercises ?? []).forEach((e) => map.set(e.id, e.name));
    return map;
  }, [exercises]);

  const next = steps[currentStepIndex + 1] ?? null;

  const getStepLabel = (step: WorkoutStep | null): string | null => {
    if (!step) return null;
    if (step.type === "warmup") return "Warm-up";
    if (step.type === "rest") return step.label ?? "Rest";
    if (step.type === "exercise")
      return exerciseNameById.get(step.exerciseId) ?? "Exercise";
    return null;
  };

  const currentExerciseName =
    current?.type === "exercise"
      ? (exerciseNameById.get(current.exerciseId) ?? "Exercise")
      : null;
  const nextLabel = getStepLabel(next);

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

  const renderFocusContent = () => {
    // Completed state
    if (timer.phase === "done") {
      return (
        <View style={styles.doneCard}>
          <View style={styles.doneIconContainer}>
            <Ionicons name="checkmark" size={32} color={theme.colors.success} />
          </View>
          <Text style={styles.doneTitle}>Workout Complete!</Text>
          <Text style={styles.doneSubtitle}>
            Great job finishing {program.name}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.doneButton,
              pressed && styles.buttonPressed
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Back to Program</Text>
          </Pressable>
        </View>
      );
    }

    // Timer running
    if (timer.phase === "timed") {
      const isWarmup = current?.type === "warmup";
      const isRest = current?.type === "rest";

      const timerIcon = isWarmup
        ? "flame"
        : isRest
          ? "hourglass-outline"
          : "timer-outline";
      const timerChip = isWarmup
        ? "Warming Up"
        : isRest
          ? "Rest"
          : "In Progress";
      const timerSubtitle = isWarmup
        ? "Prepare your body"
        : isRest
          ? nextLabel
            ? `Next: ${nextLabel}`
            : "Recover"
          : (currentExerciseName ?? "Keep going");
      const timerAccent = isWarmup ? theme.colors.phases.warmup : phaseAccent;

      return (
        <FocusCard
          icon={timerIcon}
          phaseChipText={timerChip}
          title={formatTime(timer.timer)}
          subTitle={timerSubtitle}
          phaseAccent={timerAccent}
          phaseBg={theme.colors.background}
          timerEnabled={true}
          progress={timer.progress}
        />
      );
    }

    // Exercise step
    if (current?.type === "exercise") {
      return (
        <CurrentExerciseCard
          current={current}
          exerciseName={currentExerciseName || undefined}
          phaseAccent={phaseAccent}
          phaseBg={theme.colors.background}
        />
      );
    }

    // Warmup step
    if (current?.type === "warmup") {
      return (
        <CurrentExerciseCard
          current={current}
          phaseAccent={theme.colors.phases.warmup}
          phaseBg={theme.colors.phases.warmupBg}
        />
      );
    }

    // Rest step
    if (current?.type === "rest") {
      const isSetRest = current.restContext === "between-sets";
      const restAccent = isSetRest
        ? theme.colors.muted
        : theme.colors.phases.break;

      return (
        <CurrentExerciseCard
          current={current}
          phaseAccent={restAccent}
          phaseBg={theme.colors.background}
        />
      );
    }

    // Fallback
    return (
      <View style={styles.readyCard}>
        <Text style={styles.readyTitle}>Ready</Text>
        <Text style={styles.readySubtitle}>
          {nextLabel ? `Next: ${nextLabel}` : "Start when ready"}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {program.name}
          </Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerSubtitle}>{title}</Text>
            <View style={styles.headerDot} />
            <Text style={styles.headerProgress}>
              {currentStepIndex + 1} of {steps.length}
            </Text>
          </View>
        </View>

        <View style={styles.sessionTimer}>
          <Ionicons name="time-outline" size={14} color={theme.colors.muted} />
          <Text style={styles.sessionTimerText}>
            {formatTime(timer.sessionElapsedSeconds)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <AnimatedProgressBar
            color={phaseAccent}
            progress={timer.progress}
            height={6}
          />
        </View>
      </View>

      {/* Main content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current exercise/phase card */}
        <View style={styles.focusSection}>
          <AnimatedCard>{renderFocusContent()}</AnimatedCard>
        </View>

        {/* Up next preview */}
        {next && timer.phase !== "done" && (
          <View style={styles.upNextSection}>
            <Text style={styles.upNextTitle}>Up Next</Text>
            <View style={styles.upNextCard}>
              <Ionicons
                name={
                  next.type === "exercise"
                    ? "barbell-outline"
                    : next.type === "warmup"
                      ? "flame"
                      : "hourglass-outline"
                }
                size={20}
                color={phaseAccent}
              />
              <View style={styles.upNextContent}>
                <Text style={styles.upNextExercise}>{getStepLabel(next)}</Text>
                {next.type === "exercise" && (
                  <Text style={styles.upNextMeta}>
                    {next.targetReps && `${next.targetReps} reps`}
                    {next.targetReps && next.durationSeconds && " • "}
                    {next.durationSeconds && `${next.durationSeconds}s`}
                  </Text>
                )}
                {next.type === "rest" && (
                  <Text style={styles.upNextMeta}>{next.seconds}s rest</Text>
                )}
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.muted}
              />
            </View>
          </View>
        )}

        {/* Collapsible steps list */}
        <CollapsibleStepsList
          steps={steps}
          currentStepIndex={currentStepIndex}
          exerciseNameById={exerciseNameById}
          phase={timer.phase}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md
  },
  backButtonPressed: {
    backgroundColor: theme.colors.background
  },
  headerContent: {
    flex: 1,
    marginLeft: theme.spacing.xs
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  headerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.muted,
    marginHorizontal: theme.spacing.xs
  },
  headerProgress: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  sessionTimer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md
  },
  sessionTimerText: {
    ...theme.typography.captionBold,
    color: theme.colors.text,
    fontVariant: ["tabular-nums"]
  },
  // Scroll view
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: 200
  },
  // Focus section
  focusSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg
  },
  // Up next section
  upNextSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg
  },
  upNextTitle: {
    ...theme.typography.captionBold,
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm
  },
  upNextCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm
  },
  upNextContent: {
    flex: 1
  },
  upNextExercise: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  upNextMeta: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  // Done card
  doneCard: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: "center",
    ...theme.shadows.md
  },
  doneIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.successLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md
  },
  doneTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  doneSubtitle: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    textAlign: "center",
    marginBottom: theme.spacing.lg
  },
  doneButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md
  },
  doneButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  // Ready card
  readyCard: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: "center",
    ...theme.shadows.sm
  },
  readyTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  readySubtitle: {
    ...theme.typography.body,
    color: theme.colors.muted
  },
  // Progress bar
  progressBarContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.full,
    overflow: "hidden"
  }
});
