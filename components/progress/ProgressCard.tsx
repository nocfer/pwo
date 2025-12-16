import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
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
        <View style={styles.titleRow}>
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor:
                  variant === "challenge"
                    ? theme.colors.successLight
                    : theme.colors.primaryLight
              }
            ]}
          >
            <Ionicons
              name={variant === "challenge" ? "trophy" : "barbell"}
              size={18}
              color={
                variant === "challenge"
                  ? theme.colors.success
                  : theme.colors.primary
              }
            />
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.percentagePill}>
          <Ionicons
            name="sparkles"
            size={14}
            color={theme.colors.primaryTextOn}
            style={{ marginRight: theme.spacing.xs }}
          />
          <Text style={styles.percentage}>{percentage}%</Text>
        </View>
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
      <View style={styles.captionRow}>
        <Text style={styles.caption}>
          {sessionsCompleted} of {totalSessions} sessions
        </Text>
        <Text style={styles.captionMuted}>
          {sessionsCompleted === 0
            ? "Let’s get started"
            : percentage >= 100
              ? "Run complete"
              : "Keep going"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.sm
  },
  title: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flex: 1
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center"
  },
  percentagePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary
  },
  percentage: {
    ...theme.typography.h3,
    color: theme.colors.primaryTextOn,
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
  captionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.xs
  },
  caption: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  captionMuted: {
    ...theme.typography.caption,
    color: theme.colors.subtext
  }
});
