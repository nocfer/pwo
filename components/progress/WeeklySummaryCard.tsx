/**
 * WeeklySummaryCard - Hero card showing this week's progress
 */

import { useWeeklyStats } from '@/hooks/data'
import { formatDuration } from '@/lib/utils/format'
import { theme } from '@/theme/theme'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import ProgressEmptyState from './ProgressEmptyState'
import RingChart from './RingChart'

type Props = {
  onStartWorkout?: () => void
}

export default function WeeklySummaryCard({ onStartWorkout }: Props) {
  const { stats, loading } = useWeeklyStats()
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

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.skeleton} />
      </View>
    )
  }

  const completed = stats?.workoutsCompleted ?? 0
  const goal = stats?.workoutGoal ?? 4
  const percentage = goal > 0 ? Math.min(100, (completed / goal) * 100) : 0
  const timeFormatted = formatDuration(
    stats?.totalTimeSeconds ?? 0,
    'shortWithSuffix'
  )
  const streak = stats?.currentStreak ?? 0

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const weekStart = stats?.weekStart
    ? parseLocalDate(stats.weekStart).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    : ''
  const weekEnd = stats?.weekEnd
    ? parseLocalDate(stats.weekEnd).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    : ''

  if (completed === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>This Week</Text>
          <Text style={styles.dateRange}>
            {weekStart} - {weekEnd}
          </Text>
        </View>
        <ProgressEmptyState
          type="no-workouts"
          onAction={onStartWorkout}
          actionLabel="Start Workout"
        />
      </View>
    )
  }

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.title}>This Week</Text>
        <Text style={styles.dateRange}>
          {weekStart} - {weekEnd}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.ringSection}>
          <RingChart
            percentage={percentage}
            size={100}
            strokeWidth={10}
            labelText={`${completed}/${goal}`}
          />
        </View>

        <View style={styles.statsSection}>
          <StatRow
            icon="fitness"
            label="Workouts"
            value={`${completed} completed`}
            color={theme.colors.primary}
          />
          <StatRow
            icon="time"
            label="Time"
            value={timeFormatted || '0m'}
            color={theme.colors.phases.working}
          />
          <StatRow
            icon="barbell"
            label="Volume"
            value={
              (stats?.totalVolume ?? 0) > 0
                ? `${stats?.totalVolume?.toLocaleString()} kg`
                : 'No data'
            }
            color={theme.colors.accent}
            highlight={(stats?.totalVolume ?? 0) > 0}
          />
        </View>
      </View>

      {streak > 0 && (
        <View style={styles.streakContainer}>
          <Ionicons name="flame" size={16} color={theme.colors.accent} />
          <Text style={styles.streakText}>
            Current streak:{' '}
            <Text style={styles.streakValue}>{streak} days</Text>
          </Text>
        </View>
      )}
    </Animated.View>
  )
}

function StatRow({
  icon,
  label,
  value,
  color,
  highlight = false
}: {
  icon: string
  label: string
  value: string
  color: string
  highlight?: boolean
}) {
  return (
    <View style={styles.statRow}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={14} color={color} />
      </View>
      <View style={styles.statText}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text
          style={[styles.statValue, highlight && styles.statValueHighlight]}
        >
          {value}
        </Text>
      </View>
    </View>
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
  title: {
    ...theme.typography.h2,
    color: theme.colors.text
  },
  dateRange: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg
  },
  ringSection: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  statsSection: {
    flex: 1,
    gap: theme.spacing.sm
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statText: {
    flex: 1
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  statValue: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    fontSize: 14
  },
  statValueHighlight: {
    color: theme.colors.accent
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight
  },
  streakText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 14
  },
  streakValue: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.accent
  },
  skeleton: {
    height: 180,
    backgroundColor: theme.colors.skeleton,
    borderRadius: theme.radius.sm
  }
})
