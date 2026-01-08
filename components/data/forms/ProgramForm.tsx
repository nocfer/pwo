/**
 * Program Form Component
 * Supports creating and editing workout programs with exercise blocks,
 * rest periods, and warmups
 */

import haptics from "@/lib/haptics";
import { validateProgram } from "@/lib/validation";
import { theme } from "@/theme/theme";
import type { ProgramBlock } from "@/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

type BlockDraft =
  | { type: "warmup"; seconds: string }
  | { type: "rest"; seconds: string; label?: string }
  | {
      type: "exercise";
      exerciseId: string;
      targetReps?: string;
      durationSeconds?: string;
      note?: string;
    };

export type ProgramFormData = {
  name: string;
  blocks: ProgramBlock[];
};

export type ProgramFormProps = {
  mode: "create" | "edit";
  initialData?: Partial<ProgramFormData>;
  onSave: (data: ProgramFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
  exercises: { id: string; name: string; source: "builtin" | "user" }[];
};

export function ProgramForm({
  mode,
  initialData,
  onSave,
  onCancel,
  saving = false,
  exercises
}: ProgramFormProps) {
  const [formData, setFormData] = useState<ProgramFormData>({
    name: initialData?.name || "",
    blocks: initialData?.blocks || [{ type: "warmup", seconds: 180 }]
  });

  const [blocksDraft, setBlocksDraft] = useState<BlockDraft[]>(
    convertSessionBlocksToDraft(formData.blocks || [])
  );

  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(
    null
  );

  // Convert ProgramBlock[] to BlockDraft[] for editing
  function convertSessionBlocksToDraft(blocks: ProgramBlock[]): BlockDraft[] {
    return blocks.map((block) => {
      if (block.type === "warmup") {
        return { type: "warmup", seconds: String(block.seconds) };
      }
      if (block.type === "rest") {
        return {
          type: "rest",
          seconds: String(block.seconds),
          label: block.label
        };
      }
      // exercise
      return {
        type: "exercise",
        exerciseId: block.exerciseId,
        targetReps: block.targetReps ? String(block.targetReps) : "",
        durationSeconds: block.durationSeconds
          ? String(block.durationSeconds)
          : "",
        note: block.note || ""
      };
    });
  }

  // Convert BlockDraft[] to ProgramBlock[] for saving
  function convertDraftToSessionBlocks(drafts: BlockDraft[]): ProgramBlock[] {
    return drafts.map((draft) => {
      if (draft.type === "warmup") {
        return { type: "warmup", seconds: Number(draft.seconds) || 0 };
      }
      if (draft.type === "rest") {
        return {
          type: "rest",
          seconds: Number(draft.seconds) || 0,
          label: draft.label?.trim() || undefined
        };
      }
      // exercise
      return {
        type: "exercise",
        exerciseId: draft.exerciseId,
        targetReps: draft.targetReps ? Number(draft.targetReps) : undefined,
        durationSeconds: draft.durationSeconds
          ? Number(draft.durationSeconds)
          : undefined,
        note: draft.note?.trim() || undefined
      };
    });
  }

  const updateField = useCallback(
    <K extends keyof ProgramFormData>(field: K, value: ProgramFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const addBlock = useCallback(
    (type: BlockDraft["type"]) => {
      haptics.buttonTap();
      if (type === "warmup") {
        setBlocksDraft((prev) => [...prev, { type, seconds: "120" }]);
      } else if (type === "rest") {
        setBlocksDraft((prev) => [
          ...prev,
          { type, seconds: "90", label: "Rest" }
        ]);
      } else if (type === "exercise") {
        const firstExercise = exercises[0]?.id || "";
        setBlocksDraft((prev) => [
          ...prev,
          {
            type,
            exerciseId: firstExercise,
            targetReps: "",
            durationSeconds: "",
            note: ""
          }
        ]);
      }
    },
    [exercises]
  );

  const removeBlock = useCallback((index: number) => {
    haptics.deleteItem();
    setBlocksDraft((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    haptics.buttonTap();
    setBlocksDraft((prev) => {
      const newBlocks = [...prev];
      const [movedBlock] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, movedBlock);
      return newBlocks;
    });
  }, []);

  const exerciseNameById = exercises.reduce((map, exercise) => {
    map.set(exercise.id, exercise.name);
    return map;
  }, new Map<string, string>());

  const handleSave = useCallback(async () => {
    const trimmed = formData.name.trim();

    // Convert draft blocks to final blocks
    const finalBlocks = convertDraftToSessionBlocks(blocksDraft);

    // Create program object for validation
    const programData = {
      name: trimmed,
      blocks: finalBlocks
    };

    // Validate using centralized validation
    const validationResult = validateProgram(programData as any);

    if (!validationResult.isValid) {
      haptics.formValidationError();
      const firstError = validationResult.errors[0];
      Alert.alert("Validation Error", firstError.message);
      return;
    }

    // Additional business logic validation
    if (exercises.length === 0) {
      haptics.formValidationError();
      Alert.alert(
        "Add an exercise first",
        "Create at least one exercise before creating a program."
      );
      return;
    }

    // Validate exercise references exist
    const exerciseIds = new Set(exercises.map((ex) => ex.id));
    for (const block of finalBlocks) {
      if (block.type === "exercise" && !exerciseIds.has(block.exerciseId)) {
        haptics.formValidationError();
        Alert.alert(
          "Invalid exercise reference",
          "One or more exercises no longer exist. Please update the program."
        );
        return;
      }
    }

    try {
      await onSave({
        ...formData,
        name: trimmed,
        blocks: finalBlocks
      });
      haptics.formSave();
    } catch (error) {
      haptics.formValidationError();
      Alert.alert(
        "Couldn't save",
        error instanceof Error ? error.message : String(error)
      );
    }
  }, [formData, blocksDraft, exercises, onSave]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header with Name Input */}
      <View style={styles.headerSection}>
        <Pressable
          onPress={() => {
            haptics.formCancel();
            onCancel();
          }}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          style={({ pressed }) => [
            styles.headerBack,
            pressed && styles.headerBackPressed
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {mode === "create" ? "New Program" : "Edit Program"}
          </Text>
          <Text style={styles.headerSubtitle}>
            Build a structured workout program
          </Text>
        </View>
      </View>

      {/* Program Name Input */}
      <View style={styles.nameSection}>
        <Text style={styles.sectionTitle}>Program Name</Text>
        <TextInput
          value={formData.name}
          onChangeText={(value) => updateField("name", value)}
          placeholder="e.g., Upper Body Strength"
          placeholderTextColor={theme.colors.muted}
          style={styles.nameInput}
        />
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.quickAddSection}>
        <Pressable
          style={({ pressed }) => [
            styles.quickAddBtn,
            pressed && styles.quickAddBtnPressed
          ]}
          onPress={() => addBlock("exercise")}
        >
          <Ionicons
            name="barbell-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.quickAddBtnText}>Add Exercise</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.quickAddBtn,
            pressed && styles.quickAddBtnPressed
          ]}
          onPress={() => addBlock("rest")}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.quickAddBtnText}>Add Rest</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.quickAddBtn,
            pressed && styles.quickAddBtnPressed
          ]}
          onPress={() => addBlock("warmup")}
        >
          <Ionicons
            name="timer-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.quickAddBtnText}>Add Warmup</Text>
        </Pressable>
      </View>

      {/* Blocks List */}
      {blocksDraft.length > 0 && (
        <View style={styles.blocksSection}>
          <Text style={styles.sectionTitle}>Workout Blocks</Text>
          <View style={styles.blocksList}>
            {blocksDraft.map((block, index) => (
              <View
                key={index}
                style={[
                  styles.blockCard,
                  block.type === "warmup" && styles.blockCardWarmup,
                  block.type === "rest" && styles.blockCardRest,
                  block.type === "exercise" && styles.blockCardExercise
                ]}
              >
                {/* Block Header */}
                <View
                  style={[
                    styles.blockHeader,
                    block.type === "warmup" && styles.blockHeaderWarmup,
                    block.type === "rest" && styles.blockHeaderRest,
                    block.type === "exercise" && styles.blockHeaderExercise
                  ]}
                >
                  <View style={styles.blockTitleRow}>
                    <View
                      style={[
                        styles.dragHandle,
                        block.type === "warmup" && styles.dragHandleWarmup,
                        block.type === "rest" && styles.dragHandleRest,
                        block.type === "exercise" && styles.dragHandleExercise
                      ]}
                    >
                      <Ionicons
                        name="reorder-two"
                        size={18}
                        color={
                          block.type === "warmup" ||
                          block.type === "rest" ||
                          block.type === "exercise"
                            ? "#FFFFFF"
                            : theme.colors.primary
                        }
                      />
                    </View>
                    <Ionicons
                      name={
                        block.type === "warmup"
                          ? "timer-outline"
                          : block.type === "rest"
                            ? "time-outline"
                            : "barbell-outline"
                      }
                      size={20}
                      color={
                        block.type === "warmup"
                          ? theme.colors.phases.warmup
                          : block.type === "rest"
                            ? theme.colors.phases.break
                            : theme.colors.phases.working
                      }
                    />
                    <Text
                      style={[
                        styles.blockTitle,
                        block.type === "warmup" && styles.blockTitleWarmup,
                        block.type === "rest" && styles.blockTitleRest,
                        block.type === "exercise" && styles.blockTitleExercise
                      ]}
                    >
                      {block.type}
                    </Text>
                  </View>
                  <View style={styles.blockActions}>
                    {index > 0 && (
                      <Pressable
                        onPress={() => moveBlock(index, index - 1)}
                        style={({ pressed }) => [
                          styles.iconBtn,
                          pressed && styles.iconBtnPressed
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
                        onPress={() => moveBlock(index, index + 1)}
                        style={({ pressed }) => [
                          styles.iconBtn,
                          pressed && styles.iconBtnPressed
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
                      onPress={() => removeBlock(index)}
                      style={({ pressed }) => [
                        styles.iconBtn,
                        pressed && styles.iconBtnPressed
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

                {/* Block Content */}
                <View style={styles.blockContent}>
                  {/* Block-specific fields */}
                  {block.type === "warmup" && (
                    <View style={styles.fieldRowVertical}>
                      <Text style={styles.fieldLabelStandalone}>Duration</Text>
                      <TextInput
                        value={block.seconds}
                        onChangeText={(value) =>
                          setBlocksDraft((prev) =>
                            prev.map((b, i) =>
                              i === index ? { ...b, seconds: value } : b
                            )
                          )
                        }
                        keyboardType="number-pad"
                        style={[styles.fieldInputFull, styles.fieldInputWarmup]}
                        placeholder="Seconds"
                      />
                    </View>
                  )}

                  {block.type === "rest" && (
                    <View style={styles.fieldRowVertical}>
                      <View>
                        <Text style={styles.fieldLabelStandalone}>Label</Text>
                        <TextInput
                          value={block.label || ""}
                          onChangeText={(value) =>
                            setBlocksDraft((prev) =>
                              prev.map((b, i) =>
                                i === index ? { ...b, label: value } : b
                              )
                            )
                          }
                          style={[styles.fieldInputFull, styles.fieldInputRest]}
                          placeholder="e.g., Rest between sets"
                        />
                      </View>
                      <View>
                        <Text style={styles.fieldLabelStandalone}>
                          Duration
                        </Text>
                        <TextInput
                          value={block.seconds}
                          onChangeText={(value) =>
                            setBlocksDraft((prev) =>
                              prev.map((b, i) =>
                                i === index ? { ...b, seconds: value } : b
                              )
                            )
                          }
                          keyboardType="number-pad"
                          style={[styles.fieldInputFull, styles.fieldInputRest]}
                          placeholder="Seconds"
                        />
                      </View>
                    </View>
                  )}

                  {block.type === "exercise" && (
                    <View style={styles.fieldRowVertical}>
                      <View>
                        <Text style={styles.fieldLabelStandalone}>
                          Exercise
                        </Text>
                        <Pressable
                          style={({ pressed }) => [
                            styles.pickerBtn,
                            styles.pickerBtnExercise,
                            pressed && styles.pickerBtnPressed
                          ]}
                          onPress={() => {
                            haptics.buttonTap();
                            setPickerTargetIndex(index);
                            setExercisePickerOpen(true);
                          }}
                        >
                          <Text style={styles.pickerBtnText}>
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

                      <View style={styles.fieldRowTwoCol}>
                        <View style={styles.fieldRowTwoColItem}>
                          <Text style={styles.fieldLabelStandalone}>
                            Target Reps
                          </Text>
                          <TextInput
                            value={block.targetReps || ""}
                            onChangeText={(value) =>
                              setBlocksDraft((prev) =>
                                prev.map((b, i) =>
                                  i === index ? { ...b, targetReps: value } : b
                                )
                              )
                            }
                            keyboardType="number-pad"
                            style={[
                              styles.fieldInputFull,
                              styles.fieldInputExercise
                            ]}
                            placeholder="Optional"
                          />
                        </View>

                        <View style={styles.fieldRowTwoColItem}>
                          <Text style={styles.fieldLabelStandalone}>
                            Duration (sec)
                          </Text>
                          <TextInput
                            value={block.durationSeconds || ""}
                            onChangeText={(value) =>
                              setBlocksDraft((prev) =>
                                prev.map((b, i) =>
                                  i === index
                                    ? { ...b, durationSeconds: value }
                                    : b
                                )
                              )
                            }
                            keyboardType="number-pad"
                            style={[
                              styles.fieldInputFull,
                              styles.fieldInputExercise
                            ]}
                            placeholder="Optional"
                          />
                        </View>
                      </View>

                      <View>
                        <Text style={styles.fieldLabelStandalone}>Note</Text>
                        <TextInput
                          value={block.note || ""}
                          onChangeText={(value) =>
                            setBlocksDraft((prev) =>
                              prev.map((b, i) =>
                                i === index ? { ...b, note: value } : b
                              )
                            )
                          }
                          style={[
                            styles.fieldInputFull,
                            styles.fieldInputExercise
                          ]}
                          placeholder="Optional notes"
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Save Button */}
      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={({ pressed }) => [
          styles.primaryBtn,
          pressed && !saving && styles.primaryBtnPressed,
          saving && styles.primaryBtnDisabled
        ]}
      >
        <Ionicons
          name="save-outline"
          size={18}
          color={theme.colors.primaryTextOn}
          style={{ marginRight: theme.spacing.sm }}
        />
        <Text style={styles.primaryBtnText}>
          {saving ? "Saving..." : "Save Program"}
        </Text>
      </Pressable>

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
              <Text style={styles.modalTitle}>Choose Exercise</Text>
              <Pressable
                onPress={() => setExercisePickerOpen(false)}
                style={({ pressed }) => [
                  styles.iconBtn,
                  pressed && styles.iconBtnPressed
                ]}
              >
                <Ionicons name="close" size={18} color={theme.colors.text} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {exercises.map((exercise) => (
                <Pressable
                  key={exercise.id}
                  onPress={() => {
                    if (pickerTargetIndex === null) return;
                    haptics.buttonTap();
                    setBlocksDraft((prev) =>
                      prev.map((b, i) =>
                        i === pickerTargetIndex && b.type === "exercise"
                          ? { ...b, exerciseId: exercise.id }
                          : b
                      )
                    );
                    setExercisePickerOpen(false);
                    setPickerTargetIndex(null);
                  }}
                  style={({ pressed }) => [
                    styles.modalRow,
                    pressed && styles.modalRowPressed
                  ]}
                >
                  <Text style={styles.modalRowText}>{exercise.name}</Text>
                  {exercise.source === "builtin" && (
                    <Text style={styles.modalRowHint}>Built-in</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: theme.spacing.xxl
  },
  headerSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.lg
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  headerBackPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }]
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    flex: 1
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.muted
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    ...theme.typography.body
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top"
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs
  },
  smallBtnPressed: { backgroundColor: theme.colors.border },
  smallBtnText: { ...theme.typography.caption, color: theme.colors.text },
  sessionTabs: {
    marginVertical: theme.spacing.md
  },
  sessionTab: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
    gap: theme.spacing.xs
  },
  sessionTabActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight
  },
  sessionTabText: {
    ...theme.typography.caption,
    color: theme.colors.text
  },
  sessionTabTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  sessionTabRemove: {
    padding: 2
  },
  blockControls: {
    marginBottom: theme.spacing.md
  },
  blockControlsTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  blockButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  blocksList: {
    gap: theme.spacing.md
  },
  blockCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    ...theme.shadows.sm
  },
  blockCardWarmup: {
    backgroundColor: theme.colors.phases.warmupBg
  },
  blockCardRest: {
    backgroundColor: theme.colors.phases.breakBg
  },
  blockCardExercise: {
    backgroundColor: theme.colors.phases.workingBg
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card
  },
  blockHeaderWarmup: {
    backgroundColor: theme.colors.phases.warmupBg
  },
  blockHeaderRest: {
    backgroundColor: theme.colors.phases.breakBg
  },
  blockHeaderExercise: {
    backgroundColor: theme.colors.phases.workingBg
  },
  blockTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flex: 1
  },
  dragHandle: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  dragHandleWarmup: {
    backgroundColor: theme.colors.phases.warmup,
    borderColor: theme.colors.phases.warmup
  },
  dragHandleRest: {
    backgroundColor: theme.colors.phases.break,
    borderColor: theme.colors.phases.break
  },
  dragHandleExercise: {
    backgroundColor: theme.colors.phases.working,
    borderColor: theme.colors.phases.working
  },
  blockTitle: {
    ...theme.typography.body,
    color: theme.colors.text,
    textTransform: "capitalize",
    fontFamily: theme.fonts.semiBold
  },
  blockTitleWarmup: {
    color: theme.colors.phases.warmup
  },
  blockTitleRest: {
    color: theme.colors.phases.break
  },
  blockTitleExercise: {
    color: theme.colors.phases.working
  },
  blockActions: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    alignItems: "center"
  },
  blockContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface
  },
  iconBtnPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }]
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    paddingTop: theme.spacing.sm
  },
  fieldRowVertical: {
    flexDirection: "column",
    gap: theme.spacing.sm
  },
  fieldRowTwoCol: {
    flexDirection: "row",
    gap: theme.spacing.md
  },
  fieldRowTwoColItem: {
    flex: 1
  },
  fieldLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    flex: 1,
    fontFamily: theme.fonts.semiBold
  },
  fieldLabelStandalone: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontFamily: theme.fonts.semiBold,
    marginBottom: theme.spacing.xs
  },
  fieldInput: {
    width: 110,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    ...theme.typography.body,
    textAlign: "right"
  },
  fieldInputFull: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    ...theme.typography.body,
    textAlign: "left"
  },
  fieldInputWarmup: {
    backgroundColor: theme.colors.phases.warmupBg,
    borderColor: theme.colors.phases.warmup
  },
  fieldInputRest: {
    backgroundColor: theme.colors.phases.breakBg,
    borderColor: theme.colors.phases.break
  },
  fieldInputExercise: {
    backgroundColor: theme.colors.phases.workingBg,
    borderColor: theme.colors.phases.working
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.card
  },
  pickerBtnExercise: {
    backgroundColor: theme.colors.phases.workingBg,
    borderColor: theme.colors.phases.working
  },
  pickerBtnPressed: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.98 }]
  },
  pickerBtnText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    ...theme.shadows.md
  },
  primaryBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end"
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: "80%"
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md
  },
  modalTitle: { ...theme.typography.h3, color: theme.colors.text },
  modalRow: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md
  },
  modalRowPressed: { backgroundColor: theme.colors.card },
  modalRowText: { ...theme.typography.body, color: theme.colors.text },
  modalRowHint: { ...theme.typography.caption, color: theme.colors.muted },
  nameSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 0,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md
  },
  nameInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    ...theme.typography.body,
    ...theme.shadows.sm
  },
  quickAddSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 0,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  quickAddBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.sm
  },
  quickAddBtnPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }]
  },
  quickAddBtnText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold,
    textAlign: "center"
  },
  blocksSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 0,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg
  }
});
