import { useProgramSessions } from "@/hooks/useProgramSessions";
import { useSessionCompletion } from "@/hooks/useSessionCompletion";
import { theme } from "@/theme/theme";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {
  slug: string; // e.g. "push-ups"
};

export default function SessionsView({ slug }: Props) {
  const { sessions, program, loading, error } = useProgramSessions(slug);
  const { completed } = useSessionCompletion(slug);

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
      {sessions.map((s) => (
        <Pressable
          key={s.index}
          onPress={() => {
            const href = `/routines/${slug}/session/${s.index}` as any;
            router.navigate(href);
          }}
          style={({ pressed }) => [
            styles.card,
            completed.has(s.index) && styles.cardDone,
            pressed && styles.cardPressed,
          ]}
        >
          <View style={styles.rowBetween}>
            <Text style={[styles.title, completed.has(s.index) && styles.titleDone]}>Session {s.index}</Text>
            <View style={styles.rowBetween}>
              {completed.has(s.index) && <Text style={styles.tick}>✓</Text>}
              <Text style={[styles.badge, completed.has(s.index) && styles.badgeDone]}>{s.totalReps} reps</Text>
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
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.sm,
  },
  list: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  cardDone: {
    borderColor: theme.colors.success,
  },
  cardPressed: {
    backgroundColor: theme.colors.card,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  titleDone: {
    color: theme.colors.success,
  },
  subtitle: {
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  badge: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  badgeDone: {
    color: theme.colors.success,
  },
  setsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  setPill: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
  },
  setPillText: {
    color: theme.colors.text,
  },
  tick: {
    color: theme.colors.success,
    fontWeight: "700",
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  muted: {
    color: theme.colors.muted,
  },
});
