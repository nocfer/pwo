import { haptics } from "@/lib/haptics";
import { theme } from "@/theme/theme";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

type ConfettiCelebrationProps = {
  show: boolean;
  onComplete?: () => void;
  message?: string;
  subMessage?: string;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [
  theme.colors.primary,
  theme.colors.success,
  theme.colors.warning,
  "#FF6B6B", // coral
  "#4ECDC4", // teal
  "#FFE66D", // yellow
  "#95E1D3", // mint
];

export function ConfettiCelebration({
  show,
  onComplete,
  message = "Amazing! 🎉",
  subMessage = "You crushed it!",
}: ConfettiCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiRef = useRef<ConfettiCannon | null>(null);

  useEffect(() => {
    if (show) {
      setIsVisible(true);

      // Trigger haptics
      haptics.celebration();

      // Animate message in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after delay
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setIsVisible(false);
          onComplete?.();
        });
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      setIsVisible(false);
    }
  }, [show, fadeAnim, scaleAnim, onComplete]);

  if (!isVisible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Confetti cannons from both sides */}
      <ConfettiCannon
        ref={confettiRef}
        count={80}
        origin={{ x: 0, y: SCREEN_HEIGHT * 0.3 }}
        autoStart={true}
        fadeOut={true}
        fallSpeed={3000}
        explosionSpeed={400}
        colors={CONFETTI_COLORS}
      />
      <ConfettiCannon
        count={80}
        origin={{ x: SCREEN_WIDTH, y: SCREEN_HEIGHT * 0.3 }}
        autoStart={true}
        fadeOut={true}
        fallSpeed={3000}
        explosionSpeed={400}
        colors={CONFETTI_COLORS}
      />

      {/* Celebration message */}
      <Animated.View
        style={[
          styles.messageContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.subMessage}>{subMessage}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  messageContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xxl,
    alignItems: "center",
    ...theme.shadows.lg,
  },
  message: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subMessage: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
});

export default ConfettiCelebration;
