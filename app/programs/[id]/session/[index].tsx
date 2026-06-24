import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { MaxWidthContainer } from '@/components/common/MaxWidthContainer'
import { ExerciseAccordionItem } from '@/components/workout/ExerciseAccordionItem'
import {
  InlineSetEditor,
  type EditorField
} from '@/components/workout/InlineSetEditor'
import { LogActionBar } from '@/components/workout/LogActionBar'
import { RestSheet } from '@/components/workout/RestSheet'
import { WorkoutHeader } from '@/components/workout/WorkoutHeader'
import { WorkoutRecap } from '@/components/workout/WorkoutRecap'
import { useDataActions } from '@/context/DataContext'
import {
  findNextPendingSet,
  WorkoutExecutionProvider
} from '@/context/WorkoutExecutionContext'
import { useExercises, usePrograms, usePRs } from '@/hooks/data'
import {
  useElapsedTimer,
  useEndWorkout,
  usePrefill,
  useRestTimer,
  useScrollToExercise,
  useWebKeyboardShortcuts,
  useWorkoutExecution,
  useWorkoutPersistence
} from '@/hooks/workout'
import { haptics } from '@/lib/haptics'
import { buildInitialState } from '@/lib/buildInitialState'
import { buildWorkoutRecap } from '@/lib/workoutRecap'
import { showToast } from '@/lib/toast'
import { readPersistedWorkout } from '@/lib/workout-persistence'
import { theme } from '@/theme/theme'
import type { AccumulatedSet, Program } from '@/types'
import type { ExerciseState } from '@/types/workout'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BackHandler,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native'

type EditorTarget = {
  exerciseIndex: number
  setIndex: number
  field: EditorField
}

function isExercisePending(exercise: ExerciseState): boolean {
  return exercise.sets.every(s => s.status === 'pending')
}

function WorkoutSessionContent() {
  const {
    state,
    expandExercise,
    logSet,
    confirmSet,
    skipSet,
    editSet,
    startRestTimer,
    completeWorkout,
    addSet,
    moveExercise,
    extendRest,
    unlogSet,
    restoreSet
  } = useWorkoutExecution()
  useWorkoutPersistence()
  const {
    remainingMs: restRemainingMs,
    isActive: restTimerActive,
    dismiss: dismissRest
  } = useRestTimer()
  const { elapsedMs } = useElapsedTimer({
    startedAt: state.startedAt,
    isCompleted: state.isCompleted,
    completedAt: state.completedAt
  })
  const {
    showEndConfirmation,
    pendingSetsCount,
    requestEnd,
    confirmEnd,
    cancelEnd
  } = useEndWorkout()
  const { data: prsData } = usePRs(100)
  const { completeSession } = useDataActions()
  const navigation = useNavigation()
  const router = useRouter()
  const scrollRef = useRef<ScrollView>(null)
  const { height: screenHeight } = useWindowDimensions()
  const { handleExerciseLayout, scrollToExercise } = useScrollToExercise(
    scrollRef,
    screenHeight
  )

  const [editor, setEditor] = useState<EditorTarget | null>(null)

  const handleExpandExercise = useCallback(
    (exerciseIndex: number) => {
      setEditor(null)
      expandExercise(exerciseIndex)
      scrollToExercise(exerciseIndex)
      haptics.navigationTap()
    },
    [expandExercise, scrollToExercise]
  )

  // Open the stepper editor for a set's weight/reps value. Promote the set into
  // an editable status first so stepper changes actually take effect and commit:
  //  - completed → editing (EDIT_SET); Done re-confirms
  //  - skipped   → pending/active (RESTORE_SET); no longer silently discarded
  //  - pending   → active (EXPAND_EXERCISE)
  const openEditor = useCallback(
    (exerciseIndex: number, setIndex: number, field: EditorField) => {
      const set = state.exercises[exerciseIndex]?.sets[setIndex]
      if (!set) return
      if (set.status === 'completed') {
        editSet(exerciseIndex, setIndex)
      } else if (set.status === 'skipped') {
        restoreSet(exerciseIndex, setIndex)
      } else if (set.status === 'pending') {
        expandExercise(exerciseIndex, setIndex)
      }
      setEditor({ exerciseIndex, setIndex, field })
    },
    [state.exercises, editSet, restoreSet, expandExercise]
  )

  // Trailing box on a non-active row: edit (completed/skipped) or navigate.
  const handleSetPress = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      const set = state.exercises[exerciseIndex]?.sets[setIndex]
      if (!set) return
      if (set.status === 'completed' || set.status === 'skipped') {
        openEditor(exerciseIndex, setIndex, 'reps')
      } else {
        expandExercise(exerciseIndex, setIndex)
        scrollToExercise(exerciseIndex)
        haptics.navigationTap()
      }
    },
    [state.exercises, openEditor, expandExercise, scrollToExercise]
  )

  // One-tap log: commit the set, advance, rest or complete.
  const handleLogSet = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      const exercise = state.exercises[exerciseIndex]
      const set = exercise?.sets[setIndex]
      if (!set) return

      setEditor(null)
      logSet(exerciseIndex, setIndex, set.reps, set.weight)
      confirmSet(exerciseIndex, setIndex)
      haptics.setConfirmed()

      const volume = set.weight * set.reps
      showToast({
        type: 'success',
        text1: `Set logged · +${volume} lb`,
        visibilityTime: 1500
      })

      const next = findNextPendingSet(state.exercises, exerciseIndex, setIndex)
      if (next) {
        // Rest precedes the next set, so use that set's exercise duration —
        // findNextPendingSet can wrap to a different exercise than the one
        // just finished, and the RestSheet previews the next set.
        const durationMs =
          state.exercises[next.exerciseIndex].restDurationMs ?? 60000
        if (durationMs > 0) startRestTimer(durationMs)
      } else {
        haptics.workoutCompleted()
        completeWorkout()
      }
    },
    [state.exercises, logSet, confirmSet, startRestTimer, completeWorkout]
  )

  const handleAddSet = useCallback(
    (exerciseIndex: number) => {
      addSet(exerciseIndex)
      haptics.buttonTap()
    },
    [addSet]
  )

  const handleMove = useCallback(
    (from: number, to: number) => {
      moveExercise(from, to)
      haptics.navigationTap()
    },
    [moveExercise]
  )

  // ---- Editor adjust / done / secondary ----
  const handleEditorChange = useCallback(
    (nextValue: number) => {
      if (!editor) return
      const set = state.exercises[editor.exerciseIndex]?.sets[editor.setIndex]
      if (!set) return
      const reps = editor.field === 'reps' ? nextValue : set.reps
      const weight = editor.field === 'weight' ? nextValue : set.weight
      logSet(editor.exerciseIndex, editor.setIndex, reps, weight)
    },
    [editor, state.exercises, logSet]
  )

  const handleEditorDone = useCallback(() => {
    if (!editor) return
    const set = state.exercises[editor.exerciseIndex]?.sets[editor.setIndex]
    if (set?.status === 'editing') {
      confirmSet(editor.exerciseIndex, editor.setIndex)
    }
    haptics.buttonTap()
    setEditor(null)
  }, [editor, state.exercises, confirmSet])

  const handleEditorSecondary = useCallback(() => {
    if (!editor) return
    const { exerciseIndex, setIndex } = editor
    const set = state.exercises[exerciseIndex]?.sets[setIndex]
    if (!set) return
    if (set.status === 'editing') {
      unlogSet(exerciseIndex, setIndex)
      haptics.buttonTap()
    } else if (set.status === 'skipped') {
      restoreSet(exerciseIndex, setIndex)
      haptics.buttonTap()
    } else {
      skipSet(exerciseIndex, setIndex)
      haptics.skipAction()
    }
    setEditor(null)
  }, [editor, state.exercises, unlogSet, restoreSet, skipSet])

  const handleExtendRest = useCallback(() => {
    extendRest()
    haptics.buttonTap()
  }, [extendRest])

  const handleBackPress = useCallback(() => {
    if (state.isCompleted) return false
    requestEnd()
    return true
  }, [requestEnd, state.isCompleted])

  useEffect(() => {
    const handler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    )
    return () => handler.remove()
  }, [handleBackPress])

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (state.isCompleted) return
      e.preventDefault()
      requestEnd()
    })
    return unsubscribe
  }, [navigation, requestEnd, state.isCompleted])

  // Locate the single active/editing set (drives the footer Log bar).
  const activeLoc = useMemo(() => {
    for (let i = 0; i < state.exercises.length; i++) {
      const j = state.exercises[i].sets.findIndex(
        s => s.status === 'active' || s.status === 'editing'
      )
      if (j !== -1) return { exerciseIndex: i, setIndex: j }
    }
    return null
  }, [state.exercises])

  // Web keyboard: Enter logs the active set (or commits the editor), Esc closes
  // the editor. Re-uses the generic shortcut primitive (no-op off web).
  useWebKeyboardShortcuts({
    onEnter: () => {
      if (editor) {
        handleEditorDone()
        return true
      }
      if (activeLoc) {
        handleLogSet(activeLoc.exerciseIndex, activeLoc.setIndex)
        return true
      }
      return false
    },
    onTab: () => false,
    onEscape: () => {
      if (editor) {
        // Commit on close (same as tapping the scrim) so an edited set never
        // lingers in 'editing' with uncommitted values.
        handleEditorDone()
        return true
      }
      return false
    },
    enabled: !state.isCompleted
  })

  const overall = useMemo(() => {
    let total = 0
    let completed = 0
    for (const ex of state.exercises) {
      total += ex.sets.length
      completed += ex.sets.filter(s => s.status === 'completed').length
    }
    return total > 0 ? completed / total : 0
  }, [state.exercises])

  const reorderable = useCallback(
    (idx: number) =>
      idx >= 0 &&
      idx < state.exercises.length &&
      idx !== state.expandedExerciseIndex &&
      isExercisePending(state.exercises[idx]),
    [state.exercises, state.expandedExerciseIndex]
  )

  // Best all-time weight per exercise (before this session) → PR detection.
  const bestWeightById = useMemo(() => {
    const map = new Map<string, number>()
    const best = prsData?.bestPRs
    if (!best) return map
    for (const [exerciseId, byType] of best) {
      const weightPR = byType.get('max_weight')
      if (weightPR) map.set(exerciseId, weightPR.value)
    }
    return map
  }, [prsData])

  // Only compute the recap once completed — it is the only time it is rendered,
  // and gating avoids the per-second recompute while the workout is live. PR
  // flags still self-heal: bestWeightById updates when usePRs resolves, which
  // re-runs this memo even on the (still-mounted) recap screen.
  const recap = useMemo(
    () =>
      state.isCompleted
        ? buildWorkoutRecap(state.exercises, elapsedMs, bestWeightById)
        : null,
    [state.isCompleted, state.exercises, elapsedMs, bestWeightById]
  )

  // Record the finished workout to the backend exactly once when it completes.
  // This POSTs the session (so it appears in Statistics/Home/PRs) and bumps the
  // progress version so those screens refetch. Fires for both natural completion
  // and the End-workout path; skipped/pending sets are not recorded.
  const recordedRef = useRef(false)
  useEffect(() => {
    if (!state.isCompleted || recordedRef.current) return
    recordedRef.current = true

    const completedAtIso = new Date(
      state.completedAt ?? Date.now()
    ).toISOString()

    const accumulatedSets: AccumulatedSet[] = []
    for (const exercise of state.exercises) {
      for (const set of exercise.sets) {
        if (set.status !== 'completed') continue
        const weight = set.confirmedWeight ?? set.weight
        const isBodyweight = !weight || weight <= 0
        accumulatedSets.push({
          exerciseId: exercise.exerciseId,
          reps: set.confirmedReps ?? set.reps,
          ...(isBodyweight ? {} : { weight }),
          isBodyweight,
          timestamp: completedAtIso
        })
      }
    }

    if (accumulatedSets.length === 0) return // nothing logged → nothing to record

    completeSession(
      state.programSlug,
      state.sessionIndex,
      `${accumulatedSets.length} sets`,
      Math.round(elapsedMs / 1000),
      accumulatedSets
    ).catch(error => {
      console.error('Failed to record completed workout:', error)
      showToast({
        type: 'error',
        text1: 'Could not save workout to your stats',
        visibilityTime: 2500
      })
    })
  }, [
    state.isCompleted,
    state.exercises,
    state.completedAt,
    state.programSlug,
    state.sessionIndex,
    elapsedMs,
    completeSession
  ])

  const handleDone = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack()
    else router.replace('/(tabs)')
  }, [navigation, router])

  const handleShare = useCallback(() => {
    if (!recap) return
    Share.share({
      message: `Finished ${state.sessionName} — ${recap.setsCount} sets · ${recap.volume.toLocaleString('en-US')} lb · ${recap.timeStr}`
    }).catch(() => {})
  }, [state.sessionName, recap])

  if (state.isCompleted && recap) {
    return (
      <WorkoutRecap
        programName={state.sessionName}
        recap={recap}
        onShare={handleShare}
        onDone={handleDone}
      />
    )
  }

  const focusForExercise = (exerciseIndex: number) =>
    editor?.exerciseIndex === exerciseIndex
      ? { setIndex: editor.setIndex, field: editor.field }
      : null

  const editorSet = editor
    ? state.exercises[editor.exerciseIndex]?.sets[editor.setIndex]
    : null
  const editorBaseSet = editor
    ? state.exercises[editor.exerciseIndex]?.sets[0]
    : null

  return (
    <View style={styles.sessionRoot}>
      <View style={styles.scrollWrapper}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          <MaxWidthContainer>
            <WorkoutHeader
              programName={state.sessionName}
              subtitle={`Session ${state.sessionIndex} · Exercise ${state.expandedExerciseIndex + 1} of ${state.exercises.length}`}
              elapsedMs={elapsedMs}
              onEnd={requestEnd}
            />

            <View
              style={styles.overallTrack}
              accessibilityRole="progressbar"
              accessibilityLabel="Overall workout progress"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.round(overall * 100)
              }}
            >
              <View
                style={[styles.overallFill, { width: `${overall * 100}%` }]}
              />
            </View>

            <View style={styles.list}>
              {state.exercises.map((ex, idx) => (
                <View key={ex.exerciseId} onLayout={handleExerciseLayout(idx)}>
                  <ExerciseAccordionItem
                    exercise={ex}
                    exerciseIndex={idx}
                    isExpanded={idx === state.expandedExerciseIndex}
                    onToggle={() => handleExpandExercise(idx)}
                    onSetRepsPress={sIdx => openEditor(idx, sIdx, 'reps')}
                    onSetWeightPress={sIdx => openEditor(idx, sIdx, 'weight')}
                    onSetConfirm={sIdx => handleLogSet(idx, sIdx)}
                    onSetPress={sIdx => handleSetPress(idx, sIdx)}
                    onAddSet={() => handleAddSet(idx)}
                    onMoveUp={() => handleMove(idx, idx - 1)}
                    onMoveDown={() => handleMove(idx, idx + 1)}
                    canMoveUp={reorderable(idx - 1)}
                    canMoveDown={reorderable(idx + 1)}
                    focusedField={focusForExercise(idx)}
                  />
                </View>
              ))}
            </View>
          </MaxWidthContainer>
        </ScrollView>
      </View>

      {restTimerActive && activeLoc ? (
        <RestSheet
          remainingMs={restRemainingMs}
          durationMs={state.restTimer.durationMs}
          nextSetNumber={activeLoc.setIndex + 1}
          nextExerciseName={
            state.exercises[activeLoc.exerciseIndex].exerciseName
          }
          nextWeight={
            state.exercises[activeLoc.exerciseIndex].sets[activeLoc.setIndex]
              .weight
          }
          nextReps={
            state.exercises[activeLoc.exerciseIndex].sets[activeLoc.setIndex]
              .reps
          }
          onExtend={handleExtendRest}
          onSkip={dismissRest}
        />
      ) : activeLoc ? (
        <LogActionBar
          setNumber={activeLoc.setIndex + 1}
          exerciseName={state.exercises[activeLoc.exerciseIndex].exerciseName}
          weight={
            state.exercises[activeLoc.exerciseIndex].sets[activeLoc.setIndex]
              .weight
          }
          reps={
            state.exercises[activeLoc.exerciseIndex].sets[activeLoc.setIndex]
              .reps
          }
          onLog={() => handleLogSet(activeLoc.exerciseIndex, activeLoc.setIndex)}
        />
      ) : null}

      {editor && editorSet ? (
        <InlineSetEditor
          visible
          field={editor.field}
          setNumber={editor.setIndex + 1}
          status={editorSet.status}
          value={editor.field === 'weight' ? editorSet.weight : editorSet.reps}
          prefillBase={
            editor.field === 'weight'
              ? editorBaseSet?.weight ?? 0
              : editorBaseSet?.reps ?? 0
          }
          onChange={handleEditorChange}
          onDone={handleEditorDone}
          onSecondary={handleEditorSecondary}
        />
      ) : null}

      <ConfirmationModal
        visible={showEndConfirmation}
        title="End workout?"
        message={`${pendingSetsCount} sets remaining will be marked as skipped.`}
        confirmLabel="End Workout"
        cancelLabel="Keep Going"
        onConfirm={confirmEnd}
        onCancel={cancelEnd}
      />
    </View>
  )
}

export default function ProgramSession() {
  const params = useLocalSearchParams()
  const id = params.id as string
  const index = Number(params.index)

  const persistedState = useMemo(() => {
    const state = readPersistedWorkout()
    if (!state) return null
    if (state.programSlug !== id || state.sessionIndex !== index) return null
    return state
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read the persisted workout once on mount
  }, [])

  const { data: programs, loading: programsLoading } = usePrograms()
  const { data: exercises, loading: exercisesLoading } = useExercises()

  const program = useMemo(
    () => programs?.find((p: Program) => p.id === id) ?? null,
    [programs, id]
  )

  const exerciseNameById = useMemo(() => {
    const map = new Map<string, string>()
    exercises?.forEach(ex => map.set(ex.id, ex.name))
    return map
  }, [exercises])

  const exerciseIds = useMemo(
    () =>
      program?.blocks
        .filter(b => b.type === 'exercise')
        .map(b => b.exerciseId) ?? [],
    [program]
  )

  const { prefillMap, isLoading: prefillLoading } = usePrefill(exerciseIds)

  const freshState = useMemo(() => {
    if (persistedState) return null
    if (!program || prefillLoading) return null
    return buildInitialState(program, index, exerciseNameById, prefillMap)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- exerciseNameById excluded: initial state should only be built once when program/index/prefill change
  }, [program, index, prefillLoading, prefillMap, persistedState])

  const initialState = persistedState ?? freshState

  if (
    !persistedState &&
    (programsLoading || exercisesLoading || prefillLoading)
  ) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    )
  }

  if (!initialState) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Session unavailable.</Text>
      </View>
    )
  }

  return (
    <WorkoutExecutionProvider initialState={initialState}>
      <View style={styles.container}>
        <WorkoutSessionContent />
      </View>
    </WorkoutExecutionProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.session.appBg
  },
  sessionRoot: {
    flex: 1
  },
  scrollWrapper: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  content: {
    paddingTop: theme.spacing.sm
  },
  overallTrack: {
    height: 4,
    marginHorizontal: 22,
    backgroundColor: theme.colors.session.trackBg,
    borderRadius: 2,
    overflow: 'hidden'
  },
  overallFill: {
    height: '100%',
    backgroundColor: theme.colors.session.lime,
    borderRadius: 2
  },
  list: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginTop: theme.spacing.xxl
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.danger,
    textAlign: 'center',
    marginTop: theme.spacing.xxl
  }
})
