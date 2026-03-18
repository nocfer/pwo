import { theme } from '@/theme/theme'
import type { ExerciseState } from '@/types/workout'
import React, { useCallback } from 'react'
import {
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { SetDot } from './SetDot'
import { SetRow } from './SetRow'

export type ExerciseAccordionItemProps = {
  exercise: ExerciseState
  exerciseIndex: number
  isExpanded: boolean
  onToggle: () => void
  onSetDotPress: (setIndex: number) => void
  onSetRepsPress?: (setIndex: number) => void
  onSetWeightPress?: (setIndex: number) => void
  onSetConfirm?: (setIndex: number) => void
  onSetPress?: (setIndex: number) => void
  focusedField?: { setIndex: number; field: 'reps' | 'weight' } | null
}

type ExpandedContentProps = {
  exercise: ExerciseState
  onToggle?: () => void
  onSetRepsPress?: (setIndex: number) => void
  onSetWeightPress?: (setIndex: number) => void
  onSetConfirm?: (setIndex: number) => void
  onSetPress?: (setIndex: number) => void
  focusedField?: { setIndex: number; field: 'reps' | 'weight' } | null
}

function getCompletedCount(exercise: ExerciseState): number {
  return exercise.sets.filter(
    s => s.status === 'completed' || s.status === 'skipped'
  ).length
}

function ExpandedContent({
  exercise,
  onToggle,
  onSetRepsPress,
  onSetWeightPress,
  onSetConfirm,
  onSetPress,
  focusedField
}: ExpandedContentProps) {
  const completedCount = getCompletedCount(exercise)
  const progressPercent =
    exercise.sets.length > 0
      ? Math.round((completedCount / exercise.sets.length) * 100)
      : 0

  return (
    <View style={styles.expandedContent}>
      <View style={styles.expandedHeader}>
        <Pressable
          onPress={onToggle}
          accessibilityLabel={`${exercise.exerciseName}, expanded, tap to collapse`}
          accessibilityRole="button"
        >
          <Text style={styles.expandedTitle}>{exercise.exerciseName}</Text>
        </Pressable>
      </View>
      {exercise.sets.map((set, sIdx) => (
        <SetRow
          key={`set-${sIdx}`}
          setNumber={sIdx + 1}
          reps={set.reps}
          weight={set.weight}
          status={set.status}
          onRepsPress={() => onSetRepsPress?.(sIdx)}
          onWeightPress={() => onSetWeightPress?.(sIdx)}
          onConfirm={() => onSetConfirm?.(sIdx)}
          onPress={() => onSetPress?.(sIdx)}
          isRepsFocused={
            focusedField?.setIndex === sIdx && focusedField.field === 'reps'
          }
          isWeightFocused={
            focusedField?.setIndex === sIdx && focusedField.field === 'weight'
          }
        />
      ))}
      <View style={styles.progressPadding}>
        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
          accessibilityLabel="Set completion progress"
        >
          <View
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>
    </View>
  )
}

function computeSetMeta(exercise: ExerciseState): string {
  const completed = getCompletedCount(exercise)
  const total = exercise.sets.length
  const lastConfirmed = [...exercise.sets]
    .reverse()
    .find(s => s.confirmedWeight !== undefined && s.confirmedWeight > 0)
  const firstWithWeight = exercise.sets.find(s => s.weight > 0)
  const weight = lastConfirmed?.confirmedWeight ?? firstWithWeight?.weight ?? 0
  const suffix = weight > 0 ? ` · ${weight} lbs` : ''
  return `${completed}/${total}${suffix}`
}

function isExerciseComplete(exercise: ExerciseState): boolean {
  return exercise.sets.every(
    s => s.status === 'completed' || s.status === 'skipped'
  )
}

function hasActiveSet(exercise: ExerciseState): boolean {
  return exercise.sets.some(s => s.status === 'active')
}

export function ExerciseAccordionItem({
  exercise,
  exerciseIndex,
  isExpanded,
  onToggle,
  onSetDotPress,
  onSetRepsPress,
  onSetWeightPress,
  onSetConfirm,
  onSetPress,
  focusedField
}: ExerciseAccordionItemProps) {
  const complete = isExerciseComplete(exercise)
  const active = hasActiveSet(exercise)
  const setMeta = computeSetMeta(exercise)
  const completedCount = getCompletedCount(exercise)

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    onToggle()
  }, [onToggle])

  const compactLabel = `${exercise.exerciseName}, ${completedCount} of ${exercise.sets.length} sets complete, tap to expand`

  return (
    <View
      style={[
        styles.row,
        !isExpanded && complete && styles.rowComplete,
        !isExpanded && active && styles.rowCompactActive,
        isExpanded && styles.rowExpanded
      ]}
    >
      {!isExpanded && (
        <View style={styles.compactContent}>
          <Pressable
            onPress={handleToggle}
            accessibilityLabel={compactLabel}
            accessibilityRole="button"
            style={styles.textArea}
          >
            <Text
              style={[
                styles.exerciseName,
                complete && styles.exerciseNameComplete
              ]}
            >
              {exercise.exerciseName}
            </Text>
            <Text style={styles.setMeta}>{setMeta}</Text>
          </Pressable>
          <View style={styles.dotRow}>
            {exercise.sets.map((set, sIdx) => (
              <View
                key={`${exerciseIndex}-${sIdx}`}
                style={sIdx > 0 ? styles.dotGap : undefined}
              >
                <SetDot
                  setNumber={sIdx + 1}
                  status={set.status}
                  onPress={() => onSetDotPress(sIdx)}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {isExpanded && (
        <ExpandedContent
          exercise={exercise}
          onToggle={handleToggle}
          onSetRepsPress={onSetRepsPress}
          onSetWeightPress={onSetWeightPress}
          onSetConfirm={onSetConfirm}
          onSetPress={onSetPress}
          focusedField={focusedField}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    padding: 14,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  rowComplete: {
    backgroundColor: theme.colors.phases.doneBg
  },
  rowCompactActive: {
    backgroundColor: theme.colors.primaryLight
  },
  rowExpanded: {
    backgroundColor: theme.colors.surfaceElevated,
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  textArea: {
    flex: 1,
    marginRight: theme.spacing.sm
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text
  },
  exerciseNameComplete: {
    color: theme.colors.success
  },
  setMeta: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    marginTop: 2
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dotGap: {
    marginLeft: 6
  },
  expandedContent: {
    backgroundColor: theme.colors.surfaceElevated
  },
  expandedHeader: {
    paddingTop: 14,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm
  },
  expandedTitle: {
    ...theme.typography.h2,
    color: theme.colors.primary
  },
  progressPadding: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md
  },
  progressTrack: {
    height: 3,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginTop: theme.spacing.xs,
    overflow: 'hidden' as const
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 2
  }
})
