/**
 * Stepper — − / value / + control for sets, reps, weight, and rest.
 *
 * `format` renders the value (e.g. mm:ss for rest); without it the raw number is
 * shown. Clamps to [min, max]; the matching button disables at each bound. The
 * whole control is an a11y `adjustable` with working increment/decrement actions.
 */

import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, StyleSheet, Text, View } from 'react-native'

type Props = {
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  format?: (value: number) => string
  accessibilityLabel?: string
}

export default function Stepper({
  value,
  onChange,
  step = 1,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  format,
  accessibilityLabel
}: Props) {
  const atMin = value - step < min
  const atMax = value + step > max

  const commit = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next))
    if (clamped !== value) {
      haptics.buttonTap()
      onChange(clamped)
    }
  }

  const display = format ? format(value) : String(value)

  return (
    <View
      style={styles.container}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: display }}
      accessibilityActions={[
        { name: 'increment', label: 'Increase' },
        { name: 'decrement', label: 'Decrease' }
      ]}
      onAccessibilityAction={e => {
        if (e.nativeEvent.actionName === 'increment') commit(value + step)
        else if (e.nativeEvent.actionName === 'decrement') commit(value - step)
      }}
    >
      <Pressable
        onPress={() => commit(value - step)}
        disabled={atMin}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        accessibilityState={{ disabled: atMin }}
        style={({ pressed }) => [
          styles.button,
          pressed && !atMin && styles.buttonPressed
        ]}
      >
        <Ionicons
          name="remove"
          size={20}
          color={atMin ? theme.colors.faint : theme.colors.subtext}
        />
      </Pressable>

      <Text style={styles.value} numberOfLines={1}>
        {display}
      </Text>

      <Pressable
        onPress={() => commit(value + step)}
        disabled={atMax}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Increase"
        accessibilityState={{ disabled: atMax }}
        style={({ pressed }) => [
          styles.button,
          pressed && !atMax && styles.buttonPressed
        ]}
      >
        <Ionicons
          name="add"
          size={20}
          color={atMax ? theme.colors.faint : theme.colors.primary}
        />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inset,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    minHeight: 46
  },
  button: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch'
  },
  buttonPressed: {
    opacity: 0.6
  },
  value: {
    flex: 1,
    minWidth: 44,
    textAlign: 'center',
    ...theme.typography.metric,
    color: theme.colors.text
  }
})
