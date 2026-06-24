import { theme } from '@/theme/theme'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export type LogActionBarProps = {
  setNumber: number
  exerciseName: string
  weight: number
  reps: number
  onLog: () => void
}

export function LogActionBar({
  setNumber,
  exerciseName,
  weight,
  reps,
  onLog
}: LogActionBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        <View style={styles.info}>
          <Text style={styles.label} numberOfLines={1}>
            SET {setNumber} · {exerciseName.toUpperCase()}
          </Text>
          <Text style={styles.target}>
            {weight} lb × {reps}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.logButton, pressed && styles.logPressed]}
          onPress={onLog}
          accessibilityRole="button"
          accessibilityLabel={`Log set ${setNumber}, ${weight} pounds for ${reps} reps`}
        >
          <Text style={styles.logText}>Log</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: theme.colors.session.appBg
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.session.panel,
    borderWidth: 1,
    borderColor: theme.colors.session.hairline,
    borderRadius: 20,
    paddingVertical: 10,
    paddingLeft: 17,
    paddingRight: 10
  },
  info: {
    flex: 1
  },
  label: {
    fontSize: 9,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: 1,
    color: theme.colors.session.faint
  },
  target: {
    fontSize: 16,
    fontFamily: theme.fonts.displayMed,
    color: theme.colors.session.textPrimary,
    marginTop: 3,
    fontVariant: ['tabular-nums']
  },
  logButton: {
    height: 50,
    paddingHorizontal: 28,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.session.lime
  },
  logPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  logText: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.session.onLime
  }
})
