/**
 * Data Context - Global State Management
 * 
 * Provides reactive access to app data with automatic updates
 * when data changes anywhere in the app.
 */

import { DataEvent, dataEvents } from "@/lib/events";
import { EventRecord, HistoryEntry, SessionState, storage } from "@/lib/storage";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useReducer } from "react";

// ============================================================================
// Types
// ============================================================================

export type Routine = {
  name: string;
  slug: string;
};

type DataState = {
  // Routines (from static assets)
  routines: Routine[];
  routinesLoading: boolean;
  
  // Last completed slug
  lastCompletedSlug: string | null;
  
  // Refresh triggers (incremented to force re-fetch)
  progressVersion: number;
  historyVersion: number;
  completedVersion: number;
};

type DataAction =
  | { type: "SET_ROUTINES"; routines: Routine[] }
  | { type: "SET_ROUTINES_LOADING"; loading: boolean }
  | { type: "SET_LAST_COMPLETED_SLUG"; slug: string | null }
  | { type: "INCREMENT_PROGRESS_VERSION" }
  | { type: "INCREMENT_HISTORY_VERSION" }
  | { type: "INCREMENT_COMPLETED_VERSION" }
  | { type: "REFRESH_ALL" };

type DataContextValue = {
  state: DataState;
  
  // Actions
  actions: {
    // Session completion flow - call this when a session is completed
    completeSession: (
      slug: string,
      sessionIndex: number,
      summary: string
    ) => Promise<void>;
    
    // Record an event
    recordEvent: (
      event: Omit<EventRecord, "ts"> & { ts?: string }
    ) => Promise<void>;
    
    // Save session state
    saveSessionState: (state: SessionState) => Promise<void>;
    
    // Load session state
    loadSessionState: (slug: string, sessionIndex: number) => Promise<SessionState | null>;
    
    // Refresh data
    refreshAll: () => void;
    refreshProgress: () => void;
    refreshHistory: () => void;
    refreshCompleted: () => void;
  };
};

// ============================================================================
// Initial State & Reducer
// ============================================================================

const initialState: DataState = {
  routines: [],
  routinesLoading: true,
  lastCompletedSlug: null,
  progressVersion: 0,
  historyVersion: 0,
  completedVersion: 0,
};

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case "SET_ROUTINES":
      return { ...state, routines: action.routines, routinesLoading: false };
    case "SET_ROUTINES_LOADING":
      return { ...state, routinesLoading: action.loading };
    case "SET_LAST_COMPLETED_SLUG":
      return { ...state, lastCompletedSlug: action.slug };
    case "INCREMENT_PROGRESS_VERSION":
      return { ...state, progressVersion: state.progressVersion + 1 };
    case "INCREMENT_HISTORY_VERSION":
      return { ...state, historyVersion: state.historyVersion + 1 };
    case "INCREMENT_COMPLETED_VERSION":
      return { ...state, completedVersion: state.completedVersion + 1 };
    case "REFRESH_ALL":
      return {
        ...state,
        progressVersion: state.progressVersion + 1,
        historyVersion: state.historyVersion + 1,
        completedVersion: state.completedVersion + 1,
      };
    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const DataContext = createContext<DataContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Load routines from static assets on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import("@/assets/data/routines.json");
        if (!mounted) return;
        dispatch({ type: "SET_ROUTINES", routines: (mod as any).default as Routine[] });
      } catch {
        if (mounted) dispatch({ type: "SET_ROUTINES_LOADING", loading: false });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load last completed slug on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const slug = await storage.getLastCompletedSlug();
        if (mounted) dispatch({ type: "SET_LAST_COMPLETED_SLUG", slug });
      } catch {
        // Ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to data events
  useEffect(() => {
    const unsubscribe = dataEvents.subscribe((event: DataEvent) => {
      switch (event.type) {
        case "SESSION_COMPLETED":
          dispatch({ type: "SET_LAST_COMPLETED_SLUG", slug: event.slug });
          dispatch({ type: "INCREMENT_COMPLETED_VERSION" });
          dispatch({ type: "INCREMENT_PROGRESS_VERSION" });
          dispatch({ type: "INCREMENT_HISTORY_VERSION" });
          break;
        case "PROGRESS_UPDATED":
          dispatch({ type: "INCREMENT_PROGRESS_VERSION" });
          break;
        case "HISTORY_UPDATED":
          dispatch({ type: "INCREMENT_HISTORY_VERSION" });
          break;
        case "EVENT_RECORDED":
          if (event.eventType === "session_completed") {
            dispatch({ type: "INCREMENT_COMPLETED_VERSION" });
          }
          break;
      }
    });
    return unsubscribe;
  }, []);

  // Actions
  const completeSession = useCallback(
    async (slug: string, sessionIndex: number, summary: string) => {
      const dateISO = new Date().toISOString();
      const date = dateISO.slice(0, 10);

      // Record the event
      await storage.appendEvent({
        slug,
        sessionIndex,
        type: "session_completed",
        ts: dateISO,
      });

      // Append to history
      const historyEntry: HistoryEntry = { date, summary };
      await storage.appendHistory(slug, historyEntry);

      // Update streak
      await storage.saveStreakHit(slug, dateISO);

      // Clear session state
      await storage.clearSessionState(slug, sessionIndex);

      // Emit events to notify subscribers
      dataEvents.emitSessionCompleted(slug, sessionIndex);
      dataEvents.emitProgressUpdated(slug);
      dataEvents.emitHistoryUpdated(slug);
    },
    []
  );

  const recordEvent = useCallback(
    async (event: Omit<EventRecord, "ts"> & { ts?: string }) => {
      await storage.appendEvent(event);
      dataEvents.emitEventRecorded(event.slug, event.type);
    },
    []
  );

  const saveSessionState = useCallback(async (sessionState: SessionState) => {
    await storage.saveSessionState(sessionState);
    dataEvents.emitSessionStateChanged(sessionState.slug, sessionState.sessionIndex);
  }, []);

  const loadSessionState = useCallback(
    async (slug: string, sessionIndex: number) => {
      return storage.loadSessionState(slug, sessionIndex);
    },
    []
  );

  const refreshAll = useCallback(() => {
    dispatch({ type: "REFRESH_ALL" });
  }, []);

  const refreshProgress = useCallback(() => {
    dispatch({ type: "INCREMENT_PROGRESS_VERSION" });
  }, []);

  const refreshHistory = useCallback(() => {
    dispatch({ type: "INCREMENT_HISTORY_VERSION" });
  }, []);

  const refreshCompleted = useCallback(() => {
    dispatch({ type: "INCREMENT_COMPLETED_VERSION" });
  }, []);

  const contextValue: DataContextValue = {
    state,
    actions: {
      completeSession,
      recordEvent,
      saveSessionState,
      loadSessionState,
      refreshAll,
      refreshProgress,
      refreshHistory,
      refreshCompleted,
    },
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useDataContext() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return context;
}

// Convenience hooks
export function useRoutines() {
  const { state } = useDataContext();
  return {
    data: state.routines.length > 0 ? state.routines : null,
    loading: state.routinesLoading,
    error: null,
  };
}

export function useLastCompletedSlug() {
  const { state } = useDataContext();
  return state.lastCompletedSlug;
}

export function useDataActions() {
  const { actions } = useDataContext();
  return actions;
}

export function useRefreshVersions() {
  const { state } = useDataContext();
  return {
    progressVersion: state.progressVersion,
    historyVersion: state.historyVersion,
    completedVersion: state.completedVersion,
  };
}

export default DataContext;

