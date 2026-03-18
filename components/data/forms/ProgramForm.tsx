/**
 * Program Form Component
 * Clean, professional form for creating and editing workout programs
 */

import { haptics } from '@/lib/haptics'
import { validateProgram } from '@/lib/validation'
import { theme } from '@/theme/theme'
import type { ProgramBlock } from '@/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useCallback, useMemo, useState } from 'react'
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

type BlockDraft = {
  type: 'exercise'
  exerciseId: string
  targetReps?: string
  sets?: string
  restBetweenSets?: string
}

export type ProgramFormData = {
  name: string
  blocks: ProgramBlock[]
  initialWarmup?: { seconds: number }
  defaultRestBetweenExercises?: number
}

export type ProgramFormProps = {
  mode: 'create' | 'edit'
  initialData?: Partial<ProgramFormData>
  onSave: (data: ProgramFormData) => Promise<void>
  onCancel: () => void
  saving?: boolean
  exercises: { id: string; name: string; source: 'builtin' | 'user' | 'pt' }[]
}

const DEFAULT_WARMUP_SECONDS = 300
const DEFAULT_REST_BETWEEN_EXERCISES = 60
const DEFAULT_SETS = 3
const DEFAULT_REST_BETWEEN_SETS = 60

function secondsToMmss(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function mmssToSeconds(mmss: string): number {
  const trimmed = mmss.trim()
  if (!trimmed) return 0
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':')
    const mins = parseInt(parts[0], 10) || 0
    const secs = parseInt(parts[1], 10) || 0
    return mins * 60 + secs
  }
  return parseInt(trimmed, 10) || 0
}

function convertBlocksToDraft(blocks: ProgramBlock[]): BlockDraft[] {
  return blocks
    .filter(block => block.type === 'exercise')
    .map(block => ({
      type: 'exercise' as const,
      exerciseId: (block as { exerciseId: string }).exerciseId,
      targetReps: (block as { targetReps?: number }).targetReps
        ? String((block as { targetReps?: number }).targetReps)
        : '',
      sets: (block as { sets?: number }).sets
        ? String((block as { sets?: number }).sets)
        : String(DEFAULT_SETS),
      restBetweenSets: (block as { restBetweenSets?: number }).restBetweenSets
        ? secondsToMmss(
            (block as { restBetweenSets?: number }).restBetweenSets!
          )
        : secondsToMmss(DEFAULT_REST_BETWEEN_SETS)
    }))
}

function convertDraftToBlocks(drafts: BlockDraft[]): ProgramBlock[] {
  return drafts.map(draft => {
    const parsedSets = draft.sets ? Number(draft.sets) : DEFAULT_SETS
    const sets =
      Number.isInteger(parsedSets) && parsedSets >= 1
        ? parsedSets
        : DEFAULT_SETS

    const parsedRest = draft.restBetweenSets
      ? mmssToSeconds(draft.restBetweenSets)
      : DEFAULT_REST_BETWEEN_SETS
    const restBetweenSets =
      parsedRest >= 0 ? parsedRest : DEFAULT_REST_BETWEEN_SETS

    return {
      type: 'exercise',
      exerciseId: draft.exerciseId,
      targetReps: draft.targetReps ? Number(draft.targetReps) : undefined,
      sets,
      restBetweenSets
    }
  })
}

export function ProgramForm({
  mode,
  initialData,
  onSave,
  onCancel,
  saving = false,
  exercises
}: ProgramFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [blocksDraft, setBlocksDraft] = useState<BlockDraft[]>(
    convertBlocksToDraft(initialData?.blocks || [])
  )
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)
  const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(
    null
  )

  const [warmupEnabled, setWarmupEnabled] = useState(
    initialData?.initialWarmup !== undefined
  )
  const [warmupTime, setWarmupTime] = useState(
    secondsToMmss(initialData?.initialWarmup?.seconds ?? DEFAULT_WARMUP_SECONDS)
  )
  const [restEnabled, setRestEnabled] = useState(
    initialData?.defaultRestBetweenExercises !== undefined
  )
  const [restTime, setRestTime] = useState(
    secondsToMmss(
      initialData?.defaultRestBetweenExercises ?? DEFAULT_REST_BETWEEN_EXERCISES
    )
  )

  const exerciseNameById = useMemo(
    () =>
      exercises.reduce((map, ex) => {
        map.set(ex.id, ex.name)
        return map
      }, new Map<string, string>()),
    [exercises]
  )

  const addExercise = useCallback(() => {
    haptics.buttonTap()
    const firstExercise = exercises[0]?.id || ''
    setBlocksDraft(prev => [
      ...prev,
      {
        type: 'exercise',
        exerciseId: firstExercise,
        targetReps: '',
        sets: String(DEFAULT_SETS),
        restBetweenSets: secondsToMmss(DEFAULT_REST_BETWEEN_SETS)
      }
    ])
  }, [exercises])

  const removeExercise = useCallback((index: number) => {
    haptics.deleteItem()
    setBlocksDraft(prev => prev.filter((_, i) => i !== index))
  }, [])

  const moveExercise = useCallback(
    (fromIndex: number, direction: 'up' | 'down') => {
      haptics.buttonTap()
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
      setBlocksDraft(prev => {
        const newBlocks = [...prev]
        const [movedBlock] = newBlocks.splice(fromIndex, 1)
        newBlocks.splice(toIndex, 0, movedBlock)
        return newBlocks
      })
    },
    []
  )

  const updateExerciseField = useCallback(
    (index: number, field: string, value: string) => {
      setBlocksDraft(prev =>
        prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
      )
    },
    []
  )

  const handleSave = useCallback(async () => {
    const trimmed = name.trim()
    const finalBlocks = convertDraftToBlocks(blocksDraft)

    const warmupSeconds = warmupEnabled ? mmssToSeconds(warmupTime) : 0
    if (warmupEnabled && warmupSeconds <= 0) {
      haptics.formValidationError()
      Alert.alert('Validation Error', 'Warmup duration must be greater than 0')
      return
    }

    const defaultRestSeconds = restEnabled ? mmssToSeconds(restTime) : 0
    if (restEnabled && defaultRestSeconds < 0) {
      haptics.formValidationError()
      Alert.alert('Validation Error', 'Rest duration must be 0 or greater')
      return
    }

    for (let i = 0; i < blocksDraft.length; i++) {
      const block = blocksDraft[i]
      const setsValue = block.sets ? Number(block.sets) : DEFAULT_SETS
      const restValue = block.restBetweenSets
        ? mmssToSeconds(block.restBetweenSets)
        : DEFAULT_REST_BETWEEN_SETS

      if (!Number.isInteger(setsValue) || setsValue < 1) {
        haptics.formValidationError()
        Alert.alert(
          'Validation Error',
          `Exercise ${i + 1}: Sets must be at least 1`
        )
        return
      }

      if (restValue < 0) {
        haptics.formValidationError()
        Alert.alert(
          'Validation Error',
          `Exercise ${i + 1}: Rest duration must be 0 or greater`
        )
        return
      }
    }

    const initialWarmup = warmupEnabled
      ? { seconds: warmupSeconds || DEFAULT_WARMUP_SECONDS }
      : undefined

    const defaultRestBetweenExercises = restEnabled
      ? defaultRestSeconds || DEFAULT_REST_BETWEEN_EXERCISES
      : undefined

    const programData = {
      name: trimmed,
      blocks: finalBlocks,
      initialWarmup,
      defaultRestBetweenExercises
    }

    const validationResult = validateProgram(programData as never)

    if (!validationResult.isValid) {
      haptics.formValidationError()
      Alert.alert('Validation Error', validationResult.errors[0].message)
      return
    }

    if (exercises.length === 0) {
      haptics.formValidationError()
      Alert.alert(
        'Add an exercise first',
        'Create at least one exercise before creating a program.'
      )
      return
    }

    const exerciseIds = new Set(exercises.map(ex => ex.id))
    for (const block of finalBlocks) {
      if (block.type === 'exercise' && !exerciseIds.has(block.exerciseId)) {
        haptics.formValidationError()
        Alert.alert(
          'Invalid exercise',
          'One or more exercises no longer exist.'
        )
        return
      }
    }

    try {
      await onSave(programData)
      haptics.formSave()
    } catch (error) {
      haptics.formValidationError()
      Alert.alert(
        "Couldn't save",
        error instanceof Error ? error.message : String(error)
      )
    }
  }, [
    name,
    blocksDraft,
    warmupEnabled,
    warmupTime,
    restEnabled,
    restTime,
    exercises,
    onSave
  ])

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
          {mode === 'create' ? 'New Program' : 'Edit Program'}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={saving || !name.trim()}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && !saving && styles.saveButtonPressed,
            (saving || !name.trim()) && styles.saveButtonDisabled
          ]}
        >
          <Text
            style={[
              styles.saveButtonText,
              (saving || !name.trim()) && styles.saveButtonTextDisabled
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
        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Program Name</Text>
          <View style={styles.card}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Upper Body Strength"
              placeholderTextColor={theme.colors.muted}
              style={styles.nameInput}
              autoFocus={mode === 'create'}
            />
          </View>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          <View style={styles.card}>
            {/* Warmup Toggle */}
            <Pressable
              onPress={() => {
                haptics.buttonTap()
                setWarmupEnabled(prev => !prev)
              }}
              style={styles.optionRow}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.optionIcon,
                    warmupEnabled && styles.optionIconWarmup
                  ]}
                >
                  <Ionicons
                    name="flame"
                    size={18}
                    color={
                      warmupEnabled
                        ? theme.colors.phases.warmup
                        : theme.colors.muted
                    }
                  />
                </View>
                <View>
                  <Text style={styles.optionLabel}>Initial Warmup</Text>
                  {warmupEnabled && (
                    <Text style={styles.optionValue}>{warmupTime}</Text>
                  )}
                </View>
              </View>
              <View
                style={[styles.toggle, warmupEnabled && styles.toggleActive]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    warmupEnabled && styles.toggleKnobActive
                  ]}
                />
              </View>
            </Pressable>

            {warmupEnabled && (
              <View style={styles.optionExpanded}>
                <Text style={styles.optionExpandedLabel}>Duration (mm:ss)</Text>
                <TextInput
                  value={warmupTime}
                  onChangeText={setWarmupTime}
                  style={styles.timeInput}
                  placeholder="5:00"
                  placeholderTextColor={theme.colors.muted}
                />
              </View>
            )}

            <View style={styles.divider} />

            {/* Rest Toggle */}
            <Pressable
              onPress={() => {
                haptics.buttonTap()
                setRestEnabled(prev => !prev)
              }}
              style={styles.optionRow}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.optionIcon,
                    restEnabled && styles.optionIconRest
                  ]}
                >
                  <Ionicons
                    name="timer"
                    size={18}
                    color={
                      restEnabled
                        ? theme.colors.phases.break
                        : theme.colors.muted
                    }
                  />
                </View>
                <View>
                  <Text style={styles.optionLabel}>Rest Between Exercises</Text>
                  {restEnabled && (
                    <Text style={styles.optionValue}>{restTime}</Text>
                  )}
                </View>
              </View>
              <View style={[styles.toggle, restEnabled && styles.toggleActive]}>
                <View
                  style={[
                    styles.toggleKnob,
                    restEnabled && styles.toggleKnobActive
                  ]}
                />
              </View>
            </Pressable>

            {restEnabled && (
              <View style={styles.optionExpanded}>
                <Text style={styles.optionExpandedLabel}>Duration (mm:ss)</Text>
                <TextInput
                  value={restTime}
                  onChangeText={setRestTime}
                  style={styles.timeInput}
                  placeholder="1:00"
                  placeholderTextColor={theme.colors.muted}
                />
              </View>
            )}
          </View>
        </View>

        {/* Exercises */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            <Pressable
              onPress={addExercise}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed
              ]}
            >
              <Ionicons name="add" size={18} color={theme.colors.primary} />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>

          {blocksDraft.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="barbell-outline"
                size={40}
                color={theme.colors.muted}
              />
              <Text style={styles.emptyText}>
                Add exercises to build your program
              </Text>
              <Pressable
                onPress={addExercise}
                style={({ pressed }) => [
                  styles.emptyButton,
                  pressed && styles.emptyButtonPressed
                ]}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={theme.colors.primaryTextOn}
                />
                <Text style={styles.emptyButtonText}>Add Exercise</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.exerciseList}>
              {blocksDraft.map((block, index) => (
                <View key={index} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseNumber}>
                      <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        haptics.buttonTap()
                        setPickerTargetIndex(index)
                        setExercisePickerOpen(true)
                      }}
                      style={({ pressed }) => [
                        styles.exercisePicker,
                        pressed && styles.exercisePickerPressed
                      ]}
                    >
                      <Text
                        style={[
                          styles.exercisePickerText,
                          !block.exerciseId && styles.exercisePickerPlaceholder
                        ]}
                        numberOfLines={1}
                      >
                        {exerciseNameById.get(block.exerciseId) ||
                          'Select exercise'}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={theme.colors.muted}
                      />
                    </Pressable>
                    <View style={styles.exerciseActions}>
                      {index > 0 && (
                        <Pressable
                          onPress={() => moveExercise(index, 'up')}
                          style={styles.actionButton}
                        >
                          <Ionicons
                            name="chevron-up"
                            size={18}
                            color={theme.colors.muted}
                          />
                        </Pressable>
                      )}
                      {index < blocksDraft.length - 1 && (
                        <Pressable
                          onPress={() => moveExercise(index, 'down')}
                          style={styles.actionButton}
                        >
                          <Ionicons
                            name="chevron-down"
                            size={18}
                            color={theme.colors.muted}
                          />
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => removeExercise(index)}
                        style={styles.actionButton}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={theme.colors.danger}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.exerciseFields}>
                    <View style={styles.exerciseField}>
                      <Text style={styles.exerciseFieldLabel}>Reps</Text>
                      <TextInput
                        value={block.targetReps || ''}
                        onChangeText={v =>
                          updateExerciseField(index, 'targetReps', v)
                        }
                        keyboardType="number-pad"
                        style={styles.exerciseFieldInput}
                        placeholder="10"
                        placeholderTextColor={theme.colors.muted}
                      />
                    </View>
                    <View style={styles.exerciseField}>
                      <Text style={styles.exerciseFieldLabel}>Sets</Text>
                      <TextInput
                        value={block.sets || String(DEFAULT_SETS)}
                        onChangeText={v => {
                          const cleaned = v.replace(/[^0-9]/g, '')
                          updateExerciseField(index, 'sets', cleaned)
                        }}
                        keyboardType="number-pad"
                        style={styles.exerciseFieldInput}
                        placeholder="3"
                        placeholderTextColor={theme.colors.muted}
                      />
                    </View>
                    <View style={styles.exerciseField}>
                      <Text style={styles.exerciseFieldLabel}>Rest</Text>
                      <TextInput
                        value={
                          block.restBetweenSets ||
                          secondsToMmss(DEFAULT_REST_BETWEEN_SETS)
                        }
                        onChangeText={v =>
                          updateExerciseField(index, 'restBetweenSets', v)
                        }
                        style={styles.exerciseFieldInput}
                        placeholder="1:00"
                        placeholderTextColor={theme.colors.muted}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
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
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {exercises.map(exercise => {
                const isSelected =
                  pickerTargetIndex !== null &&
                  blocksDraft[pickerTargetIndex]?.exerciseId === exercise.id
                return (
                  <Pressable
                    key={exercise.id}
                    onPress={() => {
                      if (pickerTargetIndex === null) return
                      haptics.buttonTap()
                      updateExerciseField(
                        pickerTargetIndex,
                        'exerciseId',
                        exercise.id
                      )
                      setExercisePickerOpen(false)
                      setPickerTargetIndex(null)
                    }}
                    style={({ pressed }) => [
                      styles.modalItem,
                      isSelected && styles.modalItemSelected,
                      pressed && styles.modalItemPressed
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextSelected
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
                <View style={styles.modalEmpty}>
                  <Ionicons
                    name="fitness-outline"
                    size={32}
                    color={theme.colors.muted}
                  />
                  <Text style={styles.modalEmptyText}>
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
    ...theme.typography.h2,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
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
  nameInput: {
    ...theme.typography.body,
    color: theme.colors.text,
    padding: theme.spacing.lg
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background
  },
  optionIconWarmup: {
    backgroundColor: theme.colors.phases.warmupBg
  },
  optionIconRest: {
    backgroundColor: theme.colors.phases.breakBg
  },
  optionLabel: {
    ...theme.typography.body,
    color: theme.colors.text
  },
  optionValue: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: 2
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.border,
    padding: 2,
    justifyContent: 'center'
  },
  toggleActive: {
    backgroundColor: theme.colors.primary
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surface
  },
  toggleKnobActive: {
    alignSelf: 'flex-end'
  },
  optionExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    paddingLeft: 72
  },
  optionExpandedLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  timeInput: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
    textAlign: 'center',
    width: 80,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginHorizontal: theme.spacing.lg
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight
  },
  addButtonPressed: {
    opacity: 0.7
  },
  addButtonText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadows.sm
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center'
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm
  },
  emptyButtonPressed: {
    opacity: 0.9
  },
  emptyButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  exerciseList: {
    gap: theme.spacing.sm
  },
  exerciseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadows.sm
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  exerciseNumberText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primaryTextOn
  },
  exercisePicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background
  },
  exercisePickerPressed: {
    backgroundColor: theme.colors.border
  },
  exercisePickerText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flex: 1
  },
  exercisePickerPlaceholder: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  exerciseFields: {
    flexDirection: 'row',
    gap: theme.spacing.sm
  },
  exerciseField: {
    flex: 1,
    gap: theme.spacing.xs
  },
  exerciseFieldLabel: {
    ...theme.typography.small,
    color: theme.colors.muted,
    textAlign: 'center'
  },
  exerciseFieldInput: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    textAlign: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md
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
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center'
  },
  modalList: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xs
  },
  modalItemSelected: {
    backgroundColor: theme.colors.primaryLight
  },
  modalItemPressed: {
    backgroundColor: theme.colors.background
  },
  modalItemText: {
    ...theme.typography.body,
    color: theme.colors.text
  },
  modalItemTextSelected: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.md
  },
  modalEmptyText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center'
  }
})
