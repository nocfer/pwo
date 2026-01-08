import { WorkoutStep } from "@/hooks/session";
import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type FocusCardProps = {
  phaseAccent: string;
  phaseBg: string;
  phaseChipText: string;
  title: string;
  subTitle: string;
  icon: string;
  current?: WorkoutStep;
  timerEnabled?: boolean;
  progress?: number;
};

export function FocusCard({
  phaseAccent,
  phaseBg,
  subTitle,
  phaseChipText,
  title,
  icon,
  current,
  timerEnabled = false,
  progress = 0
}: FocusCardProps) {
  const isExercise = current?.type === "exercise";
  const hasMultipleSets =
    isExercise &&
    current.totalSets != null &&
    current.totalSets > 1 &&
    current.setNumber != null;

  return (
    <View style={styles.container}>
      {/* Colored accent bar at top */}
      <View style={[styles.accentBar, { backgroundColor: phaseAccent }]} />

      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View
            style={[styles.phaseChip, { backgroundColor: `${phaseAccent}15` }]}
          >
            <Ionicons name={icon as any} size={14} color={phaseAccent} />
            <Text style={[styles.phaseChipText, { color: phaseAccent }]}>
              {phaseChipText}
            </Text>
          </View>

          {hasMultipleSets && (
            <View style={[styles.setBadge, { backgroundColor: phaseAccent }]}>
              <Text style={styles.setBadgeText}>
                {current.setNumber}/{current.totalSets}
              </Text>
            </View>
          )}
        </View>

        {/* Timer with circular progress (if enabled) */}
        {timerEnabled && (
          <View style={styles.timerContainer}>
            <View
              style={[
                styles.circularProgressBg,
                { borderColor: `${phaseAccent}20` }
              ]}
            >
              <View
                style={[
                  styles.circularProgressFill,
                  {
                    borderColor: phaseAccent,
                    transform: [
                      {
                        rotate: `${progress * 360}deg`
                      }
                    ]
                  }
                ]}
              />
              <View style={styles.timerContent}>
                <Text style={styles.timerHero}>{title}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Main title (non-timer) */}
        {!timerEnabled && <Text style={styles.title}>{title}</Text>}

        <Text style={styles.subtitle}>{subTitle}</Text>

        {/* Exercise metrics */}
        {isExercise &&
          (current.targetReps != null || current.durationSeconds != null) && (
            <View style={styles.metricsRow}>
              {current.targetReps != null && (
                <View style={styles.metricChip}>
                  <Ionicons
                    name="fitness"
                    size={14}
                    color={theme.colors.text}
                  />
                  <Text style={styles.metricText}>
                    {current.targetReps} reps
                  </Text>
                </View>
              )}
              {current.durationSeconds != null && (
                <View style={styles.metricChip}>
                  <Ionicons
                    name="timer-outline"
                    size={14}
                    color={theme.colors.text}
                  />
                  <Text style={styles.metricText}>
                    {current.durationSeconds}s
                  </Text>
                </View>
              )}
            </View>
          )}

        {/* Note */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    ...theme.shadows.md
  },
  accentBar: {
    height: 4,
    width: "100%"
  },
  content: {
    padding: theme.spacing.lg
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg
  },
  phaseChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full
  },
  phaseChipText: {
    ...theme.typography.small,
    fontFamily: theme.fonts.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  setBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full
  },
  setBadgeText: {
    ...theme.typography.captionBold,
    color: theme.colors.primaryTextOn,
    letterSpacing: 0.5
  },
  timerContainer: {
    alignItems: "center",
    marginVertical: theme.spacing.lg
  },
  circularProgressBg: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  circularProgressFill: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent"
  },
  timerContent: {
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.xs
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    textAlign: "center"
  },
  timerHero: {
    fontSize: 56,
    fontFamily: theme.fonts.bold,
    fontVariant: ["tabular-nums"],
    color: theme.colors.text,
    textAlign: "center",
    letterSpacing: -1
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg
  },
  metricChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md
  },
  metricText: {
    ...theme.typography.captionBold,
    color: theme.colors.text
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
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

export default FocusCard;
