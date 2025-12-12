import { storage } from "@/lib/storage";
import { theme } from "@/theme/theme";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  programId?: string;
  challengeId?: string;
  days?: number; // Number of days to show
};

type ChartDataPoint = {
  date: string;
  value: number;
  label: string;
};

export function RepsProgressionChart({
  challengeId,
  days = 30,
}: {
  challengeId?: string;
  days?: number;
}) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const history = await storage.getProgressHistory(
          undefined,
          challengeId,
          days,
        );

        if (!mounted) return;

        // Group by date and sum reps
        const byDate = new Map<string, number>();
        history.forEach((entry) => {
          if (entry.totalReps) {
            const existing = byDate.get(entry.date) || 0;
            byDate.set(entry.date, existing + entry.totalReps);
          }
        });

        const sorted = Array.from(byDate.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, value]) => ({
            date,
            value,
            label: new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          }));

        setData(sorted);
      } catch (e) {
        console.error("Failed to load chart data", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (challengeId) {
      loadData();
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [challengeId, days]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading chart...</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reps Progression</Text>
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {data.map((point, index) => {
            const height = (point.value / maxValue) * 100;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${height}%`,
                        backgroundColor: theme.colors.success,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {point.label}
                </Text>
                <Text style={styles.barValue}>{point.value}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function SessionsCompletedChart({
  programId,
  challengeId,
  days = 30,
}: Props) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const history = await storage.getProgressHistory(
          programId,
          challengeId,
          days,
        );

        if (!mounted) return;

        // Group by date and sum sessions
        const byDate = new Map<string, number>();
        history.forEach((entry) => {
          const existing = byDate.get(entry.date) || 0;
          byDate.set(entry.date, existing + entry.sessionsCompleted);
        });

        const sorted = Array.from(byDate.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, value]) => ({
            date,
            value,
            label: new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          }));

        setData(sorted);
      } catch (e) {
        console.error("Failed to load chart data", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [programId, challengeId, days]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading chart...</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sessions Completed</Text>
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {data.map((point, index) => {
            const height = (point.value / maxValue) * 100;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${height}%`,
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {point.label}
                </Text>
                <Text style={styles.barValue}>{point.value}</Text>
              </View>
            );
          })}
        </View>
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
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    padding: theme.spacing.lg,
  },
  chartContainer: {
    height: 200,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "100%",
    gap: theme.spacing.xs,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    height: "100%",
  },
  barWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    marginBottom: theme.spacing.xs,
  },
  bar: {
    width: "100%",
    minHeight: 4,
    borderRadius: theme.radius.xs,
  },
  barLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontSize: 10,
    textAlign: "center",
  },
  barValue: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    marginTop: 2,
  },
});
