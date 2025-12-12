import { ProgressCard } from "@/components";
import {
  useChallengeProgress,
  useChallengeSessions,
  useProgramProgress,
  usePrograms,
  useSessionCompletion,
} from "@/hooks/data";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProgramDetail() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { data: programs, loading } = usePrograms();

  const program = useMemo(
    () => programs?.find((p) => p.id === id) ?? null,
    [programs, id],
  );

  // Get sessions (generated dynamically for challenge programs)
  const sessions = useChallengeSessions(program);
  const isChallenge = Boolean(program?.challengeConfig);
  const { metrics: challengeMetrics } = useChallengeProgress(
    isChallenge ? program : undefined
  );
  const { metrics: programMetrics } = useProgramProgress(
    !isChallenge ? program : undefined
  );
  const { completed } = useSessionCompletion(id);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.card, { margin: theme.spacing.lg }]}>
          <Text style={styles.muted}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!program) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.card, { margin: theme.spacing.lg }]}>
          <Text style={styles.muted}>Program not found.</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.secondaryBtnPressed,
            ]}
          >
            <Text style={styles.secondaryBtnText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const firstSession = sessions[0];

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <View style={styles.headerSection}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [
            styles.headerBack,
            pressed && styles.headerBackPressed,
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{program.name}</Text>
          {program.description ? (
            <Text style={styles.headerSubtitle}>{program.description}</Text>
          ) : (
            <Text style={styles.headerSubtitle}>
              {sessions.length} session
              {sessions.length === 1 ? "" : "s"}
            </Text>
          )}
        </View>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Progress Section */}
        {isChallenge && challengeMetrics && (
          <View style={styles.card}>
            <ProgressCard
              title={program.name}
              completionPercentage={challengeMetrics.completionPercentage}
              sessionsCompleted={challengeMetrics.sessionsCompleted}
              totalSessions={challengeMetrics.totalSessions}
              variant="challenge"
            />
            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>
                  {challengeMetrics.totalRepsCompleted}
                </Text>
                <Text style={styles.progressStatLabel}>Reps Completed</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>
                  {challengeMetrics.targetReps}
                </Text>
                <Text style={styles.progressStatLabel}>Target Reps</Text>
              </View>
            </View>
          </View>
        )}

        {!isChallenge && programMetrics && (
          <View style={styles.card}>
            <ProgressCard
              title={program.name}
              completionPercentage={programMetrics.completionPercentage}
              sessionsCompleted={programMetrics.sessionsCompleted}
              totalSessions={programMetrics.totalSessions}
              variant="program"
            />
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Sessions</Text>
            <Text style={styles.muted}>{sessions.length}</Text>
          </View>
          <View style={{ height: theme.spacing.md }} />
          {sessions.map((s) => {
            const isCompleted = completed.has(s.index);
            return (
              <Pressable
                key={s.index}
                onPress={() =>
                  router.navigate({
                    pathname: "/programs/[id]/session/[index]" as any,
                    params: { id: program.id, index: String(s.index) },
                  })
                }
                style={({ pressed }) => [
                  styles.sessionRow,
                  isCompleted && styles.sessionRowCompleted,
                  pressed && styles.sessionRowPressed,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.sessionTitleRow}>
                    <Text style={styles.sessionTitle}>
                      {s.name ? s.name : `Session ${s.index}`}
                    </Text>
                    {isCompleted && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.colors.success}
                      />
                    )}
                  </View>
                  <Text style={styles.sessionSubtitle}>
                    {s.blocks.length} block{s.blocks.length === 1 ? "" : "s"}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.muted}
                />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          disabled={!firstSession}
          onPress={() =>
            router.navigate({
              pathname: "/programs/[id]/session/[index]" as any,
              params: {
                id: program.id,
                index: String(firstSession?.index ?? 1),
              },
            })
          }
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
            !firstSession && styles.primaryBtnDisabled,
          ]}
        >
          <Ionicons
            name="play"
            size={20}
            color={theme.colors.primaryTextOn}
            style={{ marginRight: theme.spacing.sm }}
          />
          <Text style={styles.primaryBtnText}>Start</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  headerBack: {
    padding: theme.spacing.xs,
    marginTop: -theme.spacing.xs,
    marginLeft: -theme.spacing.xs,
  },
  headerBackPressed: { opacity: 0.6 },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: theme.spacing.xxl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sessionRowPressed: {
    backgroundColor: theme.colors.background,
    transform: [{ scale: 0.98 }],
  },
  sessionRowCompleted: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successLight,
  },
  sessionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  sessionTitle: { ...theme.typography.bodyBold, color: theme.colors.text },
  progressStats: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  progressStat: {
    flex: 1,
    alignItems: "center",
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
  },
  progressStatValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
  },
  progressStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
  },
  sessionSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
  },
  muted: { ...theme.typography.caption, color: theme.colors.muted },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    ...theme.shadows.md,
  },
  primaryBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn,
  },
  secondaryBtn: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryBtnPressed: { backgroundColor: theme.colors.card },
  secondaryBtnText: { ...theme.typography.bodyBold, color: theme.colors.text },
});
