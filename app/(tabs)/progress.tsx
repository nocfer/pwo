/**
 * Statistics Tab - Unified progress and analytics dashboard
 * Consolidates progress tracking, consistency, PRs, and exercise progression
 */

import {
    ConsistencyHeatmap,
    EnhancedExerciseProgressionChart,
    PersonalRecordsCard,
    WeeklySummaryCard
} from "@/components";
import { Button } from "@/components/common";
import { useAllProgress } from "@/hooks/data";
import { haptics } from "@/lib/haptics";
import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useRef, useState } from "react";
import {
    Animated,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function generateProgressReport(progressData: any): string {
  const totalMinutes = Math.round(
    (progressData.totalTimeSpentSeconds || 0) / 60
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `🏋️ Fitness Progress Report

📊 Overall Stats:
• Workouts: ${progressData.totalWorkoutsCompleted || 0}
• Total Reps: ${progressData.totalRepsCompleted || 0}
• Time: ${hours}h ${minutes}m
• Streak: ${progressData.currentStreak || 0} days

Generated on ${new Date().toLocaleDateString()}`;
}

export default function StatisticsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: allProgress } = useAllProgress();

  const section1Anim = useRef(new Animated.Value(0)).current;
  const section2Anim = useRef(new Animated.Value(0)).current;
  const section3Anim = useRef(new Animated.Value(0)).current;
  const section4Anim = useRef(new Animated.Value(0)).current;
  const section5Anim = useRef(new Animated.Value(0)).current;

  const animateSections = useCallback(() => {
    Animated.stagger(80, [
      Animated.timing(section1Anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(section2Anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(section3Anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(section4Anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(section5Anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      })
    ]).start();
  }, [section1Anim, section2Anim, section3Anim, section4Anim, section5Anim]);

  useState(() => {
    animateSections();
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    void haptics.refresh();

    section1Anim.setValue(0);
    section2Anim.setValue(0);
    section3Anim.setValue(0);
    section4Anim.setValue(0);
    section5Anim.setValue(0);

    await new Promise((resolve) => setTimeout(resolve, 400));

    setRefreshing(false);
    animateSections();
  }, [animateSections, section1Anim, section2Anim, section3Anim, section4Anim, section5Anim]);

  const handleShareReport = useCallback(async () => {
    try {
      void haptics.shareData();
      if (!allProgress) return;
      const report = generateProgressReport(allProgress);
      await Share.share({ message: report, title: "Progress Report" });
    } catch {
      // Share cancelled or failed
    }
  }, [allProgress]);

  const createAnimatedStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0]
        })
      }
    ]
  });

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <ScrollView
        style={styles.scrollView}
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
          <Text style={styles.title}>Statistics</Text>
          <Text style={styles.subtitle}>Your fitness insights</Text>
        </View>

        {/* Weekly Summary */}
        <Animated.View
          style={[styles.section, createAnimatedStyle(section1Anim)]}
        >
          <WeeklySummaryCard />
        </Animated.View>

        {/* Overall Stats */}
        <Animated.View
          style={[styles.section, createAnimatedStyle(section2Anim)]}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overall Progress</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="fitness"
                label="Total Workouts"
                value={allProgress?.totalWorkoutsCompleted || 0}
                color={theme.colors.primary}
              />
              <StatCard
                icon="flame"
                label="Current Streak"
                value={allProgress?.currentStreak || 0}
                color={theme.colors.accent}
              />
              <StatCard
                icon="barbell"
                label="Total Reps"
                value={allProgress?.totalRepsCompleted || 0}
                color={theme.colors.phases.working}
              />
              <StatCard
                icon="time"
                label="Active Programs"
                value={allProgress?.activePrograms || 0}
                color={theme.colors.success}
              />
            </View>
          </View>
        </Animated.View>

        {/* Consistency Heatmap */}
        <Animated.View
          style={[styles.section, createAnimatedStyle(section3Anim)]}
        >
          <ConsistencyHeatmap weeks={12} />
        </Animated.View>

        {/* Personal Records */}
        <Animated.View
          style={[styles.section, createAnimatedStyle(section4Anim)]}
        >
          <PersonalRecordsCard limit={5} />
        </Animated.View>

        {/* Exercise Progression */}
        <Animated.View
          style={[styles.section, createAnimatedStyle(section5Anim)]}
        >
          <EnhancedExerciseProgressionChart />
        </Animated.View>

        {/* Export Section */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Share Progress</Text>
            <Button
              label="Share Report"
              variant="secondary"
              size="md"
              onPress={handleShareReport}
              icon="share-social"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollView: {
    flex: 1
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2
  },
  header: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md
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
  section: {
    marginTop: theme.spacing.lg
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textAlign: "center"
  }
});
