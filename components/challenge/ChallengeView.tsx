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
import ProgramOverview from "../program/ProgramOverview";
import { ProgressCard } from "../progress";

type Props = {
  challengeMetrics: ChallengeProgressMetrics;
  program: Program;
};

export default function ChallengeViewV2({ challengeMetrics, program }: Props) {
  const sessions = useChallengeSessions(program);
  const { completed } = useSessionCompletion(program.id);

  const nextSession = sessions.find((s) => !completed.has(s.index)) ?? null;

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
              <Ionicons
                name="flame"
                size={18}
                color={theme.colors.primary}
                style={styles.progressStatIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.progressStatLabel}>Reps Completed</Text>
                <Text style={styles.progressStatValue}>
                  {challengeMetrics.totalRepsCompleted}
                </Text>
              </View>
            </View>
            <View style={styles.progressStat}>
              <Ionicons
                name="flag"
                size={18}
                color={theme.colors.primary}
                style={styles.progressStatIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.progressStatLabel}>Target Reps</Text>
                <Text style={styles.progressStatValue}>
                  {challengeMetrics.targetReps}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </AnimatedCard>

      <ProgramOverview
        program={program}
        totalSessions={challengeMetrics.totalSessions}
        isChallenge
      />

      {nextSession && (
        <AnimatedCard>
          <Pressable
            onPress={() =>
              router.navigate({
                pathname: "/programs/[id]/session/[index]",
                params: { id: program.id, index: String(nextSession.index) }
              })
            }
            style={({ pressed }) => [
              styles.quickStartCard,
              pressed && styles.sessionRowPressed
            ]}
          >
            <View style={styles.quickStartIconContainer}>
              <Ionicons
                name="play"
                size={20}
                color={theme.colors.primaryTextOn}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickStartLabel}>Next session</Text>
              <Text style={styles.quickStartTitle}>
                {nextSession.name || `Session ${nextSession.index}`}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.primaryTextOn}
            />
          </Pressable>
        </AnimatedCard>
      )}

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Sessions</Text>
          <Text style={styles.muted}>{sessions.length}</Text>
        </View>
        <View style={{ height: theme.spacing.md }} />
        {sessions.map((s) => {
          const isCompleted = completed.has(s.index);
          const exerciseBlocks = s.blocks.filter((b) => b.type === "exercise");
          const totalReps = exerciseBlocks.reduce(
            (sum, b) => sum + (b.targetReps ?? 0),
            0
          );
          const setsCount = exerciseBlocks.length;

          const previousCompleted =
            s.index === 1 || completed.has(s.index - 1) || isCompleted;
          const isLocked = !previousCompleted;
          const isNextActive =
            nextSession && nextSession.index === s.index && !isLocked;

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
                disabled={isLocked}
                style={({ pressed }) => [
                  styles.sessionRow,
                  isCompleted && styles.sessionRowCompleted,
                  isLocked && styles.sessionRowLocked,
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
                    {isNextActive && !isCompleted && (
                      <View style={styles.nextPill}>
                        <Text style={styles.nextPillText}>Next</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sessionSubtitle}>
                    {setsCount} set{setsCount === 1 ? "" : "s"} • {totalReps}{" "}
                    target reps
                  </Text>
                </View>
                <Ionicons
                  name={isLocked ? "lock-closed" : "chevron-forward"}
                  size={18}
                  color={
                    isLocked ? theme.colors.muted : theme.colors.subtext
                  }
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
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md
  },
  progressStatIcon: {
    marginRight: theme.spacing.sm
  },
  progressStatValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold
  },
  progressStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted
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
  sessionRowLocked: {
    opacity: 0.6
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
  },
  nextPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight
  },
  nextPillText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  quickStartCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md
  },
  quickStartIconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primaryTextOn + "20"
  },
  quickStartLabel: {
    ...theme.typography.caption,
    color: theme.colors.primaryTextOn
  },
  quickStartTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  }
});
