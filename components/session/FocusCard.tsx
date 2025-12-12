import { formatTime } from "@/lib/utils/format";
import { theme } from "@/theme/theme";
import type { SessionPhase } from "@/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type FocusCardProps = {
  phase: SessionPhase;
  timer: number;
  currentSet: number;
  totalSets: number;
  currentReps: number;
  phaseBg: string;
  phaseFg: string;
};

export function FocusCard({
  phase,
  timer,
  currentSet,
  totalSets,
  currentReps,
  phaseBg,
  phaseFg
}: FocusCardProps) {
  // Show timer card for warmup and break phases
  if (phase !== "working" && phase !== "done") {
    return (
      <View
        style={[
          styles.focusCard,
          { backgroundColor: phaseBg, borderColor: phaseFg }
        ]}
      >
        <Text style={[styles.timerHero, { color: phaseFg }]}>
          {formatTime(timer)}
        </Text>
        <Text style={styles.focusLabel}>
          {phase === "warmup"
            ? "Get ready for your workout"
            : `Rest after set ${currentSet}`}
        </Text>
      </View>
    );
  }

  // Show info pills for working and done phases
  return (
    <View style={styles.focusRow}>
      <View
        style={[
          styles.infoPill,
          { backgroundColor: phaseBg, borderColor: phaseFg }
        ]}
      >
        <Ionicons name="barbell-outline" size={18} color={phaseFg} />
        <Text style={[styles.infoPillText, { color: phaseFg }]}>
          Set {currentSet}/{totalSets}
        </Text>
      </View>
      <View
        style={[
          styles.infoPill,
          { backgroundColor: phaseBg, borderColor: phaseFg }
        ]}
      >
        <Ionicons name="repeat-outline" size={18} color={phaseFg} />
        <Text style={[styles.infoPillText, { color: phaseFg }]}>
          {currentReps} reps
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  focusCard: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    ...theme.shadows.md
  },
  timerHero: {
    fontSize: 56,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginBottom: theme.spacing.xs
  },
  focusLabel: {
    ...theme.typography.body,
    color: theme.colors.muted
  },
  focusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md
  },
  infoPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md
  },
  infoPillText: {
    ...theme.typography.bodyBold
  }
});
