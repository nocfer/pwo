/**
 * ProgramListItem - Specialized list item component for programs with inline Start/Edit actions
 *
 * Provides inline action buttons for starting and editing programs while maintaining
 * consistent styling with the existing design system
 * Requirements: 2.1, 4.2
 */

import { theme } from "@/theme/theme";
import type { Program } from "@/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

export interface ProgramListItemProps {
  program: Program;
  onStart: (program: Program) => void;
  onEdit: (program: Program) => void;
  selected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  showMetadata?: boolean;
  style?: ViewStyle;
}

export function ProgramListItem({
  program,
  onStart,
  onEdit,
  selected = false,
  onSelectionChange,
  showMetadata = true,
  style
}: ProgramListItemProps) {
  const isChallenge = Boolean(program.challengeConfig);

  const handleItemPress = () => {
    // Primary action is to start the program
    onStart(program);
  };

  const handleEditPress = () => {
    onEdit(program);
  };

  const handleSelectionPress = () => {
    onSelectionChange?.(!selected);
  };

  const formatDate = (dateString?: string): string => {
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
  };

  return (
    <View
      style={[styles.container, selected && styles.containerSelected, style]}
    >
      {/* Selection indicator (if selection mode is active) */}
      {onSelectionChange && (
        <Pressable
          style={styles.selectionIndicator}
          onPress={handleSelectionPress}
        >
          <Ionicons
            name={selected ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={selected ? theme.colors.primary : theme.colors.muted}
          />
        </Pressable>
      )}

      {/* Program icon */}
      <View
        style={[
          styles.programIcon,
          {
            backgroundColor: isChallenge
              ? theme.colors.warningLight
              : theme.colors.card
          }
        ]}
      >
        <Ionicons
          name={isChallenge ? "trophy-outline" : "list-outline"}
          size={20}
          color={isChallenge ? theme.colors.warning : theme.colors.muted}
        />
      </View>

      {/* Main content area - tappable to start program */}
      <Pressable
        style={({ pressed }) => [
          styles.contentArea,
          pressed && styles.contentAreaPressed
        ]}
        onPress={handleItemPress}
      >
        <View style={styles.programContent}>
          <View style={styles.programHeader}>
            <Text style={styles.programName} numberOfLines={1}>
              {program.name}
            </Text>
            {program.source === "builtin" && (
              <View style={styles.builtinBadge}>
                <Text style={styles.builtinBadgeText}>Built-in</Text>
              </View>
            )}
          </View>

          {program.description && (
            <Text style={styles.programDescription} numberOfLines={2}>
              {program.description}
            </Text>
          )}

          {/* Metadata */}
          {showMetadata && (
            <View style={styles.metadata}>
              <Text style={styles.metadataText}>
                Created: {formatDate(program.createdAt)}
              </Text>
              {program.updatedAt && program.updatedAt !== program.createdAt && (
                <Text style={styles.metadataText}>
                  • Updated: {formatDate(program.updatedAt)}
                </Text>
              )}
              {isChallenge && (
                <Text style={styles.metadataText}>• Challenge</Text>
              )}
              <Text style={styles.metadataText}>
                • {program.sessions.length} session
                {program.sessions.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        {/* Start button */}
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.startButton,
            pressed && styles.startButtonPressed
          ]}
          onPress={handleItemPress}
        >
          <Ionicons name="play" size={16} color={theme.colors.primaryTextOn} />
          <Text style={styles.startButtonText}>Start</Text>
        </Pressable>

        {/* Edit button */}
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.editButton,
            pressed && styles.editButtonPressed
          ]}
          onPress={handleEditPress}
        >
          <Ionicons name="create-outline" size={16} color={theme.colors.text} />
          <Text style={styles.editButtonText}>Edit</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  containerSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight
  },
  selectionIndicator: {
    marginRight: theme.spacing.md,
    padding: theme.spacing.xs
  },
  programIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md
  },
  contentArea: {
    flex: 1,
    marginRight: theme.spacing.md
  },
  contentAreaPressed: {
    opacity: 0.7
  },
  programContent: {
    flex: 1
  },
  programHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs
  },
  programName: {
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
  programDescription: {
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
  },
  actionButtons: {
    flexDirection: "column",
    gap: theme.spacing.sm
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    minWidth: 60,
    gap: theme.spacing.xs
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    ...theme.shadows.sm
  },
  startButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  startButtonText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primaryTextOn,
    fontSize: 12
  },
  editButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  editButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }]
  },
  editButtonText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    fontSize: 12
  }
});

export default ProgramListItem;
