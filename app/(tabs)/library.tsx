import { useDataActions } from "@/context/DataContext";
import { useExercises, usePrograms } from "@/hooks/data";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
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

type Tab = "programs" | "exercises";

export default function LibraryScreen() {
  const [tab, setTab] = useState<Tab>("programs");
  const [query, setQuery] = useState("");
  const { data: programs, loading: programsLoading } = usePrograms();
  const { data: exercises, loading: exercisesLoading } = useExercises();
  const actions = useDataActions();

  const filteredPrograms = useMemo(() => {
    if (!programs) return [];
    const q = query.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((p) => p.name.toLowerCase().includes(q));
  }, [programs, query]);

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [exercises, query]);

  const isLoading = tab === "programs" ? programsLoading : exercisesLoading;

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Library</Text>
            <Text style={styles.subtitle}>
              Create programs and manage exercises
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed
            ]}
            onPress={() => {
              if (tab === "programs") router.navigate("/library/programs/new");
              else router.navigate("/library/exercises/new");
            }}
          >
            <Ionicons name="add" size={22} color={theme.colors.primaryTextOn} />
            <Text style={styles.addButtonText}>
              New {tab === "programs" ? "Program" : "Exercise"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.segmented}>
          <Pressable
            style={[styles.segment, tab === "programs" && styles.segmentActive]}
            onPress={() => setTab("programs")}
          >
            <Text
              style={[
                styles.segmentText,
                tab === "programs" && styles.segmentTextActive
              ]}
            >
              Programs
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.segment,
              tab === "exercises" && styles.segmentActive
            ]}
            onPress={() => setTab("exercises")}
          >
            <Text
              style={[
                styles.segmentText,
                tab === "exercises" && styles.segmentTextActive
              ]}
            >
              Exercises
            </Text>
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color={theme.colors.muted}
            style={{ marginRight: theme.spacing.sm }}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={
              tab === "programs" ? "Search programs..." : "Search exercises..."
            }
            placeholderTextColor={theme.colors.muted}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.colors.muted}
              onPress={() => setQuery("")}
            />
          )}
        </View>

        {isLoading ? (
          <View style={styles.card}>
            <Text style={styles.muted}>Loading…</Text>
          </View>
        ) : tab === "programs" ? (
          <View style={styles.list}>
            {filteredPrograms.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.muted}>No programs yet.</Text>
              </View>
            ) : (
              filteredPrograms.map((p) => (
                <Pressable
                  key={p.id}
                  style={({ pressed }) => [
                    styles.rowCard,
                    pressed && styles.rowCardPressed
                  ]}
                  onPress={() =>
                    router.navigate({
                      pathname: "/programs/[id]" as any,
                      params: { id: p.id }
                    })
                  }
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowTitle}>
                      <Text style={styles.rowTitleText}>{p.name}</Text>
                      {p.source === "builtin" && (
                        <View style={styles.lockPill}>
                          <Ionicons
                            name="lock-closed"
                            size={12}
                            color={theme.colors.muted}
                          />
                          <Text style={styles.lockPillText}>Built-in</Text>
                        </View>
                      )}
                    </View>
                    {p.description ? (
                      <Text style={styles.rowSubtitle}>{p.description}</Text>
                    ) : (
                      <Text style={styles.rowSubtitleMuted}>
                        {p.sessions.length} session
                        {p.sessions.length === 1 ? "" : "s"}
                      </Text>
                    )}
                  </View>

                  <View style={styles.rowActions}>
                    {p.source !== "builtin" && (
                      <Pressable
                        onPress={() =>
                          router.navigate({
                            pathname: "/library/programs/[id]/edit" as any,
                            params: { id: p.id }
                          })
                        }
                        style={({ pressed }) => [
                          styles.iconBtn,
                          pressed && styles.iconBtnPressed
                        ]}
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={theme.colors.text}
                        />
                      </Pressable>
                    )}
                    {p.source !== "builtin" && (
                      <Pressable
                        onPress={() => {
                          Alert.alert(
                            "Delete program?",
                            `Delete “${p.name}”? This can’t be undone.`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: async () => {
                                  try {
                                    await actions.deleteProgram(p.id);
                                  } catch (e) {
                                    Alert.alert("Couldn’t delete", String(e));
                                  }
                                }
                              }
                            ]
                          );
                        }}
                        style={({ pressed }) => [
                          styles.iconBtn,
                          pressed && styles.iconBtnPressed
                        ]}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={theme.colors.danger ?? theme.colors.text}
                        />
                      </Pressable>
                    )}
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={theme.colors.muted}
                    />
                  </View>
                </Pressable>
              ))
            )}
          </View>
        ) : (
          <View style={styles.list}>
            {filteredExercises.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.muted}>No exercises yet.</Text>
              </View>
            ) : (
              filteredExercises.map((e) => (
                <View key={e.id} style={styles.rowCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowTitle}>
                      <Text style={styles.rowTitleText}>{e.name}</Text>
                      {e.source === "builtin" && (
                        <View style={styles.lockPill}>
                          <Ionicons
                            name="lock-closed"
                            size={12}
                            color={theme.colors.muted}
                          />
                          <Text style={styles.lockPillText}>Built-in</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.rowSubtitleMuted}>
                      {e.category ?? "exercise"}
                    </Text>
                  </View>

                  <View style={styles.rowActions}>
                    {e.source !== "builtin" && (
                      <Pressable
                        onPress={() =>
                          router.navigate({
                            pathname: "/library/exercises/[id]/edit" as any,
                            params: { id: e.id }
                          })
                        }
                        style={({ pressed }) => [
                          styles.iconBtn,
                          pressed && styles.iconBtnPressed
                        ]}
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={theme.colors.text}
                        />
                      </Pressable>
                    )}
                    {e.source !== "builtin" && (
                      <Pressable
                        onPress={() => {
                          Alert.alert(
                            "Delete exercise?",
                            `Delete “${e.name}”? This can’t be undone.`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: async () => {
                                  try {
                                    await actions.deleteExercise(e.id);
                                  } catch (err) {
                                    Alert.alert(
                                      "Couldn’t delete",
                                      err instanceof Error
                                        ? err.message
                                        : String(err)
                                    );
                                  }
                                }
                              }
                            ]
                          );
                        }}
                        style={({ pressed }) => [
                          styles.iconBtn,
                          pressed && styles.iconBtnPressed
                        ]}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={theme.colors.danger ?? theme.colors.text}
                        />
                      </Pressable>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl
  },
  headerRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    alignItems: "center"
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    ...theme.shadows.sm
  },
  addButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  addButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden"
  },
  segment: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: "center"
  },
  segmentActive: {
    backgroundColor: theme.colors.primaryLight
  },
  segmentText: {
    ...theme.typography.bodyBold,
    color: theme.colors.muted
  },
  segmentTextActive: {
    color: theme.colors.primary
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    paddingVertical: theme.spacing.xs
  },
  list: {
    gap: theme.spacing.md
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.muted
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  rowCardPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }]
  },
  rowTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flexWrap: "wrap"
  },
  rowTitleText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  rowSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    marginTop: theme.spacing.xs
  },
  rowSubtitleMuted: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
    textTransform: "capitalize"
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
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
  lockPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  lockPillText: {
    ...theme.typography.caption,
    color: theme.colors.muted
  }
});
