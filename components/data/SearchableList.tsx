/**
 * SearchableList - Enhanced list component with metadata display and search capabilities
 *
 * Provides a reusable list interface with built-in search, loading states, and error handling
 * Requirements: 1.4, 1.5
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
  [key: string]: any;
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

    // Exit selection mode if no items selected
    if (newSelection.length === 0) {
      setSelectionMode(false);
    }
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    const isSelected = selectedItems.includes(item.id);
    const isChallenge = "challengeConfig" in item && item.challengeConfig;

    // Use ProgramListItem for programs when inline actions are enabled
    if (
      showInlineActions &&
      (dataType === "programs" || dataType === "challenges")
    ) {
      // Convert ListItem back to Program type for ProgramListItem
      const program: Program = {
        id: item.id,
        name: item.name,
        description: item.description || "",
        source: item.source,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        blocks: item.blocks || [],
        challengeConfig: item.challengeConfig || undefined
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
        {/* Selection indicator */}
        {selectionMode && (
          <View style={styles.selectionIndicator}>
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={isSelected ? theme.colors.primary : theme.colors.muted}
            />
          </View>
        )}

        {/* Item icon */}
        <View
          style={[
            styles.itemIcon,
            { backgroundColor: getItemIconBackground(dataType) }
          ]}
        >
          <Ionicons
            name={getItemIcon(dataType, item)}
            size={20}
            color={getItemIconColor(dataType)}
          />
        </View>

        {/* Item content */}
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

          {item.description && (
            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* Metadata */}
          {showMetadata && (
            <View style={styles.metadata}>
              <Text style={styles.metadataText}>
                Created: {formatDate(item.createdAt)}
              </Text>
              {item.updatedAt && item.updatedAt !== item.createdAt && (
                <Text style={styles.metadataText}>
                  • Updated: {formatDate(item.updatedAt)}
                </Text>
              )}
              {isChallenge && (
                <Text style={styles.metadataText}>• Challenge</Text>
              )}
              {item.category && (
                <Text style={styles.metadataText}>
                  •{" "}
                  {item.category.charAt(0).toUpperCase() +
                    item.category.slice(1)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Action indicator */}
        <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
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
      {/* Search input */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={searchPlaceholder}
          />
        </View>
      )}

      {/* List */}
      {filteredData.length === 0 ? (
        <EmptyState
          title={
            emptyTitle ||
            (searchQuery
              ? `No results for "${searchQuery}"`
              : `No ${dataType} available`)
          }
          description={
            emptySubtitle ||
            (searchQuery
              ? "Try adjusting your search"
              : `Create your first ${dataType.slice(0, -1)}`)
          }
          icon="search-outline"
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

// Helper functions
function getItemIcon(
  dataType: DataType,
  item: ListItem
): keyof typeof Ionicons.glyphMap {
  switch (dataType) {
    case "exercises":
      return (item.icon as keyof typeof Ionicons.glyphMap) || "fitness-outline";
    case "programs":
      return "list-outline";
    case "challenges":
      return "trophy-outline";
    default:
      return "document-outline";
  }
}

function getItemIconBackground(dataType: DataType): string {
  switch (dataType) {
    case "exercises":
      return theme.colors.primaryLight;
    case "programs":
      return theme.colors.card;
    case "challenges":
      return theme.colors.warningLight;
    default:
      return theme.colors.card;
  }
}

function getItemIconColor(dataType: DataType): string {
  switch (dataType) {
    case "exercises":
      return theme.colors.primary;
    case "programs":
      return theme.colors.muted;
    case "challenges":
      return theme.colors.warning;
    default:
      return theme.colors.muted;
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return "Unknown";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return "Unknown";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  searchContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  listContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl
  },
  emptyState: {
    flex: 1,
    marginTop: theme.spacing.xxl
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm
  },
  itemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight
  },
  itemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }]
  },
  selectionIndicator: {
    marginRight: theme.spacing.md
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md
  },
  itemContent: {
    flex: 1
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs
  },
  itemName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flex: 1
  },
  builtinBadge: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    marginLeft: theme.spacing.sm
  },
  builtinBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontSize: 11
  },
  itemDescription: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    marginBottom: theme.spacing.xs
  },
  metadata: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  metadataText: {
    ...theme.typography.caption,
    color: theme.colors.muted
  }
});

export default SearchableList;
