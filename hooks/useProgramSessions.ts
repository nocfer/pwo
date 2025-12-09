import { useEffect, useMemo, useState } from "react";

export type Program = {
  id: number;
  slug: string;
  exercise: {
    name: string;
    warmUp?: number; // seconds
    break?: number; // seconds between sets
    sets: number; // fixed 5 in our case
    reps?: number[]; // optional baseline
  };
};

export type Session = {
  index: number; // 1-based
  totalReps: number;
  sets: number[]; // length = program.exercise.sets
};

function distributeIntoSets(total: number, sets: number): number[] {
  const base = Math.floor(total / sets);
  const remainder = total - base * sets;
  const arr = Array.from({ length: sets }, (_, i) => base + (i < remainder ? 1 : 0));
  return arr;
}

export function useProgramSessions(slug: string) {
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import("@/assets/data/programs.json");
        if (!mounted) return;
        const programs = (mod as any).default as Program[];
        const p = programs.find((x) => x.slug === slug) ?? null;
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
    if (!program) return [];
    // Generate sessions: from 10 total reps to 100, +10% per session
    const result: Session[] = [];
    const sets = program.exercise.sets || 5;
    let total = 10;
    let i = 1;
    while (total <= 100) {
      const rounded = Math.max(1, Math.round(total));
      const dist = distributeIntoSets(rounded, sets);
      result.push({ index: i, totalReps: rounded, sets: dist });
      i += 1;
      total = total * 1.1;
    }
    // Ensure last session is exactly 100 if we overshot slightly
    const last = result[result.length - 1];
    if (last && last.totalReps !== 100) {
      const dist = distributeIntoSets(100, sets);
      result.push({ index: i, totalReps: 100, sets: dist });
    }
    return result;
  }, [program]);

  return { program, sessions, loading, error } as const;
}
