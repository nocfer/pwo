import { ErrorScreen } from '@/components/common'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { DeleteButton } from '@/components/common/DeleteButton'
import {
  ProgramForm,
  type ProgramFormData
} from '@/components/data/forms/ProgramForm'
import { useDataActions } from '@/context/DataContext'
import { useExercises, usePrograms } from '@/hooks/data'
import { haptics } from '@/lib/haptics'
import { showError, showSuccess } from '@/lib/toast'
import { theme } from '@/theme/theme'
import { Program } from '@/types'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function EditProgramScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: programs } = usePrograms()
  const { data: exercises } = useExercises()
  const actions = useDataActions()
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const program = useMemo(
    () =>
      programs?.find((p: Program) => p.id === id && !p.challengeConfig) ?? null,
    [programs, id]
  )

  async function handleSave(formData: ProgramFormData) {
    if (!program) return

    setSaving(true)
    try {
      await actions.upsertProgram({
        id: program.id,
        name: formData.name,
        blocks: formData.blocks,
        initialWarmup: formData.initialWarmup,
        defaultRestBetweenExercises: formData.defaultRestBetweenExercises
      })
      router.back()
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePress = useCallback(() => {
    if (!program) return
    setDeleteModalVisible(true)
    haptics.deleteItem()
  }, [program])

  const handleConfirmDelete = useCallback(async () => {
    if (!program) return

    setDeleting(true)
    try {
      await actions.deleteProgram(program.id)
      haptics.deleteItem()
      showSuccess(`${program.name} deleted`)
      router.back()
    } catch (error: any) {
      haptics.formValidationError()
      showError('Failed to delete program', error.message)
    } finally {
      setDeleting(false)
      setDeleteModalVisible(false)
    }
  }, [program, actions])

  const handleCancelDelete = useCallback(() => {
    setDeleteModalVisible(false)
  }, [])

  if (!program) {
    return <ErrorScreen message="Program not found." />
  }

  if (program.source === 'builtin') {
    return <ErrorScreen message="Built-in programs cannot be edited." />
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProgramForm
        mode="edit"
        initialData={{
          name: program.name,
          blocks: program.blocks,
          initialWarmup: program.initialWarmup,
          defaultRestBetweenExercises: program.defaultRestBetweenExercises
        }}
        onSave={handleSave}
        onCancel={router.back}
        saving={saving}
        exercises={exercises ?? []}
      />

      {/* Delete Section - Only for user content */}
      {program.source === 'user' && (
        <View style={styles.deleteSection}>
          <DeleteButton
            onPress={handleDeletePress}
            disabled={saving || deleting}
            loading={deleting}
            accessibilityLabel={`Delete ${program.name}`}
          />
        </View>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Program?"
        message="This action cannot be undone."
        itemName={program.name}
        itemType="program"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleting}
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
