import {
  ChallengeProgressView,
  ProgramProgressView,
  ProgressCalendar,
  ProgressStats,
  RepsProgressionChart,
  SessionsCompletedChart,
} from "@/components";
import { useAllProgress, usePrograms } from "@/hooks/data";
import { haptics } from "@/lib/haptics";
import { theme } from "@/theme/theme";
import { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function ProgressScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: aggregated, loading } = useAllProgress();
  const { data: programs } = usePrograms();

  const challenges = useMemo(() => {
    if (!programs) return [];
    return programs.filter((p) => p.challengeConfig);
  }, [programs]);

  const regularPrograms = useMemo(() => {
    if (!programs) return [];
    return programs.filter((p) => !p.challengeConfig);
  }, [programs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    void haptics.refresh();
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  const overviewStats = useMemo(() => {
    if (!aggregated) return [];
    return [
      {
        label: "Total Workouts",
        value: aggregated.totalWorkoutsCompleted,
      },
      {
        label: "Total Time",
        value: formatTime(aggregated.totalTimeSpentSeconds),
      },
      {
        label: "Current Streak",
        value: `${aggregated.currentStreak} days`,
      },
      {
        label: "Active Programs",
        value: aggregated.activePrograms + aggregated.activeChallenges,
      },
    ];
  }, [aggregated]);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Track your fitness journey</Text>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <Text style={styles.muted}>Loading progress...</Text>
          </View>
        ) : (
          <>
            {aggregated && overviewStats.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Overview</Text>
                <ProgressStats stats={overviewStats} columns={2} />
              </View>
            )}

            {challenges.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Challenges</Text>
                {challenges.slice(0, 3).map((challenge) => (
                  <View key={challenge.id} style={styles.progressItem}>
                    <ChallengeProgressView challengeId={challenge.id} />
                  </View>
                ))}
              </View>
            )}

            {regularPrograms.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Programs</Text>
                {regularPrograms.slice(0, 3).map((program) => (
                  <View key={program.id} style={styles.progressItem}>
                    <ProgramProgressView programId={program.id} />
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity Calendar</Text>
              <ProgressCalendar />
            </View>

            {challenges.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reps Progression</Text>
                <RepsProgressionChart
                  challengeId={challenges[0]?.id}
                  days={30}
                />
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sessions Completed</Text>
              <SessionsCompletedChart days={30} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  loading: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  progressItem: {
    marginBottom: theme.spacing.md,
  },
});
