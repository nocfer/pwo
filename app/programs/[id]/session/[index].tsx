import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { MaxWidthContainer } from '@/components/common/MaxWidthContainer'
import { ExerciseAccordionItem } from '@/components/workout/ExerciseAccordionItem'
import { KeypadOverlay } from '@/components/workout/KeypadOverlay'
import { LogActionBar } from '@/components/workout/LogActionBar'
import { RestTimerBar } from '@/components/workout/RestTimerBar'
import { WorkoutHeader } from '@/components/workout/WorkoutHeader'
import {
  findNextPendingSet,
  WorkoutExecutionProvider
} from '@/context/WorkoutExecutionContext'
import { useExercises, usePrograms } from '@/hooks/data'
import {
  useElapsedTimer,
  useEndWorkout,
  useKeypadState,
  usePrefill,
  useRestTimer,
  useScrollToExercise,
  useWorkoutKeyboardHandlers,
  useWorkoutExecution,
  useWorkoutPersistence
} from '@/hooks/workout'
import { haptics } from '@/lib/haptics'
import { buildInitialState } from '@/lib/buildInitialState'
import { showToast } from '@/lib/toast'
import { readPersistedWorkout } from '@/lib/workout-persistence'
import { theme } from '@/theme/theme'
import type { Program } from '@/types'
import type { ExerciseState } from '@/types/workout'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native'

function isExercisePending(exercise: ExerciseState): boolean {
  return exercise.sets.every(s => s.status === 'pending')
}

function WorkoutSessionContent() {
  const {
    state,
    expandExercise,
    logSet,
    confirmSet,
    editSet,
    startRestTimer,
    completeWorkout,
    addSet,
    moveExercise
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
  const {
    keypadState,
    openKeypad,
    handleDigit,
    handleBackspace,
    handleDone,
    switchField,
    dismissKeypad
  } = useKeypadState()
  const navigation = useNavigation()
  const router = useRouter()
  const scrollRef = useRef<ScrollView>(null)
  const { height: screenHeight } = useWindowDimensions()
  const { handleExerciseLayout, scrollToExercise } = useScrollToExercise(
    scrollRef,
    screenHeight
  )

  const handleExpandExercise = useCallback(
    (exerciseIndex: number) => {
      dismissKeypad()
      expandExercise(exerciseIndex)
      scrollToExercise(exerciseIndex)
      haptics.navigationTap()
    },
    [dismissKeypad, expandExercise, scrollToExercise]
  )

  const keypadVisibleRef = useRef(keypadState.visible)
  keypadVisibleRef.current = keypadState.visible

  const openFieldEditor = useCallback(
    (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight') => {
      if (keypadVisibleRef.current) {
        switchField(exerciseIndex, setIndex, field)
      } else {
        openKeypad(exerciseIndex, setIndex, field)
      }
    },
    [openKeypad, switchField]
  )

  // Tapping a number: enter edit mode for a completed set, then open the editor.
  const handleValuePress = useCallback(
    (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight') => {
      const set = state.exercises[exerciseIndex]?.sets[setIndex]
      if (!set) return
      if (set.status === 'completed') {
        editSet(exerciseIndex, setIndex)
      }
      openFieldEditor(exerciseIndex, setIndex, field)
    },
    [state.exercises, editSet, openFieldEditor]
  )

  // Tapping the trailing box of a non-active row: edit (completed) or navigate.
  const handleSetPress = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      const set = state.exercises[exerciseIndex]?.sets[setIndex]
      if (!set) return
      if (set.status === 'completed') {
        editSet(exerciseIndex, setIndex)
        openFieldEditor(exerciseIndex, setIndex, 'reps')
      } else {
        expandExercise(exerciseIndex, setIndex)
        scrollToExercise(exerciseIndex)
        haptics.navigationTap()
      }
    },
    [state.exercises, editSet, openFieldEditor, expandExercise, scrollToExercise]
  )

  // One-tap log: commit the set, advance, rest or complete.
  const handleLogSet = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      const exercise = state.exercises[exerciseIndex]
      const set = exercise?.sets[setIndex]
      if (!set) return

      logSet(exerciseIndex, setIndex, set.reps, set.weight)
      confirmSet(exerciseIndex, setIndex)
      dismissKeypad()
      haptics.setConfirmed()

      const volume = set.weight * set.reps
      showToast({
        type: 'success',
        text1: `Set logged · +${volume} lb`,
        visibilityTime: 1500
      })

      const next = findNextPendingSet(state.exercises, exerciseIndex, setIndex)
      if (next) {
        const durationMs = exercise.restDurationMs ?? 60000
        if (durationMs > 0) startRestTimer(durationMs)
      } else {
        haptics.workoutCompleted()
        completeWorkout()
      }
    },
    [
      state.exercises,
      logSet,
      confirmSet,
      dismissKeypad,
      startRestTimer,
      completeWorkout
    ]
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

  useWorkoutKeyboardHandlers({
    state,
    keypadState,
    onSetConfirm: handleLogSet,
    openKeypad,
    switchField,
    dismissKeypad,
    onDigit: handleDigit,
    onBackspace: handleBackspace
  })

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

  if (state.isCompleted) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <MaxWidthContainer>
          <Text style={styles.completedText}>Workout Complete!</Text>
          <Pressable
            style={styles.doneButton}
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : router.replace('/(tabs)')
            }
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </MaxWidthContainer>
      </ScrollView>
    )
  }

  const focusForExercise = (exerciseIndex: number) =>
    keypadState.focus?.exerciseIndex === exerciseIndex
      ? { setIndex: keypadState.focus.setIndex, field: keypadState.focus.field }
      : null

  return (
    <View style={styles.sessionRoot}>
      <Pressable style={styles.scrollWrapper} onPress={dismissKeypad}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            keypadState.visible && {
              paddingBottom: screenHeight * 0.4 + theme.spacing.lg
            }
          ]}
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
                    onSetRepsPress={sIdx => handleValuePress(idx, sIdx, 'reps')}
                    onSetWeightPress={sIdx =>
                      handleValuePress(idx, sIdx, 'weight')
                    }
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
      </Pressable>

      {restTimerActive ? (
        <RestTimerBar
          remainingMs={restRemainingMs}
          isActive={restTimerActive}
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
          onLog={() =>
            handleLogSet(activeLoc.exerciseIndex, activeLoc.setIndex)
          }
        />
      ) : null}

      <KeypadOverlay
        visible={keypadState.visible}
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        onDone={handleDone}
      />

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
  completedText: {
    ...theme.typography.h1,
    color: theme.colors.session.green,
    textAlign: 'center',
    marginTop: theme.spacing.xxl
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignSelf: 'center',
    marginTop: theme.spacing.xl
  },
  doneButtonText: {
    ...theme.typography.body,
    color: theme.colors.primaryTextOn,
    fontFamily: theme.fonts.bold,
    textAlign: 'center'
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
