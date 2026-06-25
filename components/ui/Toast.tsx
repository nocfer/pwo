/**
 * Toast — transient bottom message with an optional action.
 *
 * Controlled by `visible`; auto-dismisses after `durationMs` via `onDismiss`.
 * Slides up from the bottom (snaps under reduced-motion). For the reversible-
 * delete countdown variant, use UndoToast.
 */

import { theme } from '@/theme/theme'
import { useEffect, useRef } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  SlideInDown,
  SlideOutDown,
  useReducedMotion
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
  visible: boolean
  message: string
  actionLabel?: string
  onAction?: () => void
  durationMs?: number
  onDismiss?: () => void
}

export default function Toast({
  visible,
  message,
  actionLabel,
  onAction,
  durationMs = 4000,
  onDismiss
}: Props) {
  const insets = useSafeAreaInsets()
  const reducedMotion = useReducedMotion()

  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    if (!visible || !onDismissRef.current) return
    const timer = setTimeout(() => onDismissRef.current?.(), durationMs)
    return () => clearTimeout(timer)
  }, [visible, durationMs])

  if (!visible) return null

  return (
    <Animated.View
      entering={
        reducedMotion ? undefined : SlideInDown.duration(theme.motion.durationToast)
      }
      exiting={
        reducedMotion ? undefined : SlideOutDown.duration(theme.motion.duration.fast)
      }
      style={[styles.container, { paddingBottom: insets.bottom + theme.spacing.md }]}
      pointerEvents="box-none"
    >
      <View style={styles.toast}>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        {actionLabel && (
          <Pressable
            onPress={onAction}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        )}
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
    backgroundColor: theme.colors.surfaceOverlay,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.sm
  },
  message: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flex: 1
  },
  action: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md
  },
  actionPressed: {
    opacity: 0.7
  },
  actionText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  }
})
