import {
    ChallengeForm,
    type ChallengeFormData
} from "@/components/data/forms/ChallengeForm";
import { useDataActions, useDataContext } from "@/context/DataContext";
import { useExercises } from "@/hooks/data";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditChallengeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const actions = useDataActions();
  const { state } = useDataContext();
  const { data: exercises } = useExercises();
  const [saving, setSaving] = useState(false);

  const challenge = useMemo(() => {
    return state.programs.find((p) => p.id === id && p.challengeConfig);
  }, [state.programs, id]);

  const initialData: ChallengeFormData | undefined = useMemo(() => {
    if (!challenge?.challengeConfig) return undefined;
    
    return {
      name: challenge.name,
      description: challenge.description || "",
      challengeConfig: {
        exerciseId: challenge.challengeConfig.exerciseId,
        sets: challenge.challengeConfig.sets,
        targetReps: challenge.challengeConfig.targetReps,
        sessionIncreasePercent: challenge.challengeConfig.sessionIncreasePercent || 10,
        warmUpSeconds: challenge.challengeConfig.warmUpSeconds,
        breakSeconds: challenge.challengeConfig.breakSeconds
      }
    };
  }, [challenge]);

  async function handleSave(formData: ChallengeFormData) {
    if (!challenge) return;
    
    setSaving(true);
    try {
      await actions.upsertProgram({
        ...challenge,
        name: formData.name,
        description: formData.description,
        challengeConfig: formData.challengeConfig
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

  if (!challenge || !initialData) {
    return null; // Or show error state
  }

  return (
    <SafeAreaView style={styles.container}>
      <ChallengeForm
        mode="edit"
        initialData={initialData}
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