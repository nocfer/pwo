/**
 * Challenge Configuration Interface
 * Integrates ChallengeForm with data context and provides session preview
 */

import { useDataActions, useDataContext } from "@/context/DataContext";
import { useExercises } from "@/hooks/data";
import { theme } from "@/theme/theme";
import type { Program } from "@/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { ChallengeForm, type ChallengeFormData } from "./ChallengeForm";

// Challenge templates for common challenge types
const CHALLENGE_TEMPLATES: {
  id: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  challengeConfig: ChallengeFormData["challengeConfig"];
  tags: string[];
}[] = [
  {
    id: "pushup-100",
    name: "100 Push-ups Challenge",
    description: "Build up to 100 consecutive push-ups over 6-8 weeks",
    difficulty: "intermediate",
    tags: ["bodyweight", "upper-body", "endurance"],
    challengeConfig: {
      exerciseId: "", // Will be set based on available exercises
      sets: 5,
      targetReps: 100,
      warmUpSeconds: 300,
      breakSeconds: 90,
      sessionIncreasePercent: 8,
      duration: 42, // 6 weeks
      progressionType: "percentage"
    }
  },
  {
    id: "squat-200",
    name: "200 Squats Challenge",
    description: "Progressive squat challenge to reach 200 consecutive squats",
    difficulty: "intermediate",
    tags: ["bodyweight", "lower-body", "endurance"],
    challengeConfig: {
      exerciseId: "",
      sets: 4,
      targetReps: 200,
      warmUpSeconds: 360,
      breakSeconds: 120,
      sessionIncreasePercent: 10,
      duration: 35, // 5 weeks
      progressionType: "percentage"
    }
  },
  {
    id: "plank-5min",
    name: "5-Minute Plank Challenge",
    description: "Build core strength to hold a plank for 5 minutes",
    difficulty: "advanced",
    tags: ["core", "isometric", "endurance"],
    challengeConfig: {
      exerciseId: "",
      sets: 3,
      targetReps: 1, // 1 rep = 1 hold
      warmUpSeconds: 240,
      breakSeconds: 180,
      sessionIncreasePercent: 15,
      duration: 28, // 4 weeks
      progressionType: "linear"
    }
  },
  {
    id: "burpee-50",
    name: "50 Burpees Challenge",
    description:
      "High-intensity challenge to complete 50 burpees in one session",
    difficulty: "advanced",
    tags: ["full-body", "cardio", "hiit"],
    challengeConfig: {
      exerciseId: "",
      sets: 5,
      targetReps: 50,
      warmUpSeconds: 420,
      breakSeconds: 60,
      sessionIncreasePercent: 12,
      duration: 21, // 3 weeks
      progressionType: "percentage"
    }
  }
];

export type ChallengeEditorProps = {
  mode: "create" | "edit";
  challengeId?: string;
  onSave?: (challenge: Program) => void;
  onCancel?: () => void;
};

export function ChallengeEditor({
  mode,
  challengeId,
  onSave,
  onCancel
}: ChallengeEditorProps) {
  const actions = useDataActions();
  const { state } = useDataContext();
  const { data: exercises } = useExercises();

  const [saving, setSaving] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [initialData, setInitialData] = useState<
    Partial<ChallengeFormData> | undefined
  >();

  // Find existing challenge for edit mode
  const existingChallenge = useMemo(() => {
    if (mode === "edit" && challengeId) {
      const challenge = state.programs.find(
        (p: Program) => p.id === challengeId && p.challengeConfig
      );
      if (challenge?.challengeConfig) {
        return {
          name: challenge.name,
          description: challenge.description || "",
          difficulty: "intermediate" as const, // Default since not stored in Program type
          tags: [], // Default since not stored in Program type
          challengeConfig: {
            exerciseId: challenge.challengeConfig.exerciseId,
            sets: challenge.challengeConfig.sets,
            targetReps: challenge.challengeConfig.targetReps,
            warmUpSeconds: challenge.challengeConfig.warmUpSeconds,
            breakSeconds: challenge.challengeConfig.breakSeconds,
            sessionIncreasePercent:
              challenge.challengeConfig.sessionIncreasePercent || 10
          }
        };
      }
    }
    return undefined;
  }, [mode, challengeId, state.programs]);

  const exerciseOptions = useMemo(() => {
    return (exercises || []).map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      source: exercise.source
    }));
  }, [exercises]);

  const handleSave = useCallback(
    async (formData: ChallengeFormData) => {
      setSaving(true);
      try {
        const challengeData = {
          id: challengeId || "",
          name: formData.name,
          description: formData.description,
          blocks: [], // Challenges generate blocks dynamically
          challengeConfig: {
            exerciseId: formData.challengeConfig.exerciseId,
            sets: formData.challengeConfig.sets,
            targetReps: formData.challengeConfig.targetReps,
            warmUpSeconds: formData.challengeConfig.warmUpSeconds,
            breakSeconds: formData.challengeConfig.breakSeconds,
            sessionIncreasePercent:
              formData.challengeConfig.sessionIncreasePercent
          }
        };

        const savedChallenge = await actions.upsertProgram(challengeData);

        if (onSave) {
          onSave(savedChallenge);
        }
      } catch (error) {
        throw error; // Let ChallengeForm handle the error display
      } finally {
        setSaving(false);
      }
    },
    [actions, challengeId, onSave]
  );

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const applyTemplate = useCallback(
    (template: (typeof CHALLENGE_TEMPLATES)[0]) => {
      // Try to find matching exercise for the template
      let exerciseId = "";

      // Simple matching based on template name and available exercises
      if (template.id.includes("pushup") || template.id.includes("push")) {
        const pushupExercise = exerciseOptions.find(
          (ex) =>
            ex.name.toLowerCase().includes("push") ||
            ex.name.toLowerCase().includes("press")
        );
        exerciseId = pushupExercise?.id || exerciseOptions[0]?.id || "";
      } else if (template.id.includes("squat")) {
        const squatExercise = exerciseOptions.find((ex) =>
          ex.name.toLowerCase().includes("squat")
        );
        exerciseId = squatExercise?.id || exerciseOptions[0]?.id || "";
      } else if (template.id.includes("plank")) {
        const plankExercise = exerciseOptions.find((ex) =>
          ex.name.toLowerCase().includes("plank")
        );
        exerciseId = plankExercise?.id || exerciseOptions[0]?.id || "";
      } else if (template.id.includes("burpee")) {
        const burpeeExercise = exerciseOptions.find((ex) =>
          ex.name.toLowerCase().includes("burpee")
        );
        exerciseId = burpeeExercise?.id || exerciseOptions[0]?.id || "";
      } else {
        exerciseId = exerciseOptions[0]?.id || "";
      }

      const templateData: Partial<ChallengeFormData> = {
        name: template.name,
        description: template.description,
        difficulty: template.difficulty,
        tags: [...template.tags],
        challengeConfig: {
          ...template.challengeConfig,
          exerciseId
        }
      };

      setInitialData(templateData);
      setTemplatePickerOpen(false);
    },
    [exerciseOptions]
  );

  const showTemplateButton = mode === "create" && !initialData;

  return (
    <View style={styles.container}>
      {/* Template Selection Button */}
      {showTemplateButton && (
        <View style={styles.templateSection}>
          <Pressable
            onPress={() => setTemplatePickerOpen(true)}
            style={({ pressed }) => [
              styles.templateButton,
              pressed && styles.templateButtonPressed
            ]}
          >
            <Ionicons
              name="trophy-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.templateButtonText}>
              Start from Challenge Template
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.muted}
            />
          </Pressable>
        </View>
      )}

      {/* Challenge Form */}
      <ChallengeForm
        mode={mode}
        initialData={initialData || existingChallenge}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
        exercises={exerciseOptions}
      />

      {/* Template Picker Modal */}
      <Modal
        visible={templatePickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTemplatePickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Challenge Template</Text>
              <Pressable
                onPress={() => setTemplatePickerOpen(false)}
                style={({ pressed }) => [
                  styles.iconBtn,
                  pressed && styles.iconBtnPressed
                ]}
              >
                <Ionicons name="close" size={18} color={theme.colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.templateList}>
              {CHALLENGE_TEMPLATES.map((template) => (
                <Pressable
                  key={template.id}
                  onPress={() => applyTemplate(template)}
                  style={({ pressed }) => [
                    styles.templateItem,
                    pressed && styles.templateItemPressed
                  ]}
                >
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateDescription}>
                      {template.description}
                    </Text>
                    <View style={styles.templateMeta}>
                      <View
                        style={[
                          styles.difficultyBadge,
                          styles[`difficulty${template.difficulty}`]
                        ]}
                      >
                        <Text
                          style={[
                            styles.difficultyText,
                            styles[`difficultyText${template.difficulty}`]
                          ]}
                        >
                          {template.difficulty}
                        </Text>
                      </View>
                      <Text style={styles.durationText}>
                        {template.challengeConfig.duration} days
                      </Text>
                      <Text style={styles.targetText}>
                        {template.challengeConfig.targetReps} reps
                      </Text>
                    </View>
                    <View style={styles.templateTags}>
                      {template.tags.map((tag, index) => (
                        <View key={index} style={styles.templateTag}>
                          <Text style={styles.templateTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.muted}
                  />
                </Pressable>
              ))}

              {/* Custom/Blank Challenge */}
              <Pressable
                onPress={() => {
                  setInitialData({
                    name: "",
                    description: "",
                    difficulty: "beginner",
                    tags: [],
                    challengeConfig: {
                      exerciseId: exerciseOptions[0]?.id || "",
                      sets: 5,
                      targetReps: 100,
                      warmUpSeconds: 180,
                      breakSeconds: 90,
                      sessionIncreasePercent: 10,
                      duration: 30,
                      progressionType: "percentage"
                    }
                  });
                  setTemplatePickerOpen(false);
                }}
                style={({ pressed }) => [
                  styles.templateItem,
                  styles.blankTemplate,
                  pressed && styles.templateItemPressed
                ]}
              >
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>Custom Challenge</Text>
                  <Text style={styles.templateDescription}>
                    Create your own challenge from scratch
                  </Text>
                </View>
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  templateSection: {
    padding: theme.spacing.lg,
    paddingBottom: 0
  },
  templateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm
  },
  templateButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }]
  },
  templateButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
    flex: 1,
    marginLeft: theme.spacing.sm
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end"
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: "80%"
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface
  },
  iconBtnPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }]
  },
  templateList: {
    maxHeight: 500
  },
  templateItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md
  },
  templateItemPressed: {
    backgroundColor: theme.colors.card
  },
  blankTemplate: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.md
  },
  templateInfo: {
    flex: 1
  },
  templateName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  templateDescription: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    marginBottom: theme.spacing.sm
  },
  templateMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm
  },
  difficultyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md
  },
  difficultybeginner: {
    backgroundColor: "#E8F5E8"
  },
  difficultyintermediate: {
    backgroundColor: "#FFF3E0"
  },
  difficultyadvanced: {
    backgroundColor: "#FFEBEE"
  },
  difficultyText: {
    ...theme.typography.caption,
    textTransform: "capitalize"
  },
  difficultyTextbeginner: {
    color: "#2E7D32"
  },
  difficultyTextintermediate: {
    color: "#F57C00"
  },
  difficultyTextadvanced: {
    color: "#C62828"
  },
  durationText: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  targetText: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  templateTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs
  },
  templateTag: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2
  },
  templateTagText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontSize: 10
  }
});
