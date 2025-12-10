/**
 * Persistence Platform - Backwards Compatibility Layer
 * 
 * Re-exports from the unified storage module for backwards compatibility.
 * New code should import directly from @/lib/storage.
 * 
 * @deprecated Use @/lib/storage directly instead.
 */

import { storage, SessionState, EventRecord, HistoryEntry } from "./storage";

export type { SessionState, EventRecord, HistoryEntry };

export const loadSessionState = storage.loadSessionState.bind(storage);
export const saveSessionState = storage.saveSessionState.bind(storage);
export const appendEvent = storage.appendEvent.bind(storage);
export const appendHistory = storage.appendHistory.bind(storage);
export const saveStreakHit = storage.saveStreakHit.bind(storage);
export const loadStreak = storage.loadStreak.bind(storage);
