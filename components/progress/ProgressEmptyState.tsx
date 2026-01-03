/**
 * ProgressEmptyState - Beautiful empty states for progress components
 */

import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type EmptyStateType =
  | "no-workouts"
  | "no-prs"
  | "no-exercise-data"
  | "no-consistency";

type Props = {
  type: EmptyStateType;
  exerciseName?: string;
  onAction?: () => void;
  actionLabel?: string;
};

const emptyStates: Record<
  EmptyStateType,
  { icon: string; title: string; description: string }
> = {
  "no-workouts": {
    icon: "fitness-outline",
    title: "Start your week strong!",
    description: "Complete your first workout to track your progress."
  },
  "no-prs": {
    icon: "trophy-outline",
    title: "Your PRs will appear here",
    description: "Keep training to set your first personal records!"
  },
  "no-exercise-data": {
    icon: "bar-chart-outline",
    title: "No data yet",
    description:
      "Complete a session with this exercise to see your progression."
  },
  "no-consistency": {
    icon: "calendar-outline",
    title: "Build your streak",
    description: "Work out regularly to fill up your consistency grid."
  }
};

export default function ProgressEmptyState({
  type,
  exerciseName,
  onAction,
  actionLabel
}: Props) {
  const state = emptyStates[type];

  // Customize description if exercise name provided
  const description =
    type === "no-exercise-data" && exerciseName
      ? `Complete a session with ${exerciseName} to see your progression.`
      : state.description;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={state.icon as any}
          size={48}
          color={theme.colors.muted}
        />
      </View>
      <Text style={styles.title}>{state.title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onAction && actionLabel && (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={onAction}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Compact empty state for inline use
 */
export function CompactEmptyState({
  message,
  icon = "information-circle-outline"
}: {
  message: string;
  icon?: string;
}) {
  return (
    <View style={styles.compactContainer}>
      <Ionicons name={icon as any} size={20} color={theme.colors.muted} />
      <Text style={styles.compactText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.xs
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    maxWidth: 280
  },
  button: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg
  },
  buttonPressed: {
    opacity: 0.9
  },
  buttonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg
  },
  compactText: {
    ...theme.typography.body,
    color: theme.colors.muted
  }
});
