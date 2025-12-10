/**
 * Storage-related type definitions
 */

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
  ts: string;
  slug: string;
  sessionIndex: number;
  type:
    | "warmup_started"
    | "warmup_paused"
    | "warmup_resumed"
    | "warmup_skipped"
    | "warmup_completed"
    | "set_completed"
    | "set_skipped"
    | "break_started"
    | "break_paused"
    | "break_resumed"
    | "break_skipped"
    | "break_completed"
    | "session_completed";
  data?: Record<string, unknown>;
};

export type HistoryEntry = {
  date: string;
  summary: string;
};

export type HistoryFile = {
  slug: string;
  recent: HistoryEntry[];
}[];

export type StreakEntry = {
  slug: string;
  streak: number[];
  updatedAt: string;
};
