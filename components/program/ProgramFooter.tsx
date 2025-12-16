import { UseWorkoutTimerReturn } from "@/hooks/session";
import { getPhaseInfo } from "@/lib/utils/colors";
import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  timer: UseWorkoutTimerReturn;
};
export default function ProgramFooter({ timer }: Props) {
  const { phaseAccent, phaseBg } = getPhaseInfo(
    timer.phase,
    timer.currentStep?.type
  );

  return (
    <SafeAreaView style={{ ...styles.footer }} edges={["left", "right"]}>
      <View style={{ ...styles.footerContent, backgroundColor: phaseBg }}>
        {timer.phase === "timed" ? (
          <View style={styles.secondaryRow}>
            <Pressable
              onPress={timer.handlePauseResume}
              style={({ pressed }) => [
                styles.secondaryBtnInline,
                pressed && styles.secondaryBtnPressedInline
              ]}
            >
              <Ionicons
                name={timer.isPaused ? "play" : "pause"}
                size={20}
                color={theme.colors.text}
              />
              <Text style={styles.secondaryBtnTextInline}>
                {timer.isPaused ? "Resume" : "Pause"}
              </Text>
            </Pressable>

            <Pressable
              onPress={timer.handleSkip}
              style={({ pressed }) => [
                styles.secondaryBtnInline,
                pressed && styles.secondaryBtnPressedInline
              ]}
            >
              <Ionicons
                name="play-skip-forward"
                size={20}
                color={theme.colors.text}
              />
              <Text style={styles.secondaryBtnTextInline}>Skip timer</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.secondaryRow}>
            <Pressable
              onPress={timer.handleSkip}
              style={({ pressed }) => [
                styles.secondaryBtnInline,
                pressed && styles.secondaryBtnPressedInline
              ]}
            >
              <Ionicons
                name="play-skip-forward"
                size={20}
                color={theme.colors.text}
              />
              <Text style={styles.secondaryBtnTextInline}>Skip</Text>
            </Pressable>

            <Pressable
              onPress={timer.handleComplete}
              style={({ pressed }) => [
                {
                  ...styles.primaryBtnInline,
                  backgroundColor: phaseAccent
                },
                pressed && styles.primaryBtnPressedInline
              ]}
            >
              <Ionicons
                name={
                  timer.currentStep?.type === "exercise"
                    ? "checkmark-circle"
                    : "play"
                }
                size={20}
                color={theme.colors.primaryTextOn}
              />
              <Text style={styles.primaryBtnTextInline}>
                {timer.currentStep?.type === "warmup"
                  ? "Start Warm-up"
                  : timer.currentStep?.type === "rest"
                    ? "Start Rest"
                    : timer.currentStep?.type === "exercise"
                      ? timer.currentStep.durationSeconds
                        ? "Start Timer"
                        : "Complete"
                      : "Continue"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    borderTopLeftRadius: theme.radius.md,
    borderTopRightRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    ...theme.shadows.lg
  },
  footerContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md
  },
  secondaryRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    flexWrap: "nowrap"
  },
  secondaryBtnInline: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full
  },
  secondaryBtnPressedInline: {
    transform: [{ scale: 0.98 }]
  },
  secondaryBtnTextInline: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  primaryBtnInline: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm
  },
  primaryBtnPressedInline: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  primaryBtnTextInline: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  }
});
