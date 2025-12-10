import { ProgressView, WeeklyChart } from "@/components";
import { useLastCompletedSlug, useRoutines } from "@/hooks/data";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const { data: routines } = useRoutines();
  const firstRoutine = routines?.[0];
  const lastCompletedSlug = useLastCompletedSlug();
  const targetSlug = lastCompletedSlug || firstRoutine?.slug;

  // Mock weekly data - in a real app, this would come from your progress hook
  const weeklyData = [1, 0, 1, 1, 0, 1, 0]; // Example: Mon, Wed, Thu, Sat completed

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[theme.colors.gradient.primaryStart, theme.colors.gradient.primaryEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.headerSubtitle}>Ready to crush your workout?</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Weekly Activity Chart */}
        <WeeklyChart data={weeklyData} title="This Week" />

        {/* Streak Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={[theme.colors.gradient.warmStart, theme.colors.gradient.warmEnd]}
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
            <Text style={styles.muted}>Add a routine to start tracking.</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
            onPress={() => router.navigate("/(tabs)/routines")}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="list-outline" size={20} color={theme.colors.text} />
            </View>
            <Text style={styles.actionText}>All Routines</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButtonPrimary,
              pressed && styles.actionPrimaryPressed,
              !firstRoutine && styles.actionDisabled,
            ]}
            disabled={!firstRoutine}
            onPress={() =>
              firstRoutine &&
              router.navigate({ pathname: "/routines/[slug]", params: { slug: firstRoutine.slug } })
            }
          >
            <LinearGradient
              colors={[theme.colors.gradient.primaryStart, theme.colors.gradient.primaryEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <View style={styles.actionIconContainerPrimary}>
                <Ionicons name="play" size={20} color={theme.colors.primaryTextOn} />
              </View>
              <Text style={styles.actionPrimaryText}>
                {firstRoutine ? "Quick Start" : "No routine"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </ScrollView>
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
    borderRadius: theme.radius.sm,
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
});
