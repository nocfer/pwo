import { useEffect, useState } from "react";
import { WorkoutPhase } from "./useWorkoutTimer";

export default function useProgramSessionTimer({
  phase
}: {
  phase: WorkoutPhase;
}) {
  const [sessionTimer, setSessionTimer] = useState(0);

  useEffect(() => {
    if (phase === "done") {
      return;
    }
    setTimeout(() => setSessionTimer(sessionTimer + 1), 1000);
  }, [phase, sessionTimer]);

  return { sessionTimer };
}
