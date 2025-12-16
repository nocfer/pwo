/**
 * ConsistencyHeatmap - GitHub-style activity heatmap
 * Layout: Days as rows (M-S), Weeks as columns (oldest left, newest right)
 */

import {
  getDayLabels,
  useConsistencyData,
  type ConsistencyLevel
} from "@/hooks/data";
import { theme } from "@/theme/theme";
import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { CompactEmptyState } from "./ProgressEmptyState";

type Props = {
  weeks?: number;
};

const CELL_SIZE = 24;
const CELL_GAP = 3;

const levelColors: Record<ConsistencyLevel, string> = {
  0: theme.colors.card,
  1: theme.colors.successLight,
  2: theme.colors.success,
  3: "#059669" // emerald-600 for high activity
};

export default function ConsistencyHeatmap({ weeks = 12 }: Props) {
  const { data, loading } = useConsistencyData(weeks);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading && data) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }).start();
    }
  }, [loading, data, fadeAnim]);

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.skeleton} />
      </View>
    );
  }

  if (!data || data.totalWorkouts === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Consistency</Text>
          <Text style={styles.subtitle}>Last {weeks} weeks</Text>
        </View>
        <CompactEmptyState message="No workout history yet" icon="calendar-outline" />
      </View>
    );
  }

  const dayLabels = getDayLabels();

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Consistency</Text>
        <Text style={styles.subtitle}>
          {data.activeDays} active days
        </Text>
      </View>

      <View style={styles.gridContainer}>
        {/* Day labels column */}
        <View style={styles.dayLabelsColumn}>
          {dayLabels.map((label, i) => (
            <View key={i} style={styles.dayLabelCell}>
              <Text style={styles.dayLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Weeks grid - horizontally scrollable */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weeksScrollContent}
        >
          {data.weeks.map((week) => (
            <View key={week.weekNumber} style={styles.weekColumn}>
              {week.days.map((day, dayIndex) => (
                <View
                  key={`${week.weekNumber}-${dayIndex}`}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: day.isFuture
                        ? "transparent"
                        : levelColors[day.level]
                    },
                    day.isFuture && styles.cellFuture,
                    day.isToday && styles.cellToday
                  ]}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Less</Text>
        {([0, 1, 2, 3] as ConsistencyLevel[]).map((level) => (
          <View
            key={level}
            style={[styles.legendCell, { backgroundColor: levelColors[level] }]}
          />
        ))}
        <Text style={styles.legendLabel}>More</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  gridContainer: {
    flexDirection: "row"
  },
  dayLabelsColumn: {
    marginRight: theme.spacing.xs,
    gap: CELL_GAP
  },
  dayLabelCell: {
    height: CELL_SIZE,
    justifyContent: "center"
  },
  dayLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontSize: 10,
    width: 16,
    textAlign: "right"
  },
  weeksScrollContent: {
    flexDirection: "row",
    gap: CELL_GAP
  },
  weekColumn: {
    gap: CELL_GAP
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4
  },
  cellFuture: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: "dashed"
  },
  cellToday: {
    borderWidth: 2,
    borderColor: theme.colors.primary
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  legendLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontSize: 10
  },
  legendCell: {
    width: 14,
    height: 14,
    borderRadius: 3
  },
  skeleton: {
    height: 220,
    backgroundColor: theme.colors.skeleton,
    borderRadius: theme.radius.md
  }
});

