/**
 * Enhanced Exercise Form Component
 * Supports enhanced exercise properties including description, instructions,
 * muscle groups, difficulty, equipment, and tags
 */

import haptics from "@/lib/haptics";
import {
  VALID_EXERCISE_CATEGORIES,
  VALID_EXERCISE_ICONS,
  validateExercise
} from "@/lib/validation";
import { theme } from "@/theme/theme";
import type { ExerciseCategory } from "@/types";
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

export type ExerciseFormData = {
  name: string;
  category: ExerciseCategory;
  icon: string;
  description?: string;
  instructions?: string;
  muscleGroups?: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
  equipment?: string[];
  tags?: string[];
};

export type ExerciseFormProps = {
  mode: "create" | "edit";
  initialData?: Partial<ExerciseFormData>;
  onSave: (data: ExerciseFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
};

export function ExerciseForm({
  mode,
  initialData,
  onSave,
  onCancel,
  saving = false
}: ExerciseFormProps) {
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: initialData?.name || "",
    category: initialData?.category || "strength",
    icon: initialData?.icon || "barbell",
    description: initialData?.description || "",
    instructions: initialData?.instructions || "",
    muscleGroups: initialData?.muscleGroups || [],
    difficulty: initialData?.difficulty || "beginner",
    equipment: initialData?.equipment || [],
    tags: initialData?.tags || []
  });

  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [newMuscleGroup, setNewMuscleGroup] = useState("");
  const [newEquipment, setNewEquipment] = useState("");
  const [newTag, setNewTag] = useState("");

  const updateField = useCallback(
    <K extends keyof ExerciseFormData>(
      field: K,
      value: ExerciseFormData[K]
    ) => {
      if (field === "category" || field === "difficulty") {
        haptics.buttonTap();
      }
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const addArrayItem = useCallback(
    (field: "muscleGroups" | "equipment" | "tags", value: string) => {
      if (!value.trim()) return;
      const currentArray = formData[field] || [];
      if (!currentArray.includes(value.trim())) {
        haptics.buttonTap();
        updateField(field, [...currentArray, value.trim()]);
      }
    },
    [formData, updateField]
  );

  const removeArrayItem = useCallback(
    (field: "muscleGroups" | "equipment" | "tags", index: number) => {
      haptics.buttonTap();
      const currentArray = formData[field] || [];
      updateField(
        field,
        currentArray.filter((_, i) => i !== index)
      );
    },
    [formData, updateField]
  );

  const handleSave = useCallback(async () => {
    const trimmed = formData.name.trim();

    // Create exercise object for validation
    const exerciseData = {
      name: trimmed,
      category: formData.category,
      icon: formData.icon,
      description: formData.description?.trim() || undefined,
      instructions: formData.instructions?.trim() || undefined,
      muscleGroups: formData.muscleGroups,
      equipment: formData.equipment,
      difficulty: formData.difficulty,
      tags: formData.tags
    };

    // Validate using centralized validation
    const validationResult = validateExercise(exerciseData as any);

    if (!validationResult.isValid) {
      haptics.formValidationError();
      const firstError = validationResult.errors[0];
      Alert.alert("Validation Error", firstError.message);
      return;
    }

    try {
      await onSave({
        ...formData,
        name: trimmed,
        description: formData.description?.trim() || undefined,
        instructions: formData.instructions?.trim() || undefined
      });
      haptics.formSave();
    } catch (error) {
      haptics.formValidationError();
      Alert.alert(
        "Couldn't save",
        error instanceof Error ? error.message : String(error)
      );
    }
  }, [formData, onSave]);

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
            {mode === "create" ? "New Exercise" : "Edit Exercise"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {mode === "create"
              ? "Add an exercise to your library"
              : "Modify exercise details"}
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
          placeholder="e.g. Bench Press"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
        />

        <View style={{ height: theme.spacing.md }} />

        <Text style={styles.label}>Category *</Text>
        <View style={styles.segmented}>
          {VALID_EXERCISE_CATEGORIES.map((category) => (
            <Pressable
              key={category}
              onPress={() => updateField("category", category)}
              style={[
                styles.segment,
                formData.category === category && styles.segmentActive
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  formData.category === category && styles.segmentTextActive
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: theme.spacing.md }} />

        <Text style={styles.label}>Icon</Text>
        <Pressable
          onPress={() => {
            haptics.buttonTap();
            setIconPickerOpen(true);
          }}
          style={({ pressed }) => [
            styles.iconSelector,
            pressed && styles.iconSelectorPressed
          ]}
        >
          <View style={styles.iconPreview}>
            <Ionicons
              name={(formData.icon as any) || "help"}
              size={22}
              color={theme.colors.primary}
            />
            <Text style={styles.iconPreviewText}>{formData.icon}</Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={theme.colors.muted} />
        </Pressable>

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
      </View>

      {/* Description and Instructions */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Description & Instructions</Text>

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={formData.description}
          onChangeText={(value) => updateField("description", value)}
          placeholder="Brief description of the exercise"
          placeholderTextColor={theme.colors.muted}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={3}
        />

        <View style={{ height: theme.spacing.md }} />

        <Text style={styles.label}>Instructions</Text>
        <TextInput
          value={formData.instructions}
          onChangeText={(value) => updateField("instructions", value)}
          placeholder="Step-by-step instructions for proper form"
          placeholderTextColor={theme.colors.muted}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Muscle Groups */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Muscle Groups</Text>

        <View style={styles.arrayInputContainer}>
          <TextInput
            value={newMuscleGroup}
            onChangeText={setNewMuscleGroup}
            placeholder="Add muscle group (e.g. chest, shoulders)"
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, { flex: 1 }]}
            onSubmitEditing={() => {
              addArrayItem("muscleGroups", newMuscleGroup);
              setNewMuscleGroup("");
            }}
          />
          <Pressable
            onPress={() => {
              addArrayItem("muscleGroups", newMuscleGroup);
              setNewMuscleGroup("");
            }}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed
            ]}
          >
            <Ionicons name="add" size={20} color={theme.colors.primary} />
          </Pressable>
        </View>

        <View style={styles.tagContainer}>
          {formData.muscleGroups?.map((group, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{group}</Text>
              <Pressable
                onPress={() => removeArrayItem("muscleGroups", index)}
                style={styles.tagRemove}
              >
                <Ionicons name="close" size={14} color={theme.colors.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      {/* Equipment */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Equipment</Text>

        <View style={styles.arrayInputContainer}>
          <TextInput
            value={newEquipment}
            onChangeText={setNewEquipment}
            placeholder="Add equipment (e.g. barbell, dumbbells)"
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, { flex: 1 }]}
            onSubmitEditing={() => {
              addArrayItem("equipment", newEquipment);
              setNewEquipment("");
            }}
          />
          <Pressable
            onPress={() => {
              addArrayItem("equipment", newEquipment);
              setNewEquipment("");
            }}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed
            ]}
          >
            <Ionicons name="add" size={20} color={theme.colors.primary} />
          </Pressable>
        </View>

        <View style={styles.tagContainer}>
          {formData.equipment?.map((item, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{item}</Text>
              <Pressable
                onPress={() => removeArrayItem("equipment", index)}
                style={styles.tagRemove}
              >
                <Ionicons name="close" size={14} color={theme.colors.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      {/* Tags */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tags</Text>

        <View style={styles.arrayInputContainer}>
          <TextInput
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Add tag (e.g. compound, isolation)"
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, { flex: 1 }]}
            onSubmitEditing={() => {
              addArrayItem("tags", newTag);
              setNewTag("");
            }}
          />
          <Pressable
            onPress={() => {
              addArrayItem("tags", newTag);
              setNewTag("");
            }}
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
                onPress={() => removeArrayItem("tags", index)}
                style={styles.tagRemove}
              >
                <Ionicons name="close" size={14} color={theme.colors.muted} />
              </Pressable>
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
          {saving ? "Saving..." : "Save Exercise"}
        </Text>
      </Pressable>

      {/* Icon Picker Modal */}
      <Modal
        visible={iconPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIconPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Icon</Text>
              <Pressable
                onPress={() => setIconPickerOpen(false)}
                style={({ pressed }) => [
                  styles.iconBtn,
                  pressed && styles.iconBtnPressed
                ]}
              >
                <Ionicons name="close" size={18} color={theme.colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.iconGrid}>
              <View style={styles.iconGridContainer}>
                {VALID_EXERCISE_ICONS.map((iconName) => (
                  <Pressable
                    key={iconName}
                    onPress={() => {
                      haptics.buttonTap();
                      updateField("icon", iconName);
                      setIconPickerOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.iconOption,
                      formData.icon === iconName && styles.iconOptionSelected,
                      pressed && styles.iconOptionPressed
                    ]}
                  >
                    <Ionicons
                      name={iconName as any}
                      size={24}
                      color={
                        formData.icon === iconName
                          ? theme.colors.primary
                          : theme.colors.text
                      }
                    />
                    <Text
                      style={[
                        styles.iconOptionText,
                        formData.icon === iconName &&
                          styles.iconOptionTextSelected
                      ]}
                    >
                      {iconName}
                    </Text>
                  </Pressable>
                ))}
              </View>
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
  iconSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card
  },
  iconSelectorPressed: { backgroundColor: theme.colors.border },
  iconPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  iconPreviewText: {
    ...theme.typography.body,
    color: theme.colors.text
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
  iconBtn: {
    width: 36,
    height: 36,
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
  iconGrid: {
    maxHeight: 400
  },
  iconGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  iconOption: {
    width: "30%",
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.card,
    gap: theme.spacing.xs
  },
  iconOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight
  },
  iconOptionPressed: { opacity: 0.7 },
  iconOptionText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontSize: 10,
    textAlign: "center"
  },
  iconOptionTextSelected: {
    color: theme.colors.primary
  }
});
