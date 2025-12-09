import { StyleSheet, Text, View } from "react-native";

import RoutinesView from "@/components/RoutinesView";
import { theme } from "@/theme/theme";

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
    backgroundColor: theme.colors.background,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    color: theme.colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  routinesContainer: {
    alignItems: "flex-start",
  },
});
