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

  useEffect(() => {
    if (programs) {
      prioritizePrograms(programs).then(setPrioritizedPrograms);
    } else {
      setPrioritizedPrograms([]);
    }
  }, [programs]);

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
      { label: "Total Workouts", value: aggregated.totalWorkoutsCompleted },
      { label: "Current Streak", value: `${aggregated.currentStreak} days` }
    ];
  }, [aggregated]);

  const handleProgramSelect = (program: Program | ProgramWithPriority) => {
    setProgramSelectorOpen(false);
    router.navigate({ pathname: "/programs/[id]", params: { id: program.id } });
  };

  const handleQuickStart = () => {
    if (allPrograms.length === 1) {
      handleProgramSelect(allPrograms[0]);
    } else if (allPrograms.length > 1) {
      setProgramSelectorOpen(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.subtitle}>Ready to crush your workout?</Text>
        </View>

        <View style={styles.content}>
          {/* Progress Summary */}
          {aggregated && progressStats.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                  <Ionicons
                    name="stats-chart"
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>
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
              onPress={() => router.navigate("/(tabs)/library")}
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
                    : `Start (${allPrograms.length})`}
                </Text>
              </Pressable>
            ) : (
              <View style={[styles.actionButtonPrimary, styles.actionDisabled]}>
                <View style={styles.actionIconContainerPrimary}>
                  <Ionicons
                    name="add"
                    size={20}
                    color={theme.colors.primaryTextOn}
                  />
                </View>
                <Text style={styles.actionPrimaryText}>No Programs</Text>
              </View>
            )}
          </View>

          {/* Empty State */}
          {allPrograms.length === 0 && (
            <EmptyState
              variant="default"
              icon="barbell-outline"
              title="No programs yet"
              description="Create your first program or challenge to get started"
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
                <Ionicons name="close" size={22} color={theme.colors.text} />
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
                        <View
                          style={[
                            styles.programIconContainer,
                            { backgroundColor: theme.colors.accentLight }
                          ]}
                        >
                          <Ionicons
                            name="trophy-outline"
                            size={18}
                            color={theme.colors.accent}
                          />
                        </View>
                        <View style={styles.programInfo}>
                          <Text style={styles.programName}>{program.name}</Text>
                          {program.description && (
                            <Text
                              style={styles.programDescription}
                              numberOfLines={1}
                            >
                              {program.description}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={theme.colors.muted}
                      />
                    </Pressable>
                  ))}
                </>
              )}

              {regularPrograms.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>
                    {challenges.length > 0 ? "Programs" : "Programs"}
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
                        <View
                          style={[
                            styles.programIconContainer,
                            { backgroundColor: theme.colors.primaryLight }
                          ]}
                        >
                          <Ionicons
                            name="barbell-outline"
                            size={18}
                            color={theme.colors.primary}
                          />
                        </View>
                        <View style={styles.programInfo}>
                          <Text style={styles.programName}>{program.name}</Text>
                          {program.description && (
                            <Text
                              style={styles.programDescription}
                              numberOfLines={1}
                            >
                              {program.description}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
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
  scrollView: {
    flex: 1
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg
  },
  greeting: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2,
    gap: theme.spacing.lg
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.sm
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text
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
  actionsRow: {
    flexDirection: "row",
    gap: theme.spacing.md
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    ...theme.shadows.sm
  },
  actionPressed: {
    backgroundColor: theme.colors.background,
    transform: [{ scale: 0.98 }]
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
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
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    ...theme.shadows.sm
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: "75%",
    paddingBottom: theme.spacing.xl
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  modalCloseButtonPressed: {
    backgroundColor: theme.colors.background
  },
  programList: {
    paddingHorizontal: theme.spacing.lg
  },
  sectionTitle: {
    ...theme.typography.captionBold,
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm
  },
  programItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.surface
  },
  programItemPressed: {
    backgroundColor: theme.colors.background
  },
  programItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  programIconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md
  },
  programInfo: {
    flex: 1
  },
  programName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  programDescription: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: 2
  }
});
