import { useExercises } from "@/hooks";
import { UseWorkoutTimerReturn, WorkoutStep } from "@/hooks/session";
import { Program, ProgramSession } from "@/types";
import { useMemo } from "react";
import { WorkoutExecutionScreen } from "./WorkoutExecutionScreen";

type Props = {
  session: ProgramSession;
  timer: UseWorkoutTimerReturn;
  steps: WorkoutStep[];
  program: Program;
};

export default function ProgramSessionView({
  session,
  timer,
  steps,
  program
}: Props) {
  const { data: exercises } = useExercises();

  const exerciseNameById = useMemo(() => {
    const map = new Map<string, string>();
    (exercises ?? []).forEach((e) => map.set(e.id, e.name));
    return map;
  }, [exercises]);

  return (
    <WorkoutExecutionScreen
      session={session}
      timer={timer}
      steps={steps}
      program={program}
      exerciseNameById={exerciseNameById}
    />
  );
}
