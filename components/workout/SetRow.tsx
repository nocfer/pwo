import { theme } from '@/theme/theme'
import type { SetStatus } from '@/types/workout'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export type SetRowProps = {
  setNumber: number
  reps: number
  weight: number
  status: SetStatus
  onRepsPress: () => void
  onWeightPress: () => void
  onConfirm: () => void
  onPress: () => void
  onSkip?: () => void
  isRepsFocused?: boolean
  isWeightFocused?: boolean
}

function statusLabel(status: SetStatus): string {
  switch (status) {
    case 'pending':
      return 'pending'
    case 'active':
      return 'ready to confirm'
    case 'completed':
      return 'completed'
    case 'editing':
      return 'editing'
    case 'skipped':
      return 'skipped'
  }
}

function confirmLabel(setNumber: number, status: SetStatus): string {
  return status === 'editing'
    ? `Re-confirm set ${setNumber}`
    : `Confirm set ${setNumber}`
}

export function SetRow({
  setNumber,
  reps,
  weight,
  status,
  onRepsPress,
  onWeightPress,
  onConfirm,
  onPress,
  onSkip,
  isRepsFocused = false,
  isWeightFocused = false
}: SetRowProps) {
  const isActive = status === 'active'
  const isCompleted = status === 'completed'
  const isPending = status === 'pending'
  const isEditing = status === 'editing'
  const isSkipped = status === 'skipped'

  const valueColor = isCompleted
    ? theme.colors.success
    : isPending || isSkipped
      ? theme.colors.muted
      : theme.colors.text

  const setNumColor = isCompleted
    ? theme.colors.success
    : isPending || isSkipped
      ? theme.colors.muted
      : theme.colors.primary

  const a11yLabel = isCompleted
    ? `Set ${setNumber}, completed, ${reps} reps at ${weight} lbs`
    : `Set ${setNumber}, ${statusLabel(status)}`

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={a11yLabel}
      accessibilityRole="button"
      style={[
        styles.row,
        isCompleted && styles.rowCompleted,
        isEditing && styles.rowEditing,
        isSkipped && styles.rowSkipped
      ]}
    >
      <View style={styles.setNumContainer}>
        <Text style={[styles.setNum, { color: setNumColor }]}>
          {isEditing ? '✎' : isSkipped ? '–' : setNumber}
        </Text>
        {isActive && onSkip && (
          <Pressable
            onPress={onSkip}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            accessibilityLabel={`Skip set ${setNumber}`}
            accessibilityRole="button"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={onRepsPress}
        style={[styles.inputField, isRepsFocused && styles.inputFocused]}
        accessibilityLabel={`reps, ${reps}`}
        accessibilityHint="Open keypad to edit reps"
        accessibilityRole="button"
      >
        <Text style={[styles.inputValue, { color: valueColor }]}>{reps}</Text>
        <Text style={styles.inputLabel}>reps</Text>
      </Pressable>

      <Pressable
        onPress={onWeightPress}
        style={[styles.inputField, isWeightFocused && styles.inputFocused]}
        accessibilityLabel={`weight, ${weight}`}
        accessibilityHint="Open keypad to edit weight"
        accessibilityRole="button"
      >
        <Text style={[styles.inputValue, { color: valueColor }]}>{weight}</Text>
        <Text style={styles.inputLabel}>lbs</Text>
      </Pressable>

      <Pressable
        onPress={onConfirm}
        accessibilityLabel={confirmLabel(setNumber, status)}
        accessibilityHint="Double tap to confirm this set"
        accessibilityRole="button"
        style={[
          styles.confirmButton,
          isPending && styles.confirmPending,
          (status === 'active' || isEditing) && styles.confirmActive,
          isCompleted && styles.confirmCompleted
        ]}
      >
        <Text
          style={[
            styles.confirmIcon,
            isPending && styles.confirmIconPending,
            (status === 'active' || isEditing) && styles.confirmIconActive,
            isCompleted && styles.confirmIconCompleted
          ]}
        >
          ✓
        </Text>
      </Pressable>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: 48,
    paddingVertical: theme.spacing.xs
  },
  rowCompleted: {
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm
  },
  rowEditing: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm
  },
  rowSkipped: {
    opacity: 0.5
  },
  setNumContainer: {
    width: 28,
    alignItems: 'center'
  },
  setNum: {
    ...theme.typography.bodyBold
  },
  skipText: {
    ...theme.typography.caption,
    color: theme.colors.subtext
  },
  inputField: {
    flex: 1,
    minWidth: 56,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.xs
  },
  inputFocused: {
    borderColor: theme.colors.primary
  },
  inputValue: {
    ...theme.typography.bodyBold
  },
  inputLabel: {
    ...theme.typography.caption,
    color: theme.colors.subtext
  },
  confirmButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmPending: {
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  confirmActive: {
    backgroundColor: theme.colors.primary
  },
  confirmCompleted: {
    backgroundColor: theme.colors.phases.doneBg
  },
  confirmIcon: {
    ...theme.typography.bodyBold
  },
  confirmIconPending: {
    color: theme.colors.muted
  },
  confirmIconActive: {
    color: theme.colors.primaryTextOn
  },
  confirmIconCompleted: {
    color: theme.colors.success
  }
})
