/**
 * Enhanced Program Form Component
 * Supports enhanced program properties including difficulty, estimated duration,
 * tags, and advanced session building with drag-and-drop support
 */

import haptics from "@/lib/haptics";
import { validateProgram } from "@/lib/validation";
import { theme } from "@/theme/theme";
import type { ProgramBlock, ProgramSession } from "@/types";
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
  description?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  estimatedDuration?: number; // minutes
  tags?: string[];
  sessions: ProgramSession[];
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
    description: initialData?.description || "",
    difficulty: initialData?.difficulty || "beginner",
    estimatedDuration: initialData?.estimatedDuration || undefined,
    tags: initialData?.tags || [],
    sessions: initialData?.sessions || [
      {
        index: 1,
        name: "Session 1",
        blocks: [{ type: "warmup", seconds: 180 }]
      }
    ]
  });

  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [sessionBlocks, setSessionBlocks] = useState<BlockDraft[]>(
    convertSessionBlocksToDraft(formData.sessions[0]?.blocks || [])
  );

  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(
    null
  );
  const [newTag, setNewTag] = useState("");

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
      if (field === "difficulty") {
        haptics.buttonTap();
      }
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const addTag = useCallback(() => {
    if (!newTag.trim()) return;
    const currentTags = formData.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      haptics.buttonTap();
      updateField("tags", [...currentTags, newTag.trim()]);
    }
    setNewTag("");
  }, [formData.tags, newTag, updateField]);

  const removeTag = useCallback(
    (index: number) => {
      haptics.buttonTap();
      const currentTags = formData.tags || [];
      updateField(
        "tags",
        currentTags.filter((_, i) => i !== index)
      );
    },
    [formData.tags, updateField]
  );

  const addSession = useCallback(() => {
    haptics.buttonTap();
    const newSession: ProgramSession = {
      index: formData.sessions.length + 1,
      name: `Session ${formData.sessions.length + 1}`,
      blocks: [{ type: "warmup", seconds: 180 }]
    };
    updateField("sessions", [...formData.sessions, newSession]);
  }, [formData.sessions, updateField]);

  const removeSession = useCallback(
    (sessionIndex: number) => {
      if (formData.sessions.length <= 1) {
        haptics.formValidationError();
        Alert.alert(
          "Cannot remove",
          "Programs must have at least one session."
        );
        return;
      }
      haptics.deleteItem();
      const updatedSessions = formData.sessions
        .filter((_, i) => i !== sessionIndex)
        .map((session, i) => ({
          ...session,
          index: i + 1,
          name: `Session ${i + 1}`
        }));
      updateField("sessions", updatedSessions);

      // Switch to first session if we removed the active one
      if (sessionIndex === activeSessionIndex) {
        setActiveSessionIndex(0);
        setSessionBlocks(
          convertSessionBlocksToDraft(updatedSessions[0]?.blocks || [])
        );
      } else if (sessionIndex < activeSessionIndex) {
        setActiveSessionIndex(activeSessionIndex - 1);
      }
    },
    [formData.sessions, activeSessionIndex, updateField]
  );

  const switchSession = useCallback(
    (sessionIndex: number) => {
      haptics.dataTabSwitch();
      // Save current session blocks
      const updatedSessions = [...formData.sessions];
      updatedSessions[activeSessionIndex] = {
        ...updatedSessions[activeSessionIndex],
        blocks: convertDraftToSessionBlocks(sessionBlocks)
      };
      updateField("sessions", updatedSessions);

      // Switch to new session
      setActiveSessionIndex(sessionIndex);
      setSessionBlocks(
        convertSessionBlocksToDraft(updatedSessions[sessionIndex]?.blocks || [])
      );
    },
    [formData.sessions, activeSessionIndex, sessionBlocks, updateField]
  );

  const addBlock = useCallback(
    (type: BlockDraft["type"]) => {
      haptics.buttonTap();
      if (type === "warmup") {
        setSessionBlocks((prev) => [...prev, { type, seconds: "120" }]);
      } else if (type === "rest") {
        setSessionBlocks((prev) => [
          ...prev,
          { type, seconds: "90", label: "Rest" }
        ]);
      } else if (type === "exercise") {
        const firstExercise = exercises[0]?.id || "";
        setSessionBlocks((prev) => [
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
    setSessionBlocks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    haptics.buttonTap();
    setSessionBlocks((prev) => {
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

    // Save current session blocks before validation
    const updatedSessions = [...formData.sessions];
    updatedSessions[activeSessionIndex] = {
      ...updatedSessions[activeSessionIndex],
      blocks: convertDraftToSessionBlocks(sessionBlocks)
    };

    // Create program object for validation
    const programData = {
      name: trimmed,
      description: formData.description?.trim() || undefined,
      sessions: updatedSessions
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
    for (const session of updatedSessions) {
      for (const block of session.blocks) {
        if (block.type === "exercise" && !exerciseIds.has(block.exerciseId)) {
          haptics.formValidationError();
          Alert.alert(
            "Invalid exercise reference",
            "One or more exercises no longer exist. Please update the program."
          );
          return;
        }
      }
    }

    try {
      await onSave({
        ...formData,
        name: trimmed,
        description: formData.description?.trim() || undefined,
        sessions: updatedSessions
      });
      haptics.formSave();
    } catch (error) {
      haptics.formValidationError();
      Alert.alert(
        "Couldn't save",
        error instanceof Error ? error.message : String(error)
      );
    }
  }, [formData, activeSessionIndex, sessionBlocks, exercises, onSave]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
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

      {/* Basic Information */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <Text style={styles.label}>Name *</Text>
        <TextInput
          value={formData.name}
          onChangeText={(value) => updateField("name", value)}
          placeholder="e.g. Upper Body Strength"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
        />

        <View style={{ height: theme.spacing.md }} />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={formData.description}
          onChangeText={(value) => updateField("description", value)}
          placeholder="Brief description of this program"
          placeholderTextColor={theme.colors.muted}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={3}
        />

        <View style={{ height: theme.spacing.md }} />

        <Text style={styles.label}>Difficulty</Text>
        <View style={styles.segmented}>
          {(["beginner", "intermediate", "advanced"] as const).map(
            (difficulty) => (
              <Pressable
                key={difficulty}
                onPress={() => updateField("difficulty", difficulty)}
                style={[
                  styles.segment,
                  formData.difficulty === difficulty && styles.segmentActive
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    formData.difficulty === difficulty &&
                      styles.segmentTextActive
                  ]}
                >
                  {difficulty}
                </Text>
              </Pressable>
            )
          )}
        </View>

        <View style={{ height: theme.spacing.md }} />

        <Text style={styles.label}>Estimated Duration (minutes)</Text>
        <TextInput
          value={
            formData.estimatedDuration ? String(formData.estimatedDuration) : ""
          }
          onChangeText={(value) => {
            const num = Number(value);
            updateField(
              "estimatedDuration",
              Number.isFinite(num) && num > 0 ? num : undefined
            );
          }}
          placeholder="e.g. 45"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
          keyboardType="number-pad"
        />
      </View>

      {/* Tags */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tags</Text>

        <View style={styles.arrayInputContainer}>
          <TextInput
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Add tag (e.g. strength, hypertrophy)"
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, { flex: 1 }]}
            onSubmitEditing={addTag}
          />
          <Pressable
            onPress={addTag}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed
            ]}
          >
            <Ionicons name="add" size={20} color={theme.colors.primary} />
          </Pressable>
        </View>

        <View style={styles.tagContainer}>
          {formData.tags?.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <Pressable
                onPress={() => removeTag(index)}
                style={styles.tagRemove}
              >
                <Ionicons name="close" size={14} color={theme.colors.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      {/* Sessions */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Sessions</Text>
          <Pressable
            onPress={addSession}
            style={({ pressed }) => [
              styles.smallBtn,
              pressed && styles.smallBtnPressed
            ]}
          >
            <Ionicons name="add" size={16} color={theme.colors.primary} />
            <Text style={styles.smallBtnText}>Add Session</Text>
          </Pressable>
        </View>

        {/* Session Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sessionTabs}
        >
          {formData.sessions.map((session, index) => (
            <Pressable
              key={index}
              onPress={() => switchSession(index)}
              style={[
                styles.sessionTab,
                index === activeSessionIndex && styles.sessionTabActive
              ]}
            >
              <Text
                style={[
                  styles.sessionTabText,
                  index === activeSessionIndex && styles.sessionTabTextActive
                ]}
              >
                {session.name}
              </Text>
              {formData.sessions.length > 1 && (
                <Pressable
                  onPress={() => removeSession(index)}
                  style={styles.sessionTabRemove}
                >
                  <Ionicons name="close" size={14} color={theme.colors.muted} />
                </Pressable>
              )}
            </Pressable>
          ))}
        </ScrollView>

        {/* Block Controls */}
        <View style={styles.blockControls}>
          <Text style={styles.blockControlsTitle}>
            {formData.sessions[activeSessionIndex]?.name || "Session"}
          </Text>
          <View style={styles.blockButtonsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.smallBtn,
                pressed && styles.smallBtnPressed
              ]}
              onPress={() => addBlock("warmup")}
            >
              <Text style={styles.smallBtnText}>+ Warm-up</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.smallBtn,
                pressed && styles.smallBtnPressed
              ]}
              onPress={() => addBlock("exercise")}
            >
              <Text style={styles.smallBtnText}>+ Exercise</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.smallBtn,
                pressed && styles.smallBtnPressed
              ]}
              onPress={() => addBlock("rest")}
            >
              <Text style={styles.smallBtnText}>+ Rest</Text>
            </Pressable>
          </View>
        </View>

        {/* Session Blocks */}
        <View style={styles.blocksList}>
          {sessionBlocks.map((block, index) => (
            <View key={index} style={styles.blockCard}>
              <View style={styles.rowBetween}>
                <View style={styles.blockTitleRow}>
                  <View style={styles.dragHandle}>
                    <Ionicons
                      name="reorder-two"
                      size={16}
                      color={theme.colors.muted}
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
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.blockTitle}>{block.type}</Text>
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
                  {index < sessionBlocks.length - 1 && (
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
                      color={theme.colors.muted}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Block-specific fields */}
              {block.type === "warmup" && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Seconds</Text>
                  <TextInput
                    value={block.seconds}
                    onChangeText={(value) =>
                      setSessionBlocks((prev) =>
                        prev.map((b, i) =>
                          i === index ? { ...b, seconds: value } : b
                        )
                      )
                    }
                    keyboardType="number-pad"
                    style={styles.fieldInput}
                  />
                </View>
              )}

              {block.type === "rest" && (
                <>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Label</Text>
                    <TextInput
                      value={block.label || ""}
                      onChangeText={(value) =>
                        setSessionBlocks((prev) =>
                          prev.map((b, i) =>
                            i === index ? { ...b, label: value } : b
                          )
                        )
                      }
                      style={styles.fieldInput}
                    />
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Seconds</Text>
                    <TextInput
                      value={block.seconds}
                      onChangeText={(value) =>
                        setSessionBlocks((prev) =>
                          prev.map((b, i) =>
                            i === index ? { ...b, seconds: value } : b
                          )
                        )
                      }
                      keyboardType="number-pad"
                      style={styles.fieldInput}
                    />
                  </View>
                </>
              )}

              {block.type === "exercise" && (
                <>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Exercise</Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.pickerBtn,
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
                          "Pick exercise"}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={theme.colors.muted}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Target Reps</Text>
                    <TextInput
                      value={block.targetReps || ""}
                      onChangeText={(value) =>
                        setSessionBlocks((prev) =>
                          prev.map((b, i) =>
                            i === index ? { ...b, targetReps: value } : b
                          )
                        )
                      }
                      keyboardType="number-pad"
                      style={styles.fieldInput}
                      placeholder="Optional"
                    />
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Duration (sec)</Text>
                    <TextInput
                      value={block.durationSeconds || ""}
                      onChangeText={(value) =>
                        setSessionBlocks((prev) =>
                          prev.map((b, i) =>
                            i === index ? { ...b, durationSeconds: value } : b
                          )
                        )
                      }
                      keyboardType="number-pad"
                      style={styles.fieldInput}
                      placeholder="Optional"
                    />
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Note</Text>
                    <TextInput
                      value={block.note || ""}
                      onChangeText={(value) =>
                        setSessionBlocks((prev) =>
                          prev.map((b, i) =>
                            i === index ? { ...b, note: value } : b
                          )
                        )
                      }
                      style={[
                        styles.fieldInput,
                        { width: 200, textAlign: "left" }
                      ]}
                      placeholder="Optional"
                    />
                  </View>
                </>
              )}
            </View>
          ))}
        </View>
      </View>

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
                    setSessionBlocks((prev) =>
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
    paddingBottom: theme.spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md
  },
  headerBack: {
    padding: theme.spacing.xs,
    marginTop: -theme.spacing.xs,
    marginLeft: -theme.spacing.xs
  },
  headerBackPressed: { opacity: 0.6 },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
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
  segmented: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm
  },
  segment: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md
  },
  segmentActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight
  },
  segmentText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textTransform: "capitalize"
  },
  segmentTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  arrayInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center"
  },
  addButtonPressed: { opacity: 0.7 },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs
  },
  tagText: {
    ...theme.typography.caption,
    color: theme.colors.primary
  },
  tagRemove: {
    padding: 2
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
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm
  },
  blockTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  dragHandle: {
    padding: theme.spacing.xs
  },
  blockTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    textTransform: "capitalize"
  },
  blockActions: {
    flexDirection: "row",
    gap: theme.spacing.xs
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
    gap: theme.spacing.md
  },
  fieldLabel: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    flex: 1
  },
  fieldInput: {
    width: 110,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    ...theme.typography.body,
    textAlign: "right"
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface
  },
  pickerBtnPressed: { backgroundColor: theme.colors.card },
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
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    ...theme.shadows.md
  },
  primaryBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  primaryBtnDisabled: { opacity: 0.6 },
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
  modalRowHint: { ...theme.typography.caption, color: theme.colors.muted }
});
