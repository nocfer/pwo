/**
 * Card — themed surface container.
 *
 * Tones: panel (surface + hairline border) · elevated (overlay surface + lg
 * shadow) · accent (lime tint + lime-tinted border). Pass `onPress` to make the
 * whole card a pressable (adds the standard press-scale).
 */

import { theme } from '@/theme/theme'
import { ReactNode } from 'react'
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native'

export type CardTone = 'panel' | 'elevated' | 'accent'

type Props = {
  children: ReactNode
  tone?: CardTone
  padding?: number
  onPress?: () => void
  style?: ViewStyle
  accessibilityLabel?: string
}

export default function Card({
  children,
  tone = 'panel',
  padding = theme.spacing.lg,
  onPress,
  style,
  accessibilityLabel
}: Props) {
  const base = [styles.card, toneStyles[tone], { padding }, style]

  if (!onPress) {
    return <View style={base}>{children}</View>
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [...base, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.card,
    borderWidth: 1
  },
  pressed: {
    transform: [{ scale: theme.motion.pressScale }],
    opacity: 0.95
  }
})

const toneStyles = StyleSheet.create({
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border
  },
  elevated: {
    backgroundColor: theme.colors.surfaceOverlay,
    borderColor: theme.colors.border,
    ...theme.shadows.lg
  },
  accent: {
    backgroundColor: theme.colors.primaryTint,
    borderColor: theme.colors.borderActive
  }
})
