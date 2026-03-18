import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { MaxWidthContainer } from '@/components/common/MaxWidthContainer'
import { ExerciseAccordionItem } from '@/components/workout/ExerciseAccordionItem'
import { KeypadOverlay } from '@/components/workout/KeypadOverlay'
import { RestTimerBar } from '@/components/workout/RestTimerBar'
import { WorkoutHeader } from '@/components/workout/WorkoutHeader'
import { WorkoutExecutionProvider } from '@/context/WorkoutExecutionContext'
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
import { readPersistedWorkout } from '@/lib/workout-persistence'
import { theme } from '@/theme/theme'
import type { Program } from '@/types'
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

function WorkoutSessionContent() {
  const {
    state,
    expandExercise,
    editSet,
    confirmSet,
    skipSet,
    startRestTimer
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

  const handleFieldPress = useCallback(
    (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight') => {
      if (keypadVisibleRef.current) {
        switchField(exerciseIndex, setIndex, field)
      } else {
        openKeypad(exerciseIndex, setIndex, field)
      }
    },
    [openKeypad, switchField]
  )

  const handleSetDotNavigation = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      const set = state.exercises[exerciseIndex].sets[setIndex]
      if (set.status === 'editing') return
      if (set.status === 'completed') {
        editSet(exerciseIndex, setIndex)
        handleFieldPress(exerciseIndex, setIndex, 'reps')
      } else {
        expandExercise(exerciseIndex, setIndex)
      }
      scrollToExercise(exerciseIndex)
      haptics.navigationTap()
    },
    [
      state.exercises,
      editSet,
      expandExercise,
      handleFieldPress,
      scrollToExercise
    ]
  )

  const handleSetRowPress = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      const set = state.exercises[exerciseIndex].sets[setIndex]
      if (set.status === 'completed') {
        editSet(exerciseIndex, setIndex)
      }
      handleFieldPress(exerciseIndex, setIndex, 'reps')
    },
    [state.exercises, editSet, handleFieldPress]
  )

  const handleSetConfirm = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      const exercise = state.exercises[exerciseIndex]
      const pendingSets = exercise.sets.filter(
        s => s.status !== 'completed' && s.status !== 'skipped'
      )
      const isLastPendingSet = pendingSets.length === 1

      confirmSet(exerciseIndex, setIndex)
      dismissKeypad()
      haptics.setConfirmed()
      if (isLastPendingSet) {
        haptics.exerciseCompleted()
      }

      const durationMs = exercise.restDurationMs ?? 60000
      if (durationMs > 0) {
        const allDone = state.exercises.every((ex, ei) =>
          ex.sets.every((s, si) =>
            ei === exerciseIndex && si === setIndex
              ? true
              : s.status === 'completed' || s.status === 'skipped'
          )
        )
        if (!allDone) {
          startRestTimer(durationMs)
        }
      }
    },
    [confirmSet, dismissKeypad, startRestTimer, state.exercises]
  )

  const handleSetSkip = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      skipSet(exerciseIndex, setIndex)
      dismissKeypad()
    },
    [skipSet, dismissKeypad]
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
    onSetConfirm: handleSetConfirm,
    openKeypad,
    switchField,
    dismissKeypad,
    onDigit: handleDigit,
    onBackspace: handleBackspace
  })

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
              sessionName={`Session ${state.sessionIndex}`}
              elapsedMs={elapsedMs}
              onEnd={requestEnd}
            />

            <RestTimerBar
              remainingMs={restRemainingMs}
              isActive={restTimerActive}
              onSkip={dismissRest}
            />

            {state.exercises.map((ex, idx) => (
              <View key={ex.exerciseId} onLayout={handleExerciseLayout(idx)}>
                <ExerciseAccordionItem
                  exercise={ex}
                  exerciseIndex={idx}
                  isExpanded={idx === state.expandedExerciseIndex}
                  onToggle={() => handleExpandExercise(idx)}
                  onSetDotPress={sIdx => handleSetDotNavigation(idx, sIdx)}
                  onSetRepsPress={sIdx => handleFieldPress(idx, sIdx, 'reps')}
                  onSetWeightPress={sIdx =>
                    handleFieldPress(idx, sIdx, 'weight')
                  }
                  onSetConfirm={sIdx => handleSetConfirm(idx, sIdx)}
                  onSetSkip={sIdx => handleSetSkip(idx, sIdx)}
                  onSetPress={sIdx => handleSetRowPress(idx, sIdx)}
                  focusedField={focusForExercise(idx)}
                />
              </View>
            ))}
          </MaxWidthContainer>
        </ScrollView>
      </Pressable>

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

  // eslint-disable-next-line react-hooks/exhaustive-deps -- synchronous MMKV read, only on mount
  const persistedState = useMemo(() => {
    const state = readPersistedWorkout()
    if (!state) return null
    if (state.programSlug !== id || state.sessionIndex !== index) return null
    return state
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
    backgroundColor: theme.colors.background
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
    padding: theme.spacing.lg
  },
  completedText: {
    ...theme.typography.h1,
    color: theme.colors.success,
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
    color: theme.colors.background,
    fontWeight: '600',
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
