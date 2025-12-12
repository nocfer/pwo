import { useChallengeProgress, usePrograms } from "@/hooks/data";
import { haptics } from "@/lib/haptics";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

type Props = {
  label: string;
  programId: string;
};

export default function SwipeableChallengeButton({ label, programId }: Props) {
  const swipeableRef = useRef<Swipeable>(null);
  const { data: programs } = usePrograms();
  const challenge = useMemo(
    () => programs?.find((p) => p.id === programId && p.challengeConfig),
    [programs, programId]
  );
  const { metrics } = useChallengeProgress(challenge || undefined);

  const handleQuickStart = () => {
    void haptics.swipeAction();
    swipeableRef.current?.close();
    // Navigate to the first session
    router.navigate({
      pathname: "/programs/[id]/session/[index]",
      params: { id: programId, index: "1" }
    });
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp"
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: "clamp"
    });

    return (
      <Animated.View style={[styles.rightAction, { opacity }]}>
        <Pressable onPress={handleQuickStart} style={styles.actionButton}>
          <LinearGradient
            colors={[
              theme.colors.gradient.successStart,
              theme.colors.gradient.successEnd
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionGradient}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <Ionicons name="play" size={24} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.actionText}>Start</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed
        ]}
        onPress={() =>
          router.navigate({
            pathname: "/programs/[id]",
            params: { id: programId }
          })
        }
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="barbell-outline"
              size={24}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{label}</Text>
            {metrics && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${metrics.completionPercentage}%`
                      }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {metrics.sessionsCompleted}/{metrics.totalSessions}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.chevronHint}>
          <Ionicons name="chevron-back" size={14} color={theme.colors.muted} />
          <Text style={styles.hintText}>swipe</Text>
        </View>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.md
  },
  buttonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }]
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md
  },
  labelContainer: {
    flex: 1
  },
  label: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xs,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.success,
    borderRadius: theme.radius.xs
  },
  progressText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontSize: 11
  },
  chevronHint: {
    flexDirection: "row",
    alignItems: "center",
    opacity: 0.5
  },
  hintText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginLeft: 2
  },
  rightAction: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginLeft: theme.spacing.sm
  },
  actionButton: {
    borderRadius: theme.radius.lg,
    overflow: "hidden"
  },
  actionGradient: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minWidth: 80
  },
  actionText: {
    ...theme.typography.caption,
    color: "#FFFFFF",
    marginTop: theme.spacing.xs,
    fontFamily: theme.fonts.semiBold
  }
});
