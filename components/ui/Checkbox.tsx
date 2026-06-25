/**
 * Checkbox — square multi-select box.
 * Lime fill + dark check when checked; hairline outline when not. Presentational
 * by default; pass `onPress` to make it an interactive checkbox with a ≥44 target.
 */

import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, StyleSheet, View } from 'react-native'

type Props = {
  checked: boolean
  onPress?: () => void
  disabled?: boolean
  accessibilityLabel?: string
}

export default function Checkbox({
  checked,
  onPress,
  disabled = false,
  accessibilityLabel
}: Props) {
  const box = (
    <View style={[styles.box, checked && styles.boxChecked]}>
      {checked && (
        <Ionicons name="checkmark" size={16} color={theme.colors.primaryTextOn} />
      )}
    </View>
  )

  if (!onPress) {
    return box
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, disabled }}
      style={({ pressed }) => [
        pressed && styles.pressed,
        disabled && styles.disabled
      ]}
    >
      {box}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  boxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  pressed: {
    opacity: 0.6
  },
  disabled: {
    opacity: 0.5
  }
})
