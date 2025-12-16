import { useProgramProgress, usePrograms } from "@/hooks/data";
import { formatDuration } from "@/lib/utils/format";
import { theme } from "@/theme/theme";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ProgressViewBase } from "./ProgressViewBase";

type Props = {
  programId: string;
};

export default function ProgramProgressView({ programId }: Props) {
  const { data: programs } = usePrograms();
  const program = useMemo(
    () => programs?.find((p) => p.id === programId && !p.challengeConfig),
    [programs, programId]
  );
  const { metrics, loading } = useProgramProgress(program || undefined);

  const stats = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        label: "Total Time",
        value: formatDuration(metrics.lifetimeTimeSpentSeconds)
      },
      {
        label: "Avg. Session",
        value: formatDuration(metrics.averageTimePerSessionSeconds)
      },
      { label: "Current Streak", value: `${metrics.currentStreak} days` },
      {
        label: "Sessions Done",
        value: `${metrics.currentRunSessionsCompleted}/${metrics.totalSessions}`
      }
    ];
  }, [metrics]);

  // Exercise completion as custom content
  const exerciseContent =
    metrics && metrics.exerciseCompletion.size > 0 ? (
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
    ) : null;

  return (
    <ProgressViewBase
      loading={loading || !metrics}
      title={program?.name || "Program"}
      completionPercentage={metrics?.currentRunCompletionPercentage ?? 0}
      sessionsCompleted={metrics?.currentRunSessionsCompleted ?? 0}
      totalSessions={metrics?.totalSessions ?? 0}
      variant="program"
      stats={stats}
      statsSectionTitle="Time Statistics"
      nextSessionIndex={metrics?.nextSessionIndex}
      isCompleted={metrics?.isCurrentRunCompleted}
    >
      {exerciseContent}
    </ProgressViewBase>
  );
}

const styles = StyleSheet.create({
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
  }
});
