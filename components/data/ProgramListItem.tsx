/**
 * ProgramListItem - Specialized list item for programs with inline actions.
 * Custom (editable) programs expose a kebab → Edit / Delete action sheet;
 * read-only programs (Built-in / Coach) show a chevron only.
 */

import { haptics } from '@/lib/haptics'
import { getSourceBadge } from '@/lib/utils'
import { theme } from '@/theme/theme'
import type { Program } from '@/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native'

export interface ProgramListItemProps {
  program: Program
  onStart: (program: Program) => void
  onEdit: (program: Program) => void
  onDelete?: (program: Program) => void
  selected?: boolean
  onSelectionChange?: (selected: boolean) => void
  showMetadata?: boolean
  style?: ViewStyle
}

const ICON_TINT: Record<Program['source'], string> = {
  user: theme.colors.primaryLight,
  pt: theme.colors.infoLight,
  builtin: theme.colors.surfaceElevated
}

export function ProgramListItem({
  program,
  onStart,
  onEdit,
  onDelete,
  selected = false,
  onSelectionChange,
  showMetadata = true,
  style
}: ProgramListItemProps) {
  const [menuVisible, setMenuVisible] = useState(false)

  const inSelectionMode = Boolean(onSelectionChange)
  const editable = program.source === 'user'
  const badge = getSourceBadge(program.source)

  // Stats
  const exerciseCount = program.blocks.filter(b => b.type === 'exercise').length
  const totalSets = program.blocks
    .filter(b => b.type === 'exercise')
    .reduce((sum, b) => sum + (b.sets ?? 1), 0)

  const handleItemPress = () => onStart(program)
  const handleSelectionPress = () => onSelectionChange?.(!selected)

  const openMenu = () => {
    haptics.buttonTap()
    setMenuVisible(true)
  }
  const closeMenu = () => setMenuVisible(false)
  const handleEditFromMenu = () => {
    setMenuVisible(false)
    onEdit(program)
  }
  const handleDeleteFromMenu = () => {
    setMenuVisible(false)
    onDelete?.(program)
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        selected && styles.containerSelected,
        pressed && styles.containerPressed,
        style
      ]}
      onPress={inSelectionMode ? handleSelectionPress : handleItemPress}
    >
      <View
        style={[styles.iconContainer, { backgroundColor: ICON_TINT[program.source] }]}
      >
        <Ionicons name="barbell" size={20} color={badge.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {program.name}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: badge.bg },
              badge.border
                ? { borderWidth: 1, borderColor: badge.border }
                : null
            ]}
          >
            {badge.locked && (
              <Ionicons
                name="lock-closed"
                size={9}
                color={badge.color}
                style={styles.badgeLock}
              />
            )}
            <Text style={[styles.badgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        {showMetadata && (
          <Text style={styles.meta} numberOfLines={1}>
            {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'} ·{' '}
            {totalSets} {totalSets === 1 ? 'set' : 'sets'}
          </Text>
        )}
      </View>

      {inSelectionMode ? (
        <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
          {selected && (
            <Ionicons
              name="checkmark"
              size={16}
              color={theme.colors.primaryTextOn}
            />
          )}
        </View>
      ) : editable ? (
        <Pressable style={styles.kebab} onPress={openMenu} hitSlop={8}>
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color={theme.colors.muted}
          />
        </Pressable>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
      )}

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <View style={styles.menuSheet}>
            <Pressable style={styles.menuItem} onPress={handleEditFromMenu}>
              <Ionicons
                name="create-outline"
                size={20}
                color={theme.colors.text}
              />
              <Text style={styles.menuItemText}>Edit</Text>
            </Pressable>
            {onDelete && (
              <>
                <View style={styles.menuDivider} />
                <Pressable
                  style={styles.menuItem}
                  onPress={handleDeleteFromMenu}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={theme.colors.danger}
                  />
                  <Text style={[styles.menuItemText, styles.menuItemDanger]}>
                    Delete
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md
  },
  containerSelected: {
    backgroundColor: theme.colors.primaryTint,
    borderColor: theme.colors.borderActive
  },
  containerPressed: {
    transform: [{ scale: 0.98 }]
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flex: 1,
    gap: 3
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  name: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flexShrink: 1
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: theme.radius.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3
  },
  badgeLock: {
    marginTop: -1
  },
  badgeText: {
    ...theme.typography.small,
    fontFamily: theme.fonts.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  meta: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  kebab: {
    padding: theme.spacing.xs
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end'
  },
  menuSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingBottom: theme.spacing.xl
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md
  },
  menuItemText: {
    ...theme.typography.body,
    color: theme.colors.text
  },
  menuItemDanger: {
    color: theme.colors.danger
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg
  }
})

export default ProgramListItem
