import { theme } from "@/theme/theme";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type TimerControlsProps = {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  layout?: "row" | "column";
};

export function TimerControls({ isPaused, onPause, onResume, onSkip, layout = "row" }: TimerControlsProps) {
  return (
    <View style={[styles.container, layout === "row" && styles.row]}>
      {!isPaused ? (
        <Pressable style={({ pressed }) => [styles.ctaSecondary, pressed && styles.ctaSecondaryPressed]} onPress={onPause}>
          <Text style={styles.ctaSecondaryText}>Pause</Text>
        </Pressable>
      ) : (
        <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} onPress={onResume}>
          <Text style={styles.ctaText}>Resume</Text>
        </Pressable>
      )}
      <Pressable style={({ pressed }) => [styles.ctaSecondary, pressed && styles.ctaSecondaryPressed]} onPress={onSkip}>
        <Text style={styles.ctaSecondaryText}>Skip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  cta: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    color: theme.colors.primaryTextOn,
    fontWeight: "600",
  },
  ctaSecondary: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
  },
  ctaSecondaryPressed: {
    backgroundColor: theme.colors.card,
  },
  ctaSecondaryText: {
    color: theme.colors.text,
    fontWeight: "600",
  },
});

export default TimerControls;
