import ProgressView from "@/components/ProgressView";
import { theme } from "@/theme/theme";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function RoutinePage() {
  const params = useLocalSearchParams();
  console.log(params);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Routine</Text>
      <ProgressView slug={params.slug as string} />
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
