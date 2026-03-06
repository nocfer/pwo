import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ReactNode, useCallback, useRef } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import ReanimatedSwipeable, {
  type SwipeableMethods
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  type SharedValue
} from 'react-native-reanimated'

interface SwipeableListItemProps {
  children: ReactNode
  onDelete: () => void
  enabled?: boolean
}

const ACTION_WIDTH = 64
const BOUNCE_SPRING = { damping: 8, stiffness: 150, mass: 0.6 }

function RightAction({
  appeared,
  onPress
}: {
  appeared: SharedValue<number>
  onPress: () => void
}) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: appeared.value },
      { rotate: `${(1 - appeared.value) * -30}deg` }
    ],
    opacity: appeared.value
  }))

  return (
    <Pressable style={styles.action} onPress={onPress}>
      <Animated.View style={animStyle}>
        <Ionicons name="trash-outline" size={22} color={theme.colors.danger} />
      </Animated.View>
    </Pressable>
  )
}

export function SwipeableListItem({
  children,
  onDelete,
  enabled = true
}: SwipeableListItemProps) {
  const swipeableRef = useRef<SwipeableMethods>(null)
  const appeared = useSharedValue(0)

  const handleDelete = useCallback(() => {
    haptics.deleteItem()
    swipeableRef.current?.close()
    onDelete()
  }, [onDelete])

  const handleWillOpen = useCallback(() => {
    haptics.swipeAction()
    // Trigger the bounce animation when the panel opens
    appeared.value = 0
    appeared.value = withDelay(50, withSpring(1, BOUNCE_SPRING))
  }, [appeared])

  const handleClose = useCallback(() => {
    appeared.value = 0
  }, [appeared])

  const renderRightActions = useCallback(
    (_progress: SharedValue<number>, _translation: SharedValue<number>) => (
      <RightAction appeared={appeared} onPress={handleDelete} />
    ),
    [handleDelete, appeared]
  )

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      overshootFriction={8}
      enabled={enabled}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={handleWillOpen}
      onSwipeableClose={handleClose}
      containerStyle={styles.container}
    >
      {children}
    </ReanimatedSwipeable>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    overflow: 'hidden'
  },
  action: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center'
  }
})
