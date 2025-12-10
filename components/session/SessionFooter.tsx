import { theme } from "@/theme/theme";
import type { SessionPhase } from "@/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

type SessionFooterProps = {
  phase: SessionPhase;
  currentSet: number;
  isPaused: boolean;
  onPauseResume: () => void;
  onSkip: () => void;
  onComplete: () => void;
};

export function SessionFooter({
  phase,
  currentSet,
  isPaused,
  onPauseResume,
  onSkip,
  onComplete,
}: SessionFooterProps) {
  if (phase === "done") return null;

  return (
    <SafeAreaView style={styles.footer}>
      <View style={styles.footerContent}>
        {/* Secondary actions row */}
        <View style={styles.secondaryRow}>
          <Pressable
            disabled={phase === "working"}
            onPress={onPauseResume}
            style={({ pressed }) => [
              styles.secondaryBtn,
              (phase === "working") && styles.btnDisabled,
              pressed && styles.secondaryBtnPressed,
            ]}
          >
            <Ionicons
              name={isPaused ? "play" : "pause"}
              size={20}
              color={phase === "working" ? theme.colors.muted : theme.colors.text}
            />
            <Text style={[styles.secondaryBtnText, phase === "working" && styles.textDisabled]}>
              {isPaused ? "Resume" : "Pause"}
            </Text>
          </Pressable>

          <Pressable
            onPress={onSkip}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.secondaryBtnPressed,
            ]}
          >
            <Ionicons name="play-skip-forward" size={20} color={theme.colors.text} />
            <Text style={styles.secondaryBtnText}>Skip</Text>
          </Pressable>
        </View>

        {/* Primary action */}
        <Pressable
          disabled={phase !== "working"}
          onPress={onComplete}
          style={({ pressed }) => [
            styles.primaryBtn,
            phase !== "working" && styles.primaryBtnDisabled,
            pressed && phase === "working" && styles.primaryBtnPressed,
          ]}
        >
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={theme.colors.primaryTextOn}
            style={{ marginRight: theme.spacing.sm }}
          />
          <Text style={styles.primaryBtnText}>
            {phase === "working" ? `Complete Set ${currentSet}` : phase === "warmup" ? "Warming up..." : "Resting..."}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    ...theme.shadows.lg,
  },
  footerContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  secondaryRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  secondaryBtnPressed: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.98 }],
  },
  secondaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  primaryBtnDisabled: {
    backgroundColor: theme.colors.muted,
  },
  primaryBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn,
    fontSize: 16,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: theme.colors.muted,
  },
});
