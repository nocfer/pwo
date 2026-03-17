import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { MaxWidthContainer } from '@/components/common/MaxWidthContainer'
import { ExerciseAccordionItem } from '@/components/workout/ExerciseAccordionItem'
import { KeypadOverlay } from '@/components/workout/KeypadOverlay'
import { WorkoutHeader } from '@/components/workout/WorkoutHeader'
import { WorkoutExecutionProvider } from '@/context/WorkoutExecutionContext'
import { useExercises, usePrograms } from '@/hooks/data'
import {
  useElapsedTimer,
  useEndWorkout,
  useKeypadState,
  usePrefill,
  useScrollToExercise,
  useWorkoutKeyboardHandlers,
  useWorkoutExecution,
  useWorkoutPersistence
} from '@/hooks/workout'
import { buildInitialState } from '@/lib/buildInitialState'
import { theme } from '@/theme/theme'
import type { Program } from '@/types'
import { useLocalSearchParams, useNavigation } from 'expo-router'
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
  const { state, expandExercise, editSet, confirmSet, skipSet } =
    useWorkoutExecution()
  useWorkoutPersistence()
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
    },
    [dismissKeypad, expandExercise, scrollToExercise]
  )

  const handleFieldPress = useCallback(
    (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight') => {
      if (keypadState.visible) {
        switchField(exerciseIndex, setIndex, field)
      } else {
        openKeypad(exerciseIndex, setIndex, field)
      }
    },
    [keypadState.visible, openKeypad, switchField]
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
      confirmSet(exerciseIndex, setIndex)
      dismissKeypad()
    },
    [confirmSet, dismissKeypad]
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

export default function ProgramSessionV2() {
  const params = useLocalSearchParams()
  const id = params.id as string
  const index = Number(params.index)

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

  const initialState = useMemo(() => {
    if (!program || prefillLoading) return null
    return buildInitialState(program, index, exerciseNameById, prefillMap)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- exerciseNameById excluded: initial state should only be built once when program/index/prefill change
  }, [program, index, prefillLoading, prefillMap])

  if (programsLoading || exercisesLoading || prefillLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    )
  }

  if (!program || !initialState) {
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
