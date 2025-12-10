import type { Routine, Session } from "@/types";
import { useEffect, useMemo, useState } from "react";

// Re-export types for backwards compatibility
export type { Program, Session } from "@/types";

function distributeIntoSets(total: number, sets: number): number[] {
  const base = Math.floor(total / sets);
  const remainder = total - base * sets;
  const arr = Array.from(
    { length: sets },
    (_, i) => base + (i < remainder ? 1 : 0),
  );
  return arr;
}

export function useProgramSessions(slug: string) {
  const [program, setProgram] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import("@/assets/data/routines.json");
        if (!mounted) return;
        const routines = (mod as any).default as Routine[];
        const p = routines.find((x) => x.slug === slug) ?? null;
        setProgram(p);
      } catch (e) {
        if (!mounted) return;
        setError(e as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const sessions: Session[] = useMemo(() => {
    if (!program || !program.exercise) return [];
    // Generate sessions: from 10 total reps to targetReps, +10% per session
    const result: Session[] = [];
    const sets = program.exercise.sets || 5;
    const targetReps = program.exercise.targetReps || 100;
    let total = 10;
    let i = 1;
    while (total <= targetReps) {
      const rounded = Math.max(1, Math.round(total));
      const dist = distributeIntoSets(rounded, sets);
      result.push({ index: i, totalReps: rounded, sets: dist });
      i += 1;
      total = total * 1.1;
    }
    // Ensure last session is exactly targetReps if we overshot slightly
    const last = result[result.length - 1];
    if (last && last.totalReps !== targetReps) {
      const dist = distributeIntoSets(targetReps, sets);
      result.push({ index: i, totalReps: targetReps, sets: dist });
    }
    return result;
  }, [program]);

  return { program, sessions, loading, error } as const;
}
