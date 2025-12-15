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
};

export default function FocusCard({
  phaseAccent,
  phaseBg,
  subTitle,
  phaseChipText,
  title,
  icon,
  current
}: FocusCardProps) {
  return (
    <View
      style={[
        theme.cards.focus.container,
        {
          borderColor: phaseAccent,
          backgroundColor: phaseBg
        }
      ]}
    >
      <View style={styles.focusTopRow}>
        <View
          style={[
            styles.focusIconSmall,
            { backgroundColor: phaseAccent + "20" }
          ]}
        >
          <Ionicons name={icon as any} size={20} color={phaseAccent} />
        </View>
        <Text style={[styles.phaseChipText, { color: phaseAccent }]}>
          {phaseChipText}
        </Text>
      </View>
      <Text style={styles.focusTitle}>{title}</Text>
      <Text style={styles.focusSub}>{subTitle}</Text>
      {current?.type === "exercise" && (
        <View style={styles.focusMetrics}>
          {current.targetReps != null && (
            <View style={styles.focusMetric}>
              <Ionicons name="repeat" size={16} color={theme.colors.muted} />
              <Text style={styles.focusMetricText}>
                {current.targetReps} reps
              </Text>
            </View>
          )}
          {current.durationSeconds != null && (
            <View style={styles.focusMetric}>
              <Ionicons
                name="time-outline"
                size={16}
                color={theme.colors.muted}
              />
              <Text style={styles.focusMetricText}>
                {current.durationSeconds}s
              </Text>
            </View>
          )}
        </View>
      )}
      {current?.type === "exercise" && current.note && (
        <View style={styles.focusNoteContainer}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={theme.colors.subtext}
          />
          <Text style={styles.focusNote}>{current.note}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  focusCard: theme.cards.focus.container,
  focusTopRow: theme.cards.focus.topRow,
  focusIconSmall: theme.cards.focus.icons.sm,
  phaseChipText: theme.cards.focus.chipText,
  focusTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: "center"
  },
  focusSub: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center"
  },
  focusMetrics: {
    flexDirection: "row",
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    justifyContent: "center"
  },
  focusMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs
  },
  focusMetricText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold
  },
  focusNoteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  focusNote: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    flex: 1,
    lineHeight: 18
  }
});
