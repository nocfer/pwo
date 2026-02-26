import { UnifiedDataManager } from '@/components/data'
import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import type { DataType } from '@/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const TAB_COLORS: Record<DataType, string> = {
  programs: theme.colors.success,
  exercises: theme.colors.primary,
  challenges: theme.colors.accent
}

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<DataType>('programs')

  const addButtonColor = useMemo(
    () => ({ backgroundColor: TAB_COLORS[activeTab] }),
    [activeTab]
  )

  const handleCreateNew = useCallback(() => {
    haptics.buttonTap()
    const route =
      activeTab === 'exercises'
        ? '/library/exercises/new'
        : '/library/programs/new'
    router.navigate(route)
  }, [activeTab])

  const handleScanQR = () => {
    haptics.buttonTap()
    router.navigate('/library/scan')
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [
              styles.circleButton,
              styles.scanButton,
              pressed && styles.circleButtonPressed
            ]}
            onPress={handleScanQR}
          >
            <Ionicons name="scan-outline" size={22} color={theme.colors.text} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.circleButton,
              addButtonColor,
              pressed && styles.circleButtonPressed
            ]}
            onPress={handleCreateNew}
          >
            <Ionicons name="add" size={22} color={theme.colors.primaryTextOn} />
          </Pressable>
        </View>
      </View>

      <UnifiedDataManager
        style={styles.dataManager}
        onActiveTabChange={setActiveTab}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md
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
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm
  },
  circleButtonPressed: {
    transform: [{ scale: 0.95 }]
  },
  scanButton: {
    backgroundColor: theme.colors.surface
  },
  dataManager: {
    flex: 1
  }
})
