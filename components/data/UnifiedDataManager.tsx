/**
 * UnifiedDataManager - Central component for managing exercises, programs, and challenges
 */

import { useDataContext } from "@/context/DataContext";
import { haptics } from "@/lib/haptics";
import { theme } from "@/theme/theme";
import type { DataType, SearchState } from "@/types/enhanced";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { SearchInput } from "../common/SearchInput";
import DataList from "./DataList";
import FilterControls from "./FilterControls";

type Props = {
  initialTab?: DataType;
  searchQuery?: string;
  style?: ViewStyle;
};

type TabInfo = {
  key: DataType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
};

const TABS: TabInfo[] = [
  {
    key: "exercises",
    label: "Exercises",
    icon: "fitness-outline",
    iconFocused: "fitness"
  },
  {
    key: "programs",
    label: "Programs",
    icon: "barbell-outline",
    iconFocused: "barbell"
  },
  {
    key: "challenges",
    label: "Challenges",
    icon: "trophy-outline",
    iconFocused: "trophy"
  }
];

export function UnifiedDataManager({
  initialTab = "exercises",
  searchQuery = "",
  style
}: Props) {
  const { state } = useDataContext();
  const [activeTab, setActiveTab] = useState<DataType>(initialTab);
  const [searchState, setSearchState] = useState<SearchState>({
    query: searchQuery,
    filters: {},
    sortBy: "name",
    sortOrder: "asc"
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const getCurrentData = () => {
    switch (activeTab) {
      case "exercises":
        return state.exercises;
      case "programs":
        return state.programs.filter((p) => !p.challengeConfig);
      case "challenges":
        return state.programs.filter((p) => Boolean(p.challengeConfig));
      default:
        return [];
    }
  };

  const getDataCount = (tab: DataType) => {
    switch (tab) {
      case "exercises":
        return state.exercises.length;
      case "programs":
        return state.programs.filter((p) => !p.challengeConfig).length;
      case "challenges":
        return state.programs.filter((p) => Boolean(p.challengeConfig)).length;
      default:
        return 0;
    }
  };

  const handleTabChange = (tab: DataType) => {
    haptics.dataTabSwitch();
    setActiveTab(tab);
    setSelectedItems([]);
    setShowFilters(false);
  };

  const handleSearchChange = (query: string) => {
    if (query !== searchState.query) {
      haptics.searchFilter();
    }
    setSearchState((prev) => ({ ...prev, query }));
  };

  const handleFilterChange = (filters: SearchState["filters"]) => {
    haptics.searchFilter();
    setSearchState((prev) => ({ ...prev, filters }));
  };

  const handleSortChange = (
    sortBy: SearchState["sortBy"],
    sortOrder: SearchState["sortOrder"]
  ) => {
    haptics.sortChange();
    setSearchState((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  const handleSelectionChange = (itemIds: string[]) => {
    if (itemIds.length > selectedItems.length) {
      if (itemIds.length > 1 && selectedItems.length === 0) {
        haptics.bulkSelection();
      } else {
        haptics.itemSelection();
      }
    } else if (itemIds.length < selectedItems.length) {
      haptics.itemSelection();
    }
    setSelectedItems(itemIds);
  };

  const handleClearSelection = () => {
    haptics.clearSelection();
    setSelectedItems([]);
  };

  const handleToggleFilters = () => {
    haptics.buttonTap();
    setShowFilters(!showFilters);
  };

  const handleItemPress = (item: { id: string }) => {
    haptics.itemSelection();
    switch (activeTab) {
      case "exercises":
        router.push(`/library/exercises/${item.id}/edit`);
        break;
      case "programs":
      case "challenges":
        router.push(`/programs/${item.id}`);
        break;
    }
  };

  const handleItemEdit = (item: { id: string }) => {
    haptics.itemSelection();
    switch (activeTab) {
      case "exercises":
        router.push(`/library/exercises/${item.id}/edit`);
        break;
      case "programs":
        router.push(`/library/programs/${item.id}/edit`);
        break;
      case "challenges":
        router.push(`/library/challenges/${item.id}/edit`);
        break;
    }
  };

  const currentData = getCurrentData();
  const isLoading =
    (activeTab === "exercises" && state.exercisesLoading) ||
    (activeTab !== "exercises" && state.programsLoading);

  const hasActiveFilters =
    (searchState.filters.category && searchState.filters.category.length > 0) ||
    (searchState.filters.source && searchState.filters.source.length > 0);

  return (
    <View style={[styles.container, style]}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = getDataCount(tab.key);
          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handleTabChange(tab.key)}
            >
              <Ionicons
                name={isActive ? tab.iconFocused : tab.icon}
                size={20}
                color={isActive ? theme.colors.primary : theme.colors.muted}
              />
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <View
                  style={[styles.tabBadge, isActive && styles.tabBadgeActive]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      isActive && styles.tabBadgeTextActive
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
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
                  : theme.colors.muted
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
        showInlineActions={
          activeTab === "programs" || activeTab === "challenges"
        }
        isLoading={isLoading}
        style={styles.dataList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface
  },
  tabActive: {
    backgroundColor: theme.colors.primaryLight
  },
  tabLabel: {
    ...theme.typography.captionBold,
    color: theme.colors.muted
  },
  tabLabelActive: {
    color: theme.colors.primary
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xs
  },
  tabBadgeActive: {
    backgroundColor: theme.colors.primary
  },
  tabBadgeText: {
    ...theme.typography.small,
    color: theme.colors.muted
  },
  tabBadgeTextActive: {
    color: theme.colors.primaryTextOn
  },
  controls: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primaryLight
  },
  filterButtonPressed: {
    transform: [{ scale: 0.95 }]
  },
  filterDot: {
    position: "absolute",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.primaryLight,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md
  },
  selectionText: {
    ...theme.typography.captionBold,
    color: theme.colors.primary
  },
  clearSelectionButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  clearSelectionText: {
    ...theme.typography.captionBold,
    color: theme.colors.primary
  },
  dataList: {
    flex: 1
  }
});

export default UnifiedDataManager;
