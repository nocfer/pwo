import { ErrorScreen } from '@/components/common'
import {
  ProgramForm,
  type ProgramFormData
} from '@/components/data/forms/ProgramForm'
import { useDataActions } from '@/context/DataContext'
import { useExercises, usePrograms } from '@/hooks/data'
import { theme } from '@/theme/theme'
import { Program } from '@/types'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function EditProgramScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: programs } = usePrograms()
  const { data: exercises } = useExercises()
  const actions = useDataActions()
  const [saving, setSaving] = useState(false)

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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  }
})
