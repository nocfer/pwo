/**
 * motion — the app's shared Reanimated presets, built from `theme.motion`.
 *
 * This is the ONLY place that turns the motion tokens (duration scale, easing
 * bezier tuples, spring params) into concrete Reanimated values. Components
 * import these presets instead of hand-writing durations/curves, so every
 * transition shares one timing language.
 *
 * Reduce-motion: every preset takes a `reduced` flag (pass `useReducedMotion()`
 * from the component). When reduced, transforms collapse to quick fades and
 * loops are dropped — honoring the OS accessibility setting.
 *
 * Pairing: motion marks a state change; fire the matching `haptics.*` at the
 * same instant as the visual (see lib/haptics.ts) — never decorate.
 */

import { theme } from '@/theme/theme'
import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  LinearTransition,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated'

const { duration, easing, spring } = theme.motion

/** Easing functions built once from the theme's bezier control points. */
export const easings = {
  standard: Easing.bezier(...easing.standard),
  decelerate: Easing.bezier(...easing.decelerate)
}

/** withTiming configs keyed to the duration scale (standard curve). */
export const timing = {
  instant: { duration: duration.instant, easing: easings.standard },
  fast: { duration: duration.fast, easing: easings.standard },
  base: { duration: duration.base, easing: easings.standard },
  slow: { duration: duration.slow, easing: easings.standard },
  /** Enters / sheets — base duration, ease-out (decelerate). */
  enter: { duration: duration.base, easing: easings.decelerate }
} as const

/** Spring config for pops / success overshoot (withSpring). */
export const springConfig = spring

// ── Entering / exiting layout-animation builders ───────────────────────────
// Pass directly to <Animated.View entering={...} exiting={...} layout={...}>.

/**
 * Sheet / bar / banner / toast enter: rise 18px + fade, ease-out.
 * Reduced → a plain quick fade (no translate).
 */
export const enterUp = (reduced: boolean) =>
  reduced
    ? FadeIn.duration(duration.fast)
    : FadeInDown.duration(duration.base).easing(easings.decelerate)

/** Matching exit for {@link enterUp}. Reduced → plain quick fade. */
export const exitDown = (reduced: boolean) =>
  reduced
    ? FadeOut.duration(duration.fast)
    : FadeOutDown.duration(duration.fast).easing(easings.standard)

/** List item add — fade in (base; quick when reduced). */
export const listAdd = (reduced: boolean) =>
  FadeIn.duration(reduced ? duration.fast : duration.base)

/** List item remove (e.g. delete before undo) — fade out. */
export const listRemove = (reduced: boolean) =>
  FadeOut.duration(reduced ? duration.fast : duration.base)

/**
 * Layout shift for surviving siblings when an item is added/removed.
 * Reduced → `undefined` (snap into place, no animated reflow).
 */
export const layoutShift = (reduced: boolean) =>
  reduced ? undefined : LinearTransition.duration(duration.base).easing(easings.standard)

/** Tab / segment crossfade — quick fade of the entering content. */
export const crossfade = (reduced: boolean) =>
  FadeIn.duration(reduced ? duration.instant : duration.fast)

// ── Shared-value worklet helpers ───────────────────────────────────────────
// Assign the return value to a scale shared value, e.g.
//   scale.value = popScale(reduced)

/**
 * Emphasis pop — overshoot to 1.14 then spring to rest at 1. Used for the
 * session log pop and set/exercise-complete moments (pair with notifySuccess).
 * Reduced → settle to 1 instantly (no overshoot).
 */
export function popScale(reduced: boolean) {
  'worklet'
  if (reduced) return withTiming(1, { duration: duration.instant })
  return withSequence(
    withTiming(1.14, { duration: duration.fast, easing: easings.standard }),
    withSpring(1, spring)
  )
}

/**
 * Press feedback — scale toward `theme.motion.pressScale` while held, restore
 * on release. Reduced still gives a subtle, quick scale (no bounce).
 * Backs hooks/usePressScale (step 3).
 */
export function pressScaleTo(pressed: boolean, reduced: boolean) {
  'worklet'
  const target = pressed ? theme.motion.pressScale : 1
  return withTiming(target, {
    duration: reduced ? duration.instant : duration.fast,
    easing: easings.standard
  })
}
