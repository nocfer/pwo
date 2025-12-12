import { useChallengeProgress, usePrograms } from "@/hooks/data";
import { theme } from "@/theme/theme";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ProgressCard from "./ProgressCard";
import ProgressStats from "./ProgressStats";

type Props = {
  challengeId: string;
};

export default function ChallengeProgressView({ challengeId }: Props) {
  const { data: programs } = usePrograms();
  const challenge = useMemo(
    () => programs?.find((p) => p.id === challengeId && p.challengeConfig),
    [programs, challengeId]
  );
  const { metrics, loading } = useChallengeProgress(challenge || undefined);

  if (loading || !metrics) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading progress...</Text>
      </View>
    );
  }

  const stats = [
    {
      label: "Total Reps",
      value: metrics.totalRepsCompleted
    },
    {
      label: "Target Reps",
      value: metrics.targetReps
    },
    {
      label: "Current Streak",
      value: `${metrics.currentStreak} days`
    },
    {
      label: "Sessions Done",
      value: `${metrics.sessionsCompleted}/${metrics.totalSessions}`
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ProgressCard
        title={challenge?.name || "Challenge"}
        completionPercentage={metrics.completionPercentage}
        sessionsCompleted={metrics.sessionsCompleted}
        totalSessions={metrics.totalSessions}
        variant="challenge"
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reps Progress</Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(100, metrics.repsProgressPercentage)}%`,
                backgroundColor: theme.colors.success
              }
            ]}
          />
        </View>
        <Text style={styles.caption}>
          {metrics.totalRepsCompleted} / {metrics.targetReps} reps (
          {Math.round(metrics.repsProgressPercentage)}%)
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <ProgressStats stats={stats} columns={2} />
      </View>

      {metrics.nextSessionIndex && (
        <View style={styles.nextSession}>
          <Text style={styles.nextSessionLabel}>Next Session</Text>
          <Text style={styles.nextSessionValue}>
            Session {metrics.nextSessionIndex}
          </Text>
        </View>
      )}

      {metrics.isCompleted && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓ Challenge Completed!</Text>
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
  progressBarContainer: {
    height: 12,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    overflow: "hidden"
  },
  progressBar: {
    height: "100%",
    borderRadius: theme.radius.md
  },
  caption: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs
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
