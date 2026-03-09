/**
 * SortControls - Provides sorting controls for data lists
 *
 * Allows users to sort by different criteria with ascending/descending order
 * Requirements: 1.5
 */

import { theme } from '@/theme/theme'
import type { SearchState } from '@/types/enhanced'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native'

type Props = {
  sortBy: SearchState['sortBy']
  sortOrder: SearchState['sortOrder']
  onSortChange: (
    sortBy: SearchState['sortBy'],
    sortOrder: SearchState['sortOrder']
  ) => void
  style?: ViewStyle
}

const SORT_OPTIONS = [
  {
    key: 'name' as const,
    label: 'Name',
    icon: 'text-outline' as keyof typeof Ionicons.glyphMap
  },
  {
    key: 'created' as const,
    label: 'Created',
    icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap
  },
  {
    key: 'updated' as const,
    label: 'Updated',
    icon: 'time-outline' as keyof typeof Ionicons.glyphMap
  },
  {
    key: 'usage' as const,
    label: 'Usage',
    icon: 'trending-up-outline' as keyof typeof Ionicons.glyphMap
  }
]

export function SortControls({
  sortBy,
  sortOrder,
  onSortChange,
  style
}: Props) {
  const handleSortChange = (newSortBy: SearchState['sortBy']) => {
    if (newSortBy === sortBy) {
      // Toggle sort order if same field
      onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Change sort field with default ascending order
      onSortChange(newSortBy, 'asc')
    }
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Sort by</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
      >
        {SORT_OPTIONS.map(option => {
          const isActive = sortBy === option.key
          return (
            <Pressable
              key={option.key}
              style={({ pressed }) => [
                styles.option,
                isActive && styles.optionActive,
                pressed && styles.optionPressed
              ]}
              onPress={() => handleSortChange(option.key)}
            >
              <Ionicons
                name={option.icon}
                size={16}
                color={isActive ? theme.colors.primary : theme.colors.muted}
                style={styles.optionIcon}
              />
              <Text
                style={[styles.optionText, isActive && styles.optionTextActive]}
              >
                {option.label}
              </Text>
              {isActive && (
                <Ionicons
                  name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={14}
                  color={theme.colors.primary}
                  style={styles.sortIcon}
                />
              )}
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg
  },
  title: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  optionsContainer: {
    gap: theme.spacing.sm
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minWidth: 80
  },
  optionActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary
  },
  optionPressed: {
    opacity: 0.7
  },
  optionIcon: {
    marginRight: theme.spacing.xs
  },
  optionText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 14
  },
  optionTextActive: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  },
  sortIcon: {
    marginLeft: theme.spacing.xs
  }
})

export default SortControls
