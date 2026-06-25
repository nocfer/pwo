import { popScale } from '@/lib/motion'
import { ActiveGlow } from '@/components/workout/ActiveGlow'
import { formatHold } from '@/lib/utils/format'
import { theme } from '@/theme/theme'
import type { SetStatus } from '@/types/workout'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue
} from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export type SetRowProps = {
  setNumber: number
  reps: number
  weight: number
  status: SetStatus
  onRepsPress: () => void
  onWeightPress: () => void
  onConfirm: () => void
  onPress: () => void
  isRepsFocused?: boolean
  isWeightFocused?: boolean
  /**
   * When set, this is a timed (hold) row: a single HOLD column (m:ss) replaces
   * the weight/reps cells and the active trailing control is a play ▶.
   */
  durationSeconds?: number | null
  /** Tap the HOLD value (timed rows) — opens the duration stepper. */
  onHoldPress?: () => void
}

function statusLabel(status: SetStatus): string {
  switch (status) {
    case 'pending':
      return 'pending'
    case 'active':
      return 'ready to log'
    case 'completed':
      return 'completed'
    case 'editing':
      return 'editing'
    case 'skipped':
      return 'skipped'
  }
}

export function SetRow({
  setNumber,
  reps,
  weight,
  status,
  onRepsPress,
  onWeightPress,
  onConfirm,
  onPress,
  isRepsFocused = false,
  isWeightFocused = false,
  durationSeconds = null,
  onHoldPress
}: SetRowProps) {
  const isActive = status === 'active' || status === 'editing'
  const isCompleted = status === 'completed'
  const isSkipped = status === 'skipped'
  const isTimed = durationSeconds != null
  const holdLabel = formatHold(durationSeconds ?? 0)

  // Log pop: pressing the active check logs the set — the check pops (overshoot
  // → settle) in step with the tap. The confirm haptic is owned by the session's
  // log handler (onConfirm → handleLogSet), so it isn't duplicated here.
  const reduced = useReducedMotion()
  const checkScale = useSharedValue(1)
  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }]
  }))
  const onCheckPress = () => {
    if (isActive) {
      checkScale.value = popScale(reduced)
      onConfirm()
    } else {
      onPress()
    }
  }

  const valueStyle = [
    styles.value,
    isActive && styles.valueActive,
    isCompleted && styles.valueCompleted,
    isSkipped && styles.valueSkipped,
    status === 'pending' && styles.valuePending
  ]

  const numStyle = [
    styles.setNum,
    isActive && styles.setNumActive,
    isCompleted && styles.setNumCompleted,
    isSkipped && styles.setNumSkipped
  ]

  const valueDesc = isTimed
    ? `hold ${holdLabel}`
    : `${weight} pounds for ${reps} reps`
  const a11yLabel = isCompleted
    ? `Set ${setNumber}, completed, ${valueDesc}`
    : `Set ${setNumber}, ${statusLabel(status)}, ${valueDesc}`

  return (
    <View
      accessibilityLabel={a11yLabel}
      style={[styles.row, isActive && styles.rowActive, isSkipped && styles.rowSkipped]}
    >
      {isActive && <ActiveGlow />}
      <Text style={numStyle}>{setNumber}</Text>

      {isTimed ? (
        <Pressable
          onPress={onHoldPress}
          style={[styles.valueCell, styles.holdCell]}
          accessibilityRole="button"
          accessibilityLabel={`Hold ${holdLabel}`}
        >
          <Text style={valueStyle}>{holdLabel}</Text>
        </Pressable>
      ) : (
        <>
          <Pressable
            onPress={onWeightPress}
            style={[styles.valueCell, isWeightFocused && styles.valueCellFocused]}
            accessibilityRole="button"
            accessibilityLabel={`Weight ${weight} pounds`}
          >
            <Text style={valueStyle}>{weight}</Text>
          </Pressable>

          <Pressable
            onPress={onRepsPress}
            style={[styles.valueCell, isRepsFocused && styles.valueCellFocused]}
            accessibilityRole="button"
            accessibilityLabel={`Reps ${reps}`}
          >
            <Text style={valueStyle}>{reps}</Text>
          </Pressable>
        </>
      )}

      <AnimatedPressable
        onPress={onCheckPress}
        accessibilityRole="button"
        accessibilityLabel={
          isActive
            ? isTimed
              ? `Start hold for set ${setNumber}`
              : `Log set ${setNumber}`
            : isCompleted
              ? `Edit set ${setNumber}`
              : `Set ${setNumber}`
        }
        hitSlop={12}
        style={[
          styles.checkBox,
          isActive && styles.checkActive,
          isCompleted && styles.checkCompleted,
          isSkipped && styles.checkSkipped,
          status === 'pending' && styles.checkPending,
          checkAnimStyle
        ]}
      >
        {isActive ? (
          <Ionicons
            name={isTimed ? 'play' : 'checkmark'}
            size={isTimed ? 15 : 18}
            color={theme.colors.session.onLime}
          />
        ) : isCompleted ? (
          <Ionicons
            name="checkmark"
            size={15}
            color={theme.colors.session.green}
          />
        ) : isSkipped ? (
          <Ionicons
            name="remove"
            size={15}
            color={theme.colors.session.skippedNum}
          />
        ) : null}
      </AnimatedPressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6
  },
  rowActive: {
    backgroundColor: theme.colors.session.limeTintBg,
    borderRadius: 13,
    marginHorizontal: -4,
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  rowSkipped: {
    opacity: 0.7
  },
  setNum: {
    width: 26,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: theme.fonts.displayMed,
    color: theme.colors.session.completedNum
  },
  setNumActive: {
    fontFamily: theme.fonts.display,
    color: theme.colors.session.lime
  },
  setNumCompleted: {
    color: theme.colors.session.completedNum
  },
  setNumSkipped: {
    color: theme.colors.session.skippedNum
  },
  valueCell: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: theme.radius.sm
  },
  valueCellFocused: {
    backgroundColor: theme.colors.session.limeTintBg
  },
  holdCell: {
    flex: 2,
    alignItems: 'center'
  },
  value: {
    fontSize: 15,
    fontFamily: theme.fonts.medium,
    fontVariant: ['tabular-nums']
  },
  valueActive: {
    fontSize: 20,
    fontFamily: theme.fonts.displayMed,
    color: theme.colors.session.textPrimary
  },
  valueCompleted: {
    color: theme.colors.session.completedValue
  },
  valuePending: {
    color: theme.colors.session.subtext
  },
  valueSkipped: {
    color: theme.colors.session.skippedText,
    textDecorationLine: 'line-through'
  },
  checkBox: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkActive: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: theme.colors.session.lime
  },
  checkCompleted: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.session.greenCheckBg
  },
  checkSkipped: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.session.trackBg
  },
  checkPending: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.session.pendingCheckBorder
  }
})
