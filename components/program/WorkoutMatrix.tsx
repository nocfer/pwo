/**
 * WorkoutMatrix - Elegant workout progress visualization
 *
 * Modern, compact display showing exercises with inline set progress indicators.
 */

import { WorkoutStep } from "@/hooks/session";
import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type SetInfo = {
  stepIndex: number;
  setNumber: number;
  isDone: boolean;
  isCurrent: boolean;
  targetReps?: number;
};

type ExerciseRow = {
  exerciseId: string;
  name: string;
  sets: SetInfo[];
  targetReps?: number;
  isNext: boolean;
};

type Props = {
  steps: WorkoutStep[];
  currentStepIndex: number;
  isDone: boolean;
  exerciseNameById: Map<string, string>;
  /** Current phase from useWorkoutTimer - "timed" for warmup/rest, "working" for exercise */
  phase?: "timed" | "working" | "done";
  /** Remaining seconds on current step timer */
  stepTimer?: number;
};

function buildExerciseRows(
  steps: WorkoutStep[],
  currentStepIndex: number,
  isDone: boolean,
  exerciseNameById: Map<string, string>
): ExerciseRow[] {
  const exerciseMap = new Map<
    string,
    {
      exerciseId: string;
      name: string;
      sets: SetInfo[];
      targetReps?: number;
      firstIndex: number;
    }
  >();

  steps.forEach((step, idx) => {
    if (step.type !== "exercise") return;

    const stepIsDone = isDone || idx < currentStepIndex;
    const stepIsCurrent = !isDone && idx === currentStepIndex;
    const exerciseId = step.exerciseId;

    if (!exerciseMap.has(exerciseId)) {
      exerciseMap.set(exerciseId, {
        exerciseId,
        name: exerciseNameById.get(exerciseId) ?? "Exercise",
        sets: [],
        targetReps: step.targetReps,
        firstIndex: idx
      });
    }

    const exercise = exerciseMap.get(exerciseId)!;
    exercise.sets.push({
      stepIndex: idx,
      setNumber: step.setNumber ?? exercise.sets.length + 1,
      isDone: stepIsDone,
      isCurrent: stepIsCurrent,
      targetReps: step.targetReps
    });
  });

  const rows = Array.from(exerciseMap.values()).sort(
    (a, b) => a.firstIndex - b.firstIndex
  );

  // Find which exercise is "next" (first one with incomplete sets)
  let foundNext = false;
  return rows.map(({ exerciseId, name, sets, targetReps }) => {
    const hasIncompleteSets = sets.some((s) => !s.isDone);
    const isNext = !foundNext && hasIncompleteSets;
    if (isNext) foundNext = true;

    return {
      exerciseId,
      name,
      sets,
      targetReps,
      isNext
    };
  });
}

/** Format seconds to M:SS */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type PhaseInfo = {
  type: "warmup" | "rest";
  timer?: number;
} | null;

export function WorkoutMatrix({
  steps,
  currentStepIndex,
  isDone,
  exerciseNameById,
  phase,
  stepTimer
}: Props) {
  const exerciseRows = useMemo(
    () => buildExerciseRows(steps, currentStepIndex, isDone, exerciseNameById),
    [steps, currentStepIndex, isDone, exerciseNameById]
  );

  const totalSets = exerciseRows.reduce((sum, row) => sum + row.sets.length, 0);
  const completedSets = exerciseRows.reduce(
    (sum, row) => sum + row.sets.filter((s) => s.isDone).length,
    0
  );

  // Determine current phase info to pass to the "next" exercise row
  const currentStep = steps[currentStepIndex];
  const isWarmup = currentStep?.type === "warmup";
  const isRest = currentStep?.type === "rest";
  const phaseInfo: PhaseInfo =
    (isWarmup || isRest) && phase === "timed"
      ? { type: isWarmup ? "warmup" : "rest", timer: stepTimer }
      : null;

  if (exerciseRows.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(completedSets / totalSets) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {completedSets}/{totalSets}
          </Text>
        </View>
      </View>

      {/* Exercise list */}
      <View style={styles.exerciseList}>
        {exerciseRows.map((row, idx) => (
          <ExerciseRowView
            key={row.exerciseId || idx}
            row={row}
            index={idx + 1}
            phaseInfo={row.isNext ? phaseInfo : null}
          />
        ))}
      </View>
    </View>
  );
}

function ExerciseRowView({
  row,
  index,
  phaseInfo
}: {
  row: ExerciseRow;
  index: number;
  phaseInfo: PhaseInfo;
}) {
  const allDone = row.sets.every((s) => s.isDone);
  const hasCurrentSet = row.sets.some((s) => s.isCurrent);

  // Determine row state for styling
  const isActive = row.isNext || hasCurrentSet;
  const isWaiting = phaseInfo !== null; // Waiting for warmup/rest to finish
  const isWarmupPhase = phaseInfo?.type === "warmup";
  const isRestPhase = phaseInfo?.type === "rest";

  return (
    <View
      style={[
        styles.exerciseRow,
        allDone && styles.exerciseRowDone,
        isActive && !isWaiting && styles.exerciseRowActive,
        isWaiting && isWarmupPhase && styles.exerciseRowWarmup,
        isWaiting && isRestPhase && styles.exerciseRowRest
      ]}
    >
      {/* Index badge - shows phase icon when waiting */}
      <View
        style={[
          styles.indexBadge,
          allDone && styles.indexBadgeDone,
          isActive && !isWaiting && styles.indexBadgeActive,
          isWaiting && isWarmupPhase && styles.indexBadgeWarmup,
          isWaiting && isRestPhase && styles.indexBadgeRest
        ]}
      >
        {allDone ? (
          <Ionicons name="checkmark" size={14} color={theme.colors.primaryTextOn} />
        ) : isWaiting ? (
          <Ionicons
            name={isWarmupPhase ? "flame" : "pause"}
            size={14}
            color={theme.colors.primaryTextOn}
          />
        ) : (
          <Text style={[styles.indexText, isActive && styles.indexTextActive]}>
            {index}
          </Text>
        )}
      </View>

      {/* Exercise info */}
      <View style={styles.exerciseInfo}>
        <Text
          style={[
            styles.exerciseName,
            allDone && styles.exerciseNameDone,
            isActive && !isWaiting && styles.exerciseNameActive,
            isWaiting && isWarmupPhase && styles.exerciseNameWarmup,
            isWaiting && isRestPhase && styles.exerciseNameRest
          ]}
          numberOfLines={1}
        >
          {row.name}
        </Text>
        {isWaiting && phaseInfo.timer !== undefined ? (
          <Text
            style={[
              styles.exerciseMeta,
              isWarmupPhase && styles.exerciseMetaWarmup,
              isRestPhase && styles.exerciseMetaRest
            ]}
          >
            {isWarmupPhase ? "Warming up" : "Resting"} · {formatTime(phaseInfo.timer)}
          </Text>
        ) : row.sets.length > 1 ? (
          <Text style={styles.exerciseMeta}>
            {row.sets.filter((s) => s.isDone).length}/{row.sets.length} sets
          </Text>
        ) : null}
      </View>

      {/* Set indicators */}
      <View style={styles.setsContainer}>
        {row.sets.map((set) => (
          <SetIndicator key={set.stepIndex} set={set} />
        ))}
      </View>
    </View>
  );
}

function SetIndicator({ set }: { set: SetInfo }) {
  const displayValue = set.targetReps ?? set.setNumber;

  if (set.isDone) {
    return (
      <View style={[styles.setIndicator, styles.setDone]}>
        <Ionicons name="checkmark" size={14} color={theme.colors.primaryTextOn} />
      </View>
    );
  }

  if (set.isCurrent) {
    return (
      <View style={[styles.setIndicator, styles.setCurrent]}>
        <Text style={styles.setTextCurrent}>{displayValue}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.setIndicator, styles.setPending]}>
      <Text style={styles.setTextPending}>{displayValue}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    ...theme.shadows.sm
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  progressBar: {
    width: 48,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 2
  },
  progressLabel: {
    ...theme.typography.captionBold,
    color: theme.colors.muted,
    minWidth: 28
  },

  // Exercise list
  exerciseList: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.xs
  },

  // Exercise row
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background
  },
  exerciseRowDone: {
    backgroundColor: theme.colors.successLight,
    opacity: 0.8
  },
  exerciseRowActive: {
    backgroundColor: theme.colors.primaryLight
  },
  exerciseRowWarmup: {
    backgroundColor: theme.colors.phases.warmupBg
  },
  exerciseRowRest: {
    backgroundColor: theme.colors.phases.breakBg
  },

  // Index badge
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.md
  },
  indexBadgeDone: {
    backgroundColor: theme.colors.success
  },
  indexBadgeActive: {
    backgroundColor: theme.colors.primary
  },
  indexBadgeWarmup: {
    backgroundColor: theme.colors.phases.warmup
  },
  indexBadgeRest: {
    backgroundColor: theme.colors.phases.break
  },
  indexText: {
    ...theme.typography.captionBold,
    color: theme.colors.muted
  },
  indexTextActive: {
    color: theme.colors.primaryTextOn
  },

  // Exercise info
  exerciseInfo: {
    flex: 1,
    marginRight: theme.spacing.md
  },
  exerciseName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  exerciseNameDone: {
    color: theme.colors.success
  },
  exerciseNameActive: {
    color: theme.colors.primary
  },
  exerciseNameWarmup: {
    color: theme.colors.phases.warmup
  },
  exerciseNameRest: {
    color: theme.colors.phases.break
  },
  exerciseMeta: {
    ...theme.typography.small,
    color: theme.colors.muted,
    marginTop: 1
  },
  exerciseMetaWarmup: {
    color: theme.colors.phases.warmup
  },
  exerciseMetaRest: {
    color: theme.colors.phases.break
  },

  // Sets container
  setsContainer: {
    flexDirection: "row",
    gap: 6
  },

  // Set indicators - rounded squares showing reps
  setIndicator: {
    minWidth: 36,
    height: 32,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  setDone: {
    backgroundColor: theme.colors.success
  },
  setCurrent: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4
  },
  setPending: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border
  },
  setTextCurrent: {
    ...theme.typography.captionBold,
    color: theme.colors.primaryTextOn
  },
  setTextPending: {
    ...theme.typography.captionBold,
    color: theme.colors.muted
  }
});

export default WorkoutMatrix;
