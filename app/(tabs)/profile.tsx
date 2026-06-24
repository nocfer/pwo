import { Button, SegmentedControl, ToggleSwitch } from '@/components/common'
import { useAuth } from '@/context/AuthContext'
import { usePrograms } from '@/hooks/data'
import { getInitials } from '@/lib/utils/format'
import { encodeProgramForShare } from '@/lib/utils/programShare'
import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import Constants from 'expo-constants'
import { router } from 'expo-router'
import { Fragment, type ReactNode, useCallback, useMemo, useState } from 'react'
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const isWeb = Platform.OS === 'web'

// NOTE: the preference toggles below are mocked with local state. A dedicated
// settings backend is planned — wire these to it (and persist) when it lands.

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
  const { user, isAnonymous, signOut, linkAccount } = useAuth()
  const { data: programs } = usePrograms()
  const [loggingOut, setLoggingOut] = useState(false)

  // Mocked preference state (see note above).
  const [units, setUnits] = useState<'lb' | 'kg'>('kg')
  const [workoutReminders, setWorkoutReminders] = useState(false)
  const [autoStartRest, setAutoStartRest] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)
  const [hapticFeedback, setHapticFeedback] = useState(true)

  // Guest-upgrade modal state.
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeEmail, setUpgradeEmail] = useState('')
  const [upgradePassword, setUpgradePassword] = useState('')
  const [upgradeBusy, setUpgradeBusy] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)

  const displayName = useMemo(
    () => user?.displayName || user?.email?.split('@')[0] || 'Guest',
    [user]
  )
  const emailLabel = useMemo(() => {
    if (!user) return 'No account'
    if (isAnonymous || !user.email) return 'Guest account'
    return user.email
  }, [isAnonymous, user])

  const appVersion = Constants.expoConfig?.version ?? '1.1.0'

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

  const handleExport = useCallback(async () => {
    if (!programs || programs.length === 0) {
      showAlert('Nothing to export', 'You have no programs to export yet.')
      return
    }
    try {
      const payload = programs.map(p => JSON.parse(encodeProgramForShare(p)))
      await Share.share({
        message: JSON.stringify(payload, null, 2),
        title: 'PWO programs export'
      })
    } catch {
      // Share resolves on user cancel, so reaching here means a real failure.
      showAlert('Export failed', 'Could not export your data. Please try again.')
    }
  }, [programs])

  const handleImport = useCallback(() => {
    router.navigate('/library/scan')
  }, [])

  const handleUpgrade = useCallback(async () => {
    setUpgradeBusy(true)
    setUpgradeError(null)
    try {
      await linkAccount(upgradeEmail, upgradePassword)
      setUpgradeOpen(false)
      setUpgradeEmail('')
      setUpgradePassword('')
      showAlert('Account created', 'Your data is now backed up and synced.')
    } catch (err) {
      setUpgradeError(
        err instanceof Error ? err.message : 'Could not create account.'
      )
    } finally {
      setUpgradeBusy(false)
    }
  }, [linkAccount, upgradeEmail, upgradePassword])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Account hero */}
        <View style={styles.accountHero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.accountEmail} numberOfLines={1}>
              {emailLabel}
            </Text>
            {!isAnonymous && user && (
              <View style={styles.syncPill}>
                <Text style={styles.syncDot}>●</Text>
                <Text style={styles.syncText}>Synced</Text>
              </View>
            )}
          </View>
        </View>

        {/* Guest upgrade */}
        {isAnonymous && (
          <Pressable
            style={styles.upgradeCard}
            onPress={() => setUpgradeOpen(true)}
          >
            <View style={styles.upgradeIcon}>
              <Ionicons name="add" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.upgradeText}>
              <Text style={styles.upgradeTitle}>Back up & sync</Text>
              <Text style={styles.upgradeSub}>
                Create an account to keep your data across devices
              </Text>
            </View>
            <View style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Create</Text>
            </View>
          </Pressable>
        )}

        {/* Preferences */}
        <SettingsSection label="Preferences">
          <SettingsRow
            icon="barbell"
            iconColor={theme.colors.primary}
            iconBg={theme.colors.primaryLight}
            label="Units"
            right={
              <SegmentedControl
                options={[
                  { value: 'lb', label: 'lb' },
                  { value: 'kg', label: 'kg' }
                ]}
                value={units}
                onChange={setUnits}
              />
            }
          />
          <SettingsRow
            icon="timer-outline"
            iconColor={theme.colors.info}
            iconBg={theme.colors.infoLight}
            label="Default rest"
            right={<ValueChevron value="1:30" />}
            onPress={() =>
              showAlert('Default rest', 'Rest settings sync is coming soon.')
            }
          />
          <SettingsRow
            icon="calendar-outline"
            iconColor={theme.colors.accent}
            iconBg={theme.colors.accentLight}
            label="Week starts"
            right={<ValueChevron value="Monday" />}
            onPress={() =>
              showAlert('Week starts', 'This preference is coming soon.')
            }
          />
        </SettingsSection>

        {/* Reminders */}
        <SettingsSection label="Reminders">
          <SettingsRow
            icon="notifications-outline"
            iconColor={theme.colors.primary}
            iconBg={theme.colors.primaryLight}
            label="Workout reminders"
            sub="Weekdays · 6:00 PM"
            right={
              <ToggleSwitch
                value={workoutReminders}
                onValueChange={setWorkoutReminders}
                accessibilityLabel="Workout reminders"
              />
            }
          />
          <SettingsRow
            icon="play-outline"
            iconColor={theme.colors.info}
            iconBg={theme.colors.infoLight}
            label="Auto-start rest timer"
            right={
              <ToggleSwitch
                value={autoStartRest}
                onValueChange={setAutoStartRest}
                accessibilityLabel="Auto-start rest timer"
              />
            }
          />
        </SettingsSection>

        {/* Sound & haptics */}
        <SettingsSection label="Sound & haptics">
          <SettingsRow
            icon="volume-medium-outline"
            iconColor={theme.colors.accent}
            iconBg={theme.colors.accentLight}
            label="Sound effects"
            right={
              <ToggleSwitch
                value={soundEffects}
                onValueChange={setSoundEffects}
                accessibilityLabel="Sound effects"
              />
            }
          />
          <SettingsRow
            icon="phone-portrait-outline"
            iconColor={theme.colors.success}
            iconBg={theme.colors.successLight}
            label="Haptic feedback"
            right={
              <ToggleSwitch
                value={hapticFeedback}
                onValueChange={setHapticFeedback}
                accessibilityLabel="Haptic feedback"
              />
            }
          />
        </SettingsSection>

        {/* Data */}
        <SettingsSection label="Data">
          <SettingsRow
            icon="download-outline"
            iconColor={theme.colors.primary}
            iconBg={theme.colors.primaryLight}
            label="Export data (JSON)"
            sub="Share your programs"
            right={<ValueChevron />}
            onPress={handleExport}
          />
          <SettingsRow
            icon="qr-code-outline"
            iconColor={theme.colors.info}
            iconBg={theme.colors.infoLight}
            label="Import / Scan QR"
            right={<ValueChevron />}
            onPress={handleImport}
          />
        </SettingsSection>

        {/* Account */}
        <SettingsSection label="Account">
          <SettingsRow
            icon="person-circle-outline"
            iconColor={theme.colors.accent}
            iconBg={theme.colors.accentLight}
            label="Manage account"
            right={<ValueChevron />}
            onPress={() =>
              isAnonymous
                ? setUpgradeOpen(true)
                : showAlert(
                    'Manage account',
                    'Account management is coming soon.'
                  )
            }
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection label="About">
          <SettingsRow
            icon="information-circle-outline"
            iconColor={theme.colors.info}
            iconBg={theme.colors.infoLight}
            label="Version"
            right={<ValueChevron value={appVersion} hideChevron />}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            iconColor={theme.colors.success}
            iconBg={theme.colors.successLight}
            label="Privacy & terms"
            right={<ValueChevron />}
            onPress={() => showAlert('Privacy & terms', 'Coming soon.')}
          />
          <SettingsRow
            icon="star-outline"
            iconColor={theme.colors.accent}
            iconBg={theme.colors.accentLight}
            label="Rate PWO"
            right={<ValueChevron />}
            onPress={() => showAlert('Rate PWO', 'Thanks for your support!')}
          />
        </SettingsSection>

        {/* Sign out */}
        <Pressable
          onPress={confirmSignOut}
          disabled={loggingOut}
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.signOutButtonPressed
          ]}
          accessibilityRole="button"
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color={theme.colors.danger}
          />
          <Text style={styles.signOutText}>
            {loggingOut ? 'Logging out...' : 'Sign out'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Guest upgrade modal */}
      <Modal
        visible={upgradeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setUpgradeOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setUpgradeOpen(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={e => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Create your account</Text>
            <Text style={styles.modalSubtitle}>
              Back up & sync your data across devices.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={theme.colors.muted}
              value={upgradeEmail}
              onChangeText={setUpgradeEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              placeholderTextColor={theme.colors.muted}
              value={upgradePassword}
              onChangeText={setUpgradePassword}
              secureTextEntry
            />
            {upgradeError && (
              <Text style={styles.modalError}>{upgradeError}</Text>
            )}
            <Button
              label={upgradeBusy ? 'Creating...' : 'Create account'}
              variant="primary"
              size="lg"
              onPress={handleUpgrade}
              disabled={upgradeBusy}
              fullWidth
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

function SettingsSection({
  label,
  children
}: {
  label: string
  children: ReactNode
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children]
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.card}>
        {items.map((child, i) => (
          <Fragment key={i}>
            {i > 0 && <View style={styles.divider} />}
            {child}
          </Fragment>
        ))}
      </View>
    </View>
  )
}

function SettingsRow({
  icon,
  iconColor,
  iconBg,
  label,
  sub,
  right,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  iconBg: string
  label: string
  sub?: string
  right?: ReactNode
  onPress?: () => void
}) {
  const content = (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {right}
    </View>
  )

  if (!onPress) return content

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && styles.rowPressed}
      accessibilityRole="button"
    >
      {content}
    </Pressable>
  )
}

function ValueChevron({
  value,
  hideChevron = false
}: {
  value?: string
  hideChevron?: boolean
}) {
  return (
    <View style={styles.rowRight}>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {!hideChevron && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.muted}
        />
      )}
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
    paddingBottom: theme.spacing.xxl * 2,
    gap: theme.spacing.lg
  },
  accountHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.session.activeBorder,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontFamily: theme.fonts.display,
    fontSize: 18,
    color: theme.colors.primary
  },
  accountInfo: {
    flex: 1,
    gap: 2
  },
  accountName: {
    fontFamily: theme.fonts.display,
    fontSize: 17,
    color: theme.colors.text
  },
  accountEmail: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.infoLight,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    marginTop: theme.spacing.xs
  },
  syncDot: {
    color: theme.colors.info,
    fontSize: 8
  },
  syncText: {
    ...theme.typography.small,
    color: theme.colors.info,
    fontFamily: theme.fonts.semiBold
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.session.activeBorder,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg
  },
  upgradeIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center'
  },
  upgradeText: {
    flex: 1,
    gap: 2
  },
  upgradeTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  upgradeSub: {
    ...theme.typography.caption,
    color: theme.colors.subtext
  },
  upgradeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm
  },
  upgradeButtonText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primaryTextOn
  },
  section: {
    gap: theme.spacing.sm
  },
  sectionLabel: {
    ...theme.typography.small,
    color: theme.colors.session.faint,
    fontFamily: theme.fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginLeft: theme.spacing.xs
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 56
  },
  rowPressed: {
    backgroundColor: theme.colors.surfaceElevated
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowText: {
    flex: 1,
    gap: 1
  },
  rowLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text
  },
  rowSub: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs
  },
  rowValue: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.subtext
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.lg + 32 + theme.spacing.md
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm
  },
  signOutButtonPressed: {
    opacity: 0.6
  },
  signOutText: {
    ...theme.typography.bodyBold,
    color: theme.colors.danger
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: theme.spacing.xl
  },
  modalCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    gap: theme.spacing.md
  },
  modalTitle: {
    ...theme.typography.h1,
    color: theme.colors.text
  },
  modalSubtitle: {
    ...theme.typography.body,
    color: theme.colors.subtext
  },
  input: {
    ...theme.presets.input
  },
  modalError: {
    ...theme.typography.caption,
    color: theme.colors.danger
  }
})
