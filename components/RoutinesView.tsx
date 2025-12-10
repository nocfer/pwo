import { useRoutines } from "@/hooks/useRoutines";
import { theme } from "@/theme/theme";
import { StyleSheet, Text, View } from "react-native";
import RoutineButton from "./RoutineButton";

type Props = {
  query?: string;
};

export default function RoutinesView({ query }: Props) {
  const { data, loading, error } = useRoutines();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading routines…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Failed to load routines.</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No routines yet</Text>
        <Text style={styles.emptySubtitle}>Add a routine to get started</Text>
      </View>
    );
  }

  const filtered = query
    ? data.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    : data;

  if (filtered.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No results</Text>
        <Text style={styles.emptySubtitle}>Try a different search term</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {filtered.map((routine, i) => (
        <RoutineButton label={routine.name} key={i} slug={routine.slug} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  listContainer: {
    gap: theme.spacing.md,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.subtext,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.xxl,
    alignItems: "center",
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
});
