import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle
} from 'react-native'

interface DeleteButtonProps {
  onPress: () => void
  variant?: 'icon' | 'text' | 'inline'
  size?: 'sm' | 'md'
  disabled?: boolean
  loading?: boolean
  accessibilityLabel?: string
  style?: ViewStyle
}

export function DeleteButton({
  onPress,
  variant = 'icon',
  size = 'md',
  disabled = false,
  loading = false,
  accessibilityLabel = 'Delete',
  style
}: DeleteButtonProps) {
  const iconSize = size === 'sm' ? 18 : 20

  if (variant === 'icon') {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.iconButton,
          size === 'sm' && styles.iconButtonSm,
          pressed && !disabled && styles.iconButtonPressed,
          disabled && styles.buttonDisabled,
          style
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.danger} />
        ) : (
          <Ionicons
            name="trash-outline"
            size={iconSize}
            color={theme.colors.danger}
          />
        )}
      </Pressable>
    )
  }

  if (variant === 'inline') {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.inlineButton,
          pressed && !disabled && styles.inlineButtonPressed,
          disabled && styles.buttonDisabled,
          style
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.danger} />
        ) : (
          <>
            <Ionicons
              name="trash-outline"
              size={16}
              color={theme.colors.danger}
            />
            <Text style={styles.inlineButtonText}>Delete</Text>
          </>
        )}
      </Pressable>
    )
  }

  // text variant
  return (
    <Pressable
      style={({ pressed }) => [
        styles.textButton,
        size === 'sm' && styles.textButtonSm,
        pressed && !disabled && styles.textButtonPressed,
        disabled && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.danger} />
      ) : (
        <>
          <Ionicons
            name="trash-outline"
            size={iconSize}
            color={theme.colors.danger}
          />
          <Text style={styles.textButtonText}>Delete</Text>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconButtonSm: {
    width: 40,
    height: 40
  },
  iconButtonPressed: {
    backgroundColor: theme.colors.dangerLight,
    transform: [{ scale: 0.96 }]
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    height: 44,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.dangerLight
  },
  textButtonSm: {
    height: 40,
    paddingHorizontal: theme.spacing.md
  },
  textButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }]
  },
  textButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.danger
  },
  inlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm
  },
  inlineButtonPressed: {
    opacity: 0.7
  },
  inlineButtonText: {
    ...theme.typography.caption,
    color: theme.colors.danger
  },
  buttonDisabled: {
    opacity: 0.5
  }
})
