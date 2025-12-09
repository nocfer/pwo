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
      <View style={styles.container}>
        <Text style={styles.message}>No routines available.</Text>
      </View>
    );
  }

  const filtered = query
    ? data.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    : data;

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
    padding: theme.spacing.sm,
  },
  listContainer: {
    gap: theme.spacing.sm,
  },
  message: {
    color: theme.colors.subtext,
  },
});
