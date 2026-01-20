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
      isCurrent: stepIsCurrent
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

export function WorkoutMatrix({
  steps,
  currentStepIndex,
  isDone,
  exerciseNameById
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
          />
        ))}
      </View>
    </View>
  );
}

function ExerciseRowView({ row, index }: { row: ExerciseRow; index: number }) {
  const allDone = row.sets.every((s) => s.isDone);
  const hasCurrentSet = row.sets.some((s) => s.isCurrent);

  // Determine row state for styling
  const isActive = row.isNext || hasCurrentSet;

  return (
    <View
      style={[
        styles.exerciseRow,
        allDone && styles.exerciseRowDone,
        isActive && styles.exerciseRowActive
      ]}
    >
      {/* Index number */}
      <View
        style={[
          styles.indexBadge,
          allDone && styles.indexBadgeDone,
          isActive && styles.indexBadgeActive
        ]}
      >
        {allDone ? (
          <Ionicons name="checkmark" size={14} color={theme.colors.primaryTextOn} />
        ) : (
          <Text
            style={[
              styles.indexText,
              isActive && styles.indexTextActive
            ]}
          >
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
            isActive && styles.exerciseNameActive
          ]}
          numberOfLines={1}
        >
          {row.name}
        </Text>
        <Text style={styles.exerciseMeta}>
          {row.targetReps ? `${row.targetReps} reps` : ""}
        </Text>
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
        <Text style={styles.setTextCurrent}>{set.setNumber}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.setIndicator, styles.setPending]}>
      <Text style={styles.setTextPending}>{set.setNumber}</Text>
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
  exerciseMeta: {
    ...theme.typography.small,
    color: theme.colors.muted,
    marginTop: 1
  },

  // Sets container
  setsContainer: {
    flexDirection: "row",
    gap: 6
  },

  // Set indicators
  setIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
