import { theme } from '@/theme/theme'
import type { SetStatus } from '@/types/workout'
import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'

export type SetDotProps = {
  setNumber: number
  status: SetStatus
  onPress: () => void
}

function getAccessibilityLabel(setNumber: number, status: SetStatus): string {
  const stateLabel =
    status === 'active' ? 'current' : status === 'editing' ? 'current' : status
  return `Set ${setNumber}, ${stateLabel}`
}

export function SetDot({ setNumber, status, onPress }: SetDotProps) {
  const label = getAccessibilityLabel(setNumber, status)

  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Double tap to navigate to this set"
      style={[styles.dot, statusStyles[status]]}
    >
      {status === 'completed' ? (
        <Text
          style={[styles.icon, { color: theme.colors.success }]}
          accessibilityElementsHidden
        >
          ✓
        </Text>
      ) : status === 'skipped' ? (
        <Text
          style={[styles.icon, { color: theme.colors.muted }]}
          accessibilityElementsHidden
        >
          –
        </Text>
      ) : (
        <Text
          style={[
            styles.number,
            status === 'active'
              ? { color: theme.colors.primaryTextOn }
              : { color: theme.colors.muted }
          ]}
          accessibilityElementsHidden
        >
          {setNumber}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  dot: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center'
  },
  number: {
    ...theme.typography.small,
    textAlign: 'center'
  },
  icon: {
    ...theme.typography.small,
    textAlign: 'center'
  }
})

const statusStyles = StyleSheet.create({
  pending: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  active: {
    backgroundColor: theme.colors.primary
  },
  completed: {
    backgroundColor: theme.colors.phases.doneBg
  },
  skipped: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.muted,
    backgroundColor: 'transparent'
  },
  editing: {
    backgroundColor: theme.colors.primary
  }
})
