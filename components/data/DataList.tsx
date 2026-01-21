/**
 * DataList - Displays a list of data items with search, selection, and metadata
 *
 * Supports exercises, programs, and challenges with consistent UI
 * Requirements: 1.4, 1.5
 */

import type { DataType, Exercise, Program, SearchState } from '@/types'
import { useMemo } from 'react'
import { ViewStyle } from 'react-native'
import { EmptyState } from '../common'
import { LoadingStateList } from './LoadingStateList'
import { SearchableList } from './SearchableList'

type DataItem = Exercise | Program

// Convert DataItem to ListItem format expected by SearchableList
type ListItem = {
  id: string
  name: string
  description?: string
  source: 'builtin' | 'user'
  createdAt?: string
  updatedAt?: string
  category?: string
  icon?: string
  [key: string]: any
}

type Props = {
  dataType: DataType
  data: DataItem[]
  searchState: SearchState
  selectedItems: string[]
  onSelectionChange: (itemIds: string[]) => void
  onItemPress?: (item: DataItem) => void
  onItemEdit?: (item: DataItem) => void
  onItemLongPress?: (item: DataItem) => void
  showInlineActions?: boolean
  isLoading?: boolean
  error?: string
  style?: ViewStyle
}

export function DataList({
  dataType,
  data,
  searchState,
  selectedItems,
  onSelectionChange,
  onItemPress,
  onItemEdit,
  onItemLongPress,
  showInlineActions = false,
  isLoading = false,
  error,
  style
}: Props) {
  // Filter and sort data based on search state
  const processedData = useMemo(() => {
    // Convert DataItem to ListItem format
    const convertToListItem = (item: DataItem): ListItem => {
      const baseItem: ListItem = {
        id: item.id,
        name: item.name,
        source: item.source,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }

      // Add type-specific fields
      if ('category' in item) {
        // Exercise
        baseItem.category = item.category
        baseItem.icon = item.icon
      } else {
        // Program
        if ('description' in item) {
          baseItem.description = item.description
        }
        // Add program-specific fields for ProgramListItem
        baseItem.blocks = (item as Program).blocks
        baseItem.challengeConfig = (item as Program).challengeConfig
      }

      return baseItem
    }

    // Convert and filter data
    let filtered = data.map(convertToListItem)

    // Apply text search
    if (searchState.query) {
      const query = searchState.query.toLowerCase()
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query))
      )
    }

    // Apply filters
    if (
      searchState.filters.category &&
      searchState.filters.category.length > 0
    ) {
      filtered = filtered.filter(
        item =>
          item.category &&
          searchState.filters.category!.includes(item.category as any)
      )
    }

    if (searchState.filters.source && searchState.filters.source.length > 0) {
      filtered = filtered.filter(item =>
        searchState.filters.source!.includes(item.source)
      )
    }

    if (searchState.filters.dateRange) {
      const { start, end } = searchState.filters.dateRange
      filtered = filtered.filter(item => {
        const itemDate = item.createdAt || item.updatedAt
        return itemDate && itemDate >= start && itemDate <= end
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any, bVal: any

      switch (searchState.sortBy) {
        case 'name':
          aVal = a.name
          bVal = b.name
          break
        case 'created':
          aVal = a.createdAt || ''
          bVal = b.createdAt || ''
          break
        case 'updated':
          aVal = a.updatedAt || ''
          bVal = b.updatedAt || ''
          break
        case 'usage':
          // For now, sort by name as usage stats aren't implemented
          aVal = a.name
          bVal = b.name
          break
        default:
          aVal = a.name
          bVal = b.name
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return searchState.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [data, searchState])

  const handleItemPress = (item: ListItem) => {
    // Find the original DataItem by ID
    const originalItem = data.find(d => d.id === item.id)
    if (originalItem) {
      onItemPress?.(originalItem)
    }
  }

  const handleItemEdit = (item: ListItem) => {
    // Find the original DataItem by ID
    const originalItem = data.find(d => d.id === item.id)
    if (originalItem) {
      onItemEdit?.(originalItem)
    }
  }

  const handleItemLongPress = (item: ListItem) => {
    // Find the original DataItem by ID
    const originalItem = data.find(d => d.id === item.id)
    if (originalItem) {
      onItemLongPress?.(originalItem)
    }
  }

  if (isLoading) {
    return <LoadingStateList style={style} />
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

  const emptyTitle = searchState.query
    ? `No ${dataType} found matching "${searchState.query}"`
    : `No ${dataType} available`

  const emptySubtitle = searchState.query
    ? 'Try adjusting your search or filters'
    : `Create your first ${dataType.slice(0, -1)}`

  // For programs with inline actions, use a different rendering approach
  if (
    showInlineActions &&
    (dataType === 'programs' || dataType === 'challenges')
  ) {
    return (
      <SearchableList
        data={processedData}
        dataType={dataType}
        searchPlaceholder={`Search ${dataType.toLowerCase()}...`}
        onItemPress={handleItemPress}
        onItemEdit={handleItemEdit}
        onItemLongPress={handleItemLongPress}
        selectedItems={selectedItems}
        onSelectionChange={onSelectionChange}
        showSearch={false} // Search is handled by parent component
        showMetadata={true}
        showInlineActions={true}
        isLoading={false} // Loading is handled above
        error={undefined} // Error is handled above
        emptyTitle={emptyTitle}
        emptySubtitle={emptySubtitle}
        style={style}
      />
    )
  }

  return (
    <SearchableList
      data={processedData}
      dataType={dataType}
      searchPlaceholder={`Search ${dataType.toLowerCase()}...`}
      onItemPress={handleItemPress}
      onItemLongPress={handleItemLongPress}
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      showSearch={false} // Search is handled by parent component
      showMetadata={true}
      isLoading={false} // Loading is handled above
      error={undefined} // Error is handled above
      emptyTitle={emptyTitle}
      emptySubtitle={emptySubtitle}
      style={style}
    />
  )
}

export default DataList
