/**
 * IconButton - Reusable icon button component
 */

import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, StyleSheet, ViewStyle } from 'react-native'

type Props = {
  icon: keyof typeof Ionicons.glyphMap
  size?: number
  color?: string
  onPress?: () => void
  variant?: 'default' | 'danger' | 'primary'
  disabled?: boolean
  style?: ViewStyle
}

export default function IconButton({
  icon,
  size = 18,
  color,
  onPress,
  variant = 'default',
  disabled = false,
  style
}: Props) {
  const iconColor =
    color ??
    (variant === 'danger'
      ? theme.colors.danger
      : variant === 'primary'
        ? theme.colors.primaryTextOn
        : theme.colors.text)

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'danger' && styles.buttonDanger,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style
      ]}
    >
      <Ionicons name={icon} size={size} color={iconColor} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary
  },
  buttonDanger: {
    backgroundColor: theme.colors.dangerLight
  },
  buttonPressed: {
    backgroundColor: theme.colors.background,
    transform: [{ scale: 0.96 }]
  },
  buttonDisabled: {
    opacity: 0.5
  }
})
