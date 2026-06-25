/**
 * ListRow — selectable row with an optional leading icon tile, title + meta, and
 * a trailing affordance (chevron / check / none).
 *
 * Selected = lime-tint bg + lime-tinted border, and the `check` trailing fills.
 * Press feedback matches the kit's standard scale.
 */

import { usePressScale } from '@/hooks/usePressScale'
import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import Checkbox from './Checkbox'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export type ListRowTrailing = 'chevron' | 'check' | 'none'

type Props = {
  title: string
  meta?: string
  leadingIcon?: keyof typeof Ionicons.glyphMap
  trailing?: ListRowTrailing
  selected?: boolean
  onPress?: () => void
  disabled?: boolean
}

export default function ListRow({
  title,
  meta,
  leadingIcon,
  trailing = 'chevron',
  selected = false,
  onPress,
  disabled = false
}: Props) {
  const interactive = !!onPress && !disabled
  const press = usePressScale({ enabled: interactive, pressedOpacity: 0.95 })
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={[
        styles.row,
        selected && styles.rowSelected,
        disabled && styles.disabled,
        interactive && press.animatedStyle
      ]}
    >
      {leadingIcon && (
        <View style={styles.iconTile}>
          <Ionicons name={leadingIcon} size={20} color={theme.colors.primary} />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {meta && (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        )}
      </View>

      {trailing === 'chevron' && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.colors.muted}
        />
      )}
      {trailing === 'check' && <Checkbox checked={selected} />}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md
  },
  rowSelected: {
    backgroundColor: theme.colors.primaryTint,
    borderColor: theme.colors.borderActive
  },
  disabled: {
    opacity: 0.5
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.chip,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  body: {
    flex: 1
  },
  title: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  meta: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: 2
  }
})
