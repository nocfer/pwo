import {
  UseStepCompletionReturn,
  UseWorkoutTimerReturn,
  WorkoutStep
} from "@/hooks/session";
import { formatTime } from "@/lib/utils";
import { theme } from "@/theme/theme";
import { Program, ProgramSession } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WorkoutMatrix } from "./WorkoutMatrix";

// Types for tracking actual reps
type SetCompletion = {
  stepKey: string;
  exerciseId: string;
  targetReps: number;
  actualReps: number;
  setNumber: number;
  totalSets: number;
  /** Index of the block in the session (for per-set updates) */
  blockIndex?: number;
};

type Props = {
  session: ProgramSession;
  timer: UseWorkoutTimerReturn;
  steps: WorkoutStep[];
  program: Program;
  exerciseNameById: Map<string, string>;
  stepCompletion: UseStepCompletionReturn;
  onProgramUpdate?: (updatedProgram: Program) => Promise<void>;
};

export function WorkoutExecutionScreen({
  session,
  timer,
  steps,
  program,
  exerciseNameById,
  stepCompletion,
  onProgramUpdate
}: Props) {
  const title = session.name ?? `Session ${session.index}`;
  const current = timer.currentStep;
  const currentStepIndex = timer.currentIndex;

  // Step completion tracking for free navigation
  const { getStepStatus, getCompletionCount, markCompleted, markSkipped } =
    stepCompletion;

  // Track completed sets with actual reps
  const [, setCompletedSets] = useState<SetCompletion[]>([]);
  const [currentReps, setCurrentReps] = useState<number | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [lastCompletion, setLastCompletion] = useState<SetCompletion | null>(
    null
  );

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate on mount and step change
  useEffect(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  }, [current?.key, fadeAnim, scaleAnim]);

  // Pulse animation for timer
  useEffect(() => {
    if (timer.phase === "timed" && !timer.isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [timer.phase, timer.isPaused, pulseAnim]);

  // Initialize current reps when step changes
  const currentTargetReps =
    current?.type === "exercise" ? current.targetReps : undefined;
  useEffect(() => {
    if (current?.type === "exercise" && currentTargetReps) {
      setCurrentReps(currentTargetReps);
    } else {
      setCurrentReps(null);
    }
  }, [current?.key, current?.type, currentTargetReps]);

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

  // Get phase color based on current step
  const getPhaseColor = useCallback(() => {
    if (timer.phase === "done") return theme.colors.phases.done;
    if (current?.type === "warmup") return theme.colors.phases.warmup;
    if (current?.type === "rest") return theme.colors.phases.break;
    return theme.colors.phases.working;
  }, [timer.phase, current?.type]);

  const getPhaseBgColor = useCallback(() => {
    if (timer.phase === "done") return theme.colors.phases.doneBg;
    if (current?.type === "warmup") return theme.colors.phases.warmupBg;
    if (current?.type === "rest") return theme.colors.phases.breakBg;
    return theme.colors.phases.workingBg;
  }, [timer.phase, current?.type]);

  // Handle completing a set with actual reps
  const handleCompleteSet = useCallback(() => {
    if (current?.type === "exercise" && currentReps !== null) {
      const completion: SetCompletion = {
        stepKey: current.key,
        exerciseId: current.exerciseId,
        targetReps: current.targetReps ?? 0,
        actualReps: currentReps,
        setNumber: current.setNumber ?? 1,
        totalSets: current.totalSets ?? 1,
        blockIndex: current.blockIndex
      };

      setCompletedSets((prev) => [...prev, completion]);

      // Mark step as completed in tracking
      markCompleted(currentStepIndex, currentReps);

      // Show update prompt if reps differ from target
      if (currentReps !== current.targetReps) {
        setLastCompletion(completion);
        setShowUpdatePrompt(true);
      }
    }

    timer.handleComplete();
  }, [current, currentReps, currentStepIndex, markCompleted, timer]);

  // Adjust reps
  const adjustReps = useCallback((delta: number) => {
    setCurrentReps((prev) => Math.max(0, (prev ?? 0) + delta));
  }, []);

  // Handle skipping a step
  const handleSkip = useCallback(() => {
    markSkipped(currentStepIndex);
    timer.handleSkip();
  }, [currentStepIndex, markSkipped, timer]);

  // Track previous step index for detecting natural advancement
  const prevStepIndexRef = useRef(currentStepIndex);

  // When step index advances by 1 (natural completion), mark the previous step as completed
  // This handles timed steps (warmup/rest) that complete when their timer finishes
  useEffect(() => {
    const prevIndex = prevStepIndexRef.current;
    const currentIndex = currentStepIndex;

    // Only mark as completed if:
    // - We advanced by exactly 1 (natural advancement, not a jump)
    // - The previous step wasn't already tracked (pending status)
    if (currentIndex === prevIndex + 1) {
      const prevStatus = getStepStatus(prevIndex);
      if (prevStatus === "pending") {
        markCompleted(prevIndex);
      }
    }

    prevStepIndexRef.current = currentIndex;
  }, [currentStepIndex, getStepStatus, markCompleted]);

  // Get next step info
  const nextStep = steps[currentStepIndex + 1] ?? null;
  const nextLabel = getStepLabel(nextStep);

  // Render content based on current state
  const renderContent = () => {
    if (timer.phase === "done") return renderCompletedState();
    if (timer.phase === "timed") return renderTimerState();
    if (current?.type === "exercise") return renderExerciseState();
    if (current?.type === "warmup") return renderWarmupState();
    if (current?.type === "rest") return renderRestReadyState();
    return null;
  };

  const renderCompletedState = () => (
    <View style={styles.stateContainer}>
      <View
        style={[
          styles.stateIcon,
          { backgroundColor: theme.colors.successLight }
        ]}
      >
        <Ionicons name="trophy" size={36} color={theme.colors.success} />
      </View>
      <Text style={styles.stateTitle}>Workout Complete!</Text>
      <Text style={styles.stateSubtitle}>
        Great job finishing {program.name}
      </Text>
      <View style={styles.completedStats}>
        <View style={styles.completedStatItem}>
          <Text style={styles.completedStatValue}>
            {formatTime(timer.sessionElapsedSeconds)}
          </Text>
          <Text style={styles.completedStatLabel}>Total Time</Text>
        </View>
        <View style={styles.completedStatDivider} />
        <View style={styles.completedStatItem}>
          <Text style={styles.completedStatValue}>{steps.length}</Text>
          <Text style={styles.completedStatLabel}>Steps Done</Text>
        </View>
      </View>
    </View>
  );

  const renderTimerState = () => {
    const isWarmup = current?.type === "warmup";
    const isRest = current?.type === "rest";
    const label = isWarmup ? "Warmup" : isRest ? "Rest" : getStepLabel(current);
    const phaseColor = getPhaseColor();

    return (
      <View style={styles.stateContainer}>
        <View
          style={[styles.phaseChip, { backgroundColor: getPhaseBgColor() }]}
        >
          <Ionicons
            name={isWarmup ? "flame" : isRest ? "hourglass" : "barbell"}
            size={14}
            color={phaseColor}
          />
          <Text style={[styles.phaseChipText, { color: phaseColor }]}>
            {isWarmup ? "Warmup" : isRest ? "Rest" : "Exercise"}
          </Text>
        </View>
        <Text style={styles.timerLabel}>{label}</Text>
        <Animated.Text
          style={[
            styles.timerDisplay,
            { color: phaseColor, transform: [{ scale: pulseAnim }] }
          ]}
        >
          {formatTime(timer.timer)}
        </Animated.Text>
        {isRest && nextLabel && (
          <Text style={styles.timerNext}>Next: {nextLabel}</Text>
        )}
        {isWarmup && <Text style={styles.timerNext}>Prepare your body</Text>}
      </View>
    );
  };

  const renderWarmupState = () => (
    <View style={styles.stateContainer}>
      <View
        style={[
          styles.stateIcon,
          { backgroundColor: theme.colors.phases.warmupBg }
        ]}
      >
        <Ionicons name="flame" size={32} color={theme.colors.phases.warmup} />
      </View>
      <View
        style={[
          styles.phaseChip,
          { backgroundColor: theme.colors.phases.warmupBg }
        ]}
      >
        <Text
          style={[styles.phaseChipText, { color: theme.colors.phases.warmup }]}
        >
          Warmup
        </Text>
      </View>
      <Text style={styles.warmupDuration}>
        {current?.type === "warmup" ? formatTime(current.seconds) : ""}
      </Text>
      <Text style={styles.stateSubtitle}>
        Prepare your body for the workout
      </Text>
    </View>
  );

  const renderRestReadyState = () => (
    <View style={styles.stateContainer}>
      <View
        style={[
          styles.stateIcon,
          { backgroundColor: theme.colors.phases.breakBg }
        ]}
      >
        <Ionicons
          name="hourglass-outline"
          size={32}
          color={theme.colors.phases.break}
        />
      </View>
      <View
        style={[
          styles.phaseChip,
          { backgroundColor: theme.colors.phases.breakBg }
        ]}
      >
        <Text
          style={[styles.phaseChipText, { color: theme.colors.phases.break }]}
        >
          Rest
        </Text>
      </View>
      <Text style={styles.restDuration}>
        {current?.type === "rest" ? `${current.seconds}s` : ""}
      </Text>
      {nextLabel && <Text style={styles.stateSubtitle}>Next: {nextLabel}</Text>}
    </View>
  );

  const renderExerciseState = () => {
    if (current?.type !== "exercise") return null;

    const exerciseName = exerciseNameById.get(current.exerciseId) ?? "Exercise";
    const hasMultipleSets = current.totalSets && current.totalSets > 1;

    return (
      <View style={styles.stateContainer}>
        <View
          style={[
            styles.phaseChip,
            { backgroundColor: theme.colors.phases.workingBg }
          ]}
        >
          <Ionicons
            name="barbell"
            size={14}
            color={theme.colors.phases.working}
          />
          <Text
            style={[
              styles.phaseChipText,
              { color: theme.colors.phases.working }
            ]}
          >
            Exercise
          </Text>
        </View>

        <Text style={styles.exerciseName}>{exerciseName}</Text>

        {hasMultipleSets && (
          <View style={styles.setIndicator}>
            <Text style={styles.setIndicatorText}>
              Set {current.setNumber} of {current.totalSets}
            </Text>
          </View>
        )}

        {/* Rep counter */}
        {current.targetReps && (
          <View style={styles.repCounter}>
            <View style={styles.repInputRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.repButton,
                  pressed && styles.repButtonPressed
                ]}
                onPress={() => adjustReps(-1)}
              >
                <Ionicons name="remove" size={24} color={theme.colors.text} />
              </Pressable>

              <View style={styles.repInputContainer}>
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
                <Text style={styles.repInputLabel}>reps</Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.repButton,
                  pressed && styles.repButtonPressed
                ]}
                onPress={() => adjustReps(1)}
              >
                <Ionicons name="add" size={24} color={theme.colors.text} />
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
              name="information-circle"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={styles.noteText}>{current.note}</Text>
          </View>
        )}
      </View>
    );
  };

  // Progress percentage
  const progressPercent = Math.round(timer.progress * 100);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Ionicons name="close" size={22} color={theme.colors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.headerSubtitle}>{program.name}</Text>
        </View>

        <View style={styles.headerTimer}>
          <Ionicons
            name="time-outline"
            size={14}
            color={theme.colors.muted}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.headerTimerText}>
            {formatTime(timer.sessionElapsedSeconds)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: getPhaseColor()
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>{progressPercent}%</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main content card */}
        <Animated.View
          style={[
            styles.mainCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              borderColor: getPhaseColor()
            }
          ]}
        >
          {renderContent()}
        </Animated.View>

        {/* Up Next section */}
        {nextStep && timer.phase !== "done" && (
          <View style={styles.upNextSection}>
            <Text style={styles.sectionLabel}>Up Next</Text>
            <View style={styles.upNextCard}>
              <View
                style={[
                  styles.upNextIcon,
                  {
                    backgroundColor:
                      nextStep.type === "warmup"
                        ? theme.colors.phases.warmupBg
                        : nextStep.type === "rest"
                          ? theme.colors.phases.breakBg
                          : theme.colors.phases.workingBg
                  }
                ]}
              >
                <Ionicons
                  name={
                    nextStep.type === "exercise"
                      ? "barbell-outline"
                      : nextStep.type === "warmup"
                        ? "flame-outline"
                        : "time-outline"
                  }
                  size={16}
                  color={
                    nextStep.type === "warmup"
                      ? theme.colors.phases.warmup
                      : nextStep.type === "rest"
                        ? theme.colors.phases.break
                        : theme.colors.phases.working
                  }
                />
              </View>
              <Text style={styles.upNextName} numberOfLines={1}>
                {nextLabel}
              </Text>
              {nextStep.type === "exercise" && nextStep.targetReps && (
                <Text style={styles.upNextDetail}>
                  {nextStep.targetReps} reps
                </Text>
              )}
              {nextStep.type === "rest" && (
                <Text style={styles.upNextDetail}>{nextStep.seconds}s</Text>
              )}
            </View>
          </View>
        )}

        {/* Workout Matrix */}
        {timer.phase !== "done" && (
          <WorkoutMatrix
            steps={steps}
            currentStepIndex={currentStepIndex}
            isDone={false}
            exerciseNameById={exerciseNameById}
            phase={timer.phase}
            stepTimer={timer.timer}
            onStepPress={timer.goToStep}
            getStepStatus={getStepStatus}
            getCompletionCount={getCompletionCount}
          />
        )}
      </ScrollView>

      {/* Footer actions */}
      <View style={styles.footer}>
        <SafeAreaView edges={["bottom"]} style={styles.footerSafeArea}>
          <View style={styles.footerContent}>
            {timer.phase === "done" ? (
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.successButton,
                  pressed && styles.primaryButtonPressed
                ]}
                onPress={() => router.back()}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.colors.primaryTextOn}
                />
                <Text style={styles.primaryButtonText}>Done</Text>
              </Pressable>
            ) : timer.phase === "timed" ? (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryButtonPressed
                  ]}
                  onPress={handleSkip}
                >
                  <Ionicons
                    name="play-skip-forward"
                    size={18}
                    color={theme.colors.text}
                  />
                  <Text style={styles.secondaryButtonText}>Skip</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed
                  ]}
                  onPress={timer.handlePauseResume}
                >
                  <Ionicons
                    name={timer.isPaused ? "play" : "pause"}
                    size={20}
                    color={theme.colors.primaryTextOn}
                  />
                  <Text style={styles.primaryButtonText}>
                    {timer.isPaused ? "Resume" : "Pause"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryButtonPressed
                  ]}
                  onPress={handleSkip}
                >
                  <Ionicons
                    name="play-skip-forward"
                    size={18}
                    color={theme.colors.text}
                  />
                  <Text style={styles.secondaryButtonText}>Skip</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed
                  ]}
                  onPress={
                    current?.type === "exercise"
                      ? handleCompleteSet
                      : timer.handleComplete
                  }
                >
                  <Ionicons
                    name={
                      current?.type === "exercise" && !current.durationSeconds
                        ? "checkmark-circle"
                        : "play"
                    }
                    size={20}
                    color={theme.colors.primaryTextOn}
                  />
                  <Text style={styles.primaryButtonText}>
                    {current?.type === "warmup"
                      ? "Start"
                      : current?.type === "rest"
                        ? "Start"
                        : current?.type === "exercise"
                          ? current.durationSeconds
                            ? "Start"
                            : "Complete"
                          : "Continue"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </SafeAreaView>
      </View>

      {/* Update prompt modal */}
      {showUpdatePrompt && lastCompletion && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons
                name="sync-circle"
                size={32}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.modalTitle}>Update Program?</Text>
            <Text style={styles.modalText}>
              You completed{" "}
              <Text style={styles.modalHighlight}>
                {lastCompletion.actualReps} reps
              </Text>{" "}
              instead of {lastCompletion.targetReps}.
            </Text>
            <Text style={styles.modalSubtext}>
              Update{" "}
              {lastCompletion.totalSets > 1
                ? `set ${lastCompletion.setNumber}`
                : "this exercise"}{" "}
              to {lastCompletion.actualReps} reps for future workouts?
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButtonSecondary,
                  pressed && styles.buttonPressed
                ]}
                onPress={() => setShowUpdatePrompt(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Keep</Text>
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

                  // Use blockIndex from completion if available, otherwise find by exerciseId
                  let blockIndex = lastCompletion.blockIndex;
                  if (blockIndex === undefined) {
                    blockIndex = program.blocks.findIndex(
                      (block) =>
                        block.type === "exercise" &&
                        block.exerciseId === lastCompletion.exerciseId
                    );
                  }

                  if (blockIndex === -1 || blockIndex === undefined) {
                    setShowUpdatePrompt(false);
                    return;
                  }

                  const updatedBlocks = [...program.blocks];
                  const block = updatedBlocks[blockIndex];
                  if (block.type === "exercise") {
                    const totalSets = block.sets ?? 1;
                    const setIndex = lastCompletion.setNumber - 1; // Convert to 0-based

                    // Handle per-set rep update
                    let newTargetReps: number | number[];

                    if (totalSets === 1) {
                      // Single set - just update the value
                      newTargetReps = lastCompletion.actualReps;
                    } else if (typeof block.targetReps === "number") {
                      // Convert single number to array and update specific set
                      const repsArray = Array(totalSets).fill(block.targetReps);
                      repsArray[setIndex] = lastCompletion.actualReps;
                      newTargetReps = repsArray;
                    } else if (Array.isArray(block.targetReps)) {
                      // Already an array - update specific set
                      newTargetReps = [...block.targetReps];
                      // Ensure array is long enough
                      while (newTargetReps.length < totalSets) {
                        newTargetReps.push(
                          newTargetReps[newTargetReps.length - 1] ?? 0
                        );
                      }
                      newTargetReps[setIndex] = lastCompletion.actualReps;
                    } else {
                      // Fallback - single value
                      newTargetReps = lastCompletion.actualReps;
                    }

                    updatedBlocks[blockIndex] = {
                      ...block,
                      targetReps: newTargetReps
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
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background
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
    ...theme.typography.small,
    color: theme.colors.muted,
    marginTop: 1
  },
  headerTimer: {
    flexDirection: "row",
    alignItems: "center",
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

  // Progress
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: theme.radius.sm
  },
  progressText: {
    ...theme.typography.small,
    color: theme.colors.muted,
    width: 32,
    textAlign: "right"
  },

  // Scroll
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 140
  },

  // Main card
  mainCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    ...theme.shadows.md
  },

  // State container (shared)
  stateContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.md
  },
  stateIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg
  },
  stateTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.xs
  },
  stateSubtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center"
  },

  // Phase chip
  phaseChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md
  },
  phaseChipText: {
    ...theme.typography.small,
    fontFamily: theme.fonts.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },

  // Timer state
  timerLabel: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.sm
  },
  timerDisplay: {
    fontSize: 64,
    fontFamily: theme.fonts.bold,
    fontVariant: ["tabular-nums"],
    letterSpacing: -2
  },
  timerNext: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.md
  },

  // Warmup state
  warmupDuration: {
    fontSize: 48,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },

  // Rest state
  restDuration: {
    fontSize: 48,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },

  // Exercise state
  exerciseName: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.sm
  },
  setIndicator: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xl
  },
  setIndicatorText: {
    ...theme.typography.captionBold,
    color: theme.colors.primary
  },
  repCounter: {
    alignItems: "center",
    width: "100%"
  },
  repInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.lg
  },
  repButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  repButtonPressed: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.95 }]
  },
  repInputContainer: {
    alignItems: "center"
  },
  repInput: {
    fontSize: 52,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    textAlign: "center",
    minWidth: 80,
    fontVariant: ["tabular-nums"]
  },
  repInputLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: -4
  },
  targetReps: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.md
  },
  durationDisplay: {
    alignItems: "center",
    marginTop: theme.spacing.lg
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
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    width: "100%"
  },
  noteText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    flex: 1
  },

  // Completed stats
  completedStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  completedStatItem: {
    flex: 1,
    alignItems: "center"
  },
  completedStatValue: {
    ...theme.typography.h2,
    color: theme.colors.text
  },
  completedStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: 2
  },
  completedStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.border
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
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs
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
  upNextIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  upNextName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flex: 1
  },
  upNextDetail: {
    ...theme.typography.caption,
    color: theme.colors.muted
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
  footerSafeArea: {
    width: "100%"
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  iconButtonPressed: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.95 }]
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    height: 48,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  secondaryButtonPressed: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.98 }]
  },
  secondaryButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md
  },
  successButton: {
    backgroundColor: theme.colors.success
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
    borderRadius: theme.radius.md,
    padding: theme.spacing.xl,
    width: "100%",
    maxWidth: 320,
    alignItems: "center"
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.sm
  },
  modalText: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    textAlign: "center"
  },
  modalHighlight: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  },
  modalSubtext: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textAlign: "center",
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xl
  },
  modalButtons: {
    flexDirection: "row",
    gap: theme.spacing.md,
    width: "100%"
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
