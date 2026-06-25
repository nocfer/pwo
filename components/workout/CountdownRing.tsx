/**
 * CountdownRing — the rest-timer ring (RestSheet, ActiveWorkoutBar). A thin
 * wrapper over the kit's Ring that pins the session cyan + ring-track defaults
 * so the timer surfaces keep their exact look.
 * @deprecated for non-timer use, import { Ring } from '@/components/ui'.
 */

import Ring from '@/components/ui/Ring'
import { theme } from '@/theme/theme'
import React from 'react'

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
  return (
    <Ring
      progress={progress}
      size={size}
      stroke={stroke}
      color={color}
      trackColor={trackColor}
    >
      {children}
    </Ring>
  )
}
