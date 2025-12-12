import { useDataActions } from "@/context/DataContext";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewExerciseScreen() {
  const actions = useDataActions();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("strength");
  const [icon, setIcon] = useState<string>("barbell");
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
        name: trimmed,
        category: category as any,
        icon,
      } as any);
      router.back();
    } catch (e) {
      Alert.alert("Couldn’t save", e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.headerBack,
                pressed && styles.headerBackPressed,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={theme.colors.text}
              />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>New Exercise</Text>
              <Text style={styles.subtitle}>
                Add an exercise to your library
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Bench Press"
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
          />

          <View style={{ height: theme.spacing.lg }} />

          <Text style={styles.label}>Category</Text>
          <View style={styles.segmented}>
            {["strength", "cardio", "flexibility", "skill"].map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.segment, category === c && styles.segmentActive]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    category === c && styles.segmentTextActive,
                  ]}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
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
              name={icon as any}
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
            saving && styles.primaryBtnDisabled,
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
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: { gap: theme.spacing.xs },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  headerBackPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }],
  },
  title: { ...theme.typography.h2, color: theme.colors.text },
  subtitle: { ...theme.typography.body, color: theme.colors.muted },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
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
    ...theme.typography.body,
  },
  segmented: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  segment: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  segmentActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  segmentText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textTransform: "capitalize",
  },
  segmentTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
  iconPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  iconPreviewText: { ...theme.typography.caption, color: theme.colors.subtext },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    ...theme.shadows.md,
  },
  primaryBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn,
  },
});
