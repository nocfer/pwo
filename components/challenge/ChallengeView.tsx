import {
  ChallengeProgressMetrics,
  useChallengeSessions,
  useSessionCompletion
} from "@/hooks/data";
import { formatCount } from "@/lib/utils/format";
import { theme } from "@/theme/theme";
import { Program } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnimatedCard, AnimatedProgressBar } from "../common";

type Props = {
  challengeMetrics: ChallengeProgressMetrics;
  program: Program;
};

export default function ChallengeView({ challengeMetrics, program }: Props) {
  const sessions = useChallengeSessions(program);
  const { completed } = useSessionCompletion(program.id);

  const nextSession = sessions.find((s) => !completed.has(s.index)) ?? null;
  const isCompleted = challengeMetrics.isCompleted;
  const hasStarted = challengeMetrics.sessionsCompleted > 0;

  // Get next session details
  const nextSessionReps = nextSession
    ? nextSession.blocks
        .filter((b) => b.type === "exercise")
        .reduce((sum, b) => sum + (b.targetReps ?? 0), 0)
    : 0;

  const handleStartSession = () => {
    if (nextSession) {
      router.navigate({
        pathname: "/programs/[id]/session/[index]",
        params: { id: program.id, index: String(nextSession.index) }
      });
    }
  };

  return (
    <>
      {/* Hero Progress Card */}
      <AnimatedCard>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconContainer}>
              <Ionicons name="trophy" size={24} color={theme.colors.success} />
            </View>
            <View style={styles.heroHeaderText}>
              <Text style={styles.heroTitle}>
                {isCompleted ? "Challenge Complete!" : "Challenge Progress"}
              </Text>
              <Text style={styles.heroSubtitle}>
                {challengeMetrics.sessionsCompleted} of{" "}
                {challengeMetrics.totalSessions} sessions
              </Text>
            </View>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>
                {Math.round(challengeMetrics.completionPercentage)}%
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <AnimatedProgressBar
              progress={challengeMetrics.completionPercentage / 100}
              color={theme.colors.success}
              height={8}
            />
          </View>

          {/* Reps Progress */}
          <View style={styles.repsProgress}>
            <View style={styles.repsRow}>
              <Ionicons name="flame" size={18} color={theme.colors.accent} />
              <Text style={styles.repsLabel}>
                <Text style={styles.repsValue}>
                  {challengeMetrics.totalRepsCompleted.toLocaleString()}
                </Text>
                {" / "}
                {challengeMetrics.targetReps.toLocaleString()} reps
              </Text>
            </View>
            <View style={styles.repsBarContainer}>
              <AnimatedProgressBar
                progress={challengeMetrics.repsProgressPercentage / 100}
                color={theme.colors.accent}
                height={4}
              />
            </View>
          </View>
        </View>
      </AnimatedCard>

      {/* Next Session CTA */}
      {nextSession && !isCompleted && (
        <AnimatedCard delay={50}>
          <Pressable
            onPress={handleStartSession}
            style={({ pressed }) => [
              styles.ctaCard,
              pressed && styles.ctaCardPressed
            ]}
          >
            <View style={styles.ctaContent}>
              <View style={styles.ctaIconContainer}>
                <Ionicons
                  name="play"
                  size={24}
                  color={theme.colors.primaryTextOn}
                />
              </View>
              <View style={styles.ctaTextContainer}>
                <Text style={styles.ctaTitle}>
                  {hasStarted ? "Continue Challenge" : "Start Challenge"}
                </Text>
                <Text style={styles.ctaSubtitle}>
                  Session {nextSession.index} • {nextSessionReps} reps
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.primaryTextOn}
            />
          </Pressable>
        </AnimatedCard>
      )}

      {/* Completed State */}
      {isCompleted && (
        <AnimatedCard delay={50}>
          <View style={styles.completedCard}>
            <Ionicons
              name="checkmark-circle"
              size={32}
              color={theme.colors.success}
            />
            <Text style={styles.completedTitle}>Congratulations!</Text>
            <Text style={styles.completedSubtitle}>
              You&apos;ve completed all {challengeMetrics.totalSessions}{" "}
              sessions
            </Text>
          </View>
        </AnimatedCard>
      )}

      {/* Description */}
      {program.description && (
        <AnimatedCard delay={100}>
          <View style={styles.card}>
            <Text style={styles.description}>{program.description}</Text>
          </View>
        </AnimatedCard>
      )}

      {/* Sessions List */}
      <AnimatedCard delay={150}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sessions</Text>
          <View style={styles.sessionsList}>
            {sessions.map((s, index) => {
              const isSessionCompleted = completed.has(s.index);
              const exerciseBlocks = s.blocks.filter(
                (b) => b.type === "exercise"
              );
              const totalReps = exerciseBlocks.reduce(
                (sum, b) => sum + (b.targetReps ?? 0),
                0
              );
              const setsCount = exerciseBlocks.length;

              const previousCompleted =
                s.index === 1 ||
                completed.has(s.index - 1) ||
                isSessionCompleted;
              const isLocked = !previousCompleted;
              const isNext =
                nextSession && nextSession.index === s.index && !isLocked;

              return (
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
                    styles.sessionItem,
                    index === sessions.length - 1 && styles.sessionItemLast,
                    pressed && !isLocked && styles.sessionItemPressed
                  ]}
                >
                  {/* Status Indicator */}
                  <View
                    style={[
                      styles.sessionIndicator,
                      isSessionCompleted && styles.sessionIndicatorCompleted,
                      isNext && styles.sessionIndicatorNext,
                      isLocked && styles.sessionIndicatorLocked
                    ]}
                  >
                    {isSessionCompleted ? (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={theme.colors.primaryTextOn}
                      />
                    ) : isLocked ? (
                      <Ionicons
                        name="lock-closed"
                        size={12}
                        color={theme.colors.muted}
                      />
                    ) : (
                      <Text style={styles.sessionNumber}>{s.index}</Text>
                    )}
                  </View>

                  {/* Session Info */}
                  <View style={styles.sessionInfo}>
                    <View style={styles.sessionTitleRow}>
                      <Text
                        style={[
                          styles.sessionTitle,
                          isLocked && styles.sessionTitleLocked
                        ]}
                      >
                        {s.name || `Session ${s.index}`}
                      </Text>
                      {isNext && (
                        <View style={styles.nextBadge}>
                          <Text style={styles.nextBadgeText}>Next</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.sessionDetail}>
                      {formatCount(setsCount, "set")} • {totalReps} reps
                    </Text>
                  </View>

                  {/* Chevron */}
                  {!isLocked && (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={theme.colors.muted}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </AnimatedCard>

      {/* Stats (only show if started) */}
      {hasStarted && challengeMetrics.currentStreak > 0 && (
        <AnimatedCard delay={200}>
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Ionicons name="flame" size={16} color={theme.colors.accent} />
              <Text style={styles.statPillText}>
                {challengeMetrics.currentStreak} day streak
              </Text>
            </View>
          </View>
        </AnimatedCard>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.successLight,
    alignItems: "center",
    justifyContent: "center"
  },
  heroHeaderText: {
    flex: 1
  },
  heroTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  heroSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  percentageBadge: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.success,
    alignItems: "center",
    justifyContent: "center"
  },
  percentageText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.borderLight,
    borderRadius: theme.radius.full,
    overflow: "hidden",
    marginBottom: theme.spacing.lg
  },
  repsProgress: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md
  },
  repsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm
  },
  repsLabel: {
    ...theme.typography.caption,
    color: theme.colors.subtext
  },
  repsValue: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  repsBarContainer: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.full,
    overflow: "hidden"
  },
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md
  },
  ctaCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md
  },
  ctaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  ctaTextContainer: {
    gap: theme.spacing.xs
  },
  ctaTitle: {
    ...theme.typography.h3,
    color: theme.colors.primaryTextOn
  },
  ctaSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.primaryTextOn,
    opacity: 0.8
  },
  completedCard: {
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: "center",
    gap: theme.spacing.sm
  },
  completedTitle: {
    ...theme.typography.h2,
    color: theme.colors.success
  },
  completedSubtitle: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    textAlign: "center"
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    lineHeight: 22
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  sessionsList: {
    gap: 0
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight
  },
  sessionItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0
  },
  sessionItemPressed: {
    opacity: 0.7
  },
  sessionIndicator: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.border
  },
  sessionIndicatorCompleted: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success
  },
  sessionIndicatorNext: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight
  },
  sessionIndicatorLocked: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.borderLight
  },
  sessionNumber: {
    ...theme.typography.captionBold,
    color: theme.colors.primary
  },
  sessionInfo: {
    flex: 1,
    gap: theme.spacing.xs
  },
  sessionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  sessionTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  sessionTitleLocked: {
    color: theme.colors.muted
  },
  sessionDetail: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  nextBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight
  },
  nextBadgeText: {
    ...theme.typography.small,
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.accentLight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full
  },
  statPillText: {
    ...theme.typography.captionBold,
    color: theme.colors.accent
  }
});
