/**
 * SessionListItem - Reusable session row component
 */

import { formatCount } from "@/lib/utils/format";
import { theme } from "@/theme/theme";
import type { ProgramSession } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  session: ProgramSession;
  isCompleted?: boolean;
  isLocked?: boolean;
  isNext?: boolean;
  onPress?: () => void;
  subtitle?: string;
};

export function SessionListItem({
  session,
  isCompleted = false,
  isLocked = false,
  isNext = false,
  onPress,
  subtitle
}: Props) {
  const defaultSubtitle = (() => {
    const exerciseBlocks = session.blocks.filter((b) => b.type === "exercise");
    const totalReps = exerciseBlocks.reduce(
      (sum, b) => sum + (b.targetReps ?? 0),
      0
    );
    const setsCount = exerciseBlocks.length;
    return `${formatCount(setsCount, "set")} • ${totalReps} target reps`;
  })();

  const displaySubtitle = subtitle ?? defaultSubtitle;
  const title = session.name || `Session ${session.index}`;

  return (
    <Pressable
      onPress={onPress}
      disabled={isLocked || !onPress}
      style={({ pressed }) => [
        styles.container,
        isCompleted && styles.containerCompleted,
        isLocked && styles.containerLocked,
        pressed && !isLocked && styles.containerPressed
      ]}
    >
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {isCompleted && (
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={theme.colors.success}
            />
          )}
          {isNext && !isCompleted && (
            <View style={styles.nextPill}>
              <Text style={styles.nextPillText}>Next</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>{displaySubtitle}</Text>
      </View>
      <Ionicons
        name={isLocked ? "lock-closed" : "chevron-forward"}
        size={16}
        color={theme.colors.muted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm
  },
  containerPressed: {
    backgroundColor: theme.colors.background,
    transform: [{ scale: 0.98 }]
  },
  containerCompleted: {
    backgroundColor: theme.colors.successLight
  },
  containerLocked: {
    opacity: 0.5
  },
  content: {
    flex: 1
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs
  },
  title: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs
  },
  nextPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight
  },
  nextPillText: {
    ...theme.typography.small,
    color: theme.colors.primary
  }
});

export default SessionListItem;
