import { theme } from '@/theme/theme'
import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'

type Props = {
  title: string
  completionPercentage: number
  sessionsCompleted: number
  totalSessions: number
  variant?: 'challenge' | 'program'
}

export default function ProgressCard({
  title,
  completionPercentage,
  sessionsCompleted,
  totalSessions,
  variant = 'program'
}: Props) {
  const percentage = Math.round(completionPercentage)
  const isChallenge = variant === 'challenge'
  const primaryColor = isChallenge ? theme.colors.success : theme.colors.primary

  return (
    <View style={styles.container}>
      {/* Header with icon and title */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isChallenge
                ? theme.colors.successLight
                : theme.colors.primaryLight
            }
          ]}
        >
          <Ionicons
            name={isChallenge ? 'trophy' : 'barbell'}
            size={20}
            color={primaryColor}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {sessionsCompleted} of {totalSessions} sessions
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${percentage}%`,
              backgroundColor: primaryColor
            }
          ]}
        />
      </View>

      {/* Footer with percentage and status */}
      <View style={styles.footer}>
        <Text style={styles.statusText}>
          {sessionsCompleted === 0
            ? "Let's get started"
            : percentage >= 100
              ? 'Run complete'
              : 'Keep going'}
        </Text>
        <View
          style={[styles.percentageBadge, { backgroundColor: primaryColor }]}
        >
          <Text style={styles.percentage}>{percentage}%</Text>
        </View>
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
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  title: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    marginBottom: theme.spacing.md
  },
  progressBar: {
    height: '100%',
    borderRadius: theme.radius.sm
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  percentageBadge: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center'
  },
  percentage: {
    ...theme.typography.h2,
    color: theme.colors.primaryTextOn,
    fontFamily: theme.fonts.bold
  }
})
