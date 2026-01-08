import {
  ChallengeForm,
  type ChallengeFormData
} from "@/components/data/forms/ChallengeForm";
import { useDataActions, useDataContext } from "@/context/DataContext";
import { useExercises } from "@/hooks/data";
import { theme } from "@/theme/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
      challengeConfig: {
        exerciseId: challenge.challengeConfig.exerciseId,
        sets: challenge.challengeConfig.sets,
        targetReps: challenge.challengeConfig.targetReps,
        sessionIncreasePercent:
          challenge.challengeConfig.sessionIncreasePercent || 10,
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
        challengeConfig: formData.challengeConfig
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

  if (!challenge || !initialData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>Challenge not found.</Text>
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

  return (
    <View style={styles.container}>
      <ChallengeForm
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
