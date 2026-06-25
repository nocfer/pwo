import { theme } from '@/theme/theme'
import React, { useEffect, useRef } from 'react'
import { Animated, ViewStyle } from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'

type AnimatedCardProps = {
  children: React.ReactNode
  delay?: number
  style?: ViewStyle
}

/**
 * A wrapper component that animates its children with a fade-in and slide-up effect.
 * Starts nearly visible (opacity 0.85) to prevent white flash during tab switches.
 */
export function AnimatedCard({
  children,
  delay = 0,
  style
}: AnimatedCardProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(0)).current
  const reduced = useReducedMotion()

  useEffect(() => {
    // Reduce-motion: no slide — rest fully visible and in place.
    if (reduced) {
      fadeAnim.setValue(1)
      slideAnim.setValue(0)
      return
    }
    // Start from slightly offset, already visible
    fadeAnim.setValue(0.85)
    slideAnim.setValue(6)

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        delay,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        delay,
        useNativeDriver: true
      })
    ]).start()
  }, [fadeAnim, slideAnim, delay, reduced])

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        },
        style
      ]}
    >
      {children}
    </Animated.View>
  )
}

type AnimatedProgressBarProps = {
  progress: number // 0 to 1
  color: string
  height?: number
  duration?: number
}

/**
 * An animated progress bar that smoothly transitions to new values
 */
export function AnimatedProgressBar({
  progress,
  color,
  height = 8,
  duration = 500
}: AnimatedProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration,
      useNativeDriver: false
    }).start()
  }, [progress, widthAnim, duration])

  const width = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  })

  return (
    <Animated.View
      style={{
        height,
        width,
        backgroundColor: color,
        borderRadius: theme.radius.sm
      }}
    />
  )
}

type PulseAnimationProps = {
  children: React.ReactNode
  isActive?: boolean
  style?: ViewStyle
}

/**
 * Adds a subtle pulse animation to its children when active
 */
export function PulseAnimation({
  children,
  isActive = false,
  style
}: PulseAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const reduced = useReducedMotion()

  useEffect(() => {
    // Reduce-motion: no continuous pulse loop — hold at rest scale.
    if (reduced) {
      scaleAnim.setValue(1)
      return
    }
    if (isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.02,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          })
        ])
      )
      pulse.start()
      return () => pulse.stop()
    } else {
      scaleAnim.setValue(1)
    }
  }, [isActive, scaleAnim, reduced])

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      {children}
    </Animated.View>
  )
}

type FadeInProps = {
  children: React.ReactNode
  delay?: number
  duration?: number
  style?: ViewStyle
}

/**
 * Simple fade-in animation wrapper
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 300,
  style
}: FadeInProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true
    }).start()
  }, [fadeAnim, duration, delay])

  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      {children}
    </Animated.View>
  )
}

export default AnimatedCard
