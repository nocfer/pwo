/**
 * SearchableList - Enhanced list component with metadata display and search capabilities
 */

import { theme } from "@/theme/theme";
import type { Program } from "@/types";
import type { DataType } from "@/types/enhanced";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from "react-native";
import { EmptyState, LoadingScreen } from "../common";
import { SearchInput } from "../common/SearchInput";
import { ProgramListItem } from "./ProgramListItem";

type ListItem = {
  id: string;
  name: string;
  description?: string;
  source: "builtin" | "user";
  createdAt?: string;
  updatedAt?: string;
  category?: string;
  icon?: string;
  [key: string]: unknown;
};

type Props = {
  data: ListItem[];
  dataType: DataType;
  searchPlaceholder?: string;
  onItemPress?: (item: ListItem) => void;
  onItemEdit?: (item: ListItem) => void;
  onItemLongPress?: (item: ListItem) => void;
  selectedItems?: string[];
  onSelectionChange?: (itemIds: string[]) => void;
  showSearch?: boolean;
  showMetadata?: boolean;
  showInlineActions?: boolean;
  isLoading?: boolean;
  error?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  style?: ViewStyle;
};

export function SearchableList({
  data,
  dataType,
  searchPlaceholder = "Search...",
  onItemPress,
  onItemEdit,
  onItemLongPress,
  selectedItems = [],
  onSelectionChange,
  showSearch = true,
  showMetadata = true,
  showInlineActions = false,
  isLoading = false,
  error,
  emptyTitle,
  emptySubtitle,
  style
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query))
    );
  }, [data, searchQuery]);

  const handleItemPress = (item: ListItem) => {
    if (selectionMode) {
      handleItemSelection(item.id);
    } else {
      onItemPress?.(item);
    }
  };

  const handleItemLongPress = (item: ListItem) => {
    if (!selectionMode) {
      setSelectionMode(true);
      onSelectionChange?.([item.id]);
    } else {
      onItemLongPress?.(item);
    }
  };

  const handleItemSelection = (itemId: string) => {
    const isSelected = selectedItems.includes(itemId);
    let newSelection: string[];

    if (isSelected) {
      newSelection = selectedItems.filter((id) => id !== itemId);
    } else {
      newSelection = [...selectedItems, itemId];
    }

    onSelectionChange?.(newSelection);

    if (newSelection.length === 0) {
      setSelectionMode(false);
    }
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    const isSelected = selectedItems.includes(item.id);

    // Use ProgramListItem for programs when inline actions are enabled
    if (
      showInlineActions &&
      (dataType === "programs" || dataType === "challenges")
    ) {
      const program: Program = {
        id: item.id,
        name: item.name,
        description: item.description || "",
        source: item.source,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        blocks: (item.blocks as Program["blocks"]) || [],
        challengeConfig: item.challengeConfig as Program["challengeConfig"]
      };

      return (
        <ProgramListItem
          program={program}
          onStart={() => onItemPress?.(item)}
          onEdit={() => onItemEdit?.(item)}
          selected={isSelected}
          onSelectionChange={
            selectionMode
              ? (selected: boolean) => {
                  const newSelection = selected
                    ? [...selectedItems, item.id]
                    : selectedItems.filter((id) => id !== item.id);
                  onSelectionChange?.(newSelection);
                }
              : undefined
          }
          showMetadata={showMetadata}
        />
      );
    }

    // Default exercise item rendering
    return (
      <Pressable
        style={({ pressed }) => [
          styles.itemContainer,
          isSelected && styles.itemSelected,
          pressed && styles.itemPressed
        ]}
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleItemLongPress(item)}
      >
        {selectionMode && (
          <View style={styles.selectionIndicator}>
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={isSelected ? theme.colors.primary : theme.colors.muted}
            />
          </View>
        )}

        <View
          style={[
            styles.itemIcon,
            { backgroundColor: theme.colors.primaryLight }
          ]}
        >
          <Ionicons
            name={
              (item.icon as keyof typeof Ionicons.glyphMap) || "fitness-outline"
            }
            size={20}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.source === "builtin" && (
              <View style={styles.builtinBadge}>
                <Text style={styles.builtinBadgeText}>Built-in</Text>
              </View>
            )}
          </View>

          {showMetadata && item.category && (
            <Text style={styles.itemCategory}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
      </Pressable>
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <EmptyState
        title="Error Loading Data"
        description={error}
        icon="alert-circle-outline"
        style={style}
      />
    );
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
              ? "Try a different search"
              : `Create your first ${dataType.slice(0, -1)}`)
          }
          icon={searchQuery ? "search-outline" : "add-circle-outline"}
          style={styles.emptyState}
        />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm
  },
  itemSelected: {
    backgroundColor: theme.colors.primaryLight
  },
  itemPressed: {
    transform: [{ scale: 0.98 }]
  },
  selectionIndicator: {
    marginRight: theme.spacing.md
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md
  },
  itemContent: {
    flex: 1,
    gap: 4
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  itemName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flex: 1
  },
  builtinBadge: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2
  },
  builtinBadgeText: {
    ...theme.typography.small,
    color: theme.colors.muted
  },
  itemCategory: {
    ...theme.typography.caption,
    color: theme.colors.muted
  }
});

export default SearchableList;
