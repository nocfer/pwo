/**
 * ActiveWorkoutBar — the global mini-bar docked above the tab bar whenever a
 * workout is in progress. Two faces, driven by the same persisted workout state
 * (see useActiveWorkoutSurface):
 *   - Resting (cyan): countdown ring + Next set, with +15s / Skip.
 *   - In progress (lime): elapsed + program/set + progress bar, with Resume.
 * Tapping the body routes into the live session.
 */

import { useActiveWorkoutSurface } from '@/hooks/workout'
import { haptics } from '@/lib/haptics'
import { formatClock, spokenDuration } from '@/lib/utils/format'
import { theme } from '@/theme/theme'
import { Ionicons } from '@expo/vector-icons'
import React, { useCallback } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  SlideInDown,
  SlideOutDown,
  useReducedMotion
} from 'react-native-reanimated'
import { CountdownRing } from './CountdownRing'

export function ActiveWorkoutBar() {
  const { surface, extendRest, skipRest, openSession } =
    useActiveWorkoutSurface()
  const reducedMotion = useReducedMotion()

  const handleOpen = useCallback(() => {
    haptics.navigationTap()
    openSession()
  }, [openSession])

  const handleExtend = useCallback(() => {
    haptics.buttonTap()
    extendRest()
  }, [extendRest])

  const handleSkip = useCallback(() => {
    haptics.buttonTap()
    skipRest()
  }, [skipRest])

  if (!surface) return null

  const entering = reducedMotion ? undefined : SlideInDown.duration(380)
  const exiting = reducedMotion ? undefined : SlideOutDown.duration(220)

  if (surface.variant === 'resting') {
    const progress =
      surface.durationMs > 0
        ? Math.min(1, Math.max(0, surface.remainingMs / surface.durationMs))
        : 0

    return (
      <Animated.View
        style={styles.wrap}
        entering={entering}
        exiting={exiting}
        pointerEvents="box-none"
      >
        <View style={[styles.bar, styles.barResting]}>
          <Pressable
            style={styles.body}
            onPress={handleOpen}
            accessibilityRole="button"
            accessibilityLabel={`Resting, ${spokenDuration(surface.remainingMs)} remaining. Tap to return to workout.`}
          >
            <CountdownRing progress={progress} size={46} stroke={4}>
              <Text style={styles.ringLabel}>
                {formatClock(surface.remainingMs)}
              </Text>
            </CountdownRing>

            <View style={styles.info}>
              <Text style={styles.restingLabel}>RESTING</Text>
              <Text style={styles.restNext} numberOfLines={1}>
                Next · Set {surface.setNumber} · {surface.exerciseName}
              </Text>
            </View>

            <Ionicons
              name="chevron-up"
              size={18}
              color={theme.colors.session.cyan}
              style={styles.chevron}
            />
          </Pressable>

          <View style={styles.restActions}>
            <Pressable
              style={({ pressed }) => [
                styles.restBtn,
                pressed && styles.pressed
              ]}
              onPress={handleExtend}
              accessibilityRole="button"
              accessibilityLabel="Add 15 seconds to rest"
            >
              <Text style={styles.restBtnTextCyan}>+15s</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.restBtn,
                pressed && styles.pressed
              ]}
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel="Skip rest"
            >
              <Text style={styles.restBtnTextMuted}>Skip</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    )
  }

  // In-progress variant
  return (
    <Animated.View
      style={styles.wrap}
      entering={entering}
      exiting={exiting}
      pointerEvents="box-none"
    >
      <Pressable
        style={[styles.bar, styles.barInProgress, styles.body]}
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={`Workout in progress, ${spokenDuration(surface.elapsedMs)} elapsed. Tap to resume.`}
      >
        <View style={styles.playTile}>
          <Ionicons
            name="play"
            size={18}
            color={theme.colors.session.lime}
          />
        </View>

        <View style={styles.info}>
          <View style={styles.inProgressTopRow}>
            <View style={styles.limeDot} />
            <Text style={styles.inProgressLabel}>
              IN PROGRESS · {formatClock(surface.elapsedMs)}
            </Text>
          </View>
          <Text style={styles.inProgressMeta} numberOfLines={1}>
            {surface.sessionName} · Set {surface.setNumber} of {surface.setCount}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(surface.progress * 100)}%` }
              ]}
            />
          </View>
        </View>

        <View style={styles.resumeBtn}>
          <Text style={styles.resumeText}>Resume</Text>
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingBottom: 6
  },
  bar: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
    elevation: 10
  },
  barResting: {
    backgroundColor: theme.colors.session.cyanPanel,
    borderColor: theme.colors.session.cyanBorder
  },
  barInProgress: {
    backgroundColor: theme.colors.session.panel,
    borderColor: theme.colors.session.activeBorder
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  ringLabel: {
    position: 'absolute',
    fontSize: 12,
    fontFamily: theme.fonts.displayMed,
    color: theme.colors.session.cyan,
    fontVariant: ['tabular-nums']
  },
  info: {
    flex: 1
  },
  restingLabel: {
    fontSize: 9,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: 1.4,
    color: theme.colors.session.cyan
  },
  restNext: {
    fontSize: 14,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.textPrimary,
    marginTop: 3
  },
  chevron: {
    marginLeft: 4
  },
  restActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10
  },
  restBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.session.cyanControlBg,
    borderWidth: 1,
    borderColor: theme.colors.session.cyanControlBorder
  },
  restBtnTextCyan: {
    fontSize: 14,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.cyan
  },
  restBtnTextMuted: {
    fontSize: 14,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.subtext
  },
  playTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.session.limeTintBg,
    borderWidth: 1,
    borderColor: theme.colors.session.activeBorder
  },
  inProgressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  limeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.session.lime
  },
  inProgressLabel: {
    fontSize: 9,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: 1.2,
    color: theme.colors.session.lime
  },
  inProgressMeta: {
    fontSize: 14,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.textPrimary,
    marginTop: 3
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.session.trackBg,
    marginTop: 7,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: theme.colors.session.lime
  },
  resumeBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.session.lime
  },
  resumeText: {
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    color: theme.colors.session.onLime
  },
  pressed: {
    opacity: 0.7
  }
})
