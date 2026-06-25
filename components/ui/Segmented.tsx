/**
 * Segmented — 2–3 mutually-exclusive options in an inset track.
 * Active segment = lime fill + dark text; inactive = subtext on the track.
 */

import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native'

type Option<T extends string> = {
  value: T
  label: string
}

type Props<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  style?: ViewStyle
}

export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  style
}: Props<T>) {
  return (
    <View style={[styles.container, style]} accessibilityRole="tablist">
      {options.map(option => {
        const isActive = option.value === value
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (!isActive) {
                haptics.tabSwitch()
                onChange(option.value)
              }
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={[styles.segment, isActive && styles.segmentActive]}
          >
            <Text
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.inset,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 3,
    gap: 3
  },
  segment: {
    flex: 1,
    minHeight: 40,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm
  },
  segmentActive: {
    backgroundColor: theme.colors.primary
  },
  label: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.subtext
  },
  labelActive: {
    color: theme.colors.primaryTextOn
  }
})
