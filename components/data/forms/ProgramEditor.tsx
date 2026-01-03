/**
 * Advanced Program Editor Component
 * Integrates ProgramForm with data context and provides template support
 */

import { useDataActions } from "@/context/DataContext";
import { useExercises } from "@/hooks/data";
import { theme } from "@/theme/theme";
import type { Program, ProgramSession } from "@/types";
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
import { ProgramForm, type ProgramFormData } from "./ProgramForm";

// Program templates for common workout types
const PROGRAM_TEMPLATES: Array<{
  id: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  sessions: ProgramSession[];
  tags: string[];
}> = [
  {
    id: "upper-body-strength",
    name: "Upper Body Strength",
    description: "Focus on building upper body strength with compound movements",
    difficulty: "intermediate",
    tags: ["strength", "upper-body", "compound"],
    sessions: [
      {
        index: 1,
        name: "Push Day",
        blocks: [
          { type: "warmup", seconds: 300 },
          { type: "exercise", exerciseId: "", targetReps: 8, note: "Bench Press or Push-ups" },
          { type: "rest", seconds: 120, label: "Rest between exercises" },
          { type: "exercise", exerciseId: "", targetReps: 10, note: "Overhead Press" },
          { type: "rest", seconds: 90, label: "Rest" },
          { type: "exercise", exerciseId: "", targetReps: 12, note: "Tricep Dips" }
        ]
      },
      {
        index: 2,
        name: "Pull Day",
        blocks: [
          { type: "warmup", seconds: 300 },
          { type: "exercise", exerciseId: "", targetReps: 8, note: "Pull-ups or Rows" },
          { type: "rest", seconds: 120, label: "Rest between exercises" },
          { type: "exercise", exerciseId: "", targetReps: 10, note: "Lat Pulldowns" },
          { type: "rest", seconds: 90, label: "Rest" },
          { type: "exercise", exerciseId: "", targetReps: 12, note: "Bicep Curls" }
        ]
      }
    ]
  },
  {
    id: "full-body-beginner",
    name: "Full Body Beginner",
    description: "Complete full-body workout suitable for beginners",
    difficulty: "beginner",
    tags: ["full-body", "beginner", "compound"],
    sessions: [
      {
        index: 1,
        name: "Full Body Workout",
        blocks: [
          { type: "warmup", seconds: 600 },
          { type: "exercise", exerciseId: "", targetReps: 10, note: "Squats or modified squats" },
          { type: "rest", seconds: 90, label: "Rest" },
          { type: "exercise", exerciseId: "", targetReps: 8, note: "Push-ups or wall push-ups" },
          { type: "rest", seconds: 90, label: "Rest" },
          { type: "exercise", exerciseId: "", targetReps: 30, durationSeconds: 30, note: "Plank hold" },
          { type: "rest", seconds: 60, label: "Cool down" }
        ]
      }
    ]
  },
  {
    id: "hiit-cardio",
    name: "HIIT Cardio",
    description: "High-intensity interval training for cardiovascular fitness",
    difficulty: "intermediate",
    tags: ["cardio", "hiit", "conditioning"],
    sessions: [
      {
        index: 1,
        name: "HIIT Session",
        blocks: [
          { type: "warmup", seconds: 300 },
          { type: "exercise", exerciseId: "", durationSeconds: 30, note: "High knees" },
          { type: "rest", seconds: 30, label: "Active rest" },
          { type: "exercise", exerciseId: "", durationSeconds: 30, note: "Burpees" },
          { type: "rest", seconds: 30, label: "Active rest" },
          { type: "exercise", exerciseId: "", durationSeconds: 30, note: "Mountain climbers" },
          { type: "rest", seconds: 30, label: "Active rest" },
          { type: "exercise", exerciseId: "", durationSeconds: 30, note: "Jump squats" },
          { type: "rest", seconds: 180, label: "Cool down" }
        ]
      }
    ]
  }
];

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
  const { data: exercises } = useExercises();
  
  const [saving, setSaving] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [initialData, setInitialData] = useState<Partial<ProgramFormData> | undefined>();

  // Find existing program for edit mode
  const existingProgram = useMemo(() => {
    if (mode === "edit" && programId) {
      // In a real implementation, you'd get this from the data context
      // For now, we'll return undefined and let the form handle it
      return undefined;
    }
    return undefined;
  }, [mode, programId]);

  const exerciseOptions = useMemo(() => {
    return (exercises || []).map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      source: exercise.source
    }));
  }, [exercises]);

  const handleSave = useCallback(async (formData: ProgramFormData) => {
    setSaving(true);
    try {
      const programData = {
        id: programId || "",
        name: formData.name,
        description: formData.description,
        sessions: formData.sessions,
        challengeConfig: undefined // Regular program, not a challenge
      };

      const savedProgram = await actions.upsertProgram(programData);
      
      if (onSave) {
        onSave(savedProgram);
      }
    } catch (error) {
      throw error; // Let ProgramForm handle the error display
    } finally {
      setSaving(false);
    }
  }, [actions, programId, onSave]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const applyTemplate = useCallback((template: typeof PROGRAM_TEMPLATES[0]) => {
    const templateData: Partial<ProgramFormData> = {
      name: template.name,
      description: template.description,
      difficulty: template.difficulty,
      tags: [...template.tags],
      sessions: template.sessions.map(session => ({
        ...session,
        blocks: session.blocks.map(block => {
          // For exercise blocks, we'll need to map to actual exercise IDs
          if (block.type === "exercise" && exerciseOptions.length > 0) {
            // Try to find a matching exercise by name in the note, otherwise use first available
            const matchingExercise = exerciseOptions.find(ex => 
              block.note?.toLowerCase().includes(ex.name.toLowerCase())
            );
            return {
              ...block,
              exerciseId: matchingExercise?.id || exerciseOptions[0].id
            };
          }
          return block;
        })
      }))
    };

    setInitialData(templateData);
    setTemplatePickerOpen(false);
  }, [exerciseOptions]);

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
            <Ionicons name="library-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.templateButtonText}>Start from Template</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
          </Pressable>
        </View>
      )}

      {/* Program Form */}
      <ProgramForm
        mode={mode}
        initialData={initialData || existingProgram}
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
              <Text style={styles.modalTitle}>Choose Template</Text>
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
              {PROGRAM_TEMPLATES.map((template) => (
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
                    <Text style={styles.templateDescription}>{template.description}</Text>
                    <View style={styles.templateMeta}>
                      <View style={[styles.difficultyBadge, styles[`difficulty${template.difficulty}`]]}>
                        <Text style={[styles.difficultyText, styles[`difficultyText${template.difficulty}`]]}>
                          {template.difficulty}
                        </Text>
                      </View>
                      <Text style={styles.sessionCount}>
                        {template.sessions.length} session{template.sessions.length !== 1 ? 's' : ''}
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
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
                </Pressable>
              ))}
              
              {/* Custom/Blank Template */}
              <Pressable
                onPress={() => {
                  setInitialData({
                    name: "",
                    description: "",
                    difficulty: "beginner",
                    tags: [],
                    sessions: [
                      {
                        index: 1,
                        name: "Session 1",
                        blocks: [{ type: "warmup", seconds: 180 }]
                      }
                    ]
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
                  <Text style={styles.templateName}>Blank Program</Text>
                  <Text style={styles.templateDescription}>Start with an empty program</Text>
                </View>
                <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
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
  sessionCount: {
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