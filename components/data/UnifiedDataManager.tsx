/**
 * UnifiedDataManager - Central component for managing exercises and programs
 */

import { useDataContext, usePendingIds } from '@/context/DataContext'
import { canSafelyDelete } from '@/lib/dependencyChecker'
import { haptics } from '@/lib/haptics'
import { showError } from '@/lib/toast'
import { theme } from '@/theme/theme'
import type { DataType, Exercise, Program, SearchState } from '@/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native'
import { DependencyErrorModal } from '../common/DependencyErrorModal'
import { SearchInput } from '../common/SearchInput'
import { UndoToast } from '../common/UndoToast'
import { DataList } from './DataList'
import { FilterControls } from './FilterControls'

type Props = {
  initialTab?: DataType
  searchQuery?: string
  style?: ViewStyle
  onActiveTabChange?: (tab: DataType) => void
}

export function UnifiedDataManager({
  initialTab = 'programs',
  searchQuery = '',
  style,
  onActiveTabChange
}: Props) {
  const { state, actions } = useDataContext()
  const pendingIds = usePendingIds()
  const [activeTab, setActiveTab] = useState<DataType>(initialTab)
  const [searchState, setSearchState] = useState<SearchState>({
    query: searchQuery,
    filters: {},
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Dependency-block state — blocked deletes still use a modal (not undoable)
  const [dependencyErrorVisible, setDependencyErrorVisible] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    id: string
    name: string
    type: DataType
  } | null>(null)
  const [dependentPrograms, setDependentPrograms] = useState<Program[]>([])

  const [bulkDependencyErrorVisible, setBulkDependencyErrorVisible] =
    useState(false)
  const [blockedItems, setBlockedItems] = useState<
    { id: string; name: string; programs: Program[] }[]
  >([])

  // Undo-toast delete state — the reversible path. The item(s) are hidden
  // optimistically and committed when the toast's countdown completes; Undo
  // simply clears this (the delete was never sent).
  type PendingDelete = {
    ids: string[]
    type: DataType
    label: string
    subLabel?: string
  }
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const pendingDeleteRef = useRef<PendingDelete | null>(null)
  pendingDeleteRef.current = pendingDelete

  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'exercises':
        return state.exercises
      case 'programs':
        return state.programs
      default:
        return []
    }
  }, [activeTab, state.exercises, state.programs])

  // Hide items with a pending undoable delete from the visible list.
  const visibleData = useMemo(() => {
    if (!pendingDelete || pendingDelete.type !== activeTab) return currentData
    const hidden = new Set(pendingDelete.ids)
    return currentData.filter(item => !hidden.has(item.id))
  }, [currentData, pendingDelete, activeTab])

  // Send the actual delete(s). Errors surface a toast; the optimistic hide is
  // reconciled by the delete actions (re-fetch / offline queue).
  const commitDelete = useCallback(
    async (pd: PendingDelete) => {
      try {
        await Promise.all(
          pd.ids.map(id =>
            pd.type === 'exercises'
              ? actions.deleteExercise(id)
              : actions.deleteProgram(id)
          )
        )
        await haptics.deleteItem()
      } catch (error: any) {
        await haptics.formValidationError()
        showError('Failed to delete', error.message)
      }
    },
    [actions]
  )
  const commitDeleteRef = useRef(commitDelete)
  commitDeleteRef.current = commitDelete

  // Start an undoable delete. One toast at a time — commit any in-flight one.
  const beginUndoableDelete = useCallback(
    async (pd: PendingDelete) => {
      if (pendingDeleteRef.current) commitDelete(pendingDeleteRef.current)
      setPendingDelete(pd)
      await haptics.skipAction()
    },
    [commitDelete]
  )

  const handleToastComplete = useCallback(() => {
    const pd = pendingDeleteRef.current
    if (pd) commitDelete(pd)
    setPendingDelete(null)
  }, [commitDelete])

  const handleToastUndo = useCallback(() => {
    haptics.buttonTap()
    setPendingDelete(null)
  }, [])

  // Commit any pending delete when navigating away (component unmount).
  useEffect(
    () => () => {
      if (pendingDeleteRef.current)
        commitDeleteRef.current(pendingDeleteRef.current)
    },
    []
  )

  const handleTabChange = useCallback(
    (tab: DataType) => {
      haptics.dataTabSwitch()
      setActiveTab(tab)
      setSelectedItems([])
      setShowFilters(false)
      onActiveTabChange?.(tab)
    },
    [onActiveTabChange]
  )

  const renderTabButton = useCallback(
    (tab: DataType, label: string, count: number) => {
      const isActive = activeTab === tab
      return (
        <TouchableOpacity
          key={tab}
          style={[styles.tabButton, isActive && styles.tabButtonActive]}
          onPress={() => handleTabChange(tab)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabButtonText,
              isActive && styles.tabButtonTextActive
            ]}
          >
            {label} <Text style={styles.tabButtonCount}>{count}</Text>
          </Text>
        </TouchableOpacity>
      )
    },
    [activeTab, handleTabChange]
  )

  const handleSearchChange = (query: string) => {
    if (query !== searchState.query) {
      haptics.searchFilter()
    }
    setSearchState(prev => ({ ...prev, query }))
  }

  const handleFilterChange = (filters: SearchState['filters']) => {
    haptics.searchFilter()
    setSearchState(prev => ({ ...prev, filters }))
  }

  const handleSortChange = (
    sortBy: SearchState['sortBy'],
    sortOrder: SearchState['sortOrder']
  ) => {
    haptics.sortChange()
    setSearchState(prev => ({ ...prev, sortBy, sortOrder }))
  }

  const handleSelectionChange = (itemIds: string[]) => {
    if (itemIds.length > selectedItems.length) {
      if (itemIds.length > 1 && selectedItems.length === 0) {
        haptics.bulkSelection()
      } else {
        haptics.itemSelection()
      }
    } else if (itemIds.length < selectedItems.length) {
      haptics.itemSelection()
    }
    setSelectedItems(itemIds)
  }

  const handleClearSelection = () => {
    haptics.clearSelection()
    setSelectedItems([])
  }

  const handleToggleFilters = () => {
    haptics.buttonTap()
    setShowFilters(!showFilters)
  }

  const handleItemPress = (item: { id: string }) => {
    haptics.itemSelection()
    switch (activeTab) {
      case 'exercises':
        router.push(`/library/exercises/${item.id}/edit`)
        break
      case 'programs':
        router.push(`/programs/${item.id}`)
        break
    }
  }

  const handleItemEdit = (item: { id: string }) => {
    haptics.itemSelection()
    switch (activeTab) {
      case 'exercises':
        router.push(`/library/exercises/${item.id}/edit`)
        break
      case 'programs':
        router.push(`/library/programs/${item.id}/edit`)
        break
    }
  }

  // Contextual empty-state actions (mirror the Library header buttons).
  const handleCreateNew = useCallback(() => {
    haptics.buttonTap()
    router.navigate(
      activeTab === 'exercises'
        ? '/library/exercises/new'
        : '/library/programs/new'
    )
  }, [activeTab])

  const handleScanQR = useCallback(() => {
    haptics.buttonTap()
    router.navigate('/library/scan')
  }, [])

  const handleDeletePress = useCallback(
    async (item: Exercise | Program) => {
      // Check if built-in
      if (item.source === 'builtin') {
        showError('Built-in items cannot be deleted')
        await haptics.formValidationError()
        return
      }

      // Check dependencies
      const check = canSafelyDelete(
        activeTab,
        item.id,
        state.exercises,
        state.programs
      )

      if (!check.canDelete) {
        // Blocked by dependencies — not reversible, keep the explanatory modal.
        setItemToDelete({ id: item.id, name: item.name, type: activeTab })
        setDependentPrograms(check.dependencies.programs || [])
        setDependencyErrorVisible(true)
        await haptics.formValidationError()
      } else {
        // Safely deletable — optimistic remove + undo toast.
        beginUndoableDelete({
          ids: [item.id],
          type: activeTab,
          label: `Deleted "${item.name}"`,
          subLabel: 'Tap undo to restore'
        })
      }
    },
    [activeTab, state.exercises, state.programs, beginUndoableDelete]
  )

  const handleDismissDependencyError = useCallback(() => {
    setDependencyErrorVisible(false)
    setItemToDelete(null)
    setDependentPrograms([])
  }, [])

  // Bulk delete handlers
  const handleBulkDeletePress = useCallback(async () => {
    if (selectedItems.length === 0) return

    // For exercises, check dependencies
    if (activeTab === 'exercises') {
      const blocked: { id: string; name: string; programs: Program[] }[] = []

      selectedItems.forEach(itemId => {
        const check = canSafelyDelete(
          activeTab,
          itemId,
          state.exercises,
          state.programs
        )
        if (!check.canDelete) {
          const item = state.exercises.find(e => e.id === itemId)
          if (item) {
            blocked.push({
              id: itemId,
              name: item.name,
              programs: check.dependencies.programs || []
            })
          }
        }
      })

      if (blocked.length > 0) {
        setBlockedItems(blocked)
        setBulkDependencyErrorVisible(true)
        await haptics.formValidationError()
        return
      }
    }

    // Safely deletable — optimistic remove + undo toast for the whole set.
    const count = selectedItems.length
    const noun = count === 1 ? activeTab.slice(0, -1) : activeTab
    beginUndoableDelete({
      ids: [...selectedItems],
      type: activeTab,
      label: `Deleted ${count} ${noun}`,
      subLabel: 'Tap undo to restore'
    })
    setSelectedItems([])
  }, [selectedItems, activeTab, state.exercises, state.programs, beginUndoableDelete])

  const handleDismissBulkDependencyError = useCallback(() => {
    setBulkDependencyErrorVisible(false)
    // Keep blocked items selected so user can see which ones couldn't be deleted
    const blockedIds = blockedItems.map(item => item.id)
    setSelectedItems(blockedIds)
    setBlockedItems([])
  }, [blockedItems])

  const isLoading =
    (activeTab === 'exercises' && state.exercisesLoading) ||
    (activeTab !== 'exercises' && state.programsLoading)

  const hasActiveFilters =
    (searchState.filters.category && searchState.filters.category.length > 0) ||
    (searchState.filters.source && searchState.filters.source.length > 0)

  return (
    <View style={[styles.container, style]}>
      {/* Segmented control */}
      <View style={styles.tabContainer}>
        {renderTabButton('programs', 'Programs', state.programs.length)}
        {renderTabButton(
          'exercises',
          'Exercises',
          state.exercisePagination.totalItems
        )}
      </View>

      {/* Search and Filters */}
      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <SearchInput
            value={searchState.query}
            onChangeText={handleSearchChange}
            placeholder={`Search ${activeTab}...`}
            style={styles.searchInput}
          />
          <Pressable
            style={({ pressed }) => [
              styles.filterButton,
              (showFilters || hasActiveFilters) && styles.filterButtonActive,
              pressed && styles.filterButtonPressed
            ]}
            onPress={handleToggleFilters}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={
                showFilters || hasActiveFilters
                  ? theme.colors.primary
                  : theme.colors.subtext
              }
            />
            {hasActiveFilters && !showFilters && (
              <View style={styles.filterDot} />
            )}
          </Pressable>
        </View>

        {showFilters && (
          <FilterControls
            dataType={activeTab}
            filters={searchState.filters}
            sortBy={searchState.sortBy}
            sortOrder={searchState.sortOrder}
            onFiltersChange={handleFilterChange}
            onSortChange={handleSortChange}
            style={styles.filterControls}
          />
        )}
      </View>

      {/* Selection Bar */}
      {selectedItems.length > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            {selectedItems.length} selected
          </Text>
          <Pressable
            style={styles.clearSelectionButton}
            onPress={handleClearSelection}
          >
            <Text style={styles.clearSelectionText}>Clear</Text>
          </Pressable>
        </View>
      )}

      {/* Data List */}
      <DataList
        dataType={activeTab}
        data={visibleData}
        searchState={searchState}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onItemPress={handleItemPress}
        onItemEdit={handleItemEdit}
        onItemDelete={handleDeletePress}
        showInlineActions={activeTab === 'programs'}
        isLoading={isLoading}
        emptyActionLabel={
          activeTab === 'exercises' ? 'Create an exercise' : 'Create a program'
        }
        onEmptyAction={handleCreateNew}
        emptySecondaryActionLabel={
          activeTab === 'programs' ? 'Scan a QR code' : undefined
        }
        onEmptySecondaryAction={
          activeTab === 'programs' ? handleScanQR : undefined
        }
        pendingIds={pendingIds}
        onEndReached={
          activeTab === 'exercises' ? actions.loadMoreExercises : undefined
        }
        hasMore={
          activeTab === 'exercises' ? state.exercisePagination.hasMore : false
        }
        loadingMore={
          activeTab === 'exercises' ? state.exercisesLoadingMore : false
        }
        style={styles.dataList}
      />

      {/* Bulk Delete Toolbar */}
      {selectedItems.length > 0 && (
        <View style={styles.bulkToolbar}>
          <Text style={styles.bulkToolbarText}>
            {selectedItems.length} selected
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.bulkDeleteButton,
              pressed && styles.bulkDeleteButtonPressed
            ]}
            onPress={handleBulkDeletePress}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={theme.colors.danger}
            />
            <Text style={styles.bulkDeleteButtonText}>Delete</Text>
          </Pressable>
        </View>
      )}

      {/* Dependency Error Modal */}
      <DependencyErrorModal
        visible={dependencyErrorVisible}
        itemName={itemToDelete?.name || ''}
        itemType={itemToDelete?.type === 'exercises' ? 'exercise' : 'program'}
        dependentPrograms={dependentPrograms}
        onDismiss={handleDismissDependencyError}
      />

      {/* Bulk Dependency Error Modal */}
      {bulkDependencyErrorVisible && (
        <Modal
          visible={bulkDependencyErrorVisible}
          transparent
          animationType="fade"
          onRequestClose={handleDismissBulkDependencyError}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.bulkErrorModal}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="alert-circle"
                  size={48}
                  color={theme.colors.danger}
                />
              </View>

              <Text style={styles.bulkErrorTitle}>
                Cannot Delete Some Items
              </Text>

              <Text style={styles.bulkErrorMessage}>
                {blockedItems.length} of {selectedItems.length} selected{' '}
                {activeTab} cannot be deleted because they are used by programs.
              </Text>

              <View style={styles.blockedItemsContainer}>
                <Text style={styles.blockedItemsTitle}>Blocked items:</Text>
                <ScrollView
                  style={styles.blockedItemsList}
                  showsVerticalScrollIndicator={false}
                >
                  {blockedItems.map(item => (
                    <View key={item.id} style={styles.blockedItem}>
                      <Text style={styles.blockedItemName}>{item.name}</Text>
                      <Text style={styles.blockedItemPrograms}>
                        Used by {item.programs.length} program
                        {item.programs.length === 1 ? '' : 's'}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.bulkErrorDismissButton,
                  pressed && styles.bulkErrorDismissButtonPressed
                ]}
                onPress={handleDismissBulkDependencyError}
              >
                <Text style={styles.bulkErrorDismissButtonText}>Got It</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Undo toast — reversible delete (single + bulk). The key restarts the
          countdown when a new delete supersedes an in-flight one. */}
      <UndoToast
        key={pendingDelete?.ids.join(',') ?? 'none'}
        visible={pendingDelete !== null}
        message={pendingDelete?.label ?? ''}
        subMessage={pendingDelete?.subLabel}
        onUndo={handleToastUndo}
        onComplete={handleToastComplete}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.inset,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary
  },
  tabButtonText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.subtext
  },
  tabButtonTextActive: {
    color: theme.colors.primaryTextOn,
    fontFamily: theme.fonts.bold
  },
  tabButtonCount: {
    opacity: 0.6
  },
  controls: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  searchInput: {
    flex: 1
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.borderActive
  },
  filterButtonPressed: {
    transform: [{ scale: 0.95 }]
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary
  },
  filterControls: {
    marginTop: theme.spacing.md
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primaryLight,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md
  },
  selectionText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary
  },
  clearSelectionButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  clearSelectionText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary
  },
  dataList: {
    flex: 1
  },
  bulkToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.inset,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceElevated
  },
  bulkToolbarText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  bulkDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.dangerTint,
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md
  },
  bulkDeleteButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }]
  },
  bulkDeleteButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.danger
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg
  },
  bulkErrorModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...theme.shadows.sm
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  bulkErrorTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md
  },
  bulkErrorMessage: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginBottom: theme.spacing.lg
  },
  blockedItemsContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    maxHeight: 200
  },
  blockedItemsTitle: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  blockedItemsList: {
    maxHeight: 150
  },
  blockedItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight
  },
  blockedItemName: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  blockedItemPrograms: {
    ...theme.typography.caption,
    color: theme.colors.subtext
  },
  bulkErrorDismissButton: {
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bulkErrorDismissButtonPressed: {
    backgroundColor: theme.colors.background,
    transform: [{ scale: 0.98 }]
  },
  bulkErrorDismissButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  }
})

export default UnifiedDataManager
