/**
 * Progress Tab - Redesigned
 *
 * Shows key fitness metrics:
 * 1. Weekly Summary (hero card with ring chart)
 * 2. Consistency Heatmap (12-week activity grid)
 * 3. Personal Records (recent PRs with badges)
 * 4. Exercise Progression (line chart with selector)
 */

import {
  ConsistencyHeatmap,
  ExerciseProgressionChart,
  PersonalRecordsCard,
  WeeklySummaryCard
} from "@/components";
import { haptics } from "@/lib/haptics";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProgressScreen() {
  const [refreshing, setRefreshing] = useState(false);

  // Staggered animation refs for sections
  const section1Anim = useRef(new Animated.Value(0)).current;
  const section2Anim = useRef(new Animated.Value(0)).current;
  const section3Anim = useRef(new Animated.Value(0)).current;
  const section4Anim = useRef(new Animated.Value(0)).current;

  // Run staggered entrance animation
  const animateSections = useCallback(() => {
    Animated.stagger(100, [
      Animated.timing(section1Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(section2Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(section3Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(section4Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  }, [section1Anim, section2Anim, section3Anim, section4Anim]);

  // Trigger animation on mount
  useState(() => {
    animateSections();
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    void haptics.refresh();

    // Reset animations
    section1Anim.setValue(0);
    section2Anim.setValue(0);
    section3Anim.setValue(0);
    section4Anim.setValue(0);

    await new Promise((resolve) => setTimeout(resolve, 500));

    setRefreshing(false);
    animateSections();
  }, [animateSections, section1Anim, section2Anim, section3Anim, section4Anim]);

  const handleStartWorkout = useCallback(() => {
    router.push("/(tabs)");
  }, []);

  const handleViewAllPRs = useCallback(() => {
    router.push("/(tabs)/analytics");
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Progress</Text>
              <Text style={styles.subtitle}>Your fitness journey</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.analyticsButton,
                pressed && styles.analyticsButtonPressed
              ]}
              onPress={() => router.push("/(tabs)/analytics")}
            >
              <Ionicons
                name="analytics-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.analyticsButtonText}>Analytics</Text>
            </Pressable>
          </View>
        </View>

        {/* Section 1: Weekly Summary */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: section1Anim,
              transform: [
                {
                  translateY: section1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }
              ]
            }
          ]}
        >
          <WeeklySummaryCard onStartWorkout={handleStartWorkout} />
        </Animated.View>

        {/* Section 2: Consistency Heatmap */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: section2Anim,
              transform: [
                {
                  translateY: section2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }
              ]
            }
          ]}
        >
          <ConsistencyHeatmap weeks={8} />
        </Animated.View>

        {/* Section 3: Personal Records */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: section3Anim,
              transform: [
                {
                  translateY: section3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }
              ]
            }
          ]}
        >
          <PersonalRecordsCard limit={3} onViewAll={handleViewAllPRs} />
        </Animated.View>

        {/* Section 4: Exercise Progression */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: section4Anim,
              transform: [
                {
                  translateY: section4Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }
              ]
            }
          ]}
        >
          <ExerciseProgressionChart />
        </Animated.View>
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
    paddingBottom: theme.spacing.xxl * 2
  },
  header: {
    marginBottom: theme.spacing.lg
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted
  },
  analyticsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm
  },
  analyticsButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }]
  },
  analyticsButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  },
  section: {
    marginBottom: theme.spacing.lg
  }
});
