/**
 * Program Editor Component
 * Integrates ProgramForm with data context
 */

import { useDataActions, useDataContext } from "@/context/DataContext";
import { useExercises } from "@/hooks/data";
import type { Program } from "@/types";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ProgramForm, type ProgramFormData } from "./ProgramForm";

export type ProgramEditorProps = {
  mode: "create" | "edit";
  programId?: string;
  onSave?: (program: Program) => void;
  onCancel?: () => void;
};

export function ProgramEditor({
  mode,
  programId,
  onSave,
  onCancel
}: ProgramEditorProps) {
  const actions = useDataActions();
  const { state } = useDataContext();
  const { data: exercises } = useExercises();
  const [saving, setSaving] = useState(false);

  const existingProgram = useMemo(() => {
    if (mode === "edit" && programId) {
      const program = state.programs.find(
        (p: Program) => p.id === programId && !p.challengeConfig
      );
      if (program) {
        return {
          name: program.name,
          blocks: program.blocks
        };
      }
    }
    return undefined;
  }, [mode, programId, state.programs]);

  const exerciseOptions = useMemo(() => {
    return (exercises || []).map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      source: exercise.source
    }));
  }, [exercises]);

  const handleSave = useCallback(
    async (formData: ProgramFormData) => {
      setSaving(true);
      try {
        const programData = {
          id: programId || "",
          name: formData.name,
          blocks: formData.blocks || [],
          challengeConfig: undefined
        };

        const savedProgram = await actions.upsertProgram(programData);

        if (onSave) {
          onSave(savedProgram);
        }
      } catch (error) {
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [actions, programId, onSave]
  );

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  return (
    <View style={styles.container}>
      <ProgramForm
        mode={mode}
        initialData={existingProgram}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
        exercises={exerciseOptions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
