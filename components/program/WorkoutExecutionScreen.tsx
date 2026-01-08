import { UseWorkoutTimerReturn, WorkoutStep } from "@/hooks/session";
import { formatTime } from "@/lib/utils";
import { theme } from "@/theme/theme";
import { Program, ProgramSession } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Types for tracking actual reps
type SetCompletion = {
  stepKey: string;
  exerciseId: string;
  targetReps: number;
  actualReps: number;
  setNumber: number;
  totalSets: number;
};

type Props = {
  session: ProgramSession;
  timer: UseWorkoutTimerReturn;
  steps: WorkoutStep[];
  program: Program;
  exerciseNameById: Map<string, string>;
  onProgramUpdate?: (updatedProgram: Program) => Promise<void>;
};

export function WorkoutExecutionScreen({
  session,
  timer,
  steps,
  program,
  exerciseNameById,
  onProgramUpdate
}: Props) {
  const title = session.name ?? `Session ${session.index}`;
  const current = timer.currentStep;
  const currentStepIndex = timer.currentIndex;

  // Track completed sets with actual reps
  const [completedSets, setCompletedSets] = useState<SetCompletion[]>([]);
  const [currentReps, setCurrentReps] = useState<number | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [lastCompletion, setLastCompletion] = useState<SetCompletion | null>(null);

  // Initialize current reps when step changes
  useEffect(() => {
    if (current?.type === "exercise" && current.targetReps) {
      setCurrentReps(current.targetReps);
    } else {
      setCurrentReps(null);
    }
  }, [current?.key]);

  const getStepLabel = useCallback(
    (step: WorkoutStep | null): string => {
      if (!step) return "";
      if (step.type === "warmup") return "Warmup";
      if (step.type === "rest") return "Rest";
      if (step.type === "exercise") {
        return exerciseNameById.get(step.exerciseId) ?? "Exercise";
      }
      return "";
    },
    [exerciseNameById]
  );

  // Handle completing a set with actual reps
  const handleCompleteSet = useCallback(() => {
    if (current?.type === "exercise" && currentReps !== null) {
      const completion: SetCompletion = {
        stepKey: current.key,
        exerciseId: current.exerciseId,
        targetReps: current.targetReps ?? 0,
        actualReps: currentReps,
        setNumber: current.setNumber ?? 1,
        totalSets: current.totalSets ?? 1
      };

      setCompletedSets((prev) => [...prev, completion]);

      // Show update prompt if reps differ from target
      if (currentReps !== current.targetReps) {
        setLastCompletion(completion);
        setShowUpdatePrompt(true);
      }
    }

    timer.handleComplete();
  }, [current, currentReps, timer]);

  // Adjust reps
  const adjustReps = useCallback((delta: number) => {
    setCurrentReps((prev) => Math.max(0, (prev ?? 0) + delta));
  }, []);

  // Build workout plan items for display
  const workoutPlanItems = useMemo(() => {
    return steps.map((step, idx) => {
      const isDone = idx < currentStepIndex || timer.phase === "done";
      const isCurrent = idx === currentStepIndex && timer.phase !== "done";
      const label = getStepLabel(step);

      let detail = "";
      if (step.type === "exercise") {
        const setInfo =
          step.totalSets && step.totalSets > 1
            ? `Set ${step.setNumber} of ${step.totalSets}`
            : "";
        const repsInfo = step.targetReps ? `${step.targetReps} reps` : "";
        const durationInfo = step.durationSeconds
          ? `${step.durationSeconds}s`
          : "";
        detail = [setInfo, repsInfo || durationInfo].filter(Boolean).join(" • ");
      } else if (step.type === "warmup") {
        detail = formatTime(step.seconds);
      } else if (step.type === "rest") {
        detail = `${step.seconds}s`;
      }

      // Check if we have actual reps for this step
      const completion = completedSets.find((c) => c.stepKey === step.key);
      if (completion && completion.actualReps !== completion.targetReps) {
        detail = `${completion.actualReps} reps (target: ${completion.targetReps})`;
      }

      return { step, idx, isDone, isCurrent, label, detail };
    });
  }, [steps, currentStepIndex, timer.phase, getStepLabel, completedSets]);

  // Get next step info
  const nextStep = steps[currentStepIndex + 1] ?? null;
  const nextLabel = getStepLabel(nextStep);
  const nextDetail = useMemo(() => {
    if (!nextStep) return "";
    if (nextStep.type === "exercise") {
      const setInfo =
        nextStep.totalSets && nextStep.totalSets > 1
          ? `Set ${nextStep.setNumber} of ${nextStep.totalSets}`
          : "";
      const repsInfo = nextStep.targetReps ? `${nextStep.targetReps} reps` : "";
      return [setInfo, repsInfo].filter(Boolean).join(" • ");
    }
    if (nextStep.type === "rest") {
      return `${nextStep.seconds}s rest`;
    }
    return "";
  }, [nextStep]);

  // Render content based on current state
  const renderContent = () => {
    // Completed state
    if (timer.phase === "done") {
      return renderCompletedState();
    }

    // Timer running (warmup, rest, or timed exercise)
    if (timer.phase === "timed") {
      return renderTimerState();
    }

    // Exercise input state
    if (current?.type === "exercise") {
      return renderExerciseState();
    }

    // Warmup ready state
    if (current?.type === "warmup") {
      return renderWarmupState();
    }

    // Rest ready state
    if (current?.type === "rest") {
      return renderRestReadyState();
    }

    return null;
  };

  const renderCompletedState = () => (
    <View style={styles.completedContainer}>
      <View style={styles.completedIcon}>
        <Ionicons name="checkmark" size={48} color={theme.colors.success} />
      </View>
      <Text style={styles.completedTitle}>Workout Complete!</Text>
      <Text style={styles.completedSubtitle}>
        Great job finishing {program.name}
      </Text>
      <Text style={styles.completedTime}>
        Total time: {formatTime(timer.sessionElapsedSeconds)}
      </Text>
    </View>
  );

  const renderTimerState = () => {
    const isWarmup = current?.type === "warmup";
    const isRest = current?.type === "rest";
    const label = isWarmup ? "Warmup" : isRest ? "Rest" : getStepLabel(current);

    return (
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>{label}</Text>
        <Text style={styles.timerDisplay}>{formatTime(timer.timer)}</Text>
        <Text style={styles.timerSubtitle}>
          {isRest && nextLabel ? `Next: ${nextLabel}` : ""}
          {isWarmup ? "Prepare your body" : ""}
        </Text>
      </View>
    );
  };

  const renderWarmupState = () => (
    <View style={styles.warmupContainer}>
      <View style={styles.warmupIcon}>
        <Ionicons name="flame" size={40} color={theme.colors.phases.warmup} />
      </View>
      <Text style={styles.warmupTitle}>Warmup</Text>
      <Text style={styles.warmupDuration}>
        {current?.type === "warmup" ? formatTime(current.seconds) : ""}
      </Text>
      <Text style={styles.warmupSubtitle}>Prepare your body</Text>
    </View>
  );

  const renderRestReadyState = () => (
    <View style={styles.restContainer}>
      <View style={styles.restIcon}>
        <Ionicons
          name="hourglass-outline"
          size={40}
          color={theme.colors.phases.break}
        />
      </View>
      <Text style={styles.restTitle}>Rest</Text>
      <Text style={styles.restDuration}>
        {current?.type === "rest" ? `${current.seconds}s` : ""}
      </Text>
    </View>
  );

  const renderExerciseState = () => {
    if (current?.type !== "exercise") return null;

    const exerciseName = exerciseNameById.get(current.exerciseId) ?? "Exercise";
    const hasMultipleSets = current.totalSets && current.totalSets > 1;

    return (
      <View style={styles.exerciseContainer}>
        {/* Exercise header */}
        <Text style={styles.exerciseName}>{exerciseName}</Text>
        {hasMultipleSets && (
          <Text style={styles.setInfo}>
            Set {current.setNumber} of {current.totalSets}
          </Text>
        )}

        {/* Rep counter */}
        {current.targetReps && (
          <View style={styles.repCounter}>
            <Text style={styles.repLabel}>Reps</Text>
            <View style={styles.repInputRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.repButton,
                  pressed && styles.repButtonPressed
                ]}
                onPress={() => adjustReps(-1)}
              >
                <Ionicons name="remove" size={28} color={theme.colors.text} />
              </Pressable>

              <TextInput
                style={styles.repInput}
                value={String(currentReps ?? 0)}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num) && num >= 0) {
                    setCurrentReps(num);
                  }
                }}
                keyboardType="number-pad"
                selectTextOnFocus
              />

              <Pressable
                style={({ pressed }) => [
                  styles.repButton,
                  pressed && styles.repButtonPressed
                ]}
                onPress={() => adjustReps(1)}
              >
                <Ionicons name="add" size={28} color={theme.colors.text} />
              </Pressable>
            </View>
            <Text style={styles.targetReps}>
              Target: {current.targetReps} reps
            </Text>
          </View>
        )}

        {/* Duration display */}
        {current.durationSeconds && !current.targetReps && (
          <View style={styles.durationDisplay}>
            <Text style={styles.durationValue}>{current.durationSeconds}s</Text>
            <Text style={styles.durationLabel}>Duration</Text>
          </View>
        )}

        {/* Note */}
        {current.note && (
          <View style={styles.noteContainer}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={theme.colors.muted}
            />
            <Text style={styles.noteText}>{current.note}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {program.name}
          </Text>
          <Text style={styles.headerSubtitle}>{title}</Text>
        </View>

        <View style={styles.headerTimer}>
          <Text style={styles.headerTimerText}>
            {formatTime(timer.sessionElapsedSeconds)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${timer.progress * 100}%` }]}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main content card */}
        <View style={styles.mainCard}>{renderContent()}</View>

        {/* Up Next section */}
        {nextStep && timer.phase !== "done" && (
          <View style={styles.upNextSection}>
            <Text style={styles.sectionLabel}>Up Next</Text>
            <View style={styles.upNextCard}>
              <Ionicons
                name={
                  nextStep.type === "exercise"
                    ? "barbell-outline"
                    : nextStep.type === "warmup"
                      ? "flame-outline"
                      : "time-outline"
                }
                size={20}
                color={theme.colors.muted}
              />
              <View style={styles.upNextContent}>
                <Text style={styles.upNextName}>{nextLabel}</Text>
                {nextDetail && (
                  <Text style={styles.upNextDetail}>{nextDetail}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Workout Plan */}
        {timer.phase !== "done" && (
          <View style={styles.planSection}>
            <Text style={styles.sectionLabel}>Workout</Text>
            {workoutPlanItems.slice(0, 8).map((item) => (
              <View
                key={item.step.key}
                style={[
                  styles.planItem,
                  item.isCurrent && styles.planItemCurrent
                ]}
              >
                {/* Status indicator */}
                <View style={styles.planItemStatus}>
                  {item.isDone ? (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={theme.colors.success}
                    />
                  ) : item.isCurrent ? (
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={theme.colors.primary}
                    />
                  ) : (
                    <View style={styles.planItemDot} />
                  )}
                </View>

                {/* Content */}
                <View style={styles.planItemContent}>
                  <Text
                    style={[
                      styles.planItemLabel,
                      item.isDone && styles.planItemLabelDone,
                      item.isCurrent && styles.planItemLabelCurrent
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.detail && (
                    <Text style={styles.planItemDetail}>{item.detail}</Text>
                  )}
                </View>
              </View>
            ))}
            {workoutPlanItems.length > 8 && (
              <Text style={styles.moreItems}>
                +{workoutPlanItems.length - 8} more
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer actions */}
      <SafeAreaView style={styles.footer} edges={["bottom"]}>
        <View style={styles.footerContent}>
          {timer.phase === "done" ? (
            // Completed state - show Done button
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                styles.primaryButtonFull,
                pressed && styles.primaryButtonPressed
              ]}
              onPress={() => router.back()}
            >
              <Ionicons
                name="checkmark"
                size={22}
                color={theme.colors.primaryTextOn}
              />
              <Text style={styles.primaryButtonText}>Done</Text>
            </Pressable>
          ) : timer.phase === "timed" ? (
            // Timer running - skip on left, pause/resume on right
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.skipTextButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={timer.handleSkip}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.primaryButtonFlex,
                  pressed && styles.primaryButtonPressed
                ]}
                onPress={timer.handlePauseResume}
              >
                <Ionicons
                  name={timer.isPaused ? "play" : "pause"}
                  size={24}
                  color={theme.colors.primaryTextOn}
                />
                <Text style={styles.primaryButtonText}>
                  {timer.isPaused ? "Resume" : "Pause"}
                </Text>
              </Pressable>
            </>
          ) : (
            // Ready state - skip on left, main action on right
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.skipTextButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={timer.handleSkip}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.primaryButtonFlex,
                  pressed && styles.primaryButtonPressed
                ]}
                onPress={
                  current?.type === "exercise" ? handleCompleteSet : timer.handleComplete
                }
              >
                <Ionicons
                  name={
                    current?.type === "exercise" && !current.durationSeconds
                      ? "checkmark"
                      : "play"
                  }
                  size={22}
                  color={theme.colors.primaryTextOn}
                />
                <Text style={styles.primaryButtonText}>
                  {current?.type === "warmup"
                    ? "Start Warmup"
                    : current?.type === "rest"
                      ? "Start Rest"
                      : current?.type === "exercise"
                        ? current.durationSeconds
                          ? "Start Timer"
                          : "Complete Set"
                        : "Continue"}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>

      {/* Update prompt modal */}
      {showUpdatePrompt && lastCompletion && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Program?</Text>
            <Text style={styles.modalText}>
              You did {lastCompletion.actualReps} reps instead of{" "}
              {lastCompletion.targetReps}.
            </Text>
            <Text style={styles.modalSubtext}>
              Would you like to update this program to use{" "}
              {lastCompletion.actualReps} reps for future workouts?
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButtonSecondary,
                  pressed && styles.buttonPressed
                ]}
                onPress={() => setShowUpdatePrompt(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Keep Original</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButtonPrimary,
                  pressed && styles.buttonPressed
                ]}
                onPress={async () => {
                  if (!lastCompletion || !onProgramUpdate) {
                    setShowUpdatePrompt(false);
                    return;
                  }

                  // Find the block that needs updating
                  const blockIndex = program.blocks.findIndex(
                    (block) =>
                      block.type === "exercise" &&
                      block.exerciseId === lastCompletion.exerciseId &&
                      block.targetReps === lastCompletion.targetReps
                  );

                  if (blockIndex === -1) {
                    setShowUpdatePrompt(false);
                    return;
                  }

                  // Create updated program with new reps
                  const updatedBlocks = [...program.blocks];
                  const block = updatedBlocks[blockIndex];
                  if (block.type === "exercise") {
                    updatedBlocks[blockIndex] = {
                      ...block,
                      targetReps: lastCompletion.actualReps
                    };
                  }

                  const updatedProgram: Program = {
                    ...program,
                    blocks: updatedBlocks,
                    updatedAt: new Date().toISOString()
                  };

                  try {
                    await onProgramUpdate(updatedProgram);
                    setShowUpdatePrompt(false);
                  } catch (error) {
                    console.error("Failed to update program:", error);
                  }
                }}
              >
                <Text style={styles.modalButtonPrimaryText}>Update</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
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
    backgroundColor: theme.colors.surface
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md
  },
  headerCenter: {
    flex: 1,
    alignItems: "center"
  },
  headerTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: 2
  },
  headerTimer: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm
  },
  headerTimerText: {
    ...theme.typography.captionBold,
    color: theme.colors.text,
    fontVariant: ["tabular-nums"]
  },

  // Progress bar
  progressBar: {
    height: 3,
    backgroundColor: theme.colors.border
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary
  },

  // Scroll
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 160
  },

  // Main card
  mainCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md
  },

  // Completed state
  completedContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl
  },
  completedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.successLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg
  },
  completedTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  completedSubtitle: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    marginBottom: theme.spacing.sm
  },
  completedTime: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xl
  },
  doneButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxl,
    borderRadius: theme.radius.lg
  },
  doneButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },

  // Timer state
  timerContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg
  },
  timerLabel: {
    ...theme.typography.captionBold,
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: theme.spacing.md
  },
  timerDisplay: {
    fontSize: 72,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
    letterSpacing: -2
  },
  timerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
    marginTop: theme.spacing.sm
  },
  timerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xl,
    marginTop: theme.spacing.xl
  },
  timerButton: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center"
  },

  // Warmup state
  warmupContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg
  },
  warmupIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.phases.warmupBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md
  },
  warmupTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  warmupDuration: {
    fontSize: 48,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  warmupSubtitle: {
    ...theme.typography.body,
    color: theme.colors.muted
  },

  // Rest state
  restContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg
  },
  restIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.phases.breakBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md
  },
  restTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  restDuration: {
    fontSize: 48,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },

  // Exercise state
  exerciseContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.md
  },
  exerciseName: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.xs
  },
  setInfo: {
    ...theme.typography.body,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xl
  },
  repCounter: {
    alignItems: "center",
    marginBottom: theme.spacing.lg
  },
  repLabel: {
    ...theme.typography.captionBold,
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: theme.spacing.md
  },
  repInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.lg
  },
  repButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  repButtonPressed: {
    backgroundColor: theme.colors.border
  },
  repInput: {
    fontSize: 56,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    textAlign: "center",
    minWidth: 100,
    fontVariant: ["tabular-nums"]
  },
  targetReps: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.md
  },
  durationDisplay: {
    alignItems: "center"
  },
  durationValue: {
    fontSize: 48,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text
  },
  durationLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    maxWidth: "100%"
  },
  noteText: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    flex: 1
  },

  // Up Next section
  upNextSection: {
    marginBottom: theme.spacing.lg
  },
  sectionLabel: {
    ...theme.typography.small,
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
  upNextName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  upNextDetail: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: 2
  },

  // Plan section
  planSection: {
    marginBottom: theme.spacing.lg
  },
  planItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    marginBottom: 2
  },
  planItemCurrent: {
    backgroundColor: theme.colors.primaryLight
  },
  planItemStatus: {
    width: 24,
    alignItems: "center",
    paddingTop: 2
  },
  planItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.border
  },
  planItemContent: {
    flex: 1
  },
  planItemLabel: {
    ...theme.typography.body,
    color: theme.colors.text
  },
  planItemLabelDone: {
    color: theme.colors.success,
    textDecorationLine: "line-through"
  },
  planItemLabelCurrent: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  },
  planItemDetail: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: 2
  },
  moreItems: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textAlign: "center",
    marginTop: theme.spacing.sm
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm
  },
  skipTextButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    height: 52,
    justifyContent: "center"
  },
  skipText: {
    ...theme.typography.body,
    color: theme.colors.muted
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    height: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg
  },
  primaryButtonFull: {
    flex: 1
  },
  primaryButtonFlex: {
    flex: 1
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  primaryButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },

  // Modal
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    width: "100%",
    maxWidth: 340
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.md
  },
  modalText: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.xs
  },
  modalSubtext: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textAlign: "center",
    marginBottom: theme.spacing.xl
  },
  modalButtons: {
    flexDirection: "row",
    gap: theme.spacing.md
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center"
  },
  modalButtonSecondaryText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: "center"
  },
  modalButtonPrimaryText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },

  buttonPressed: {
    opacity: 0.7
  }
});

export default WorkoutExecutionScreen;
