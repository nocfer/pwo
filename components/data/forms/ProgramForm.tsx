/**
 * Program Form Component — "builder v2".
 * Single-session program builder: name, options (warmup / rest), and a list of
 * exercise blocks with ± steppers (sets / reps / rest), a per-block Advanced
 * panel (Reps/Timed type, per-set reps, note), reorder, and a searchable
 * multi-select add-exercises picker.
 */

import { haptics } from '@/lib/haptics'
import {
  formatCategoryLabel,
  formatCount,
  formatTime,
  getCategoryColors,
  getSourceBadge
} from '@/lib/utils'
import { VALID_EXERCISE_CATEGORIES, validateProgram } from '@/lib/validation'
import { theme } from '@/theme/theme'
import type { ExerciseCategory, ProgramBlock } from '@/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
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
import SegmentedControl from '../../common/SegmentedControl'
import { SearchInput } from '../../common/SearchInput'
import SelectionCheckbox from '../../common/SelectionCheckbox'
import ToggleSwitch from '../../common/ToggleSwitch'

type PickerExercise = {
  id: string
  name: string
  source: 'builtin' | 'user' | 'pt'
  category?: ExerciseCategory
  icon?: string
}

type BlockDraft = {
  exerciseId: string
  sets: number
  restBetweenSets: number // seconds
  mode: 'reps' | 'timed'
  reps: number
  perSetReps: boolean
  perSetRepsValues: number[]
  durationSeconds: number
  note: string
  advancedOpen: boolean
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
  exercises: PickerExercise[]
}

const DEFAULT_WARMUP_SECONDS = 300
const DEFAULT_REST_BETWEEN_EXERCISES = 60
const DEFAULT_SETS = 3
const DEFAULT_REST_BETWEEN_SETS = 60
const DEFAULT_REPS = 10
const DEFAULT_DURATION = 30
const REST_STEP = 5
const SECONDS_PER_REP = 4 // rough work-rate used only for the time estimate

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

function makeDraft(exerciseId: string): BlockDraft {
  return {
    exerciseId,
    sets: DEFAULT_SETS,
    restBetweenSets: DEFAULT_REST_BETWEEN_SETS,
    mode: 'reps',
    reps: DEFAULT_REPS,
    perSetReps: false,
    perSetRepsValues: Array(DEFAULT_SETS).fill(DEFAULT_REPS),
    durationSeconds: DEFAULT_DURATION,
    note: '',
    advancedOpen: false
  }
}

function convertBlocksToDraft(blocks: ProgramBlock[]): BlockDraft[] {
  return blocks
    .filter(block => block.type === 'exercise')
    .map(block => {
      const sets = block.sets && block.sets >= 1 ? block.sets : DEFAULT_SETS
      const isTimed = typeof block.durationSeconds === 'number'
      const perSetReps = Array.isArray(block.targetReps)
      const perSetRepsValues = perSetReps
        ? (block.targetReps as number[])
        : Array(sets).fill(
            typeof block.targetReps === 'number'
              ? block.targetReps
              : DEFAULT_REPS
          )
      return {
        exerciseId: block.exerciseId,
        sets,
        restBetweenSets: block.restBetweenSets ?? DEFAULT_REST_BETWEEN_SETS,
        mode: isTimed ? 'timed' : 'reps',
        reps:
          typeof block.targetReps === 'number' ? block.targetReps : DEFAULT_REPS,
        perSetReps,
        perSetRepsValues: resizeReps(perSetRepsValues, sets),
        durationSeconds: block.durationSeconds ?? DEFAULT_DURATION,
        note: block.note ?? '',
        advancedOpen: false
      }
    })
}

function resizeReps(values: number[], sets: number): number[] {
  const next = values.slice(0, sets)
  const fill = values[values.length - 1] ?? DEFAULT_REPS
  while (next.length < sets) next.push(fill)
  return next
}

function convertDraftToBlocks(drafts: BlockDraft[]): ProgramBlock[] {
  return drafts.map(draft => {
    const base = {
      type: 'exercise' as const,
      exerciseId: draft.exerciseId,
      sets: draft.sets,
      restBetweenSets: draft.restBetweenSets,
      ...(draft.note.trim() ? { note: draft.note.trim() } : {})
    }
    if (draft.mode === 'timed') {
      return { ...base, durationSeconds: draft.durationSeconds }
    }
    return {
      ...base,
      targetReps: draft.perSetReps
        ? resizeReps(draft.perSetRepsValues, draft.sets).map(r =>
            Math.max(1, r)
          )
        : draft.reps
    }
  })
}

function estimateMinutes(
  blocks: BlockDraft[],
  warmupEnabled: boolean,
  warmupSeconds: number,
  restEnabled: boolean,
  restBetween: number
): number {
  let total = warmupEnabled ? warmupSeconds : 0
  blocks.forEach((b, i) => {
    const work =
      b.mode === 'timed'
        ? b.sets * b.durationSeconds
        : b.perSetReps
          ? resizeReps(b.perSetRepsValues, b.sets).reduce((s, r) => s + r, 0) *
            SECONDS_PER_REP
          : b.sets * b.reps * SECONDS_PER_REP
    total += work + b.sets * b.restBetweenSets
    if (restEnabled && i < blocks.length - 1) total += restBetween
  })
  return Math.max(1, Math.round(total / 60))
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
  const [nameFocused, setNameFocused] = useState(false)
  const [blocks, setBlocks] = useState<BlockDraft[]>(
    convertBlocksToDraft(initialData?.blocks || [])
  )

  const [warmupEnabled, setWarmupEnabled] = useState(
    initialData?.initialWarmup !== undefined
  )
  const [warmupTime, setWarmupTime] = useState(
    formatTime(initialData?.initialWarmup?.seconds ?? DEFAULT_WARMUP_SECONDS)
  )
  const [restEnabled, setRestEnabled] = useState(
    initialData?.defaultRestBetweenExercises !== undefined
  )
  const [restTime, setRestTime] = useState(
    formatTime(
      initialData?.defaultRestBetweenExercises ?? DEFAULT_REST_BETWEEN_EXERCISES
    )
  )

  // Add-exercises picker state
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [pickerCategory, setPickerCategory] = useState<ExerciseCategory | 'all'>(
    'all'
  )
  const [pickerSelected, setPickerSelected] = useState<string[]>([])

  const exerciseById = useMemo(() => {
    const map = new Map<string, PickerExercise>()
    exercises.forEach(ex => map.set(ex.id, ex))
    return map
  }, [exercises])

  const estimatedMinutes = useMemo(
    () =>
      estimateMinutes(
        blocks,
        warmupEnabled,
        mmssToSeconds(warmupTime),
        restEnabled,
        mmssToSeconds(restTime)
      ),
    [blocks, warmupEnabled, warmupTime, restEnabled, restTime]
  )

  const updateBlock = useCallback(
    (index: number, patch: Partial<BlockDraft>) => {
      setBlocks(prev =>
        prev.map((b, i) => (i === index ? { ...b, ...patch } : b))
      )
    },
    []
  )

  const adjustSets = useCallback((index: number, delta: number) => {
    haptics.buttonTap()
    setBlocks(prev =>
      prev.map((b, i) => {
        if (i !== index) return b
        const sets = Math.max(1, b.sets + delta)
        return { ...b, sets, perSetRepsValues: resizeReps(b.perSetRepsValues, sets) }
      })
    )
  }, [])

  const adjustField = useCallback(
    (
      index: number,
      field: 'reps' | 'restBetweenSets' | 'durationSeconds',
      delta: number,
      min: number
    ) => {
      haptics.buttonTap()
      setBlocks(prev =>
        prev.map((b, i) =>
          i === index ? { ...b, [field]: Math.max(min, b[field] + delta) } : b
        )
      )
    },
    []
  )

  const setPerSetValue = useCallback(
    (index: number, setIdx: number, value: number) => {
      setBlocks(prev =>
        prev.map((b, i) => {
          if (i !== index) return b
          const values = resizeReps(b.perSetRepsValues, b.sets)
          values[setIdx] = value
          return { ...b, perSetRepsValues: values }
        })
      )
    },
    []
  )

  const removeBlock = useCallback((index: number) => {
    haptics.deleteItem()
    setBlocks(prev => prev.filter((_, i) => i !== index))
  }, [])

  const moveBlock = useCallback(
    (fromIndex: number, direction: 'up' | 'down') => {
      haptics.buttonTap()
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
      setBlocks(prev => {
        if (toIndex < 0 || toIndex >= prev.length) return prev
        const next = [...prev]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        return next
      })
    },
    []
  )

  // Picker
  const openPicker = useCallback(() => {
    haptics.buttonTap()
    setPickerQuery('')
    setPickerCategory('all')
    setPickerSelected([])
    setPickerOpen(true)
  }, [])

  const togglePickerSelect = useCallback((id: string) => {
    haptics.itemSelection()
    setPickerSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }, [])

  const confirmPicker = useCallback(() => {
    if (pickerSelected.length === 0) return
    haptics.buttonTap()
    setBlocks(prev => [...prev, ...pickerSelected.map(makeDraft)])
    setPickerOpen(false)
  }, [pickerSelected])

  const handleCreateExercise = useCallback(() => {
    haptics.buttonTap()
    setPickerOpen(false)
    router.push('/library/exercises/new')
  }, [])

  const filteredPickerExercises = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase()
    const existingIds = new Set(blocks.map(b => b.exerciseId))
    return exercises.filter(ex => {
      if (existingIds.has(ex.id)) return false // already in the program
      if (pickerCategory !== 'all' && ex.category !== pickerCategory) {
        return false
      }
      if (q && !ex.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [exercises, pickerQuery, pickerCategory, blocks])

  const handleSave = useCallback(async () => {
    const trimmed = name.trim()
    const finalBlocks = convertDraftToBlocks(blocks)

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

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]
      if (!Number.isInteger(block.sets) || block.sets < 1) {
        haptics.formValidationError()
        Alert.alert('Validation Error', `Exercise ${i + 1}: Sets must be at least 1`)
        return
      }
      if (block.restBetweenSets < 0) {
        haptics.formValidationError()
        Alert.alert(
          'Validation Error',
          `Exercise ${i + 1}: Rest duration must be 0 or greater`
        )
        return
      }
      if (block.mode === 'timed' && block.durationSeconds <= 0) {
        haptics.formValidationError()
        Alert.alert(
          'Validation Error',
          `Exercise ${i + 1}: Duration must be greater than 0`
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

    const exerciseIds = new Set(exercises.map(ex => ex.id))
    for (const block of finalBlocks) {
      if (block.type === 'exercise' && !exerciseIds.has(block.exerciseId)) {
        haptics.formValidationError()
        Alert.alert('Invalid exercise', 'One or more exercises no longer exist.')
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
  }, [name, blocks, warmupEnabled, warmupTime, restEnabled, restTime, exercises, onSave])

  const handleCancel = useCallback(() => {
    haptics.formCancel()
    onCancel()
  }, [onCancel])

  const saveDisabled = saving || !name.trim()

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
            styles.closeButton,
            pressed && styles.closeButtonPressed
          ]}
        >
          <Ionicons name="close" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {mode === 'create' ? 'New Program' : 'Edit Program'}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={saveDisabled}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && !saving && styles.saveButtonPressed,
            saveDisabled && styles.saveButtonDisabled
          ]}
        >
          <Text
            style={[
              styles.saveButtonText,
              saveDisabled && styles.saveButtonTextDisabled
            ]}
          >
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Program name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Program Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Upper Body Strength"
            placeholderTextColor={theme.colors.muted}
            style={[styles.nameInput, nameFocused && styles.nameInputFocused]}
            selectionColor={theme.colors.primary}
            cursorColor={theme.colors.primary}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            autoFocus={mode === 'create'}
          />
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Options</Text>
          <View style={styles.optionsCard}>
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: theme.colors.accentLight }]}>
                  <Ionicons name="flame" size={16} color={theme.colors.accent} />
                </View>
                <Text style={styles.optionLabel}>Initial warmup</Text>
              </View>
              <View style={styles.optionRight}>
                {warmupEnabled && (
                  <TextInput
                    value={warmupTime}
                    onChangeText={setWarmupTime}
                    style={[styles.timePill, styles.timePillWarmup]}
                    placeholder="5:00"
                    placeholderTextColor={theme.colors.muted}
                  />
                )}
                <ToggleSwitch
                  value={warmupEnabled}
                  onValueChange={setWarmupEnabled}
                  accessibilityLabel="Initial warmup"
                />
              </View>
            </View>

            <View style={styles.optionDivider} />

            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: theme.colors.infoLight }]}>
                  <Ionicons name="timer" size={16} color={theme.colors.info} />
                </View>
                <Text style={styles.optionLabel}>Rest between exercises</Text>
              </View>
              <View style={styles.optionRight}>
                {restEnabled && (
                  <TextInput
                    value={restTime}
                    onChangeText={setRestTime}
                    style={[styles.timePill, styles.timePillRest]}
                    placeholder="1:00"
                    placeholderTextColor={theme.colors.muted}
                  />
                )}
                <ToggleSwitch
                  value={restEnabled}
                  onValueChange={setRestEnabled}
                  accessibilityLabel="Rest between exercises"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Exercises */}
        <View style={styles.section}>
          <View style={styles.exercisesHeader}>
            <Text style={styles.sectionLabel}>
              {blocks.length > 0
                ? `Exercises · ${blocks.length} · ~${estimatedMinutes} min`
                : 'Exercises'}
            </Text>
            {blocks.length > 1 && (
              <Text style={styles.reorderHint}>reorder ↑↓</Text>
            )}
          </View>

          {blocks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="barbell-outline"
                size={36}
                color={theme.colors.muted}
              />
              <Text style={styles.emptyText}>
                Add exercises to build your program
              </Text>
            </View>
          ) : (
            <View style={styles.blockList}>
              {blocks.map((block, index) => {
                const ex = exerciseById.get(block.exerciseId)
                const showRepsStepper = block.mode === 'reps' && !block.perSetReps
                return (
                  <View
                    key={`${block.exerciseId}-${index}`}
                    style={[
                      styles.blockCard,
                      block.advancedOpen && styles.blockCardActive
                    ]}
                  >
                    <View style={styles.blockHeader}>
                      <Ionicons
                        name="reorder-three"
                        size={20}
                        color={theme.colors.faint}
                      />
                      <View style={styles.blockNumber}>
                        <Text style={styles.blockNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.blockName} numberOfLines={1}>
                        {ex?.name ?? 'Exercise'}
                      </Text>
                      {index > 0 && (
                        <Pressable
                          onPress={() => moveBlock(index, 'up')}
                          style={styles.blockIconBtn}
                          hitSlop={6}
                        >
                          <Ionicons
                            name="chevron-up"
                            size={16}
                            color={theme.colors.muted}
                          />
                        </Pressable>
                      )}
                      {index < blocks.length - 1 && (
                        <Pressable
                          onPress={() => moveBlock(index, 'down')}
                          style={styles.blockIconBtn}
                          hitSlop={6}
                        >
                          <Ionicons
                            name="chevron-down"
                            size={16}
                            color={theme.colors.muted}
                          />
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => removeBlock(index)}
                        style={styles.blockDeleteBtn}
                        hitSlop={6}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={theme.colors.danger}
                        />
                      </Pressable>
                    </View>

                    {/* Steppers */}
                    <View style={styles.steppersRow}>
                      <Stepper
                        label="SETS"
                        display={String(block.sets)}
                        onDecrement={() => adjustSets(index, -1)}
                        onIncrement={() => adjustSets(index, 1)}
                      />
                      {showRepsStepper && (
                        <Stepper
                          label="REPS"
                          display={String(block.reps)}
                          onDecrement={() => adjustField(index, 'reps', -1, 1)}
                          onIncrement={() => adjustField(index, 'reps', 1, 1)}
                        />
                      )}
                      {block.mode === 'timed' && (
                        <Stepper
                          label="TIME"
                          display={formatTime(block.durationSeconds)}
                          onDecrement={() =>
                            adjustField(index, 'durationSeconds', -REST_STEP, 5)
                          }
                          onIncrement={() =>
                            adjustField(index, 'durationSeconds', REST_STEP, 5)
                          }
                        />
                      )}
                      <Stepper
                        label="REST"
                        display={formatTime(block.restBetweenSets)}
                        onDecrement={() =>
                          adjustField(index, 'restBetweenSets', -REST_STEP, 0)
                        }
                        onIncrement={() =>
                          adjustField(index, 'restBetweenSets', REST_STEP, 0)
                        }
                      />
                    </View>

                    {/* Advanced */}
                    {block.advancedOpen && (
                      <View style={styles.advanced}>
                        <View style={styles.advancedRow}>
                          <Text style={styles.advancedLabel}>Type</Text>
                          <SegmentedControl
                            options={[
                              { value: 'reps', label: 'Reps' },
                              { value: 'timed', label: 'Timed' }
                            ]}
                            value={block.mode}
                            onChange={value =>
                              updateBlock(index, {
                                mode: value as 'reps' | 'timed'
                              })
                            }
                          />
                        </View>

                        {block.mode === 'reps' && (
                          <View>
                            <View style={styles.advancedRow}>
                              <Text style={styles.advancedLabel}>
                                Per-set reps
                              </Text>
                              <ToggleSwitch
                                value={block.perSetReps}
                                onValueChange={value =>
                                  updateBlock(index, { perSetReps: value })
                                }
                                accessibilityLabel="Per-set reps"
                              />
                            </View>
                            {block.perSetReps && (
                              <View style={styles.perSetRow}>
                                {resizeReps(
                                  block.perSetRepsValues,
                                  block.sets
                                ).map((value, setIdx) => (
                                  <View key={setIdx} style={styles.perSetBox}>
                                    <Text style={styles.perSetLabel}>
                                      SET {setIdx + 1}
                                    </Text>
                                    <TextInput
                                      value={String(value)}
                                      onChangeText={v =>
                                        setPerSetValue(
                                          index,
                                          setIdx,
                                          parseInt(
                                            v.replace(/[^0-9]/g, ''),
                                            10
                                          ) || 0
                                        )
                                      }
                                      keyboardType="number-pad"
                                      style={styles.perSetInput}
                                      selectionColor={theme.colors.primary}
                                    />
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        )}

                        <View>
                          <Text style={styles.advancedLabel}>Note</Text>
                          <TextInput
                            value={block.note}
                            onChangeText={v => updateBlock(index, { note: v })}
                            placeholder="e.g. Pause 1s at the bottom"
                            placeholderTextColor={theme.colors.muted}
                            style={styles.noteInput}
                            selectionColor={theme.colors.primary}
                          />
                        </View>
                      </View>
                    )}

                    {/* Advanced toggle */}
                    <Pressable
                      onPress={() =>
                        updateBlock(index, { advancedOpen: !block.advancedOpen })
                      }
                      style={styles.advancedToggle}
                    >
                      <Text style={styles.advancedToggleText}>
                        {block.advancedOpen ? 'Hide advanced' : 'Advanced'}
                      </Text>
                      <Ionicons
                        name={block.advancedOpen ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={theme.colors.primaryDark}
                      />
                    </Pressable>
                  </View>
                )
              })}
            </View>
          )}

          <Pressable
            onPress={openPicker}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed
            ]}
          >
            <Ionicons name="add" size={20} color={theme.colors.primaryTextOn} />
            <Text style={styles.addButtonText}>Add exercises</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Add-exercises picker */}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Pressable
              onPress={() => setPickerOpen(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={theme.colors.subtext} />
            </Pressable>
            <Text style={styles.pickerTitle}>Add exercises</Text>
            <View style={styles.closeButtonSpacer} />
          </View>

          <View style={styles.pickerSearch}>
            <SearchInput
              value={pickerQuery}
              onChangeText={setPickerQuery}
              placeholder="Search or create…"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pickerChipsScroll}
            contentContainerStyle={styles.pickerChips}
          >
            {(['all', ...VALID_EXERCISE_CATEGORIES] as const).map(cat => {
              const active = pickerCategory === cat
              return (
                <Pressable
                  key={cat}
                  onPress={() => setPickerCategory(cat)}
                  style={[styles.pickerChip, active && styles.pickerChipActive]}
                >
                  <Text
                    style={[
                      styles.pickerChipText,
                      active && styles.pickerChipTextActive
                    ]}
                  >
                    {cat === 'all' ? 'All' : formatCategoryLabel(cat)}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <ScrollView
            style={styles.pickerList}
            contentContainerStyle={styles.pickerListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              onPress={handleCreateExercise}
              style={styles.createRow}
            >
              <View style={styles.createIcon}>
                <Ionicons name="add" size={16} color={theme.colors.primary} />
              </View>
              <Text style={styles.createText}>Create new exercise</Text>
            </Pressable>

            {filteredPickerExercises.map(ex => {
              const selected = pickerSelected.includes(ex.id)
              const cat = getCategoryColors(ex.category)
              const badge = getSourceBadge(ex.source)
              return (
                <Pressable
                  key={ex.id}
                  onPress={() => togglePickerSelect(ex.id)}
                  style={[
                    styles.pickerRow,
                    selected && styles.pickerRowSelected
                  ]}
                >
                  <View style={[styles.pickerRowIcon, { backgroundColor: cat.bg }]}>
                    <Ionicons
                      name={
                        (ex.icon as keyof typeof Ionicons.glyphMap) ||
                        'fitness-outline'
                      }
                      size={18}
                      color={cat.color}
                    />
                  </View>
                  <View style={styles.pickerRowContent}>
                    <Text style={styles.pickerRowName} numberOfLines={1}>
                      {ex.name}
                    </Text>
                    <Text style={styles.pickerRowMeta}>
                      {ex.category ? `${formatCategoryLabel(ex.category)} · ` : ''}
                      {badge.label}
                    </Text>
                  </View>
                  <SelectionCheckbox checked={selected} />
                </Pressable>
              )
            })}

            {filteredPickerExercises.length === 0 && (
              <View style={styles.pickerEmpty}>
                <Ionicons
                  name="search-outline"
                  size={28}
                  color={theme.colors.muted}
                />
                <Text style={styles.pickerEmptyText}>
                  No exercises match your search
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.pickerFooter}>
            <Pressable
              onPress={confirmPicker}
              disabled={pickerSelected.length === 0}
              style={({ pressed }) => [
                styles.pickerConfirm,
                pickerSelected.length === 0 && styles.pickerConfirmDisabled,
                pressed &&
                  pickerSelected.length > 0 &&
                  styles.pickerConfirmPressed
              ]}
            >
              <Text style={styles.pickerConfirmText}>
                {pickerSelected.length > 0
                  ? `Add ${formatCount(pickerSelected.length, 'exercise')}`
                  : 'Select exercises'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

function Stepper({
  label,
  display,
  onDecrement,
  onIncrement
}: {
  label: string
  display: string
  onDecrement: () => void
  onIncrement: () => void
}) {
  return (
    <View style={styles.stepperField}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperBox}>
        <Pressable style={styles.stepperBtn} onPress={onDecrement} hitSlop={4}>
          <Ionicons name="remove" size={16} color={theme.colors.subtext} />
        </Pressable>
        <Text style={styles.stepperValue}>{display}</Text>
        <Pressable style={styles.stepperBtn} onPress={onIncrement} hitSlop={4}>
          <Ionicons name="add" size={16} color={theme.colors.primary} />
        </Pressable>
      </View>
    </View>
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
    paddingVertical: theme.spacing.md
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonPressed: {
    backgroundColor: theme.colors.surfaceElevated
  },
  closeButtonSpacer: {
    width: 42
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
  sectionLabel: {
    ...theme.typography.small,
    color: theme.colors.faint,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: theme.spacing.xs
  },
  nameInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    color: theme.colors.text,
    ...theme.typography.bodyBold
  },
  nameInputFocused: {
    borderColor: theme.colors.borderActive
  },
  optionsCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    flexShrink: 1
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  optionDivider: {
    height: 1,
    backgroundColor: theme.colors.surfaceElevated,
    marginHorizontal: theme.spacing.md
  },
  timePill: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.displayMed,
    backgroundColor: theme.colors.inset,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    textAlign: 'center',
    minWidth: 56
  },
  timePillWarmup: {
    color: theme.colors.primary,
    borderColor: theme.colors.borderActive
  },
  timePillRest: {
    color: theme.colors.info,
    borderColor: theme.colors.border
  },
  exercisesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  reorderHint: {
    ...theme.typography.small,
    color: theme.colors.faint
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    gap: theme.spacing.md
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center'
  },
  blockList: {
    gap: theme.spacing.sm
  },
  blockCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md
  },
  blockCardActive: {
    borderColor: theme.colors.borderActive
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  blockNumber: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  blockNumberText: {
    ...theme.typography.small,
    fontFamily: theme.fonts.display,
    color: theme.colors.primaryTextOn
  },
  blockName: {
    ...theme.typography.body,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    flex: 1
  },
  blockIconBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  blockDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.dangerTint,
    alignItems: 'center',
    justifyContent: 'center'
  },
  steppersRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  stepperField: {
    flex: 1
  },
  stepperLabel: {
    ...theme.typography.small,
    fontSize: 9,
    letterSpacing: 1,
    color: theme.colors.faint,
    marginBottom: theme.spacing.xs
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inset,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    height: 40
  },
  stepperBtn: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperValue: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.fonts.displayMed,
    fontSize: 16,
    color: theme.colors.text
  },
  advanced: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceElevated,
    gap: theme.spacing.lg
  },
  advancedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  advancedLabel: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.subtext,
    marginBottom: theme.spacing.sm
  },
  perSetRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm
  },
  perSetBox: {
    flex: 1,
    backgroundColor: theme.colors.inset,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center'
  },
  perSetLabel: {
    ...theme.typography.small,
    fontSize: 8,
    letterSpacing: 0.5,
    color: theme.colors.faint
  },
  perSetInput: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 15,
    color: theme.colors.text,
    textAlign: 'center',
    paddingVertical: 2,
    minWidth: 40
  },
  noteInput: {
    backgroundColor: theme.colors.inset,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    ...theme.typography.caption
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceElevated
  },
  advancedToggleText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primaryDark
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    height: 50,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm
  },
  addButtonPressed: {
    opacity: 0.9
  },
  addButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  // Picker
  pickerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.md
  },
  pickerTitle: {
    ...theme.typography.h2,
    fontFamily: theme.fonts.displayMed,
    color: theme.colors.text
  },
  pickerSearch: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md
  },
  pickerChipsScroll: {
    flexGrow: 0
  },
  pickerChips: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm
  },
  pickerChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface
  },
  pickerChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  pickerChipText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.subtext
  },
  pickerChipTextActive: {
    color: theme.colors.primaryTextOn
  },
  pickerList: {
    flex: 1
  },
  pickerListContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.primaryTint,
    borderWidth: 1.5,
    borderColor: theme.colors.borderActive,
    borderStyle: 'dashed',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md
  },
  createIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  createText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md
  },
  pickerRowSelected: {
    backgroundColor: theme.colors.primaryTint,
    borderColor: theme.colors.borderActive
  },
  pickerRowIcon: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pickerRowContent: {
    flex: 1
  },
  pickerRowName: {
    ...theme.typography.body,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text
  },
  pickerRowMeta: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    marginTop: 2
  },
  pickerEmpty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.md
  },
  pickerEmptyText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center'
  },
  pickerFooter: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  pickerConfirm: {
    height: 54,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pickerConfirmDisabled: {
    backgroundColor: theme.colors.border
  },
  pickerConfirmPressed: {
    opacity: 0.9
  },
  pickerConfirmText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  }
})

export default ProgramForm
