import { ProgressStats, ProgressView, WeeklyChart } from "@/components";
import {
  useAllProgress,
  useLastCompletedSlug,
  usePrograms,
  useWeeklyActivity,
} from "@/hooks/data";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { data: programs } = usePrograms();
  // Filter for challenge programs
  const challenges = useMemo(() => {
    if (!programs) return [];
    return programs.filter((p) => p.challengeConfig);
  }, [programs]);
  const firstChallenge = challenges?.[0];
  const lastCompletedSlug = useLastCompletedSlug();
  const targetSlug = lastCompletedSlug || firstChallenge?.id;
  const { data: weeklyData } = useWeeklyActivity();
  const { data: aggregated } = useAllProgress();

  const progressStats = useMemo(() => {
    if (!aggregated) return [];
    return [
      {
        label: "Total Workouts",
        value: aggregated.totalWorkoutsCompleted,
      },
      {
        label: "Current Streak",
        value: `${aggregated.currentStreak} days`,
      },
    ];
  }, [aggregated]);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <LinearGradient
        colors={[
          theme.colors.gradient.primaryStart,
          theme.colors.gradient.primaryEnd,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.headerSubtitle}>
            Ready to crush your workout?
          </Text>
        </View>
      </LinearGradient>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Gradient Header */}

        <View style={styles.content}>
          {/* Progress Summary */}
          {aggregated && progressStats.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <LinearGradient
                  colors={[
                    theme.colors.gradient.primaryStart,
                    theme.colors.gradient.primaryEnd,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardIconGradient}
                >
                  <Ionicons name="stats-chart" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.cardTitle}>Your Progress</Text>
              </View>
              <ProgressStats stats={progressStats} columns={2} />
              <Pressable
                style={({ pressed }) => [
                  styles.viewProgressButton,
                  pressed && styles.viewProgressButtonPressed,
                ]}
                onPress={() => router.navigate("/(tabs)/progress")}
              >
                <Text style={styles.viewProgressText}>View Full Progress</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>
          )}

          {/* Weekly Activity Chart */}
          <WeeklyChart data={weeklyData} title="Last 7 days" />

          {/* Streak Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={[
                  theme.colors.gradient.warmStart,
                  theme.colors.gradient.warmEnd,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconGradient}
              >
                <Ionicons name="flame" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.cardTitle}>Your Streak</Text>
            </View>
            {targetSlug ? (
              <ProgressView slug={targetSlug} />
            ) : (
              <Text style={styles.muted}>
                Add a challenge to start tracking.
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionPressed,
              ]}
              onPress={() => router.navigate("/(tabs)/challenges")}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={theme.colors.text}
                />
              </View>
              <Text style={styles.actionText}>All Challenges</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButtonPrimary,
                pressed && styles.actionPrimaryPressed,
                !firstChallenge && styles.actionDisabled,
              ]}
              disabled={!firstChallenge}
              onPress={() =>
                firstChallenge &&
                router.navigate({
                  pathname: "/programs/[id]",
                  params: { id: firstChallenge.id },
                })
              }
            >
              <LinearGradient
                colors={[
                  theme.colors.gradient.primaryStart,
                  theme.colors.gradient.primaryEnd,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <View style={styles.actionIconContainerPrimary}>
                  <Ionicons
                    name="play"
                    size={20}
                    color={theme.colors.primaryTextOn}
                  />
                </View>
                <Text style={styles.actionPrimaryText}>
                  {firstChallenge ? "Quick Start" : "No challenge"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerGradient: {
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    marginBottom: theme.spacing.md,
  },
  headerContent: {
    paddingTop: theme.spacing.lg,
  },
  greeting: {
    ...theme.typography.h1,
    color: "#FFFFFF",
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: "rgba(255,255,255,0.85)",
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    marginTop: -theme.spacing.md,
    gap: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  cardIconGradient: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.sm,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    paddingVertical: theme.spacing.lg,
  },
  actionsRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    ...theme.shadows.sm,
  },
  actionPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }],
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  actionText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  },
  actionButtonPrimary: {
    flex: 1,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  actionGradient: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
  },
  actionPrimaryPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionIconContainerPrimary: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  actionPrimaryText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  viewProgressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  viewProgressButtonPressed: {
    opacity: 0.7,
  },
  viewProgressText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
});
