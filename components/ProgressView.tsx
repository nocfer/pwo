import { useLiveProgress } from "@/hooks/useLiveProgress";
import { useProgress } from "@/hooks/useProgress";
import { theme } from "@/theme/theme";
import { useIsFocused } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";

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
    return (
      <View style={styles.viewContainer}>
        <Text style={styles.message}>Loading progress…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.viewContainer}>
        <Text style={styles.message}>Failed to load progress.</Text>
      </View>
    );
  }

  const streak = live?.streak ?? (asset?.streak as (number | boolean | string)[] | undefined);
  if (!streak || streak.length === 0) {
    return (
      <View style={styles.viewContainer}>
        <Text style={styles.message}>No progress yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.viewContainer}>
      <View style={styles.streakRow}>
        {streak.slice(-7).map((hit, i) => {
          const active = Boolean(hit) && hit !== 0 && hit !== "0";
          return (
            <View
              key={i}
              style={[
                styles.streakDot,
                active ? styles.streakDotActive : styles.streakDotInactive,
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.caption}>Last 7 days</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  viewContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.sm,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  streakDotActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  streakDotInactive: {
    backgroundColor: theme.colors.card,
  },
  message: {
    color: theme.colors.subtext,
  },
  caption: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    fontSize: 12,
  },
});
