import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'

import { theme } from '@/theme/theme'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Icon names used across the four main tabs */
export type TabIconName = 'home' | 'library' | 'stats-chart' | 'person'

/** Props accepted by the TabIconAnimator component */
export interface TabIconAnimatorProps {
  /** Base icon name (Ionicons, without the -outline suffix) */
  icon: TabIconName
  /** Icon tint color (provided by the tab bar) */
  color: string
  /** Whether this tab is currently selected */
  focused: boolean
  /** Icon size – defaults to ANIMATION_PARAMS.iconSize (24) */
  size?: number
}

/** Shape of a single entry in TAB_CONFIG */
export interface TabConfigEntry {
  name: string
  title: string
  icon: TabIconName
}

// ---------------------------------------------------------------------------
// Constants – Spring configuration
// ---------------------------------------------------------------------------

/**
 * Shared spring configuration for all tab-bar animations.
 * Exported so other parts of the app can reuse the same feel.
 */
export const TAB_SPRING_CONFIG = {
  damping: 14,
  stiffness: 100,
  mass: 1.0
} as const

// ---------------------------------------------------------------------------
// Constants – Animation parameters
// ---------------------------------------------------------------------------

/** Numeric parameters that drive the tab icon animations */
export const ANIMATION_PARAMS = {
  /** Default icon size in px */
  iconSize: 24,
  /** Scale when the tab is active (final resting value) */
  activeScale: 1.0,
  /** Scale when the tab is inactive */
  inactiveScale: 0.85,
  /** Opacity when the tab is active */
  activeOpacity: 1.0,
  /** Opacity when the tab is inactive */
  inactiveOpacity: 0.5,
  /** Vertical bounce offset (negative = upward) */
  bounceY: -3,
  /** Active-indicator dot diameter */
  dotSize: 4
} as const

// ---------------------------------------------------------------------------
// Constants – Tab configuration
// ---------------------------------------------------------------------------

/** Mapping of route name → display title → icon for the four main tabs */
export const TAB_CONFIG: readonly TabConfigEntry[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'library', title: 'Library', icon: 'library' },
  { name: 'progress', title: 'Statistics', icon: 'stats-chart' },
  { name: 'profile', title: 'Profile', icon: 'person' }
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the correct Ionicons name based on the focused state.
 * Focused → filled variant, unfocused → outline variant.
 */
export function getIconName(
  icon: TabIconName,
  focused: boolean
): React.ComponentProps<typeof Ionicons>['name'] {
  return focused
    ? icon
    : (`${icon}-outline` as React.ComponentProps<typeof Ionicons>['name'])
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Animated tab-bar icon with spring-based scale, opacity, vertical bounce,
 * filled/outline transition, and an animated active-indicator dot.
 *
 * All animations run on the native UI thread via Reanimated worklets.
 */
export function TabIconAnimator({
  icon,
  color,
  focused,
  size = ANIMATION_PARAMS.iconSize
}: TabIconAnimatorProps) {
  // ---- Shared values ----
  const scale = useSharedValue(
    focused ? ANIMATION_PARAMS.activeScale : ANIMATION_PARAMS.inactiveScale
  )
  const opacity = useSharedValue(
    focused ? ANIMATION_PARAMS.activeOpacity : ANIMATION_PARAMS.inactiveOpacity
  )
  const translateY = useSharedValue(0)
  const dotScale = useSharedValue(focused ? 1 : 0)
  const dotOpacity = useSharedValue(focused ? 1 : 0)
  const reduced = useReducedMotion()

  // ---- React to focused changes ----
  useEffect(() => {
    // Under reduce-motion, jump to the focused/unfocused target with no spring
    // overshoot and no vertical bounce — the indicator just swaps state.
    if (reduced) {
      scale.value = focused
        ? ANIMATION_PARAMS.activeScale
        : ANIMATION_PARAMS.inactiveScale
      opacity.value = focused
        ? ANIMATION_PARAMS.activeOpacity
        : ANIMATION_PARAMS.inactiveOpacity
      translateY.value = 0
      dotScale.value = focused ? 1 : 0
      dotOpacity.value = focused ? 1 : 0
      return
    }
    if (focused) {
      // Active targets with spring overshoot
      scale.value = withSpring(ANIMATION_PARAMS.activeScale, TAB_SPRING_CONFIG)
      opacity.value = withSpring(
        ANIMATION_PARAMS.activeOpacity,
        TAB_SPRING_CONFIG
      )
      // Bounce: spring to bounceY then back to 0 (spring naturally overshoots)
      translateY.value = withSpring(
        ANIMATION_PARAMS.bounceY,
        TAB_SPRING_CONFIG,
        () => {
          translateY.value = withSpring(0, TAB_SPRING_CONFIG)
        }
      )
      dotScale.value = withSpring(1, TAB_SPRING_CONFIG)
      dotOpacity.value = withSpring(1, TAB_SPRING_CONFIG)
    } else {
      // Inactive targets
      scale.value = withSpring(
        ANIMATION_PARAMS.inactiveScale,
        TAB_SPRING_CONFIG
      )
      opacity.value = withSpring(
        ANIMATION_PARAMS.inactiveOpacity,
        TAB_SPRING_CONFIG
      )
      translateY.value = withSpring(0, TAB_SPRING_CONFIG)
      dotScale.value = withSpring(0, TAB_SPRING_CONFIG)
      dotOpacity.value = withSpring(0, TAB_SPRING_CONFIG)
    }
  }, [focused, reduced, scale, opacity, translateY, dotScale, dotOpacity])

  // ---- Animated styles for the icon container ----
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value
  }))

  // ---- Animated styles for the dot indicator ----
  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotOpacity.value
  }))

  // ---- Determine icon variant ----
  const iconName = getIconName(icon, focused)
  const iconColor = focused ? theme.colors.primary : theme.colors.muted

  return (
    <Animated.View style={[styles.container, iconAnimatedStyle]}>
      <Ionicons name={iconName} color={iconColor} size={size} />
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: theme.colors.primary },
          dotAnimatedStyle
        ]}
      />
    </Animated.View>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs
  },
  dot: {
    width: ANIMATION_PARAMS.dotSize,
    height: ANIMATION_PARAMS.dotSize,
    borderRadius: theme.radius.full,
    marginTop: theme.spacing.xs
  }
})
