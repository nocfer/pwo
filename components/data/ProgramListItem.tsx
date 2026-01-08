/**
 * ProgramListItem - Specialized list item for programs with inline actions
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

  const handleItemPress = () => onStart(program);
  const handleEditPress = () => onEdit(program);
  const handleSelectionPress = () => onSelectionChange?.(!selected);

  return (
    <View
      style={[styles.container, selected && styles.containerSelected, style]}
    >
      {onSelectionChange && (
        <Pressable
          style={styles.selectionIndicator}
          onPress={handleSelectionPress}
        >
          <Ionicons
            name={selected ? "checkmark-circle" : "ellipse-outline"}
            size={22}
            color={selected ? theme.colors.primary : theme.colors.muted}
          />
        </Pressable>
      )}

      <View
        style={[
          styles.programIcon,
          {
            backgroundColor: isChallenge
              ? theme.colors.accentLight
              : theme.colors.primaryLight
          }
        ]}
      >
        <Ionicons
          name={isChallenge ? "trophy-outline" : "list-outline"}
          size={18}
          color={isChallenge ? theme.colors.accent : theme.colors.primary}
        />
      </View>

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

          {showMetadata && (
            <View style={styles.metadata}>
              <Text style={styles.metadataText}>
                {program.blocks.length} block{program.blocks.length !== 1 ? "s" : ""}
                {isChallenge ? " • Challenge" : ""}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      <View style={styles.actionButtons}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.startButton,
            pressed && styles.startButtonPressed
          ]}
          onPress={handleItemPress}
        >
          <Ionicons name="play" size={14} color={theme.colors.primaryTextOn} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.editButton,
            pressed && styles.editButtonPressed
          ]}
          onPress={handleEditPress}
        >
          <Ionicons name="create-outline" size={14} color={theme.colors.text} />
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
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm
  },
  containerSelected: {
    backgroundColor: theme.colors.primaryLight
  },
  selectionIndicator: {
    marginRight: theme.spacing.md,
    padding: theme.spacing.xs
  },
  programIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md
  },
  contentArea: {
    flex: 1,
    marginRight: theme.spacing.sm
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
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    marginLeft: theme.spacing.sm
  },
  builtinBadgeText: {
    ...theme.typography.small,
    color: theme.colors.muted
  },
  programDescription: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs
  },
  metadata: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  metadataText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontSize: 11
  },
  actionButtons: {
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  startButton: {
    backgroundColor: theme.colors.primary
  },
  startButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }]
  },
  editButton: {
    backgroundColor: theme.colors.background
  },
  editButtonPressed: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.96 }]
  }
});

export default ProgramListItem;
