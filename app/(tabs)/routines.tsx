import SessionsView from "@/components/SessionsView";
import { theme } from "@/theme/theme";
import { StyleSheet, Text, View } from "react-native";

export default function RoutinesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Ups program</Text>
      <SessionsView slug="push-ups" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    marginBottom: theme.spacing.md,
  },
});
