import { theme } from "@/theme/theme";
import type { SessionPhase } from "@/types";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type SessionHeaderProps = {
  exerciseName: string;
  sessionIndex: number;
  totalReps: number;
  phase: SessionPhase;
  phaseBg: string;
  phaseFg: string;
};

export function SessionHeader({
  exerciseName,
  sessionIndex,
  totalReps,
  phase,
  phaseBg,
  phaseFg,
}: SessionHeaderProps) {
  const phaseLabel = 
    phase === "warmup" ? "Warm-up" : 
    phase === "working" ? "Working" : 
    phase === "break" ? "Break" : "Done";

  return (
    <View style={styles.headerTop}>
      <View style={styles.headerInfo}>
        <Text style={styles.title}>{exerciseName}</Text>
        <Text style={styles.subtitle}>Session {sessionIndex} • {totalReps} reps total</Text>
      </View>
      <View style={[styles.phaseChip, { backgroundColor: phaseBg, borderColor: phaseFg }]}>
        <View style={[styles.phaseChipDot, { backgroundColor: phaseFg }]} />
        <Text style={[styles.phaseChipText, { color: phaseFg }]}>{phaseLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  phaseChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  phaseChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseChipText: {
    ...theme.typography.caption,
    fontWeight: "600",
  },
});
