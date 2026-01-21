import { ConfettiCelebration, ErrorScreen, LoadingScreen } from "@/components";
import ProgramSessionView from "@/components/program/ProgramSessionView";
import { useDataActions } from "@/context/DataContext";
import { usePrograms } from "@/hooks/data";
import { useStepCompletion } from "@/hooks/session";
import { useWorkoutSteps } from "@/hooks/session/useWorkoutSteps";
import { useWorkoutTimer } from "@/hooks/session/useWorkoutTimer";
import { theme } from "@/theme/theme";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function ProgramSessionRunner() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const index = Number(params.index);

  const actions = useDataActions();
  const { data: programs, loading: programsLoading } = usePrograms();
  const [showSafeguardAlert, setShowSafeguardAlert] = useState(false);

  const program = useMemo(
    () => programs?.find((p) => p.id === id) ?? null,
    [programs, id]
  );

  const { session, steps } = useWorkoutSteps(program, index);

  // Step completion tracking - lifted here so it can be shared with useWorkoutTimer
  const stepCompletion = useStepCompletion(id, index, steps.length);

  // Find first skipped step for the safeguard navigation
  const findFirstSkippedStep = useCallback(() => {
    for (let i = 0; i < steps.length; i++) {
      if (
        steps[i]?.type === "exercise" &&
        stepCompletion.getStepStatus(i) === "skipped"
      ) {
        return i;
      }
    }
    return 0;
  }, [steps, stepCompletion]);

  // Ref to hold the timer for safeguard callback
  const timerRef = useRef<ReturnType<typeof useWorkoutTimer> | null>(null);

  // Handle session completion safeguard (when skipped exercises exist)
  const handleSessionSafeguard = useCallback(() => {
    setShowSafeguardAlert(true);
  }, []);

  const timer = useWorkoutTimer({
    slug: id,
    program,
    sessionIndex: index,
    steps,
    actions,
    getStepStatus: stepCompletion.getStepStatus,
    onSessionSafeguard: handleSessionSafeguard
  });

  // Keep timer ref in sync
  timerRef.current = timer;

  // Show alert when safeguard is triggered
  useEffect(() => {
    if (!showSafeguardAlert) return;

    Alert.alert(
      "Skipped Exercises",
      "You've skipped other exercises in this session. Do you want to finish anyway or go back and complete them?",
      [
        {
          text: "Finish Session",
          onPress: () => {
            // Force complete the session
            timerRef.current?.setShowConfetti(true);
            void actions.completeSession(
              id,
              index,
              `${program?.name ?? id} · Session ${index}`,
              timerRef.current?.sessionElapsedSeconds
            );
            setShowSafeguardAlert(false);
          }
        },
        {
          text: "Go to First Skipped",
          onPress: () => {
            const firstSkipped = findFirstSkippedStep();
            timerRef.current?.goToStep(firstSkipped);
            setShowSafeguardAlert(false);
          },
          style: "cancel"
        }
      ],
      { cancelable: false }
    );
  }, [
    showSafeguardAlert,
    actions,
    id,
    index,
    program?.name,
    findFirstSkippedStep
  ]);

  if (programsLoading) {
    return <LoadingScreen />;
  }

  if (!program || !session) {
    return <ErrorScreen message="Session unavailable." />;
  }

  return (
    <View style={styles.container}>
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
        stepCompletion={stepCompletion}
        onProgramUpdate={async (updatedProgram) => {
          await actions.upsertProgram(updatedProgram);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  }
});
