import type { Session } from "@/types";
import { useMemo } from "react";

export type Step =
  | { key: string; type: "warmup" }
  | { key: string; type: "set"; set: number; reps: number }
  | { key: string; type: "break"; afterSet: number };

export function useSessionSteps(
  warmUpSeconds: number,
  breakSeconds: number,
  session: Session | null | undefined,
  phase: "warmup" | "working" | "break" | "done",
  currentSet: number
) {
  const steps = useMemo<Step[]>(() => {
    const list: Step[] = [];
    if (warmUpSeconds > 0) list.push({ key: "warmup", type: "warmup" });
    const totalSets = session?.sets.length ?? 0;
    for (let i = 1; i <= totalSets; i++) {
      list.push({
        key: `set-${i}`,
        type: "set",
        set: i,
        reps: session?.sets[i - 1] ?? 0
      });
      if (breakSeconds > 0 && i < totalSets)
        list.push({ key: `break-${i}`, type: "break", afterSet: i });
    }
    return list;
  }, [session, warmUpSeconds, breakSeconds]);

  const currentStepIndex = useMemo(() => {
    if (!session) return 0;
    const hasWarmup = warmUpSeconds > 0;
    const withBreaks = breakSeconds > 0;
    if (phase === "warmup") return 0;
    const offset = hasWarmup ? 1 : 0;
    if (phase === "working") {
      const blocksPerSet = 1 + (withBreaks ? 1 : 0);
      return offset + (currentSet - 1) * blocksPerSet;
    }
    if (phase === "break") {
      const blocksPerSet = 1 + (withBreaks ? 1 : 0);
      return offset + (currentSet - 1) * blocksPerSet + 1;
    }
    return steps.length;
  }, [phase, currentSet, breakSeconds, warmUpSeconds, session, steps]);

  const totals = useMemo(() => {
    const totalSets = session?.sets.length ?? 0;
    let completedSets = 0;
    if (phase === "done") completedSets = totalSets;
    else if (phase === "break") completedSets = Math.min(currentSet, totalSets);
    else if (phase === "working") completedSets = Math.max(0, currentSet - 1);
    else completedSets = 0;
    return { totalSets, completedSets };
  }, [session, phase, currentSet]);

  return {
    steps,
    currentStepIndex,
    totalSteps: steps.length,
    ...totals
  } as const;
}
