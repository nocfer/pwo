import {
  ProgramForm,
  type ProgramFormData
} from "@/components/data/forms/ProgramForm";
import { useDataActions } from "@/context/DataContext";
import { useExercises } from "@/hooks/data";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewProgramScreen() {
  const actions = useDataActions();
  const { data: exercises } = useExercises();
  const [saving, setSaving] = useState(false);

  async function handleSave(formData: ProgramFormData) {
    setSaving(true);
    try {
      await actions.upsertProgram({
        id: "",
        name: formData.name,
        blocks: [{ type: "warmup", seconds: 180 }] // Start with a warmup
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

  return (
    <SafeAreaView style={styles.container}>
      <ProgramForm
        mode="create"
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
        exercises={exercises || []}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
