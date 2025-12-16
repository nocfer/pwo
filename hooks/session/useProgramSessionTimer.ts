import { useEffect, useRef, useState } from "react";
import { WorkoutPhase } from "./useWorkoutTimer";

export default function useProgramSessionTimer({
  phase,
  initialElapsedSeconds = 0
}: {
  phase: WorkoutPhase;
  initialElapsedSeconds?: number;
}) {
  const [sessionTimer, setSessionTimer] = useState(initialElapsedSeconds);
  const initializedRef = useRef(false);

  // Update timer when initial value changes (e.g., state restored from storage)
  useEffect(() => {
    if (!initializedRef.current && initialElapsedSeconds > 0) {
      setSessionTimer(initialElapsedSeconds);
      initializedRef.current = true;
    }
  }, [initialElapsedSeconds]);

  // Timer runs for full session duration, stops only when done
  const running = phase !== "done";

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setSessionTimer((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  return { sessionTimer };
}
