import type { Program, ProgramBlock } from "@/types";
import { useMemo } from "react";

export type WorkoutStep =
  | { key: string; type: "warmup"; seconds: number }
  | {
      key: string;
      type: "exercise_set";
      exerciseId: string;
      setIndex: number; // 1-based within the block
      totalSets: number;
      reps?: number;
      restSecondsBetweenSets?: number;
    }
  | { key: string; type: "rest"; seconds: number; label?: string };

function getRepsForSet(
  block: Extract<ProgramBlock, { type: "exercise" }>,
  setIndex: number,
): number | undefined {
  const reps = block.repsPerSet;
  if (reps == null) return undefined;
  if (Array.isArray(reps)) return reps[setIndex - 1];
  return reps;
}

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

      // exercise block → explode into per-set steps
      const totalSets = Math.max(1, block.sets);
      for (let i = 1; i <= totalSets; i++) {
        list.push({
          key: `ex-${block.exerciseId}-set-${i}-${list.length}`,
          type: "exercise_set",
          exerciseId: block.exerciseId,
          setIndex: i,
          totalSets,
          reps: getRepsForSet(block, i),
          restSecondsBetweenSets: block.restSecondsBetweenSets,
        });
      }
    }

    return list;
  }, [program, session]);

  return { session, steps } as const;
}
