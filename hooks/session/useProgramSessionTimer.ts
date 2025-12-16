import { useEffect, useState } from "react";
import { WorkoutPhase } from "./useWorkoutTimer";

export default function useProgramSessionTimer({
  phase
}: {
  phase: WorkoutPhase;
}) {
  const [sessionTimer, setSessionTimer] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    // Start global timer when warmup begins
    if (phase === "timed" && !running) {
      setRunning(true);
    }

    // Stop global timer when session is done
    if (phase === "done") {
      setRunning(false);
    }
  }, [phase, running]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setSessionTimer((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  return { sessionTimer };
}
