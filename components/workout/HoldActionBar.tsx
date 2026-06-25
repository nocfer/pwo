/**
 * HoldActionBar — the footer control for the active *timed* set, the count-up
 * counterpart to {@link LogActionBar}. It mirrors that bar's placement and
 * panel styling but swaps the single "Log" for the hold lifecycle:
 *   ready  → "Start hold"            (begins the count-up)
 *   holding→ "Pause" | "Done early"  (freeze / log the elapsed seconds now)
 *   paused → "Resume" | "Done early"
 * The live ring itself lives in the expanded card (so it stays put across
 * ready→holding); this bar only carries the lifecycle buttons.
 */

import { formatClock } from '@/lib/utils/format'
import { theme } from '@/theme/theme'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export type HoldPhase = 'ready' | 'holding' | 'paused'

export type HoldActionBarProps = {
  phase: HoldPhase
  setNumber: number
  exerciseName: string
  targetSeconds: number
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onDoneEarly: () => void
}

export function HoldActionBar({
  phase,
  setNumber,
  exerciseName,
  targetSeconds,
  onStart,
  onPause,
  onResume,
  onDoneEarly
}: HoldActionBarProps) {
  if (phase === 'ready') {
    return (
      <View style={styles.wrapper}>
        <View style={styles.bar}>
          <View style={styles.info}>
            <Text style={styles.label} numberOfLines={1}>
              SET {setNumber} · {exerciseName.toUpperCase()}
            </Text>
            <Text style={styles.target}>
              Hold {formatClock(targetSeconds * 1000)}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.pressed
            ]}
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel={`Start hold for set ${setNumber}, target ${formatClock(targetSeconds * 1000)}`}
          >
            <Ionicons name="play" size={16} color={theme.colors.session.onLime} />
            <Text style={styles.startText}>Start</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  // holding / paused — two-up controls
  const paused = phase === 'paused'
  return (
    <View style={styles.wrapper}>
      <View style={styles.controls}>
        <Pressable
          style={({ pressed }) => [styles.freezeBtn, pressed && styles.pressed]}
          onPress={paused ? onResume : onPause}
          accessibilityRole="button"
          accessibilityLabel={paused ? 'Resume hold' : 'Pause hold'}
        >
          <Ionicons
            name={paused ? 'play' : 'pause'}
            size={16}
            color={theme.colors.session.textPrimary}
          />
          <Text style={styles.freezeText}>{paused ? 'Resume' : 'Pause'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}
          onPress={onDoneEarly}
          accessibilityRole="button"
          accessibilityLabel="Done early — log the time held so far"
        >
          <Text style={styles.doneText}>Done early</Text>
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
  // ready — info + Start (mirrors LogActionBar)
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 15,
    justifyContent: 'center',
    backgroundColor: theme.colors.session.lime
  },
  startText: {
    fontSize: 16,
    fontFamily: theme.fonts.bold,
    color: theme.colors.session.onLime
  },
  // holding / paused — two-up
  controls: {
    flexDirection: 'row',
    gap: 10
  },
  freezeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 15,
    backgroundColor: theme.colors.session.panel,
    borderWidth: 1,
    borderColor: theme.colors.session.hairline
  },
  freezeText: {
    fontSize: 15,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.textPrimary
  },
  doneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 15,
    backgroundColor: theme.colors.session.lime
  },
  doneText: {
    fontSize: 15,
    fontFamily: theme.fonts.bold,
    color: theme.colors.session.onLime
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  }
})
