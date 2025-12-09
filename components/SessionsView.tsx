import { useProgramSessions } from "@/hooks/useProgramSessions";
import { theme } from "@/theme/theme";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {
  slug: string; // e.g. "push-ups"
};

export default function SessionsView({ slug }: Props) {
  const { sessions, program, loading, error } = useProgramSessions(slug);

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
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <View style={styles.rowBetween}>
            <Text style={styles.title}>Session {s.index}</Text>
            <Text style={styles.badge}>{s.totalReps} reps</Text>
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
  subtitle: {
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  badge: {
    color: theme.colors.primary,
    fontWeight: "600",
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
  muted: {
    color: theme.colors.muted,
  },
});
