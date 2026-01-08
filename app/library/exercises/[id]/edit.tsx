import {
    ExerciseForm,
    type ExerciseFormData
} from "@/components/data/forms/ExerciseForm";
import { useDataActions } from "@/context/DataContext";
import { useExercises } from "@/hooks/data";
import { theme } from "@/theme/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function EditExerciseScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { data } = useExercises();
  const actions = useDataActions();
  const [saving, setSaving] = useState(false);

  const exercise = useMemo(
    () => data?.find((e) => e.id === id) ?? null,
    [data, id]
  );

  async function handleSave(formData: ExerciseFormData) {
    setSaving(true);
    try {
      await actions.upsertExercise({
        id,
        name: formData.name,
        category: formData.category,
        icon: formData.icon
      });
      router.back();
    } catch (e) {
      throw e;
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.back();
  }

  if (!exercise) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>Exercise not found.</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.backBtnPressed
            ]}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (exercise.source === "builtin") {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>
            Built-in exercises cannot be edited.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.backBtnPressed
            ]}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const initialData: Partial<ExerciseFormData> = {
    name: exercise.name,
    category: exercise.category,
    icon: exercise.icon
  };

  return (
    <View style={styles.container}>
      <ExerciseForm
        mode="edit"
        initialData={initialData}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  errorCard: {
    margin: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: "center",
    gap: theme.spacing.lg,
    ...theme.shadows.sm
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center"
  },
  backBtn: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  backBtnPressed: {
    backgroundColor: theme.colors.border
  },
  backBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  }
});
