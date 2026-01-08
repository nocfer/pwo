/**
 * Progress Tab - Shows key fitness metrics
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

  const section1Anim = useRef(new Animated.Value(0)).current;
  const section2Anim = useRef(new Animated.Value(0)).current;
  const section3Anim = useRef(new Animated.Value(0)).current;
  const section4Anim = useRef(new Animated.Value(0)).current;

  const animateSections = useCallback(() => {
    Animated.stagger(80, [
      Animated.timing(section1Anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(section2Anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(section3Anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(section4Anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      })
    ]).start();
  }, [section1Anim, section2Anim, section3Anim, section4Anim]);

  useState(() => {
    animateSections();
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    void haptics.refresh();

    section1Anim.setValue(0);
    section2Anim.setValue(0);
    section3Anim.setValue(0);
    section4Anim.setValue(0);

    await new Promise((resolve) => setTimeout(resolve, 400));

    setRefreshing(false);
    animateSections();
  }, [animateSections, section1Anim, section2Anim, section3Anim, section4Anim]);

  const handleStartWorkout = useCallback(() => {
    router.push("/(tabs)");
  }, []);

  const handleViewAllPRs = useCallback(() => {
    router.push("/(tabs)/analytics");
  }, []);

  const createAnimatedStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0]
        })
      }
    ]
  });

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <ScrollView
        style={styles.scrollView}
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
            <View style={styles.headerText}>
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
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.analyticsButtonText}>Analytics</Text>
            </Pressable>
          </View>
        </View>

        {/* Weekly Summary */}
        <Animated.View
          style={[styles.section, createAnimatedStyle(section1Anim)]}
        >
          <WeeklySummaryCard onStartWorkout={handleStartWorkout} />
        </Animated.View>

        {/* Consistency Heatmap */}
        <Animated.View
          style={[styles.section, createAnimatedStyle(section2Anim)]}
        >
          <ConsistencyHeatmap weeks={8} />
        </Animated.View>

        {/* Personal Records */}
        <Animated.View
          style={[styles.section, createAnimatedStyle(section3Anim)]}
        >
          <PersonalRecordsCard limit={3} onViewAll={handleViewAllPRs} />
        </Animated.View>

        {/* Exercise Progression */}
        <Animated.View
          style={[styles.section, createAnimatedStyle(section4Anim)]}
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
  scrollView: {
    flex: 1
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2
  },
  header: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerText: {
    flex: 1
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
    borderRadius: theme.radius.md
  },
  analyticsButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }]
  },
  analyticsButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
    fontSize: 14
  },
  section: {
    marginTop: theme.spacing.lg
  }
});
