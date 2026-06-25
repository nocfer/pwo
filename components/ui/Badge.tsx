/**
 * Badge — tiny uppercase, tracked label for provenance / status.
 *
 * Tones: custom (lime on tint) · coach (cyan) · builtin (muted, with a lock
 * glyph) · pr (dark on lime) · new (dark on lime — e.g. "2 NEW"). Non-interactive
 * by design; purely informational.
 */

import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet, Text, View } from 'react-native'

export type BadgeTone = 'custom' | 'coach' | 'builtin' | 'pr' | 'new'

type Props = {
  label: string
  tone?: BadgeTone
}

const TONE: Record<BadgeTone, { bg: string; fg: string }> = {
  custom: { bg: theme.colors.primaryTint, fg: theme.colors.primary },
  coach: { bg: theme.colors.category.cardioBg, fg: theme.colors.info },
  builtin: { bg: theme.colors.disabledBg, fg: theme.colors.subtext },
  pr: { bg: theme.colors.primary, fg: theme.colors.primaryTextOn },
  new: { bg: theme.colors.primary, fg: theme.colors.primaryTextOn }
}

export default function Badge({ label, tone = 'custom' }: Props) {
  const palette = TONE[tone]
  return (
    <View
      style={[styles.badge, { backgroundColor: palette.bg }]}
      accessibilityRole="text"
    >
      {tone === 'builtin' && (
        <Ionicons
          name="lock-closed"
          size={9}
          color={palette.fg}
          style={styles.lock}
        />
      )}
      <Text style={[styles.label, { color: palette.fg }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm
  },
  lock: {
    marginRight: theme.spacing.xs
  },
  label: {
    ...theme.typography.sectionLabel,
    fontFamily: theme.fonts.bold
  }
})
