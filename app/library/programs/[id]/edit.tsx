import {
  ProgramForm,
  type ProgramFormData
} from "@/components/data/forms/ProgramForm";
import { useDataActions } from "@/context/DataContext";
import { useExercises, usePrograms } from "@/hooks/data";
import { theme } from "@/theme/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function EditProgramScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { data: programs } = usePrograms();
  const { data: exercises } = useExercises();
  const actions = useDataActions();
  const [saving, setSaving] = useState(false);

  const program = useMemo(
    () => programs?.find((p) => p.id === id && !p.challengeConfig) ?? null,
    [programs, id]
  );

  async function handleSave(formData: ProgramFormData) {
    if (!program) return;

    setSaving(true);
    try {
      await actions.upsertProgram({
        id: program.id,
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

  if (!program) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>Program not found.</Text>
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

  if (program.source === "builtin") {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>
            Built-in programs cannot be edited.
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

  const initialData: Partial<ProgramFormData> = {
    name: program.name,
    blocks: program.blocks,
    initialWarmup: program.initialWarmup,
    defaultRestBetweenExercises: program.defaultRestBetweenExercises
  };

  return (
    <View style={styles.container}>
      <ProgramForm
        mode="edit"
        initialData={initialData}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
        exercises={exercises || []}
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
