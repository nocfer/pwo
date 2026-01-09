/**
 * Exercise Form Component
 * Clean, professional form for creating and editing exercises
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

export type ExerciseFormData = {
  name: string;
  category: ExerciseCategory;
  icon: string;
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
    icon: initialData?.icon || "barbell"
  });

  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const updateField = useCallback(
    <K extends keyof ExerciseFormData>(
      field: K,
      value: ExerciseFormData[K]
    ) => {
      if (field === "category") {
        haptics.buttonTap();
      }
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    const trimmed = formData.name.trim();

    const exerciseData = {
      name: trimmed,
      category: formData.category,
      icon: formData.icon
    };

    const validationResult = validateExercise(exerciseData as never);

    if (!validationResult.isValid) {
      haptics.formValidationError();
      const firstError = validationResult.errors[0];
      Alert.alert("Validation Error", firstError.message);
      return;
    }

    try {
      await onSave({
        ...formData,
        name: trimmed
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
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed
          ]}
        >
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {mode === "create" ? "New Exercise" : "Edit Exercise"}
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
            {saving ? "Saving..." : "Save"}
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
        {/* Name Field */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name</Text>
          <TextInput
            value={formData.name}
            onChangeText={(value) => updateField("name", value)}
            placeholder="e.g. Bench Press"
            placeholderTextColor={theme.colors.muted}
            style={styles.textInput}
            autoFocus={mode === "create"}
          />
        </View>

        {/* Category Field */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {VALID_EXERCISE_CATEGORIES.map((category) => {
              const isSelected = formData.category === category;
              return (
                <Pressable
                  key={category}
                  onPress={() => updateField("category", category)}
                  style={[
                    styles.categoryOption,
                    isSelected && styles.categoryOptionSelected
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected
                    ]}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Icon Field */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Icon</Text>
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
              <View style={styles.iconCircle}>
                <Ionicons
                  name={
                    (formData.icon as keyof typeof Ionicons.glyphMap) || "help"
                  }
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.iconName}>{formData.icon}</Text>
            </View>
            <View style={styles.changeButton}>
              <Text style={styles.changeButtonText}>Change</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Icon Picker Modal */}
      <Modal
        visible={iconPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIconPickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIconPickerOpen(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Icon</Text>
            </View>
            <ScrollView
              style={styles.iconGrid}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.iconGridContent}
            >
              {VALID_EXERCISE_ICONS.map((iconName) => {
                const isSelected = formData.icon === iconName;
                return (
                  <Pressable
                    key={iconName}
                    onPress={() => {
                      haptics.buttonTap();
                      updateField("icon", iconName);
                      setIconPickerOpen(false);
                    }}
                    style={[
                      styles.iconOption,
                      isSelected && styles.iconOptionSelected
                    ]}
                  >
                    <Ionicons
                      name={iconName as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={
                        isSelected ? theme.colors.primary : theme.colors.subtext
                      }
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center"
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
    gap: theme.spacing.xl
  },
  section: {
    gap: theme.spacing.md
  },
  sectionTitle: {
    ...theme.typography.small,
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: theme.spacing.xs
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    color: theme.colors.text,
    ...theme.typography.body,
    ...theme.shadows.sm
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  categoryOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm
  },
  categoryOptionSelected: {
    backgroundColor: theme.colors.primary
  },
  categoryText: {
    ...theme.typography.bodyBold,
    color: theme.colors.subtext
  },
  categoryTextSelected: {
    color: theme.colors.primaryTextOn
  },
  iconSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm
  },
  iconSelectorPressed: {
    transform: [{ scale: 0.98 }]
  },
  iconPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center"
  },
  iconName: {
    ...theme.typography.body,
    color: theme.colors.text
  },
  changeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background
  },
  changeButtonText: {
    ...theme.typography.captionBold,
    color: theme.colors.primary
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: "70%",
    paddingBottom: theme.spacing.xxl
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: "center",
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
    textAlign: "center"
  },
  iconGrid: {
    flex: 1
  },
  iconGridContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: theme.spacing.lg,
    gap: theme.spacing.sm
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background
  },
  iconOptionSelected: {
    backgroundColor: theme.colors.primaryLight
  }
});
