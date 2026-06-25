/**
 * HoldRing — the lime count-up ring for a timed (hold) set. Unlike the static
 * {@link Ring} / {@link CountdownRing}, the sweep is animated with Reanimated:
 * each per-second `progress` update glides to its new fill (linear, ~1s) so the
 * ring reads as a continuous count-up rather than stepping. The CSS conic
 * gradient in the design mock is realized here as an animated SVG stroke.
 *
 * Progress is the *fraction held* (elapsed / target), 0..1. Center content is
 * supplied via `children` (the m:ss label + sublabel).
 */

import { theme } from '@/theme/theme'
import React, { ReactNode, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export type HoldRingProps = {
  /** Fraction of the hold completed, 0..1 (elapsed / target). */
  progress: number
  size: number
  stroke: number
  color?: string
  trackColor?: string
  children?: ReactNode
}

export function HoldRing({
  progress,
  size,
  stroke,
  color = theme.colors.session.lime,
  trackColor = theme.colors.session.ringTrack,
  children
}: HoldRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const reduced = useReducedMotion()

  // Drive the fill from a shared value so each per-second progress bump sweeps
  // smoothly (linear over one tick) instead of jumping.
  const filled = useSharedValue(Math.min(1, Math.max(0, progress)))

  useEffect(() => {
    const clamped = Math.min(1, Math.max(0, progress))
    filled.value = reduced
      ? clamped
      : withTiming(clamped, {
          duration: theme.motion.duration.slow,
          // Linear: a hold ticks at a constant rate, so the sweep should too.
          easing: Easing.linear
        })
  }, [progress, reduced, filled])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - filled.value)
  }))

  return (
    <View style={[styles.ring, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center'
  }
})
