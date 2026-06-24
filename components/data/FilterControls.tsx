/**
 * FilterControls - Provides filtering and sorting controls for data lists
 */

import { formatCategoryLabel } from '@/lib/utils'
import { theme } from '@/theme/theme'
import type { DataType, ExerciseCategory, SearchState } from '@/types'
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
  dataType: DataType
  filters: SearchState['filters']
  sortBy: SearchState['sortBy']
  sortOrder: SearchState['sortOrder']
  onFiltersChange: (filters: SearchState['filters']) => void
  onSortChange: (
    sortBy: SearchState['sortBy'],
    sortOrder: SearchState['sortOrder']
  ) => void
  style?: ViewStyle
}

const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  'strength',
  'cardio',
  'flexibility',
  'skill'
]

const SOURCE_OPTIONS = [
  { key: 'builtin' as const, label: 'Built-in' },
  { key: 'user' as const, label: 'Custom' }
]

const SORT_OPTIONS = [
  { key: 'name' as const, label: 'Name', icon: 'text-outline' as const },
  { key: 'created' as const, label: 'Newest', icon: 'time-outline' as const },
  {
    key: 'updated' as const,
    label: 'Updated',
    icon: 'refresh-outline' as const
  }
]

export function FilterControls({
  dataType,
  filters,
  sortBy,
  sortOrder,
  onFiltersChange,
  onSortChange,
  style
}: Props) {
  const handleCategoryToggle = (category: ExerciseCategory) => {
    const currentCategories = filters.category || []
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category]

    onFiltersChange({
      ...filters,
      category: newCategories.length > 0 ? newCategories : undefined
    })
  }

  const handleSourceToggle = (source: 'builtin' | 'user' | 'pt') => {
    const currentSources = filters.source || []
    const newSources = currentSources.includes(source)
      ? currentSources.filter(s => s !== source)
      : [...currentSources, source]

    onFiltersChange({
      ...filters,
      source: newSources.length > 0 ? newSources : undefined
    })
  }

  const handleSortChange = (newSortBy: SearchState['sortBy']) => {
    if (newSortBy === sortBy) {
      onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(newSortBy, 'asc')
    }
  }

  const clearAllFilters = () => {
    onFiltersChange({})
    onSortChange('name', 'asc')
  }

  const hasCategoryFilter = Boolean(
    filters.category && filters.category.length > 0
  )

  const hasActiveFilters =
    hasCategoryFilter ||
    (filters.source && filters.source.length > 0) ||
    sortBy !== 'name'

  return (
    <View style={[styles.container, style]}>
      {/* Sort */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Sort by</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContainer}
        >
          {SORT_OPTIONS.map(option => {
            const isActive = sortBy === option.key
            return (
              <Pressable
                key={option.key}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => handleSortChange(option.key)}
              >
                <Ionicons
                  name={option.icon}
                  size={14}
                  color={
                    isActive
                      ? theme.colors.primaryTextOn
                      : theme.colors.subtext
                  }
                />
                <Text
                  style={[styles.pillText, isActive && styles.pillTextActive]}
                >
                  {option.label}
                </Text>
                {isActive && (
                  <Ionicons
                    name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color={theme.colors.primaryTextOn}
                  />
                )}
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      {/* Category (exercises only) */}
      {dataType === 'exercises' && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContainer}
          >
            <Pressable
              key="all"
              style={[styles.pill, !hasCategoryFilter && styles.pillActive]}
              onPress={() => onFiltersChange({ ...filters, category: undefined })}
            >
              <Text
                style={[
                  styles.pillText,
                  !hasCategoryFilter && styles.pillTextActive
                ]}
              >
                All
              </Text>
            </Pressable>
            {EXERCISE_CATEGORIES.map(category => {
              const isSelected = filters.category?.includes(category) || false
              return (
                <Pressable
                  key={category}
                  style={[styles.pill, isSelected && styles.pillActive]}
                  onPress={() => handleCategoryToggle(category)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      isSelected && styles.pillTextActive
                    ]}
                  >
                    {formatCategoryLabel(category)}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>
      )}

      {/* Source */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Source</Text>
        <View style={styles.pillsRow}>
          {SOURCE_OPTIONS.map(option => {
            const isSelected = filters.source?.includes(option.key) || false
            return (
              <Pressable
                key={option.key}
                style={[styles.pill, isSelected && styles.pillActive]}
                onPress={() => handleSourceToggle(option.key)}
              >
                <Text
                  style={[styles.pillText, isSelected && styles.pillTextActive]}
                >
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Clear */}
      {hasActiveFilters && (
        <Pressable style={styles.clearButton} onPress={clearAllFilters}>
          <Ionicons
            name="close-circle-outline"
            size={16}
            color={theme.colors.primary}
          />
          <Text style={styles.clearButtonText}>Clear filters</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md
  },
  section: {
    gap: theme.spacing.sm
  },
  sectionLabel: {
    ...theme.typography.small,
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: theme.spacing.xs
  },
  pillsContainer: {
    gap: theme.spacing.sm
  },
  pillsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inset
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  pillText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.subtext
  },
  pillTextActive: {
    color: theme.colors.primaryTextOn
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.xs
  },
  clearButtonText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary
  }
})

export default FilterControls
