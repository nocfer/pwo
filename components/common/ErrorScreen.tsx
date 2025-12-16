/**
 * ErrorScreen - Consistent error/not-found state wrapper
 *
 * Provides a centered error message with optional back button
 */

import { theme } from "@/theme/theme";
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
        <Text style={styles.message}>{message}</Text>
        {showBackButton && (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={styles.buttonText}>Back</Text>
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
  message: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center"
  },
  button: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface
  },
  buttonPressed: {
    backgroundColor: theme.colors.card
  },
  buttonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  }
});

export default ErrorScreen;

