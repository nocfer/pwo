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
  disabled?: boolean
  loading?: boolean
  accessibilityLabel?: string
  style?: ViewStyle
}

export function DeleteButton({
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel = 'Delete',
  style
}: DeleteButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.buttonPressed,
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
            size={20}
            color={theme.colors.danger}
          />
          <Text style={styles.buttonText}>Delete</Text>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    height: 44,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.dangerLight
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }]
  },
  buttonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.danger
  },
  buttonDisabled: {
    opacity: 0.5
  }
})
