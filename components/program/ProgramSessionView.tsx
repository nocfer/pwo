import { useExercises } from "@/hooks";
import { UseWorkoutTimerReturn, WorkoutStep } from "@/hooks/session";
import { formatDuration, formatTime } from "@/lib/utils";
import { getPhaseInfo } from "@/lib/utils/colors";
import { theme } from "@/theme/theme";
import { Program, ProgramSession } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FocusCard, StepCard } from "../cards";
import { AnimatedCard, AnimatedProgressBar } from "../common";

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

  const listRef = useRef<FlatList<WorkoutStep> | null>(null);

  // Auto-scroll to active step
  useEffect(() => {
    try {
      if (!listRef.current) return;
      if (currentStepIndex < 0 || currentStepIndex >= steps.length) return;
      listRef.current.scrollToIndex({
        index: currentStepIndex,
        animated: true,
        viewPosition: 0.3
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
          phaseBg={phaseBg}
          timerEnabled={true}
        />
      );
    }

    // Exercise step
    if (current?.type === "exercise") {
      const hasMultipleSets =
        current.totalSets != null && current.totalSets > 1;
      const chipText = hasMultipleSets
        ? `Set ${current.setNumber} of ${current.totalSets}`
        : "Exercise";

      return (
        <FocusCard
          icon="barbell-outline"
          phaseChipText={chipText}
          title={currentExerciseName || "Exercise"}
          subTitle="Ready when you are"
          phaseAccent={phaseAccent}
          phaseBg={phaseBg}
          current={current}
        />
      );
    }

    // Warmup step
    if (current?.type === "warmup") {
      const warmupLabel =
        current.seconds >= 60
          ? formatDuration(current.seconds, "long")
          : `${current.seconds} seconds`;

      return (
        <FocusCard
          title={`Warmup`}
          phaseAccent={theme.colors.phases.warmup}
          phaseBg={theme.colors.phases.warmupBg}
          subTitle={warmupLabel}
          phaseChipText="Get Ready"
          icon="flame"
        />
      );
    }

    // Rest step
    if (current?.type === "rest") {
      const isSetRest = current.restContext === "between-sets";
      const restChip = isSetRest ? "Set Rest" : "Exercise Rest";
      const restAccent = isSetRest
        ? theme.colors.muted
        : theme.colors.phases.break;

      return (
        <FocusCard
          icon="hourglass-outline"
          phaseChipText={restChip}
          title={`${current.seconds}s Rest`}
          subTitle={nextLabel ? `Next: ${nextLabel}` : "Recover"}
          phaseAccent={restAccent}
          phaseBg={phaseBg}
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

  const renderStepItem = ({
    item,
    index: idx
  }: {
    item: WorkoutStep;
    index: number;
  }) => {
    const isDone = idx < currentStepIndex || timer.phase === "done";
    const isActive = idx === currentStepIndex && timer.phase !== "done";
    const isLocked = idx > currentStepIndex;

    // Status indicator
    const rightElement = isDone ? (
      <View style={styles.statusDone}>
        <Ionicons name="checkmark" size={14} color={theme.colors.success} />
      </View>
    ) : isActive ? (
      <View style={[styles.statusActive, { backgroundColor: phaseAccent }]}>
        <Text style={styles.statusActiveText}>NOW</Text>
      </View>
    ) : (
      <Text style={styles.stepNumber}>{idx + 1}</Text>
    );

    // Warmup step
    if (item.type === "warmup") {
      const warmupDuration =
        item.seconds >= 60
          ? formatDuration(item.seconds, "short")
          : `${item.seconds}s`;

      return (
        <StepCard
          title="Warmup"
          phaseAccent={theme.colors.phases.warmup}
          phaseBg={theme.colors.phases.warmupBg}
          active={isActive}
          done={isDone}
          locked={isLocked}
          right={rightElement}
          delayMultiplier={idx}
        >
          <View style={styles.stepMetaRow}>
            <Ionicons
              name="flame"
              size={12}
              color={theme.colors.phases.warmup}
            />
            <Text
              style={[styles.stepMeta, { color: theme.colors.phases.warmup }]}
            >
              {warmupDuration}
            </Text>
          </View>
        </StepCard>
      );
    }

    // Rest step
    if (item.type === "rest") {
      const isSetRest = item.restContext === "between-sets";
      const restColor = isSetRest
        ? theme.colors.muted
        : theme.colors.phases.break;

      return (
        <StepCard
          title={isSetRest ? "Rest" : "Rest"}
          phaseAccent={restColor}
          phaseBg={
            isSetRest ? theme.colors.background : theme.colors.phases.breakBg
          }
          active={isActive}
          done={isDone}
          locked={isLocked}
          right={rightElement}
          delayMultiplier={idx}
          style={isSetRest ? styles.setRestCard : undefined}
        >
          <View style={styles.stepMetaRow}>
            <Ionicons name="time-outline" size={12} color={restColor} />
            <Text style={[styles.stepMeta, { color: restColor }]}>
              {item.seconds}s
              {isSetRest ? " • between sets" : " • between exercises"}
            </Text>
          </View>
        </StepCard>
      );
    }

    // Exercise step
    const exName = exerciseNameById.get(item.exerciseId) ?? "Exercise";
    const hasMultipleSets = item.totalSets != null && item.totalSets > 1;

    return (
      <StepCard
        phaseAccent={phaseAccent}
        phaseBg={phaseBg}
        title={exName}
        active={isActive}
        done={isDone}
        locked={isLocked}
        right={rightElement}
        delayMultiplier={idx}
      >
        <View style={styles.exerciseMetaRow}>
          {hasMultipleSets && (
            <View style={styles.setChip}>
              <Text style={styles.setChipText}>
                Set {item.setNumber}/{item.totalSets}
              </Text>
            </View>
          )}
          <Text style={styles.stepMeta}>
            {item.targetReps != null && `${item.targetReps} reps`}
            {item.targetReps != null && item.durationSeconds != null && " • "}
            {item.durationSeconds != null && `${item.durationSeconds}s`}
            {!item.targetReps && !item.durationSeconds && "Complete exercise"}
          </Text>
        </View>
        {item.note && (
          <Text style={styles.stepNote} numberOfLines={1}>
            {item.note}
          </Text>
        )}
      </StepCard>
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
      <AnimatedProgressBar color={phaseAccent} progress={timer.progress} />

      {/* Focus card */}
      <View style={styles.focusSection}>
        <AnimatedCard>{renderFocusContent()}</AnimatedCard>
      </View>

      {/* Steps list */}
      <View style={styles.stepsSection}>
        <Text style={styles.stepsTitle}>Workout Steps</Text>
        <FlatList
          ref={listRef}
          data={steps}
          keyExtractor={(item) => item.key}
          ItemSeparatorComponent={() => <View style={styles.stepSeparator} />}
          contentContainerStyle={styles.listContent}
          onScrollToIndexFailed={() => {}}
          renderItem={renderStepItem}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
  // Focus section
  focusSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md
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
  // Steps section
  stepsSection: {
    flex: 1,
    marginTop: theme.spacing.lg
  },
  stepsTitle: {
    ...theme.typography.captionBold,
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 180
  },
  stepSeparator: {
    height: theme.spacing.xs
  },
  // Step items
  stepMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs
  },
  exerciseMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flexWrap: "wrap"
  },
  stepMeta: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  stepNote: {
    ...theme.typography.small,
    color: theme.colors.subtext,
    marginTop: theme.spacing.xs,
    fontStyle: "italic"
  },
  setChip: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.xs
  },
  setChipText: {
    ...theme.typography.small,
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  setRestCard: {
    marginLeft: theme.spacing.lg,
    opacity: 0.85
  },
  // Status indicators
  statusDone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.successLight,
    alignItems: "center",
    justifyContent: "center"
  },
  statusActive: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.xs
  },
  statusActiveText: {
    ...theme.typography.small,
    color: theme.colors.primaryTextOn,
    fontFamily: theme.fonts.bold,
    letterSpacing: 0.5
  },
  stepNumber: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium
  }
});
