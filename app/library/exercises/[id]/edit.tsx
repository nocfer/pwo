import { useDataActions } from "@/context/DataContext";
import { useExercises } from "@/hooks/data";
import { theme } from "@/theme/theme";
import type { ExerciseCategory } from "@/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditExerciseScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { data } = useExercises();
  const actions = useDataActions();

  const exercise = useMemo(
    () => data?.find((e) => e.id === id) ?? null,
    [data, id]
  );

  const [name, setName] = useState(exercise?.name ?? "");
  const [category, setCategory] = useState<ExerciseCategory>(
    exercise?.category ?? "strength"
  );
  const [icon, setIcon] = useState<string>(exercise?.icon ?? "barbell");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Please enter an exercise name.");
      return;
    }
    setSaving(true);
    try {
      await actions.upsertExercise({
        id,
        name: trimmed,
        category,
        icon
      });
      router.back();
    } catch (e) {
      Alert.alert("Couldn’t save", e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.card, { margin: theme.spacing.lg }]}>
          <Text style={styles.muted}>Exercise not found.</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.secondaryBtnPressed
            ]}
          >
            <Text style={styles.secondaryBtnText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <View style={styles.headerSection}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [
            styles.headerBack,
            pressed && styles.headerBackPressed
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Edit Exercise</Text>
          <Text style={styles.headerSubtitle}>{exercise.name}</Text>
        </View>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Exercise name"
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
          />

          <View style={{ height: theme.spacing.lg }} />

          <Text style={styles.label}>Category</Text>
          <View style={styles.segmented}>
            {(["strength", "cardio", "flexibility", "skill"] as const).map(
              (c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.segment,
                    category === c && styles.segmentActive
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      category === c && styles.segmentTextActive
                    ]}
                  >
                    {c}
                  </Text>
                </Pressable>
              )
            )}
          </View>

          <View style={{ height: theme.spacing.lg }} />

          <Text style={styles.label}>Icon (Ionicons)</Text>
          <TextInput
            value={icon}
            onChangeText={setIcon}
            placeholder="e.g. barbell"
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
          />
          <View style={styles.iconPreview}>
            <Ionicons
              name={(icon || "help") as any}
              size={22}
              color={theme.colors.primary}
            />
            <Text style={styles.iconPreviewText}>{icon}</Text>
          </View>
        </View>

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
            {saving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
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
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: theme.spacing.xxl
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
    gap: theme.spacing.xs
  },
  label: { ...theme.typography.caption, color: theme.colors.muted },
  input: {
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    ...theme.typography.body
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
  iconPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm
  },
  iconPreviewText: { ...theme.typography.caption, color: theme.colors.subtext },
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
  muted: { ...theme.typography.body, color: theme.colors.muted },
  secondaryBtn: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  secondaryBtnPressed: { backgroundColor: theme.colors.card },
  secondaryBtnText: { ...theme.typography.bodyBold, color: theme.colors.text }
});
