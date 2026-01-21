/**
 * Challenge Editor Component
 * Integrates ChallengeForm with data context
 */

import { useDataActions, useDataContext } from '@/context/DataContext'
import { useExercises } from '@/hooks/data'
import type { Program } from '@/types'
import { useCallback, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { ChallengeForm, type ChallengeFormData } from './ChallengeForm'

export type ChallengeEditorProps = {
  mode: 'create' | 'edit'
  challengeId?: string
  onSave?: (challenge: Program) => void
  onCancel?: () => void
}

export function ChallengeEditor({
  mode,
  challengeId,
  onSave,
  onCancel
}: ChallengeEditorProps) {
  const actions = useDataActions()
  const { state } = useDataContext()
  const { data: exercises } = useExercises()
  const [saving, setSaving] = useState(false)

  const existingChallenge = useMemo(() => {
    if (mode === 'edit' && challengeId) {
      const challenge = state.programs.find(
        (p: Program) => p.id === challengeId && p.challengeConfig
      )
      if (challenge?.challengeConfig) {
        return {
          name: challenge.name,
          challengeConfig: {
            exerciseId: challenge.challengeConfig.exerciseId,
            sets: challenge.challengeConfig.sets,
            targetReps: challenge.challengeConfig.targetReps,
            initialReps: challenge.challengeConfig.initialReps || 20,
            warmUpSeconds: challenge.challengeConfig.warmUpSeconds,
            breakSeconds: challenge.challengeConfig.breakSeconds,
            weeklyIncreasePercent:
              challenge.challengeConfig.weeklyIncreasePercent || 10
          }
        }
      }
    }
    return undefined
  }, [mode, challengeId, state.programs])

  const exerciseOptions = useMemo(() => {
    return (exercises || []).map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      source: exercise.source
    }))
  }, [exercises])

  const handleSave = useCallback(
    async (formData: ChallengeFormData) => {
      setSaving(true)
      try {
        const challengeData = {
          id: challengeId || '',
          name: formData.name,
          blocks: [],
          challengeConfig: {
            exerciseId: formData.challengeConfig.exerciseId,
            sets: formData.challengeConfig.sets,
            targetReps: formData.challengeConfig.targetReps,
            initialReps: formData.challengeConfig.initialReps,
            warmUpSeconds: formData.challengeConfig.warmUpSeconds,
            breakSeconds: formData.challengeConfig.breakSeconds,
            weeklyIncreasePercent:
              formData.challengeConfig.weeklyIncreasePercent
          }
        }

        const savedChallenge = await actions.upsertProgram(challengeData)

        if (onSave) {
          onSave(savedChallenge)
        }
      } catch (error) {
        throw error
      } finally {
        setSaving(false)
      }
    },
    [actions, challengeId, onSave]
  )

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    }
  }, [onCancel])

  return (
    <View style={styles.container}>
      <ChallengeForm
        mode={mode}
        initialData={existingChallenge}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
        exercises={exerciseOptions}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})
