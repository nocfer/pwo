/**
 * Segmented — 2–3 mutually-exclusive options in an inset track.
 * Active segment = lime fill + dark text; inactive = subtext on the track.
 * The lime fill is a single pill that slides between segments on change
 * (snaps under reduced-motion); switching fires the selection haptic.
 */

import { haptics } from '@/lib/haptics'
import { timing } from '@/lib/motion'
import { theme } from '@/theme/theme'
import { useEffect, useRef, useState } from 'react'
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
  // -1 when `value` matches no option — then nothing is highlighted (no pill,
  // no active label), rather than falsely highlighting the first segment.
  const activeIndex = options.findIndex(o => o.value === value)
  const [rects, setRects] = useState<Rect[]>([])
  // True once the pill has a real measured position. Until then the active
  // segment keeps a static fill so its (dark) label never sits on the bare
  // dark track; after, the sliding pill takes over.
  const [placed, setPlaced] = useState(false)

  // The sliding pill — driven to the measured rect of the active segment so it
  // lands pixel-accurate regardless of padding/border.
  const x = useSharedValue(0)
  const y = useSharedValue(0)
  const w = useSharedValue(0)
  const h = useSharedValue(0)

  useEffect(() => {
    const rect = activeIndex >= 0 ? rects[activeIndex] : undefined
    if (!rect) return
    const animate = placed && !reduced
    x.value = animate ? withTiming(rect.x, timing.fast) : rect.x
    y.value = animate ? withTiming(rect.y, timing.fast) : rect.y
    w.value = animate ? withTiming(rect.width, timing.fast) : rect.width
    h.value = animate ? withTiming(rect.height, timing.fast) : rect.height
    if (!placed) setPlaced(true)
  }, [activeIndex, rects, reduced, placed, x, y, w, h])

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    width: w.value,
    height: h.value
  }))

  // Measure every segment, then commit once — one re-render instead of N.
  const measured = useRef<Rect[]>([])
  const onSegmentLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x: lx, y: ly, width, height } = e.nativeEvent.layout
    measured.current[index] = { x: lx, y: ly, width, height }
    if (measured.current.filter(Boolean).length === options.length) {
      setRects(measured.current.slice())
    }
  }

  return (
    <View style={[styles.container, style]} accessibilityRole="tablist">
      {placed && (
        <Animated.View pointerEvents="none" style={[styles.pill, pillStyle]} />
      )}
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
            // Static fill is the fallback before the pill is placed; once the
            // pill takes over it provides the active fill instead.
            style={[styles.segment, isActive && !placed && styles.segmentActive]}
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
  segmentActive: {
    backgroundColor: theme.colors.primary
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
