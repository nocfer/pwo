import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import React from 'react'
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native'

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  variant?: 'default' | 'search' | 'progress' | 'history'
  style?: ViewStyle
  compact?: boolean
}

const variantConfig = {
  default: {
    icon: 'barbell-outline' as const,
    iconColor: theme.colors.primary,
    iconBg: theme.colors.primaryLight
  },
  search: {
    icon: 'search-outline' as const,
    iconColor: theme.colors.muted,
    iconBg: theme.colors.background
  },
  progress: {
    icon: 'trending-up-outline' as const,
    iconColor: theme.colors.success,
    iconBg: theme.colors.successLight
  },
  history: {
    icon: 'time-outline' as const,
    iconColor: theme.colors.accent,
    iconBg: theme.colors.accentLight
  }
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
  style,
  compact = false
}: EmptyStateProps) {
  const config = variantConfig[variant]
  const iconName = icon || config.icon

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <View
          style={[
            styles.compactIconContainer,
            { backgroundColor: config.iconBg }
          ]}
        >
          <Ionicons name={iconName} size={20} color={config.iconColor} />
        </View>
        <View style={styles.compactTextContainer}>
          <Text style={styles.compactTitle}>{title}</Text>
          {description && (
            <Text style={styles.compactDescription}>{description}</Text>
          )}
        </View>
        {actionLabel && onAction && (
          <Pressable
            style={({ pressed }) => [
              styles.compactButton,
              pressed && styles.buttonPressed
            ]}
            onPress={onAction}
          >
            <Text style={styles.compactButtonText}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
        <Ionicons name={iconName} size={32} color={config.iconColor} />
      </View>

      <Text style={styles.title}>{title}</Text>

      {description && <Text style={styles.description}>{description}</Text>}

      {actionLabel && onAction && (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={onAction}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}

      {secondaryActionLabel && onSecondaryAction && (
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed
          ]}
          onPress={onSecondaryAction}
        >
          <Text style={styles.secondaryButtonText}>{secondaryActionLabel}</Text>
        </Pressable>
      )}
    </View>
  )
}

// Pre-built empty states
export function NoSearchResultsEmpty({ query }: { query: string }) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={`Nothing matches "${query}"`}
      compact
    />
  )
}

export function NoProgressEmpty() {
  return (
    <EmptyState
      variant="progress"
      icon="flame-outline"
      title="No progress yet"
      description="Complete your first workout to start tracking"
    />
  )
}

export function NoHistoryEmpty() {
  return (
    <EmptyState
      variant="history"
      title="No history yet"
      description="Your workout history will appear here"
    />
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22
  },
  button: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  buttonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  secondaryButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md
  },
  secondaryButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg
  },
  compactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  compactTextContainer: {
    flex: 1,
    gap: 2
  },
  compactTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  compactDescription: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  compactButton: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md
  },
  compactButtonText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary
  }
})

export default EmptyState
