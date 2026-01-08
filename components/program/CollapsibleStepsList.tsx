import { WorkoutStep } from "@/hooks/session";
import { formatDuration } from "@/lib/utils";
import { getPhaseInfo } from "@/lib/utils/colors";
import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

type CollapsibleStepsListProps = {
  steps: WorkoutStep[];
  currentStepIndex: number;
  exerciseNameById: Map<string, string>;
  phase: string;
};

// Group steps by exercise for better visual organization
type StepGroup = {
  type: "exercise" | "warmup" | "rest";
  exerciseId?: string;
  exerciseName?: string;
  steps: WorkoutStep[];
  startIndex: number;
};

export function CollapsibleStepsList({
  steps,
  currentStepIndex,
  exerciseNameById,
  phase
}: CollapsibleStepsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const listRef = useRef<FlatList<StepGroup> | null>(null);
  const { phaseAccent } = getPhaseInfo(phase, steps[currentStepIndex]?.type);

  // Group steps by exercise
  const stepGroups = useMemo(() => {
    const groups: StepGroup[] = [];
    let i = 0;

    while (i < steps.length) {
      const step = steps[i];

      if (step.type === "warmup") {
        groups.push({
          type: "warmup",
          steps: [step],
          startIndex: i
        });
        i++;
      } else if (step.type === "exercise") {
        const exerciseSteps: WorkoutStep[] = [step];
        const exerciseId = step.exerciseId;
        i++;

        // Collect all sets and rests for this exercise
        while (i < steps.length) {
          const nextStep = steps[i];
          if (
            nextStep.type === "exercise" &&
            nextStep.exerciseId === exerciseId
          ) {
            exerciseSteps.push(nextStep);
            i++;
          } else if (
            nextStep.type === "rest" &&
            nextStep.restContext === "between-sets"
          ) {
            exerciseSteps.push(nextStep);
            i++;
          } else {
            break;
          }
        }

        groups.push({
          type: "exercise",
          exerciseId,
          exerciseName: exerciseNameById.get(exerciseId) ?? "Exercise",
          steps: exerciseSteps,
          startIndex: i - exerciseSteps.length
        });
      } else if (step.type === "rest") {
        groups.push({
          type: "rest",
          steps: [step],
          startIndex: i
        });
        i++;
      }
    }

    return groups;
  }, [steps, exerciseNameById]);

  // Find which group contains the current step
  const currentGroupIndex = useMemo(() => {
    return stepGroups.findIndex((group) => {
      const groupEndIndex = group.startIndex + group.steps.length - 1;
      return (
        currentStepIndex >= group.startIndex &&
        currentStepIndex <= groupEndIndex
      );
    });
  }, [stepGroups, currentStepIndex]);

  // Auto-scroll to active group
  useEffect(() => {
    try {
      if (!listRef.current || currentGroupIndex < 0) return;
      listRef.current.scrollToIndex({
        index: currentGroupIndex,
        animated: true,
        viewPosition: 0.3
      });
    } catch {}
  }, [currentGroupIndex]);

  const renderStepItem = ({
    item,
    index: idx
  }: {
    item: WorkoutStep;
    index: number;
  }) => {
    const isDone = idx < currentStepIndex || phase === "done";
    const isActive = idx === currentStepIndex && phase !== "done";

    // Warmup step
    if (item.type === "warmup") {
      const warmupDuration =
        item.seconds >= 60
          ? formatDuration(item.seconds, "short")
          : `${item.seconds}s`;

      return (
        <View
          style={[
            styles.stepRow,
            isActive && styles.stepRowActive,
            isDone && styles.stepRowDone
          ]}
        >
          <View style={styles.stepIcon}>
            <Ionicons
              name="flame"
              size={16}
              color={theme.colors.phases.warmup}
            />
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, isDone && styles.stepTitleDone]}>
              Warmup
            </Text>
            <Text style={styles.stepMeta}>{warmupDuration}</Text>
          </View>
          {isDone ? (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={theme.colors.success}
            />
          ) : isActive ? (
            <View
              style={[
                styles.activeBadge,
                { backgroundColor: theme.colors.phases.warmup }
              ]}
            >
              <Text style={styles.activeBadgeText}>NOW</Text>
            </View>
          ) : (
            <Text style={styles.stepNumber}>{idx + 1}</Text>
          )}
        </View>
      );
    }

    // Rest step
    if (item.type === "rest") {
      const isSetRest = item.restContext === "between-sets";
      const restColor = isSetRest
        ? theme.colors.muted
        : theme.colors.phases.break;

      return (
        <View
          style={[
            styles.stepRow,
            isSetRest && styles.stepRowIndented,
            isActive && styles.stepRowActive,
            isDone && styles.stepRowDone
          ]}
        >
          <View style={styles.stepIcon}>
            <Ionicons name="hourglass-outline" size={16} color={restColor} />
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, isDone && styles.stepTitleDone]}>
              {isSetRest ? "Rest" : "Rest"}
            </Text>
            <Text style={styles.stepMeta}>
              {item.seconds}s {isSetRest ? "between sets" : "between exercises"}
            </Text>
          </View>
          {isDone ? (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={theme.colors.success}
            />
          ) : isActive ? (
            <View style={[styles.activeBadge, { backgroundColor: restColor }]}>
              <Text style={styles.activeBadgeText}>NOW</Text>
            </View>
          ) : (
            <Text style={styles.stepNumber}>{idx + 1}</Text>
          )}
        </View>
      );
    }

    // Exercise step
    const exName = exerciseNameById.get(item.exerciseId) ?? "Exercise";
    const hasMultipleSets = item.totalSets != null && item.totalSets > 1;

    return (
      <View
        style={[
          styles.stepRow,
          isActive && styles.stepRowActive,
          isDone && styles.stepRowDone
        ]}
      >
        <View style={styles.stepIcon}>
          <Ionicons name="barbell-outline" size={16} color={phaseAccent} />
        </View>
        <View style={styles.stepContent}>
          <View style={styles.stepTitleRow}>
            <Text
              style={[styles.stepTitle, isDone && styles.stepTitleDone]}
              numberOfLines={1}
            >
              {exName}
            </Text>
            {hasMultipleSets && (
              <Text style={styles.setLabel}>
                Set {item.setNumber}/{item.totalSets}
              </Text>
            )}
          </View>
          <Text style={styles.stepMeta}>
            {item.targetReps != null && `${item.targetReps} reps`}
            {item.targetReps != null && item.durationSeconds != null && " • "}
            {item.durationSeconds != null && `${item.durationSeconds}s`}
          </Text>
          {item.note && (
            <Text style={styles.stepNote} numberOfLines={1}>
              💡 {item.note}
            </Text>
          )}
        </View>
        {isDone ? (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={theme.colors.success}
          />
        ) : isActive ? (
          <View style={[styles.activeBadge, { backgroundColor: phaseAccent }]}>
            <Text style={styles.activeBadgeText}>NOW</Text>
          </View>
        ) : (
          <Text style={styles.stepNumber}>{idx + 1}</Text>
        )}
      </View>
    );
  };

  const renderGroupItem = ({
    item: group,
    index: groupIdx
  }: {
    item: StepGroup;
    index: number;
  }): React.ReactElement => {
    const isGroupActive = groupIdx === currentGroupIndex;
    const isGroupDone =
      group.startIndex + group.steps.length - 1 < currentStepIndex;

    if (group.type === "warmup") {
      return (
        <View style={styles.groupContainer}>
          {group.steps.map((step, idx) =>
            renderStepItem({ item: step, index: group.startIndex + idx })
          )}
        </View>
      );
    }

    if (group.type === "exercise") {
      return (
        <View
          style={[
            styles.groupContainer,
            isGroupActive && styles.groupContainerActive,
            isGroupDone && styles.groupContainerDone
          ]}
        >
          {/* Exercise header */}
          <View style={styles.groupHeader}>
            <View style={styles.groupHeaderLeft}>
              <Ionicons name="barbell-outline" size={18} color={phaseAccent} />
              <Text
                style={[
                  styles.groupTitle,
                  isGroupDone && styles.groupTitleDone
                ]}
              >
                {group.exerciseName}
              </Text>
            </View>
            <Text style={styles.groupMeta}>
              {group.steps.filter((s) => s.type === "exercise").length} sets
            </Text>
          </View>

          {/* Exercise steps */}
          {group.steps.map((step, idx) =>
            renderStepItem({ item: step, index: group.startIndex + idx })
          )}
        </View>
      );
    }

    // Rest between exercises
    return (
      <View style={styles.groupContainer}>
        {group.steps.map((step, idx) =>
          renderStepItem({ item: step, index: group.startIndex + idx })
        )}
      </View>
    );
  };

  // Determine which groups to show
  const visibleGroups = isExpanded
    ? stepGroups
    : stepGroups.slice(
        Math.max(0, currentGroupIndex),
        Math.min(stepGroups.length, currentGroupIndex + 3)
      );

  const hasMoreGroups = stepGroups.length > 3;
  const showExpandButton =
    hasMoreGroups && !isExpanded && currentGroupIndex + 3 < stepGroups.length;

  return (
    <View style={styles.container}>
      {/* Header with expand/collapse */}
      <View style={styles.header}>
        <Text style={styles.title}>Workout Plan</Text>
        {hasMoreGroups && (
          <Pressable
            onPress={() => setIsExpanded(!isExpanded)}
            style={({ pressed }) => [
              styles.expandButton,
              pressed && styles.expandButtonPressed
            ]}
          >
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.colors.primary}
            />
            <Text style={styles.expandButtonText}>
              {isExpanded ? "Collapse" : "Expand"}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Groups list */}
      <FlatList
        ref={listRef}
        data={visibleGroups}
        keyExtractor={(item, idx) => `group-${idx}`}
        ItemSeparatorComponent={() => <View style={styles.groupSeparator} />}
        contentContainerStyle={styles.listContent}
        onScrollToIndexFailed={() => {}}
        renderItem={renderGroupItem}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />

      {/* Show more indicator */}
      {showExpandButton && (
        <Pressable
          onPress={() => setIsExpanded(true)}
          style={({ pressed }) => [
            styles.showMoreButton,
            pressed && styles.showMoreButtonPressed
          ]}
        >
          <Text style={styles.showMoreText}>
            +{stepGroups.length - (currentGroupIndex + 3)} more exercises
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={theme.colors.primary}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md
  },
  title: {
    ...theme.typography.captionBold,
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  expandButtonPressed: {
    opacity: 0.7
  },
  expandButtonText: {
    ...theme.typography.small,
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 180
  },
  groupSeparator: {
    height: theme.spacing.md
  },
  // Group container
  groupContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    ...theme.shadows.sm
  },
  groupContainerActive: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.md
  },
  groupContainerDone: {
    opacity: 0.6,
    backgroundColor: theme.colors.background
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  groupHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1
  },
  groupTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flex: 1
  },
  groupTitleDone: {
    color: theme.colors.success,
    textDecorationLine: "line-through"
  },
  groupMeta: {
    ...theme.typography.small,
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium
  },
  // Step row
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: "transparent"
  },
  stepRowActive: {
    backgroundColor: theme.colors.primaryLight,
    borderLeftColor: theme.colors.primary
  },
  stepRowDone: {
    opacity: 0.6
  },
  stepRowIndented: {
    marginLeft: theme.spacing.lg,
    marginRight: theme.spacing.md
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  stepContent: {
    flex: 1,
    minWidth: 0
  },
  stepTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs
  },
  stepTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flex: 1
  },
  stepTitleDone: {
    color: theme.colors.success,
    textDecorationLine: "line-through"
  },
  setLabel: {
    ...theme.typography.small,
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
    flexShrink: 0
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
  activeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
    flexShrink: 0
  },
  activeBadgeText: {
    ...theme.typography.small,
    color: theme.colors.primaryTextOn,
    fontFamily: theme.fonts.bold,
    letterSpacing: 0.5
  },
  stepNumber: {
    ...theme.typography.captionBold,
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium,
    minWidth: 24,
    textAlign: "center",
    flexShrink: 0
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  showMoreButtonPressed: {
    backgroundColor: theme.colors.background
  },
  showMoreText: {
    ...theme.typography.captionBold,
    color: theme.colors.primary
  }
});

export default CollapsibleStepsList;
