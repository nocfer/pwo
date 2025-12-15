import { ConfettiCelebration } from "@/components";
import ProgramFooter from "@/components/program/ProgramFooter";
import ProgramSessionView from "@/components/program/ProgramSessionView";
import { useDataActions } from "@/context/DataContext";
import { usePrograms } from "@/hooks/data";
import { useWorkoutSteps } from "@/hooks/session/useWorkoutSteps";
import { useWorkoutTimer } from "@/hooks/session/useWorkoutTimer";
import { getPhaseInfo } from "@/lib/utils/colors";
import { theme } from "@/theme/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProgramSessionRunner() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const index = Number(params.index);

  const actions = useDataActions();
  const { data: programs, loading: programsLoading } = usePrograms();

  const program = useMemo(
    () => programs?.find((p) => p.id === id) ?? null,
    [programs, id]
  );

  const { session, steps } = useWorkoutSteps(program, index);

  const timer = useWorkoutTimer({
    slug: id,
    program,
    sessionIndex: index,
    steps,
    actions
  });

  if (programsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.muted}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!program || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.muted}>Session unavailable.</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.secondaryBtnPressed
            ]}
          >
            <Text style={styles.secondaryBtnText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const current = timer.currentStep;

  const { phaseBg } = getPhaseInfo(timer.phase, current?.type);

  return (
    <View style={[styles.container, { backgroundColor: phaseBg }]}>
      <ConfettiCelebration
        show={timer.showConfetti}
        onComplete={() => timer.setShowConfetti(false)}
        message="Session Complete!"
        subMessage="Nice work."
      />

      <ProgramSessionView
        program={program}
        session={session}
        steps={steps}
        timer={timer}
      />

      {/* Bottom controls */}
      {timer.phase !== "done" && <ProgramFooter timer={timer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { ...theme.typography.body, color: theme.colors.muted },

  secondaryBtn: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  secondaryBtnPressed: { backgroundColor: theme.colors.card },
  secondaryBtnText: { ...theme.typography.bodyBold, color: theme.colors.text }
});
