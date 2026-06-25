/**
 * SearchableList - Enhanced list component with metadata display and search capabilities
 */

import {
  formatCategoryLabel,
  getCategoryColors,
  getSourceBadge
} from '@/lib/utils'
import { theme } from '@/theme/theme'
import type { Program } from '@/types'
import type { DataType } from '@/types/enhanced'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native'
import {
  EmptyState,
  LoadingScreen,
  SelectionCheckbox,
  SwipeableListItem
} from '../common'
import { SearchInput } from '../common/SearchInput'
import { ProgramListItem } from './ProgramListItem'

type ListItem = {
  id: string
  name: string
  description?: string
  source: 'builtin' | 'user' | 'pt'
  createdAt?: string
  updatedAt?: string
  category?: string
  icon?: string
  [key: string]: unknown
}

type Props = {
  data: ListItem[]
  dataType: DataType
  searchPlaceholder?: string
  onItemPress?: (item: ListItem) => void
  onItemEdit?: (item: ListItem) => void
  onItemLongPress?: (item: ListItem) => void
  onItemDelete?: (item: ListItem) => void
  selectedItems?: string[]
  onSelectionChange?: (itemIds: string[]) => void
  showSearch?: boolean
  showMetadata?: boolean
  showInlineActions?: boolean
  isLoading?: boolean
  error?: string
  emptyTitle?: string
  emptySubtitle?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
  emptySecondaryActionLabel?: string
  onEmptySecondaryAction?: () => void
  /** Entity ids with an unsynced offline write — render a pending dot */
  pendingIds?: Set<string>
  onEndReached?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  style?: ViewStyle
}

export function SearchableList({
  data,
  dataType,
  searchPlaceholder = 'Search...',
  onItemPress,
  onItemEdit,
  onItemLongPress,
  onItemDelete,
  selectedItems = [],
  onSelectionChange,
  showSearch = true,
  showMetadata = true,
  showInlineActions = false,
  isLoading = false,
  error,
  emptyTitle,
  emptySubtitle,
  emptyActionLabel,
  onEmptyAction,
  emptySecondaryActionLabel,
  onEmptySecondaryAction,
  pendingIds,
  onEndReached,
  hasMore = false,
  loadingMore = false,
  style
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const selectionMode = selectedItems.length > 0

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data

    const query = searchQuery.toLowerCase()
    return data.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query))
    )
  }, [data, searchQuery])

  const handleItemPress = (item: ListItem) => {
    if (selectionMode) {
      handleItemSelection(item.id)
    } else {
      onItemPress?.(item)
    }
  }

  const handleItemLongPress = (item: ListItem) => {
    if (!selectionMode) {
      // Start selection mode by selecting this item
      onSelectionChange?.([item.id])
    } else {
      onItemLongPress?.(item)
    }
  }

  const handleItemSelection = (itemId: string) => {
    const isSelected = selectedItems.includes(itemId)
    const newSelection = isSelected
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId]

    onSelectionChange?.(newSelection)
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    const isSelected = selectedItems.includes(item.id)
    const canDelete = item.source === 'user' && onItemDelete && !selectionMode
    const isPending = pendingIds?.has(item.id) ?? false

    // Use ProgramListItem for programs when inline actions are enabled
    if (
      showInlineActions &&
      (dataType === 'programs' || dataType === 'challenges')
    ) {
      const program: Program = {
        id: item.id,
        name: item.name,
        description: item.description || '',
        source: item.source,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        blocks: (item.blocks as Program['blocks']) || [],
        challengeConfig: item.challengeConfig as Program['challengeConfig']
      }

      const content = (
        <ProgramListItem
          program={program}
          onStart={() => onItemPress?.(item)}
          onEdit={() => onItemEdit?.(item)}
          onDelete={canDelete ? () => onItemDelete?.(item) : undefined}
          pending={isPending}
          selected={isSelected}
          onSelectionChange={
            selectionMode
              ? (selected: boolean) => {
                  const newSelection = selected
                    ? [...selectedItems, item.id]
                    : selectedItems.filter(id => id !== item.id)
                  onSelectionChange?.(newSelection)
                }
              : undefined
          }
          showMetadata={showMetadata}
          style={canDelete ? styles.itemNoMargin : undefined}
        />
      )

      if (canDelete) {
        return (
          <SwipeableListItem onDelete={() => onItemDelete(item)}>
            {content}
          </SwipeableListItem>
        )
      }

      return content
    }

    // Default exercise item rendering
    const catColors = getCategoryColors(item.category)
    const sourceBadge = getSourceBadge(item.source)
    const content = (
      <Pressable
        style={({ pressed }) => [
          styles.itemContainer,
          canDelete && styles.itemNoMargin,
          isSelected && styles.itemSelected,
          pressed && styles.itemPressed
        ]}
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleItemLongPress(item)}
      >
        <View style={[styles.itemIcon, { backgroundColor: catColors.bg }]}>
          <Ionicons
            name={
              (item.icon as keyof typeof Ionicons.glyphMap) || 'fitness-outline'
            }
            size={20}
            color={catColors.color}
          />
        </View>

        <View style={styles.itemContent}>
          <View style={styles.itemNameRow}>
            {isPending && <View style={styles.pendingDot} />}
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          {showMetadata && (
            <View style={styles.chipsRow}>
              {item.category && (
                <View style={[styles.chip, { backgroundColor: catColors.bg }]}>
                  <Text style={[styles.chipText, { color: catColors.color }]}>
                    {formatCategoryLabel(item.category)}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.chip,
                  { backgroundColor: sourceBadge.bg },
                  sourceBadge.border
                    ? { borderWidth: 1, borderColor: sourceBadge.border }
                    : null
                ]}
              >
                <Text style={[styles.chipText, { color: sourceBadge.color }]}>
                  {sourceBadge.label}
                </Text>
              </View>
            </View>
          )}
        </View>

        {selectionMode ? (
          <SelectionCheckbox checked={isSelected} />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.muted}
          />
        )}
      </Pressable>
    )

    if (canDelete) {
      return (
        <SwipeableListItem onDelete={() => onItemDelete(item)}>
          {content}
        </SwipeableListItem>
      )
    }

    return content
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error) {
    return (
      <EmptyState
        title="Error Loading Data"
        description={error}
        icon="alert-circle-outline"
        style={style}
      />
    )
  }

  return (
    <View style={[styles.container, style]}>
      {showSearch && (
        <View style={styles.searchContainer}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={searchPlaceholder}
          />
        </View>
      )}

      {filteredData.length === 0 ? (
        <EmptyState
          title={
            emptyTitle ||
            (searchQuery
              ? `No results for "${searchQuery}"`
              : `No ${dataType} yet`)
          }
          description={
            emptySubtitle ||
            (searchQuery
              ? 'Try a different search'
              : `Create your first ${dataType.slice(0, -1)}`)
          }
          icon={searchQuery ? 'search-outline' : 'add-circle-outline'}
          actionLabel={searchQuery ? undefined : emptyActionLabel}
          onAction={searchQuery ? undefined : onEmptyAction}
          secondaryActionLabel={
            searchQuery ? undefined : emptySecondaryActionLabel
          }
          onSecondaryAction={searchQuery ? undefined : onEmptySecondaryAction}
          style={styles.emptyState}
        />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore && hasMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
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
  searchContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md
  },
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2
  },
  emptyState: {
    flex: 1,
    marginTop: theme.spacing.xl
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm
  },
  itemSelected: {
    backgroundColor: theme.colors.primaryTint,
    borderColor: theme.colors.borderActive
  },
  itemPressed: {
    transform: [{ scale: 0.98 }]
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md
  },
  itemContent: {
    flex: 1,
    gap: 4
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.warning
  },
  itemName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flexShrink: 1
  },
  chipsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs
  },
  chip: {
    borderRadius: theme.radius.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2
  },
  chipText: {
    ...theme.typography.small,
    fontFamily: theme.fonts.semiBold
  },
  itemNoMargin: {
    marginBottom: 0
  },
  footerLoader: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center'
  }
})

export default SearchableList
