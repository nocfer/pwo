/**
 * RingChart - Animated circular progress indicator
 */

import { theme } from '@/theme/theme'
import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg'

type Props = {
  percentage: number // 0-100
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  labelText?: string
  animated?: boolean
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export default function RingChart({
  percentage,
  size = 100,
  strokeWidth = 10,
  showLabel = true,
  labelText,
  animated = true
}: Props) {
  const animatedValue = useRef(new Animated.Value(0)).current

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const center = size / 2

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: percentage,
        duration: 800,
        useNativeDriver: false
      }).start()
    } else {
      animatedValue.setValue(percentage)
    }
  }, [percentage, animated, animatedValue])

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0]
  })

  const displayValue = labelText ?? `${Math.round(percentage)}%`

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <Stop offset="0%" stopColor={theme.colors.primary} />
            <Stop offset="100%" stopColor={theme.colors.primaryDark} />
          </LinearGradient>
        </Defs>

        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors.card}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { fontSize: size * 0.22 }]}>
            {displayValue}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  svg: {
    transform: [{ rotateZ: '0deg' }]
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary
  }
})
