/**
 * LoadingScreen - Consistent loading state wrapper
 *
 * Provides a centered loading message within a SafeAreaView
 */

import { theme } from "@/theme/theme";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  message?: string;
};

export function LoadingScreen({ message = "Loading…" }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.muted
  }
});

export default LoadingScreen;
