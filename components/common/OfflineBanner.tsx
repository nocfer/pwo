/**
 * OfflineBanner - Slim global banner shown while the device is offline.
 *
 * Mounted once in the root layout so it appears above every screen. Driven by
 * DataContext's connectivity state; slides in/out on connectivity change.
 */

import { useSyncStatus } from '@/context/DataContext'
import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet, Text } from 'react-native'
import { Dot } from './Dot'
import Animated, {
  SlideInUp,
  SlideOutUp,
  useReducedMotion
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function OfflineBanner() {
  const { isOnline } = useSyncStatus()
  const insets = useSafeAreaInsets()
  const reducedMotion = useReducedMotion()

  if (isOnline) return null

  return (
    <Animated.View
      entering={reducedMotion ? undefined : SlideInUp.duration(280)}
      exiting={reducedMotion ? undefined : SlideOutUp.duration(200)}
      style={[styles.banner, { paddingTop: insets.top + theme.spacing.xs }]}
    >
      <Dot />
      <Ionicons
        name="cloud-offline-outline"
        size={14}
        color={theme.colors.warning}
      />
      <Text style={styles.text} numberOfLines={1}>
        You&apos;re offline · changes are saved and will sync automatically
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.offlineBg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offlineBorder,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm
  },
  text: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    flex: 1
  }
})

export default OfflineBanner
