import { ProgramProgressMetrics } from "@/hooks/data";
import { theme } from "@/theme/theme";
import { Program } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnimatedCard } from "../common";
import { ProgressCard } from "../progress";

type Props = { program: Program; programMetrics: ProgramProgressMetrics };

export default function ProgramView({ program, programMetrics }: Props) {
  return (
    <>
      <AnimatedCard>
        <View style={styles.card}>
          <ProgressCard
            title={program.name}
            completionPercentage={programMetrics.completionPercentage}
            sessionsCompleted={programMetrics.sessionsCompleted}
            totalSessions={programMetrics.totalSessions}
            variant="program"
          />
        </View>
      </AnimatedCard>

      <Pressable
        onPress={() =>
          router.navigate({
            pathname: "/programs/[id]/session/[index]",
            params: {
              id: program.id,
              index: String(1)
            }
          })
        }
        style={({ pressed }) => [
          styles.primaryBtn,
          pressed && styles.primaryBtnPressed,
          styles.primaryBtnDisabled
        ]}
      >
        <Ionicons
          name="play"
          size={20}
          color={theme.colors.primaryTextOn}
          style={{ marginRight: theme.spacing.sm }}
        />
        <Text style={styles.primaryBtnText}>Start</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  muted: { ...theme.typography.caption, color: theme.colors.muted },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    ...theme.shadows.md
  },
  primaryBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  }
});
