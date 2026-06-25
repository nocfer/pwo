/**
 * StatTile — a single metric: big Space Grotesk numeral over a label.
 * Tones: panel (neutral) · accent (lime value on a lime tint). Drop it in a
 * row with `flex: 1` siblings for the two-up stat grids in the mocks.
 */

import { theme } from '@/theme/theme'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'

export type StatTileTone = 'panel' | 'accent'

type Props = {
  value: string | number
  label: string
  tone?: StatTileTone
  style?: ViewStyle
}

export default function StatTile({
  value,
  label,
  tone = 'panel',
  style
}: Props) {
  const isAccent = tone === 'accent'
  return (
    <View
      style={[styles.tile, isAccent ? styles.tileAccent : styles.tilePanel, style]}
      accessibilityRole="text"
      accessibilityLabel={`${value} ${label}`}
    >
      <Text style={[styles.value, isAccent && styles.valueAccent]}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg
  },
  tilePanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border
  },
  tileAccent: {
    backgroundColor: theme.colors.primaryTint,
    borderColor: theme.colors.borderActive
  },
  value: {
    ...theme.typography.h1,
    color: theme.colors.text,
    fontVariant: ['tabular-nums']
  },
  valueAccent: {
    color: theme.colors.primary
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: 2
  }
})
