import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

type Props = {
  title: string
  subtitle: string
  iconName: React.ComponentProps<typeof Ionicons>['name']
  showBackButton?: boolean
  onBack?: () => void
}

export function AuthHeader({
  title,
  subtitle,
  iconName,
  showBackButton = false,
  onBack
}: Props) {
  return (
    <View style={styles.header}>
      {showBackButton && (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed
          ]}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>
      )}
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={48} color={theme.colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md
  },
  backButtonPressed: {
    backgroundColor: theme.colors.surface
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center'
  }
})

export default AuthHeader
