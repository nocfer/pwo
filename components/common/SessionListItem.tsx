/**
 * SessionListItem - Reusable session row component
 *
 * Consolidates the duplicate session row pattern from ChallengeView.tsx and others
 */

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
  /** Optional subtitle override - defaults to showing sets and reps info */
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
  // Calculate default subtitle from blocks
  const defaultSubtitle = (() => {
    const exerciseBlocks = session.blocks.filter((b) => b.type === "exercise");
    const totalReps = exerciseBlocks.reduce(
      (sum, b) => sum + (b.targetReps ?? 0),
      0
    );
    const setsCount = exerciseBlocks.length;
    return `${setsCount} set${setsCount === 1 ? "" : "s"} • ${totalReps} target reps`;
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
              size={20}
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
        size={18}
        color={isLocked ? theme.colors.muted : theme.colors.subtext}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    ...theme.presets.sessionRow
  },
  containerPressed: {
    ...theme.presets.sessionRowPressed
  },
  containerCompleted: {
    ...theme.presets.sessionRowCompleted
  },
  containerLocked: {
    ...theme.presets.sessionRowLocked
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
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight
  },
  nextPillText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  }
});

export default SessionListItem;

