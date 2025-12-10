import { NoProgressEmpty } from "@/components/common/EmptyState";
import { SkeletonStreakDots } from "@/components/common/Skeleton";
import { useLiveProgress } from "@/hooks/data";
import { getTodayIndex } from "@/lib/utils/date";
import { theme } from "@/theme/theme";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  slug: string;
};

export default function ProgressView({ slug }: Props) {
  const { data, loading, error } = useLiveProgress(slug);
  const todayIndex = getTodayIndex(); // 0=Mon, 6=Sun

  if (loading) {
    return <SkeletonStreakDots />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Failed to load progress.</Text>
      </View>
    );
  }

  const streak = data?.streak;
  if (!streak || streak.length === 0) {
    return <NoProgressEmpty />;
  }

  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const streakSlice = streak.slice(-7);

  return (
    <View style={styles.container}>
      <View style={styles.streakRow}>
        {streakSlice.map((hit, i) => {
          const active = Boolean(hit) && hit !== 0;
          const isToday = i === todayIndex;
          return (
            <View key={i} style={styles.dayContainer}>
              <View
                style={[
                  styles.streakDot,
                  active ? styles.streakDotActive : styles.streakDotInactive,
                  isToday && styles.streakDotToday,
                ]}
              >
                {active && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {days[i]}
              </Text>
              {isToday && <View style={styles.todayDot} />}
            </View>
          );
        })}
      </View>
      <Text style={styles.caption}>This week</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  dayContainer: {
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  streakDot: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  streakDotActive: {
    backgroundColor: theme.colors.successLight,
    borderColor: theme.colors.success,
  },
  streakDotInactive: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
  },
  streakDotToday: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  checkmark: {
    color: theme.colors.success,
    fontFamily: theme.fonts.bold,
    fontSize: 16,
  },
  dayLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
  },
  dayLabelToday: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.subtext,
  },
  caption: {
    marginTop: theme.spacing.md,
    ...theme.typography.caption,
    color: theme.colors.muted,
  },
});
