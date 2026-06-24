/**
 * SegmentedControl - small inline segmented control (e.g. [lb | kg]).
 * Active segment = lime fill with dark text; inactive = muted text.
 */

import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import { Pressable, StyleSheet, Text, View } from 'react-native'

type Option<T extends string> = {
  value: T
  label: string
}

type Props<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange
}: Props<T>) {
  return (
    <View style={styles.container}>
      {options.map(option => {
        const isActive = option.value === value
        return (
          <Pressable
            key={option.value}
            style={[styles.segment, isActive && styles.segmentActive]}
            onPress={() => {
              if (!isActive) {
                haptics.tabSwitch()
                onChange(option.value)
              }
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[styles.segmentText, isActive && styles.segmentTextActive]}
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
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    padding: 2
  },
  segment: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.xs,
    minWidth: 44,
    alignItems: 'center'
  },
  segmentActive: {
    backgroundColor: theme.colors.primary
  },
  segmentText: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    fontFamily: theme.fonts.semiBold
  },
  segmentTextActive: {
    color: theme.colors.primaryTextOn
  }
})
