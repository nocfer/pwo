import { theme } from "@/theme/theme";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  completionPercentage: number;
  sessionsCompleted: number;
  totalSessions: number;
  variant?: "challenge" | "program";
};

export default function ProgressCard({
  title,
  completionPercentage,
  sessionsCompleted,
  totalSessions,
  variant = "program"
}: Props) {
  const percentage = Math.round(completionPercentage);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${percentage}%`,
              backgroundColor:
                variant === "challenge"
                  ? theme.colors.success
                  : theme.colors.primary
            }
          ]}
        />
      </View>
      <Text style={styles.caption}>
        {sessionsCompleted} of {totalSessions} sessions completed
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm
  },
  title: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flex: 1
  },
  percentage: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.sm,
    overflow: "hidden",
    marginBottom: theme.spacing.xs
  },
  progressBar: {
    height: "100%",
    borderRadius: theme.radius.sm
  },
  caption: {
    ...theme.typography.caption,
    color: theme.colors.muted
  }
});
