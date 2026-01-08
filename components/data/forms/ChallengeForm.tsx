/**
 * Challenge Form Component
 * Simplified MVP version with essential fields only
 */

import { haptics } from "@/lib/haptics";
import { validateChallenge } from "@/lib/validation";
import { theme } from "@/theme/theme";
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

export type ChallengeFormData = {
  name: string;
  challengeConfig: {
    exerciseId: string;
    sets: number;
    targetReps: number;
    warmUpSeconds: number;
    breakSeconds: number;
    sessionIncreasePercent: number;
    duration?: number;
  };
};

export type ChallengeFormProps = {
  mode: "create" | "edit";
  initialData?: Partial<ChallengeFormData>;
  onSave: (data: ChallengeFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
  exercises: { id: string; name: string; source: "builtin" | "user" }[];
};

export function ChallengeForm({
  mode,
  initialData,
  onSave,
  onCancel,
  saving = false,
  exercises
}: ChallengeFormProps) {
  const [formData, setFormData] = useState<ChallengeFormData>({
    name: initialData?.name || "",
    challengeConfig: {
      exerciseId: initialData?.challengeConfig?.exerciseId || exercises[0]?.id || "",
      sets: initialData?.challengeConfig?.sets || 5,
      targetReps: initialData?.challengeConfig?.targetReps || 100,
      warmUpSeconds: initialData?.challengeConfig?.warmUpSeconds || 180,
      breakSeconds: initialData?.challengeConfig?.breakSeconds || 90,
      sessionIncreasePercent: initialData?.challengeConfig?.sessionIncreasePercent || 10,
      duration: initialData?.challengeConfig?.duration || 30
    }
  });

  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);

  const updateName = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, name: value }));
  }, []);

  const updateConfig = useCallback(
    <K extends keyof ChallengeFormData["challengeConfig"]>(
      field: K,
      value: ChallengeFormData["challengeConfig"][K]
    ) => {
      setFormData((prev) => ({
        ...prev,
        challengeConfig: { ...prev.challengeConfig, [field]: value }
      }));
    },
    []
  );

  const selectedExercise = exercises.find(
    (ex) => ex.id === formData.challengeConfig.exerciseId
  );

  const handleSave = useCallback(async () => {
    const trimmed = formData.name.trim();

    const challengeData = {
      name: trimmed,
      challengeConfig: formData.challengeConfig
    };

    const validationResult = validateChallenge(challengeData as any);

    if (!validationResult.isValid) {
      haptics.formValidationError();
      const firstError = validationResult.errors[0];
      Alert.alert("Validation Error", firstError.message);
      return;
    }

    if (exercises.length === 0) {
      haptics.formValidationError();
      Alert.alert(
        "Add an exercise first",
        "Create at least one exercise before creating a challenge."
      );
      return;
    }

    const exerciseExists = exercises.some(
      (ex) => ex.id === formData.challengeConfig.exerciseId
    );
    if (!exerciseExists) {
      haptics.formValidationError();
      Alert.alert(
        "Invalid exercise",
        "Please select an exercise for this challenge."
      );
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
  }, [formData, exercises, onSave]);

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
          {mode === "create" ? "New Challenge" : "Edit Challenge"}
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
            <Text style={styles.label}>Challenge Name</Text>
            <TextInput
              value={formData.name}
              onChangeText={updateName}
              placeholder="e.g. 100 Push-ups Challenge"
              placeholderTextColor={theme.colors.muted}
              style={styles.input}
              autoFocus={mode === "create"}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Exercise</Text>
            <Pressable
              onPress={() => {
                haptics.buttonTap();
                setExercisePickerOpen(true);
              }}
              style={({ pressed }) => [
                styles.picker,
                pressed && styles.pickerPressed
              ]}
            >
              <Text
                style={[
                  styles.pickerText,
                  !selectedExercise && styles.pickerPlaceholder
                ]}
              >
                {selectedExercise?.name || "Select exercise"}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.muted}
              />
            </Pressable>
          </View>
        </View>

        {/* Configuration Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Configuration</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldRowLabel}>Target Reps</Text>
            <TextInput
              value={String(formData.challengeConfig.targetReps)}
              onChangeText={(value) => {
                const num = Number(value);
                if (Number.isFinite(num) && num >= 0) {
                  updateConfig("targetReps", num);
                }
              }}
              keyboardType="number-pad"
              style={styles.fieldRowInput}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldRowLabel}>Sets per Session</Text>
            <TextInput
              value={String(formData.challengeConfig.sets)}
              onChangeText={(value) => {
                const num = Number(value);
                if (Number.isFinite(num) && num >= 0) {
                  updateConfig("sets", num);
                }
              }}
              keyboardType="number-pad"
              style={styles.fieldRowInput}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldRowLabel}>Warm-up (seconds)</Text>
            <TextInput
              value={String(formData.challengeConfig.warmUpSeconds)}
              onChangeText={(value) => {
                const num = Number(value);
                if (Number.isFinite(num) && num >= 0) {
                  updateConfig("warmUpSeconds", num);
                }
              }}
              keyboardType="number-pad"
              style={styles.fieldRowInput}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldRowLabel}>Break (seconds)</Text>
            <TextInput
              value={String(formData.challengeConfig.breakSeconds)}
              onChangeText={(value) => {
                const num = Number(value);
                if (Number.isFinite(num) && num >= 0) {
                  updateConfig("breakSeconds", num);
                }
              }}
              keyboardType="number-pad"
              style={styles.fieldRowInput}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldRowLabel}>Daily Increase (%)</Text>
            <TextInput
              value={String(formData.challengeConfig.sessionIncreasePercent)}
              onChangeText={(value) => {
                const num = Number(value);
                if (Number.isFinite(num) && num >= 0 && num <= 100) {
                  updateConfig("sessionIncreasePercent", num);
                }
              }}
              keyboardType="number-pad"
              style={styles.fieldRowInput}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldRowLabel}>Duration (days)</Text>
            <TextInput
              value={
                formData.challengeConfig.duration
                  ? String(formData.challengeConfig.duration)
                  : ""
              }
              onChangeText={(value) => {
                const num = Number(value);
                updateConfig(
                  "duration",
                  Number.isFinite(num) && num > 0 ? num : undefined
                );
              }}
              keyboardType="number-pad"
              style={styles.fieldRowInput}
              placeholder="30"
              placeholderTextColor={theme.colors.muted}
            />
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
              style={styles.exerciseList}
              showsVerticalScrollIndicator={false}
            >
              {exercises.map((exercise) => (
                <Pressable
                  key={exercise.id}
                  onPress={() => {
                    haptics.buttonTap();
                    updateConfig("exerciseId", exercise.id);
                    setExercisePickerOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.exerciseItem,
                    formData.challengeConfig.exerciseId === exercise.id &&
                      styles.exerciseItemSelected,
                    pressed && styles.exerciseItemPressed
                  ]}
                >
                  <Text
                    style={[
                      styles.exerciseItemText,
                      formData.challengeConfig.exerciseId === exercise.id &&
                        styles.exerciseItemTextSelected
                    ]}
                  >
                    {exercise.name}
                  </Text>
                  {formData.challengeConfig.exerciseId === exercise.id && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={theme.colors.primary}
                    />
                  )}
                </Pressable>
              ))}
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
  cardTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: -theme.spacing.sm
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
  picker: {
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
  pickerPressed: {
    backgroundColor: theme.colors.background
  },
  pickerText: {
    ...theme.typography.body,
    color: theme.colors.text
  },
  pickerPlaceholder: {
    color: theme.colors.muted
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md
  },
  fieldRowLabel: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    flex: 1
  },
  fieldRowInput: {
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
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    padding: theme.spacing.xl
  }
});
