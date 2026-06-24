/**
 * ProgramImportPreview - Preview a shared program before adding a copy to the
 * library. Shows a hero (name + source badge + stats), an INCLUDES list of the
 * first few exercises with sets × reps, a privacy note, and Cancel / Add actions.
 */

import { useExercises } from '@/hooks/data'
import { getSourceBadge } from '@/lib/utils'
import { getFirstReps } from '@/lib/utils/format'
import { theme } from '@/theme/theme'
import { Exercise, Program, ProgramBlock } from '@/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

type Props = {
  programData: Program
  onConfirm: () => void
  onCancel: () => void
  isImporting?: boolean
}

const PREVIEW_LIMIT = 4
const SECONDS_PER_REP = 4

function blockReps(block: ProgramBlock): string {
  const sets = block.sets ?? 1
  if (typeof block.durationSeconds === 'number') {
    return `${sets} × ${block.durationSeconds}s`
  }
  if (block.targetReps != null) {
    return `${sets} × ${getFirstReps(block.targetReps)}`
  }
  return `${sets} set${sets === 1 ? '' : 's'}`
}

function estimateMinutes(program: Program): number {
  let total = program.initialWarmup?.seconds ?? 0
  const rest = program.defaultRestBetweenExercises ?? 60
  program.blocks.forEach((block, i) => {
    const sets = block.sets ?? 1
    const work =
      typeof block.durationSeconds === 'number'
        ? block.durationSeconds
        : getFirstReps(block.targetReps ?? 0) * SECONDS_PER_REP
    total += sets * work + sets * (block.restBetweenSets ?? 60)
    if (i < program.blocks.length - 1) total += rest
  })
  return Math.max(1, Math.round(total / 60))
}

export default function ProgramImportPreview({
  programData,
  onConfirm,
  onCancel,
  isImporting = false
}: Props) {
  const { data: exercises } = useExercises()

  const exerciseMap = useMemo(
    () => new Map((exercises ?? []).map((e: Exercise) => [e.id, e.name])),
    [exercises]
  )

  const exerciseIds = useMemo(
    () => Array.from(new Set(programData.blocks.map(b => b.exerciseId))),
    [programData]
  )

  const missingCount = useMemo(() => {
    if (!exercises) return 0
    const ids = new Set(exercises.map((e: Exercise) => e.id))
    return exerciseIds.filter(id => !ids.has(id)).length
  }, [exercises, exerciseIds])

  const badge = programData.source ? getSourceBadge(programData.source) : null
  const previewBlocks = programData.blocks.slice(0, PREVIEW_LIMIT)
  const remaining = programData.blocks.length - previewBlocks.length
  const estMinutes = useMemo(() => estimateMinutes(programData), [programData])

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroName}>{programData.name}</Text>
            {badge && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: badge.bg },
                  badge.border
                    ? { borderWidth: 1, borderColor: badge.border }
                    : null
                ]}
              >
                <Text style={[styles.badgeText, { color: badge.color }]}>
                  {badge.label}
                </Text>
              </View>
            )}
          </View>
          {programData.description ? (
            <Text style={styles.heroDescription}>{programData.description}</Text>
          ) : null}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, styles.statValueAccent]}>
                {exerciseIds.length}
              </Text>
              <Text style={styles.statLabel}>exercises</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>1</Text>
              <Text style={styles.statLabel}>session</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>~{estMinutes}</Text>
              <Text style={styles.statLabel}>min/session</Text>
            </View>
          </View>
        </View>

        {/* Includes */}
        <Text style={styles.sectionLabel}>Includes</Text>
        <View style={styles.includesList}>
          {previewBlocks.map((block, i) => (
            <View key={`${block.exerciseId}-${i}`} style={styles.includeRow}>
              <Text style={styles.includeName} numberOfLines={1}>
                {exerciseMap.get(block.exerciseId) || 'Unknown exercise'}
              </Text>
              <Text style={styles.includeReps}>{blockReps(block)}</Text>
            </View>
          ))}
          {remaining > 0 && (
            <Text style={styles.moreText}>
              + {remaining} more exercise{remaining === 1 ? '' : 's'}
            </Text>
          )}
        </View>

        {missingCount > 0 && (
          <View style={styles.warningNote}>
            <Ionicons
              name="warning-outline"
              size={16}
              color={theme.colors.warning}
            />
            <Text style={styles.warningText}>
              {missingCount} exercise{missingCount === 1 ? '' : 's'} not in your
              library yet — you can add them later.
            </Text>
          </View>
        )}

        {/* Info note */}
        <View style={styles.infoNote}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="information"
              size={12}
              color={theme.colors.info}
            />
          </View>
          <Text style={styles.infoText}>
            A copy is added to your library. Your data isn&apos;t shared back.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={onCancel}
          disabled={isImporting}
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          disabled={isImporting}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.buttonPressed,
            isImporting && styles.addButtonDisabled
          ]}
        >
          <Text style={styles.addText}>
            {isImporting ? 'Adding…' : 'Add to library'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scroll: {
    flex: 1
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl
  },
  hero: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  heroName: {
    ...theme.typography.h2,
    fontFamily: theme.fonts.display,
    color: theme.colors.text,
    flexShrink: 1
  },
  badge: {
    borderRadius: theme.radius.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3
  },
  badgeText: {
    ...theme.typography.small,
    fontFamily: theme.fonts.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  heroDescription: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    marginTop: theme.spacing.sm
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
    marginTop: theme.spacing.md
  },
  stat: {
    gap: 2
  },
  statValue: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 19,
    color: theme.colors.text
  },
  statValueAccent: {
    color: theme.colors.primary
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.muted
  },
  sectionLabel: {
    ...theme.typography.small,
    color: theme.colors.faint,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: theme.spacing.xs,
    marginTop: theme.spacing.sm
  },
  includesList: {
    gap: theme.spacing.sm
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md
  },
  includeName: {
    ...theme.typography.body,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm
  },
  includeReps: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 13,
    color: theme.colors.subtext
  },
  moreText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textAlign: 'center',
    paddingTop: 2
  },
  warningNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md
  },
  warningText: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    flex: 1
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.infoLight,
    borderWidth: 1,
    borderColor: theme.colors.info,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md
  },
  infoIcon: {
    width: 18,
    height: 18,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: theme.colors.info,
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoText: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    flex: 1
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  cancelButton: {
    flex: 1,
    height: 54,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelText: {
    ...theme.typography.bodyBold,
    color: theme.colors.subtext
  },
  addButton: {
    flex: 1.5,
    height: 54,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButtonDisabled: {
    opacity: 0.6
  },
  buttonPressed: {
    opacity: 0.9
  },
  addText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  }
})
