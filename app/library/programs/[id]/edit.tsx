import { useDataActions } from "@/context/DataContext";
import { useExercises, usePrograms } from "@/hooks/data";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type BlockDraft =
  | { type: "warmup"; seconds: string }
  | { type: "rest"; seconds: string; label?: string }
  | {
      type: "exercise";
      exerciseId: string;
      targetReps?: string;
      durationSeconds?: string;
      note?: string;
    };

function toDraftBlocks(blocks: any[]): BlockDraft[] {
  return blocks.map((b) => {
    if (b.type === "warmup")
      return { type: "warmup", seconds: String(b.seconds ?? 0) };
    if (b.type === "rest")
      return {
        type: "rest",
        seconds: String(b.seconds ?? 0),
        label: b.label ?? "",
      };
    return {
      type: "exercise",
      exerciseId: String(b.exerciseId ?? ""),
      targetReps: b.targetReps == null ? "" : String(b.targetReps),
      durationSeconds:
        b.durationSeconds == null ? "" : String(b.durationSeconds),
      note: b.note == null ? "" : String(b.note),
    };
  });
}

export default function EditProgramScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { data: programs } = usePrograms();
  const { data: exercises } = useExercises();
  const actions = useDataActions();

  const program = useMemo(
    () => programs?.find((p) => p.id === id) ?? null,
    [programs, id],
  );

  const [name, setName] = useState(program?.name ?? "");
  const [description, setDescription] = useState(program?.description ?? "");
  const [saving, setSaving] = useState(false);

  const [sessionBlocks, setSessionBlocks] = useState<BlockDraft[]>(
    toDraftBlocks(
      program?.sessions?.[0]?.blocks ?? [{ type: "warmup", seconds: 180 }],
    ),
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(
    null,
  );

  const exerciseNameById = useMemo(() => {
    const map = new Map<string, string>();
    (exercises ?? []).forEach((e) => map.set(e.id, e.name));
    return map;
  }, [exercises]);

  function addBlock(type: BlockDraft["type"]) {
    if (type === "warmup")
      setSessionBlocks((b) => [...b, { type, seconds: "120" }]);
    if (type === "rest")
      setSessionBlocks((b) => [...b, { type, seconds: "90", label: "Rest" }]);
    if (type === "exercise") {
      const first = exercises?.[0]?.id ?? "";
      setSessionBlocks((b) => [
        ...b,
        {
          type,
          exerciseId: first,
          targetReps: "",
          durationSeconds: "",
          note: "",
        },
      ]);
    }
  }

  function removeBlock(index: number) {
    setSessionBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Please enter a program name.");
      return;
    }
    if (!program) {
      Alert.alert("Program not found");
      return;
    }
    if (program.source === "builtin") {
      Alert.alert("Read-only", "Built-in programs can’t be edited.");
      return;
    }

    try {
      const blocks = sessionBlocks.map((b) => {
        if (b.type === "warmup") {
          const seconds = Number(b.seconds);
          if (!Number.isFinite(seconds) || seconds < 0)
            throw new Error("Invalid warm-up seconds.");
          return { type: "warmup" as const, seconds };
        }
        if (b.type === "rest") {
          const seconds = Number(b.seconds);
          if (!Number.isFinite(seconds) || seconds < 0)
            throw new Error("Invalid rest seconds.");
          return {
            type: "rest" as const,
            seconds,
            label: b.label?.trim() || undefined,
          };
        }
        if (!b.exerciseId)
          throw new Error("Pick an exercise for each exercise block.");

        const targetRaw = b.targetReps?.trim();
        const targetReps = targetRaw ? Number(targetRaw) : undefined;
        if (
          targetReps != null &&
          (!Number.isFinite(targetReps) || targetReps < 0)
        ) {
          throw new Error("Invalid target reps value.");
        }

        const durationRaw = b.durationSeconds?.trim();
        const durationSeconds = durationRaw ? Number(durationRaw) : undefined;
        if (
          durationSeconds != null &&
          (!Number.isFinite(durationSeconds) || durationSeconds < 0)
        ) {
          throw new Error("Invalid duration seconds value.");
        }

        return {
          type: "exercise" as const,
          exerciseId: b.exerciseId,
          targetReps,
          durationSeconds,
          note: b.note?.trim() || undefined,
        };
      });

      if (!blocks.some((b) => b.type === "exercise")) {
        Alert.alert(
          "Add an exercise",
          "Programs need at least one exercise block.",
        );
        return;
      }

      setSaving(true);
      await actions.upsertProgram({
        id: program.id,
        name: trimmed,
        description: description.trim() || undefined,
        sessions: [
          {
            index: 1,
            name: program.sessions?.[0]?.name ?? "Session 1",
            blocks,
          },
        ],
      } as any);
      router.back();
    } catch (e) {
      Alert.alert("Couldn’t save", e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!program) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.card, { margin: theme.spacing.lg }]}>
          <Text style={styles.muted}>Program not found.</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.secondaryBtnPressed,
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
            pressed && styles.headerBackPressed,
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Edit Program</Text>
          <Text style={styles.headerSubtitle}>{program.name}</Text>
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
            placeholder="Program name"
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
          />

          <View style={{ height: theme.spacing.lg }} />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Short note about this program"
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, { minHeight: 72 }]}
            multiline
          />
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Session 1</Text>
            <View style={styles.blockButtonsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.smallBtn,
                  pressed && styles.smallBtnPressed,
                ]}
                onPress={() => addBlock("warmup")}
              >
                <Text style={styles.smallBtnText}>+ Warm-up</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.smallBtn,
                  pressed && styles.smallBtnPressed,
                ]}
                onPress={() => addBlock("exercise")}
              >
                <Text style={styles.smallBtnText}>+ Exercise</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.smallBtn,
                  pressed && styles.smallBtnPressed,
                ]}
                onPress={() => addBlock("rest")}
              >
                <Text style={styles.smallBtnText}>+ Rest</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.blocksList}>
            {sessionBlocks.map((b, idx) => (
              <View key={idx} style={styles.blockCard}>
                <View style={styles.rowBetween}>
                  <View style={styles.blockTitleRow}>
                    <Ionicons
                      name={
                        b.type === "warmup"
                          ? "timer-outline"
                          : b.type === "rest"
                            ? "time-outline"
                            : "barbell-outline"
                      }
                      size={18}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.blockTitle}>{b.type}</Text>
                  </View>
                  <Pressable
                    onPress={() => removeBlock(idx)}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      pressed && styles.iconBtnPressed,
                    ]}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={theme.colors.muted}
                    />
                  </Pressable>
                </View>

                {b.type === "warmup" && (
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Seconds</Text>
                    <TextInput
                      value={b.seconds}
                      onChangeText={(v) =>
                        setSessionBlocks((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, seconds: v } : x,
                          ),
                        )
                      }
                      keyboardType="number-pad"
                      style={styles.fieldInput}
                    />
                  </View>
                )}

                {b.type === "rest" && (
                  <>
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Label</Text>
                      <TextInput
                        value={b.label ?? ""}
                        onChangeText={(v) =>
                          setSessionBlocks((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, label: v } : x,
                            ),
                          )
                        }
                        style={styles.fieldInput}
                      />
                    </View>
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Seconds</Text>
                      <TextInput
                        value={b.seconds}
                        onChangeText={(v) =>
                          setSessionBlocks((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, seconds: v } : x,
                            ),
                          )
                        }
                        keyboardType="number-pad"
                        style={styles.fieldInput}
                      />
                    </View>
                  </>
                )}

                {b.type === "exercise" && (
                  <>
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Exercise</Text>
                      <Pressable
                        style={({ pressed }) => [
                          styles.pickerBtn,
                          pressed && styles.pickerBtnPressed,
                        ]}
                        onPress={() => {
                          setPickerTargetIndex(idx);
                          setPickerOpen(true);
                        }}
                      >
                        <Text style={styles.pickerBtnText}>
                          {exerciseNameById.get(b.exerciseId) ??
                            "Pick exercise"}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={16}
                          color={theme.colors.muted}
                        />
                      </Pressable>
                    </View>

                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>
                        Target reps (optional)
                      </Text>
                      <TextInput
                        value={b.targetReps ?? ""}
                        onChangeText={(v) =>
                          setSessionBlocks((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, targetReps: v } : x,
                            ),
                          )
                        }
                        keyboardType="number-pad"
                        style={styles.fieldInput}
                      />
                    </View>

                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>
                        Duration (seconds, optional)
                      </Text>
                      <TextInput
                        value={b.durationSeconds ?? ""}
                        onChangeText={(v) =>
                          setSessionBlocks((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, durationSeconds: v } : x,
                            ),
                          )
                        }
                        keyboardType="number-pad"
                        style={styles.fieldInput}
                      />
                    </View>

                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Note (optional)</Text>
                      <TextInput
                        value={b.note ?? ""}
                        onChangeText={(v) =>
                          setSessionBlocks((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, note: v } : x,
                            ),
                          )
                        }
                        style={[
                          styles.fieldInput,
                          { width: 200, textAlign: "left" },
                        ]}
                      />
                    </View>
                  </>
                )}
              </View>
            ))}
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving || program.source === "builtin"}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed &&
              !saving &&
              program.source !== "builtin" &&
              styles.primaryBtnPressed,
            (saving || program.source === "builtin") &&
              styles.primaryBtnDisabled,
          ]}
        >
          <Ionicons
            name="save-outline"
            size={18}
            color={theme.colors.primaryTextOn}
            style={{ marginRight: theme.spacing.sm }}
          />
          <Text style={styles.primaryBtnText}>
            {program.source === "builtin"
              ? "Built-in (read-only)"
              : saving
                ? "Saving..."
                : "Save Program"}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Pick an exercise</Text>
              <Pressable
                onPress={() => setPickerOpen(false)}
                style={({ pressed }) => [
                  styles.iconBtn,
                  pressed && styles.iconBtnPressed,
                ]}
              >
                <Ionicons name="close" size={18} color={theme.colors.text} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {(exercises ?? []).map((ex) => (
                <Pressable
                  key={ex.id}
                  onPress={() => {
                    if (pickerTargetIndex == null) return;
                    setSessionBlocks((prev) =>
                      prev.map((b, i) =>
                        i === pickerTargetIndex && b.type === "exercise"
                          ? { ...b, exerciseId: ex.id }
                          : b,
                      ),
                    );
                    setPickerOpen(false);
                    setPickerTargetIndex(null);
                  }}
                  style={({ pressed }) => [
                    styles.modalRow,
                    pressed && styles.modalRowPressed,
                  ]}
                >
                  <Text style={styles.modalRowText}>{ex.name}</Text>
                  {ex.source === "builtin" && (
                    <Text style={styles.modalRowHint}>Built-in</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    gap: theme.spacing.md,
  },
  headerBack: {
    padding: theme.spacing.xs,
    marginTop: -theme.spacing.xs,
    marginLeft: -theme.spacing.xs,
  },
  headerBackPressed: { opacity: 0.6 },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: theme.spacing.xxl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
    gap: theme.spacing.sm,
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
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  blockButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    justifyContent: "flex-end",
  },
  smallBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  smallBtnPressed: { backgroundColor: theme.colors.border },
  smallBtnText: { ...theme.typography.caption, color: theme.colors.text },
  blocksList: { gap: theme.spacing.md, marginTop: theme.spacing.sm },
  blockCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  blockTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  blockTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    textTransform: "capitalize",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  iconBtnPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }],
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  fieldLabel: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    flex: 1,
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
    textAlign: "right",
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
    backgroundColor: theme.colors.surface,
  },
  pickerBtnPressed: { backgroundColor: theme.colors.card },
  pickerBtnText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
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
  muted: { ...theme.typography.body, color: theme.colors.muted },
  secondaryBtn: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryBtnPressed: { backgroundColor: theme.colors.card },
  secondaryBtnText: { ...theme.typography.bodyBold, color: theme.colors.text },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: { ...theme.typography.h3, color: theme.colors.text },
  modalRow: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  modalRowPressed: { backgroundColor: theme.colors.card },
  modalRowText: { ...theme.typography.body, color: theme.colors.text },
  modalRowHint: { ...theme.typography.caption, color: theme.colors.muted },
});
