import { ConfettiCelebration, ErrorScreen, LoadingScreen } from "@/components";
import ProgramFooter from "@/components/program/ProgramFooter";
import ProgramSessionView from "@/components/program/ProgramSessionView";
import { useDataActions } from "@/context/DataContext";
import { usePrograms } from "@/hooks/data";
import { useWorkoutSteps } from "@/hooks/session/useWorkoutSteps";
import { useWorkoutTimer } from "@/hooks/session/useWorkoutTimer";
import { getPhaseInfo } from "@/lib/utils/colors";
import { theme } from "@/theme/theme";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

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
    return <LoadingScreen />;
  }

  if (!program || !session) {
    return <ErrorScreen message="Session unavailable." />;
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

      {timer.phase !== "done" && <ProgramFooter timer={timer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  }
});
