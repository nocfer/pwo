/**
 * Toggle — the spec's 46×28 switch.
 * ON = lime track + dark knob; OFF = hairline track + muted knob. The knob
 * slides with a short spring; under reduced-motion it snaps instantly.
 */

import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import { Pressable, StyleSheet } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  withTiming
} from 'react-native-reanimated'

// Bespoke control geometry (spec: 46×28 track, 22 knob, 3 inset).
const TRACK_W = 46
const TRACK_H = 28
const KNOB = 22
const INSET = 3
const TRAVEL = TRACK_W - KNOB - INSET * 2

type Props = {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  accessibilityLabel?: string
}

export default function Toggle({
  value,
  onChange,
  disabled = false,
  accessibilityLabel
}: Props) {
  const reducedMotion = useReducedMotion()
  // Reactively follows `value`; animates unless reduced-motion is on, in which
  // case it resolves to the target instantly.
  const progress = useDerivedValue(() =>
    reducedMotion ? (value ? 1 : 0) : withTiming(value ? 1 : 0, { duration: 160 })
  )

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.colors.border, theme.colors.primary]
    )
  }))

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * TRAVEL }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.colors.subtext, theme.colors.primaryTextOn]
    )
  }))

  return (
    <Pressable
      onPress={() => {
        if (disabled) return
        haptics.buttonTap()
        onChange(!value)
      }}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      style={disabled && styles.disabled}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    padding: INSET,
    justifyContent: 'center'
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2
  },
  disabled: {
    opacity: 0.5
  }
})
