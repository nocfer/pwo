/**
 * ProgramImportPreview - Preview component for imported programs
 * Shows program details and validates exercise dependencies
 */

import { useExercises } from '@/hooks/data'
import { formatCount, formatReps, getFirstReps } from '@/lib/utils/format'
import { theme } from '@/theme/theme'
import { Exercise, Program, ProgramBlock } from '@/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { StepCard } from '../cards'
import { AnimatedCard } from '../common'
import Button from '../common/Button'

type Props = {
  programData: Program
  onConfirm: () => void
  onCancel: () => void
  isImporting?: boolean
}

export default function ProgramImportPreview({
  programData,
  onConfirm,
  onCancel,
  isImporting = false
}: Props) {
  const { data: exercises } = useExercises()

  // Extract all exercise IDs from the program
  const exerciseIds = useMemo(() => {
    const ids = new Set<string>()
    for (const block of programData.blocks) {
      ids.add(block.exerciseId)
    }
    return Array.from(ids)
  }, [programData])

  // Check which exercises are missing
  const missingExercises = useMemo(() => {
    if (!exercises) return exerciseIds
    const exerciseIdSet = new Set(exercises.map((e: Exercise) => e.id))
    return exerciseIds.filter(id => !exerciseIdSet.has(id))
  }, [exercises, exerciseIds])

  const hasMissingExercises = missingExercises.length > 0

  // Count exercises in program
  const exerciseCount = exerciseIds.length

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
                name={'barbell-outline'}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.statLabel}>{'Program'}</Text>
            </View>
            {
              <View style={styles.stat}>
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.statLabel}>
                  {formatCount(1, 'session')}
                </Text>
              </View>
            }
            <View style={styles.stat}>
              <Ionicons
                name="fitness-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.statLabel}>
                {formatCount(exerciseCount, 'exercise')}
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
              {` This program references${' '}
              ${formatCount(missingExercises.length, 'exercise')} that you don't
              have in your library:`}
            </Text>
            <View style={styles.missingList}>
              {missingExercises.map(id => (
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
      <BlocksPreview
        blocks={programData.blocks}
        exercises={exercises ?? []}
        missingExerciseIds={missingExercises}
        initialWarmup={programData.initialWarmup}
      />
      <View style={styles.actions}>
        <Button
          label="Cancel"
          variant="secondary"
          onPress={onCancel}
          disabled={isImporting}
          fullWidth
        />
        <Button
          label={isImporting ? 'Importing...' : 'Import Program'}
          variant="primary"
          icon="download"
          onPress={onConfirm}
          disabled={isImporting}
          fullWidth
        />
      </View>
    </ScrollView>
  )
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
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
    flexDirection: 'row',
    gap: theme.spacing.md,
    flexWrap: 'wrap'
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    fontStyle: 'italic'
  },
  sessionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md
  },
  sessionNumber: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
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
    fontStyle: 'italic'
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
    flexWrap: 'wrap'
  },
  blockNote: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic'
  },
  missingExerciseLabel: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    marginTop: theme.spacing.xs
  },
  actions: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.md
  }
})

// Component to display all blocks
type BlocksPreviewProps = {
  blocks: ProgramBlock[]
  exercises: { id: string; name: string }[]
  missingExerciseIds: string[]
  initialWarmup?: { seconds: number }
}

function BlocksPreview({
  blocks,
  exercises,
  missingExerciseIds,
  initialWarmup
}: BlocksPreviewProps) {
  const exerciseMap = useMemo(() => {
    return new Map(exercises.map(e => [e.id, e.name] as const))
  }, [exercises])

  const missingExerciseSet = useMemo(() => {
    return new Set(missingExerciseIds)
  }, [missingExerciseIds])

  if (blocks.length === 0) {
    return null
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
          <Text style={styles.sessionsTitle}>Workout Blocks</Text>
        </View>
        <Text style={styles.sessionsSubtitle}>
          {formatCount(blocks.length, 'block')} total
        </Text>

        <View style={styles.blocksList}>
          {initialWarmup && (
            <StepCard
              title="Warm-up"
              delayMultiplier={0}
              style={styles.blockCard}
            >
              <Text style={styles.blockMeta}>
                {initialWarmup.seconds} seconds
              </Text>
            </StepCard>
          )}
          {blocks.map((block, blockIdx) => (
            <BlockPreview
              key={blockIdx}
              block={block}
              exerciseMap={exerciseMap}
              missingExerciseSet={missingExerciseSet}
              index={blockIdx + (initialWarmup ? 1 : 0)}
            />
          ))}
        </View>
      </View>
    </AnimatedCard>
  )
}

type BlockPreviewProps = {
  block: ProgramBlock
  exerciseMap: Map<string, string>
  missingExerciseSet: Set<string>
  index: number
}

function BlockPreview({
  block,
  exerciseMap,
  missingExerciseSet,
  index
}: BlockPreviewProps) {
  const exerciseName = exerciseMap.get(block.exerciseId) || block.exerciseId
  const isMissing = missingExerciseSet.has(block.exerciseId)
  const sets = block.sets ?? 1
  const restBetweenSets = block.restBetweenSets ?? 60

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
          <Text style={styles.blockMeta}>
            {formatReps(getFirstReps(block.targetReps))}
          </Text>
        )}
        {block.durationSeconds != null && (
          <Text style={styles.blockMeta}>{block.durationSeconds} seconds</Text>
        )}
        {!block.targetReps && !block.durationSeconds && (
          <Text style={styles.blockMetaMuted}>Self-guided</Text>
        )}
        {sets > 1 && (
          <Text style={styles.blockMeta}>{formatCount(sets, 'set')}</Text>
        )}
        {sets > 1 && (
          <Text style={styles.blockMeta}>Rest: {restBetweenSets}s</Text>
        )}
      </View>
      {block.note && <Text style={styles.blockNote}>{block.note}</Text>}
      {isMissing && (
        <Text style={styles.missingExerciseLabel}>
          Exercise not in your library
        </Text>
      )}
    </StepCard>
  )
}
