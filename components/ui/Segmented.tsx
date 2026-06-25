/**
 * Segmented — 2–3 mutually-exclusive options in an inset track.
 * Active segment = lime fill + dark text; inactive = subtext on the track.
 * The lime fill is a single pill that slides between segments on change
 * (snaps under reduced-motion); switching fires the selection haptic.
 */

import { haptics } from '@/lib/haptics'
import { timing } from '@/lib/motion'
import { theme } from '@/theme/theme'
import { useEffect, useState } from 'react'
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

type Option<T extends string> = {
  value: T
  label: string
}

type Props<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  style?: ViewStyle
}

type Rect = { x: number; y: number; width: number; height: number }

export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  style
}: Props<T>) {
  const reduced = useReducedMotion()
  const activeIndex = Math.max(
    0,
    options.findIndex(o => o.value === value)
  )
  const [rects, setRects] = useState<Rect[]>([])

  // The sliding pill — driven to the measured rect of the active segment so it
  // lands pixel-accurate regardless of padding/border. `ready` keeps it hidden
  // until the first measurement so it never flashes at the origin.
  const x = useSharedValue(0)
  const y = useSharedValue(0)
  const w = useSharedValue(0)
  const h = useSharedValue(0)
  const ready = useSharedValue(0)

  useEffect(() => {
    const rect = rects[activeIndex]
    if (!rect) return
    const animate = ready.value === 1 && !reduced
    x.value = animate ? withTiming(rect.x, timing.fast) : rect.x
    y.value = animate ? withTiming(rect.y, timing.fast) : rect.y
    w.value = animate ? withTiming(rect.width, timing.fast) : rect.width
    h.value = animate ? withTiming(rect.height, timing.fast) : rect.height
    ready.value = 1
  }, [activeIndex, rects, reduced, x, y, w, h, ready])

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    width: w.value,
    height: h.value,
    opacity: ready.value
  }))

  const onSegmentLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x: lx, y: ly, width, height } = e.nativeEvent.layout
    setRects(prev => {
      const next = prev.slice()
      next[index] = { x: lx, y: ly, width, height }
      return next
    })
  }

  return (
    <View style={[styles.container, style]} accessibilityRole="tablist">
      <Animated.View pointerEvents="none" style={[styles.pill, pillStyle]} />
      {options.map((option, index) => {
        const isActive = option.value === value
        return (
          <Pressable
            key={option.value}
            onLayout={onSegmentLayout(index)}
            onPress={() => {
              if (!isActive) {
                haptics.tabSwitch()
                onChange(option.value)
              }
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={styles.segment}
          >
            <Text
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.inset,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 3,
    gap: 3
  },
  pill: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm
  },
  segment: {
    flex: 1,
    minHeight: 40,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm
  },
  label: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.subtext
  },
  labelActive: {
    color: theme.colors.primaryTextOn
  }
})
