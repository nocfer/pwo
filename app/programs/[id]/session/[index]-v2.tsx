/**
 * Temporary v2 workout session route.
 *
 * Mounts the new WorkoutExecutionContext alongside the existing [index].tsx.
 * Full UI components come in Stories 2.2-2.4.
 */

import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { MaxWidthContainer } from '@/components/common/MaxWidthContainer'
import { WorkoutHeader } from '@/components/workout/WorkoutHeader'
import { WorkoutExecutionProvider } from '@/context/WorkoutExecutionContext'
import { useExercises, usePrograms } from '@/hooks/data'
import {
  useElapsedTimer,
  useEndWorkout,
  useWorkoutExecution
} from '@/hooks/workout'
import { theme } from '@/theme/theme'
import type { Program, SetStatus } from '@/types'
import type { ExerciseState, WorkoutState } from '@/types/workout'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useCallback, useEffect, useMemo } from 'react'
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native'

function buildInitialState(
  program: Program,
  sessionIndex: number,
  exerciseNameById: Map<string, string>
): WorkoutState {
  const exercises: ExerciseState[] = program.blocks
    .filter(block => block.type === 'exercise')
    .map(block => ({
      exerciseId: block.exerciseId,
      exerciseName: exerciseNameById.get(block.exerciseId) ?? block.exerciseId,
      sets: Array.from({ length: block.sets ?? 1 }, () => ({
        reps:
          typeof block.targetReps === 'number'
            ? block.targetReps
            : Array.isArray(block.targetReps) && block.targetReps.length > 0
              ? block.targetReps[0]
              : 0,
        weight: 0,
        status: 'pending' as SetStatus
      }))
    }))

  if (exercises.length > 0 && exercises[0].sets.length > 0) {
    exercises[0].sets[0].status = 'active'
  }

  return {
    workoutId: `${program.id}_${sessionIndex}_${Date.now()}`,
    programSlug: program.id,
    sessionIndex,
    sessionName: program.name,
    exercises,
    expandedExerciseIndex: 0,
    activeSetIndex: 0,
    restTimer: { isActive: false, startedAt: 0, durationMs: 0 },
    startedAt: Date.now(),
    completedAt: null,
    isCompleted: false
  }
}

function WorkoutSessionContent() {
  const { state } = useWorkoutExecution()
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
  const navigation = useNavigation()

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

  if (state.isCompleted) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <MaxWidthContainer>
          <Text style={styles.completedText}>Workout Complete!</Text>
        </MaxWidthContainer>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <MaxWidthContainer>
        <WorkoutHeader
          programName={state.sessionName}
          sessionName={`Session ${state.sessionIndex}`}
          elapsedMs={elapsedMs}
          onEnd={requestEnd}
        />

        {state.exercises.map((ex, idx) => (
          <View
            key={ex.exerciseId}
            style={[
              styles.exerciseCard,
              idx === state.expandedExerciseIndex && styles.exerciseCardActive
            ]}
          >
            <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
            <Text style={styles.setCount}>
              {ex.sets.length} set{ex.sets.length !== 1 ? 's' : ''}
            </Text>
          </View>
        ))}
      </MaxWidthContainer>

      <ConfirmationModal
        visible={showEndConfirmation}
        title="End workout?"
        message={`${pendingSetsCount} sets remaining will be marked as skipped.`}
        confirmLabel="End Workout"
        cancelLabel="Keep Going"
        onConfirm={confirmEnd}
        onCancel={cancelEnd}
      />
    </ScrollView>
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

  const initialState = useMemo(() => {
    if (!program) return null
    return buildInitialState(program, index, exerciseNameById)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- exerciseNameById excluded: initial state should only be built once when program/index change, not when exercise names re-fetch
  }, [program, index])

  if (programsLoading || exercisesLoading) {
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
  exerciseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm
  },
  exerciseCardActive: {
    borderWidth: 1,
    borderColor: theme.colors.primary
  },
  exerciseName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  setCount: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    marginTop: theme.spacing.xs
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
