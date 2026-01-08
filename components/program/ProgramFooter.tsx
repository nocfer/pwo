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
  const { phaseAccent } = getPhaseInfo(timer.phase, timer.currentStep?.type);
  const current = timer.currentStep;

  const getActionLabel = (): string => {
    if (!current) return "Continue";

    if (current.type === "warmup") return "Start Warmup";
    if (current.type === "rest") return "Start Rest";
    if (current.type === "exercise") {
      if (current.durationSeconds) return "Start Timer";
      if (current.totalSets && current.totalSets > 1) {
        return `Complete Set ${current.setNumber}`;
      }
      return "Complete";
    }
    return "Continue";
  };

  const getActionIcon = (): keyof typeof Ionicons.glyphMap => {
    if (!current) return "play";
    if (current.type === "exercise" && !current.durationSeconds)
      return "checkmark";
    return "play";
  };

  // Timer running state - show pause/resume and skip
  if (timer.phase === "timed") {
    return (
      <SafeAreaView style={styles.footer} edges={["bottom"]}>
        <View style={styles.footerContent}>
          <View style={styles.buttonRow}>
            <Pressable
              onPress={timer.handlePauseResume}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.btnPressed
              ]}
            >
              <Ionicons
                name={timer.isPaused ? "play" : "pause"}
                size={22}
                color={theme.colors.text}
              />
              <Text style={styles.secondaryBtnText}>
                {timer.isPaused ? "Resume" : "Pause"}
              </Text>
            </Pressable>

            <Pressable
              onPress={timer.handleSkip}
              style={({ pressed }) => [
                styles.ghostBtn,
                pressed && styles.btnPressed
              ]}
            >
              <Ionicons
                name="play-skip-forward"
                size={20}
                color={theme.colors.subtext}
              />
              <Text style={styles.ghostBtnText}>Skip</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Default state - show skip and primary action
  return (
    <SafeAreaView style={styles.footer} edges={["bottom"]}>
      <View style={styles.footerContent}>
        <View style={styles.buttonRow}>
          <Pressable
            onPress={timer.handleSkip}
            style={({ pressed }) => [
              styles.ghostBtn,
              pressed && styles.btnPressed
            ]}
          >
            <Ionicons
              name="play-skip-forward"
              size={20}
              color={theme.colors.subtext}
            />
            <Text style={styles.ghostBtnText}>Skip</Text>
          </Pressable>

          <Pressable
            onPress={timer.handleComplete}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: phaseAccent },
              pressed && styles.primaryBtnPressed
            ]}
          >
            <Ionicons
              name={getActionIcon()}
              size={22}
              color={theme.colors.primaryTextOn}
            />
            <Text style={styles.primaryBtnText}>{getActionLabel()}</Text>
          </Pressable>
        </View>
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
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.lg
  },
  footerContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md
  },
  primaryBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary
  },
  primaryBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  primaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  secondaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  ghostBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    height: 52,
    borderRadius: theme.radius.md
  },
  ghostBtnText: {
    ...theme.typography.body,
    color: theme.colors.subtext
  },
  btnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }]
  }
});
