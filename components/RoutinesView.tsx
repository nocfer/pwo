import { useRoutines } from "@/hooks/useRoutines";
import { theme } from "@/theme/theme";
import { StyleSheet, Text, View } from "react-native";
import RoutineButton from "./RoutineButton";

export default function RoutinesView() {
  const { data, loading, error } = useRoutines();

  if (loading) {
    return (
      <View style={styles.buttonContainer}>
        <Text style={styles.message}>Loading routines…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.buttonContainer}>
        <Text style={styles.message}>Failed to load routines.</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.buttonContainer}>
        <Text style={styles.message}>No routines available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.buttonContainer}>
      {data.map((routine, i) => (
        <RoutineButton label={routine.name} key={i} slug={routine.slug} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.sm,
  },
  message: {
    color: theme.colors.subtext,
  },
});
