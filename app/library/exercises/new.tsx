import {
  ExerciseForm,
  type ExerciseFormData
} from "@/components/data/forms/ExerciseForm";
import { useDataActions } from "@/context/DataContext";
import { theme } from "@/theme/theme";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExerciseForm
        mode="create"
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
