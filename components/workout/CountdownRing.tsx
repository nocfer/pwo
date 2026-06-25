/**
 * CountdownRing — presentational SVG progress ring shared by the rest-timer
 * surfaces (RestSheet, ActiveWorkoutBar). Pass a 0..1 `progress` (remaining /
 * duration); render the centered label as children.
 */

import { theme } from '@/theme/theme'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

export type CountdownRingProps = {
  /** Fraction of the ring to fill, 0..1 (e.g. remainingMs / durationMs). */
  progress: number
  size: number
  stroke: number
  color?: string
  trackColor?: string
  /** Centered overlay (typically the m:ss label). */
  children?: React.ReactNode
}

export function CountdownRing({
  progress,
  size,
  stroke,
  color = theme.colors.session.cyan,
  trackColor = theme.colors.session.ringTrack,
  children
}: CountdownRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(1, Math.max(0, progress))
  const dashOffset = circumference * (1 - clamped)

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
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
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
