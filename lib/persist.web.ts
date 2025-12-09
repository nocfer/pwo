// Web-specific persistence using localStorage (Expo web)
// Mirrors the API of persist.ts for native platforms

export type SessionState = {
  slug: string;
  sessionIndex: number;
  phase: "warmup" | "working" | "break" | "done";
  currentSet: number;
  timer: number;
  isPaused: boolean;
  warmupDone: boolean;
};

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

export type HistoryEntry = { date: string; summary: string };
export type HistoryFile = { slug: string; recent: HistoryEntry[] }[];

export type StreakEntry = { slug: string; streak: number[]; updatedAt: string };

const K_SESSIONS = "persist.sessionsState";
const K_EVENTS = "persist.events";
const K_HISTORY = "persist.history";
const K_PROGRESS = "persist.progressState";

function readArray<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, arr: T[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(arr, null, 2));
  } catch {}
}

export async function loadSessionState(slug: string, sessionIndex: number): Promise<SessionState | null> {
  const arr = readArray<SessionState>(K_SESSIONS);
  return arr.find((s) => s.slug === slug && s.sessionIndex === sessionIndex) || null;
}

export async function saveSessionState(state: SessionState) {
  const arr = readArray<SessionState>(K_SESSIONS);
  const idx = arr.findIndex((s) => s.slug === state.slug && s.sessionIndex === state.sessionIndex);
  if (idx >= 0) arr[idx] = state; else arr.push(state);
  writeArray(K_SESSIONS, arr);
}

export async function appendEvent(event: Omit<EventRecord, "ts"> & { ts?: string }) {
  const arr = readArray<EventRecord>(K_EVENTS);
  arr.push({ ...event, ts: event.ts ?? new Date().toISOString() });
  writeArray(K_EVENTS, arr);
}

export async function appendHistory(slug: string, entry: HistoryEntry) {
  const arr = readArray<HistoryFile[number]>(K_HISTORY);
  const idx = arr.findIndex((h) => h.slug === slug);
  if (idx >= 0) arr[idx].recent.unshift(entry); else arr.push({ slug, recent: [entry] });
  writeArray(K_HISTORY, arr);
}

function daysBetween(a: Date, b: Date) {
  const MS = 24 * 60 * 60 * 1000;
  const ad = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bd = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bd.getTime() - ad.getTime()) / MS);
}

function normalizeStreak(streak: number[], daysDiff: number) {
  const base = streak.slice(-7);
  let shifted = base;
  if (daysDiff > 0) shifted = [...base, ...Array(daysDiff).fill(0)];
  return shifted.slice(-7);
}

export async function saveStreakHit(slug: string, dateISO: string) {
  const arr = readArray<StreakEntry>(K_PROGRESS);
  const idx = arr.findIndex((e) => e.slug === slug);
  const today = new Date(dateISO);
  if (idx < 0) {
    const streak = Array(6).fill(0).concat(1);
    arr.push({ slug, streak, updatedAt: today.toISOString() });
  } else {
    const entry = arr[idx];
    const last = new Date(entry.updatedAt);
    const diff = daysBetween(last, today);
    const normalized = normalizeStreak(entry.streak, diff);
    normalized[normalized.length - 1] = 1;
    arr[idx] = { slug, streak: normalized, updatedAt: today.toISOString() };
  }
  writeArray(K_PROGRESS, arr);
}

export async function loadStreak(slug: string): Promise<number[] | null> {
  const arr = readArray<StreakEntry>(K_PROGRESS);
  const entry = arr.find((e) => e.slug === slug);
  if (!entry) return null;
  const today = new Date();
  const last = new Date(entry.updatedAt);
  const diff = daysBetween(last, today);
  return normalizeStreak(entry.streak, diff);
}
