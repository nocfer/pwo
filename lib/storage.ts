/**
 * Unified Storage Layer
 *
 * Single source of truth for all data persistence operations.
 * Works consistently across web (localStorage) and native (FileSystem).
 */

import type {
  EventRecord,
  HistoryEntry,
  HistoryFile,
  SessionState,
  StreakEntry,
} from "@/types";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { getMondayBasedDayIndex, normalizeStreak } from "./utils/date";

// Re-export types for backwards compatibility
export type {
  EventRecord,
  HistoryEntry,
  HistoryFile,
  SessionState,
  StreakEntry
} from "@/types";

// ============================================================================
// Storage Keys
// ============================================================================

const KEYS = {
  SESSIONS: "pwo.sessions",
  EVENTS: "pwo.events",
  HISTORY: "pwo.history",
  PROGRESS: "pwo.progress",
} as const;

// ============================================================================
// Platform-specific helpers
// ============================================================================

const isWeb = Platform.OS === "web";
const FS_ANY = FileSystem as any;
const DOC_DIR: string = FS_ANY.documentDirectory || FS_ANY.cacheDirectory || "";

function getFilePath(key: string): string {
  return `${DOC_DIR}${key}.json`;
}

// Web storage helpers
function webRead<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined" || !window.localStorage)
    return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function webWrite<T>(key: string, value: T): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage might be full or disabled
  }
}

// Native storage helpers
async function nativeRead<T>(key: string, defaultValue: T): Promise<T> {
  const path = getFilePath(key);
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return defaultValue;
    const raw = await FileSystem.readAsStringAsync(path);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

async function nativeWrite<T>(key: string, value: T): Promise<void> {
  const path = getFilePath(key);
  try {
    await FileSystem.writeAsStringAsync(path, JSON.stringify(value, null, 2));
  } catch {
    // Best effort
  }
}

// Unified read/write
async function read<T>(key: string, defaultValue: T): Promise<T> {
  if (isWeb) {
    return webRead(key, defaultValue);
  }
  return nativeRead(key, defaultValue);
}

async function write<T>(key: string, value: T): Promise<void> {
  if (isWeb) {
    webWrite(key, value);
    return;
  }
  await nativeWrite(key, value);
}

// ============================================================================
// Storage API
// ============================================================================

export const storage = {
  // --------------------------------------------------------------------------
  // Session State
  // --------------------------------------------------------------------------

  async loadSessionState(
    slug: string,
    sessionIndex: number,
  ): Promise<SessionState | null> {
    const arr = await read<SessionState[]>(KEYS.SESSIONS, []);
    return (
      arr.find((s) => s.slug === slug && s.sessionIndex === sessionIndex) ||
      null
    );
  },

  async saveSessionState(state: SessionState): Promise<void> {
    const arr = await read<SessionState[]>(KEYS.SESSIONS, []);
    const idx = arr.findIndex(
      (s) => s.slug === state.slug && s.sessionIndex === state.sessionIndex,
    );
    if (idx >= 0) {
      arr[idx] = state;
    } else {
      arr.push(state);
    }
    await write(KEYS.SESSIONS, arr);
  },

  async clearSessionState(slug: string, sessionIndex: number): Promise<void> {
    const arr = await read<SessionState[]>(KEYS.SESSIONS, []);
    const filtered = arr.filter(
      (s) => !(s.slug === slug && s.sessionIndex === sessionIndex),
    );
    await write(KEYS.SESSIONS, filtered);
  },

  // --------------------------------------------------------------------------
  // Events
  // --------------------------------------------------------------------------

  async loadEvents(): Promise<EventRecord[]> {
    return read<EventRecord[]>(KEYS.EVENTS, []);
  },

  async loadEventsForSlug(slug: string): Promise<EventRecord[]> {
    const events = await this.loadEvents();
    return events.filter((e) => e.slug === slug);
  },

  async appendEvent(
    event: Omit<EventRecord, "ts"> & { ts?: string },
  ): Promise<void> {
    const arr = await read<EventRecord[]>(KEYS.EVENTS, []);
    const record: EventRecord = {
      ...event,
      ts: event.ts ?? new Date().toISOString(),
    };
    arr.push(record);
    await write(KEYS.EVENTS, arr);
  },

  // --------------------------------------------------------------------------
  // History
  // --------------------------------------------------------------------------

  async loadAllHistory(): Promise<HistoryFile> {
    return read<HistoryFile>(KEYS.HISTORY, []);
  },

  async loadHistory(slug: string): Promise<HistoryEntry[]> {
    const arr = await read<HistoryFile>(KEYS.HISTORY, []);
    const entry = arr.find((h) => h.slug === slug);
    return entry?.recent ?? [];
  },

  async appendHistory(slug: string, entry: HistoryEntry): Promise<void> {
    const arr = await read<HistoryFile>(KEYS.HISTORY, []);
    const idx = arr.findIndex((h) => h.slug === slug);
    if (idx >= 0) {
      arr[idx].recent.unshift(entry);
    } else {
      arr.push({ slug, recent: [entry] });
    }
    await write(KEYS.HISTORY, arr);
  },

  // --------------------------------------------------------------------------
  // Progress / Streak (Calendar Week Aligned: Mon=0, Sun=6)
  // --------------------------------------------------------------------------

  async loadStreak(slug: string): Promise<number[] | null> {
    const arr = await read<StreakEntry[]>(KEYS.PROGRESS, []);
    const entry = arr.find((e) => e.slug === slug);
    if (!entry) return null;

    // Normalize for calendar week - resets if different week
    const today = new Date();
    const last = new Date(entry.updatedAt);
    return normalizeStreak(entry.streak, last, today);
  },

  async saveStreakHit(slug: string, dateISO: string): Promise<void> {
    const arr = await read<StreakEntry[]>(KEYS.PROGRESS, []);
    const idx = arr.findIndex((e) => e.slug === slug);
    const today = new Date(dateISO);
    const dayIndex = getMondayBasedDayIndex(today); // 0=Mon, 6=Sun

    if (idx < 0) {
      // New entry: create fresh week and mark today's day
      const streak = Array(7).fill(0);
      streak[dayIndex] = 1;
      arr.push({ slug, streak, updatedAt: today.toISOString() });
    } else {
      const entry = arr[idx];
      const last = new Date(entry.updatedAt);
      // Normalize streak (resets if new week)
      const normalized = normalizeStreak(entry.streak, last, today);
      // Set today's day-of-week to 1
      normalized[dayIndex] = 1;
      arr[idx] = { slug, streak: normalized, updatedAt: today.toISOString() };
    }
    await write(KEYS.PROGRESS, arr);
  },

  async loadAllStreaks(): Promise<StreakEntry[]> {
    return read<StreakEntry[]>(KEYS.PROGRESS, []);
  },

  // --------------------------------------------------------------------------
  // Completed Sessions
  // --------------------------------------------------------------------------

  async loadCompletedSessions(slug: string): Promise<Set<number>> {
    const completed = new Set<number>();

    // From events
    const events = await this.loadEvents();
    for (const e of events) {
      if (e.slug === slug && e.type === "session_completed") {
        completed.add(e.sessionIndex);
      }
    }

    // From storage history
    const storageHistory = await this.loadHistory(slug);
    for (const h of storageHistory) {
      if (h.sessionIndex != null) completed.add(h.sessionIndex);
    }

    return completed;
  },

  async getLastCompletedSlug(): Promise<string | null> {
    const events = await this.loadEvents();
    const last = [...events]
      .reverse()
      .find((e) => e.type === "session_completed");
    return last?.slug ?? null;
  },
};

export default storage;
