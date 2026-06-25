import { formatClock, formatHold } from '@/lib/utils/format'
import { theme } from '@/theme/theme'
import type { ExerciseState } from '@/types/workout'
import {
  isTimedExercise,
  timedTarget,
  topCompletedHold,
  topCompletedWeight
} from '@/types/workout'
import { Ionicons } from '@expo/vector-icons'
import React, { useCallback } from 'react'
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import { HoldRing } from './HoldRing'
import type { HoldPhase } from './HoldActionBar'
import { SetRow } from './SetRow'

/** Live hold runtime for the active timed set (supplied by the session). */
export type HoldFocusState = {
  phase: HoldPhase
  elapsedMs: number
}

export type ExerciseAccordionItemProps = {
  exercise: ExerciseState
  exerciseIndex: number
  isExpanded: boolean
  onToggle: () => void
  onSetRepsPress?: (setIndex: number) => void
  onSetWeightPress?: (setIndex: number) => void
  onSetConfirm?: (setIndex: number) => void
  onSetPress?: (setIndex: number) => void
  onAddSet?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  focusedField?: { setIndex: number; field: 'reps' | 'weight' } | null
  /**
   * Live hold runtime — present only for the expanded exercise whose active set
   * is timed. When set, the card body renders the count-up focus instead of the
   * reps/weight table.
   */
  hold?: HoldFocusState | null
  /** Tap the target duration to adjust it (timed focus, ready phase). */
  onAdjustTarget?: () => void
}

type ExerciseStatus = 'now' | 'done' | 'next'

function resolvedCount(exercise: ExerciseState): number {
  return exercise.sets.filter(
    s => s.status === 'completed' || s.status === 'skipped'
  ).length
}

function completedCount(exercise: ExerciseState): number {
  return exercise.sets.filter(s => s.status === 'completed').length
}

function isComplete(exercise: ExerciseState): boolean {
  return exercise.sets.every(
    s => s.status === 'completed' || s.status === 'skipped'
  )
}

function hasActive(exercise: ExerciseState): boolean {
  return exercise.sets.some(s => s.status === 'active' || s.status === 'editing')
}

function getStatus(exercise: ExerciseState): ExerciseStatus {
  if (hasActive(exercise)) return 'now'
  if (isComplete(exercise)) return 'done'
  return 'next'
}

function TimedBadge() {
  return (
    <View style={styles.timedBadge}>
      <Text style={styles.timedBadgeText}>TIMED</Text>
    </View>
  )
}

function prefill(exercise: ExerciseState): { weight: number; reps: number } {
  const first = exercise.sets[0]
  return { weight: first?.weight ?? 0, reps: first?.reps ?? 0 }
}

function activeSetNumber(exercise: ExerciseState): number {
  const idx = exercise.sets.findIndex(
    s => s.status === 'active' || s.status === 'editing'
  )
  return idx === -1 ? 1 : idx + 1
}

const STATUS_BADGE: Record<ExerciseStatus, { label: string }> = {
  now: { label: 'NOW' },
  done: { label: 'DONE' },
  next: { label: 'UP NEXT' }
}

function StatusBadge({ status }: { status: ExerciseStatus }) {
  return (
    <View
      style={[
        styles.badge,
        status === 'now' && styles.badgeNow,
        status === 'done' && styles.badgeDone,
        status === 'next' && styles.badgeNext
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          status === 'now' && styles.badgeTextNow,
          status === 'done' && styles.badgeTextDone,
          status === 'next' && styles.badgeTextNext
        ]}
      >
        {STATUS_BADGE[status].label}
      </Text>
    </View>
  )
}

function ProgressBar({ ratio, color }: { ratio: number; color: string }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.round(ratio * 100)}%`, backgroundColor: color }
        ]}
      />
    </View>
  )
}

export function ExerciseAccordionItem({
  exercise,
  isExpanded,
  onToggle,
  onSetRepsPress,
  onSetWeightPress,
  onSetConfirm,
  onSetPress,
  onAddSet,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  focusedField,
  hold,
  onAdjustTarget
}: ExerciseAccordionItemProps) {
  const status = getStatus(exercise)
  const total = exercise.sets.length
  const resolved = resolvedCount(exercise)
  const reduced = useReducedMotion()

  const handleToggle = useCallback(() => {
    // Skip the expand/collapse height animation under reduce-motion (snap open).
    if (!reduced) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    }
    onToggle()
  }, [onToggle, reduced])

  // ---- Expanded card · TIMED focus (active set is a hold) ----
  if (isExpanded && hold) {
    const activeIdx = exercise.sets.findIndex(
      s => s.status === 'active' || s.status === 'editing'
    )
    const activeSet = activeIdx === -1 ? undefined : exercise.sets[activeIdx]
    const targetSeconds = activeSet?.durationSeconds ?? 0
    const targetMs = targetSeconds * 1000
    const ready = hold.phase === 'ready'
    const progress = ready || targetMs === 0 ? 0 : hold.elapsedMs / targetMs
    const centerMs = ready ? targetMs : hold.elapsedMs

    return (
      <View style={styles.expandedCard}>
        <View
          style={styles.expandedHeaderRow}
          accessibilityRole="header"
          accessibilityLabel={`${exercise.exerciseName}, ${ready ? 'ready to hold' : 'holding'}`}
        >
          <Text style={styles.expandedName} numberOfLines={1}>
            {exercise.exerciseName}
          </Text>
          <StatusBadge status={status} />
        </View>

        <View style={styles.holdFocus}>
          <Text style={styles.holdSetLabel}>
            {ready ? 'SET' : 'HOLDING · SET'} {activeIdx + 1} OF {total}
          </Text>

          <View style={styles.timedTag}>
            <Ionicons
              name="timer-outline"
              size={13}
              color={theme.colors.session.cyan}
            />
            <Text style={styles.timedTagText}>TIMED HOLD</Text>
          </View>

          {ready && targetSeconds > 0 ? (
            <Pressable
              style={styles.ringPress}
              onPress={onAdjustTarget}
              accessibilityRole="button"
              accessibilityLabel={`Hold target ${formatClock(targetMs)}, tap to adjust`}
            >
              <HoldRing progress={0} size={180} stroke={13}>
                <View style={styles.ringCenter}>
                  <Text style={styles.ringValue}>{formatClock(targetMs)}</Text>
                  <Text style={styles.ringSub}>target hold</Text>
                </View>
              </HoldRing>
            </Pressable>
          ) : (
            <View
              style={styles.ringPress}
              accessibilityRole="timer"
              accessibilityLiveRegion="polite"
              accessibilityLabel={`Holding, ${formatClock(centerMs)} of ${formatClock(targetMs)}`}
            >
              {!ready && <View style={styles.holdGlow} />}
              <HoldRing progress={progress} size={180} stroke={13}>
                <View style={styles.ringCenter}>
                  <Text style={styles.ringValue}>{formatClock(centerMs)}</Text>
                  <Text style={styles.ringSubLive}>
                    of {formatClock(targetMs)}
                  </Text>
                </View>
              </HoldRing>
            </View>
          )}
        </View>

        <View style={styles.expandedProgress}>
          <ProgressBar
            ratio={total > 0 ? resolved / total : 0}
            color={theme.colors.session.lime}
          />
        </View>
      </View>
    )
  }

  // ---- Expanded card · TIMED table (no active hold — e.g. reviewing a done
  // timed exercise). The active hold uses the ring focus above. ----
  if (isExpanded && isTimedExercise(exercise)) {
    return (
      <View style={styles.expandedCard}>
        <View
          style={styles.expandedHeaderRow}
          accessibilityRole="header"
          accessibilityLabel={`${exercise.exerciseName}, expanded`}
        >
          <Text style={styles.expandedName} numberOfLines={1}>
            {exercise.exerciseName}
          </Text>
          <View style={styles.headerBadges}>
            <TimedBadge />
            <StatusBadge status={status} />
          </View>
        </View>

        <Text style={styles.subLine}>
          Target · {formatHold(timedTarget(exercise))}
        </Text>

        <View style={styles.columnHeader}>
          <Text style={[styles.columnLabel, styles.colNum]}>#</Text>
          <Text style={[styles.columnLabel, styles.colHold]}>HOLD</Text>
          <View style={styles.colCheck} />
        </View>

        {exercise.sets.map((set, sIdx) => (
          <SetRow
            key={`set-${sIdx}`}
            setNumber={sIdx + 1}
            reps={set.reps}
            weight={set.weight}
            status={set.status}
            durationSeconds={
              set.confirmedDurationSeconds ?? set.durationSeconds ?? 0
            }
            onRepsPress={() => onSetRepsPress?.(sIdx)}
            onWeightPress={() => onSetWeightPress?.(sIdx)}
            onHoldPress={() => onSetRepsPress?.(sIdx)}
            onConfirm={() => onSetConfirm?.(sIdx)}
            onPress={() => onSetPress?.(sIdx)}
          />
        ))}

        <View style={styles.expandedProgress}>
          <ProgressBar
            ratio={total > 0 ? resolved / total : 0}
            color={theme.colors.session.green}
          />
        </View>
      </View>
    )
  }

  // ---- Expanded card ----
  if (isExpanded) {
    const pf = prefill(exercise)
    return (
      <View style={styles.expandedCard}>
        {/* Informational header. Under the one-card-expanded model there is no
            collapse-to-none; you switch focus by tapping another card. */}
        <View
          style={styles.expandedHeaderRow}
          accessibilityRole="header"
          accessibilityLabel={`${exercise.exerciseName}, expanded`}
        >
          <Text style={styles.expandedName} numberOfLines={1}>
            {exercise.exerciseName}
          </Text>
          <StatusBadge status={status} />
        </View>

        <Text style={styles.subLine}>
          Last · {pf.weight} × {pf.reps}
        </Text>

        <View style={styles.columnHeader}>
          <Text style={[styles.columnLabel, styles.colNum]}>#</Text>
          <Text style={[styles.columnLabel, styles.colValue]}>WEIGHT</Text>
          <Text style={[styles.columnLabel, styles.colValue]}>REPS</Text>
          <View style={styles.colCheck} />
        </View>

        {exercise.sets.map((set, sIdx) => (
          <SetRow
            key={`set-${sIdx}`}
            setNumber={sIdx + 1}
            reps={set.reps}
            weight={set.weight}
            status={set.status}
            onRepsPress={() => onSetRepsPress?.(sIdx)}
            onWeightPress={() => onSetWeightPress?.(sIdx)}
            onConfirm={() => onSetConfirm?.(sIdx)}
            onPress={() => onSetPress?.(sIdx)}
            isRepsFocused={
              focusedField?.setIndex === sIdx && focusedField.field === 'reps'
            }
            isWeightFocused={
              focusedField?.setIndex === sIdx && focusedField.field === 'weight'
            }
          />
        ))}

        {status === 'now' && onAddSet ? (
          <Pressable
            style={styles.addSet}
            onPress={onAddSet}
            accessibilityRole="button"
            accessibilityLabel="Add set"
          >
            <Ionicons
              name="add"
              size={16}
              color={theme.colors.session.limeMutedText}
            />
            <Text style={styles.addSetText}>Add set</Text>
          </Pressable>
        ) : null}

        <View style={styles.expandedProgress}>
          <ProgressBar
            ratio={total > 0 ? resolved / total : 0}
            color={theme.colors.session.green}
          />
        </View>
      </View>
    )
  }

  // ---- Collapsed: DONE ----
  if (status === 'done') {
    return (
      <Pressable
        style={[styles.collapsed, styles.collapsedDone]}
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityLabel={`${exercise.exerciseName}, done, ${completedCount(exercise)} of ${total} sets, tap to expand`}
      >
        <View style={styles.collapsedLeft}>
          <View style={styles.doneCheck}>
            <Ionicons
              name="checkmark"
              size={15}
              color={theme.colors.session.onGreen}
            />
          </View>
          <Text style={[styles.collapsedName, styles.collapsedNameDone]} numberOfLines={1}>
            {exercise.exerciseName}
          </Text>
          {isTimedExercise(exercise) && <TimedBadge />}
        </View>
        <Text style={styles.doneSummary} numberOfLines={1}>
          {completedCount(exercise)}/{total} ·{' '}
          {isTimedExercise(exercise)
            ? `top ${formatHold(topCompletedHold(exercise))}`
            : `top ${topCompletedWeight(exercise)} lb`}
        </Text>
      </Pressable>
    )
  }

  // ---- Collapsed: CURRENT (active but not expanded) ----
  if (status === 'now') {
    return (
      <Pressable
        style={[styles.collapsed, styles.collapsedCurrent]}
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityLabel={`${exercise.exerciseName}, current exercise, set ${activeSetNumber(exercise)} of ${total}, tap to expand`}
      >
        <View style={styles.collapsedLeft}>
          <View style={styles.currentDot} />
          <Text style={styles.collapsedName} numberOfLines={1}>
            {exercise.exerciseName}
          </Text>
          {isTimedExercise(exercise) && <TimedBadge />}
        </View>
        <Text style={styles.currentSummary}>
          Set {activeSetNumber(exercise)} of {total}
        </Text>
      </Pressable>
    )
  }

  // ---- Collapsed: PENDING (with reorder chevrons) ----
  const pf = prefill(exercise)
  return (
    <View style={[styles.collapsed, styles.collapsedPending]}>
      <Pressable
        style={styles.collapsedLeft}
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityLabel={`${exercise.exerciseName}, upcoming, ${total} sets, tap to expand`}
      >
        <View style={styles.pendingTextWrap}>
          <View style={styles.pendingNameRow}>
            <Text
              style={[styles.collapsedName, styles.collapsedNamePending]}
              numberOfLines={1}
            >
              {exercise.exerciseName}
            </Text>
            {isTimedExercise(exercise) && <TimedBadge />}
          </View>
          <Text style={styles.pendingSummary} numberOfLines={1}>
            {isTimedExercise(exercise)
              ? `0/${total} · Hold ${formatHold(timedTarget(exercise))}`
              : `0/${total} · ${pf.weight} lb`}
          </Text>
        </View>
      </Pressable>
      <View style={styles.chevrons}>
        <Pressable
          style={[styles.chevron, !canMoveUp && styles.chevronDisabled]}
          onPress={onMoveUp}
          disabled={!canMoveUp}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Move ${exercise.exerciseName} up`}
        >
          <Ionicons
            name="chevron-up"
            size={16}
            color={theme.colors.session.chevronIcon}
          />
        </Pressable>
        <Pressable
          style={[styles.chevron, !canMoveDown && styles.chevronDisabled]}
          onPress={onMoveDown}
          disabled={!canMoveDown}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Move ${exercise.exerciseName} down`}
        >
          <Ionicons
            name="chevron-down"
            size={16}
            color={theme.colors.session.chevronIcon}
          />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  // expanded
  expandedCard: {
    backgroundColor: theme.colors.session.panel,
    borderWidth: 1.5,
    borderColor: theme.colors.session.activeBorder,
    borderRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 15,
    paddingBottom: 13
  },
  expandedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm
  },
  expandedName: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.textPrimary
  },
  subLine: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.session.muted,
    marginTop: 4
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 2
  },
  columnLabel: {
    fontSize: 9,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: 0.8,
    color: theme.colors.session.faint
  },
  colNum: {
    width: 26,
    textAlign: 'center'
  },
  colValue: {
    flex: 1
  },
  colHold: {
    flex: 2,
    textAlign: 'center'
  },
  colCheck: {
    width: 34
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  timedBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.session.cyanTintBg,
    borderWidth: 1,
    borderColor: theme.colors.session.cyanControlBorder
  },
  timedBadgeText: {
    fontSize: 9,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: 1,
    color: theme.colors.session.cyan
  },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.session.addSetBorder,
    marginTop: 6
  },
  addSetText: {
    fontSize: 13,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.limeMutedText
  },
  expandedProgress: {
    marginTop: 12
  },
  // timed (hold) focus
  holdFocus: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 6
  },
  holdSetLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: 1.6,
    color: theme.colors.session.lime
  },
  timedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 11,
    backgroundColor: theme.colors.session.cyanTintBg,
    borderWidth: 1,
    borderColor: theme.colors.session.cyanControlBorder
  },
  timedTagText: {
    fontSize: 11,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: 0.6,
    color: theme.colors.session.cyan
  },
  ringPress: {
    width: 180,
    height: 180,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  holdGlow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 90,
    backgroundColor: theme.colors.session.limeGlow
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center'
  },
  ringValue: {
    fontSize: 52,
    lineHeight: 56,
    fontFamily: theme.fonts.displayMed,
    color: theme.colors.session.textPrimary,
    fontVariant: ['tabular-nums']
  },
  ringSub: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.session.muted,
    marginTop: 6
  },
  ringSubLive: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.session.limeMutedText,
    marginTop: 6
  },
  // shared progress bar
  progressTrack: {
    height: 3,
    backgroundColor: theme.colors.session.trackBg,
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 2
  },
  // badge
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: theme.radius.sm
  },
  badgeNow: {
    backgroundColor: theme.colors.session.limeTintBg
  },
  badgeDone: {
    backgroundColor: theme.colors.session.greenTintBg
  },
  badgeNext: {
    backgroundColor: theme.colors.session.badgeUpNextBg
  },
  badgeText: {
    fontSize: 10,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: 1
  },
  badgeTextNow: {
    color: theme.colors.session.lime
  },
  badgeTextDone: {
    color: theme.colors.session.green
  },
  badgeTextNext: {
    color: theme.colors.session.subtext
  },
  // collapsed shared
  collapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    minHeight: 44
  },
  collapsedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1
  },
  collapsedName: {
    fontSize: 15,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.textPrimary,
    flexShrink: 1
  },
  // collapsed done
  collapsedDone: {
    backgroundColor: theme.colors.session.greenTintBg,
    borderWidth: 1,
    borderColor: theme.colors.session.collapsedDoneBorder
  },
  collapsedNameDone: {
    color: theme.colors.session.completedValue
  },
  doneCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.session.green
  },
  doneSummary: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.session.muted
  },
  // collapsed current
  collapsedCurrent: {
    backgroundColor: theme.colors.session.panel,
    borderWidth: 1.5,
    borderColor: theme.colors.session.activeBorder
  },
  currentDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: theme.colors.session.lime
  },
  currentSummary: {
    fontSize: 12,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.lime
  },
  // collapsed pending
  collapsedPending: {
    backgroundColor: theme.colors.session.collapsedPendingBg,
    borderWidth: 1,
    borderColor: theme.colors.session.collapsedPendingBorder
  },
  collapsedNamePending: {
    color: theme.colors.session.subtext,
    flexShrink: 1
  },
  pendingTextWrap: {
    flex: 1
  },
  pendingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  pendingSummary: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.session.faint,
    marginTop: 2
  },
  chevrons: {
    flexDirection: 'row',
    gap: 6
  },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.session.chevronBg
  },
  chevronDisabled: {
    opacity: 0.4
  }
})
