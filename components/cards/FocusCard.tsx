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
  sessionTimer?: number;
  timerEnabled?: boolean;
};

export function FocusCard({
  phaseAccent,
  phaseBg,
  subTitle,
  phaseChipText,
  title,
  icon,
  current,
  sessionTimer,
  timerEnabled = false
}: FocusCardProps) {
  return (
    <View
      style={[
        styles.container,
        { borderColor: phaseAccent, backgroundColor: phaseBg }
      ]}
    >
      {/* Header */}
      <View style={styles.topRow}>
        <View style={styles.headerGroup}>
          <View
            style={[styles.iconSmall, { backgroundColor: `${phaseAccent}20` }]}
          >
            <Ionicons name={icon as any} size={18} color={phaseAccent} />
          </View>
          <Text style={[styles.phaseChipText, { color: phaseAccent }]}>
            {phaseChipText}
          </Text>
        </View>
      </View>

      <Text style={timerEnabled ? styles.timerHero : styles.title}>
        {title}
      </Text>
      <Text style={styles.subtitle}>{subTitle}</Text>

      {current?.type === "exercise" && (
        <View style={styles.metrics}>
          {current.targetReps != null && (
            <View style={styles.metric}>
              <Ionicons name="repeat" size={14} color={theme.colors.muted} />
              <Text style={styles.metricText}>{current.targetReps} reps</Text>
            </View>
          )}
          {current.durationSeconds != null && (
            <View style={styles.metric}>
              <Ionicons
                name="time-outline"
                size={14}
                color={theme.colors.muted}
              />
              <Text style={styles.metricText}>{current.durationSeconds}s</Text>
            </View>
          )}
        </View>
      )}

      {current?.type === "exercise" && current.note && (
        <View style={styles.noteContainer}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={theme.colors.subtext}
          />
          <Text style={styles.note}>{current.note}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.sm
  },
  topRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md
  },
  headerGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs
  },
  iconSmall: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.xs,
    alignItems: "center",
    justifyContent: "center"
  },
  phaseChipText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: "center"
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center"
  },
  metrics: {
    flexDirection: "row",
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    justifyContent: "center"
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs
  },
  metricText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight
  },
  note: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    flex: 1,
    lineHeight: 18
  },
  timerHero: {
    fontSize: 42,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
    marginBottom: theme.spacing.sm,
    textAlign: "center",
    color: theme.colors.text
  }
});

export default FocusCard;
