/**
 * Sheet — bottom sheet: grab handle + optional title + content over a tappable
 * backdrop scrim. Top corners use radius 26; slides up (snaps under reduced-
 * motion). Tapping the scrim or the hardware back closes it via onClose.
 */

import { theme } from '@/theme/theme'
import { ReactNode } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  SlideInDown,
  SlideOutDown,
  useReducedMotion
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
  visible: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function Sheet({ visible, onClose, title, children }: Props) {
  const insets = useSafeAreaInsets()
  const reducedMotion = useReducedMotion()

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.scrim}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Animated.View
          entering={
            reducedMotion
              ? undefined
              : SlideInDown.duration(theme.motion.duration.slow)
          }
          exiting={
            reducedMotion ? undefined : SlideOutDown.duration(theme.motion.duration.base)
          }
          style={[styles.sheet, { paddingBottom: insets.bottom + theme.spacing.lg }]}
        >
          {/* Stop taps inside the sheet from closing it. */}
          <Pressable onPress={e => e.stopPropagation()}>
            <View style={styles.handle} />
            {title && <Text style={styles.title}>{title}</Text>}
            {children}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: theme.colors.surfaceOverlay,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.lg
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.borderLight,
    alignSelf: 'center',
    marginBottom: theme.spacing.md
  },
  title: {
    ...theme.typography.heading,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md
  }
})
