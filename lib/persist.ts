import * as FileSystem from "expo-file-system/legacy";

const FS_ANY = FileSystem as any;
const DIR: string = FS_ANY.documentDirectory || FS_ANY.cacheDirectory || "";

async function ensureFile(path: string, seed: any) {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      await FileSystem.writeAsStringAsync(path, JSON.stringify(seed, null, 2));
    }
  } catch {
    // best effort
  }
}

export type SessionState = {
  slug: string;
  sessionIndex: number;
  phase: "warmup" | "working" | "break" | "done";
  currentSet: number;
  timer: number;
  isPaused: boolean;
  warmupDone: boolean;
};

export async function loadSessionState(slug: string, sessionIndex: number): Promise<SessionState | null> {
  const path = `${DIR}sessions-state.json`;
  await ensureFile(path, []);
  const raw = await FileSystem.readAsStringAsync(path);
  const arr = JSON.parse(raw || "[]") as SessionState[];
  return arr.find((s) => s.slug === slug && s.sessionIndex === sessionIndex) || null;
}

export async function saveSessionState(state: SessionState) {
  const path = `${DIR}sessions-state.json`;
  await ensureFile(path, []);
  const raw = await FileSystem.readAsStringAsync(path);
  const arr = (raw ? JSON.parse(raw) : []) as SessionState[];
  const idx = arr.findIndex((s) => s.slug === state.slug && s.sessionIndex === state.sessionIndex);
  if (idx >= 0) arr[idx] = state; else arr.push(state);
  await FileSystem.writeAsStringAsync(path, JSON.stringify(arr, null, 2));
}

export type EventRecord = {
  ts: string; // ISO string
  slug: string;
  sessionIndex: number;
  type:
    | "warmup_started"
    | "warmup_paused"
    | "warmup_resumed"
    | "warmup_skipped"
    | "warmup_completed"
    | "set_completed"
    | "break_started"
    | "break_paused"
    | "break_resumed"
    | "break_skipped"
    | "break_completed"
    | "session_completed";
  data?: Record<string, any>;
};

export async function appendEvent(event: Omit<EventRecord, "ts"> & { ts?: string }) {
  const path = `${DIR}events.json`;
  await ensureFile(path, []);
  const raw = await FileSystem.readAsStringAsync(path);
  const arr = (raw ? JSON.parse(raw) : []) as EventRecord[];
  arr.push({ ...event, ts: event.ts ?? new Date().toISOString() });
  await FileSystem.writeAsStringAsync(path, JSON.stringify(arr, null, 2));
}

export type HistoryEntry = { date: string; summary: string };
export type HistoryFile = { slug: string; recent: HistoryEntry[] }[];

export async function appendHistory(slug: string, entry: HistoryEntry) {
  const path = `${DIR}history.json`;
  await ensureFile(path, []);
  const raw = await FileSystem.readAsStringAsync(path);
  const arr = (raw ? JSON.parse(raw) : []) as HistoryFile;
  const idx = arr.findIndex((h) => h.slug === slug);
  if (idx >= 0) {
    arr[idx].recent.unshift(entry);
  } else {
    arr.push({ slug, recent: [entry] });
  }
  await FileSystem.writeAsStringAsync(path, JSON.stringify(arr, null, 2));
}
