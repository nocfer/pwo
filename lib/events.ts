/**
 * Data Events - Pub/Sub Pattern
 *
 * Simple event emitter for reactive data updates across the app.
 * Components subscribe to events they care about and automatically
 * re-fetch data when those events are emitted.
 */

import type { DataEvent, DataEventCallback, DataEventType } from "@/types";

// Re-export types for backwards compatibility
export type { DataEvent, DataEventCallback, DataEventType } from "@/types";

// ============================================================================
// Event Emitter Implementation
// ============================================================================

type Listener = {
  callback: DataEventCallback;
  types?: DataEventType[];
};

let listeners: Listener[] = [];
let nextId = 0;
const listenerIds = new Map<number, Listener>();

/**
 * Subscribe to data events
 * @param callback Function to call when events occur
 * @param types Optional array of event types to filter. If not provided, receives all events.
 * @returns Unsubscribe function
 */
export function subscribe(
  callback: DataEventCallback,
  types?: DataEventType[],
): () => void {
  const id = nextId++;
  const listener: Listener = { callback, types };
  listenerIds.set(id, listener);
  listeners.push(listener);

  // Return unsubscribe function
  return () => {
    listenerIds.delete(id);
    listeners = listeners.filter((l) => l !== listener);
  };
}

/**
 * Emit a data event to all subscribers
 */
export function emit(event: DataEvent): void {
  for (const listener of listeners) {
    // If listener has type filter, check if this event type matches
    if (listener.types && !listener.types.includes(event.type)) {
      continue;
    }
    try {
      listener.callback(event);
    } catch (error) {
      console.warn("[DataEvents] Listener error:", error);
    }
  }
}

/**
 * Get current listener count (useful for debugging)
 */
export function getListenerCount(): number {
  return listeners.length;
}

/**
 * Clear all listeners (useful for testing)
 */
export function clearAllListeners(): void {
  listeners = [];
  listenerIds.clear();
}

// ============================================================================
// Convenience Emitters
// ============================================================================

export const dataEvents = {
  subscribe,
  emit,
  getListenerCount,
  clearAllListeners,

  // Typed emit helpers
  emitSessionCompleted(slug: string, sessionIndex: number): void {
    emit({ type: "SESSION_COMPLETED", slug, sessionIndex });
  },

  emitSessionStateChanged(slug: string, sessionIndex: number): void {
    emit({ type: "SESSION_STATE_CHANGED", slug, sessionIndex });
  },

  emitProgressUpdated(slug: string): void {
    emit({ type: "PROGRESS_UPDATED", slug });
  },

  emitHistoryUpdated(slug: string): void {
    emit({ type: "HISTORY_UPDATED", slug });
  },

  emitEventRecorded(slug: string, eventType: string): void {
    emit({ type: "EVENT_RECORDED", slug, eventType });
  },
};

export default dataEvents;
