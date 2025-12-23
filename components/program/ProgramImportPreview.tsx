/**
 * ProgramImportPreview - Preview component for imported programs
 * Shows program details and validates exercise dependencies
 */

import {
  calculateChallengeSessionCount,
  useExercises
} from "@/hooks/data";
import { formatCount, formatReps } from "@/lib/utils/format";
import { ShareableProgramData } from "@/lib/utils/programShare";
import { theme } from "@/theme/theme";
import { ChallengeConfig, ProgramBlock, ProgramSession } from "@/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StepCard } from "../cards";
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
  const isChallenge = Boolean(programData.challengeConfig);
  
  // For challenges, calculate session count from config
  // For regular programs, count the sessions
  const sessionCount = useMemo(() => {
    if (isChallenge && programData.challengeConfig) {
      return calculateChallengeSessionCount(programData.challengeConfig);
    }
    return programData.sessions.length;
  }, [isChallenge, programData.challengeConfig, programData.sessions.length]);

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
            {!isChallenge && (
              <View style={styles.stat}>
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.statLabel}>
                  {formatCount(sessionCount, "session")}
                </Text>
              </View>
            )}
            {isChallenge && programData.challengeConfig && (
              <View style={styles.stat}>
                <Ionicons
                  name="trending-up-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.statLabel}>
                  Target: {programData.challengeConfig.targetReps} reps
                </Text>
              </View>
            )}
            <View style={styles.stat}>
              <Ionicons
                name="fitness-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.statLabel}>
                {formatCount(exerciseCount, "exercise")}
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
              This program references {formatCount(missingExercises.length, "exercise")} that you don't have
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

      {!isChallenge && (
        <ProgramSessionsPreview
          sessions={programData.sessions}
          exercises={exercises ?? []}
          missingExerciseIds={missingExercises}
        />
      )}
      {isChallenge && programData.challengeConfig && (
        <ChallengeConfigPreview
          challengeConfig={programData.challengeConfig}
          exercises={exercises ?? []}
          missingExerciseIds={missingExercises}
        />
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
  sessionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs
  },
  sessionsTitle: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  sessionsSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.md
  },
  sessionsList: {
    gap: theme.spacing.lg
  },
  sessionContainer: {
    gap: theme.spacing.md
  },
  sessionHeader: {
    marginBottom: theme.spacing.xs
  },
  sessionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md
  },
  sessionNumber: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center"
  },
  sessionNumberText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  },
  sessionName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  sessionBlockCount: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs
  },
  blocksList: {
    gap: theme.spacing.sm,
    paddingLeft: theme.spacing.xl
  },
  blockCard: {
    marginBottom: 0
  },
  blockMeta: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    marginTop: theme.spacing.xs
  },
  blockMetaMuted: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
    fontStyle: "italic"
  },
  exerciseDetails: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
    flexWrap: "wrap"
  },
  blockNote: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
    fontStyle: "italic"
  },
  missingExerciseLabel: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    marginTop: theme.spacing.xs
  },
  challengeConfig: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.md
  },
  challengeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  challengeLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs
  },
  challengeValue: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  challengeValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  actions: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.md
  }
});

// Component to display all sessions with their blocks
type ProgramSessionsPreviewProps = {
  sessions: ProgramSession[];
  exercises: Array<{ id: string; name: string }>;
  missingExerciseIds: string[];
};

function ProgramSessionsPreview({
  sessions,
  exercises,
  missingExerciseIds
}: ProgramSessionsPreviewProps) {
  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((e) => [e.id, e.name] as const));
  }, [exercises]);

  const missingExerciseSet = useMemo(() => {
    return new Set(missingExerciseIds);
  }, [missingExerciseIds]);

  if (sessions.length === 0) {
    return null;
  }

  return (
    <AnimatedCard>
      <View style={styles.card}>
        <View style={styles.sessionsHeader}>
          <Ionicons
            name="list-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.sessionsTitle}>Program Sessions</Text>
        </View>
        <Text style={styles.sessionsSubtitle}>
          {formatCount(sessions.length, "session")} total
        </Text>

        <View style={styles.sessionsList}>
          {sessions.map((session, sessionIdx) => (
            <SessionPreview
              key={sessionIdx}
              session={session}
              exerciseMap={exerciseMap}
              missingExerciseSet={missingExerciseSet}
            />
          ))}
        </View>
      </View>
    </AnimatedCard>
  );
}

type SessionPreviewProps = {
  session: ProgramSession;
  exerciseMap: Map<string, string>;
  missingExerciseSet: Set<string>;
};

function SessionPreview({
  session,
  exerciseMap,
  missingExerciseSet
}: SessionPreviewProps) {
  const sessionName = session.name || `Session ${session.index}`;
  const blockCount = session.blocks.length;

  return (
    <View style={styles.sessionContainer}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionHeaderLeft}>
          <View style={styles.sessionNumber}>
            <Text style={styles.sessionNumberText}>{session.index}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionName}>{sessionName}</Text>
            <Text style={styles.sessionBlockCount}>
              {formatCount(blockCount, "step")}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.blocksList}>
        {session.blocks.map((block, blockIdx) => (
          <BlockPreview
            key={blockIdx}
            block={block}
            exerciseMap={exerciseMap}
            missingExerciseSet={missingExerciseSet}
            index={blockIdx}
          />
        ))}
      </View>
    </View>
  );
}

type BlockPreviewProps = {
  block: ProgramBlock;
  exerciseMap: Map<string, string>;
  missingExerciseSet: Set<string>;
  index: number;
};

function BlockPreview({
  block,
  exerciseMap,
  missingExerciseSet,
  index
}: BlockPreviewProps) {
  if (block.type === "warmup") {
    return (
      <StepCard
        title="Warm-up"
        delayMultiplier={index}
        style={styles.blockCard}
      >
        <Text style={styles.blockMeta}>{block.seconds} seconds</Text>
      </StepCard>
    );
  }

  if (block.type === "rest") {
    return (
      <StepCard
        title={block.label || "Rest"}
        delayMultiplier={index}
        style={styles.blockCard}
      >
        <Text style={styles.blockMeta}>{block.seconds} seconds</Text>
      </StepCard>
    );
  }

  // Exercise block
  const exerciseName = exerciseMap.get(block.exerciseId) || block.exerciseId;
  const isMissing = missingExerciseSet.has(block.exerciseId);

  return (
    <StepCard
      title={exerciseName}
      delayMultiplier={index}
      style={styles.blockCard}
      right={
        isMissing ? (
          <Ionicons
            name="warning-outline"
            size={16}
            color={theme.colors.warning}
          />
        ) : undefined
      }
    >
      <View style={styles.exerciseDetails}>
        {block.targetReps != null && (
          <Text style={styles.blockMeta}>{formatReps(block.targetReps)}</Text>
        )}
        {block.durationSeconds != null && (
          <Text style={styles.blockMeta}>
            {block.durationSeconds} seconds
          </Text>
        )}
        {!block.targetReps && !block.durationSeconds && (
          <Text style={styles.blockMetaMuted}>Self-guided</Text>
        )}
      </View>
      {block.note && (
        <Text style={styles.blockNote}>{block.note}</Text>
      )}
      {isMissing && (
        <Text style={styles.missingExerciseLabel}>
          Exercise not in your library
        </Text>
      )}
    </StepCard>
  );
}

// Component to display challenge configuration row
type ChallengeConfigRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: React.ReactNode;
  warning?: React.ReactNode;
};

function ChallengeConfigRow({
  icon,
  label,
  value,
  warning
}: ChallengeConfigRowProps) {
  return (
    <View style={styles.challengeRow}>
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.challengeLabel}>{label}</Text>
        {typeof value === "string" ? (
          <Text style={styles.challengeValue}>{value}</Text>
        ) : (
          value
        )}
        {warning}
      </View>
    </View>
  );
}

// Component to display challenge configuration
type ChallengeConfigPreviewProps = {
  challengeConfig: ChallengeConfig;
  exercises: Array<{ id: string; name: string }>;
  missingExerciseIds: string[];
};

function ChallengeConfigPreview({
  challengeConfig,
  exercises,
  missingExerciseIds
}: ChallengeConfigPreviewProps) {
  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((e) => [e.id, e.name] as const));
  }, [exercises]);

  const exerciseName =
    exerciseMap.get(challengeConfig.exerciseId) || challengeConfig.exerciseId;
  const isMissing = missingExerciseIds.includes(challengeConfig.exerciseId);

  return (
    <AnimatedCard>
      <View style={styles.card}>
        <View style={styles.sessionsHeader}>
          <Ionicons
            name="trophy-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.sessionsTitle}>Challenge Configuration</Text>
        </View>
        <Text style={styles.sessionsSubtitle}>
          Sessions are generated dynamically
        </Text>

        <View style={styles.challengeConfig}>
          <ChallengeConfigRow
            icon="fitness-outline"
            label="Exercise"
            value={
              <View style={styles.challengeValueRow}>
                <Text style={styles.challengeValue}>{exerciseName}</Text>
                {isMissing && (
                  <Ionicons
                    name="warning-outline"
                    size={16}
                    color={theme.colors.warning}
                  />
                )}
              </View>
            }
            warning={
              isMissing ? (
                <Text style={styles.missingExerciseLabel}>
                  Exercise not in your library
                </Text>
              ) : undefined
            }
          />

          <ChallengeConfigRow
            icon="trending-up-outline"
            label="Target Reps"
            value={`${challengeConfig.targetReps} reps`}
          />

          <ChallengeConfigRow
            icon="repeat-outline"
            label="Sets per Session"
            value={formatCount(challengeConfig.sets, "set")}
          />

          <ChallengeConfigRow
            icon="timer-outline"
            label="Warm-up"
            value={`${challengeConfig.warmUpSeconds} seconds`}
          />

          <ChallengeConfigRow
            icon="time-outline"
            label="Rest Between Sets"
            value={`${challengeConfig.breakSeconds} seconds`}
          />

          {(challengeConfig.sessionIncreasePercent ??
            challengeConfig.weeklyIncreasePercent) && (
            <ChallengeConfigRow
              icon="stats-chart-outline"
              label="Session Increase"
              value={`${
                challengeConfig.sessionIncreasePercent ??
                challengeConfig.weeklyIncreasePercent
              }%`}
            />
          )}
        </View>
      </View>
    </AnimatedCard>
  );
}

