/**
 * UnifiedDataManager - Central component for managing exercises, programs, and challenges
 *
 * Provides a tabbed interface with search, filter, and bulk operations
 * Requirements: 1.1, 1.2, 1.3
 */

import { useDataContext } from "@/context/DataContext";
import { theme } from "@/theme/theme";
import type { DataType, SearchState } from "@/types/enhanced";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from "react-native";
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
    icon: "list-outline",
    iconFocused: "list"
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

  // Get data for current tab
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

  const handleTabChange = (tab: DataType) => {
    setActiveTab(tab);
    setSelectedItems([]); // Clear selection when switching tabs
    setShowFilters(false); // Hide filters when switching tabs
  };

  const handleSearchChange = (query: string) => {
    setSearchState((prev) => ({ ...prev, query }));
  };

  const handleFilterChange = (filters: SearchState["filters"]) => {
    setSearchState((prev) => ({ ...prev, filters }));
  };

  const handleSortChange = (
    sortBy: SearchState["sortBy"],
    sortOrder: SearchState["sortOrder"]
  ) => {
    setSearchState((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  const handleSelectionChange = (itemIds: string[]) => {
    setSelectedItems(itemIds);
  };

  const currentData = getCurrentData();
  const isLoading =
    (activeTab === "exercises" && state.exercisesLoading) ||
    (activeTab !== "exercises" && state.programsLoading);

  return (
    <View style={[styles.container, style]}>
      {/* Header with tabs */}
      <View style={styles.header}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={({ pressed }) => [
                  styles.tab,
                  isActive && styles.tabActive,
                  pressed && styles.tabPressed
                ]}
                onPress={() => handleTabChange(tab.key)}
              >
                <Ionicons
                  name={isActive ? tab.iconFocused : tab.icon}
                  size={20}
                  color={isActive ? theme.colors.primary : theme.colors.muted}
                  style={styles.tabIcon}
                />
                <Text
                  style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Search and filter controls */}
      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <SearchInput
            value={searchState.query}
            onChangeText={handleSearchChange}
            placeholder={`Search ${TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}...`}
            style={styles.searchInput}
          />
          <Pressable
            style={({ pressed }) => [
              styles.filterButton,
              showFilters && styles.filterButtonActive,
              pressed && styles.filterButtonPressed
            ]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons
              name={showFilters ? "options" : "options-outline"}
              size={20}
              color={showFilters ? theme.colors.primary : theme.colors.muted}
            />
          </Pressable>
        </View>

        {/* Filter controls */}
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

      {/* Bulk selection info */}
      {selectedItems.length > 0 && (
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""}{" "}
            selected
          </Text>
          <Pressable
            style={styles.clearSelectionButton}
            onPress={() => setSelectedItems([])}
          >
            <Text style={styles.clearSelectionText}>Clear</Text>
          </Pressable>
        </View>
      )}

      {/* Data list */}
      <DataList
        dataType={activeTab}
        data={currentData}
        searchState={searchState}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
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
  header: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm
  },
  tabsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginRight: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: "transparent"
  },
  tabActive: {
    backgroundColor: theme.colors.primaryLight
  },
  tabPressed: {
    opacity: 0.7
  },
  tabIcon: {
    marginRight: theme.spacing.sm
  },
  tabLabel: {
    ...theme.typography.bodyBold,
    color: theme.colors.muted
  },
  tabLabelActive: {
    color: theme.colors.primary
  },
  controls: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md
  },
  searchInput: {
    flex: 1
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary
  },
  filterButtonPressed: {
    opacity: 0.7
  },
  filterControls: {
    marginTop: theme.spacing.md
  },
  selectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  selectionText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  },
  clearSelectionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  clearSelectionText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  },
  dataList: {
    flex: 1
  }
});

export default UnifiedDataManager;
