/**
 * ProgramListItem - Specialized list item for programs with inline actions
 */

import { theme } from '@/theme/theme'
import type { Program } from '@/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native'

export interface ProgramListItemProps {
  program: Program
  onStart: (program: Program) => void
  onEdit: (program: Program) => void
  selected?: boolean
  onSelectionChange?: (selected: boolean) => void
  showMetadata?: boolean
  style?: ViewStyle
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
  const isChallenge = Boolean(program.challengeConfig)

  // Calculate stats
  const exerciseCount = program.blocks.filter(b => b.type === 'exercise').length
  const totalSets = program.blocks
    .filter(b => b.type === 'exercise')
    .reduce((sum, b) => sum + (b.sets ?? 1), 0)

  const handleItemPress = () => onStart(program)
  const handleEditPress = () => onEdit(program)
  const handleSelectionPress = () => onSelectionChange?.(!selected)

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        selected && styles.containerSelected,
        pressed && styles.containerPressed,
        style
      ]}
      onPress={handleItemPress}
    >
      {onSelectionChange && (
        <Pressable
          style={styles.selectionIndicator}
          onPress={handleSelectionPress}
        >
          <Ionicons
            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={selected ? theme.colors.primary : theme.colors.muted}
          />
        </Pressable>
      )}

      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isChallenge
              ? theme.colors.accentLight
              : theme.colors.successLight
          }
        ]}
      >
        <Ionicons
          name={isChallenge ? 'trophy' : 'barbell'}
          size={20}
          color={isChallenge ? theme.colors.accent : theme.colors.success}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {program.name}
          </Text>
          {program.source === 'builtin' && (
            <View style={styles.builtinBadge}>
              <Text style={styles.builtinBadgeText}>Built-in</Text>
            </View>
          )}
        </View>

        {program.description && (
          <Text style={styles.description} numberOfLines={1}>
            {program.description}
          </Text>
        )}

        {showMetadata && (
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons
                name="fitness-outline"
                size={12}
                color={theme.colors.muted}
              />
              <Text style={styles.statText}>{exerciseCount}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons
                name="repeat-outline"
                size={12}
                color={theme.colors.muted}
              />
              <Text style={styles.statText}>{totalSets} sets</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.editButtonPressed
          ]}
          onPress={handleEditPress}
          hitSlop={8}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={theme.colors.muted}
          />
        </Pressable>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm
  },
  containerSelected: {
    backgroundColor: theme.colors.primaryLight
  },
  containerPressed: {
    transform: [{ scale: 0.98 }]
  },
  selectionIndicator: {
    marginRight: theme.spacing.md,
    padding: theme.spacing.xs
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md
  },
  content: {
    flex: 1,
    gap: 4
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  name: {
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
  description: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  stats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: 2
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  statText: {
    ...theme.typography.small,
    color: theme.colors.muted
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginLeft: theme.spacing.sm
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  editButtonPressed: {
    backgroundColor: theme.colors.border
  }
})

export default ProgramListItem
