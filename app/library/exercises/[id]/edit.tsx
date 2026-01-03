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
import { SafeAreaView } from "react-native-safe-area-context";

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
      throw e; // Let the form handle the error display
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.back();
  }

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.card, { margin: theme.spacing.lg }]}>
          <Text style={styles.muted}>Exercise not found.</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.secondaryBtnPressed
            ]}
          >
            <Text style={styles.secondaryBtnText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Check if this is a built-in exercise that can't be edited
  if (exercise.source === "builtin") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.card, { margin: theme.spacing.lg }]}>
          <Text style={styles.muted}>Built-in exercises cannot be edited.</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.secondaryBtnPressed
            ]}
          >
            <Text style={styles.secondaryBtnText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const initialData: Partial<ExerciseFormData> = {
    name: exercise.name,
    category: exercise.category,
    icon: exercise.icon
  };

  return (
    <SafeAreaView style={styles.container}>
      <ExerciseForm
        mode="edit"
        initialData={initialData}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
    gap: theme.spacing.xs
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center"
  },
  secondaryBtn: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  secondaryBtnPressed: {
    backgroundColor: theme.colors.card
  },
  secondaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  }
});
