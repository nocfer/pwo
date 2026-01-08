/**
 * ErrorScreen - Consistent error/not-found state wrapper
 */

import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  message?: string;
  showBackButton?: boolean;
  onBack?: () => void;
};

export function ErrorScreen({
  message = "Something went wrong.",
  showBackButton = true,
  onBack
}: Props) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={32}
            color={theme.colors.muted}
          />
        </View>
        <Text style={styles.message}>{message}</Text>
        {showBackButton && (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </Pressable>
        )}
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
    justifyContent: "center",
    padding: theme.spacing.lg
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    marginBottom: theme.spacing.lg
  },
  button: {
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface
  },
  buttonPressed: {
    backgroundColor: theme.colors.background,
    transform: [{ scale: 0.98 }]
  },
  buttonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  }
});

export default ErrorScreen;
