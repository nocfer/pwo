/**
 * Ring — presentational SVG progress ring (the cyan rest-timer ring, the lime
 * undo ring, etc.). Pass a 0..1 `progress` (fraction filled). Drive it by
 * changing `progress` each tick; for an animated sweep wrap the value yourself.
 * Render a centered label via `label` (convenience) or arbitrary `children`.
 */

import { theme } from '@/theme/theme'
import React, { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

type Props = {
  /** Fraction of the ring to fill, 0..1. */
  progress: number
  size: number
  stroke?: number
  color?: string
  trackColor?: string
  /** Centered numeric/text label (Space Grotesk). Ignored if `children` given. */
  label?: string
  children?: ReactNode
}

export default function Ring({
  progress,
  size,
  stroke = 4,
  color = theme.colors.info,
  trackColor = theme.colors.border,
  label,
  children
}: Props) {
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
      {children ?? (label && <Text style={[styles.label, { color }]}>{label}</Text>)}
    </View>
  )
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    position: 'absolute',
    ...theme.typography.metric,
    fontVariant: ['tabular-nums']
  }
})
