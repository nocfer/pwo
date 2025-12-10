import ProgressView from "@/components/ProgressView";
import { useLastCompletedSlug } from "@/hooks/useLastCompletedSlug";
import { useRoutines } from "@/hooks/useRoutines";
import { theme } from "@/theme/theme";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const { data: routines } = useRoutines();
  const firstRoutine = routines?.[0];
  const lastCompletedSlug = useLastCompletedSlug();
  const targetSlug = lastCompletedSlug || firstRoutine?.slug;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Here’s a quick overview</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Streak</Text>
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
          <Text style={styles.actionText}>See routines</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionButtonPrimary, pressed && styles.actionPrimaryPressed]}
          disabled={!firstRoutine}
          onPress={() =>
            firstRoutine &&
            router.navigate({ pathname: "/routines/[slug]", params: { slug: firstRoutine.slug } })
          }
        >
          <Text style={styles.actionPrimaryText}>
            {firstRoutine ? "Start last routine" : "No routine yet"}
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
  title: {
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.muted,
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: theme.spacing.sm,
  },
  muted: {
    color: theme.colors.muted,
  },
  actionsRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  actionPressed: {
    backgroundColor: theme.colors.card,
  },
  actionText: {
    color: theme.colors.text,
  },
  actionButtonPrimary: {
    flex: 1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  actionPrimaryPressed: {
    opacity: 0.9,
  },
  actionPrimaryText: {
    color: theme.colors.primaryTextOn,
  },
});
