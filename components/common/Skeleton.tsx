import { theme } from "@/theme/theme";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

type SkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = theme.radius.sm,
  style,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

// Pre-built skeleton variants
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={40} height={40} borderRadius={theme.radius.sm} />
        <View style={styles.cardHeaderText}>
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton height={14} style={{ marginTop: theme.spacing.md }} />
      <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
    </View>
  );
}

export function SkeletonChallengeButton() {
  return (
    <View style={styles.routineButton}>
      <View style={styles.routineButtonContent}>
        <Skeleton width={44} height={44} borderRadius={theme.radius.md} />
        <Skeleton
          width={140}
          height={18}
          style={{ marginLeft: theme.spacing.md }}
        />
      </View>
      <Skeleton width={20} height={20} borderRadius={theme.radius.sm} />
    </View>
  );
}

export function SkeletonSessionCard() {
  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionTitleRow}>
          <Skeleton width={28} height={28} borderRadius={theme.radius.sm} />
          <Skeleton
            width={100}
            height={16}
            style={{ marginLeft: theme.spacing.sm }}
          />
        </View>
        <Skeleton width={60} height={24} borderRadius={theme.radius.sm} />
      </View>
      <Skeleton
        width={120}
        height={12}
        style={{ marginTop: theme.spacing.sm }}
      />
      <View style={styles.pillRow}>
        <Skeleton width={50} height={28} borderRadius={theme.radius.sm} />
        <Skeleton width={50} height={28} borderRadius={theme.radius.sm} />
        <Skeleton width={50} height={28} borderRadius={theme.radius.sm} />
      </View>
    </View>
  );
}

export function SkeletonStreakDots() {
  return (
    <View style={styles.streakContainer}>
      <View style={styles.streakRow}>
        {[...Array(7)].map((_, i) => (
          <View key={i} style={styles.dayContainer}>
            <Skeleton width={36} height={36} borderRadius={theme.radius.md} />
            <Skeleton
              width={12}
              height={10}
              style={{ marginTop: 4 }}
              borderRadius={4}
            />
          </View>
        ))}
      </View>
      <Skeleton
        width={80}
        height={12}
        style={{ marginTop: theme.spacing.md }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.skeleton,
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
  gradient: {
    flex: 1,
    width: 200,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  routineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  routineButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pillRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  streakContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  streakRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  dayContainer: {
    alignItems: "center",
  },
});

export default Skeleton;
