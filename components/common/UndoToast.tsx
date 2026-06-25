/**
 * UndoToast - Bottom "Deleted · Undo" toast with a 5s countdown ring.
 *
 * Replaces a blocking confirm for reversible deletes: the item is removed
 * optimistically and this toast counts down; when the ring completes the delete
 * is committed (onComplete), and Undo (onUndo) restores it. One toast at a time.
 * Honors reduced-motion (no ring sweep — commits on a timer instead).
 */

import { theme } from '@/theme/theme'
import { useEffect, useRef } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  SlideInDown,
  SlideOutDown,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const RING_SIZE = 28
const STROKE = 3
const R = (RING_SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * R

type Props = {
  visible: boolean
  message: string
  subMessage?: string
  durationMs?: number
  onUndo: () => void
  onComplete: () => void
}

export function UndoToast({
  visible,
  message,
  subMessage,
  durationMs = 5000,
  onUndo,
  onComplete
}: Props) {
  const insets = useSafeAreaInsets()
  const reducedMotion = useReducedMotion()
  const progress = useSharedValue(0)

  // Keep latest callbacks without restarting the countdown each render.
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const fireComplete = () => onCompleteRef.current()

  useEffect(() => {
    if (!visible) return

    if (reducedMotion) {
      progress.value = 1
      const timer = setTimeout(fireComplete, durationMs)
      return () => clearTimeout(timer)
    }

    progress.value = 0
    progress.value = withTiming(
      1,
      { duration: durationMs, easing: Easing.linear },
      finished => {
        if (finished) runOnJS(fireComplete)()
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, durationMs, reducedMotion])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * progress.value
  }))

  if (!visible) return null

  return (
    <Animated.View
      entering={reducedMotion ? undefined : SlideInDown.duration(260)}
      exiting={reducedMotion ? undefined : SlideOutDown.duration(180)}
      style={[styles.container, { paddingBottom: insets.bottom + theme.spacing.md }]}
      pointerEvents="box-none"
    >
      <View style={styles.toast}>
        <View style={styles.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={R}
              stroke={theme.colors.border}
              strokeWidth={STROKE}
              fill="none"
            />
            <AnimatedCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={R}
              stroke={theme.colors.primary}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={animatedProps}
              // Start the ring at 12 o'clock and deplete clockwise.
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.message} numberOfLines={1}>
            {message}
          </Text>
          {subMessage && (
            <Text style={styles.subMessage} numberOfLines={1}>
              {subMessage}
            </Text>
          )}
        </View>

        <Pressable
          onPress={onUndo}
          hitSlop={8}
          style={({ pressed }) => [styles.undoButton, pressed && styles.undoPressed]}
        >
          <Text style={styles.undoText}>Undo</Text>
        </Pressable>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center'
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    width: '100%',
    maxWidth: 480,
    backgroundColor: theme.colors.session.elevated,
    borderWidth: 1,
    borderColor: theme.colors.session.editorBorder,
    borderRadius: 18,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.sm
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE
  },
  textWrap: {
    flex: 1
  },
  message: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  subMessage: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  undoButton: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md
  },
  undoPressed: {
    opacity: 0.7
  },
  undoText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  }
})

export default UndoToast
