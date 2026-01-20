import { ErrorScreen } from "@/components/common";
import {
  ExerciseForm,
  type ExerciseFormData
} from "@/components/data/forms/ExerciseForm";
import { useDataActions } from "@/context/DataContext";
import { useExercises } from "@/hooks/data";
import { theme } from "@/theme/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
    } finally {
      setSaving(false);
    }
  }

  if (!exercise) {
    return <ErrorScreen message="Exercise not found." />;
  }

  if (exercise.source === "builtin") {
    return <ErrorScreen message="Built-in exercises cannot be edited." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExerciseForm
        mode="edit"
        initialData={{
          name: exercise.name,
          category: exercise.category,
          icon: exercise.icon
        }}
        onSave={handleSave}
        onCancel={router.back}
        saving={saving}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  }
});
