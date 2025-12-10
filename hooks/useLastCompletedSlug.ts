import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

type Event = { ts: string; slug: string; sessionIndex: number; type: string };

export function useLastCompletedSlug() {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let events: Event[] = [];
        if (Platform.OS === "web") {
          const raw = typeof window !== "undefined" ? window.localStorage.getItem("persist.events") : null;
          events = raw ? (JSON.parse(raw) as Event[]) : [];
        } else {
          const fs: any = FileSystem as any;
          const base = fs.documentDirectory || fs.cacheDirectory || "";
          const path = `${base}events.json`;
          const info = await FileSystem.getInfoAsync(path);
          if (!info.exists) {
            if (mounted) setSlug(null);
            return;
          }
          const raw = await FileSystem.readAsStringAsync(path);
          events = raw ? JSON.parse(raw) : [];
        }
        // find last session_completed
        const last = [...events].reverse().find((e) => e.type === "session_completed");
        if (mounted) setSlug(last?.slug ?? null);
      } catch {
        if (mounted) setSlug(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return slug;
}
