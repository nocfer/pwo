/**
 * WorkoutMatrix - Elegant workout progress visualization
 *
 * Modern, compact display showing exercises with inline set progress indicators.
 */

import { WorkoutStep } from '@/hooks/session'
import { theme } from '@/theme/theme'
import { StepStatus } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

type SetInfo = {
  stepIndex: number
  setNumber: number
  isDone: boolean
  isCurrent: boolean
  isSkipped: boolean
  targetReps?: number
  completionCount: number
}

type ExerciseRow = {
  exerciseId: string
  name: string
  sets: SetInfo[]
  targetReps?: number
  isNext: boolean
}

type Props = {
  steps: WorkoutStep[]
  currentStepIndex: number
  isDone: boolean
  exerciseNameById: Map<string, string>
  /** Current phase from useWorkoutTimer - "timed" for warmup/rest, "working" for exercise */
  phase?: 'timed' | 'working' | 'done'
  /** Remaining seconds on current step timer */
  stepTimer?: number
  /** Callback when a step is tapped for navigation */
  onStepPress?: (stepIndex: number) => void
  /** Function to get the status of a step (for completion tracking) */
  getStepStatus?: (stepIndex: number) => StepStatus
  /** Function to get the completion count of a step */
  getCompletionCount?: (stepIndex: number) => number
}

function buildExerciseRows(
  steps: WorkoutStep[],
  currentStepIndex: number,
  isDone: boolean,
  exerciseNameById: Map<string, string>,
  getStepStatus?: (stepIndex: number) => StepStatus,
  getCompletionCount?: (stepIndex: number) => number
): ExerciseRow[] {
  const exerciseMap = new Map<
    string,
    {
      exerciseId: string
      name: string
      sets: SetInfo[]
      targetReps?: number
      firstIndex: number
    }
  >()

  steps.forEach((step, idx) => {
    if (step.type !== 'exercise') return

    // Use step completion status if available
    const status = getStepStatus?.(idx)
    // Only mark as done if:
    // - Explicitly completed via status tracking, OR
    // - Workout is fully done (isDone), OR
    // - No status tracking AND position is before current (legacy fallback)
    const stepIsDone =
      status === 'completed' ||
      isDone ||
      (!getStepStatus && idx < currentStepIndex)
    const stepIsSkipped = status === 'skipped'
    const stepIsCurrent = !isDone && idx === currentStepIndex
    const completionCount = getCompletionCount?.(idx) ?? 0
    const exerciseId = step.exerciseId

    if (!exerciseMap.has(exerciseId)) {
      exerciseMap.set(exerciseId, {
        exerciseId,
        name: exerciseNameById.get(exerciseId) ?? 'Exercise',
        sets: [],
        targetReps: step.targetReps,
        firstIndex: idx
      })
    }

    const exercise = exerciseMap.get(exerciseId)!
    exercise.sets.push({
      stepIndex: idx,
      setNumber: step.setNumber ?? exercise.sets.length + 1,
      isDone: stepIsDone,
      isCurrent: stepIsCurrent,
      isSkipped: stepIsSkipped,
      targetReps: step.targetReps,
      completionCount
    })
  })

  const rows = Array.from(exerciseMap.values()).sort(
    (a, b) => a.firstIndex - b.firstIndex
  )

  // Find the exercise containing the current step
  const exerciseWithCurrentStep = rows.find(row =>
    row.sets.some(s => s.isCurrent)
  )

  // Find the next exercise that will be navigated to after completion
  // This matches the navigation algorithm: search forward then wrap around
  let nextUpcomingExercise: (typeof rows)[0] | undefined = undefined

  if (!exerciseWithCurrentStep) {
    // Not on an exercise step (warmup/rest) - find first pending exercise from current position
    // First search forward from current+1
    for (let i = currentStepIndex + 1; i < steps.length; i++) {
      const step = steps[i]
      if (step.type !== 'exercise') continue
      if (getStepStatus?.(i) === 'pending') {
        const row = rows.find(r => r.sets.some(s => s.stepIndex === i))
        if (row) {
          nextUpcomingExercise = row
          break
        }
      }
    }

    // If not found, wrap around and search from beginning
    if (!nextUpcomingExercise) {
      for (let i = 0; i < currentStepIndex; i++) {
        const step = steps[i]
        if (step.type !== 'exercise') continue
        if (getStepStatus?.(i) === 'pending') {
          const row = rows.find(r => r.sets.some(s => s.stepIndex === i))
          if (row) {
            nextUpcomingExercise = row
            break
          }
        }
      }
    }
  }

  return rows.map(({ exerciseId, name, sets, targetReps }) => {
    const hasCurrentSet = sets.some(s => s.isCurrent)

    // isNext is true for:
    // - The exercise containing the current step (if any), OR
    // - The next upcoming exercise (during warmup/rest when no exercise is current)
    const isNext =
      hasCurrentSet ||
      (!exerciseWithCurrentStep &&
        nextUpcomingExercise?.exerciseId === exerciseId)

    return {
      exerciseId,
      name,
      sets,
      targetReps,
      isNext
    }
  })
}

/** Format seconds to M:SS */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

type PhaseInfo = {
  type: 'warmup' | 'rest'
  timer?: number
} | null

export function WorkoutMatrix({
  steps,
  currentStepIndex,
  isDone,
  exerciseNameById,
  phase,
  stepTimer,
  onStepPress,
  getStepStatus,
  getCompletionCount
}: Props) {
  const exerciseRows = useMemo(
    () =>
      buildExerciseRows(
        steps,
        currentStepIndex,
        isDone,
        exerciseNameById,
        getStepStatus,
        getCompletionCount
      ),
    [
      steps,
      currentStepIndex,
      isDone,
      exerciseNameById,
      getStepStatus,
      getCompletionCount
    ]
  )

  const totalSets = exerciseRows.reduce((sum, row) => sum + row.sets.length, 0)
  const completedSets = exerciseRows.reduce(
    (sum, row) => sum + row.sets.filter(s => s.isDone).length,
    0
  )

  // Determine current phase info to pass to the "next" exercise row
  const currentStep = steps[currentStepIndex]
  const isWarmup = currentStep?.type === 'warmup'
  const isRest = currentStep?.type === 'rest'
  const phaseInfo: PhaseInfo =
    (isWarmup || isRest) && phase === 'timed'
      ? { type: isWarmup ? 'warmup' : 'rest', timer: stepTimer }
      : null

  if (exerciseRows.length === 0) return null

  return (
    <View style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(completedSets / totalSets) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {completedSets}/{totalSets}
          </Text>
        </View>
      </View>

      {/* Exercise list */}
      <View style={styles.exerciseList}>
        {exerciseRows.map((row, idx) => (
          <ExerciseRowView
            key={row.exerciseId || idx}
            row={row}
            index={idx + 1}
            phaseInfo={row.isNext ? phaseInfo : null}
            onStepPress={onStepPress}
          />
        ))}
      </View>
    </View>
  )
}

function ExerciseRowView({
  row,
  index,
  phaseInfo,
  onStepPress
}: {
  row: ExerciseRow
  index: number
  phaseInfo: PhaseInfo
  onStepPress?: (stepIndex: number) => void
}) {
  const allDone = row.sets.every(s => s.isDone)

  // Determine row state for styling
  // row.isNext is already true if this exercise contains the current step
  const isActive = row.isNext
  const isWaiting = phaseInfo !== null // Waiting for warmup/rest to finish
  const isWarmupPhase = phaseInfo?.type === 'warmup'
  const isRestPhase = phaseInfo?.type === 'rest'

  return (
    <View
      style={[
        styles.exerciseRow,
        allDone && styles.exerciseRowDone,
        isActive && !isWaiting && styles.exerciseRowActive,
        isWaiting && isWarmupPhase && styles.exerciseRowWarmup,
        isWaiting && isRestPhase && styles.exerciseRowRest
      ]}
    >
      {/* Index badge - shows phase icon when waiting */}
      <View
        style={[
          styles.indexBadge,
          allDone && styles.indexBadgeDone,
          isActive && !isWaiting && styles.indexBadgeActive,
          isWaiting && isWarmupPhase && styles.indexBadgeWarmup,
          isWaiting && isRestPhase && styles.indexBadgeRest
        ]}
      >
        {allDone ? (
          <Ionicons
            name="checkmark"
            size={14}
            color={theme.colors.primaryTextOn}
          />
        ) : isWaiting ? (
          <Ionicons
            name={isWarmupPhase ? 'flame' : 'pause'}
            size={14}
            color={theme.colors.primaryTextOn}
          />
        ) : (
          <Text style={[styles.indexText, isActive && styles.indexTextActive]}>
            {index}
          </Text>
        )}
      </View>

      {/* Exercise info */}
      <View style={styles.exerciseInfo}>
        <Text
          style={[
            styles.exerciseName,
            allDone && styles.exerciseNameDone,
            isActive && !isWaiting && styles.exerciseNameActive,
            isWaiting && isWarmupPhase && styles.exerciseNameWarmup,
            isWaiting && isRestPhase && styles.exerciseNameRest
          ]}
          numberOfLines={1}
        >
          {row.name}
        </Text>
        {isWaiting && phaseInfo.timer !== undefined ? (
          <Text
            style={[
              styles.exerciseMeta,
              isWarmupPhase && styles.exerciseMetaWarmup,
              isRestPhase && styles.exerciseMetaRest
            ]}
          >
            {isWarmupPhase ? 'Warming up' : 'Resting'} ·{' '}
            {formatTime(phaseInfo.timer)}
          </Text>
        ) : row.sets.length > 1 ? (
          <Text style={styles.exerciseMeta}>
            {row.sets.filter(s => s.isDone).length}/{row.sets.length} sets
          </Text>
        ) : null}
      </View>

      {/* Set indicators */}
      <View style={styles.setsContainer}>
        {row.sets.map(set => (
          <SetIndicator key={set.stepIndex} set={set} onPress={onStepPress} />
        ))}
      </View>
    </View>
  )
}

function SetIndicator({
  set,
  onPress
}: {
  set: SetInfo
  onPress?: (stepIndex: number) => void
}) {
  const displayValue = set.targetReps ?? set.setNumber
  const isTappable = onPress !== undefined

  const handlePress = () => {
    onPress?.(set.stepIndex)
  }

  // Skipped state
  if (set.isSkipped) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={!isTappable}
        style={({ pressed }) => [
          styles.setIndicator,
          styles.setSkipped,
          pressed && isTappable && styles.setPressed
        ]}
      >
        <Ionicons name="remove" size={14} color={theme.colors.muted} />
      </Pressable>
    )
  }

  // Completed state
  if (set.isDone) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={!isTappable}
        style={({ pressed }) => [
          styles.setIndicator,
          styles.setDone,
          pressed && isTappable && styles.setPressed
        ]}
      >
        <Ionicons
          name="checkmark"
          size={14}
          color={theme.colors.primaryTextOn}
        />
        {/* No repeat badge - per spec, latest execution is single source of truth */}
      </Pressable>
    )
  }

  // Current state
  if (set.isCurrent) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={!isTappable}
        style={({ pressed }) => [
          styles.setIndicator,
          styles.setCurrent,
          pressed && isTappable && styles.setPressed
        ]}
      >
        <Text style={styles.setTextCurrent}>{displayValue}</Text>
      </Pressable>
    )
  }

  // Pending state
  return (
    <Pressable
      onPress={handlePress}
      disabled={!isTappable}
      style={({ pressed }) => [
        styles.setIndicator,
        styles.setPending,
        pressed && isTappable && styles.setPressed
      ]}
    >
      <Text style={styles.setTextPending}>{displayValue}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  progressBar: {
    width: 48,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2
  },
  progressLabel: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.muted,
    minWidth: 28
  },

  // Exercise list
  exerciseList: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.xs
  },

  // Exercise row
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background
  },
  exerciseRowDone: {
    backgroundColor: theme.colors.successLight,
    opacity: 0.8
  },
  exerciseRowActive: {
    backgroundColor: theme.colors.primaryLight
  },
  exerciseRowWarmup: {
    backgroundColor: theme.colors.phases.warmupBg
  },
  exerciseRowRest: {
    backgroundColor: theme.colors.phases.breakBg
  },

  // Index badge
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.md
  },
  indexBadgeDone: {
    backgroundColor: theme.colors.success
  },
  indexBadgeActive: {
    backgroundColor: theme.colors.primary
  },
  indexBadgeWarmup: {
    backgroundColor: theme.colors.phases.warmup
  },
  indexBadgeRest: {
    backgroundColor: theme.colors.phases.break
  },
  indexText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.muted
  },
  indexTextActive: {
    color: theme.colors.primaryTextOn
  },

  // Exercise info
  exerciseInfo: {
    flex: 1,
    marginRight: theme.spacing.md
  },
  exerciseName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  exerciseNameDone: {
    color: theme.colors.success
  },
  exerciseNameActive: {
    color: theme.colors.primary
  },
  exerciseNameWarmup: {
    color: theme.colors.phases.warmup
  },
  exerciseNameRest: {
    color: theme.colors.phases.break
  },
  exerciseMeta: {
    ...theme.typography.small,
    color: theme.colors.muted,
    marginTop: 1
  },
  exerciseMetaWarmup: {
    color: theme.colors.phases.warmup
  },
  exerciseMetaRest: {
    color: theme.colors.phases.break
  },

  // Sets container
  setsContainer: {
    flexDirection: 'row',
    gap: 6
  },

  // Set indicators - rounded squares showing reps
  setIndicator: {
    minWidth: 36,
    height: 32,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  setDone: {
    backgroundColor: theme.colors.success
  },
  setCurrent: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4
  },
  setPending: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border
  },
  setSkipped: {
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed'
  },
  setPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }]
  },
  setTextCurrent: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primaryTextOn
  },
  setTextPending: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.muted
  },
  repeatBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4
  },
  repeatBadgeText: {
    ...theme.typography.small,
    fontSize: 10,
    color: theme.colors.primaryTextOn
  }
})

export default WorkoutMatrix
