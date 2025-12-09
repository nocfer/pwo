import { theme } from "@/theme/theme";
import { StyleSheet, Text, View } from "react-native";

export default function RoutinesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Routines screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: theme.colors.text,
  },
});
