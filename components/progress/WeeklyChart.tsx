import { getTodayIndex } from '@/lib/utils/date'
import { theme } from '@/theme/theme'
import React, { useEffect, useMemo, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

type WeeklyChartProps = {
  data: number[]
  maxValue?: number
  title?: string
}

const ALL_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/**
 * Computes shifted data aligned to today (today is always the last element)
 */
function useShiftedWeeklyData(data: number[], todayIndex: number) {
  return useMemo(() => {
    const paddedData = [...data]
    while (paddedData.length < 7) {
      paddedData.unshift(0)
    }

    const days = Array.from({ length: 7 }, (_, i) => {
      const dayIndex = (todayIndex + i + 1) % 7
      return ALL_DAYS[dayIndex]
    })

    const shifted = Array.from({ length: 7 }, (_, i) => {
      const dayIndex = (todayIndex + i + 1) % 7
      return paddedData[dayIndex] ?? 0
    })

    return { shiftedData: shifted, shiftedDays: days }
  }, [data, todayIndex])
}

export function WeeklyChart({
  data,
  maxValue,
  title = 'This Week'
}: WeeklyChartProps) {
  const todayIndex = getTodayIndex()
  const { shiftedData, shiftedDays } = useShiftedWeeklyData(data, todayIndex)

  const animatedValues = useRef(
    shiftedData.map(() => new Animated.Value(0))
  ).current
  const max = maxValue || Math.max(...shiftedData, 1)

  useEffect(() => {
    const animations = shiftedData.map((value, index) => {
      return Animated.timing(animatedValues[index], {
        toValue: value / max,
        duration: 400,
        delay: index * 50,
        useNativeDriver: false
      })
    })
    Animated.parallel(animations).start()
  }, [shiftedData, max, animatedValues])

  const total = shiftedData.reduce((sum, val) => sum + val, 0)
  const activeDays = shiftedData.filter(v => v > 0).length

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.summaryPills}>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryValue}>{total}</Text>
            <Text style={styles.summaryLabel}>workouts</Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryValue}>{activeDays}</Text>
            <Text style={styles.summaryLabel}>days</Text>
          </View>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        {shiftedData.map((value, index) => {
          const height = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['8%', '100%']
          })

          const isActive = value > 0
          const isToday = index === 6

          return (
            <View key={index} style={styles.barColumn}>
              <View style={styles.barWrapper}>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: isActive
                        ? theme.colors.primary
                        : theme.colors.borderLight
                    }
                  ]}
                />
              </View>
              <View style={styles.dayLabelContainer}>
                <Text
                  style={[styles.dayLabel, isToday && styles.dayLabelToday]}
                >
                  {shiftedDays[index]}
                </Text>
                {isToday && <View style={styles.todayIndicator} />}
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export function WeeklyChartCompact({ data }: { data: number[] }) {
  const todayIndex = getTodayIndex()
  const { shiftedData } = useShiftedWeeklyData(data, todayIndex)
  const max = Math.max(...shiftedData, 1)

  return (
    <View style={styles.compactContainer}>
      {shiftedData.map((value, index) => {
        const heightPercent = Math.max((value / max) * 100, 8)
        const isActive = value > 0

        return (
          <View key={index} style={styles.compactBarColumn}>
            <View style={styles.compactBarWrapper}>
              <View
                style={[
                  styles.compactBar,
                  {
                    height: `${heightPercent}%`,
                    backgroundColor: isActive
                      ? theme.colors.success
                      : theme.colors.borderLight
                  }
                ]}
              />
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  summaryPills: {
    flexDirection: 'row',
    gap: theme.spacing.sm
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.full
  },
  summaryValue: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  },
  summaryLabel: {
    ...theme.typography.small,
    color: theme.colors.muted
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
    gap: theme.spacing.sm
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%'
  },
  barWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 28,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end'
  },
  bar: {
    width: '100%',
    borderRadius: theme.radius.sm,
    minHeight: 4
  },
  dayLabelContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    height: 20
  },
  dayLabel: {
    ...theme.typography.small,
    color: theme.colors.muted
  },
  dayLabelToday: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginTop: 2
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 32,
    gap: 3
  },
  compactBarColumn: {
    flex: 1,
    height: '100%'
  },
  compactBarWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end'
  },
  compactBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4
  }
})

export default WeeklyChart
