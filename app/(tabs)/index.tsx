import { StyleSheet, Text, View } from "react-native";

import RoutinesView from "@/components/RoutinesView";

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.routinesContainer}>
        <Text style={styles.title}>Routines</Text>
        <RoutinesView />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    color: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  routinesContainer: {
    alignItems: "flex-start",
  },
});
