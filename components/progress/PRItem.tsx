/**
 * PRItem - Single personal record row
 */

import { isPRRecent } from '@/hooks/data'
import { theme } from '@/theme/theme'
import type { PersonalRecord } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

type Props = {
  pr: PersonalRecord
  exerciseName: string
  exerciseIcon?: string
  index?: number
}

function formatPRValue(pr: PersonalRecord): string {
  switch (pr.type) {
    case 'max_reps':
      return `${pr.value} reps`
    case 'max_weight':
      return pr.details ? `${pr.value}kg × ${pr.details.reps}` : `${pr.value}kg`
    case 'max_volume':
      return `${pr.value}kg volume`
    case 'estimated_1rm':
      return `~${pr.value}kg 1RM`
    default:
      return String(pr.value)
  }
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export default function PRItem({
  pr,
  exerciseName,
  exerciseIcon = 'barbell',
  index = 0
}: Props) {
  const isNew = isPRRecent(pr, 7)
  const scaleAnim = useRef(new Animated.Value(0.95)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Staggered entrance animation
    const entranceAnim = Animated.sequence([
      Animated.delay(index * 50),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ])
    ])
    entranceAnim.start()

    // Pulse animation for "NEW" badge
    let pulseLoop: Animated.CompositeAnimation | null = null
    if (isNew) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true
          })
        ])
      )
      pulseLoop.start()
    }

    return () => {
      entranceAnim.stop()
      pulseLoop?.stop()
    }
  }, [index, isNew, scaleAnim, opacityAnim, pulseAnim])

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={exerciseIcon as any}
          size={20}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.exerciseName} numberOfLines={1}>
          {exerciseName}
        </Text>
        <Text style={[styles.value, !isNew && styles.valueOld]}>
          {formatPRValue(pr)}
        </Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.date}>{formatDate(pr.achievedAt)}</Text>
        {isNew && (
          <Animated.View
            style={[styles.newBadge, { transform: [{ scale: pulseAnim }] }]}
          >
            <Text style={styles.newBadgeText}>NEW!</Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flex: 1
  },
  exerciseName: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: 2
  },
  value: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 19,
    color: theme.colors.primary
  },
  valueOld: {
    color: theme.colors.text
  },
  meta: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  newBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.sm
  },
  newBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.textInverse,
    fontFamily: theme.fonts.bold,
    fontSize: 10
  }
})
