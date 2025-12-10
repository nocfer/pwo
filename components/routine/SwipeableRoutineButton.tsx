import haptics from "@/lib/haptics";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

type Props = {
  label: string;
  slug: string;
};

export default function SwipeableRoutineButton({ label, slug }: Props) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleQuickStart = () => {
    void haptics.swipeAction();
    swipeableRef.current?.close();
    // Navigate to the first session
    router.navigate({
      pathname: "/routines/[slug]/session/[index]",
      params: { slug, index: "1" },
    });
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={[styles.rightAction, { opacity }]}>
        <Pressable onPress={handleQuickStart} style={styles.actionButton}>
          <LinearGradient
            colors={[theme.colors.gradient.successStart, theme.colors.gradient.successEnd]}
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
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() =>
          router.navigate({
            pathname: "/routines/[slug]",
            params: { slug },
          })
        }
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="barbell-outline" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.label}>{label}</Text>
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
    ...theme.shadows.md,
  },
  buttonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  label: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flex: 1,
  },
  chevronHint: {
    flexDirection: "row",
    alignItems: "center",
    opacity: 0.5,
  },
  hintText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginLeft: 2,
  },
  rightAction: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginLeft: theme.spacing.sm,
  },
  actionButton: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  actionGradient: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minWidth: 80,
  },
  actionText: {
    ...theme.typography.caption,
    color: "#FFFFFF",
    marginTop: theme.spacing.xs,
    fontFamily: theme.fonts.semiBold,
  },
});
