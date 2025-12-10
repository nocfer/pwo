import { useProgramSessions } from "@/hooks/useProgramSessions";
import { useSessionCompletion } from "@/hooks/useSessionCompletion";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {
  slug: string;
};

export default function SessionsView({ slug }: Props) {
  const { sessions, program, loading, error } = useProgramSessions(slug);
  const isFocused = useIsFocused();
  const { completed } = useSessionCompletion(slug, isFocused ? 1 : 0);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading sessions…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Failed to load sessions.</Text>
      </View>
    );
  }
  if (!program || sessions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>No sessions available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {sessions.map((s) => {
        const isDone = completed.has(s.index);
        return (
          <Pressable
            key={s.index}
            onPress={() => {
              const href = `/routines/${slug}/session/${s.index}` as any;
              router.navigate(href);
            }}
            style={({ pressed }) => [
              styles.card,
              isDone && styles.cardDone,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.rowBetween}>
              <View style={styles.titleRow}>
                <View style={[styles.sessionIcon, isDone && styles.sessionIconDone]}>
                  <Ionicons
                    name={isDone ? "checkmark" : "barbell-outline"}
                    size={16}
                    color={isDone ? theme.colors.success : theme.colors.primary}
                  />
                </View>
                <Text style={[styles.title, isDone && styles.titleDone]}>
                  Session {s.index}
                </Text>
              </View>
              <View style={[styles.badge, isDone && styles.badgeDone]}>
                <Text style={[styles.badgeText, isDone && styles.badgeTextDone]}>
                  {s.totalReps} reps
                </Text>
              </View>
            </View>
            <Text style={styles.subtitle}>{program.exercise.name}</Text>
            <View style={styles.setsRow}>
              {s.sets.map((r, i) => (
                <View key={i} style={styles.setPill}>
                  <Text style={styles.setPillText}>{r}</Text>
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
  title: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  },
  titleDone: {
    color: theme.colors.success,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
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
  badgeText: {
    ...theme.typography.caption,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  badgeTextDone: {
    color: theme.colors.success,
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
  muted: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
});
