/**
 * Program Form Component
 * Simplified MVP version for creating workout programs
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

type BlockDraft =
  | { type: "warmup"; seconds: string }
  | { type: "rest"; seconds: string }
  | { type: "exercise"; exerciseId: string; targetReps?: string };

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

function convertBlocksToDraft(blocks: ProgramBlock[]): BlockDraft[] {
  return blocks.map((block): BlockDraft => {
    if (block.type === "warmup") {
      return { type: "warmup", seconds: String(block.seconds) };
    }
    if (block.type === "rest") {
      return { type: "rest", seconds: String(block.seconds) };
    }
    return {
      type: "exercise",
      exerciseId: block.exerciseId,
      targetReps: block.targetReps ? String(block.targetReps) : ""
    };
  });
}

function convertDraftToBlocks(drafts: BlockDraft[]): ProgramBlock[] {
  return drafts.map((draft): ProgramBlock => {
    if (draft.type === "warmup") {
      return { type: "warmup", seconds: Number(draft.seconds) || 0 };
    }
    if (draft.type === "rest") {
      return { type: "rest", seconds: Number(draft.seconds) || 0 };
    }
    return {
      type: "exercise",
      exerciseId: draft.exerciseId,
      targetReps: draft.targetReps ? Number(draft.targetReps) : undefined
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
    convertBlocksToDraft(
      initialData?.blocks || [{ type: "warmup", seconds: 180 }]
    )
  );
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(
    null
  );

  const addBlock = useCallback(
    (type: BlockDraft["type"]) => {
      haptics.buttonTap();
      if (type === "warmup") {
        setBlocksDraft((prev) => [...prev, { type: "warmup", seconds: "120" }]);
      } else if (type === "rest") {
        setBlocksDraft((prev) => [...prev, { type: "rest", seconds: "90" }]);
      } else {
        const firstExercise = exercises[0]?.id || "";
        setBlocksDraft((prev) => [
          ...prev,
          { type: "exercise", exerciseId: firstExercise, targetReps: "" }
        ]);
      }
    },
    [exercises]
  );

  const removeBlock = useCallback((index: number) => {
    haptics.deleteItem();
    setBlocksDraft((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveBlock = useCallback(
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

  const updateBlockField = useCallback(
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

    const programData = { name: trimmed, blocks: finalBlocks };
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
      await onSave({ name: trimmed, blocks: finalBlocks });
      haptics.formSave();
    } catch (error) {
      haptics.formValidationError();
      Alert.alert(
        "Couldn't save",
        error instanceof Error ? error.message : String(error)
      );
    }
  }, [name, blocksDraft, exercises, onSave]);

  const handleCancel = useCallback(() => {
    haptics.formCancel();
    onCancel();
  }, [onCancel]);

  const getBlockIcon = (type: BlockDraft["type"]) => {
    switch (type) {
      case "warmup":
        return "flame-outline";
      case "rest":
        return "pause-outline";
      case "exercise":
        return "barbell-outline";
    }
  };

  const getBlockColor = (type: BlockDraft["type"]) => {
    switch (type) {
      case "warmup":
        return theme.colors.phases.warmup;
      case "rest":
        return theme.colors.phases.break;
      case "exercise":
        return theme.colors.primary;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.nameCard}>
          <Text style={styles.label}>Program Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Upper Body Strength"
            placeholderTextColor={theme.colors.muted}
            style={styles.nameInput}
            autoFocus={mode === "create"}
          />
        </View>

        <View style={styles.addBlockRow}>
          <Pressable
            onPress={() => addBlock("exercise")}
            style={({ pressed }) => [
              styles.addBlockBtn,
              pressed && styles.addBlockBtnPressed
            ]}
          >
            <Ionicons
              name="barbell-outline"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={styles.addBlockBtnText}>Exercise</Text>
          </Pressable>
          <Pressable
            onPress={() => addBlock("rest")}
            style={({ pressed }) => [
              styles.addBlockBtn,
              pressed && styles.addBlockBtnPressed
            ]}
          >
            <Ionicons
              name="pause-outline"
              size={18}
              color={theme.colors.phases.break}
            />
            <Text style={styles.addBlockBtnText}>Rest</Text>
          </Pressable>
          <Pressable
            onPress={() => addBlock("warmup")}
            style={({ pressed }) => [
              styles.addBlockBtn,
              pressed && styles.addBlockBtnPressed
            ]}
          >
            <Ionicons
              name="flame-outline"
              size={18}
              color={theme.colors.phases.warmup}
            />
            <Text style={styles.addBlockBtnText}>Warmup</Text>
          </Pressable>
        </View>

        {blocksDraft.length > 0 && (
          <View style={styles.blocksList}>
            {blocksDraft.map((block, index) => (
              <View key={index} style={styles.blockCard}>
                <View style={styles.blockHeader}>
                  <View style={styles.blockHeaderLeft}>
                    <View
                      style={[
                        styles.blockIndicator,
                        { backgroundColor: getBlockColor(block.type) }
                      ]}
                    />
                    <Ionicons
                      name={getBlockIcon(block.type) as any}
                      size={18}
                      color={getBlockColor(block.type)}
                    />
                    <Text style={styles.blockType}>{block.type}</Text>
                  </View>
                  <View style={styles.blockActions}>
                    {index > 0 && (
                      <Pressable
                        onPress={() => moveBlock(index, "up")}
                        style={({ pressed }) => [
                          styles.blockActionBtn,
                          pressed && styles.blockActionBtnPressed
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
                        onPress={() => moveBlock(index, "down")}
                        style={({ pressed }) => [
                          styles.blockActionBtn,
                          pressed && styles.blockActionBtnPressed
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
                        styles.blockActionBtn,
                        pressed && styles.blockActionBtnPressed
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

                <View style={styles.blockContent}>
                  {block.type === "warmup" && (
                    <View style={styles.blockField}>
                      <Text style={styles.blockFieldLabel}>Duration (sec)</Text>
                      <TextInput
                        value={block.seconds}
                        onChangeText={(v) =>
                          updateBlockField(index, "seconds", v)
                        }
                        keyboardType="number-pad"
                        style={styles.blockFieldInput}
                        placeholder="180"
                        placeholderTextColor={theme.colors.muted}
                      />
                    </View>
                  )}

                  {block.type === "rest" && (
                    <View style={styles.blockField}>
                      <Text style={styles.blockFieldLabel}>Duration (sec)</Text>
                      <TextInput
                        value={block.seconds}
                        onChangeText={(v) =>
                          updateBlockField(index, "seconds", v)
                        }
                        keyboardType="number-pad"
                        style={styles.blockFieldInput}
                        placeholder="90"
                        placeholderTextColor={theme.colors.muted}
                      />
                    </View>
                  )}

                  {block.type === "exercise" && (
                    <>
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
                        >
                          {exerciseNameById.get(block.exerciseId) ||
                            "Select exercise"}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={theme.colors.muted}
                        />
                      </Pressable>
                      <View style={styles.blockField}>
                        <Text style={styles.blockFieldLabel}>Target Reps</Text>
                        <TextInput
                          value={block.targetReps || ""}
                          onChangeText={(v) =>
                            updateBlockField(index, "targetReps", v)
                          }
                          keyboardType="number-pad"
                          style={styles.blockFieldInput}
                          placeholder="10"
                          placeholderTextColor={theme.colors.muted}
                        />
                      </View>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {blocksDraft.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="layers-outline"
              size={40}
              color={theme.colors.muted}
            />
            <Text style={styles.emptyStateText}>
              Add exercises, rest periods, or warmups
            </Text>
          </View>
        )}
      </ScrollView>

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
              style={styles.exerciseList}
              showsVerticalScrollIndicator={false}
            >
              {exercises.map((exercise) => {
                const isSelected =
                  pickerTargetIndex !== null &&
                  blocksDraft[pickerTargetIndex]?.type === "exercise" &&
                  (blocksDraft[pickerTargetIndex] as any).exerciseId ===
                    exercise.id;
                return (
                  <Pressable
                    key={exercise.id}
                    onPress={() => {
                      if (pickerTargetIndex === null) return;
                      haptics.buttonTap();
                      updateBlockField(
                        pickerTargetIndex,
                        "exerciseId",
                        exercise.id
                      );
                      setExercisePickerOpen(false);
                      setPickerTargetIndex(null);
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
                        name="checkmark"
                        size={18}
                        color={theme.colors.primary}
                      />
                    )}
                  </Pressable>
                );
              })}
              {exercises.length === 0 && (
                <Text style={styles.emptyListText}>
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
  nameCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    ...theme.shadows.sm
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    fontFamily: theme.fonts.semiBold
  },
  nameInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    ...theme.typography.body
  },
  addBlockRow: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  addBlockBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.sm
  },
  addBlockBtnPressed: {
    backgroundColor: theme.colors.background,
    transform: [{ scale: 0.98 }]
  },
  addBlockBtnText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold
  },
  blocksList: {
    gap: theme.spacing.md
  },
  blockCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    ...theme.shadows.sm
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  blockHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  blockIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2
  },
  blockType: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    fontFamily: theme.fonts.semiBold,
    textTransform: "capitalize"
  },
  blockActions: {
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  blockActionBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  blockActionBtnPressed: {
    backgroundColor: theme.colors.background
  },
  blockContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md
  },
  blockField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md
  },
  blockFieldLabel: {
    ...theme.typography.body,
    color: theme.colors.subtext
  },
  blockFieldInput: {
    width: 100,
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
  exercisePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface
  },
  exercisePickerPressed: {
    backgroundColor: theme.colors.background
  },
  exercisePickerText: {
    ...theme.typography.body,
    color: theme.colors.text
  },
  exercisePickerPlaceholder: {
    color: theme.colors.muted
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xxl,
    gap: theme.spacing.md
  },
  emptyStateText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center"
  },
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
  exerciseList: {
    maxHeight: 350
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  emptyListText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    padding: theme.spacing.xl
  }
});
