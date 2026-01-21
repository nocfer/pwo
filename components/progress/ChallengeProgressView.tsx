import { useChallengeProgress, usePrograms } from '@/hooks/data'
import { theme } from '@/theme/theme'
import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { ProgressViewBase } from './ProgressViewBase'

type Props = {
  challengeId: string
}

export default function ChallengeProgressView({ challengeId }: Props) {
  const { data: programs } = usePrograms()
  const challenge = useMemo(
    () => programs?.find(p => p.id === challengeId && p.challengeConfig),
    [programs, challengeId]
  )
  const { metrics, loading } = useChallengeProgress(challenge || undefined)

  const stats = useMemo(() => {
    if (!metrics) return []
    return [
      { label: 'Total Reps', value: metrics.totalRepsCompleted },
      { label: 'Target Reps', value: metrics.targetReps },
      { label: 'Current Streak', value: `${metrics.currentStreak} days` },
      {
        label: 'Sessions Done',
        value: `${metrics.sessionsCompleted}/${metrics.totalSessions}`
      }
    ]
  }, [metrics])

  // Reps progress bar as custom content
  const repsProgressContent = metrics ? (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reps Progress</Text>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(100, metrics.repsProgressPercentage)}%`,
              backgroundColor: theme.colors.success
            }
          ]}
        />
      </View>
      <Text style={styles.caption}>
        {metrics.totalRepsCompleted} / {metrics.targetReps} reps (
        {Math.round(metrics.repsProgressPercentage)}%)
      </Text>
    </View>
  ) : null

  return (
    <ProgressViewBase
      loading={loading || !metrics}
      title={challenge?.name || 'Challenge'}
      completionPercentage={metrics?.completionPercentage ?? 0}
      sessionsCompleted={metrics?.sessionsCompleted ?? 0}
      totalSessions={metrics?.totalSessions ?? 0}
      variant="challenge"
      stats={stats}
      nextSessionIndex={metrics?.nextSessionIndex}
      isCompleted={metrics?.isCompleted}
    >
      {repsProgressContent}
    </ProgressViewBase>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    borderRadius: theme.radius.md
  },
  caption: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs
  }
})
