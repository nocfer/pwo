/**
 * ProgramImportPreview - Preview component for imported programs
 * Shows program details and validates exercise dependencies
 */

import { useExercises } from "@/hooks/data";
import { ShareableProgramData } from "@/lib/utils/programShare";
import { theme } from "@/theme/theme";
import { ProgramBlock } from "@/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AnimatedCard } from "../common";
import Button from "../common/Button";

type Props = {
  programData: ShareableProgramData;
  onConfirm: () => void;
  onCancel: () => void;
  isImporting?: boolean;
};

export default function ProgramImportPreview({
  programData,
  onConfirm,
  onCancel,
  isImporting = false
}: Props) {
  const { data: exercises } = useExercises();

  // Extract all exercise IDs from the program
  const exerciseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const session of programData.sessions) {
      for (const block of session.blocks) {
        if (block.type === "exercise") {
          ids.add(block.exerciseId);
        }
      }
    }
    if (programData.challengeConfig) {
      ids.add(programData.challengeConfig.exerciseId);
    }
    return Array.from(ids);
  }, [programData]);

  // Check which exercises are missing
  const missingExercises = useMemo(() => {
    if (!exercises) return exerciseIds;
    const exerciseIdSet = new Set(exercises.map((e) => e.id));
    return exerciseIds.filter((id) => !exerciseIdSet.has(id));
  }, [exercises, exerciseIds]);

  const hasMissingExercises = missingExercises.length > 0;
  const sessionCount = programData.sessions.length;
  const isChallenge = Boolean(programData.challengeConfig);

  // Count exercises in program
  const exerciseCount = exerciseIds.length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AnimatedCard>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="download-outline"
                size={24}
                color={theme.colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Import Program</Text>
              <Text style={styles.subtitle}>Review before importing</Text>
            </View>
          </View>
        </View>
      </AnimatedCard>

      <AnimatedCard>
        <View style={styles.card}>
          <Text style={styles.programName}>{programData.name}</Text>
          {programData.description && (
            <Text style={styles.description}>{programData.description}</Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons
                name={isChallenge ? "trophy-outline" : "barbell-outline"}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.statLabel}>
                {isChallenge ? "Challenge" : "Program"}
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons
                name="list-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.statLabel}>
                {sessionCount} session{sessionCount === 1 ? "" : "s"}
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons
                name="fitness-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.statLabel}>
                {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"}
              </Text>
            </View>
          </View>
        </View>
      </AnimatedCard>

      {hasMissingExercises && (
        <AnimatedCard>
          <View style={styles.card}>
            <View style={styles.warningHeader}>
              <Ionicons
                name="warning-outline"
                size={20}
                color={theme.colors.warning}
              />
              <Text style={styles.warningTitle}>Missing Exercises</Text>
            </View>
            <Text style={styles.warningText}>
              This program references {missingExercises.length} exercise
              {missingExercises.length === 1 ? "" : "s"} that you don't have
              in your library:
            </Text>
            <View style={styles.missingList}>
              {missingExercises.map((id) => (
                <View key={id} style={styles.missingItem}>
                  <Ionicons
                    name="close-circle-outline"
                    size={16}
                    color={theme.colors.muted}
                  />
                  <Text style={styles.missingText}>{id}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.warningNote}>
              You can still import the program and add these exercises later.
            </Text>
          </View>
        </AnimatedCard>
      )}

      <View style={styles.actions}>
        <Button
          label="Cancel"
          variant="secondary"
          onPress={onCancel}
          disabled={isImporting}
          fullWidth
        />
        <Button
          label={isImporting ? "Importing..." : "Import Program"}
          variant="primary"
          icon="download"
          onPress={onConfirm}
          disabled={isImporting}
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs
  },
  programName: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    marginBottom: theme.spacing.md
  },
  statsRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    flexWrap: "wrap"
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.text
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm
  },
  warningTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.warning
  },
  warningText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  missingList: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md
  },
  missingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  missingText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular
  },
  warningNote: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontStyle: "italic"
  },
  actions: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.md
  }
});

