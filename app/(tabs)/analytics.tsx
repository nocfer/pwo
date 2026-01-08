/**
 * Analytics Tab - Dedicated Progress Visualization Dashboard
 *
 * Provides comprehensive analytics organized by data type:
 * 1. Data type navigation (Programs, Challenges, Exercises)
 * 2. Filtering and customization options
 * 3. Enhanced visualizations with export capabilities
 * 4. Detailed progress metrics and trends
 */

import { Button } from "@/components/common";
import {
  EnhancedExerciseProgressionChart,
  PersonalRecordsCard
} from "@/components/progress";
import {
  RepsProgressionChart,
  SessionsCompletedChart
} from "@/components/progress/ProgressCharts";
import { useAllProgress } from "@/hooks/data";
import { haptics } from "@/lib/haptics";
import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DataType = "programs" | "challenges" | "exercises";
type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";

interface FilterState {
  timeRange: TimeRange;
  showOnlyActive: boolean;
  sortBy: "name" | "recent" | "performance";
}

// Helper function to generate CSV content from progress data
function generateProgressCSV(progressData: any): string {
  const headers = [
    "Date",
    "Type",
    "Activity",
    "Workouts Completed",
    "Total Reps",
    "Time Spent (minutes)",
    "Current Streak"
  ];

  const rows = [
    headers.join(","),
    [
      new Date().toISOString().split("T")[0],
      "Summary",
      "Overall Progress",
      progressData.totalWorkoutsCompleted || 0,
      progressData.totalRepsCompleted || 0,
      Math.round((progressData.totalTimeSpentSeconds || 0) / 60),
      progressData.currentStreak || 0
    ].join(",")
  ];

  // Add recent activity
  if (progressData.recentActivity) {
    progressData.recentActivity.forEach((activity: any) => {
      rows.push(
        [
          activity.date.split("T")[0],
          activity.type,
          `Session ${activity.sessionIndex}`,
          1,
          "",
          "",
          ""
        ].join(",")
      );
    });
  }

  return rows.join("\n");
}

// Helper function to generate progress report
function generateProgressReport(progressData: any): string {
  const totalMinutes = Math.round(
    (progressData.totalTimeSpentSeconds || 0) / 60
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `🏋️ Fitness Progress Report

📊 Overall Stats:
• Workouts Completed: ${progressData.totalWorkoutsCompleted || 0}
• Total Reps: ${progressData.totalRepsCompleted || 0}
• Time Spent: ${hours}h ${minutes}m
• Current Streak: ${progressData.currentStreak || 0} days

🎯 Active Programs: ${progressData.activePrograms || 0}
🏆 Active Challenges: ${progressData.activeChallenges || 0}

Generated on ${new Date().toLocaleDateString()}`;
}

export default function AnalyticsScreen() {
  const [activeTab, setActiveTab] = useState<DataType>("programs");
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    timeRange: "30d",
    showOnlyActive: false,
    sortBy: "recent"
  });

  const { data: allProgress, loading } = useAllProgress();

  // CSV Export functionality
  const handleExportCSV = useCallback(async () => {
    try {
      await haptics.exportData();

      if (!allProgress) {
        Alert.alert("No Data", "No progress data available to export.");
        return;
      }

      // Generate CSV content
      const csvContent = generateProgressCSV(allProgress);

      // Share the CSV content
      await Share.share({
        message: csvContent,
        title: "Progress Data Export"
      });
    } catch (error) {
      Alert.alert("Export Failed", "Could not export progress data.");
    }
  }, [allProgress]);

  // Report Sharing functionality
  const handleShareReport = useCallback(async () => {
    try {
      await haptics.shareData();

      if (!allProgress) {
        Alert.alert("No Data", "No progress data available to share.");
        return;
      }

      // Generate report summary
      const report = generateProgressReport(allProgress);

      await Share.share({
        message: report,
        title: "Progress Report"
      });
    } catch (error) {
      Alert.alert("Share Failed", "Could not share progress report.");
    }
  }, [allProgress]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    void haptics.refresh();
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  }, []);

  const handleTabChange = useCallback((tab: DataType) => {
    setActiveTab(tab);
    void haptics.tabSwitch();
  }, []);

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: any) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      void haptics.tabSwitch();
    },
    []
  );

  const getDaysFromTimeRange = (range: TimeRange): number => {
    switch (range) {
      case "7d":
        return 7;
      case "30d":
        return 30;
      case "90d":
        return 90;
      case "1y":
        return 365;
      case "all":
        return 1000;
      default:
        return 30;
    }
  };

  const renderTabButton = (tab: DataType, label: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => handleTabChange(tab)}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={activeTab === tab ? theme.colors.primary : theme.colors.muted}
      />
      <Text
        style={[
          styles.tabButtonText,
          activeTab === tab && styles.tabButtonTextActive
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTimeRangeFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>Time Range</Text>
      <View style={styles.filterRow}>
        {(["7d", "30d", "90d", "1y", "all"] as TimeRange[]).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.filterChip,
              filters.timeRange === range && styles.filterChipActive
            ]}
            onPress={() => handleFilterChange("timeRange", range)}
          >
            <Text
              style={[
                styles.filterChipText,
                filters.timeRange === range && styles.filterChipTextActive
              ]}
            >
              {range === "all" ? "All" : range.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProgramsAnalytics = () => (
    <View style={styles.analyticsContent}>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {allProgress?.activePrograms || 0}
          </Text>
          <Text style={styles.metricLabel}>Active Programs</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {allProgress?.totalWorkoutsCompleted || 0}
          </Text>
          <Text style={styles.metricLabel}>Sessions Completed</Text>
        </View>
      </View>

      <SessionsCompletedChart days={getDaysFromTimeRange(filters.timeRange)} />

      <PersonalRecordsCard limit={5} />
    </View>
  );

  const renderChallengesAnalytics = () => (
    <View style={styles.analyticsContent}>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {allProgress?.activeChallenges || 0}
          </Text>
          <Text style={styles.metricLabel}>Active Challenges</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {allProgress?.totalRepsCompleted || 0}
          </Text>
          <Text style={styles.metricLabel}>Total Reps</Text>
        </View>
      </View>

      <RepsProgressionChart days={getDaysFromTimeRange(filters.timeRange)} />

      <View style={styles.streakCard}>
        <Ionicons name="flame" size={24} color={theme.colors.warning} />
        <Text style={styles.streakValue}>
          {allProgress?.currentStreak || 0}
        </Text>
        <Text style={styles.streakLabel}>Day Streak</Text>
      </View>
    </View>
  );

  const renderExercisesAnalytics = () => (
    <View style={styles.analyticsContent}>
      <EnhancedExerciseProgressionChart />
      <PersonalRecordsCard limit={10} />
    </View>
  );

  const renderAnalyticsContent = () => {
    switch (activeTab) {
      case "programs":
        return renderProgramsAnalytics();
      case "challenges":
        return renderChallengesAnalytics();
      case "exercises":
        return renderExercisesAnalytics();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Detailed progress insights</Text>
        </View>

        {/* Data Type Navigation */}
        <View style={styles.tabContainer}>
          {renderTabButton("programs", "Programs", "fitness-outline")}
          {renderTabButton("challenges", "Challenges", "barbell-outline")}
          {renderTabButton("exercises", "Exercises", "body-outline")}
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {renderTimeRangeFilter()}

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Options</Text>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterToggle,
                  filters.showOnlyActive && styles.filterToggleActive
                ]}
                onPress={() =>
                  handleFilterChange("showOnlyActive", !filters.showOnlyActive)
                }
              >
                <Text
                  style={[
                    styles.filterToggleText,
                    filters.showOnlyActive && styles.filterToggleTextActive
                  ]}
                >
                  Active Only
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Analytics Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : (
          renderAnalyticsContent()
        )}

        {/* Export Options */}
        <View style={styles.exportSection}>
          <Text style={styles.sectionTitle}>Export Data</Text>
          <View style={styles.exportButtons}>
            <Button
              label="Export CSV"
              variant="secondary"
              onPress={handleExportCSV}
            />
            <Button
              label="Share Report"
              variant="secondary"
              onPress={handleShareReport}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2
  },
  header: {
    marginBottom: theme.spacing.lg
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    gap: theme.spacing.xs
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primaryLight
  },
  tabButtonText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium
  },
  tabButtonTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm
  },
  filterSection: {
    marginBottom: theme.spacing.md
  },
  filterLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  filterChipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary
  },
  filterChipText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium
  },
  filterChipTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  filterToggle: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  filterToggleActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary
  },
  filterToggleText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium
  },
  filterToggleTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  analyticsContent: {
    gap: theme.spacing.lg
  },
  metricsGrid: {
    flexDirection: "row",
    gap: theme.spacing.md
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: "center",
    ...theme.shadows.sm
  },
  metricValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
    marginBottom: theme.spacing.xs
  },
  metricLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textAlign: "center"
  },
  streakCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    gap: theme.spacing.sm,
    ...theme.shadows.sm
  },
  streakValue: {
    ...theme.typography.h1,
    color: theme.colors.warning,
    fontFamily: theme.fonts.bold
  },
  streakLabel: {
    ...theme.typography.body,
    color: theme.colors.muted
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: "center"
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.muted
  },
  exportSection: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  exportButtons: {
    flexDirection: "row",
    gap: theme.spacing.md
  }
});
