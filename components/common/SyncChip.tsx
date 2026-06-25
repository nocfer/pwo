/**
 * SyncChip - Compact per-screen sync-state indicator.
 *
 * Reads DataContext sync state and shows one of:
 *  - "Syncing…"           while the offline queue is flushing
 *  - "Sync failed · Retry" when writes remain after a failed flush (pressable)
 *  - "Saved offline"       offline with queued writes
 *  - "Synced {relative}"   idle, with a last-sync timestamp
 * Renders nothing when there's nothing meaningful to show.
 */

import { useSyncStatus } from '@/context/DataContext'
import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function SyncChip() {
  const { isOnline, syncState, lastSyncAt, pendingCount, retrySync } =
    useSyncStatus()

  // Re-render every 30s so the "Synced Xm ago" label doesn't go stale while
  // the user lingers on the screen.
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!lastSyncAt) return
    const id = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [lastSyncAt])

  if (syncState === 'syncing') {
    return (
      <View style={styles.chip}>
        <Ionicons name="sync" size={13} color={theme.colors.info} />
        <Text style={[styles.text, { color: theme.colors.info }]}>Syncing…</Text>
      </View>
    )
  }

  if (syncState === 'error' && pendingCount > 0) {
    return (
      <Pressable
        onPress={retrySync}
        style={({ pressed }) => [
          styles.chip,
          styles.chipError,
          pressed && styles.chipPressed
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={13}
          color={theme.colors.danger}
        />
        <Text style={[styles.text, { color: theme.colors.danger }]}>
          Sync failed · Retry
        </Text>
      </Pressable>
    )
  }

  if (!isOnline && pendingCount > 0) {
    return (
      <View style={styles.chip}>
        <Ionicons
          name="cloud-offline-outline"
          size={13}
          color={theme.colors.warning}
        />
        <Text style={[styles.text, { color: theme.colors.warning }]}>
          {pendingCount} change{pendingCount === 1 ? '' : 's'} saved offline
        </Text>
      </View>
    )
  }

  if (lastSyncAt) {
    return (
      <View style={styles.chip}>
        <Ionicons
          name="checkmark-circle-outline"
          size={13}
          color={theme.colors.muted}
        />
        <Text style={styles.text}>Synced {formatRelative(lastSyncAt)}</Text>
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface
  },
  chipError: {
    backgroundColor: theme.colors.dangerLight
  },
  chipPressed: {
    opacity: 0.7
  },
  text: {
    ...theme.typography.small,
    color: theme.colors.muted
  }
})

export default SyncChip
