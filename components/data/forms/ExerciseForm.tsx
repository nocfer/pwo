/**
 * Exercise Form Component
 * Simplified MVP version with essential fields only
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
          {mode === "create" ? "New Exercise" : "Edit Exercise"}
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
        <View style={styles.card}>
          {/* Name Field */}
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={formData.name}
              onChangeText={(value) => updateField("name", value)}
              placeholder="e.g. Bench Press"
              placeholderTextColor={theme.colors.muted}
              style={styles.input}
              autoFocus={mode === "create"}
            />
          </View>

          {/* Category Field */}
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipGroup}>
              {VALID_EXERCISE_CATEGORIES.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => updateField("category", category)}
                  style={[
                    styles.chip,
                    formData.category === category && styles.chipActive
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.category === category && styles.chipTextActive
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Icon Field */}
          <View style={styles.field}>
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
                <View style={styles.iconPreviewCircle}>
                  <Ionicons
                    name={(formData.icon as any) || "help"}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.iconPreviewText}>{formData.icon}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.muted}
              />
            </Pressable>
          </View>
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
                  styles.modalCloseBtn,
                  pressed && styles.modalCloseBtnPressed
                ]}
              >
                <Ionicons name="close" size={18} color={theme.colors.text} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.iconGrid}
              showsVerticalScrollIndicator={false}
            >
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
                      size={22}
                      color={
                        formData.icon === iconName
                          ? theme.colors.primary
                          : theme.colors.subtext
                      }
                    />
                  </Pressable>
                ))}
              </View>
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
    paddingBottom: theme.spacing.xxl
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    ...theme.shadows.sm
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
  chipGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight
  },
  chipText: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    textTransform: "capitalize"
  },
  chipTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  iconSelector: {
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
  iconSelectorPressed: {
    backgroundColor: theme.colors.background
  },
  iconPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md
  },
  iconPreviewCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center"
  },
  iconPreviewText: {
    ...theme.typography.body,
    color: theme.colors.text
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
    maxHeight: "70%"
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
  iconGrid: {
    maxHeight: 350
  },
  iconGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg
  },
  iconOption: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface
  },
  iconOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight
  },
  iconOptionPressed: {
    backgroundColor: theme.colors.background
  }
});
