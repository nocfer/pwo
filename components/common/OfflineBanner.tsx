/**
 * OfflineBanner - Slim global banner shown while the device is offline.
 *
 * Mounted once in the root layout so it appears above every screen. Driven by
 * DataContext's connectivity state; slides in/out on connectivity change.
 */

import Banner from '@/components/ui/Banner'
import { useSyncStatus } from '@/context/DataContext'
import { theme } from '@/theme/theme'
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
      entering={reducedMotion ? undefined : SlideInUp.duration(theme.motion.durationBanner)}
      exiting={
        reducedMotion ? undefined : SlideOutUp.duration(theme.motion.duration.fast)
      }
    >
      <Banner
        tone="offline"
        showDot
        icon="cloud-offline-outline"
        message="You're offline · changes are saved and will sync automatically"
        style={{ paddingTop: insets.top + theme.spacing.xs }}
      />
    </Animated.View>
  )
}

export default OfflineBanner
