import type { Program } from "@/types";
import { useMemo } from "react";

export type WorkoutStep =
  | { key: string; type: "warmup"; seconds: number }
  | {
      key: string;
      type: "exercise";
      exerciseId: string;
      targetReps?: number;
      durationSeconds?: number;
      note?: string;
    }
  | { key: string; type: "rest"; seconds: number; label?: string };

export function useWorkoutSteps(
  program: Program | null | undefined,
  sessionIndex: number | undefined,
) {
  const session = useMemo(() => {
    if (!program || !sessionIndex) return null;
    return program.sessions.find((s) => s.index === sessionIndex) ?? null;
  }, [program, sessionIndex]);

  const steps = useMemo<WorkoutStep[]>(() => {
    if (!program || !session) return [];
    const list: WorkoutStep[] = [];

    for (const block of session.blocks) {
      if (block.type === "warmup") {
        if (block.seconds > 0)
          list.push({
            key: `warmup-${list.length}`,
            type: "warmup",
            seconds: block.seconds,
          });
        continue;
      }

      if (block.type === "rest") {
        if (block.seconds > 0)
          list.push({
            key: `rest-${list.length}`,
            type: "rest",
            seconds: block.seconds,
            label: block.label,
          });
        continue;
      }

      // exercise block → one step
      list.push({
        key: `ex-${block.exerciseId}-${list.length}`,
        type: "exercise",
        exerciseId: block.exerciseId,
        targetReps: block.targetReps,
        durationSeconds: block.durationSeconds,
        note: block.note,
      });
    }

    return list;
  }, [program, session]);

  return { session, steps } as const;
}
