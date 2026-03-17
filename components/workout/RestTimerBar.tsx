import React from 'react'
import { theme } from '@/theme/theme'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export type RestTimerBarProps = {
  remainingMs: number
  isActive: boolean
  onSkip: () => void
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function accessibilityTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const parts: string[] = []
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`)
  if (seconds > 0 || minutes === 0)
    parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`)
  return parts.join(' ')
}

export function RestTimerBar({
  remainingMs,
  isActive,
  onSkip
}: RestTimerBarProps) {
  if (!isActive) return null

  return (
    <View
      style={styles.container}
      accessibilityRole="timer"
      accessibilityLabel={`Rest timer, ${accessibilityTime(remainingMs)} remaining`}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.label}>Rest</Text>
      <Text style={styles.countdown}>{formatCountdown(remainingMs)}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.skipButton,
          pressed && styles.skipPressed
        ]}
        onPress={onSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip rest timer"
        accessibilityHint="Double tap to skip the rest timer"
        hitSlop={8}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.phases.breakBg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.phases.break
  },
  countdown: {
    ...theme.typography.body,
    color: theme.colors.phases.break,
    fontVariant: ['tabular-nums']
  },
  skipButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md
  },
  skipPressed: {
    opacity: 0.6
  },
  skipText: {
    ...theme.typography.caption,
    color: theme.colors.phases.break
  }
})
