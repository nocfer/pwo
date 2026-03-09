import { theme } from '@/theme/theme'
import type { ExerciseState } from '@/types/workout'
import React, { useCallback } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { SetDot } from './SetDot'

export type ExerciseAccordionItemProps = {
  exercise: ExerciseState
  exerciseIndex: number
  isExpanded: boolean
  onToggle: () => void
  onSetDotPress: (setIndex: number) => void
}

function ExpandedContent({ exercise }: { exercise: ExerciseState }) {
  return (
    <View style={styles.expandedContent}>
      <Text style={styles.expandedTitle}>{exercise.exerciseName}</Text>
      {exercise.sets.map((_, sIdx) => (
        <View key={`placeholder-${sIdx}`} style={styles.setRowPlaceholder}>
          <Text style={styles.placeholderText}>
            Set {sIdx + 1} — SetRow placeholder (Story 2.4)
          </Text>
        </View>
      ))}
    </View>
  )
}

function computeSetMeta(exercise: ExerciseState): string {
  const completed = exercise.sets.filter(
    s => s.status === 'completed' || s.status === 'skipped'
  ).length
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
  onSetDotPress
}: ExerciseAccordionItemProps) {
  const complete = isExerciseComplete(exercise)
  const active = hasActiveSet(exercise)
  const setMeta = computeSetMeta(exercise)
  const completedCount = exercise.sets.filter(
    s => s.status === 'completed' || s.status === 'skipped'
  ).length

  const contentHeight = useSharedValue(0)
  const animatedHeight = useDerivedValue(() =>
    withTiming(isExpanded ? contentHeight.value : 0, { duration: 250 })
  )
  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: 'hidden' as const
  }))

  const handleLayout = useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) => {
      contentHeight.value = e.nativeEvent.layout.height
    },
    [contentHeight]
  )

  const compactLabel = `${exercise.exerciseName}, ${completedCount} of ${exercise.sets.length} sets complete, tap to expand`
  const expandedLabel = `${exercise.exerciseName}, expanded`

  return (
    <View
      style={[
        styles.row,
        !isExpanded && active && styles.rowCompactActive,
        isExpanded && styles.rowExpanded
      ]}
    >
      <Pressable
        onPress={onToggle}
        accessibilityLabel={isExpanded ? expandedLabel : compactLabel}
        accessibilityRole="button"
      >
        <View style={styles.compactContent}>
          <View style={styles.textArea}>
            <Text
              style={[
                styles.exerciseName,
                complete && styles.exerciseNameComplete
              ]}
            >
              {exercise.exerciseName}
            </Text>
            <Text style={styles.setMeta}>{setMeta}</Text>
          </View>
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
      </Pressable>

      <Animated.View style={animatedStyle}>
        <ExpandedContent exercise={exercise} />
      </Animated.View>

      <View style={styles.measureContainer} pointerEvents="none">
        <View onLayout={handleLayout}>
          <ExpandedContent exercise={exercise} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs
  },
  rowCompactActive: {
    backgroundColor: theme.colors.primaryLight
  },
  rowExpanded: {
    backgroundColor: theme.colors.surface
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
    ...theme.typography.bodyBold,
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
    marginLeft: theme.spacing.xs
  },
  expandedContent: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.sm
  },
  expandedTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  setRowPlaceholder: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs
  },
  placeholderText: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  measureContainer: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0
  }
})
