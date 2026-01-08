import {
    ExerciseForm,
    type ExerciseFormData
} from "@/components/data/forms/ExerciseForm";
import { useDataActions } from "@/context/DataContext";
import { theme } from "@/theme/theme";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function NewExerciseScreen() {
  const actions = useDataActions();
  const [saving, setSaving] = useState(false);

  async function handleSave(formData: ExerciseFormData) {
    setSaving(true);
    try {
      await actions.upsertExercise({
        id: "",
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

  return (
    <View style={styles.container}>
      <ExerciseForm
        mode="create"
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
  }
});
