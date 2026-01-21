/**
 * Challenge Form Component
 * Clean, professional form for creating and editing challenges
 */

import { haptics } from '@/lib/haptics'
import { autoAdjustChallengeConfig } from '@/lib/validation'
import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useCallback, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'

export type ChallengeFormData = {
  name: string
  challengeConfig: {
    exerciseId: string
    sets: number
    targetReps: number
    initialReps: number
    warmUpSeconds: number
    breakSeconds: number
    weeklyIncreasePercent: number
    duration?: number
  }
}

export type ChallengeFormProps = {
  mode: 'create' | 'edit'
  initialData?: Partial<ChallengeFormData>
  onSave: (data: ChallengeFormData) => Promise<void>
  onCancel: () => void
  saving?: boolean
  exercises: { id: string; name: string; source: 'builtin' | 'user' }[]
}

export function ChallengeForm({
  mode,
  initialData,
  onSave,
  onCancel,
  saving = false,
  exercises
}: ChallengeFormProps) {
  const [formData, setFormData] = useState<ChallengeFormData>({
    name: initialData?.name || '',
    challengeConfig: {
      exerciseId:
        initialData?.challengeConfig?.exerciseId || exercises[0]?.id || '',
      sets: initialData?.challengeConfig?.sets || 5,
      targetReps: initialData?.challengeConfig?.targetReps || 100,
      initialReps: initialData?.challengeConfig?.initialReps || 20,
      warmUpSeconds: initialData?.challengeConfig?.warmUpSeconds || 180,
      breakSeconds: initialData?.challengeConfig?.breakSeconds || 90,
      weeklyIncreasePercent:
        initialData?.challengeConfig?.weeklyIncreasePercent || 10,
      duration: initialData?.challengeConfig?.duration || 30
    }
  })

  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)

  const updateName = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, name: value }))
  }, [])

  const updateConfig = useCallback(
    <K extends keyof ChallengeFormData['challengeConfig']>(
      field: K,
      value: ChallengeFormData['challengeConfig'][K]
    ) => {
      setFormData(prev => {
        // Auto-adjust related fields to maintain valid configuration
        const adjustedConfig = autoAdjustChallengeConfig(
          field,
          value as number,
          prev.challengeConfig
        )

        return {
          ...prev,
          challengeConfig:
            adjustedConfig as ChallengeFormData['challengeConfig']
        }
      })
    },
    []
  )

  const selectedExercise = exercises.find(
    ex => ex.id === formData.challengeConfig.exerciseId
  )

  const handleSave = useCallback(async () => {
    const trimmed = formData.name.trim()

    if (!trimmed) {
      haptics.formValidationError()
      Alert.alert('Validation Error', 'Please enter a challenge name.')
      return
    }

    if (exercises.length === 0) {
      haptics.formValidationError()
      Alert.alert(
        'Add an exercise first',
        'Create at least one exercise before creating a challenge.'
      )
      return
    }

    const exerciseExists = exercises.some(
      ex => ex.id === formData.challengeConfig.exerciseId
    )
    if (!exerciseExists) {
      haptics.formValidationError()
      Alert.alert(
        'Invalid exercise',
        'Please select an exercise for this challenge.'
      )
      return
    }

    // Basic validation for required numeric fields
    if (formData.challengeConfig.initialReps <= 0) {
      haptics.formValidationError()
      Alert.alert('Validation Error', 'Initial reps must be greater than 0.')
      return
    }

    if (
      formData.challengeConfig.targetReps <=
      formData.challengeConfig.initialReps
    ) {
      haptics.formValidationError()
      Alert.alert(
        'Validation Error',
        'Target reps must be greater than initial reps.'
      )
      return
    }

    if (formData.challengeConfig.sets <= 0) {
      haptics.formValidationError()
      Alert.alert('Validation Error', 'Sets must be greater than 0.')
      return
    }

    try {
      await onSave({
        ...formData,
        name: trimmed
      })
      haptics.formSave()
    } catch (error) {
      haptics.formValidationError()
      Alert.alert(
        "Couldn't save",
        error instanceof Error ? error.message : String(error)
      )
    }
  }, [formData, exercises, onSave])

  const handleCancel = useCallback(() => {
    haptics.formCancel()
    onCancel()
  }, [onCancel])

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleCancel}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed
          ]}
        >
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {mode === 'create' ? 'New Challenge' : 'Edit Challenge'}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={saving || !formData.name.trim()}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && !saving && styles.saveButtonPressed,
            (saving || !formData.name.trim()) && styles.saveButtonDisabled
          ]}
        >
          <Text
            style={[
              styles.saveButtonText,
              (saving || !formData.name.trim()) && styles.saveButtonTextDisabled
            ]}
          >
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      {/* Form Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Challenge Name</Text>
              <TextInput
                value={formData.name}
                onChangeText={updateName}
                placeholder="e.g. 100 Push-ups Challenge"
                placeholderTextColor={theme.colors.muted}
                style={styles.textInput}
                autoFocus={mode === 'create'}
              />
            </View>

            <View style={styles.divider} />

            <Pressable
              onPress={() => {
                haptics.buttonTap()
                setExercisePickerOpen(true)
              }}
              style={({ pressed }) => [
                styles.pickerRow,
                pressed && styles.pickerRowPressed
              ]}
            >
              <Text style={styles.fieldLabel}>Exercise</Text>
              <View style={styles.pickerValue}>
                <Text
                  style={[
                    styles.pickerValueText,
                    !selectedExercise && styles.pickerPlaceholder
                  ]}
                >
                  {selectedExercise?.name || 'Select exercise'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.muted}
                />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goal</Text>
          <View style={styles.card}>
            <View style={styles.inlineField}>
              <View style={styles.inlineFieldLeft}>
                <View
                  style={[
                    styles.fieldIcon,
                    { backgroundColor: theme.colors.successLight }
                  ]}
                >
                  <Ionicons
                    name="flag"
                    size={18}
                    color={theme.colors.success}
                  />
                </View>
                <Text style={styles.inlineFieldLabel}>Target Reps</Text>
              </View>
              <TextInput
                value={String(formData.challengeConfig.targetReps)}
                onChangeText={value => {
                  const num = Number(value)
                  if (Number.isFinite(num) && num >= 0) {
                    updateConfig('targetReps', num)
                  }
                }}
                keyboardType="number-pad"
                style={styles.inlineInput}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.inlineField}>
              <View style={styles.inlineFieldLeft}>
                <View
                  style={[
                    styles.fieldIcon,
                    { backgroundColor: theme.colors.primaryLight }
                  ]}
                >
                  <Ionicons
                    name="calendar"
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.inlineFieldLabel}>Duration (days)</Text>
              </View>
              <TextInput
                value={
                  formData.challengeConfig.duration
                    ? String(formData.challengeConfig.duration)
                    : ''
                }
                onChangeText={value => {
                  const num = Number(value)
                  updateConfig(
                    'duration',
                    Number.isFinite(num) && num > 0 ? num : undefined
                  )
                }}
                keyboardType="number-pad"
                style={styles.inlineInput}
                placeholder="30"
                placeholderTextColor={theme.colors.muted}
              />
            </View>
          </View>
        </View>

        {/* Session Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Settings</Text>
          <View style={styles.card}>
            <View style={styles.inlineField}>
              <View style={styles.inlineFieldLeft}>
                <View
                  style={[
                    styles.fieldIcon,
                    { backgroundColor: theme.colors.successLight }
                  ]}
                >
                  <Ionicons
                    name="layers"
                    size={18}
                    color={theme.colors.success}
                  />
                </View>
                <Text style={styles.inlineFieldLabel}>Sets per Session</Text>
              </View>
              <TextInput
                value={String(formData.challengeConfig.sets)}
                onChangeText={value => {
                  const num = Number(value)
                  if (Number.isFinite(num) && num >= 0) {
                    updateConfig('sets', num)
                  }
                }}
                keyboardType="number-pad"
                style={styles.inlineInput}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.inlineField}>
              <View style={styles.inlineFieldLeft}>
                <View
                  style={[
                    styles.fieldIcon,
                    { backgroundColor: theme.colors.accentLight }
                  ]}
                >
                  <Ionicons
                    name="play-circle"
                    size={18}
                    color={theme.colors.accent}
                  />
                </View>
                <Text style={styles.inlineFieldLabel}>
                  Initial Reps per Set
                </Text>
              </View>
              <TextInput
                value={String(formData.challengeConfig.initialReps)}
                onChangeText={value => {
                  const num = Number(value)
                  if (Number.isFinite(num) && num >= 0) {
                    updateConfig('initialReps', num)
                  }
                }}
                keyboardType="number-pad"
                style={styles.inlineInput}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.inlineField}>
              <View style={styles.inlineFieldLeft}>
                <View
                  style={[
                    styles.fieldIcon,
                    { backgroundColor: theme.colors.primaryLight }
                  ]}
                >
                  <Ionicons
                    name="trending-up"
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.inlineFieldLabel}>Weekly Increase</Text>
              </View>
              <View style={styles.inlineInputWrapper}>
                <TextInput
                  value={String(formData.challengeConfig.weeklyIncreasePercent)}
                  onChangeText={value => {
                    const num = Number(value)
                    if (Number.isFinite(num) && num >= 0 && num <= 100) {
                      updateConfig('weeklyIncreasePercent', num)
                    }
                  }}
                  keyboardType="number-pad"
                  style={styles.inlineInput}
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Timing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timing</Text>
          <View style={styles.card}>
            {/* Warm-up */}
            <View style={styles.inlineField}>
              <View style={styles.inlineFieldLeft}>
                <View
                  style={[
                    styles.fieldIcon,
                    { backgroundColor: theme.colors.phases.warmupBg }
                  ]}
                >
                  <Ionicons
                    name="flame"
                    size={18}
                    color={theme.colors.phases.warmup}
                  />
                </View>
                <Text style={styles.inlineFieldLabel}>Warm-up</Text>
              </View>
              <View style={styles.timeInputGroup}>
                <View style={styles.timeInputWrapper}>
                  <TextInput
                    value={String(
                      Math.floor(formData.challengeConfig.warmUpSeconds / 60)
                    )}
                    onChangeText={value => {
                      const mins = value === '' ? 0 : Number(value)
                      if (Number.isFinite(mins) && mins >= 0) {
                        const secs = formData.challengeConfig.warmUpSeconds % 60
                        updateConfig('warmUpSeconds', mins * 60 + secs)
                      }
                    }}
                    keyboardType="number-pad"
                    style={styles.timeInput}
                    placeholder="0"
                    maxLength={3}
                  />
                  <Text style={styles.timeUnit}>min</Text>
                </View>
                <View style={styles.timeInputWrapper}>
                  <TextInput
                    value={String(formData.challengeConfig.warmUpSeconds % 60)}
                    onChangeText={value => {
                      let secs = value === '' ? 0 : Number(value)
                      if (Number.isFinite(secs) && secs >= 0) {
                        if (secs > 59) secs = 59
                        const mins = Math.floor(
                          formData.challengeConfig.warmUpSeconds / 60
                        )
                        updateConfig('warmUpSeconds', mins * 60 + secs)
                      }
                    }}
                    keyboardType="number-pad"
                    style={styles.timeInput}
                    placeholder="0"
                    maxLength={2}
                  />
                  <Text style={styles.timeUnit}>sec</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Rest Between Sets */}
            <View style={styles.inlineField}>
              <View style={styles.inlineFieldLeft}>
                <View
                  style={[
                    styles.fieldIcon,
                    { backgroundColor: theme.colors.phases.breakBg }
                  ]}
                >
                  <Ionicons
                    name="pause"
                    size={18}
                    color={theme.colors.phases.break}
                  />
                </View>
                <Text style={styles.inlineFieldLabel}>Rest Between Sets</Text>
              </View>
              <View style={styles.timeInputGroup}>
                <View style={styles.timeInputWrapper}>
                  <TextInput
                    value={String(
                      Math.floor(formData.challengeConfig.breakSeconds / 60)
                    )}
                    onChangeText={value => {
                      const mins = value === '' ? 0 : Number(value)
                      if (Number.isFinite(mins) && mins >= 0) {
                        const secs = formData.challengeConfig.breakSeconds % 60
                        updateConfig('breakSeconds', mins * 60 + secs)
                      }
                    }}
                    keyboardType="number-pad"
                    style={styles.timeInput}
                    placeholder="0"
                    maxLength={3}
                  />
                  <Text style={styles.timeUnit}>min</Text>
                </View>
                <View style={styles.timeInputWrapper}>
                  <TextInput
                    value={String(formData.challengeConfig.breakSeconds % 60)}
                    onChangeText={value => {
                      let secs = value === '' ? 0 : Number(value)
                      if (Number.isFinite(secs) && secs >= 0) {
                        if (secs > 59) secs = 59
                        const mins = Math.floor(
                          formData.challengeConfig.breakSeconds / 60
                        )
                        updateConfig('breakSeconds', mins * 60 + secs)
                      }
                    }}
                    keyboardType="number-pad"
                    style={styles.timeInput}
                    placeholder="0"
                    maxLength={2}
                  />
                  <Text style={styles.timeUnit}>sec</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal
        visible={exercisePickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setExercisePickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setExercisePickerOpen(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Exercise</Text>
            </View>
            <ScrollView
              style={styles.exerciseList}
              showsVerticalScrollIndicator={false}
            >
              {exercises.map(exercise => {
                const isSelected =
                  formData.challengeConfig.exerciseId === exercise.id
                return (
                  <Pressable
                    key={exercise.id}
                    onPress={() => {
                      haptics.buttonTap()
                      updateConfig('exerciseId', exercise.id)
                      setExercisePickerOpen(false)
                    }}
                    style={({ pressed }) => [
                      styles.exerciseItem,
                      isSelected && styles.exerciseItemSelected,
                      pressed && styles.exerciseItemPressed
                    ]}
                  >
                    <Text
                      style={[
                        styles.exerciseItemText,
                        isSelected && styles.exerciseItemTextSelected
                      ]}
                    >
                      {exercise.name}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={theme.colors.primary}
                      />
                    )}
                  </Pressable>
                )
              })}
              {exercises.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="fitness-outline"
                    size={32}
                    color={theme.colors.muted}
                  />
                  <Text style={styles.emptyText}>
                    No exercises available.{'\n'}Create an exercise first.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButtonPressed: {
    backgroundColor: theme.colors.surface
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  saveButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary
  },
  saveButtonPressed: {
    opacity: 0.9
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.border
  },
  saveButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  saveButtonTextDisabled: {
    color: theme.colors.muted
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2,
    gap: theme.spacing.xl
  },
  section: {
    gap: theme.spacing.sm
  },
  sectionTitle: {
    ...theme.typography.small,
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: theme.spacing.xs
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    ...theme.shadows.sm
  },
  field: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm
  },
  fieldLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  textInput: {
    ...theme.typography.body,
    color: theme.colors.text,
    padding: 0
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginHorizontal: theme.spacing.lg
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg
  },
  pickerRowPressed: {
    backgroundColor: theme.colors.background
  },
  pickerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs
  },
  pickerValueText: {
    ...theme.typography.body,
    color: theme.colors.text
  },
  pickerPlaceholder: {
    color: theme.colors.muted
  },
  inlineField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg
  },
  inlineFieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  inlineFieldLabel: {
    ...theme.typography.body,
    color: theme.colors.text
  },
  inlineInput: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
    textAlign: 'right',
    minWidth: 60,
    padding: 0
  },
  inlineInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0
  },
  inputSuffix: {
    ...theme.typography.body,
    color: theme.colors.muted,
    marginLeft: theme.spacing.xs
  },
  timeInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md
  },
  timeInputWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing.xs
  },
  timeInput: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
    textAlign: 'center',
    minWidth: 50,
    padding: 0
  },
  timeUnit: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '60%',
    paddingBottom: theme.spacing.xxl
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm
  },
  modalHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: 'center'
  },
  exerciseList: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xs
  },
  exerciseItemSelected: {
    backgroundColor: theme.colors.primaryLight
  },
  exerciseItemPressed: {
    backgroundColor: theme.colors.background
  },
  exerciseItemText: {
    ...theme.typography.body,
    color: theme.colors.text
  },
  exerciseItemTextSelected: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.md
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center'
  }
})
