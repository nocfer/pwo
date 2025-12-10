import { Platform } from "react-native";

// Dynamically require the correct implementation at runtime to ensure web uses localStorage version
// and native uses expo-file-system version.
// This avoids relying on platform file resolution that may fail in some bundlers.
 
const impl = Platform.OS === "web" ? require("./persist.web") : require("./persist");

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
  type: string;
  data?: Record<string, any>;
};

export type HistoryEntry = { date: string; summary: string };

export const loadSessionState = impl.loadSessionState as (slug: string, sessionIndex: number) => Promise<SessionState | null>;
export const saveSessionState = impl.saveSessionState as (state: SessionState) => Promise<void>;
export const appendEvent = impl.appendEvent as (event: Omit<EventRecord, "ts"> & { ts?: string }) => Promise<void>;
export const appendHistory = impl.appendHistory as (slug: string, entry: HistoryEntry) => Promise<void>;
export const saveStreakHit = impl.saveStreakHit as (slug: string, dateISO: string) => Promise<void>;
export const loadStreak = impl.loadStreak as (slug: string) => Promise<number[] | null>;
