import {
  ChallengeProgressMetrics,
  useChallengeSessions,
  useSessionCompletion
} from "@/hooks/data";
import { theme } from "@/theme/theme";
import { Program } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnimatedCard } from "../common";
import { ProgressCard } from "../progress";

type Props = {
  challengeMetrics: ChallengeProgressMetrics;
  program: Program;
};

export default function ChallengeViewV2({ challengeMetrics, program }: Props) {
  const sessions = useChallengeSessions(program);
  const { completed } = useSessionCompletion(program.id);

  return (
    <>
      <AnimatedCard>
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
      </AnimatedCard>
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Sessions</Text>
          <Text style={styles.muted}>{sessions.length}</Text>
        </View>
        <View style={{ height: theme.spacing.md }} />
        {sessions.map((s) => {
          const isCompleted = completed.has(s.index);
          return (
            <AnimatedCard delay={100 + s.index * 30} key={s.index}>
              <Pressable
                key={s.index}
                onPress={() =>
                  router.navigate({
                    pathname: "/programs/[id]/session/[index]",
                    params: { id: program.id, index: String(s.index) }
                  })
                }
                style={({ pressed }) => [
                  styles.sessionRow,
                  isCompleted && styles.sessionRowCompleted,
                  pressed && styles.sessionRowPressed
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
            </AnimatedCard>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  progressStats: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md
  },
  progressStat: {
    flex: 1,
    alignItems: "center",
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md
  },
  progressStatValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold
  },
  progressStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
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
    marginBottom: theme.spacing.sm
  },
  sessionRowPressed: {
    backgroundColor: theme.colors.background,
    transform: [{ scale: 0.98 }]
  },
  sessionRowCompleted: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successLight
  },
  sessionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs
  },
  sessionTitle: { ...theme.typography.bodyBold, color: theme.colors.text },
  muted: { ...theme.typography.caption, color: theme.colors.muted },
  sessionSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs
  }
});
