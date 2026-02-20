import { UnifiedDataManager } from '@/components/data'
import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type CreateType = 'exercise' | 'program'

const CREATE_MENU_ITEMS: {
  type: CreateType
  title: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  iconBgColor: string
}[] = [
  {
    type: 'exercise',
    title: 'Exercise',
    subtitle: 'Add a custom exercise',
    icon: 'fitness',
    iconColor: theme.colors.primary,
    iconBgColor: theme.colors.primaryLight
  },
  {
    type: 'program',
    title: 'Program',
    subtitle: 'Build a workout routine',
    icon: 'barbell',
    iconColor: theme.colors.success,
    iconBgColor: theme.colors.successLight
  }
]

export default function LibraryScreen() {
  const [showCreateMenu, setShowCreateMenu] = useState(false)

  const handleCreateNew = useCallback((type: CreateType) => {
    haptics.buttonTap()
    setShowCreateMenu(false)
    switch (type) {
      case 'exercise':
        router.navigate('/library/exercises/new')
        break
      case 'program':
        router.navigate('/library/programs/new')
        break
    }
  }, [])

  const handleScanQR = () => {
    haptics.buttonTap()
    router.navigate('/library/scan')
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Library</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonPressed
              ]}
              onPress={handleScanQR}
            >
              <Ionicons
                name="scan-outline"
                size={22}
                color={theme.colors.text}
              />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed
              ]}
              onPress={() => {
                haptics.buttonTap()
                setShowCreateMenu(true)
              }}
            >
              <Ionicons
                name="add"
                size={22}
                color={theme.colors.primaryTextOn}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Data Manager */}
      <UnifiedDataManager style={styles.dataManager} />

      {/* Create Menu Modal */}
      <Modal
        visible={showCreateMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateMenu(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowCreateMenu(false)}
        >
          <Pressable style={styles.createMenu}>
            <View style={styles.createMenuHeader}>
              <Text style={styles.createMenuTitle}>Create New</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed
                ]}
                onPress={() => setShowCreateMenu(false)}
              >
                <Ionicons name="close" size={22} color={theme.colors.muted} />
              </Pressable>
            </View>

            <View style={styles.createMenuItems}>
              {CREATE_MENU_ITEMS.map((item, index) => (
                <Pressable
                  key={item.type}
                  style={({ pressed }) => [
                    styles.createMenuItem,
                    index === CREATE_MENU_ITEMS.length - 1 &&
                      styles.createMenuItemLast,
                    pressed && styles.createMenuItemPressed
                  ]}
                  onPress={() => handleCreateNew(item.type)}
                >
                  <View
                    style={[
                      styles.menuItemIcon,
                      { backgroundColor: item.iconBgColor }
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={item.iconColor}
                    />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.muted}
                  />
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center'
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm
  },
  iconButtonPressed: {
    transform: [{ scale: 0.95 }]
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm
  },
  addButtonPressed: {
    transform: [{ scale: 0.95 }]
  },
  dataManager: {
    flex: 1
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg
  },
  createMenu: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    width: '100%',
    maxWidth: 360,
    ...theme.shadows.lg
  },
  createMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight
  },
  createMenuTitle: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonPressed: {
    backgroundColor: theme.colors.background
  },
  createMenuItems: {
    padding: theme.spacing.md
  },
  createMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.xs
  },
  createMenuItemLast: {
    marginBottom: 0
  },
  createMenuItemPressed: {
    backgroundColor: theme.colors.background
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md
  },
  menuItemText: {
    flex: 1,
    gap: 2
  },
  menuItemTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  menuItemSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted
  }
})
