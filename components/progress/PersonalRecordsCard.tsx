/**
 * PersonalRecordsCard - Display recent PRs
 */

import { isPRRecent, useExercises, usePRs } from '@/hooks/data'
import { theme } from '@/theme/theme'
import { Exercise } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useMemo, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import PRItem from './PRItem'
import ProgressEmptyState from './ProgressEmptyState'

type Props = {
  limit?: number
  onViewAll?: () => void
}

export default function PersonalRecordsCard({ limit = 3, onViewAll }: Props) {
  const { data: prsData, loading } = usePRs(limit)
  const { data: exercises } = useExercises()
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }).start()
    }
  }, [loading, fadeAnim])

  const exerciseMap = useMemo(() => {
    const map = new Map<string, { name: string; icon?: string }>()
    exercises?.forEach((ex: Exercise) => {
      map.set(ex.id, { name: ex.name, icon: ex.icon })
    })
    return map
  }, [exercises])

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.skeleton} />
      </View>
    )
  }

  const prs = prsData?.latestPRs ?? []
  const newCount = prs.filter(pr => isPRRecent(pr, 7)).length

  if (prs.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons
              name="trophy"
              size={18}
              color={theme.colors.accent}
              style={styles.titleIcon}
            />
            <Text style={styles.title}>Personal Records</Text>
          </View>
        </View>
        <ProgressEmptyState type="no-prs" />
      </View>
    )
  }

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name="trophy"
            size={18}
            color={theme.colors.accent}
            style={styles.titleIcon}
          />
          <Text style={styles.title}>Personal Records</Text>
          {newCount > 0 && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>{newCount} NEW</Text>
            </View>
          )}
        </View>
        {onViewAll && prs.length >= limit && (
          <Pressable
            onPress={onViewAll}
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && styles.viewAllButtonPressed
            ]}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={theme.colors.primary}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.prList}>
        {prs.map((pr, index) => {
          const exercise = exerciseMap.get(pr.exerciseId)
          return (
            <PRItem
              key={pr.id}
              pr={pr}
              exerciseName={exercise?.name ?? pr.exerciseId}
              exerciseIcon={exercise?.icon}
              index={index}
            />
          )
        })}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  newBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.sm
  },
  newBadgeText: {
    ...theme.typography.small,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
    letterSpacing: 0.5
  },
  titleIcon: {
    marginRight: theme.spacing.xs
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  viewAllButtonPressed: {
    opacity: 0.7
  },
  viewAllText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  prList: {
    gap: theme.spacing.sm
  },
  skeleton: {
    height: 180,
    backgroundColor: theme.colors.skeleton,
    borderRadius: theme.radius.sm
  }
})
