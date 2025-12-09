import { StyleSheet, View } from "react-native";
import RoutineButton from "./RoutineButton";

export default async function RoutinesView() {
  const availableRoutines = await import("@/assets/data/routines.json");

  return (
    <View style={styles.buttonContainer}>
      {availableRoutines.default.map((routine, i) => (
        <RoutineButton
          label={routine.name}
          key={i}
          slug={routine.slug}
        ></RoutineButton>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
});
