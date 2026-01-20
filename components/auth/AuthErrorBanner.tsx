import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  message?: string | null;
};

export function AuthErrorBanner({ message }: Props) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.dangerLight,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.danger
  },
  text: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    flex: 1
  }
});

export default AuthErrorBanner;

