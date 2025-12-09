import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const FS_ANY = FileSystem as any;
const DIR: string = FS_ANY.documentDirectory || FS_ANY.cacheDirectory || "";

function pathToKey(path: string) {
  if (path.endsWith("events.json")) return "persist.events";
  if (path.endsWith("sessions-state.json")) return "persist.sessionsState";
  if (path.endsWith("history.json")) return "persist.history";
  if (path.endsWith("progress-state.json")) return "persist.progressState";
  return `persist.${path}`;
}

function webRead(key: string): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {}
  return null;
}

function webWrite(key: string, value: string) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {}
}

async function readText(path: string): Promise<string> {
  if (Platform.OS === "web") {
    return webRead(pathToKey(path)) ?? "";
  }
  return FileSystem.readAsStringAsync(path);
}

async function writeText(path: string, content: string): Promise<void> {
  if (Platform.OS === "web") {
    webWrite(pathToKey(path), content);
    return;
  }
  await FileSystem.writeAsStringAsync(path, content);
}

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

// Streak persistence (last 7 days window ending today)
export type StreakEntry = { slug: string; streak: number[]; updatedAt: string };

function daysBetween(a: Date, b: Date) {
  const MS = 24 * 60 * 60 * 1000;
  const ad = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bd = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bd.getTime() - ad.getTime()) / MS);
}

function normalizeStreak(streak: number[], daysDiff: number) {
  // shift left by daysDiff and pad with zeros to length 7
  const base = streak.slice(-7);
  let shifted = base;
  if (daysDiff > 0) {
    shifted = [...base, ...Array(daysDiff).fill(0)];
  }
  return shifted.slice(-7);
}

export async function saveStreakHit(slug: string, dateISO: string) {
  const path = `${DIR}progress-state.json`;
  await ensureFile(path, []);
  const raw = await FileSystem.readAsStringAsync(path);
  const arr = (raw ? JSON.parse(raw) : []) as StreakEntry[];
  const idx = arr.findIndex((e) => e.slug === slug);
  const today = new Date(dateISO);
  if (idx < 0) {
    // new entry: mark today as hit
    const streak = Array(6).fill(0).concat(1);
    arr.push({ slug, streak, updatedAt: today.toISOString() });
  } else {
    const entry = arr[idx];
    const last = new Date(entry.updatedAt);
    const diff = daysBetween(last, today);
    const normalized = normalizeStreak(entry.streak, diff);
    // set today to 1
    normalized[normalized.length - 1] = 1;
    arr[idx] = { slug, streak: normalized, updatedAt: today.toISOString() };
  }
  await FileSystem.writeAsStringAsync(path, JSON.stringify(arr, null, 2));
}

export async function loadStreak(slug: string): Promise<number[] | null> {
  const path = `${DIR}progress-state.json`;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;
  const raw = await FileSystem.readAsStringAsync(path);
  const arr = (raw ? JSON.parse(raw) : []) as StreakEntry[];
  const entry = arr.find((e) => e.slug === slug);
  if (!entry) return null;
  // align to today even if no update today
  const today = new Date();
  const last = new Date(entry.updatedAt);
  const diff = daysBetween(last, today);
  return normalizeStreak(entry.streak, diff);
}
