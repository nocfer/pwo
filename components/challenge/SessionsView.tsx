import { useChallengeSessions, useExercises, usePrograms, useSessionCompletion } from "@/hooks/data";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {
  programId: string;
};

export default function SessionsView({ programId }: Props) {
  const { data: programs } = usePrograms();
  const { data: exercises } = useExercises();
  const program = useMemo(
    () => programs?.find((p) => p.id === programId) ?? null,
    [programs, programId],
  );
  const sessions = useChallengeSessions(program);
  const { completed } = useSessionCompletion(programId);

  // Get exercise name for challenge programs
  const exerciseName = useMemo(() => {
    if (!program?.challengeConfig) return null;
    const exercise = exercises?.find(
      (e) => e.id === program.challengeConfig?.exerciseId,
    );
    return exercise?.name ?? null;
  }, [program, exercises]);

  if (!program || sessions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>No sessions available.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    >
      {sessions.map((s) => {
        const isDone = completed.has(s.index);
        // Session is locked if it's not the first and previous session is not completed
        const isLocked = s.index > 1 && !completed.has(s.index - 1);

        // Calculate total reps and rep distribution from blocks
        const exerciseBlocks = s.blocks.filter(
          (b) => b.type === "exercise",
        ) as Array<{ type: "exercise"; targetReps?: number }>;
        const totalReps = exerciseBlocks.reduce(
          (sum, b) => sum + (b.targetReps || 0),
          0,
        );
        const repsPerSet = exerciseBlocks.map((b) => b.targetReps || 0);

        return (
          <Pressable
            key={s.index}
            onPress={() => {
              if (isLocked) return; // Prevent navigation for locked sessions
              router.navigate({
                pathname: "/programs/[id]/session/[index]",
                params: { id: programId, index: String(s.index) },
              });
            }}
            style={({ pressed }) => [
              styles.card,
              isDone && styles.cardDone,
              isLocked && styles.cardLocked,
              pressed && !isLocked && styles.cardPressed,
            ]}
          >
            <View style={styles.rowBetween}>
              <View style={styles.titleRow}>
                <View
                  style={[
                    styles.sessionIcon,
                    isDone && styles.sessionIconDone,
                    isLocked && styles.sessionIconLocked,
                  ]}
                >
                  <Ionicons
                    name={
                      isLocked
                        ? "lock-closed"
                        : isDone
                          ? "checkmark"
                          : "barbell-outline"
                    }
                    size={16}
                    color={
                      isLocked
                        ? theme.colors.muted
                        : isDone
                          ? theme.colors.success
                          : theme.colors.primary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.title,
                    isDone && styles.titleDone,
                    isLocked && styles.titleLocked,
                  ]}
                >
                  Session {s.index}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  isDone && styles.badgeDone,
                  isLocked && styles.badgeLocked,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isDone && styles.badgeTextDone,
                    isLocked && styles.badgeTextLocked,
                  ]}
                >
                  {totalReps} reps
                </Text>
              </View>
            </View>
            <Text style={[styles.subtitle, isLocked && styles.subtitleLocked]}>
              {isLocked
                ? `Complete Session ${s.index - 1} first`
                : exerciseName ?? "Exercise"}
            </Text>
            <View style={styles.setsRow}>
              {repsPerSet.map((r, i) => (
                <View
                  key={i}
                  style={[styles.setPill, isLocked && styles.setPillLocked]}
                >
                  <Text
                    style={[
                      styles.setPillText,
                      isLocked && styles.setPillTextLocked,
                    ]}
                  >
                    {r}
                  </Text>
                </View>
              ))}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  cardDone: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successLight,
  },
  cardLocked: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    opacity: 0.6,
  },
  cardPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }],
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  sessionIcon: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionIconDone: {
    backgroundColor: theme.colors.successLight,
  },
  sessionIconLocked: {
    backgroundColor: theme.colors.card,
  },
  title: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  },
  titleDone: {
    color: theme.colors.success,
  },
  titleLocked: {
    color: theme.colors.muted,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  subtitleLocked: {
    fontStyle: "italic",
  },
  badge: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  badgeDone: {
    backgroundColor: theme.colors.successLight,
  },
  badgeLocked: {
    backgroundColor: theme.colors.card,
  },
  badgeText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary,
  },
  badgeTextDone: {
    color: theme.colors.success,
  },
  badgeTextLocked: {
    color: theme.colors.muted,
  },
  setsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  setPill: {
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  setPillText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  setPillLocked: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  setPillTextLocked: {
    color: theme.colors.muted,
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
});
