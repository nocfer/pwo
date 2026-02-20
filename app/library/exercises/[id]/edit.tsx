import { ErrorScreen } from '@/components/common'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { DeleteButton } from '@/components/common/DeleteButton'
import { DependencyErrorModal } from '@/components/common/DependencyErrorModal'
import {
  ExerciseForm,
  type ExerciseFormData
} from '@/components/data/forms/ExerciseForm'
import { useDataActions, useDataContext } from '@/context/DataContext'
import { useExercises } from '@/hooks/data'
import { canSafelyDelete } from '@/lib/dependencyChecker'
import { notifyError, notifySuccess, notifyWarning } from '@/lib/haptics'
import { showError, showSuccess } from '@/lib/toast'
import { theme } from '@/theme/theme'
import { Exercise, Program } from '@/types'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function EditExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data } = useExercises()
  const { state } = useDataContext()
  const actions = useDataActions()
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [dependencyErrorVisible, setDependencyErrorVisible] = useState(false)
  const [dependentPrograms, setDependentPrograms] = useState<Program[]>([])
  const [deleting, setDeleting] = useState(false)

  const exercise = useMemo(
    () => data?.find((e: Exercise) => e.id === id) ?? null,
    [data, id]
  )

  async function handleSave(formData: ExerciseFormData) {
    setSaving(true)
    try {
      await actions.upsertExercise({
        id,
        name: formData.name,
        category: formData.category,
        icon: formData.icon
      })
      router.back()
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePress = useCallback(() => {
    if (!exercise) return

    // Check dependencies
    const check = canSafelyDelete(
      'exercises',
      exercise.id,
      state.exercises,
      state.programs
    )

    if (!check.canDelete) {
      setDependentPrograms(check.dependencies.programs || [])
      setDependencyErrorVisible(true)
      notifyError()
    } else {
      setDeleteModalVisible(true)
      notifyWarning()
    }
  }, [exercise, state.exercises, state.programs])

  const handleConfirmDelete = useCallback(async () => {
    if (!exercise) return

    setDeleting(true)
    try {
      await actions.deleteExercise(exercise.id)
      notifySuccess()
      showSuccess(`${exercise.name} deleted`)
      router.back()
    } catch (error: any) {
      notifyError()
      showError('Failed to delete exercise', error.message)
    } finally {
      setDeleting(false)
      setDeleteModalVisible(false)
    }
  }, [exercise, actions])

  const handleCancelDelete = useCallback(() => {
    setDeleteModalVisible(false)
  }, [])

  const handleDismissDependencyError = useCallback(() => {
    setDependencyErrorVisible(false)
    setDependentPrograms([])
  }, [])

  if (!exercise) {
    return <ErrorScreen message="Exercise not found." />
  }

  if (exercise.source === 'builtin') {
    return <ErrorScreen message="Built-in exercises cannot be edited." />
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExerciseForm
        mode="edit"
        initialData={{
          name: exercise.name,
          category: exercise.category,
          icon: exercise.icon
        }}
        onSave={handleSave}
        onCancel={router.back}
        saving={saving}
      />

      {/* Delete Section - Only for user content */}
      {exercise.source === 'user' && (
        <View style={styles.deleteSection}>
          <DeleteButton
            variant="text"
            onPress={handleDeletePress}
            disabled={saving || deleting}
            loading={deleting}
            accessibilityLabel={`Delete ${exercise.name}`}
          />
        </View>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Exercise?"
        message="This action cannot be undone."
        itemName={exercise.name}
        itemType="exercise"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleting}
      />

      {/* Dependency Error Modal */}
      <DependencyErrorModal
        visible={dependencyErrorVisible}
        itemName={exercise.name}
        itemType="exercise"
        dependentPrograms={dependentPrograms}
        onDismiss={handleDismissDependencyError}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  deleteSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.background
  }
})
