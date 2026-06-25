/**
 * ActiveGlow — the breathing lime outline behind the active "log now" set.
 *
 * This is one of only two animations allowed to run at idle (the live rest
 * timer is the other): it marks where the user should act next, so it loops
 * continuously rather than on a state change, and carries no haptic. The pulse
 * runs on the glowLoop token (~2.6s round trip) and is off entirely under
 * reduced-motion, where the row's static lime tint already signals "active".
 */

import { theme } from '@/theme/theme'
import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated'

export function ActiveGlow() {
  const reduced = useReducedMotion()
  const pulse = useSharedValue(0.45)

  useEffect(() => {
    if (reduced) return
    pulse.value = withRepeat(
      withTiming(1, {
        duration: theme.motion.duration.glowLoop / 2,
        easing: Easing.inOut(Easing.ease)
      }),
      -1, // forever
      true // reverse each cycle → breathe in/out
    )
    return () => cancelAnimation(pulse)
  }, [reduced, pulse])

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }))

  if (reduced) return null
  return <Animated.View pointerEvents="none" style={[styles.glow, style]} />
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 13, // matches SetRow's active row radius
    borderWidth: 1.5,
    borderColor: theme.colors.session.lime,
    // iOS renders a soft lime halo; Android falls back to the pulsing border.
    shadowColor: theme.colors.session.lime,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 }
  }
})

export default ActiveGlow
