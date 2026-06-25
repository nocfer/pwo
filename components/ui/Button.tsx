/**
 * Button — the kit's primary action primitive.
 *
 * Variants: primary (lime fill + dark text) · secondary (panel + border) ·
 * ghost (lime text, no fill) · danger (danger tint + danger text/border).
 * Sizes: sm | md | lg — md is 48 tall (the spec default). Pressed = scale 0.98;
 * disabled = recessed #1c1e25 fill + muted text; loading swaps the label for a
 * spinner and blocks presses.
 */

import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

type Props = {
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: keyof typeof Ionicons.glyphMap
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  style?: ViewStyle
  accessibilityLabel?: string
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 20 }

export default function Button({
  label,
  variant = 'secondary',
  size = 'md',
  icon,
  onPress,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  accessibilityLabel
}: Props) {
  const isDisabled = disabled || loading
  const fg = foreground(variant, isDisabled)

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth, style]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        // Guarantee a ≥44px touch target even for the sm size.
        hitSlop={size === 'sm' ? 8 : 0}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={({ pressed }) => [
          styles.base,
          sizeStyles[size],
          variantStyles[variant],
          pressed && !isDisabled && styles.pressed,
          pressed && !isDisabled && variant === 'ghost' && styles.pressedGhost,
          isDisabled && styles.disabled
        ]}
      >
        {loading ? (
          <ActivityIndicator color={fg} size="small" />
        ) : (
          <>
            {icon && (
              <Ionicons
                name={icon}
                size={ICON_SIZE[size]}
                color={fg}
                style={styles.icon}
              />
            )}
            <Text
              style={[styles.label, size === 'sm' && styles.labelSm, { color: fg }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  )
}

function foreground(variant: ButtonVariant, disabled: boolean): string {
  if (disabled) return theme.colors.muted
  switch (variant) {
    case 'primary':
      return theme.colors.primaryTextOn
    case 'ghost':
      return theme.colors.primary
    case 'danger':
      return theme.colors.danger
    default:
      return theme.colors.text
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start'
  },
  fullWidth: {
    alignSelf: 'stretch'
  },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  pressed: {
    transform: [{ scale: theme.motion.pressScale }],
    opacity: 0.9
  },
  pressedGhost: {
    opacity: 0.6
  },
  disabled: {
    backgroundColor: theme.colors.disabledBg,
    borderColor: 'transparent'
  },
  icon: {
    marginRight: theme.spacing.sm
  },
  label: {
    ...theme.typography.bodyBold
  },
  labelSm: {
    fontSize: 13
  }
})

// Min height 48 for md keeps the touch target generous; sm/lg scale around it.
const sizeStyles = StyleSheet.create({
  sm: {
    minHeight: 36,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md
  },
  md: {
    minHeight: 48,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg
  },
  lg: {
    minHeight: 56,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl
  }
})

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent'
  },
  danger: {
    backgroundColor: theme.colors.dangerTint,
    borderColor: theme.colors.dangerBorder
  }
})
