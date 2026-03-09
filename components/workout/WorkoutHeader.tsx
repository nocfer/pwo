import { theme } from '@/theme/theme'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export type WorkoutHeaderProps = {
  programName: string
  sessionName?: string
  elapsedMs: number
  onEnd: () => void
}

export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad2 = (n: number) => String(n).padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(seconds)}`
  }
  return `${minutes}:${pad2(seconds)}`
}

export function WorkoutHeader({
  programName,
  sessionName,
  elapsedMs,
  onEnd
}: WorkoutHeaderProps) {
  return (
    <View style={styles.container}>
      <Text
        style={styles.timer}
        accessibilityRole="timer"
        accessibilityLiveRegion="polite"
      >
        {formatElapsedTime(elapsedMs)}
      </Text>

      <View style={styles.info}>
        <Text style={styles.programName} numberOfLines={1}>
          {programName}
        </Text>
        {sessionName ? (
          <Text style={styles.sessionName} numberOfLines={1}>
            {sessionName}
          </Text>
        ) : null}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.endButton,
          pressed && styles.endButtonPressed
        ]}
        onPress={onEnd}
        accessibilityRole="button"
        accessibilityLabel="End workout"
      >
        <Text style={styles.endButtonText}>End</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md
  },
  timer: {
    ...theme.typography.display,
    color: theme.colors.text
  },
  info: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
    alignItems: 'flex-end'
  },
  programName: {
    ...theme.typography.caption,
    color: theme.colors.subtext
  },
  sessionName: {
    ...theme.typography.small,
    color: theme.colors.muted
  },
  endButton: {
    backgroundColor: theme.colors.dangerLight,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  endButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }]
  },
  endButtonText: {
    ...theme.typography.caption,
    color: theme.colors.danger
  }
})
