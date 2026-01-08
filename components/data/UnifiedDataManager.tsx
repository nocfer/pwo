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

  const handleItemPress = (item: any) => {
    haptics.itemSelection();
    switch (activeTab) {
      case "exercises":
        router.push(`/library/exercises/${item.id}/edit` as any);
        break;
      case "programs":
      case "challenges":
        router.push(`/programs/${item.id}` as any);
        break;
    }
  };

  const handleItemEdit = (item: any) => {
    haptics.itemSelection();
    switch (activeTab) {
      case "exercises":
        router.push(`/library/exercises/${item.id}/edit` as any);
        break;
      case "programs":
        router.push(`/library/programs/${item.id}/edit` as any);
        break;
      case "challenges":
        router.push(`/library/challenges/${item.id}/edit` as any);
        break;
    }
  };

  const currentData = getCurrentData();
  const isLoading =
    (activeTab === "exercises" && state.exercisesLoading) ||
    (activeTab !== "exercises" && state.programsLoading);

  return (
    <View style={[styles.container, style]}>
      {/* Tabs */}
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
                  size={18}
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

      {/* Search and Filters */}
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
            onPress={handleToggleFilters}
          >
            <Ionicons
              name={showFilters ? "options" : "options-outline"}
              size={18}
              color={showFilters ? theme.colors.primary : theme.colors.muted}
            />
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

      {/* Selection Info */}
      {selectedItems.length > 0 && (
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""}{" "}
            selected
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
  header: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight
  },
  tabsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.xs,
    borderRadius: theme.radius.md,
    backgroundColor: "transparent"
  },
  tabActive: {
    backgroundColor: theme.colors.primaryLight
  },
  tabPressed: {
    opacity: 0.7
  },
  tabIcon: {
    marginRight: theme.spacing.xs
  },
  tabLabel: {
    ...theme.typography.bodyBold,
    color: theme.colors.muted,
    fontSize: 14
  },
  tabLabelActive: {
    color: theme.colors.primary
  },
  controls: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight
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
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center"
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primaryLight
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
    paddingVertical: theme.spacing.sm
  },
  selectionText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
    fontSize: 14
  },
  clearSelectionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs
  },
  clearSelectionText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
    fontSize: 14
  },
  dataList: {
    flex: 1
  }
});

export default UnifiedDataManager;
