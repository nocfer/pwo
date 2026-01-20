import { ErrorScreen } from "@/components/common";
import {
  ChallengeForm,
  type ChallengeFormData
} from "@/components/data/forms/ChallengeForm";
import { useDataActions } from "@/context/DataContext";
import { useExercises, usePrograms } from "@/hooks/data";
import { theme } from "@/theme/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditChallengeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const actions = useDataActions();
  const { data: programs } = usePrograms();
  const { data: exercises } = useExercises();
  const [saving, setSaving] = useState(false);

  const challenge = useMemo(
    () => programs?.find((p) => p.id === id && p.challengeConfig) ?? null,
    [programs, id]
  );

  async function handleSave(formData: ChallengeFormData) {
    if (!challenge) return;

    setSaving(true);
    try {
      await actions.upsertProgram({
        ...challenge,
        name: formData.name,
        challengeConfig: formData.challengeConfig
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  if (!challenge?.challengeConfig) {
    return <ErrorScreen message="Challenge not found." />;
  }

  const initialData: ChallengeFormData = {
    name: challenge.name,
    challengeConfig: {
      exerciseId: challenge.challengeConfig.exerciseId,
      sets: challenge.challengeConfig.sets,
      targetReps: challenge.challengeConfig.targetReps,
      initialReps: challenge.challengeConfig.initialReps ?? 20,
      weeklyIncreasePercent:
        challenge.challengeConfig.weeklyIncreasePercent ?? 10,
      warmUpSeconds: challenge.challengeConfig.warmUpSeconds,
      breakSeconds: challenge.challengeConfig.breakSeconds
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ChallengeForm
        mode="edit"
        initialData={initialData}
        onSave={handleSave}
        onCancel={router.back}
        saving={saving}
        exercises={exercises ?? []}
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
