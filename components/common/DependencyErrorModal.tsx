import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import { Program } from '@/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native'

interface DependencyErrorModalProps {
  visible: boolean
  itemName: string
  itemType: 'exercise' | 'program'
  dependentPrograms: Program[]
  onDismiss: () => void
}

export function DependencyErrorModal({
  visible,
  itemName,
  itemType,
  dependentPrograms,
  onDismiss
}: DependencyErrorModalProps) {
  const handleDismiss = () => {
    haptics.buttonTap()
    onDismiss()
  }

  const displayPrograms = dependentPrograms.slice(0, 5)
  const remainingCount = dependentPrograms.length - 5

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="alert-circle"
              size={48}
              color={theme.colors.danger}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Cannot Delete {itemType}</Text>

          {/* Item Name */}
          <View style={styles.itemNameContainer}>
            <Text style={styles.itemName}>{itemName}</Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>
            This {itemType} is used by {dependentPrograms.length} program
            {dependentPrograms.length === 1 ? '' : 's'} and cannot be deleted.
          </Text>

          {/* Program List */}
          <View style={styles.programListContainer}>
            <Text style={styles.programListTitle}>Used by:</Text>
            <ScrollView
              style={styles.programList}
              showsVerticalScrollIndicator={false}
            >
              {displayPrograms.map(program => (
                <View key={program.id} style={styles.programItem}>
                  <Ionicons
                    name="barbell"
                    size={16}
                    color={theme.colors.subtext}
                  />
                  <Text style={styles.programName}>{program.name}</Text>
                </View>
              ))}
              {remainingCount > 0 && (
                <Text style={styles.remainingText}>
                  and {remainingCount} more...
                </Text>
              )}
            </ScrollView>
          </View>

          {/* Dismiss Button */}
          <Pressable
            style={({ pressed }) => [
              styles.dismissButton,
              pressed && styles.dismissButtonPressed
            ]}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Got It"
          >
            <Text style={styles.dismissButtonText}>Got It</Text>
          </Pressable>
        </View>
      </View>
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
    maxHeight: '80%',
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
    marginBottom: theme.spacing.md
  },
  itemNameContainer: {
    backgroundColor: theme.colors.dangerLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center'
  },
  itemName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginBottom: theme.spacing.lg
  },
  programListContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    maxHeight: 200
  },
  programListTitle: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  programList: {
    maxHeight: 150
  },
  programItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  programName: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    flex: 1
  },
  remainingText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs
  },
  dismissButton: {
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dismissButtonPressed: {
    backgroundColor: theme.colors.background,
    transform: [{ scale: 0.98 }]
  },
  dismissButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  }
})
