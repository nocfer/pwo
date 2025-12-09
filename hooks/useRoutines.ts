import { useEffect, useState } from "react";

export type Routine = {
  name: string;
  slug: string;
  // extend as needed later
};

export function useRoutines() {
  const [data, setData] = useState<Routine[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const mod = await import("@/assets/data/routines.json");
        if (!isMounted) return;
        setData((mod as any).default as Routine[]);
      } catch (e) {
        if (!isMounted) return;
        setError(e as Error);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error } as const;
}
