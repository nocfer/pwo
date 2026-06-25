/**
 * usePressScale — the kit's shared press feedback.
 *
 * Returns an animated style (scale + opacity dip) plus onPressIn/onPressOut
 * handlers to spread onto an `Animated.createAnimatedComponent(Pressable)`.
 * Fires the light `haptics.buttonTap` on press-in so the touch is felt at the
 * same instant it's seen (the Press row of the motion↔haptic table).
 *
 * Reduce-motion: the scale transform is suppressed (no movement) and the press
 * is conveyed by a slightly deeper opacity dip instead — honoring the OS
 * setting while keeping a visible affordance.
 *
 * Usage:
 *   const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
 *   const press = usePressScale({ enabled: !disabled })
 *   <AnimatedPressable {...press.handlers} style={[styles.base, press.animatedStyle]} />
 */

import { pressScaleTo, timing } from '@/lib/motion'
import { haptics } from '@/lib/haptics'
import { useCallback } from 'react'
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

type Options = {
  /** Fire the light tap on press-in. Default true; set false if the component
   *  already fires its own semantic haptic on press. */
  haptic?: boolean
  /** Whether press feedback is active. Pass false for disabled/loading. */
  enabled?: boolean
  /** Opacity at full press (default 0.92). Lower = deeper dip (e.g. ghost 0.6). */
  pressedOpacity?: number
}

export function usePressScale({
  haptic = true,
  enabled = true,
  pressedOpacity = 0.92
}: Options = {}) {
  const reduced = useReducedMotion()
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }))

  const onPressIn = useCallback(() => {
    if (!enabled) return
    if (reduced) {
      // No transform under reduce-motion; a deeper fade carries the press.
      opacity.value = withTiming(Math.min(pressedOpacity, 0.7), timing.instant)
    } else {
      scale.value = pressScaleTo(true, false)
      opacity.value = withTiming(pressedOpacity, timing.fast)
    }
    if (haptic) haptics.buttonTap()
  }, [enabled, reduced, haptic, pressedOpacity, scale, opacity])

  const onPressOut = useCallback(() => {
    if (!enabled) return
    if (!reduced) scale.value = pressScaleTo(false, false)
    opacity.value = withTiming(1, reduced ? timing.instant : timing.fast)
  }, [enabled, reduced, scale, opacity])

  return { animatedStyle, onPressIn, onPressOut, handlers: { onPressIn, onPressOut } }
}

export default usePressScale
