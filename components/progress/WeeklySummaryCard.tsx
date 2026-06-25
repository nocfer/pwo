/**
 * WeeklySummaryCard - Hero card showing this week's progress
 */

import { Skeleton } from '@/components/common/Skeleton'
import { useConsistencyData, useWeeklyStats } from '@/hooks/data'
import { isLoadFailure } from '@/lib/api'
import { theme } from '@/theme/theme'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useMemo, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import ProgressCardError from './ProgressCardError'
import ProgressEmptyState from './ProgressEmptyState'

type Props = {
  onStartWorkout?: () => void
}

const MINI_BARS = 5

export default function WeeklySummaryCard({ onStartWorkout }: Props) {
  const { stats, loading, error } = useWeeklyStats()
  // Recent weekly totals — drives both the mini bar chart and the
  // "vs last week" delta (one source avoids a redundant fetch and the
  // timezone skew of a client-computed previous-week date).
  const { data: consistency } = useConsistencyData(MINI_BARS)

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

  const weeklyTotals = useMemo(() => {
    const totals =
      consistency?.weeks.map(week =>
        week.days.reduce((sum, day) => sum + day.workoutCount, 0)
      ) ?? []
    const trimmed = totals.slice(-MINI_BARS)
    while (trimmed.length < MINI_BARS) trimmed.unshift(0)
    return trimmed
  }, [consistency])

  if (loading) {
    return (
      <View style={styles.card}>
        <Skeleton height={120} borderRadius={theme.radius.sm} />
      </View>
    )
  }

  // A real load failure with nothing cached → error (not "no data yet").
  if (isLoadFailure(error) && !stats) {
    return <ProgressCardError title="Couldn't load this week" />
  }

  const completed = stats?.workoutsCompleted ?? 0
  // Current vs previous week from the same consistency series (0 until loaded).
  const delta = weeklyTotals[MINI_BARS - 1] - weeklyTotals[MINI_BARS - 2]

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const formatRange = (dateStr?: string) =>
    dateStr
      ? parseLocalDate(dateStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      : ''

  const weekStart = formatRange(stats?.weekStart)
  const weekEnd = formatRange(stats?.weekEnd)

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
          actionLabel="Start your first workout"
        />
      </View>
    )
  }

  const maxBar = Math.max(...weeklyTotals, 1)

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.title}>This Week</Text>
        <Text style={styles.dateRange}>
          {weekStart} - {weekEnd}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.summarySection}>
          <View style={styles.bigNumberRow}>
            <Text style={styles.bigNumber}>{completed}</Text>
            <Text style={styles.bigNumberUnit}>
              {completed === 1 ? 'workout' : 'workouts'}
            </Text>
          </View>
          <View style={styles.deltaRow}>
            <Ionicons
              name={
                delta > 0 ? 'arrow-up' : delta < 0 ? 'arrow-down' : 'remove'
              }
              size={13}
              color={
                delta > 0
                  ? theme.colors.success
                  : delta < 0
                    ? theme.colors.danger
                    : theme.colors.muted
              }
            />
            <Text
              style={[
                styles.deltaText,
                {
                  color:
                    delta > 0
                      ? theme.colors.success
                      : delta < 0
                        ? theme.colors.danger
                        : theme.colors.muted
                }
              ]}
            >
              {delta === 0
                ? 'Same as last week'
                : `${delta > 0 ? '+' : ''}${delta} vs last week`}
            </Text>
          </View>
        </View>

        <View style={styles.miniChart}>
          {weeklyTotals.map((value, index) => {
            const isCurrent = index === weeklyTotals.length - 1
            const isActive = value > 0
            return (
              <View key={index} style={styles.miniBarColumn}>
                <View style={styles.miniBarWrapper}>
                  <View
                    style={[
                      styles.miniBar,
                      {
                        height: `${Math.max((value / maxBar) * 100, 8)}%`,
                        backgroundColor: isActive
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                        opacity: isActive && !isCurrent ? 0.55 : 1
                      }
                    ]}
                  />
                </View>
              </View>
            )
          })}
        </View>
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.spacing.lg
  },
  summarySection: {
    flex: 1
  },
  bigNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.sm
  },
  bigNumber: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 40,
    color: theme.colors.text,
    letterSpacing: -1
  },
  bigNumberUnit: {
    ...theme.typography.body,
    color: theme.colors.subtext
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs
  },
  deltaText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
    height: 56,
    width: 96
  },
  miniBarColumn: {
    flex: 1,
    height: '100%'
  },
  miniBarWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xs,
    overflow: 'hidden',
    justifyContent: 'flex-end'
  },
  miniBar: {
    width: '100%',
    borderRadius: theme.radius.xs,
    minHeight: 4
  }
})
