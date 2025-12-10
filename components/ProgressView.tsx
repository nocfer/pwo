import { useLiveProgress } from "@/hooks/useLiveProgress";
import { useProgress } from "@/hooks/useProgress";
import { theme } from "@/theme/theme";
import { useIsFocused } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { NoProgressEmpty } from "./EmptyState";
import { SkeletonStreakDots } from "./Skeleton";

type Props = {
  slug: string;
};

export default function ProgressView({ slug }: Props) {
  const isFocused = useIsFocused();
  const { data: live, loading: loadingLive, error: errorLive } = useLiveProgress(slug, isFocused ? 1 : 0);
  const { data: asset, loading: loadingAsset, error: errorAsset } = useProgress(slug);
  const loading = loadingLive || loadingAsset;
  const error = errorLive || errorAsset;

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

  const streak = live?.streak ?? (asset?.streak as (number | boolean | string)[] | undefined);
  if (!streak || streak.length === 0) {
    return <NoProgressEmpty />;
  }

  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const streakSlice = streak.slice(-7);

  return (
    <View style={styles.container}>
      <View style={styles.streakRow}>
        {streakSlice.map((hit, i) => {
          const active = Boolean(hit) && hit !== 0 && hit !== "0";
          return (
            <View key={i} style={styles.dayContainer}>
              <View
                style={[
                  styles.streakDot,
                  active ? styles.streakDotActive : styles.streakDotInactive,
                ]}
              >
                {active && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.dayLabel}>{days[i]}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.caption}>Last 7 days</Text>
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
  checkmark: {
    color: theme.colors.success,
    fontFamily: theme.fonts.bold,
    fontSize: 16,
  },
  dayLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
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
