import { useProgramProgress, usePrograms } from "@/hooks/data";
import { theme } from "@/theme/theme";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ProgressCard from "./ProgressCard";
import ProgressStats from "./ProgressStats";

type Props = {
  programId: string;
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function ProgramProgressView({ programId }: Props) {
  const { data: programs } = usePrograms();
  const program = useMemo(
    () => programs?.find((p) => p.id === programId && !p.challengeConfig),
    [programs, programId]
  );
  const { metrics, loading } = useProgramProgress(program || undefined);

  if (loading || !metrics) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading progress...</Text>
      </View>
    );
  }

  const stats = [
    {
      label: "Total Time",
      value: formatTime(metrics.totalTimeSpentSeconds)
    },
    {
      label: "Avg. Session",
      value: formatTime(metrics.averageTimePerSessionSeconds)
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
        title={program?.name || "Program"}
        completionPercentage={metrics.completionPercentage}
        sessionsCompleted={metrics.sessionsCompleted}
        totalSessions={metrics.totalSessions}
        variant="program"
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time Statistics</Text>
        <ProgressStats stats={stats} columns={2} />
      </View>

      {metrics.exerciseCompletion.size > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Progress</Text>
          {Array.from(metrics.exerciseCompletion.entries()).map(
            ([exerciseId, progress]) => (
              <View key={exerciseId} style={styles.exerciseItem}>
                <Text style={styles.exerciseLabel}>Exercise {exerciseId}</Text>
                <View style={styles.exerciseProgress}>
                  <View
                    style={[
                      styles.exerciseProgressBar,
                      {
                        width: `${
                          progress.total > 0
                            ? (progress.completed / progress.total) * 100
                            : 0
                        }%`
                      }
                    ]}
                  />
                </View>
                <Text style={styles.exerciseCaption}>
                  {progress.completed} / {progress.total}
                </Text>
              </View>
            )
          )}
        </View>
      )}

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
          <Text style={styles.completedText}>✓ Program Completed!</Text>
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
  exerciseItem: {
    marginBottom: theme.spacing.md
  },
  exerciseLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  exerciseProgress: {
    height: 6,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.sm,
    overflow: "hidden",
    marginBottom: theme.spacing.xs
  },
  exerciseProgressBar: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm
  },
  exerciseCaption: {
    ...theme.typography.caption,
    color: theme.colors.muted
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
