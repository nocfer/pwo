import { SyncChip } from '@/components/common'
import { UnifiedDataManager } from '@/components/data'
import {
  AnimatedIcon,
  useScreenIconAnimation
} from '@/hooks/useScreenIconAnimation'
import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import type { DataType } from '@/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<DataType>('programs')

  const { trigger, staggerDelay } = useScreenIconAnimation({
    icons: [
      { type: 'spin', duration: 500 },
      { type: 'spinPartial', duration: 400 }
    ],
    staggerDelay: 100
  })

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
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>Library</Text>
          <SyncChip />
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [
              styles.circleButton,
              styles.scanButton,
              pressed && styles.circleButtonPressed
            ]}
            onPress={handleScanQR}
          >
            <AnimatedIcon
              config={{ type: 'spin', duration: 500 }}
              trigger={trigger}
              index={0}
              staggerDelay={staggerDelay}
            >
              <Ionicons
                name="scan-outline"
                size={22}
                color={theme.colors.subtext}
              />
            </AnimatedIcon>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.circleButton,
              styles.addButton,
              pressed && styles.circleButtonPressed
            ]}
            onPress={handleCreateNew}
          >
            <AnimatedIcon
              config={{ type: 'spinPartial', duration: 400 }}
              trigger={trigger}
              index={1}
              staggerDelay={staggerDelay}
            >
              <Ionicons
                name="add"
                size={22}
                color={theme.colors.primaryTextOn}
              />
            </AnimatedIcon>
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
  headerTitleGroup: {
    gap: theme.spacing.xs,
    alignItems: 'flex-start'
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
    width: 42,
    height: 42,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center'
  },
  circleButtonPressed: {
    transform: [{ scale: 0.95 }]
  },
  scanButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  addButton: {
    backgroundColor: theme.colors.primary
  },
  dataManager: {
    flex: 1
  }
})
