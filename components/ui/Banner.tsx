/**
 * Banner — slim full-width status strip.
 * Tones: offline (amber on near-black) · info (cyan) · success (green). Optional
 * leading dot + icon. Presentational — wrap it in an animated container if you
 * want it to slide in/out (see OfflineBanner).
 */

import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ReactNode } from 'react'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import { Dot } from '../common/Dot'

export type BannerTone = 'offline' | 'info' | 'success'

type Props = {
  message: string
  tone?: BannerTone
  icon?: keyof typeof Ionicons.glyphMap
  showDot?: boolean
  children?: ReactNode
  style?: ViewStyle
}

const TONE: Record<BannerTone, { bg: string; border: string; fg: string }> = {
  offline: {
    bg: theme.colors.offlineBg,
    border: theme.colors.offlineBorder,
    fg: theme.colors.warning
  },
  info: {
    bg: theme.colors.infoLight,
    border: theme.colors.border,
    fg: theme.colors.info
  },
  success: {
    bg: theme.colors.successLight,
    border: theme.colors.border,
    fg: theme.colors.success
  }
}

export default function Banner({
  message,
  tone = 'info',
  icon,
  showDot = false,
  children,
  style
}: Props) {
  const palette = TONE[tone]
  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: palette.bg, borderBottomColor: palette.border },
        style
      ]}
      accessibilityRole="alert"
    >
      {showDot && <Dot color={palette.fg} size={7} />}
      {icon && <Ionicons name={icon} size={14} color={palette.fg} />}
      <Text style={[styles.text, { color: palette.fg }]} numberOfLines={1}>
        {message}
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm
  },
  text: {
    ...theme.typography.caption,
    flex: 1
  }
})
