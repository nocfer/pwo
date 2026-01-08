import { AnimatedCard } from "@/components/common";
import {
  useChallengeSessions,
  useExercises,
  useLiveHistory
} from "@/hooks/data";
import { formatCount } from "@/lib/utils/format";
import { theme } from "@/theme/theme";
import { Program } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  program: Program;
  totalSessions?: number;
  isChallenge?: boolean;
};

export default function ProgramOverview({
  program,
  totalSessions,
  isChallenge
}: Props) {
  const challengeSessions = useChallengeSessions(program);
  const sessionCount =
    totalSessions ??
    (isChallenge ? challengeSessions.length : program.sessions.length);
  const typeLabel = isChallenge ? "Challenge" : "Program";
  const sourceLabel = program.source === "builtin" ? "Built-in" : "Custom";
  const descriptionFallback = `This ${typeLabel.toLowerCase()} has ${formatCount(sessionCount, "session")}.`;

  const stats: { label: string; value: string | number; icon: string }[] = [
    { label: "Sessions", value: sessionCount, icon: "calendar-outline" },
    { label: "Type", value: typeLabel, icon: "flash-outline" },
    { label: "Source", value: sourceLabel, icon: "apps-outline" }
  ];

  const challengeDetail =
    isChallenge && program.challengeConfig
      ? `Target ${program.challengeConfig.targetReps} reps • ${formatCount(program.challengeConfig.sets, "set")} per session`
      : null;

  return (
    <AnimatedCard>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons
                name={isChallenge ? "trophy-outline" : "barbell-outline"}
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {isChallenge ? "Challenge overview" : "Program overview"}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {program.name}
              </Text>
            </View>
          </View>
          <View style={styles.headerPills}>
            <Text style={styles.headerPill}>{typeLabel}</Text>
            <Text style={styles.headerPillSecondary}>{sourceLabel}</Text>
          </View>
        </View>

        <Text style={styles.bodyText}>
          {program.description || descriptionFallback}
        </Text>
        {challengeDetail ? (
          <Text style={styles.muted}>{challengeDetail}</Text>
        ) : null}

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <View style={styles.statIconRow}>
                <Ionicons
                  name={stat.icon as any}
                  size={16}
                  color={theme.colors.primary}
                  style={{ marginRight: theme.spacing.xs }}
                />
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>

        <ExercisesPreview program={program} isChallenge={!!isChallenge} />

        <HistoryRecap program={program} />
      </View>
    </AnimatedCard>
  );
}

type ExercisesPreviewProps = {
  program: Program;
  isChallenge: boolean;
};

function ExercisesPreview({ program, isChallenge }: ExercisesPreviewProps) {
  const { data: exercises } = useExercises();
  const challengeSessions = useChallengeSessions(program);
  const allSessions = isChallenge ? challengeSessions : program.sessions;

  const exerciseIds = new Set<string>();
  allSessions.forEach((session) => {
    session.blocks.forEach((block) => {
      if (block.type === "exercise") {
        exerciseIds.add(block.exerciseId);
      }
    });
  });

  if (exerciseIds.size === 0) {
    return null;
  }

  const exerciseMap = new Map(
    (exercises ?? []).map((e) => [e.id, e.name] as const)
  );

  const names = Array.from(exerciseIds).map((id) => exerciseMap.get(id) ?? id);
  const preview = names.slice(0, 3);
  const remaining = names.length - preview.length;

  return (
    <View style={styles.exercisesSection}>
      <Text style={styles.exercisesLabel}>Exercises preview</Text>
      <View style={styles.exercisesRow}>
        {preview.map((name) => (
          <View key={name} style={styles.exercisePill}>
            <Text style={styles.exercisePillText}>{name}</Text>
          </View>
        ))}
        {remaining > 0 && (
          <View style={styles.exercisePill}>
            <Text style={styles.exercisePillText}>+{remaining} more</Text>
          </View>
        )}
      </View>
    </View>
  );
}

type HistoryRecapProps = {
  program: Program;
};

function HistoryRecap({ program }: HistoryRecapProps) {
  const { data: history, loading } = useLiveHistory(program.id);

  if (loading || !history || history.length === 0) {
    return null;
  }

  const recent = history.slice(0, 3);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  };

  return (
    <View style={styles.historySection}>
      <Text style={styles.historyLabel}>Previous sessions</Text>
      {recent.map((entry) => (
        <Text
          key={`${entry.date}-${entry.sessionIndex}`}
          style={styles.historyItem}
        >
          {formatDate(entry.date)} · Session {entry.sessionIndex} –{" "}
          {entry.summary}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
    gap: theme.spacing.sm
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: { ...theme.typography.h3, color: theme.colors.text },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.sm
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primaryLight
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  headerPills: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs
  },
  headerPill: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full
  },
  headerPillSecondary: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full
  },
  bodyText: { ...theme.typography.body, color: theme.colors.text },
  muted: { ...theme.typography.caption, color: theme.colors.muted },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs
  },
  stat: {
    flexGrow: 1,
    minWidth: "30%"
  },
  statIconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontFamily: theme.fonts.bold
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs
  },
  exercisesSection: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs
  },
  exercisesLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  exercisesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs
  },
  exercisePill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card
  },
  exercisePillText: {
    ...theme.typography.caption,
    color: theme.colors.text
  },
  historySection: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs
  },
  historyLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  historyItem: {
    ...theme.typography.caption,
    color: theme.colors.text
  }
});
