import { ProgressStats, WeeklyChart } from "@/components";
import { EmptyState } from "@/components/common";
import { useAllProgress, usePrograms, useWeeklyActivity } from "@/hooks/data";
import {
  prioritizePrograms,
  type ProgramWithPriority
} from "@/lib/utils/programPrioritization";
import { theme } from "@/theme/theme";
import { Program } from "@/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { data: programs } = usePrograms();
  const [programSelectorOpen, setProgramSelectorOpen] = useState(false);
  const [prioritizedPrograms, setPrioritizedPrograms] = useState<
    ProgramWithPriority[]
  >([]);

  // Prioritize programs when data changes
  useEffect(() => {
    if (programs) {
      prioritizePrograms(programs).then(setPrioritizedPrograms);
    } else {
      setPrioritizedPrograms([]);
    }
  }, [programs]);

  // Separate regular programs and challenges from prioritized list
  const { regularPrograms, challenges, allPrograms } = useMemo(() => {
    if (prioritizedPrograms.length === 0) {
      return { regularPrograms: [], challenges: [], allPrograms: [] };
    }

    const regular = prioritizedPrograms.filter((p) => !p.challengeConfig);
    const challenge = prioritizedPrograms.filter((p) => p.challengeConfig);
    const all = [...regular, ...challenge];

    return {
      regularPrograms: regular,
      challenges: challenge,
      allPrograms: all
    };
  }, [prioritizedPrograms]);

  const { data: weeklyData } = useWeeklyActivity();
  const { data: aggregated } = useAllProgress();

  const progressStats = useMemo(() => {
    if (!aggregated) return [];
    return [
      {
        label: "Total Workouts",
        value: aggregated.totalWorkoutsCompleted
      },
      {
        label: "Current Streak",
        value: `${aggregated.currentStreak} days`
      }
    ];
  }, [aggregated]);

  const handleProgramSelect = (program: Program | ProgramWithPriority) => {
    setProgramSelectorOpen(false);
    router.navigate({
      pathname: "/programs/[id]",
      params: { id: program.id }
    });
  };

  const handleQuickStart = () => {
    if (allPrograms.length === 1) {
      // If only one program, start it directly
      handleProgramSelect(allPrograms[0]);
    } else if (allPrograms.length > 1) {
      // If multiple programs, show selector
      setProgramSelectorOpen(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <LinearGradient
        colors={[
          theme.colors.gradient.primaryStart,
          theme.colors.gradient.primaryEnd
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.headerSubtitle}>
            Ready to crush your workout?
          </Text>
        </View>
      </LinearGradient>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Gradient Header */}

        <View style={styles.content}>
          {/* Progress Summary */}
          {aggregated && progressStats.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <LinearGradient
                  colors={[
                    theme.colors.gradient.primaryStart,
                    theme.colors.gradient.primaryEnd
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardIconGradient}
                >
                  <Ionicons name="stats-chart" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.cardTitle}>Your Progress</Text>
              </View>
              <ProgressStats stats={progressStats} columns={2} />
              <Pressable
                style={({ pressed }) => [
                  styles.viewProgressButton,
                  pressed && styles.viewProgressButtonPressed
                ]}
                onPress={() => router.navigate("/(tabs)/progress")}
              >
                <Text style={styles.viewProgressText}>View Full Progress</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>
          )}

          {/* Weekly Activity Chart */}
          <WeeklyChart data={weeklyData} title="Last 7 days" />

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionPressed
              ]}
              onPress={() => router.navigate("/(tabs)/challenges")}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={theme.colors.text}
                />
              </View>
              <Text style={styles.actionText}>All Programs</Text>
            </Pressable>

            {allPrograms.length > 0 ? (
              <Pressable
                style={({ pressed }) => [
                  styles.actionButtonPrimary,
                  pressed && styles.actionPrimaryPressed
                ]}
                onPress={handleQuickStart}
              >
                <LinearGradient
                  colors={[
                    theme.colors.gradient.primaryStart,
                    theme.colors.gradient.primaryEnd
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <View style={styles.actionIconContainerPrimary}>
                    <Ionicons
                      name="play"
                      size={20}
                      color={theme.colors.primaryTextOn}
                    />
                  </View>
                  <Text style={styles.actionPrimaryText}>
                    {allPrograms.length === 1
                      ? "Quick Start"
                      : `Start Program (${allPrograms.length})`}
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <View style={styles.actionButtonPrimary}>
                <LinearGradient
                  colors={[
                    theme.colors.gradient.primaryStart,
                    theme.colors.gradient.primaryEnd
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.actionGradient, styles.actionDisabled]}
                >
                  <View style={styles.actionIconContainerPrimary}>
                    <Ionicons
                      name="add"
                      size={20}
                      color={theme.colors.primaryTextOn}
                    />
                  </View>
                  <Text style={styles.actionPrimaryText}>No Programs</Text>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Empty State for No Programs */}
          {allPrograms.length === 0 && (
            <EmptyState
              variant="default"
              icon="barbell-outline"
              title="No programs yet"
              description="Create your first program or challenge to get started on your fitness journey"
              actionLabel="Go to Library"
              onAction={() => router.navigate("/(tabs)/library")}
            />
          )}
        </View>
      </ScrollView>

      {/* Program Selector Modal */}
      <Modal
        visible={programSelectorOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setProgramSelectorOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Program</Text>
              <Pressable
                onPress={() => setProgramSelectorOpen(false)}
                style={({ pressed }) => [
                  styles.modalCloseButton,
                  pressed && styles.modalCloseButtonPressed
                ]}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.programList}
              showsVerticalScrollIndicator={false}
            >
              {challenges.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Challenges</Text>
                  {challenges.map((program) => (
                    <Pressable
                      key={program.id}
                      onPress={() => handleProgramSelect(program)}
                      style={({ pressed }) => [
                        styles.programItem,
                        pressed && styles.programItemPressed
                      ]}
                    >
                      <View style={styles.programItemContent}>
                        <View style={styles.programIconContainer}>
                          <Ionicons
                            name="trophy-outline"
                            size={20}
                            color={theme.colors.primary}
                          />
                        </View>
                        <View style={styles.programInfo}>
                          <View style={styles.programNameRow}>
                            <Text style={styles.programName}>
                              {program.name}
                            </Text>
                            {program.usageCount && program.usageCount > 0 && (
                              <View style={styles.usageBadge}>
                                <Text style={styles.usageText}>
                                  {program.usageCount}
                                </Text>
                              </View>
                            )}
                          </View>
                          {program.description && (
                            <Text style={styles.programDescription}>
                              {program.description}
                            </Text>
                          )}
                          {program.lastUsed && (
                            <Text style={styles.lastUsedText}>
                              Last used:{" "}
                              {new Date(program.lastUsed).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={theme.colors.muted}
                      />
                    </Pressable>
                  ))}
                </>
              )}

              {regularPrograms.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>
                    {challenges.length > 0 ? "Regular Programs" : "Programs"}
                  </Text>
                  {regularPrograms.map((program) => (
                    <Pressable
                      key={program.id}
                      onPress={() => handleProgramSelect(program)}
                      style={({ pressed }) => [
                        styles.programItem,
                        pressed && styles.programItemPressed
                      ]}
                    >
                      <View style={styles.programItemContent}>
                        <View style={styles.programIconContainer}>
                          <Ionicons
                            name="barbell-outline"
                            size={20}
                            color={theme.colors.primary}
                          />
                        </View>
                        <View style={styles.programInfo}>
                          <View style={styles.programNameRow}>
                            <Text style={styles.programName}>
                              {program.name}
                            </Text>
                            {program.usageCount && program.usageCount > 0 && (
                              <View style={styles.usageBadge}>
                                <Text style={styles.usageText}>
                                  {program.usageCount}
                                </Text>
                              </View>
                            )}
                          </View>
                          {program.description && (
                            <Text style={styles.programDescription}>
                              {program.description}
                            </Text>
                          )}
                          {program.lastUsed && (
                            <Text style={styles.lastUsedText}>
                              Last used:{" "}
                              {new Date(program.lastUsed).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={theme.colors.muted}
                      />
                    </Pressable>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  headerGradient: {
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    marginBottom: theme.spacing.md
  },
  headerContent: {
    paddingTop: theme.spacing.lg
  },
  greeting: {
    ...theme.typography.h1,
    color: "#FFFFFF",
    marginBottom: theme.spacing.xs
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: "rgba(255,255,255,0.85)"
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    marginTop: -theme.spacing.md,
    gap: theme.spacing.lg
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md
  },
  cardIconGradient: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.sm
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    paddingVertical: theme.spacing.lg
  },
  actionsRow: {
    flexDirection: "row",
    gap: theme.spacing.md
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    ...theme.shadows.sm
  },
  actionPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }]
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm
  },
  actionText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  actionButtonPrimary: {
    flex: 1,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    ...theme.shadows.md
  },
  actionGradient: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center"
  },
  actionPrimaryPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  actionIconContainerPrimary: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm
  },
  actionPrimaryText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  actionDisabled: {
    opacity: 0.5
  },
  viewProgressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs
  },
  viewProgressButtonPressed: {
    opacity: 0.7
  },
  viewProgressText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: "80%",
    paddingBottom: theme.spacing.xl
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  modalCloseButtonPressed: {
    backgroundColor: theme.colors.card
  },
  programList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md
  },
  programItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.card
  },
  programItemPressed: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.98 }]
  },
  programItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  programIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md
  },
  programInfo: {
    flex: 1
  },
  programNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs
  },
  programName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flex: 1
  },
  usageBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    marginLeft: theme.spacing.sm,
    minWidth: 20,
    alignItems: "center"
  },
  usageText: {
    ...theme.typography.caption,
    color: theme.colors.primaryTextOn,
    fontSize: 10,
    fontWeight: "600"
  },
  programDescription: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    lineHeight: 16,
    marginBottom: theme.spacing.xs
  },
  lastUsedText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontSize: 11,
    fontStyle: "italic"
  }
});
