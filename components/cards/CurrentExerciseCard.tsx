import { WorkoutStep } from "@/hooks/session";
import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type CurrentExerciseCardProps = {
  current: WorkoutStep | null;
  exerciseName?: string;
  phaseAccent: string;
  phaseBg: string;
};

export function CurrentExerciseCard({
  current,
  exerciseName,
  phaseAccent,
  phaseBg
}: CurrentExerciseCardProps) {
  if (!current) return null;

  const isExercise = current.type === "exercise";
  const isRest = current.type === "rest";
  const isWarmup = current.type === "warmup";

  // Determine icon and label
  const getPhaseInfo = () => {
    if (isWarmup) {
      return {
        icon: "flame" as const,
        label: "WARMING UP",
        color: theme.colors.phases.warmup
      };
    }
    if (isRest) {
      return {
        icon: "hourglass-outline" as const,
        label: "REST",
        color: theme.colors.phases.break
      };
    }
    return {
      icon: "barbell-outline" as const,
      label: "EXERCISE",
      color: theme.colors.phases.working
    };
  };

  const phaseInfo = getPhaseInfo();

  return (
    <View style={[styles.container, { borderTopColor: phaseAccent }]}>
      {/* Phase label */}
      <View style={styles.phaseRow}>
        <View
          style={[styles.phaseChip, { backgroundColor: `${phaseAccent}15` }]}
        >
          <Ionicons name={phaseInfo.icon} size={16} color={phaseAccent} />
          <Text style={[styles.phaseLabel, { color: phaseAccent }]}>
            {phaseInfo.label}
          </Text>
        </View>

        {isExercise && current.totalSets && current.totalSets > 1 && (
          <View style={[styles.setBadge, { backgroundColor: phaseAccent }]}>
            <Text style={styles.setBadgeText}>
              Set {current.setNumber}/{current.totalSets}
            </Text>
          </View>
        )}
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {isExercise && exerciseName ? (
          <>
            <Text style={styles.exerciseName}>{exerciseName}</Text>
            {(current.targetReps || current.durationSeconds) && (
              <View style={styles.metricsRow}>
                {current.targetReps && (
                  <View style={styles.metricItem}>
                    <Ionicons
                      name="fitness"
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.metricText}>
                      {current.targetReps} reps
                    </Text>
                  </View>
                )}
                {current.durationSeconds && (
                  <View style={styles.metricItem}>
                    <Ionicons
                      name="timer-outline"
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.metricText}>
                      {current.durationSeconds}s
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        ) : isRest ? (
          <>
            <Text style={styles.restDuration}>{(current as any).seconds}s</Text>
            <Text style={styles.restLabel}>Take a breather</Text>
          </>
        ) : (
          <>
            <Text style={styles.warmupDuration}>
              {(current as any).seconds >= 60
                ? `${Math.floor((current as any).seconds / 60)}m ${(current as any).seconds % 60}s`
                : `${(current as any).seconds}s`}
            </Text>
            <Text style={styles.warmupLabel}>Prepare your body</Text>
          </>
        )}
      </View>

      {/* Note if present */}
      {isExercise && current.note && (
        <View style={styles.noteBox}>
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
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderTopWidth: 4,
    padding: theme.spacing.lg,
    ...theme.shadows.md
  },
  phaseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg
  },
  phaseChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full
  },
  phaseLabel: {
    ...theme.typography.small,
    fontFamily: theme.fonts.bold,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  setBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full
  },
  setBadgeText: {
    ...theme.typography.small,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primaryTextOn,
    letterSpacing: 0.5
  },
  content: {
    marginBottom: theme.spacing.md
  },
  exerciseName: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  restDuration: {
    fontSize: 48,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    letterSpacing: -1
  },
  restLabel: {
    ...theme.typography.body,
    color: theme.colors.subtext
  },
  warmupDuration: {
    fontSize: 40,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    letterSpacing: -0.5
  },
  warmupLabel: {
    ...theme.typography.body,
    color: theme.colors.subtext
  },
  metricsRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md
  },
  metricText: {
    ...theme.typography.captionBold,
    color: theme.colors.primary
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md
  },
  noteText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    flex: 1,
    lineHeight: 18
  }
});

export default CurrentExerciseCard;
