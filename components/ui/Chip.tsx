/**
 * Chip — filter / category pill.
 *
 * Selected (any tone) = lime fill + dark text. Unselected `neutral` = panel +
 * border + subtext. The category tones (strength / cardio / mobility / skill)
 * render as their colored tint bg + matching text when unselected.
 */

import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import { Pressable, StyleSheet, Text } from 'react-native'

export type ChipTone = 'neutral' | 'strength' | 'cardio' | 'mobility' | 'skill'

type Props = {
  label: string
  tone?: ChipTone
  selected?: boolean
  onPress?: () => void
  disabled?: boolean
}

const TONE: Record<ChipTone, { bg: string; fg: string }> = {
  neutral: { bg: theme.colors.surface, fg: theme.colors.subtext },
  strength: {
    bg: theme.colors.category.strengthBg,
    fg: theme.colors.category.strength
  },
  cardio: {
    bg: theme.colors.category.cardioBg,
    fg: theme.colors.category.cardio
  },
  mobility: {
    bg: theme.colors.category.flexibilityBg,
    fg: theme.colors.category.flexibility
  },
  skill: { bg: theme.colors.category.skillBg, fg: theme.colors.category.skill }
}

export default function Chip({
  label,
  tone = 'neutral',
  selected = false,
  onPress,
  disabled = false
}: Props) {
  const palette = TONE[tone]
  const bg = selected ? theme.colors.primary : palette.bg
  const fg = selected ? theme.colors.primaryTextOn : palette.fg
  const interactive = !!onPress && !disabled

  return (
    <Pressable
      onPress={
        interactive
          ? () => {
              haptics.itemSelection()
              onPress?.()
            }
          : undefined
      }
      disabled={!interactive}
      hitSlop={8}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: tone === 'neutral' && !selected ? theme.colors.border : bg
        },
        pressed && interactive && styles.pressed,
        disabled && styles.disabled
      ]}
    >
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 32,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.chip,
    borderWidth: 1
  },
  pressed: {
    opacity: 0.7
  },
  disabled: {
    opacity: 0.4
  },
  label: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold
  }
})
