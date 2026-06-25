// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import React, { useCallback, useEffect, useRef } from 'react'

import { useFocusEffect } from 'expo-router'
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated'

import { TAB_SPRING_CONFIG } from '@/components/common/TabIconAnimator'

/** Supported animation types for screen icon entrance animations */
export type AnimationType =
  | 'pulse'
  | 'rotate'
  | 'bounceY'
  | 'slideX'
  | 'spin'
  | 'spinPartial'
  | 'springScale'
  | 'bounceDrop'
  | 'clockwise'

/** Configuration for a single icon animation */
export interface IconAnimationConfig {
  /** The animation effect to apply */
  type: AnimationType
  /** Animation duration in ms (default varies by type) */
  duration?: number
  /** Custom delay override — otherwise uses stagger calculation */
  delay?: number
}

/** Options for the useScreenIconAnimation hook */
export interface UseScreenIconAnimationOptions {
  /** Configuration for each icon to animate */
  icons: IconAnimationConfig[]
  /** Stagger delay between successive icons in ms (default: 80) */
  staggerDelay?: number
  /** When true, animations are blocked until loading completes */
  isLoading?: boolean
}

/** Return value of the useScreenIconAnimation hook */
export interface UseScreenIconAnimationReturn {
  /** Shared trigger value — increment to replay animations */
  trigger: SharedValue<number>
  /** Function to restart all animations */
  replay: () => void
  /** Stagger delay value (for AnimatedIcon) */
  staggerDelay: number
}

// ---------------------------------------------------------------------------
// Default durations per animation type
// ---------------------------------------------------------------------------

const DEFAULT_DURATIONS: Record<AnimationType, number> = {
  pulse: 700,
  rotate: 600,
  bounceY: 650,
  slideX: 600,
  spin: 700,
  spinPartial: 600,
  springScale: 800,
  bounceDrop: 700,
  clockwise: 800
}

/** Maximum total animation budget in ms */
const MAX_ANIMATION_BUDGET = 1200

// ---------------------------------------------------------------------------
// Hook: useScreenIconAnimation
// ---------------------------------------------------------------------------

/**
 * Manages screen-level icon entrance animations.
 *
 * Returns a `trigger` shared value and a `replay` function.
 * Pair with `<AnimatedIcon>` components that react to the trigger.
 *
 * Animations replay automatically on tab focus via `useFocusEffect`
 * and wait for `isLoading` to become false before starting.
 */
export function useScreenIconAnimation(
  options: UseScreenIconAnimationOptions
): UseScreenIconAnimationReturn {
  const { staggerDelay = 80, isLoading = false } = options

  const trigger = useSharedValue(0)
  const hasTriggeredAfterLoad = useRef(false)

  const replay = useCallback(() => {
    trigger.value = trigger.value + 1
  }, [trigger])

  // Replay on tab focus (only when not loading)
  useFocusEffect(
    useCallback(() => {
      if (!isLoading) {
        replay()
        hasTriggeredAfterLoad.current = true
      }
    }, [isLoading, replay])
  )

  // Trigger when loading transitions from true → false
  useEffect(() => {
    if (!isLoading && !hasTriggeredAfterLoad.current) {
      replay()
      hasTriggeredAfterLoad.current = true
    }
    if (isLoading) {
      hasTriggeredAfterLoad.current = false
    }
  }, [isLoading, replay])

  return { trigger, replay, staggerDelay }
}

// ---------------------------------------------------------------------------
// Component: AnimatedIcon
// ---------------------------------------------------------------------------

/** Props for the AnimatedIcon wrapper component */
export interface AnimatedIconProps {
  /** The content to animate (typically an icon) */
  children: React.ReactNode
  /** Animation configuration for this icon */
  config: IconAnimationConfig
  /** Shared trigger value from useScreenIconAnimation */
  trigger: SharedValue<number>
  /** Index of this icon in the sequence (used for stagger) */
  index: number
  /** Stagger delay between icons in ms (default: 80) */
  staggerDelay?: number
}

/**
 * Wraps a child element with an animated entrance effect.
 *
 * Reacts to changes in the `trigger` shared value (from
 * `useScreenIconAnimation`) and runs the configured animation
 * with the appropriate stagger delay.
 *
 * After the first animation, subsequent triggers keep content visible
 * during the reset phase to prevent white flash on rapid tab switches.
 */
export function AnimatedIcon({
  children,
  config,
  trigger,
  index,
  staggerDelay = 80
}: AnimatedIconProps) {
  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(0)
  const translateX = useSharedValue(0)
  const rotate = useSharedValue(0)
  const hasAnimated = useSharedValue(0)
  const reduced = useReducedMotion()

  const duration = config.duration ?? DEFAULT_DURATIONS[config.type]
  const delay = config.delay ?? index * staggerDelay

  // Clamp total time to budget
  const effectiveDelay = Math.min(delay, MAX_ANIMATION_BUDGET - duration)
  const safeDelay = Math.max(0, effectiveDelay)

  // React to trigger changes and run the animation
  useAnimatedReaction(
    () => trigger.value,
    (current, previous) => {
      if (current !== previous) {
        // Reduce-motion: reveal the icon at rest — no scale/rotate/translate
        // entrance — just ensure it's visible.
        if (reduced) {
          scale.value = 1
          opacity.value = 1
          translateY.value = 0
          translateX.value = 0
          rotate.value = 0
          hasAnimated.value = 1
          return
        }
        // Keep content visible if already animated once (prevents white flash)
        const keepVisible = hasAnimated.value === 1
        scale.value = keepVisible ? 1 : 0
        opacity.value = keepVisible ? 1 : 0
        translateY.value = 0
        translateX.value = 0
        rotate.value = 0
        hasAnimated.value = 1

        // Run the type-specific animation with stagger delay
        runAnimation(
          config.type,
          { scale, opacity, translateY, translateX, rotate },
          safeDelay,
          duration
        )
      }
    },
    [reduced]
  )

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` }
    ],
    opacity: opacity.value
  }))

  return React.createElement(Animated.View, { style: animatedStyle }, children)
}

// ---------------------------------------------------------------------------
// Animation runner (worklet)
// ---------------------------------------------------------------------------

interface AnimSharedValues {
  scale: SharedValue<number>
  opacity: SharedValue<number>
  translateY: SharedValue<number>
  translateX: SharedValue<number>
  rotate: SharedValue<number>
}

/**
 * Runs the appropriate animation based on the type.
 * Called from within a useAnimatedReaction callback (worklet context).
 */
function runAnimation(
  type: AnimationType,
  sv: AnimSharedValues,
  delay: number,
  duration: number
) {
  'worklet'

  const spring = TAB_SPRING_CONFIG

  switch (type) {
    // pulse: scale 0→1.15→1.0, opacity 0→1
    case 'pulse':
      sv.scale.value = withDelay(
        delay,
        withSequence(
          withTiming(1.15, { duration: duration * 0.6 }),
          withSpring(1.0, spring)
        )
      )
      sv.opacity.value = withDelay(
        delay,
        withTiming(1, { duration: duration * 0.4 })
      )
      break

    // rotate: rotate -90→0 with spring, opacity 0→1
    case 'rotate':
      sv.rotate.value = -90
      sv.rotate.value = withDelay(delay, withSpring(0, spring))
      sv.scale.value = withDelay(delay, withSpring(1.0, spring))
      sv.opacity.value = withDelay(
        delay,
        withTiming(1, { duration: duration * 0.5 })
      )
      break

    // bounceY: translateY 20→-4→0, opacity 0→1
    case 'bounceY':
      sv.translateY.value = 20
      sv.translateY.value = withDelay(
        delay,
        withSequence(
          withTiming(-4, { duration: duration * 0.5 }),
          withSpring(0, spring)
        )
      )
      sv.scale.value = withDelay(delay, withSpring(1.0, spring))
      sv.opacity.value = withDelay(
        delay,
        withTiming(1, { duration: duration * 0.4 })
      )
      break

    // slideX: translateX -15→0 with spring, opacity 0→1
    case 'slideX':
      sv.translateX.value = -15
      sv.translateX.value = withDelay(delay, withSpring(0, spring))
      sv.scale.value = withDelay(delay, withSpring(1.0, spring))
      sv.opacity.value = withDelay(
        delay,
        withTiming(1, { duration: duration * 0.5 })
      )
      break

    // spin: rotate 0→360 with timing, scale 0→1 with spring
    case 'spin':
      sv.rotate.value = withDelay(
        delay,
        withTiming(360, { duration, easing: Easing.out(Easing.cubic) })
      )
      sv.scale.value = withDelay(delay, withSpring(1.0, spring))
      sv.opacity.value = withDelay(
        delay,
        withTiming(1, { duration: duration * 0.3 })
      )
      break

    // spinPartial: rotate 0→90→0, scale 0.5→1 with spring
    case 'spinPartial':
      sv.scale.value = 0.5
      sv.rotate.value = withDelay(
        delay,
        withSequence(
          withTiming(90, { duration: duration * 0.5 }),
          withTiming(0, { duration: duration * 0.5 })
        )
      )
      sv.scale.value = withDelay(delay, withSpring(1.0, spring))
      sv.opacity.value = withDelay(
        delay,
        withTiming(1, { duration: duration * 0.3 })
      )
      break

    // springScale: scale 0→1.0 with spring (high overshoot ~1.3), opacity 0→1
    case 'springScale':
      sv.scale.value = withDelay(
        delay,
        withSpring(1.0, { damping: 8, stiffness: 150, mass: 0.8 })
      )
      sv.opacity.value = withDelay(
        delay,
        withTiming(1, { duration: duration * 0.4 })
      )
      break

    // bounceDrop: translateY -20→3→0, scale 0.5→1 with spring
    case 'bounceDrop':
      sv.translateY.value = -20
      sv.scale.value = 0.5
      sv.translateY.value = withDelay(
        delay,
        withSequence(
          withTiming(3, { duration: duration * 0.5 }),
          withSpring(0, spring)
        )
      )
      sv.scale.value = withDelay(delay, withSpring(1.0, spring))
      sv.opacity.value = withDelay(
        delay,
        withTiming(1, { duration: duration * 0.3 })
      )
      break

    // clockwise: rotate 0→360 with decelerate easing, opacity 0→1
    case 'clockwise':
      sv.scale.value = withDelay(delay, withSpring(1.0, spring))
      sv.rotate.value = withDelay(
        delay,
        withTiming(360, { duration, easing: Easing.out(Easing.quad) })
      )
      sv.opacity.value = withDelay(
        delay,
        withTiming(1, { duration: duration * 0.4 })
      )
      break
  }
}
