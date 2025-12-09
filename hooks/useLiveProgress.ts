import { loadStreak } from "@/lib/persistPlatform";
import { useEffect, useState } from "react";

export type LiveProgress = {
  slug: string;
  streak: number[];
};

export function useLiveProgress(slug: string | undefined, refreshKey: number = 0) {
  const [data, setData] = useState<LiveProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!slug) {
          if (mounted) setData(null);
          return;
        }
        const streak = await loadStreak(slug);
        if (!mounted) return;
        if (streak) setData({ slug, streak }); else setData(null);
      } catch (e) {
        if (mounted) setError(e as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug, refreshKey]);

  return { data, loading, error } as const;
}
