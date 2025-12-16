/**
 * PersonalRecordsCard - Display recent PRs with celebration
 */

import { useExercises, usePRs } from "@/hooks/data";
import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import PRItem from "./PRItem";
import ProgressEmptyState from "./ProgressEmptyState";

type Props = {
  limit?: number;
  onViewAll?: () => void;
};

export default function PersonalRecordsCard({ limit = 3, onViewAll }: Props) {
  const { data: prsData, loading } = usePRs(limit);
  const { data: exercises } = useExercises();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [loading, fadeAnim]);

  // Map exercise IDs to names
  const exerciseMap = useMemo(() => {
    const map = new Map<string, { name: string; icon?: string }>();
    exercises?.forEach((ex) => {
      map.set(ex.id, { name: ex.name, icon: ex.icon });
    });
    return map;
  }, [exercises]);

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.skeleton} />
      </View>
    );
  }

  const prs = prsData?.latestPRs ?? [];

  if (prs.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons
              name="trophy"
              size={20}
              color={theme.colors.accent}
              style={styles.titleIcon}
            />
            <Text style={styles.title}>Personal Records</Text>
          </View>
        </View>
        <ProgressEmptyState type="no-prs" />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name="trophy"
            size={20}
            color={theme.colors.accent}
            style={styles.titleIcon}
          />
          <Text style={styles.title}>Personal Records</Text>
        </View>
        {onViewAll && prs.length >= limit && (
          <Pressable
            onPress={onViewAll}
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && styles.viewAllButtonPressed
            ]}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.primary}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.prList}>
        {prs.map((pr, index) => {
          const exercise = exerciseMap.get(pr.exerciseId);
          return (
            <PRItem
              key={pr.id}
              pr={pr}
              exerciseName={exercise?.name ?? pr.exerciseId}
              exerciseIcon={exercise?.icon}
              index={index}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  titleIcon: {
    marginRight: theme.spacing.xs
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  viewAllButtonPressed: {
    opacity: 0.7
  },
  viewAllText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  prList: {
    gap: theme.spacing.sm
  },
  skeleton: {
    height: 200,
    backgroundColor: theme.colors.skeleton,
    borderRadius: theme.radius.md
  }
});

