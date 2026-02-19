import Button from '@/components/common/Button'
import { useAuth } from '@/context/AuthContext'
import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const isWeb = Platform.OS === 'web'

function showAlert(title: string, message: string) {
  if (isWeb) {
    window.alert(message)
  } else {
    Alert.alert(title, message)
  }
}

function showConfirm(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void
) {
  if (isWeb) {
    if (window.confirm(message)) {
      onConfirm()
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: confirmText, style: 'destructive', onPress: onConfirm }
    ])
  }
}

export default function ProfileScreen() {
  const { user, isAnonymous, signOut } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const emailLabel = useMemo(() => {
    if (!user) {
      return 'No account'
    }
    if (isAnonymous || !user.email) {
      return 'Guest account'
    }
    return user.email
  }, [isAnonymous, user])

  const handleSignOut = useCallback(async () => {
    setLoggingOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Failed to sign out:', error)
      showAlert('Error', 'Failed to sign out. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }, [signOut])

  const confirmSignOut = useCallback(() => {
    showConfirm(
      'Log Out',
      'Are you sure you want to log out?',
      'Log Out',
      handleSignOut
    )
  }, [handleSignOut])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="barbell" size={36} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>PWO</Text>
          <Text style={styles.subtitle}>Personal Workout Organizer</Text>
          <Text style={styles.caption}>Version 1.0.0</Text>
        </View>

        <View style={styles.card}>
          <FeatureRow
            icon="fitness-outline"
            iconColor={theme.colors.primary}
            title="Track Your Progress"
            description="Monitor your workout streaks and achievements"
          />
          <View style={styles.divider} />
          <FeatureRow
            icon="time-outline"
            iconColor={theme.colors.success}
            title="Guided Sessions"
            description="Follow structured sessions with timers"
          />
          <View style={styles.divider} />
          <FeatureRow
            icon="trophy-outline"
            iconColor={theme.colors.accent}
            title="Set Goals"
            description="Define targets and work towards them"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Signed in as</Text>
            <Text style={styles.infoValue}>{emailLabel}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.caption}>
            {isAnonymous
              ? 'Create an account to keep your data across devices.'
              : 'Your account stays synced across devices.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Session</Text>
          <Button
            label={loggingOut ? 'Logging out...' : 'Log Out'}
            variant="secondary"
            size="lg"
            icon="log-out-outline"
            onPress={confirmSignOut}
            disabled={loggingOut}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function FeatureRow({
  icon,
  iconColor,
  title,
  description
}: {
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  title: string
  description: string
}) {
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIcon, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.sm
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md
  },
  featureContent: {
    flex: 1
  },
  featureTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: 2
  },
  featureDescription: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm
  },
  infoLabel: {
    ...theme.typography.body,
    color: theme.colors.muted
  },
  infoValue: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    maxWidth: '65%',
    textAlign: 'right'
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: theme.spacing.sm
  },
  caption: {
    ...theme.typography.caption,
    color: theme.colors.muted
  }
})
