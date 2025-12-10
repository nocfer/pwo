import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function SessionComplete() {
  return (
    <View style={styles.doneCard}>
      <View style={styles.doneIconContainer}>
        <Ionicons
          name="checkmark-circle"
          size={48}
          color={theme.colors.success}
        />
      </View>
      <Text style={styles.doneTitle}>Session Complete!</Text>
      <Text style={styles.doneSubtitle}>Great job finishing your workout</Text>
      <Pressable
        style={({ pressed }) => [
          styles.doneButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => router.back()}
      >
        <Ionicons
          name="arrow-back"
          size={18}
          color={theme.colors.primaryTextOn}
          style={{ marginRight: theme.spacing.sm }}
        />
        <Text style={styles.doneButtonText}>Back to Routine</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  doneCard: {
    backgroundColor: theme.colors.successLight,
    borderColor: theme.colors.success,
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    alignItems: "center",
    ...theme.shadows.md,
  },
  doneIconContainer: {
    marginBottom: theme.spacing.md,
  },
  doneTitle: {
    ...theme.typography.h2,
    color: theme.colors.success,
    marginBottom: theme.spacing.xs,
  },
  doneSubtitle: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    marginBottom: theme.spacing.lg,
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.success,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    ...theme.shadows.md,
  },
  doneButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
