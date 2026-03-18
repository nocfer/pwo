import React, { useEffect, useState } from 'react'
import { theme } from '@/theme/theme'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  runOnJS
} from 'react-native-reanimated'

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
  const opacity = useSharedValue(1)
  const [visible, setVisible] = useState(isActive)

  useEffect(() => {
    if (isActive) {
      opacity.value = 1
      setVisible(true)
    } else if (visible) {
      opacity.value = withSequence(
        withTiming(0.3, { duration: 150 }),
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 200 }, () => {
          runOnJS(setVisible)(false)
        })
      )
    }
  }, [isActive])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }))

  if (!visible) return null

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
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
    </Animated.View>
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
