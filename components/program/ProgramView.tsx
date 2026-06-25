import { ProgramProgressMetrics, useExerciseNames } from '@/hooks/data'
import { getFirstReps, getTotalReps } from '@/lib/utils/format'
import { theme } from '@/theme/theme'
import { Program } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AnimatedCard } from '../common'

type Props = { program: Program; programMetrics: ProgramProgressMetrics }

// Format seconds to human-readable time (e.g., "15 min", "1h 30m")
function formatEstimatedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  return `${minutes} min`
}

export default function ProgramView({ program, programMetrics }: Props) {
  const blockExerciseIds = useMemo(
    () => program.blocks.map(b => b.exerciseId),
    [program.blocks]
  )
  const exerciseNames = useExerciseNames(blockExerciseIds)
  const hasSessions = programMetrics.totalSessions > 0
  const nextSessionIndex = programMetrics.nextSessionIndex ?? 1
  const hasCompletedBefore = programMetrics.lifetimeSessionsCompleted > 0
  const ctaLabel = hasCompletedBefore ? 'Start Again' : 'Start Workout'

  // Calculate workout stats
  const stats = useMemo(() => {
    let totalSets = 0
    let totalReps = 0
    let warmupSeconds = 0
    let restSeconds = 0
    const exerciseIds = new Set<string>()

    program.blocks.forEach(block => {
      exerciseIds.add(block.exerciseId)
      const sets = block.sets ?? 1
      totalSets += sets
      totalReps += getTotalReps(block.targetReps, sets)
      // Add rest between sets
      if (sets > 1) {
        restSeconds += (block.restBetweenSets ?? 60) * (sets - 1)
      }
    })

    if (program.initialWarmup) {
      warmupSeconds += program.initialWarmup.seconds
    }

    // Estimate total workout time (rough: 30s per set + rest + warmup)
    const estimatedSeconds = totalSets * 30 + restSeconds + warmupSeconds

    return {
      totalExercises: exerciseIds.size,
      totalSets,
      totalReps,
      warmupSeconds,
      estimatedSeconds
    }
  }, [program.blocks, program.initialWarmup])

  // Get unique exercises with details
  const exerciseDetails = useMemo(() => {
    const details: {
      id: string
      name: string
      sets: number
      reps: number
    }[] = []
    const seen = new Set<string>()

    program.blocks.forEach(block => {
      if (!seen.has(block.exerciseId)) {
        seen.add(block.exerciseId)
        const name =
          block.exerciseName ??
          exerciseNames.get(block.exerciseId) ??
          block.exerciseId
        const sets = block.sets ?? 1
        const reps = getFirstReps(block.targetReps)
        details.push({ id: block.exerciseId, name, sets, reps })
      }
    })

    return details
  }, [program.blocks, exerciseNames])

  const handleStartWorkout = () => {
    router.navigate({
      pathname: '/programs/[id]/session/[index]',
      params: {
        id: program.id,
        index: String(nextSessionIndex)
      }
    })
  }

  return (
    <>
      {/* Hero Start Card */}
      <AnimatedCard>
        <Pressable
          disabled={!hasSessions}
          onPress={handleStartWorkout}
          style={({ pressed }) => [
            styles.heroCard,
            pressed && styles.heroCardPressed,
            !hasSessions && styles.heroCardDisabled
          ]}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <Ionicons
                name="play"
                size={24}
                color={theme.colors.primaryTextOn}
              />
            </View>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>{ctaLabel}</Text>
              {stats.estimatedSeconds > 0 && (
                <Text style={styles.heroSubtitle}>
                  ~{formatEstimatedTime(stats.estimatedSeconds)}
                </Text>
              )}
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.primaryTextOn}
          />
        </Pressable>
      </AnimatedCard>

      {/* Description */}
      {program.description && (
        <AnimatedCard delay={50}>
          <View style={styles.card}>
            <Text style={styles.description}>{program.description}</Text>
          </View>
        </AnimatedCard>
      )}

      {/* Quick Stats Row */}
      <AnimatedCard delay={100}>
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Ionicons
              name="barbell-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={styles.statPillText}>
              {stats.totalExercises} exercise
              {stats.totalExercises !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons
              name="repeat-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={styles.statPillText}>{stats.totalSets} sets</Text>
          </View>
          {stats.totalReps > 0 && (
            <View style={styles.statPill}>
              <Ionicons
                name="flame-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.statPillText}>{stats.totalReps} reps</Text>
            </View>
          )}
        </View>
      </AnimatedCard>

      {/* Exercises List */}
      {exerciseDetails.length > 0 && (
        <AnimatedCard delay={150}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            <View style={styles.exercisesList}>
              {exerciseDetails.map((exercise, index) => (
                <View
                  key={exercise.id}
                  style={[
                    styles.exerciseItem,
                    index === exerciseDetails.length - 1 &&
                      styles.exerciseItemLast
                  ]}
                >
                  <View style={styles.exerciseIndex}>
                    <Text style={styles.exerciseIndexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName} numberOfLines={1}>
                      {exercise.name}
                    </Text>
                    <Text style={styles.exerciseDetail}>
                      {exercise.sets > 1
                        ? `${exercise.sets} sets × ${exercise.reps} reps`
                        : exercise.reps > 0
                          ? `${exercise.reps} reps`
                          : 'Self-guided'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </AnimatedCard>
      )}

      {/* Lifetime Stats (only show if user has completed workouts) */}
      {hasCompletedBefore && (
        <AnimatedCard delay={200}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <View style={styles.lifetimeStats}>
              <View style={styles.lifetimeStat}>
                <Text style={styles.lifetimeStatValue}>
                  {programMetrics.lifetimeSessionsCompleted}
                </Text>
                <Text style={styles.lifetimeStatLabel}>
                  workout
                  {programMetrics.lifetimeSessionsCompleted !== 1
                    ? 's'
                    : ''}{' '}
                  completed
                </Text>
              </View>
              {programMetrics.lifetimeTimeSpentSeconds > 0 && (
                <View style={styles.lifetimeStat}>
                  <Text style={styles.lifetimeStatValue}>
                    {formatEstimatedTime(
                      programMetrics.lifetimeTimeSpentSeconds
                    )}
                  </Text>
                  <Text style={styles.lifetimeStatLabel}>total time</Text>
                </View>
              )}
            </View>
          </View>
        </AnimatedCard>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg
  },
  heroCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  heroCardDisabled: {
    opacity: 0.5
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroTextContainer: {
    gap: theme.spacing.xs
  },
  heroTitle: {
    ...theme.typography.h2,
    color: theme.colors.primaryTextOn
  },
  heroSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.primaryTextOn,
    opacity: 0.8
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    lineHeight: 22
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full
  },
  statPillText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  exercisesList: {
    gap: 0
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight
  },
  exerciseItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0
  },
  exerciseIndex: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  exerciseIndexText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.muted
  },
  exerciseInfo: {
    flex: 1,
    gap: theme.spacing.xs
  },
  exerciseName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  exerciseDetail: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  lifetimeStats: {
    flexDirection: 'row',
    gap: theme.spacing.lg
  },
  lifetimeStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md
  },
  lifetimeStatValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs
  },
  lifetimeStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textAlign: 'center'
  }
})
