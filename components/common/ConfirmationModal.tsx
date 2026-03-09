import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native'

interface ConfirmationModalProps {
  visible: boolean
  title: string
  message: string
  itemName?: string
  itemType?: 'exercise' | 'program'
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function ConfirmationModal({
  visible,
  title,
  message,
  itemName,
  itemType,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false
}: ConfirmationModalProps) {
  const handleConfirm = async () => {
    haptics.notifyWarning()
    await onConfirm()
  }

  const handleCancel = () => {
    haptics.buttonTap()
    onCancel()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <Pressable style={styles.modal} onPress={e => e.stopPropagation()}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="alert-circle"
              size={48}
              color={theme.colors.danger}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Item Details */}
          {itemName && (
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{itemName}</Text>
              {itemType && (
                <Text style={styles.itemType}>
                  {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
                </Text>
              )}
            </View>
          )}

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.buttonPressed
              ]}
              onPress={handleCancel}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled
              ]}
              onPress={handleConfirm}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.primaryTextOn} />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.sm
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm
  },
  itemDetails: {
    backgroundColor: theme.colors.dangerLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center'
  },
  itemName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  itemType: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginBottom: theme.spacing.xl
  },
  buttons: {
    flexDirection: 'row',
    gap: theme.spacing.md
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  confirmButton: {
    backgroundColor: theme.colors.danger
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }]
  },
  buttonDisabled: {
    opacity: 0.5
  },
  cancelButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  confirmButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  }
})
