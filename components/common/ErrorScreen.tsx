/**
 * ErrorScreen - Consistent error / not-found state
 *
 * Two layouts:
 * - Full screen (default): a route-level error / not-found wrapper.
 * - inline: a padded centered block for use inside a card or list region.
 *
 * Distinct from EmptyState: this is for a *failed load*, not "no data yet".
 * Offer a retry, and — when a cached copy is still on screen — note that the
 * user is looking at their last offline copy.
 */

import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Props = {
  title?: string
  message?: string
  /** Show a lime "Try again" button wired to this callback */
  onRetry?: () => void
  /** Show a chip noting cached data is being shown */
  hasOfflineCopy?: boolean
  showBackButton?: boolean
  onBack?: () => void
  /** Render as a padded centered block instead of a full screen */
  inline?: boolean
}

export function ErrorScreen({
  title,
  message = 'Something went wrong.',
  onRetry,
  hasOfflineCopy = false,
  showBackButton = true,
  onBack,
  inline = false
}: Props) {
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  const body = (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={32}
          color={theme.colors.danger}
        />
      </View>

      {title && <Text style={styles.title}>{title}</Text>}
      <Text style={styles.message}>{message}</Text>

      {hasOfflineCopy && (
        <View style={styles.offlineChip}>
          <Ionicons
            name="cloud-offline-outline"
            size={14}
            color={theme.colors.warning}
          />
          <Text style={styles.offlineChipText}>
            Showing your last offline copy
          </Text>
        </View>
      )}

      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed
          ]}
        >
          <Ionicons
            name="refresh"
            size={18}
            color={theme.colors.primaryTextOn}
          />
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      )}

      {showBackButton && !inline && (
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed
          ]}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      )}
    </View>
  )

  if (inline) {
    return <View style={styles.inlineContainer}>{body}</View>
  }

  return <SafeAreaView style={styles.container}>{body}</SafeAreaView>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  inlineContainer: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: theme.spacing.lg
  },
  offlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.warningLight,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing.lg
  },
  offlineChipText: {
    ...theme.typography.caption,
    color: theme.colors.warning
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary
  },
  retryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  retryButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  backButton: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface
  },
  backButtonPressed: {
    backgroundColor: theme.colors.background,
    transform: [{ scale: 0.98 }]
  },
  backButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  }
})

export default ErrorScreen
