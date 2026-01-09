import {
  ProgramForm,
  type ProgramFormData
} from "@/components/data/forms/ProgramForm";
import { useDataActions } from "@/context/DataContext";
import { useExercises } from "@/hooks/data";
import { theme } from "@/theme/theme";
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
        blocks: formData.blocks,
        initialWarmup: formData.initialWarmup,
        defaultRestBetweenExercises: formData.defaultRestBetweenExercises
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
    flex: 1,
    backgroundColor: theme.colors.background
  }
});
