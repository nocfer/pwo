import { useEffect, useState } from "react";

export type Progress = {
  slug: string;
  streak: (number | boolean | string)[];
};

export function useProgress(slug: string | undefined) {
  const [data, setData] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (!slug) {
          setData(null);
          return;
        }
        const mod = await import("@/assets/data/progress.json");
        if (!isMounted) return;
        const entries = (mod as any).default as Progress[];
        const entry = entries.find((e) => e.slug === slug) ?? null;
        setData(entry);
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
  }, [slug]);

  return { data, loading, error } as const;
}
