/**
 * ProgressViewBase - Shared progress view structure
 *
 * Eliminates duplication between ChallengeProgressView and ProgramProgressView
 * by providing a common layout for progress display.
 */

import { theme } from "@/theme/theme";
import React, { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ProgressCard from "./ProgressCard";
import ProgressStats from "./ProgressStats";

export type StatItem = {
  label: string;
  value: string | number;
  icon?: string;
};

type Props = {
  /** Display loading state */
  loading?: boolean;
  /** Title for the progress card */
  title: string;
  /** Overall completion percentage (0-100) */
  completionPercentage: number;
  /** Number of sessions completed */
  sessionsCompleted: number;
  /** Total number of sessions */
  totalSessions: number;
  /** Visual variant */
  variant: "program" | "challenge";
  /** Statistics to display */
  stats: StatItem[];
  /** Columns for stats grid */
  statsColumns?: 2 | 3;
  /** Stats section title */
  statsSectionTitle?: string;
  /** Next session index to display (null if none) */
  nextSessionIndex?: number | null;
  /** Whether the entire program/challenge is completed */
  isCompleted?: boolean;
  /** Completion message */
  completedMessage?: string;
  /** Additional content to render before stats */
  children?: ReactNode;
};

export function ProgressViewBase({
  loading = false,
  title,
  completionPercentage,
  sessionsCompleted,
  totalSessions,
  variant,
  stats,
  statsColumns = 2,
  statsSectionTitle = "Statistics",
  nextSessionIndex,
  isCompleted = false,
  completedMessage,
  children
}: Props) {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading progress...</Text>
      </View>
    );
  }

  const defaultCompletedMessage =
    variant === "challenge" ? "Challenge Completed!" : "Program Completed!";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ProgressCard
        title={title}
        completionPercentage={completionPercentage}
        sessionsCompleted={sessionsCompleted}
        totalSessions={totalSessions}
        variant={variant}
      />

      {/* Custom content (e.g., reps progress bar for challenges) */}
      {children}

      {/* Statistics */}
      {stats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{statsSectionTitle}</Text>
          <ProgressStats stats={stats} columns={statsColumns} />
        </View>
      )}

      {/* Next session indicator */}
      {nextSessionIndex && !isCompleted && (
        <View style={styles.nextSession}>
          <Text style={styles.nextSessionLabel}>Next Session</Text>
          <Text style={styles.nextSessionValue}>
            Session {nextSessionIndex}
          </Text>
        </View>
      )}

      {/* Completed badge */}
      {isCompleted && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>
            ✓ {completedMessage ?? defaultCompletedMessage}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    padding: theme.spacing.lg
  },
  section: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  nextSession: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: "center"
  },
  nextSessionLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs
  },
  nextSessionValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold
  },
  completedBadge: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.successLight,
    borderColor: theme.colors.success,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: "center"
  },
  completedText: {
    ...theme.typography.bodyBold,
    color: theme.colors.success
  }
});

export default ProgressViewBase;
