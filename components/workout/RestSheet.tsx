import { formatClock, spokenDuration } from '@/lib/utils/format'
import { theme } from '@/theme/theme'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { SlideInDown, useReducedMotion } from 'react-native-reanimated'
import { CountdownRing } from './CountdownRing'

export type RestSheetProps = {
  remainingMs: number
  durationMs: number
  nextSetNumber: number
  nextExerciseName: string
  nextWeight: number
  nextReps: number
  onExtend: () => void
  onSkip: () => void
}

export function RestSheet({
  remainingMs,
  durationMs,
  nextSetNumber,
  nextExerciseName,
  nextWeight,
  nextReps,
  onExtend,
  onSkip
}: RestSheetProps) {
  const progress =
    durationMs > 0 ? Math.min(1, Math.max(0, remainingMs / durationMs)) : 0
  const reduced = useReducedMotion()

  return (
    <Animated.View
      style={styles.sheet}
      entering={
        reduced ? undefined : SlideInDown.duration(theme.motion.durationSheet)
      }
    >
      <View style={styles.topRow}>
        <View
          accessibilityRole="timer"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Resting, ${spokenDuration(remainingMs)} remaining`}
        >
          <CountdownRing progress={progress} size={72} stroke={7}>
            <Text style={styles.ringLabel}>{formatClock(remainingMs)}</Text>
          </CountdownRing>
        </View>

        <View style={styles.info}>
          <Text style={styles.resting}>RESTING</Text>
          <Text style={styles.next} numberOfLines={1}>
            Next · Set {nextSetNumber} · {nextExerciseName}
          </Text>
          <Text style={styles.target} numberOfLines={1}>
            {nextWeight} lb × {nextReps}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.extendBtn,
            pressed && styles.pressed
          ]}
          onPress={onExtend}
          accessibilityRole="button"
          accessibilityLabel="Add 15 seconds to rest"
        >
          <Text style={styles.extendText}>+15s</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip rest"
        >
          <Text style={styles.skipText}>Skip rest</Text>
        </Pressable>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: theme.colors.session.cyanPanel,
    borderTopWidth: 1.5,
    borderTopColor: theme.colors.session.cyanBorder,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 18,
    boxShadow: '0 -16px 36px rgba(0,0,0,0.5)',
    elevation: 12
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg
  },
  ringLabel: {
    position: 'absolute',
    fontSize: 18,
    fontFamily: theme.fonts.displayMed,
    color: theme.colors.session.cyan,
    fontVariant: ['tabular-nums']
  },
  info: {
    flex: 1
  },
  resting: {
    fontSize: 10,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: 1.4,
    color: theme.colors.session.cyan
  },
  next: {
    fontSize: 15,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.textPrimary,
    marginTop: 3
  },
  target: {
    fontSize: 13,
    fontFamily: theme.fonts.medium,
    color: theme.colors.session.subtext,
    marginTop: 2
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16
  },
  extendBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.session.cyanControlBg,
    borderWidth: 1,
    borderColor: theme.colors.session.cyanControlBorder
  },
  extendText: {
    fontSize: 15,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.cyan
  },
  skipBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  skipText: {
    fontSize: 15,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.subtext
  },
  pressed: {
    opacity: 0.7
  }
})
