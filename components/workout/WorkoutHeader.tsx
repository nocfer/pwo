import { formatClock } from '@/lib/utils/format'
import { theme } from '@/theme/theme'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export type WorkoutHeaderProps = {
  programName: string
  subtitle?: string
  elapsedMs: number
  onEnd: () => void
}

/** @deprecated use formatClock from lib/utils/format */
export const formatElapsedTime = formatClock

export function WorkoutHeader({
  programName,
  subtitle,
  elapsedMs,
  onEnd
}: WorkoutHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.programName} numberOfLines={1}>
          {programName}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <View
          style={styles.elapsedPill}
          accessibilityRole="timer"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Elapsed time ${formatElapsedTime(elapsedMs)}`}
        >
          <Text style={styles.elapsedText}>{formatElapsedTime(elapsedMs)}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.endPill,
            pressed && styles.endPillPressed
          ]}
          onPress={onEnd}
          accessibilityRole="button"
          accessibilityLabel="End workout"
        >
          <Text style={styles.endText}>End</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingHorizontal: 22,
    paddingBottom: 14,
    gap: theme.spacing.md
  },
  info: {
    flex: 1
  },
  programName: {
    fontSize: 22,
    fontFamily: theme.fonts.display,
    letterSpacing: -0.4,
    color: theme.colors.session.textPrimary
  },
  subtitle: {
    fontSize: 13,
    fontFamily: theme.fonts.medium,
    color: theme.colors.session.muted,
    marginTop: 2
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  elapsedPill: {
    backgroundColor: theme.colors.session.panel,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center'
  },
  elapsedText: {
    fontSize: 13,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.subtext,
    fontVariant: ['tabular-nums']
  },
  endPill: {
    backgroundColor: theme.colors.session.dangerTintBg,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  endPillPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }]
  },
  endText: {
    fontSize: 13,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.danger
  }
})
