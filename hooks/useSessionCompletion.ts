import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export function useSessionCompletion(slug: string | undefined, refreshKey: number = 0) {
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!slug) {
          if (mounted) setCompleted(new Set());
          return;
        }
        let events: { slug: string; sessionIndex: number; type: string; ts: string }[] = [];
        if (Platform.OS === "web") {
          const raw = typeof window !== "undefined" ? window.localStorage.getItem("persist.events") : null;
          events = raw ? (JSON.parse(raw) as { slug: string; sessionIndex: number; type: string; ts: string }[]) : [];
        } else {
          const dir: any = FileSystem as any;
          const base = (dir.documentDirectory || dir.cacheDirectory || "");
          const path = `${base}events.json`;
          const info = await FileSystem.getInfoAsync(path);
          if (!info.exists) {
            if (mounted) setCompleted(new Set());
            return;
          }
          const raw = await FileSystem.readAsStringAsync(path);
          events = raw ? (JSON.parse(raw) as { slug: string; sessionIndex: number; type: string; ts: string }[]) : [];
        }
        const done = new Set<number>();
        for (const e of events) {
          if (e.slug === slug && e.type === "session_completed") {
            done.add(e.sessionIndex);
          }
        }
        if (mounted) setCompleted(done);
      } catch (e) {
        if (mounted) setError(e as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    }
  }, [slug, refreshKey]);

  return { completed, loading, error } as const;
}
