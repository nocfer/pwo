/**
 * Enhanced Exercise Progression Chart
 *
 * Features:
 * - Interactive exercise selection
 * - PR highlighting
 * - Chart export functionality
 * - Multiple metrics (reps, weight, volume)
 */

import {
  useExerciseProgression,
  useExercisePRs,
  useExercisesWithProgression
} from "@/hooks/data";
import { useExercises } from "@/hooks/data/useExercises";
import { haptics } from "@/lib/haptics";
import { theme } from "@/theme/theme";
import { Exercise, PersonalRecord } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

type MetricType = "reps" | "weight" | "volume";
type TimeRange = "7d" | "30d" | "90d";

interface ChartProps {
  selectedExerciseId?: string;
  onExerciseChange?: (exerciseId: string) => void;
  showExport?: boolean;
}

export function EnhancedExerciseProgressionChart({
  selectedExerciseId,
  onExerciseChange,
  showExport = true
}: ChartProps) {
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("reps");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const { exerciseIds } = useExercisesWithProgression();
  const { data: exercises } = useExercises();
  const { data: progressionData, loading } = useExerciseProgression(
    selectedExerciseId || null,
    timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
  );
  const { prs: exercisePRs } = useExercisePRs(selectedExerciseId || "");

  const exercisesWithProgression =
    exercises?.filter((ex) => exerciseIds.includes(ex.id)) || [];

  const selectedExercise = exercises?.find(
    (ex) => ex.id === selectedExerciseId
  );

  const handleExerciseSelect = useCallback(
    (exercise: Exercise) => {
      onExerciseChange?.(exercise.id);
      setShowExerciseSelector(false);
      void haptics.tabSwitch();
    },
    [onExerciseChange]
  );

  const handleMetricChange = useCallback((metric: MetricType) => {
    setSelectedMetric(metric);
    void haptics.tabSwitch();
  }, []);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
    void haptics.tabSwitch();
  }, []);

  const handleExport = useCallback(async () => {
    if (!selectedExercise || !progressionData) {
      void haptics.formValidationError();
      return;
    }

    try {
      // Create CSV data
      const csvHeader = "Date,Reps,Weight,Volume\n";
      const csvData = progressionData.dataPoints
        .map(
          (point) =>
            `${point.date},${point.reps},${point.maxWeight || ""},${point.volume || ""}`
        )
        .join("\n");

      const csvContent = csvHeader + csvData;

      // For now, just log the export (in a real app, this would use sharing APIs)
      console.log("Exporting chart data:", {
        exercise: selectedExercise.name,
        metric: selectedMetric,
        timeRange,
        data: csvContent
      });

      void haptics.exportData();
    } catch (error) {
      console.error("Export failed:", error);
      void haptics.formValidationError();
    }
  }, [selectedExercise, progressionData, selectedMetric, timeRange]);

  const renderExerciseSelector = () => (
    <Modal
      visible={showExerciseSelector}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Exercise</Text>
          <TouchableOpacity
            onPress={() => setShowExerciseSelector(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.exerciseList}>
          {exercisesWithProgression.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={[
                styles.exerciseItem,
                selectedExerciseId === exercise.id &&
                  styles.exerciseItemSelected
              ]}
              onPress={() => handleExerciseSelect(exercise)}
            >
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseCategory}>{exercise.category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  const renderChart = () => {
    if (loading) {
      return (
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>Loading chart...</Text>
        </View>
      );
    }

    if (!progressionData || progressionData.dataPoints.length === 0) {
      return (
        <View style={styles.chartPlaceholder}>
          <Ionicons
            name="bar-chart-outline"
            size={48}
            color={theme.colors.muted}
          />
          <Text style={styles.placeholderText}>
            No progression data available
          </Text>
          {!selectedExerciseId && (
            <Text style={styles.placeholderSubtext}>
              Select an exercise to view progression
            </Text>
          )}
        </View>
      );
    }

    const { dataPoints, trend } = progressionData;
    const maxValue = Math.max(
      ...dataPoints.map((dp) => {
        switch (selectedMetric) {
          case "weight":
            return dp.maxWeight || 0;
          case "volume":
            return dp.volume || 0;
          case "reps":
          default:
            return dp.reps;
        }
      }),
      1
    );

    return (
      <View style={styles.chartContainer}>
        {/* Trend Indicator */}
        <View style={styles.trendContainer}>
          <Ionicons
            name={
              trend.direction === "up"
                ? "trending-up"
                : trend.direction === "down"
                  ? "trending-down"
                  : "remove"
            }
            size={20}
            color={
              trend.direction === "up"
                ? theme.colors.success
                : trend.direction === "down"
                  ? theme.colors.danger
                  : theme.colors.muted
            }
          />
          <Text
            style={[
              styles.trendText,
              {
                color:
                  trend.direction === "up"
                    ? theme.colors.success
                    : trend.direction === "down"
                      ? theme.colors.danger
                      : theme.colors.muted
              }
            ]}
          >
            {trend.direction === "stable"
              ? "Stable"
              : `${trend.direction === "up" ? "+" : ""}${trend.percentChange.toFixed(1)}%`}
          </Text>
        </View>

        {/* Chart */}
        <View style={styles.chart}>
          {dataPoints.map((point, index) => {
            const value =
              selectedMetric === "weight"
                ? point.maxWeight || 0
                : selectedMetric === "volume"
                  ? point.volume || 0
                  : point.reps;
            const height = (value / maxValue) * 100;

            // Check if this data point represents a PR
            const isPR = exercisePRs.some((pr: PersonalRecord) => {
              const prDate = new Date(pr.achievedAt)
                .toISOString()
                .split("T")[0];
              return (
                prDate === point.date &&
                ((selectedMetric === "reps" && pr.type === "max_reps") ||
                  (selectedMetric === "weight" && pr.type === "max_weight") ||
                  (selectedMetric === "volume" && pr.type === "max_volume"))
              );
            });

            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${height}%`,
                        backgroundColor: isPR
                          ? theme.colors.warning
                          : theme.colors.primary
                      }
                    ]}
                  />
                  {isPR && (
                    <View style={styles.prIndicator}>
                      <Ionicons
                        name="trophy"
                        size={12}
                        color={theme.colors.warning}
                      />
                    </View>
                  )}
                </View>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {new Date(point.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric"
                  })}
                </Text>
                <Text style={[styles.barValue, isPR && styles.prValue]}>
                  {value}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise Progression</Text>
        {showExport && (
          <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
            <Ionicons
              name="share-outline"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Exercise Selection */}
      <TouchableOpacity
        style={styles.exerciseSelector}
        onPress={() => setShowExerciseSelector(true)}
      >
        <Text style={styles.exerciseSelectorText}>
          {selectedExercise ? selectedExercise.name : "Select Exercise"}
        </Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.muted} />
      </TouchableOpacity>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Metric Selection */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Metric</Text>
          <View style={styles.controlRow}>
            {(["reps", "weight", "volume"] as MetricType[]).map((metric) => (
              <TouchableOpacity
                key={metric}
                style={[
                  styles.controlChip,
                  selectedMetric === metric && styles.controlChipActive,
                  metric === "weight" &&
                    !progressionData?.hasWeightData &&
                    styles.controlChipDisabled
                ]}
                onPress={() => handleMetricChange(metric)}
                disabled={
                  metric === "weight" && !progressionData?.hasWeightData
                }
              >
                <Text
                  style={[
                    styles.controlChipText,
                    selectedMetric === metric && styles.controlChipTextActive,
                    metric === "weight" &&
                      !progressionData?.hasWeightData &&
                      styles.controlChipTextDisabled
                  ]}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Range Selection */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Period</Text>
          <View style={styles.controlRow}>
            {(["7d", "30d", "90d"] as TimeRange[]).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.controlChip,
                  timeRange === range && styles.controlChipActive
                ]}
                onPress={() => handleTimeRangeChange(range)}
              >
                <Text
                  style={[
                    styles.controlChipText,
                    timeRange === range && styles.controlChipTextActive
                  ]}
                >
                  {range.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Chart */}
      {renderChart()}

      {/* Legend */}
      {progressionData && progressionData.dataPoints.length > 0 && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: theme.colors.primary }
              ]}
            />
            <Text style={styles.legendText}>Regular</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: theme.colors.warning }
              ]}
            />
            <Ionicons name="trophy" size={12} color={theme.colors.warning} />
            <Text style={styles.legendText}>Personal Record</Text>
          </View>
        </View>
      )}

      {/* Exercise Selector Modal */}
      {renderExerciseSelector()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
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
  exportButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight
  },
  exerciseSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md
  },
  exerciseSelectorText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium
  },
  controls: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg
  },
  controlGroup: {
    gap: theme.spacing.sm
  },
  controlLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  controlRow: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  controlChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  controlChipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary
  },
  controlChipDisabled: {
    opacity: 0.5
  },
  controlChipText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium
  },
  controlChipTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  controlChipTextDisabled: {
    color: theme.colors.muted
  },
  chartContainer: {
    height: 200
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md
  },
  trendText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "100%",
    gap: theme.spacing.xs
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    height: "100%"
  },
  barWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    marginBottom: theme.spacing.xs
  },
  bar: {
    width: "100%",
    minHeight: 4,
    borderRadius: theme.radius.sm
  },
  prIndicator: {
    position: "absolute",
    top: -16,
    left: "50%",
    marginLeft: -6,
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.radius.sm,
    padding: 2
  },
  barLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontSize: 10,
    textAlign: "center"
  },
  barValue: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    marginTop: 2
  },
  prValue: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bold
  },
  chartPlaceholder: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm
  },
  placeholderText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center"
  },
  placeholderSubtext: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textAlign: "center"
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text
  },
  modalCloseButton: {
    padding: theme.spacing.sm
  },
  exerciseList: {
    flex: 1,
    padding: theme.spacing.lg
  },
  exerciseItem: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  exerciseItemSelected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary
  },
  exerciseName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    marginBottom: theme.spacing.xs
  },
  exerciseCategory: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textTransform: "capitalize"
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: theme.radius.sm
  },
  legendText: {
    ...theme.typography.caption,
    color: theme.colors.muted
  }
});
