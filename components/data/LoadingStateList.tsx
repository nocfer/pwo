/**
 * LoadingStateList - Enhanced loading states for data lists
 *
 * Provides skeleton loading states that match the actual list item structure
 * Requirements: 1.4, 1.5
 */

import { theme } from '@/theme/theme'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { Skeleton } from '../common'

type Props = {
  itemCount?: number
  showSearch?: boolean
  style?: ViewStyle
}

// Per-row shimmer offset (ms) for the staggered ripple down the list.
const ROW_STAGGER = 120

export function LoadingStateList({
  itemCount = 5,
  showSearch = true,
  style
}: Props) {
  return (
    <View style={[styles.container, style]}>
      {/* Search skeleton */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Skeleton
            height={44}
            borderRadius={theme.radius.lg}
            style={{ width: '100%' }}
          />
        </View>
      )}

      {/* List items skeleton */}
      <View style={styles.listContainer}>
        {Array.from({ length: itemCount }, (_, index) => {
          // Ripple the shimmer down the list instead of pulsing in unison.
          const delay = index * ROW_STAGGER
          return (
            <View key={index} style={styles.itemContainer}>
              {/* Icon skeleton */}
              <Skeleton
                width={40}
                height={40}
                borderRadius={theme.radius.md}
                delay={delay}
                style={styles.itemIcon}
              />

              {/* Content skeleton */}
              <View style={styles.itemContent}>
                {/* Title and badge */}
                <View style={styles.itemHeader}>
                  <Skeleton
                    height={18}
                    borderRadius={theme.radius.sm}
                    delay={delay}
                    style={{ width: '60%' }}
                  />
                  <Skeleton
                    width={60}
                    height={16}
                    borderRadius={theme.radius.sm}
                    delay={delay}
                  />
                </View>

                {/* Description */}
                <View style={{ width: '80%' }}>
                  <Skeleton
                    height={14}
                    borderRadius={theme.radius.sm}
                    delay={delay}
                    style={styles.descriptionSkeleton}
                  />
                </View>

                {/* Metadata */}
                <View style={styles.metadata}>
                  <Skeleton
                    width={80}
                    height={12}
                    borderRadius={theme.radius.sm}
                    delay={delay}
                  />
                  <Skeleton
                    width={60}
                    height={12}
                    borderRadius={theme.radius.sm}
                    delay={delay}
                  />
                </View>
              </View>

              {/* Chevron skeleton */}
              <Skeleton
                width={20}
                height={20}
                borderRadius={theme.radius.sm}
                delay={delay}
              />
            </View>
          )
        })}
      </View>
    </View>
  )
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
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm
  },
  itemIcon: {
    marginRight: theme.spacing.md
  },
  itemContent: {
    flex: 1
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm
  },
  descriptionSkeleton: {
    marginBottom: theme.spacing.sm
  },
  metadata: {
    flexDirection: 'row',
    gap: theme.spacing.md
  }
})

export default LoadingStateList
