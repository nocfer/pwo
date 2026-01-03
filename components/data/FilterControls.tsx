/**
 * FilterControls - Provides filtering and sorting controls for data lists
 *
 * Supports category, source, and date range filtering with sorting options
 * Requirements: 1.5
 */

import { theme } from "@/theme/theme";
import type { DataType, ExerciseCategory, SearchState } from "@/types";
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

type Props = {
  dataType: DataType;
  filters: SearchState["filters"];
  sortBy: SearchState["sortBy"];
  sortOrder: SearchState["sortOrder"];
  onFiltersChange: (filters: SearchState["filters"]) => void;
  onSortChange: (
    sortBy: SearchState["sortBy"],
    sortOrder: SearchState["sortOrder"]
  ) => void;
  style?: ViewStyle;
};

const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  "strength",
  "cardio",
  "flexibility",
  "skill"
];

const SOURCE_OPTIONS = [
  { key: "builtin" as const, label: "Built-in" },
  { key: "user" as const, label: "User Created" }
];

const SORT_OPTIONS = [
  { key: "name" as const, label: "Name" },
  { key: "created" as const, label: "Created Date" },
  { key: "updated" as const, label: "Updated Date" },
  { key: "usage" as const, label: "Usage" }
];

export function FilterControls({
  dataType,
  filters,
  sortBy,
  sortOrder,
  onFiltersChange,
  onSortChange,
  style
}: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleCategoryToggle = (category: ExerciseCategory) => {
    const currentCategories = filters.category || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];

    onFiltersChange({
      ...filters,
      category: newCategories.length > 0 ? newCategories : undefined
    });
  };

  const handleSourceToggle = (source: "builtin" | "user") => {
    const currentSources = filters.source || [];
    const newSources = currentSources.includes(source)
      ? currentSources.filter((s) => s !== source)
      : [...currentSources, source];

    onFiltersChange({
      ...filters,
      source: newSources.length > 0 ? newSources : undefined
    });
  };

  const handleSortChange = (newSortBy: SearchState["sortBy"]) => {
    if (newSortBy === sortBy) {
      // Toggle sort order if same field
      onSortChange(sortBy, sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Change sort field with default ascending order
      onSortChange(newSortBy, "asc");
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    onSortChange("name", "asc");
  };

  const hasActiveFilters = () => {
    return (
      (filters.category && filters.category.length > 0) ||
      (filters.source && filters.source.length > 0) ||
      filters.dateRange ||
      sortBy !== "name" ||
      sortOrder !== "asc"
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header with clear button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Filters & Sort</Text>
        {hasActiveFilters() && (
          <Pressable style={styles.clearButton} onPress={clearAllFilters}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </Pressable>
        )}
      </View>

      {/* Sort Section */}
      <View style={styles.section}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => toggleSection("sort")}
        >
          <Text style={styles.sectionTitle}>Sort</Text>
          <Ionicons
            name={expandedSection === "sort" ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.colors.muted}
          />
        </Pressable>

        {expandedSection === "sort" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.optionsContainer}
          >
            {SORT_OPTIONS.map((option) => {
              const isActive = sortBy === option.key;
              return (
                <Pressable
                  key={option.key}
                  style={[styles.option, isActive && styles.optionActive]}
                  onPress={() => handleSortChange(option.key)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isActive && styles.optionTextActive
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isActive && (
                    <Ionicons
                      name={sortOrder === "asc" ? "arrow-up" : "arrow-down"}
                      size={16}
                      color={theme.colors.primary}
                      style={styles.sortIcon}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Category Section (only for exercises) */}
      {dataType === "exercises" && (
        <View style={styles.section}>
          <Pressable
            style={styles.sectionHeader}
            onPress={() => toggleSection("category")}
          >
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.sectionHeaderRight}>
              {filters.category && filters.category.length > 0 && (
                <View style={styles.activeFilterBadge}>
                  <Text style={styles.activeFilterBadgeText}>
                    {filters.category.length}
                  </Text>
                </View>
              )}
              <Ionicons
                name={
                  expandedSection === "category" ? "chevron-up" : "chevron-down"
                }
                size={20}
                color={theme.colors.muted}
              />
            </View>
          </Pressable>

          {expandedSection === "category" && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionsContainer}
            >
              {EXERCISE_CATEGORIES.map((category) => {
                const isSelected =
                  filters.category?.includes(category) || false;
                return (
                  <Pressable
                    key={category}
                    style={[styles.option, isSelected && styles.optionActive]}
                    onPress={() => handleCategoryToggle(category)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextActive
                      ]}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* Source Section */}
      <View style={styles.section}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => toggleSection("source")}
        >
          <Text style={styles.sectionTitle}>Source</Text>
          <View style={styles.sectionHeaderRight}>
            {filters.source && filters.source.length > 0 && (
              <View style={styles.activeFilterBadge}>
                <Text style={styles.activeFilterBadgeText}>
                  {filters.source.length}
                </Text>
              </View>
            )}
            <Ionicons
              name={
                expandedSection === "source" ? "chevron-up" : "chevron-down"
              }
              size={20}
              color={theme.colors.muted}
            />
          </View>
        </Pressable>

        {expandedSection === "source" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.optionsContainer}
          >
            {SOURCE_OPTIONS.map((option) => {
              const isSelected = filters.source?.includes(option.key) || false;
              return (
                <Pressable
                  key={option.key}
                  style={[styles.option, isSelected && styles.optionActive]}
                  onPress={() => handleSourceToggle(option.key)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextActive
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md
  },
  headerTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  clearButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  clearButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  },
  section: {
    marginBottom: theme.spacing.md
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  sectionTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.subtext
  },
  activeFilterBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xs
  },
  activeFilterBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.primaryTextOn,
    fontSize: 11,
    fontWeight: "bold"
  },
  optionsContainer: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    gap: theme.spacing.sm
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface
  },
  optionActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary
  },
  optionText: {
    ...theme.typography.body,
    color: theme.colors.text
  },
  optionTextActive: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  },
  sortIcon: {
    marginLeft: theme.spacing.xs
  }
});

export default FilterControls;
