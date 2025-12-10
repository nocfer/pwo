/**
 * Event-related type definitions
 */

export type DataEventType =
  | "SESSION_COMPLETED"
  | "SESSION_STATE_CHANGED"
  | "PROGRESS_UPDATED"
  | "HISTORY_UPDATED"
  | "EVENT_RECORDED";

export type DataEvent =
  | { type: "SESSION_COMPLETED"; slug: string; sessionIndex: number }
  | { type: "SESSION_STATE_CHANGED"; slug: string; sessionIndex: number }
  | { type: "PROGRESS_UPDATED"; slug: string }
  | { type: "HISTORY_UPDATED"; slug: string }
  | { type: "EVENT_RECORDED"; slug: string; eventType: string };

export type DataEventCallback = (event: DataEvent) => void;
