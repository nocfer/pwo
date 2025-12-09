import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useState } from "react";

export type HistoryEntry = { date: string; summary: string };

export function useLiveHistory(slug: string | undefined, refreshKey: number = 0) {
  const [data, setData] = useState<HistoryEntry[] | null>(null);
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
        // read live history file
        const fsAny: any = FileSystem as any;
        const base = fsAny.documentDirectory || fsAny.cacheDirectory || "";
        const livePath = `${base}history.json`;
        let live: HistoryEntry[] = [];
        const info = await FileSystem.getInfoAsync(livePath);
        if (info.exists) {
          const raw = await FileSystem.readAsStringAsync(livePath);
          const arr = raw ? (JSON.parse(raw) as { slug: string; recent: HistoryEntry[] }[]) : [];
          const entry = arr.find((e) => e.slug === slug);
          if (entry) live = entry.recent;
        }
        // read asset history as fallback/merge
        let asset: HistoryEntry[] = [];
        try {
          const hmod = await import("@/assets/data/history.json");
          const aentry = (hmod as any).default.find((e: any) => e.slug === slug);
          asset = aentry?.recent ?? [];
        } catch {}
        // merge: live first, then any asset entries not duplicated
        const byKey = new Set(live.map((e) => `${e.date}-${e.summary}`));
        const merged = [...live, ...asset.filter((e) => !byKey.has(`${e.date}-${e.summary}`))];
        // sort desc by date
        merged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
        if (mounted) setData(merged);
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
