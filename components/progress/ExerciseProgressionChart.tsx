/**
 * ExerciseProgressionChart - Line chart with exercise selector
 */

import {
  useExerciseProgression,
  useExercises,
  useExercisesWithProgression
} from "@/hooks/data";
import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import LineChart from "./LineChart";
import ProgressEmptyState from "./ProgressEmptyState";

type TimeRange = 7 | 30 | 90;

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" }
];

export default function ExerciseProgressionChart() {
  const { data: exercises } = useExercises();
  const { exerciseIds: availableExerciseIds, loading: loadingExercises } =
    useExercisesWithProgression();

  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null
  );
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Set default exercise when available
  useEffect(() => {
    if (!selectedExerciseId && availableExerciseIds.length > 0) {
      setSelectedExerciseId(availableExerciseIds[0]);
    }
  }, [availableExerciseIds, selectedExerciseId]);

  const { data: progressionData, loading: loadingProgression } =
    useExerciseProgression(selectedExerciseId, timeRange);

  useEffect(() => {
    if (!loadingExercises && !loadingProgression) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [loadingExercises, loadingProgression, fadeAnim]);

  // Build exercise options
  const exerciseOptions = useMemo(() => {
    if (!exercises) return [];
    return availableExerciseIds
      .map((id) => {
        const ex = exercises.find((e) => e.id === id);
        return ex ? { id: ex.id, name: ex.name, icon: ex.icon } : null;
      })
      .filter(Boolean) as { id: string; name: string; icon?: string }[];
  }, [exercises, availableExerciseIds]);

  const selectedExercise = exerciseOptions.find(
    (ex) => ex.id === selectedExerciseId
  );

  // Convert progression data for chart
  const chartData = useMemo(() => {
    if (!progressionData?.dataPoints) return [];
    return progressionData.dataPoints.map((dp) => ({
      date: dp.date,
      value: progressionData.hasWeightData && dp.maxWeight ? dp.maxWeight : dp.reps,
      label: new Date(dp.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      })
    }));
  }, [progressionData]);

  const loading = loadingExercises || loadingProgression;

  if (loading && !progressionData) {
    return (
      <View style={styles.card}>
        <View style={styles.skeleton} />
      </View>
    );
  }

  if (exerciseOptions.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Progression</Text>
        </View>
        <ProgressEmptyState type="no-exercise-data" />
      </View>
    );
  }

  const trend = progressionData?.trend;
  const trendIcon =
    trend?.direction === "up"
      ? "trending-up"
      : trend?.direction === "down"
        ? "trending-down"
        : "remove";
  const trendColor =
    trend?.direction === "up"
      ? theme.colors.success
      : trend?.direction === "down"
        ? theme.colors.danger
        : theme.colors.muted;

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Progression</Text>
      </View>

      {/* Exercise selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.exerciseSelector}
        contentContainerStyle={styles.exerciseSelectorContent}
      >
        {exerciseOptions.map((ex) => (
          <Pressable
            key={ex.id}
            onPress={() => setSelectedExerciseId(ex.id)}
            style={({ pressed }) => [
              styles.exerciseChip,
              selectedExerciseId === ex.id && styles.exerciseChipSelected,
              pressed && styles.exerciseChipPressed
            ]}
          >
            <Text
              style={[
                styles.exerciseChipText,
                selectedExerciseId === ex.id && styles.exerciseChipTextSelected
              ]}
              numberOfLines={1}
            >
              {ex.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Time range selector */}
      <View style={styles.timeRangeRow}>
        {TIME_RANGES.map((range) => (
          <Pressable
            key={range.value}
            onPress={() => setTimeRange(range.value)}
            style={[
              styles.timeRangeChip,
              timeRange === range.value && styles.timeRangeChipSelected
            ]}
          >
            <Text
              style={[
                styles.timeRangeText,
                timeRange === range.value && styles.timeRangeTextSelected
              ]}
            >
              {range.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Chart */}
      {chartData.length > 0 ? (
        <>
          <LineChart
            data={chartData}
            height={180}
            valueFormatter={(v) =>
              progressionData?.hasWeightData ? `${v}kg` : `${v}`
            }
          />

          {/* Trend indicator */}
          {trend && trend.direction !== "stable" && (
            <View style={styles.trendContainer}>
              <Ionicons name={trendIcon as any} size={18} color={trendColor} />
              <Text style={[styles.trendText, { color: trendColor }]}>
                {trend.direction === "up" ? "+" : ""}
                {trend.delta}{" "}
                {progressionData?.hasWeightData ? "kg" : "reps"} vs earlier
              </Text>
            </View>
          )}
        </>
      ) : (
        <ProgressEmptyState
          type="no-exercise-data"
          exerciseName={selectedExercise?.name}
        />
      )}
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
    marginBottom: theme.spacing.md
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  exerciseSelector: {
    marginBottom: theme.spacing.md,
    marginHorizontal: -theme.spacing.lg
  },
  exerciseSelectorContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm
  },
  exerciseChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  exerciseChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  exerciseChipPressed: {
    opacity: 0.8
  },
  exerciseChipText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium
  },
  exerciseChipTextSelected: {
    color: theme.colors.primaryTextOn
  },
  timeRangeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md
  },
  timeRangeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card
  },
  timeRangeChipSelected: {
    backgroundColor: theme.colors.primaryLight
  },
  timeRangeText: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  timeRangeTextSelected: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  trendText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium
  },
  skeleton: {
    height: 300,
    backgroundColor: theme.colors.skeleton,
    borderRadius: theme.radius.md
  }
});

