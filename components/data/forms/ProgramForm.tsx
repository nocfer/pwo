/**
 * Program Form Component
 * Professional form for creating workout programs
 */

import haptics from "@/lib/haptics";
import { validateProgram } from "@/lib/validation";
import { theme } from "@/theme/theme";
import type { ProgramBlock } from "@/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useState } from "react";
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
} from "react-native";

type BlockDraft = {
  type: "exercise";
  exerciseId: string;
  targetReps?: string;
  sets?: string;
  restBetweenSets?: string;
};

export type ProgramFormData = {
  name: string;
  blocks: ProgramBlock[];
  initialWarmup?: {
    seconds: number;
  };
  defaultRestBetweenExercises?: number;
};

export type ProgramFormProps = {
  mode: "create" | "edit";
  initialData?: Partial<ProgramFormData>;
  onSave: (data: ProgramFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
  exercises: { id: string; name: string; source: "builtin" | "user" }[];
};

const DEFAULT_WARMUP_SECONDS = 300;
const DEFAULT_REST_BETWEEN_EXERCISES = 60;
const DEFAULT_SETS = 1;
const DEFAULT_REST_BETWEEN_SETS = 60;

// Helper functions for mm:ss format conversion
function secondsToMmss(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function mmssToSeconds(mmss: string): number {
  const trimmed = mmss.trim();
  if (!trimmed) return 0;
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  }
  return parseInt(trimmed, 10) || 0;
}

function convertBlocksToDraft(blocks: ProgramBlock[]): BlockDraft[] {
  return blocks
    .filter((block) => block.type === "exercise")
    .map((block) => ({
      type: "exercise" as const,
      exerciseId: (block as any).exerciseId,
      targetReps: (block as any).targetReps
        ? String((block as any).targetReps)
        : "",
      sets: (block as any).sets
        ? String((block as any).sets)
        : String(DEFAULT_SETS),
      restBetweenSets: (block as any).restBetweenSets
        ? secondsToMmss((block as any).restBetweenSets)
        : secondsToMmss(DEFAULT_REST_BETWEEN_SETS)
    }));
}

function convertDraftToBlocks(drafts: BlockDraft[]): ProgramBlock[] {
  return drafts.map((draft) => {
    // Parse sets - must be positive integer, default to 1
    const parsedSets = draft.sets ? Number(draft.sets) : DEFAULT_SETS;
    const sets =
      Number.isInteger(parsedSets) && parsedSets >= 1
        ? parsedSets
        : DEFAULT_SETS;

    // Parse rest between sets - must be non-negative, default to 60
    const parsedRest = draft.restBetweenSets
      ? mmssToSeconds(draft.restBetweenSets)
      : DEFAULT_REST_BETWEEN_SETS;
    const restBetweenSets =
      parsedRest >= 0 ? parsedRest : DEFAULT_REST_BETWEEN_SETS;

    return {
      type: "exercise",
      exerciseId: draft.exerciseId,
      targetReps: draft.targetReps ? Number(draft.targetReps) : undefined,
      sets,
      restBetweenSets
    };
  });
}

export function ProgramForm({
  mode,
  initialData,
  onSave,
  onCancel,
  saving = false,
  exercises
}: ProgramFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [blocksDraft, setBlocksDraft] = useState<BlockDraft[]>(
    convertBlocksToDraft(initialData?.blocks || [])
  );
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(
    null
  );

  // Program options
  const [warmupEnabled, setWarmupEnabled] = useState(
    initialData?.initialWarmup !== undefined
  );
  const [warmupTime, setWarmupTime] = useState(
    secondsToMmss(initialData?.initialWarmup?.seconds ?? DEFAULT_WARMUP_SECONDS)
  );
  const [restEnabled, setRestEnabled] = useState(
    initialData?.defaultRestBetweenExercises !== undefined
  );
  const [restTime, setRestTime] = useState(
    secondsToMmss(
      initialData?.defaultRestBetweenExercises ?? DEFAULT_REST_BETWEEN_EXERCISES
    )
  );

  const addExercise = useCallback(() => {
    haptics.buttonTap();
    const firstExercise = exercises[0]?.id || "";
    setBlocksDraft((prev) => [
      ...prev,
      {
        type: "exercise",
        exerciseId: firstExercise,
        targetReps: "",
        sets: String(DEFAULT_SETS),
        restBetweenSets: secondsToMmss(DEFAULT_REST_BETWEEN_SETS)
      }
    ]);
  }, [exercises]);

  const removeExercise = useCallback((index: number) => {
    haptics.deleteItem();
    setBlocksDraft((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveExercise = useCallback(
    (fromIndex: number, direction: "up" | "down") => {
      haptics.buttonTap();
      const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
      setBlocksDraft((prev) => {
        const newBlocks = [...prev];
        const [movedBlock] = newBlocks.splice(fromIndex, 1);
        newBlocks.splice(toIndex, 0, movedBlock);
        return newBlocks;
      });
    },
    []
  );

  const updateExerciseField = useCallback(
    (index: number, field: string, value: string) => {
      setBlocksDraft((prev) =>
        prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
      );
    },
    []
  );

  const exerciseNameById = exercises.reduce((map, ex) => {
    map.set(ex.id, ex.name);
    return map;
  }, new Map<string, string>());

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    const finalBlocks = convertDraftToBlocks(blocksDraft);

    // Validate warmup duration if enabled
    const warmupSeconds = warmupEnabled ? mmssToSeconds(warmupTime) : 0;
    if (warmupEnabled && warmupSeconds <= 0) {
      haptics.formValidationError();
      Alert.alert("Validation Error", "Warmup duration must be greater than 0");
      return;
    }

    // Validate default rest duration if enabled
    const defaultRestSeconds = restEnabled ? mmssToSeconds(restTime) : 0;
    if (restEnabled && defaultRestSeconds < 0) {
      haptics.formValidationError();
      Alert.alert("Validation Error", "Rest duration must be 0 or greater");
      return;
    }

    // Validate each block's sets and rest values
    for (let i = 0; i < blocksDraft.length; i++) {
      const block = blocksDraft[i];
      const setsValue = block.sets ? Number(block.sets) : DEFAULT_SETS;
      const restValue = block.restBetweenSets
        ? mmssToSeconds(block.restBetweenSets)
        : DEFAULT_REST_BETWEEN_SETS;

      if (!Number.isInteger(setsValue) || setsValue < 1) {
        haptics.formValidationError();
        Alert.alert(
          "Validation Error",
          `Exercise ${i + 1}: Sets must be at least 1`
        );
        return;
      }

      if (restValue < 0) {
        haptics.formValidationError();
        Alert.alert(
          "Validation Error",
          `Exercise ${i + 1}: Rest duration must be 0 or greater`
        );
        return;
      }
    }

    const initialWarmup = warmupEnabled
      ? { seconds: warmupSeconds || DEFAULT_WARMUP_SECONDS }
      : undefined;

    const defaultRestBetweenExercises = restEnabled
      ? defaultRestSeconds || DEFAULT_REST_BETWEEN_EXERCISES
      : undefined;

    const programData = {
      name: trimmed,
      blocks: finalBlocks,
      initialWarmup,
      defaultRestBetweenExercises
    };
    const validationResult = validateProgram(programData as any);

    if (!validationResult.isValid) {
      haptics.formValidationError();
      Alert.alert("Validation Error", validationResult.errors[0].message);
      return;
    }

    if (exercises.length === 0) {
      haptics.formValidationError();
      Alert.alert(
        "Add an exercise first",
        "Create at least one exercise before creating a program."
      );
      return;
    }

    const exerciseIds = new Set(exercises.map((ex) => ex.id));
    for (const block of finalBlocks) {
      if (block.type === "exercise" && !exerciseIds.has(block.exerciseId)) {
        haptics.formValidationError();
        Alert.alert(
          "Invalid exercise",
          "One or more exercises no longer exist."
        );
        return;
      }
    }

    try {
      await onSave({
        name: trimmed,
        blocks: finalBlocks,
        initialWarmup,
        defaultRestBetweenExercises
      });
      haptics.formSave();
    } catch (error) {
      haptics.formValidationError();
      Alert.alert(
        "Couldn't save",
        error instanceof Error ? error.message : String(error)
      );
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
  ]);

  const handleCancel = useCallback(() => {
    haptics.formCancel();
    onCancel();
  }, [onCancel]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.headerBackBtn,
            pressed && styles.headerBackBtnPressed
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {mode === "create" ? "New Program" : "Edit Program"}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Form Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Name Card */}
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Program Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Upper Body Strength"
              placeholderTextColor={theme.colors.muted}
              style={styles.input}
              autoFocus={mode === "create"}
            />
          </View>
        </View>

        {/* Program Options Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Program Options</Text>

          {/* Initial Warmup Toggle */}
          <Pressable
            onPress={() => {
              haptics.buttonTap();
              setWarmupEnabled((prev) => !prev);
            }}
            style={({ pressed }) => [
              styles.optionRow,
              pressed && styles.optionRowPressed
            ]}
          >
            <View style={styles.optionLeft}>
              <View
                style={[
                  styles.optionIcon,
                  warmupEnabled && styles.optionIconActiveWarmup
                ]}
              >
                <Ionicons
                  name="flame-outline"
                  size={18}
                  color={
                    warmupEnabled
                      ? theme.colors.phases.warmup
                      : theme.colors.muted
                  }
                />
              </View>
              <Text
                style={[
                  styles.optionLabel,
                  warmupEnabled && styles.optionLabelActive
                ]}
              >
                Initial Warmup
              </Text>
            </View>
            <View
              style={[
                styles.toggle,
                warmupEnabled && styles.toggleActiveWarmup
              ]}
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
            <View style={styles.optionConfig}>
              <Text style={styles.optionConfigLabel}>Duration (mm:ss)</Text>
              <TextInput
                value={warmupTime}
                onChangeText={setWarmupTime}
                style={styles.optionConfigInput}
                placeholder="5:00"
                placeholderTextColor={theme.colors.muted}
              />
            </View>
          )}

          {/* Default Rest Toggle */}
          <Pressable
            onPress={() => {
              haptics.buttonTap();
              setRestEnabled((prev) => !prev);
            }}
            style={({ pressed }) => [
              styles.optionRow,
              pressed && styles.optionRowPressed
            ]}
          >
            <View style={styles.optionLeft}>
              <View
                style={[
                  styles.optionIcon,
                  restEnabled && styles.optionIconActiveRest
                ]}
              >
                <Ionicons
                  name="timer-outline"
                  size={18}
                  color={
                    restEnabled ? theme.colors.phases.break : theme.colors.muted
                  }
                />
              </View>
              <Text
                style={[
                  styles.optionLabel,
                  restEnabled && styles.optionLabelActive
                ]}
              >
                Rest Between Exercises
              </Text>
            </View>
            <View
              style={[styles.toggle, restEnabled && styles.toggleActiveRest]}
            >
              <View
                style={[
                  styles.toggleKnob,
                  restEnabled && styles.toggleKnobActive
                ]}
              />
            </View>
          </Pressable>

          {restEnabled && (
            <View style={styles.optionConfig}>
              <Text style={styles.optionConfigLabel}>Duration (mm:ss)</Text>
              <TextInput
                value={restTime}
                onChangeText={setRestTime}
                style={styles.optionConfigInput}
                placeholder="1:00"
                placeholderTextColor={theme.colors.muted}
              />
            </View>
          )}
        </View>

        {/* Exercises Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Exercises</Text>
            <Pressable
              onPress={addExercise}
              style={({ pressed }) => [
                styles.addBtn,
                pressed && styles.addBtnPressed
              ]}
            >
              <Ionicons name="add" size={18} color={theme.colors.primary} />
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>

          {blocksDraft.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="barbell-outline"
                size={32}
                color={theme.colors.muted}
              />
              <Text style={styles.emptyStateText}>
                Add exercises to build your program
              </Text>
            </View>
          ) : (
            <View style={styles.exerciseList}>
              {blocksDraft.map((block, index) => (
                <View key={index} style={styles.exerciseItem}>
                  <View style={styles.exerciseItemHeader}>
                    <View style={styles.exerciseItemLeft}>
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>
                          {index + 1}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          haptics.buttonTap();
                          setPickerTargetIndex(index);
                          setExercisePickerOpen(true);
                        }}
                        style={({ pressed }) => [
                          styles.exercisePicker,
                          pressed && styles.exercisePickerPressed
                        ]}
                      >
                        <Text
                          style={[
                            styles.exercisePickerText,
                            !block.exerciseId &&
                              styles.exercisePickerPlaceholder
                          ]}
                          numberOfLines={1}
                        >
                          {exerciseNameById.get(block.exerciseId) ||
                            "Select exercise"}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={16}
                          color={theme.colors.muted}
                        />
                      </Pressable>
                    </View>
                    <View style={styles.exerciseActions}>
                      {index > 0 && (
                        <Pressable
                          onPress={() => moveExercise(index, "up")}
                          style={({ pressed }) => [
                            styles.actionBtn,
                            pressed && styles.actionBtnPressed
                          ]}
                        >
                          <Ionicons
                            name="chevron-up"
                            size={16}
                            color={theme.colors.muted}
                          />
                        </Pressable>
                      )}
                      {index < blocksDraft.length - 1 && (
                        <Pressable
                          onPress={() => moveExercise(index, "down")}
                          style={({ pressed }) => [
                            styles.actionBtn,
                            pressed && styles.actionBtnPressed
                          ]}
                        >
                          <Ionicons
                            name="chevron-down"
                            size={16}
                            color={theme.colors.muted}
                          />
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => removeExercise(index)}
                        style={({ pressed }) => [
                          styles.actionBtn,
                          pressed && styles.actionBtnPressed
                        ]}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={theme.colors.danger}
                        />
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.exerciseItemFooter}>
                    <View style={styles.exerciseFieldRow}>
                      <Text style={styles.fieldLabel}>Target Reps</Text>
                      <TextInput
                        value={block.targetReps || ""}
                        onChangeText={(v) =>
                          updateExerciseField(index, "targetReps", v)
                        }
                        keyboardType="number-pad"
                        style={styles.fieldInput}
                        placeholder="10"
                        placeholderTextColor={theme.colors.muted}
                      />
                    </View>
                    <View style={styles.exerciseFieldRow}>
                      <Text style={styles.fieldLabel}>Sets</Text>
                      <TextInput
                        value={block.sets || String(DEFAULT_SETS)}
                        onChangeText={(v) => {
                          // Only allow positive integers
                          const cleaned = v.replace(/[^0-9]/g, "");
                          updateExerciseField(index, "sets", cleaned);
                        }}
                        keyboardType="number-pad"
                        style={styles.fieldInput}
                        placeholder="1"
                        placeholderTextColor={theme.colors.muted}
                      />
                    </View>
                    <View style={styles.exerciseFieldRow}>
                      <Text style={styles.fieldLabel}>Rest Between Sets</Text>
                      <TextInput
                        value={
                          block.restBetweenSets ||
                          secondsToMmss(DEFAULT_REST_BETWEEN_SETS)
                        }
                        onChangeText={(v) =>
                          updateExerciseField(index, "restBetweenSets", v)
                        }
                        style={styles.fieldInput}
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

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleCancel}
          style={({ pressed }) => [
            styles.cancelBtn,
            pressed && styles.cancelBtnPressed
          ]}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && !saving && styles.saveBtnPressed,
            saving && styles.saveBtnDisabled
          ]}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>

      {/* Exercise Picker Modal */}
      <Modal
        visible={exercisePickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setExercisePickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Exercise</Text>
              <Pressable
                onPress={() => setExercisePickerOpen(false)}
                style={({ pressed }) => [
                  styles.modalCloseBtn,
                  pressed && styles.modalCloseBtnPressed
                ]}
              >
                <Ionicons name="close" size={18} color={theme.colors.text} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {exercises.map((exercise) => {
                const isSelected =
                  pickerTargetIndex !== null &&
                  blocksDraft[pickerTargetIndex]?.exerciseId === exercise.id;
                return (
                  <Pressable
                    key={exercise.id}
                    onPress={() => {
                      if (pickerTargetIndex === null) return;
                      haptics.buttonTap();
                      updateExerciseField(
                        pickerTargetIndex,
                        "exerciseId",
                        exercise.id
                      );
                      setExercisePickerOpen(false);
                      setPickerTargetIndex(null);
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
                        name="checkmark"
                        size={18}
                        color={theme.colors.primary}
                      />
                    )}
                  </Pressable>
                );
              })}
              {exercises.length === 0 && (
                <Text style={styles.emptyText}>
                  No exercises available. Create an exercise first.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background
  },
  headerBackBtnPressed: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.96 }]
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  headerSpacer: {
    width: 36
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    ...theme.shadows.sm
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: -theme.spacing.sm
  },
  cardTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  field: {
    gap: theme.spacing.sm
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    fontFamily: theme.fonts.semiBold
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    ...theme.typography.body
  },
  // Option rows (toggle style)
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm
  },
  optionRowPressed: {
    opacity: 0.7
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background
  },
  optionIconActiveWarmup: {
    backgroundColor: theme.colors.phases.warmupBg
  },
  optionIconActiveRest: {
    backgroundColor: theme.colors.phases.breakBg
  },
  optionLabel: {
    ...theme.typography.body,
    color: theme.colors.subtext
  },
  optionLabelActive: {
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.border,
    padding: 2,
    justifyContent: "center"
  },
  toggleActiveWarmup: {
    backgroundColor: theme.colors.phases.warmup
  },
  toggleActiveRest: {
    backgroundColor: theme.colors.phases.break
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.surface
  },
  toggleKnobActive: {
    alignSelf: "flex-end"
  },
  optionConfig: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 52,
    marginTop: -theme.spacing.sm
  },
  optionConfigLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  optionConfigInput: {
    width: 80,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    ...theme.typography.body,
    textAlign: "center"
  },
  // Add button
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight
  },
  addBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }]
  },
  addBtnText: {
    ...theme.typography.captionBold,
    color: theme.colors.primary
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.sm
  },
  emptyStateText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center"
  },
  // Exercise list
  exerciseList: {
    gap: theme.spacing.sm
  },
  exerciseItem: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.md
  },
  exerciseItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm
  },
  exerciseItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1
  },
  exerciseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  exerciseNumberText: {
    ...theme.typography.small,
    color: theme.colors.primaryTextOn,
    fontFamily: theme.fonts.semiBold
  },
  exercisePicker: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  exercisePickerPressed: {
    backgroundColor: theme.colors.border
  },
  exercisePickerText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1
  },
  exercisePickerPlaceholder: {
    color: theme.colors.muted
  },
  exerciseActions: {
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  actionBtnPressed: {
    backgroundColor: theme.colors.surface
  },
  exerciseItemFooter: {
    flexDirection: "column",
    gap: theme.spacing.sm,
    paddingLeft: 32
  },
  exerciseFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  fieldLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  fieldInput: {
    width: 80,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    ...theme.typography.body,
    textAlign: "center"
  },
  // Footer
  footer: {
    flexDirection: "row",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  cancelBtnPressed: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.98 }]
  },
  cancelBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.subtext
  },
  saveBtn: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md
  },
  saveBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  saveBtnDisabled: {
    opacity: 0.5
  },
  saveBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "flex-end"
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    maxHeight: "60%"
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background
  },
  modalCloseBtnPressed: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.96 }]
  },
  modalList: {
    maxHeight: 350
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    padding: theme.spacing.xl
  }
});
