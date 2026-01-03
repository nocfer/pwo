/**
 * Enhanced Challenge Form Component
 * Supports challenge configuration with progression settings,
 * session preview, and parameter validation
 */

import { generateChallengeSessions } from "@/hooks/data/useChallengeSessions";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

export type ChallengeFormData = {
  name: string;
  description?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  tags?: string[];
  challengeConfig: {
    exerciseId: string;
    sets: number;
    targetReps: number;
    warmUpSeconds: number;
    breakSeconds: number;
    sessionIncreasePercent: number;
    duration?: number; // days
    progressionType?: "linear" | "percentage";
  };
};

export type ChallengeFormProps = {
  mode: "create" | "edit";
  initialData?: Partial<ChallengeFormData>;
  onSave: (data: ChallengeFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
  exercises: { id: string; name: string; source: "builtin" | "user" }[];
};

export function ChallengeForm({
  mode,
  initialData,
  onSave,
  onCancel,
  saving = false,
  exercises
}: ChallengeFormProps) {
  const [formData, setFormData] = useState<ChallengeFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    difficulty: initialData?.difficulty || "beginner",
    tags: initialData?.tags || [],
    challengeConfig: {
      exerciseId: initialData?.challengeConfig?.exerciseId || "",
      sets: initialData?.challengeConfig?.sets || 5,
      targetReps: initialData?.challengeConfig?.targetReps || 100,
      warmUpSeconds: initialData?.challengeConfig?.warmUpSeconds || 180,
      breakSeconds: initialData?.challengeConfig?.breakSeconds || 90,
      sessionIncreasePercent:
        initialData?.challengeConfig?.sessionIncreasePercent || 10,
      duration: initialData?.challengeConfig?.duration || 30,
      progressionType:
        initialData?.challengeConfig?.progressionType || "percentage"
    }
  });

  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newTag, setNewTag] = useState("");

  const updateField = useCallback(
    <K extends keyof ChallengeFormData>(
      field: K,
      value: ChallengeFormData[K]
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateChallengeConfig = useCallback(
    <K extends keyof ChallengeFormData["challengeConfig"]>(
      field: K,
      value: ChallengeFormData["challengeConfig"][K]
    ) => {
      setFormData((prev) => ({
        ...prev,
        challengeConfig: { ...prev.challengeConfig, [field]: value }
      }));
    },
    []
  );

  const addTag = useCallback(() => {
    if (!newTag.trim()) return;
    const currentTags = formData.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      updateField("tags", [...currentTags, newTag.trim()]);
    }
    setNewTag("");
  }, [formData.tags, newTag, updateField]);

  const removeTag = useCallback(
    (index: number) => {
      const currentTags = formData.tags || [];
      updateField(
        "tags",
        currentTags.filter((_, i) => i !== index)
      );
    },
    [formData.tags, updateField]
  );

  const exerciseNameById = exercises.reduce((map, exercise) => {
    map.set(exercise.id, exercise.name);
    return map;
  }, new Map<string, string>());

  // Generate preview sessions
  const previewSessions = useMemo(() => {
    if (!formData.challengeConfig.exerciseId) return [];

    try {
      return generateChallengeSessions(formData.challengeConfig);
    } catch {
      return [];
    }
  }, [formData.challengeConfig]);

  // Calculate challenge statistics
  const challengeStats = useMemo(() => {
    const sessions = previewSessions;
    const totalSessions = sessions.length;
    const totalReps = sessions.reduce((sum, session) => {
      // Calculate total reps for this session from exercise blocks
      const sessionReps = session.blocks
        .filter((block) => block.type === "exercise")
        .reduce((blockSum, block) => blockSum + (block.targetReps || 0), 0);
      return sum + sessionReps;
    }, 0);
    const estimatedDuration = sessions.reduce((sum, session) => {
      const warmupTime = formData.challengeConfig.warmUpSeconds;
      // Calculate total reps for this session from exercise blocks
      const sessionReps = session.blocks
        .filter((block) => block.type === "exercise")
        .reduce((blockSum, block) => blockSum + (block.targetReps || 0), 0);
      const exerciseTime = sessionReps * 2; // Estimate 2 seconds per rep
      const breakTime =
        formData.challengeConfig.breakSeconds *
        (formData.challengeConfig.sets - 1);
      return sum + warmupTime + exerciseTime + breakTime;
    }, 0);

    return {
      totalSessions,
      totalReps,
      estimatedDurationMinutes: Math.round(estimatedDuration / 60),
      averageRepsPerSession:
        totalSessions > 0 ? Math.round(totalReps / totalSessions) : 0
    };
  }, [previewSessions, formData.challengeConfig]);

  const handleSave = useCallback(async () => {
    const trimmed = formData.name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Please enter a challenge name.");
      return;
    }

    if (!formData.challengeConfig.exerciseId) {
      Alert.alert(
        "Exercise required",
        "Please select an exercise for the challenge."
      );
      return;
    }

    if (exercises.length === 0) {
      Alert.alert(
        "Add an exercise first",
        "Create at least one exercise before creating a challenge."
      );
      return;
    }

    // Validate challenge parameters
    const config = formData.challengeConfig;
    if (config.sets <= 0) {
      Alert.alert("Invalid sets", "Sets must be at least 1.");
      return;
    }
    if (config.targetReps <= 0) {
      Alert.alert("Invalid target reps", "Target reps must be at least 1.");
      return;
    }
    if (config.warmUpSeconds < 0) {
      Alert.alert("Invalid warm-up", "Warm-up seconds must be 0 or greater.");
      return;
    }
    if (config.breakSeconds < 0) {
      Alert.alert("Invalid break", "Break seconds must be 0 or greater.");
      return;
    }
    if (
      config.sessionIncreasePercent <= 0 ||
      config.sessionIncreasePercent > 100
    ) {
      Alert.alert(
        "Invalid progression",
        "Session increase percent must be between 0 and 100."
      );
      return;
    }

    try {
      await onSave({
        ...formData,
        name: trimmed,
        description: formData.description?.trim() || undefined
      });
    } catch (error) {
      Alert.alert(
        "Couldn't save",
        error instanceof Error ? error.message : String(error)
      );
    }
  }, [formData, exercises.length, onSave]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          style={({ pressed }) => [
            styles.headerBack,
            pressed && styles.headerBackPressed
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {mode === "create" ? "New Challenge" : "Edit Challenge"}
          </Text>
          <Text style={styles.headerSubtitle}>
            Create a progressive fitness challenge
          </Text>
        </View>
      </View>

      {/* Basic Information */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <Text style={styles.label}>Name *</Text>
        <TextInput
          value={formData.name}
          onChangeText={(value) => updateField("name", value)}
          placeholder="e.g. 100 Push-ups Challenge"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
        />

        <View style={{ height: theme.spacing.md }} />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={formData.description}
          onChangeText={(value) => updateField("description", value)}
          placeholder="Brief description of this challenge"
          placeholderTextColor={theme.colors.muted}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={3}
        />

        <View style={{ height: theme.spacing.md }} />

        <Text style={styles.label}>Difficulty</Text>
        <View style={styles.segmented}>
          {(["beginner", "intermediate", "advanced"] as const).map(
            (difficulty) => (
              <Pressable
                key={difficulty}
                onPress={() => updateField("difficulty", difficulty)}
                style={[
                  styles.segment,
                  formData.difficulty === difficulty && styles.segmentActive
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    formData.difficulty === difficulty &&
                      styles.segmentTextActive
                  ]}
                >
                  {difficulty}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>

      {/* Challenge Configuration */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Challenge Configuration</Text>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Exercise *</Text>
          <Pressable
            style={({ pressed }) => [
              styles.pickerBtn,
              pressed && styles.pickerBtnPressed
            ]}
            onPress={() => setExercisePickerOpen(true)}
          >
            <Text style={styles.pickerBtnText}>
              {exerciseNameById.get(formData.challengeConfig.exerciseId) ||
                "Select exercise"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={theme.colors.muted}
            />
          </Pressable>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Target Reps</Text>
          <TextInput
            value={String(formData.challengeConfig.targetReps)}
            onChangeText={(value) => {
              const num = Number(value);
              if (Number.isFinite(num) && num >= 0) {
                updateChallengeConfig("targetReps", num);
              }
            }}
            keyboardType="number-pad"
            style={styles.fieldInput}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Sets per Session</Text>
          <TextInput
            value={String(formData.challengeConfig.sets)}
            onChangeText={(value) => {
              const num = Number(value);
              if (Number.isFinite(num) && num >= 0) {
                updateChallengeConfig("sets", num);
              }
            }}
            keyboardType="number-pad"
            style={styles.fieldInput}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Warm-up (seconds)</Text>
          <TextInput
            value={String(formData.challengeConfig.warmUpSeconds)}
            onChangeText={(value) => {
              const num = Number(value);
              if (Number.isFinite(num) && num >= 0) {
                updateChallengeConfig("warmUpSeconds", num);
              }
            }}
            keyboardType="number-pad"
            style={styles.fieldInput}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Break (seconds)</Text>
          <TextInput
            value={String(formData.challengeConfig.breakSeconds)}
            onChangeText={(value) => {
              const num = Number(value);
              if (Number.isFinite(num) && num >= 0) {
                updateChallengeConfig("breakSeconds", num);
              }
            }}
            keyboardType="number-pad"
            style={styles.fieldInput}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Session Increase (%)</Text>
          <TextInput
            value={String(formData.challengeConfig.sessionIncreasePercent)}
            onChangeText={(value) => {
              const num = Number(value);
              if (Number.isFinite(num) && num >= 0 && num <= 100) {
                updateChallengeConfig("sessionIncreasePercent", num);
              }
            }}
            keyboardType="number-pad"
            style={styles.fieldInput}
            placeholder="10"
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Duration (days)</Text>
          <TextInput
            value={
              formData.challengeConfig.duration
                ? String(formData.challengeConfig.duration)
                : ""
            }
            onChangeText={(value) => {
              const num = Number(value);
              updateChallengeConfig(
                "duration",
                Number.isFinite(num) && num > 0 ? num : undefined
              );
            }}
            keyboardType="number-pad"
            style={styles.fieldInput}
            placeholder="30"
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Progression Type</Text>
          <View style={styles.segmented}>
            {(["linear", "percentage"] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => updateChallengeConfig("progressionType", type)}
                style={[
                  styles.segment,
                  formData.challengeConfig.progressionType === type &&
                    styles.segmentActive
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    formData.challengeConfig.progressionType === type &&
                      styles.segmentTextActive
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Challenge Statistics */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Challenge Preview</Text>
          <Pressable
            onPress={() => setPreviewOpen(true)}
            style={({ pressed }) => [
              styles.smallBtn,
              pressed && styles.smallBtnPressed
            ]}
          >
            <Ionicons
              name="eye-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={styles.smallBtnText}>View Sessions</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{challengeStats.totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{challengeStats.totalReps}</Text>
            <Text style={styles.statLabel}>Total Reps</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {challengeStats.averageRepsPerSession}
            </Text>
            <Text style={styles.statLabel}>Avg/Session</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {challengeStats.estimatedDurationMinutes}m
            </Text>
            <Text style={styles.statLabel}>Est. Duration</Text>
          </View>
        </View>
      </View>

      {/* Tags */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tags</Text>

        <View style={styles.arrayInputContainer}>
          <TextInput
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Add tag (e.g. endurance, bodyweight)"
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, { flex: 1 }]}
            onSubmitEditing={addTag}
          />
          <Pressable
            onPress={addTag}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed
            ]}
          >
            <Ionicons name="add" size={20} color={theme.colors.primary} />
          </Pressable>
        </View>

        <View style={styles.tagContainer}>
          {formData.tags?.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <Pressable
                onPress={() => removeTag(index)}
                style={styles.tagRemove}
              >
                <Ionicons name="close" size={14} color={theme.colors.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      {/* Save Button */}
      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={({ pressed }) => [
          styles.primaryBtn,
          pressed && !saving && styles.primaryBtnPressed,
          saving && styles.primaryBtnDisabled
        ]}
      >
        <Ionicons
          name="save-outline"
          size={18}
          color={theme.colors.primaryTextOn}
          style={{ marginRight: theme.spacing.sm }}
        />
        <Text style={styles.primaryBtnText}>
          {saving ? "Saving..." : "Save Challenge"}
        </Text>
      </Pressable>

      {/* Exercise Picker Modal */}
      <Modal
        visible={exercisePickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setExercisePickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Exercise</Text>
              <Pressable
                onPress={() => setExercisePickerOpen(false)}
                style={({ pressed }) => [
                  styles.iconBtn,
                  pressed && styles.iconBtnPressed
                ]}
              >
                <Ionicons name="close" size={18} color={theme.colors.text} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {exercises.map((exercise) => (
                <Pressable
                  key={exercise.id}
                  onPress={() => {
                    updateChallengeConfig("exerciseId", exercise.id);
                    setExercisePickerOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.modalRow,
                    pressed && styles.modalRowPressed
                  ]}
                >
                  <Text style={styles.modalRowText}>{exercise.name}</Text>
                  {exercise.source === "builtin" && (
                    <Text style={styles.modalRowHint}>Built-in</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Session Preview Modal */}
      <Modal
        visible={previewOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Preview</Text>
              <Pressable
                onPress={() => setPreviewOpen(false)}
                style={({ pressed }) => [
                  styles.iconBtn,
                  pressed && styles.iconBtnPressed
                ]}
              >
                <Ionicons name="close" size={18} color={theme.colors.text} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {previewSessions.map((session, index) => (
                <View key={index} style={styles.previewSession}>
                  <Text style={styles.previewSessionTitle}>
                    Session {session.index}
                  </Text>
                  <Text style={styles.previewSessionReps}>
                    {session.blocks
                      .filter((block) => block.type === "exercise")
                      .reduce(
                        (sum, block) => sum + (block.targetReps || 0),
                        0
                      )}{" "}
                    reps ({formData.challengeConfig.sets} sets)
                  </Text>
                </View>
              ))}
              {previewSessions.length === 0 && (
                <Text style={styles.previewEmpty}>
                  Configure challenge parameters to see session preview
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: theme.spacing.xxl
  },
  headerSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md
  },
  headerBack: {
    padding: theme.spacing.xs,
    marginTop: -theme.spacing.xs,
    marginLeft: -theme.spacing.xs
  },
  headerBackPressed: { opacity: 0.6 },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.muted
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    ...theme.typography.body
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top"
  },
  segmented: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm
  },
  segment: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md
  },
  segmentActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight
  },
  segmentText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textTransform: "capitalize"
  },
  segmentTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md
  },
  fieldLabel: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    flex: 1
  },
  fieldInput: {
    width: 110,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    ...theme.typography.body,
    textAlign: "right"
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface
  },
  pickerBtnPressed: { backgroundColor: theme.colors.card },
  pickerBtnText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs
  },
  smallBtnPressed: { backgroundColor: theme.colors.border },
  smallBtnText: { ...theme.typography.caption, color: theme.colors.text },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textAlign: "center"
  },
  arrayInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center"
  },
  addButtonPressed: { opacity: 0.7 },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs
  },
  tagText: {
    ...theme.typography.caption,
    color: theme.colors.primary
  },
  tagRemove: {
    padding: 2
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    ...theme.shadows.md
  },
  primaryBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
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
  modalTitle: { ...theme.typography.h3, color: theme.colors.text },
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
  modalRow: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md
  },
  modalRowPressed: { backgroundColor: theme.colors.card },
  modalRowText: { ...theme.typography.body, color: theme.colors.text },
  modalRowHint: { ...theme.typography.caption, color: theme.colors.muted },
  previewSession: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  previewSessionTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  previewSessionReps: {
    ...theme.typography.body,
    color: theme.colors.subtext
  },
  previewEmpty: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    padding: theme.spacing.lg
  }
});
