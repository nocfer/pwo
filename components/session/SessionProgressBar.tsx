import { theme } from "@/theme/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type SessionProgressBarProps = {
  completedSets: number;
  totalSets: number;
  progress: number;
  phaseFg: string;
};

export function SessionProgressBar({
  completedSets,
  totalSets,
  progress,
  phaseFg
}: SessionProgressBarProps) {
  return (
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Progress</Text>
        <Text style={styles.progressValue}>
          {completedSets}/{totalSets} sets
        </Text>
      </View>
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.round(progress * 100)}%`,
              backgroundColor: phaseFg
            }
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressSection: {
    gap: theme.spacing.xs
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  progressLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  progressValue: {
    ...theme.typography.caption,
    fontWeight: "600",
    color: theme.colors.subtext
  },
  progressBarTrack: {
    height: 8,
    width: "100%",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%",
    borderRadius: theme.radius.sm
  }
});
