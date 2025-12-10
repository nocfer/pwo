import ProgressView from "@/components/ProgressView";
import { useLastCompletedSlug } from "@/hooks/useLastCompletedSlug";
import { useRoutines } from "@/hooks/useRoutines";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const { data: routines } = useRoutines();
  const firstRoutine = routines?.[0];
  const lastCompletedSlug = useLastCompletedSlug();
  const targetSlug = lastCompletedSlug || firstRoutine?.slug;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back</Text>
        <Text style={styles.subtitle}>Here's a quick overview</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="flame-outline" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Your Streak</Text>
        </View>
        {targetSlug ? (
          <ProgressView slug={targetSlug} />
        ) : (
          <Text style={styles.muted}>Add a routine to start tracking.</Text>
        )}
      </View>

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
          <View style={styles.actionIconContainerPrimary}>
            <Ionicons name="play" size={20} color={theme.colors.primaryTextOn} />
          </View>
          <Text style={styles.actionPrimaryText}>
            {firstRoutine ? "Quick Start" : "No routine"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primaryLight,
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
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    ...theme.shadows.md,
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
