/**
 * UnifiedDataManager - Central component for managing exercises and programs
 */

import { useDataContext } from '@/context/DataContext'
import { canSafelyDelete } from '@/lib/dependencyChecker'
import { haptics } from '@/lib/haptics'
import { showError, showSuccess } from '@/lib/toast'
import { theme } from '@/theme/theme'
import type { DataType, Exercise, Program, SearchState } from '@/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
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
import { ConfirmationModal } from '../common/ConfirmationModal'
import { DependencyErrorModal } from '../common/DependencyErrorModal'
import { SearchInput } from '../common/SearchInput'
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
  const [activeTab, setActiveTab] = useState<DataType>(initialTab)
  const [searchState, setSearchState] = useState<SearchState>({
    query: searchQuery,
    filters: {},
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Delete state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [dependencyErrorVisible, setDependencyErrorVisible] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    id: string
    name: string
    type: DataType
  } | null>(null)
  const [dependentPrograms, setDependentPrograms] = useState<Program[]>([])
  const [deleting, setDeleting] = useState(false)

  // Bulk delete state
  const [bulkDeleteModalVisible, setBulkDeleteModalVisible] = useState(false)
  const [bulkDependencyErrorVisible, setBulkDependencyErrorVisible] =
    useState(false)
  const [blockedItems, setBlockedItems] = useState<
    { id: string; name: string; programs: Program[] }[]
  >([])
  const [bulkDeleting, setBulkDeleting] = useState(false)

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
        setItemToDelete({ id: item.id, name: item.name, type: activeTab })
        setDependentPrograms(check.dependencies.programs || [])
        setDependencyErrorVisible(true)
        await haptics.formValidationError()
      } else {
        setItemToDelete({ id: item.id, name: item.name, type: activeTab })
        setDeleteModalVisible(true)
        await haptics.skipAction()
      }
    },
    [activeTab, state.exercises, state.programs]
  )

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return

    setDeleting(true)
    try {
      if (itemToDelete.type === 'exercises') {
        await actions.deleteExercise(itemToDelete.id)
      } else {
        await actions.deleteProgram(itemToDelete.id)
      }

      await haptics.deleteItem()
      showSuccess(`${itemToDelete.name} deleted`)
      setDeleteModalVisible(false)
      setItemToDelete(null)
    } catch (error: any) {
      await haptics.formValidationError()
      showError('Failed to delete item', error.message)
    } finally {
      setDeleting(false)
    }
  }, [itemToDelete, actions])

  const handleCancelDelete = useCallback(() => {
    setDeleteModalVisible(false)
    setItemToDelete(null)
  }, [])

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

    // Show confirmation for items that can be deleted
    setBulkDeleteModalVisible(true)
    await haptics.skipAction()
  }, [selectedItems, activeTab, state.exercises, state.programs])

  const handleConfirmBulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) return

    setBulkDeleting(true)
    try {
      const deletePromises = selectedItems.map(itemId => {
        if (activeTab === 'exercises') {
          return actions.deleteExercise(itemId)
        } else {
          return actions.deleteProgram(itemId)
        }
      })

      await Promise.all(deletePromises)

      await haptics.bulkDelete()
      showSuccess(`${selectedItems.length} items deleted`)
      setBulkDeleteModalVisible(false)
      setSelectedItems([])
    } catch (error: any) {
      await haptics.formValidationError()
      showError('Failed to delete items', error.message)
    } finally {
      setBulkDeleting(false)
    }
  }, [selectedItems, activeTab, actions])

  const handleCancelBulkDelete = useCallback(() => {
    setBulkDeleteModalVisible(false)
  }, [])

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
        data={currentData}
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Item?"
        message="This action cannot be undone."
        itemName={itemToDelete?.name}
        itemType={itemToDelete?.type === 'exercises' ? 'exercise' : 'program'}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleting}
      />

      {/* Dependency Error Modal */}
      <DependencyErrorModal
        visible={dependencyErrorVisible}
        itemName={itemToDelete?.name || ''}
        itemType={itemToDelete?.type === 'exercises' ? 'exercise' : 'program'}
        dependentPrograms={dependentPrograms}
        onDismiss={handleDismissDependencyError}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        visible={bulkDeleteModalVisible}
        title="Delete Multiple Items?"
        message={`Are you sure you want to delete ${selectedItems.length} ${activeTab}? This action cannot be undone.`}
        confirmLabel="Delete All"
        onConfirm={handleConfirmBulkDelete}
        onCancel={handleCancelBulkDelete}
        loading={bulkDeleting}
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
