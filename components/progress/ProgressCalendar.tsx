import { useConsistencyData } from '@/hooks/data/useConsistencyData'
import { theme } from '@/theme/theme'
import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

type Props = {
  programId?: string
  challengeId?: string
  month?: number // 0-11
  year?: number
}

export default function ProgressCalendar({
  programId,
  challengeId,
  month,
  year
}: Props) {
  const { data: consistencyData, loading } = useConsistencyData()

  const targetDate = useMemo(() => {
    const now = new Date()
    return new Date(year ?? now.getFullYear(), month ?? now.getMonth(), 1)
  }, [month, year])

  const completedDates = useMemo(() => {
    const dates = new Set<string>()
    if (!consistencyData) return dates

    for (const week of consistencyData.weeks) {
      for (const day of week.days) {
        if (day.workoutCount > 0 && !day.isFuture) {
          dates.add(day.date)
        }
      }
    }
    return dates
  }, [consistencyData])

  const daysInMonth = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfWeek = targetDate.getDay()
  const monthName = targetDate.toLocaleDateString('en-US', { month: 'long' })
  const yearNum = targetDate.getFullYear()

  const days = useMemo(() => {
    const result: { day: number; date: string; isToday: boolean }[] = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      result.push({ day: 0, date: '', isToday: false })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        day
      )
      const dateStr = date.toISOString().slice(0, 10)
      const isToday =
        date.getTime() === today.getTime() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

      result.push({ day, date: dateStr, isToday })
    }

    return result
  }, [targetDate, daysInMonth, firstDayOfWeek])

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading calendar...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.monthYear}>
          {monthName} {yearNum}
        </Text>
      </View>

      <View style={styles.weekDays}>
        {weekDays.map(day => (
          <View key={day} style={styles.weekDay}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((item, index) => {
          if (item.day === 0) {
            return <View key={index} style={styles.dayCell} />
          }

          const isCompleted = completedDates.has(item.date)

          return (
            <View
              key={index}
              style={[
                styles.dayCell,
                isCompleted && styles.dayCellCompleted,
                item.isToday && styles.dayCellToday
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  isCompleted && styles.dayTextCompleted,
                  item.isToday && styles.dayTextToday
                ]}
              >
                {item.day}
              </Text>
              {isCompleted && <View style={styles.checkmark} />}
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm
  },
  header: {
    marginBottom: theme.spacing.md,
    alignItems: 'center'
  },
  monthYear: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontFamily: theme.fonts.bold
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
    padding: theme.spacing.lg
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs
  },
  weekDay: {
    flex: 1,
    alignItems: 'center'
  },
  weekDayText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontFamily: theme.fonts.semiBold
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  dayCellCompleted: {
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.radius.sm
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.sm
  },
  dayText: {
    ...theme.typography.body,
    color: theme.colors.text
  },
  dayTextCompleted: {
    color: theme.colors.success,
    fontFamily: theme.fonts.semiBold
  },
  dayTextToday: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold
  },
  checkmark: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success
  }
})
