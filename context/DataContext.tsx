/**
 * Data Context - Global State Management
 *
 * Provides reactive access to app data with automatic updates
 * when data changes anywhere in the app.
 */

import { dataEvents } from "@/lib/events";
import { storage } from "@/lib/storage";
import type {
  Challenge,
  DataAction,
  DataEvent,
  DataState,
  EventRecord,
  Exercise,
  HistoryEntry,
  Program,
  SessionState,
} from "@/types";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";

// Re-export Challenge type for convenience
export type { Challenge } from "@/types";

type DataContextValue = {
  state: DataState;

  // Actions
  actions: {
    // Session completion flow - call this when a session is completed
    completeSession: (
      slug: string,
      sessionIndex: number,
      summary: string,
    ) => Promise<void>;

    // Record an event
    recordEvent: (
      event: Omit<EventRecord, "ts"> & { ts?: string },
    ) => Promise<void>;

    // Save session state
    saveSessionState: (state: SessionState) => Promise<void>;

    // Load session state
    loadSessionState: (
      slug: string,
      sessionIndex: number,
    ) => Promise<SessionState | null>;

    // Refresh data
    refreshAll: () => void;
    refreshProgress: () => void;
    refreshHistory: () => void;
    refreshCompleted: () => void;

    // Exercises CRUD
    upsertExercise: (
      input: Pick<Exercise, "id" | "name" | "category" | "icon"> & {
        id?: string;
      },
    ) => Promise<Exercise>;
    deleteExercise: (id: string) => Promise<void>;

    // Programs CRUD
    upsertProgram: (
      input: Pick<Program, "id" | "name" | "description" | "sessions"> & {
        id?: string;
      },
    ) => Promise<Program>;
    deleteProgram: (id: string) => Promise<void>;
  };
};

// ============================================================================
// Initial State & Reducer
// ============================================================================

export const initialState: DataState = {
  challenges: [],
  challengesLoading: true,
  exercises: [],
  exercisesLoading: true,
  programs: [],
  programsLoading: true,
  lastCompletedSlug: null,
  progressVersion: 0,
  historyVersion: 0,
  completedVersion: 0,
};

export function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case "SET_CHALLENGES":
      return {
        ...state,
        challenges: action.challenges,
        challengesLoading: false,
      };
    case "SET_CHALLENGES_LOADING":
      return { ...state, challengesLoading: action.loading };
    case "SET_EXERCISES":
      return { ...state, exercises: action.exercises, exercisesLoading: false };
    case "SET_EXERCISES_LOADING":
      return { ...state, exercisesLoading: action.loading };
    case "SET_PROGRAMS":
      return { ...state, programs: action.programs, programsLoading: false };
    case "SET_PROGRAMS_LOADING":
      return { ...state, programsLoading: action.loading };
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

  // Load challenges from static assets on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import("@/assets/data/challenges.json");
        if (!mounted) return;
        dispatch({
          type: "SET_CHALLENGES",
          challenges: (mod as any).default as Challenge[],
        });
      } catch {
        if (mounted)
          dispatch({ type: "SET_CHALLENGES_LOADING", loading: false });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load exercises & programs (seed + user) on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [seedExercises, userExercises] = await Promise.all([
          (async () => {
            try {
              const mod = await import("@/assets/data/exercises.json");
              return (mod as any).default as Exercise[];
            } catch {
              return [] as Exercise[];
            }
          })(),
          storage.loadExercises(),
        ]);

        const exercisesById = new Map<string, Exercise>();
        for (const e of seedExercises) exercisesById.set(e.id, e);
        for (const e of userExercises) exercisesById.set(e.id, e);
        const mergedExercises = Array.from(exercisesById.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        if (mounted)
          dispatch({ type: "SET_EXERCISES", exercises: mergedExercises });
      } catch {
        if (mounted)
          dispatch({ type: "SET_EXERCISES_LOADING", loading: false });
      }

      try {
        const [seedPrograms, userPrograms] = await Promise.all([
          (async () => {
            try {
              const mod = await import("@/assets/data/programs.json");
              return (mod as any).default as Program[];
            } catch {
              return [] as Program[];
            }
          })(),
          storage.loadPrograms(),
        ]);

        const programsById = new Map<string, Program>();
        for (const p of seedPrograms) programsById.set(p.id, p);
        for (const p of userPrograms) programsById.set(p.id, p);
        const mergedPrograms = Array.from(programsById.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        if (mounted) dispatch({ type: "SET_PROGRAMS", programs: mergedPrograms });
      } catch {
        if (mounted) dispatch({ type: "SET_PROGRAMS_LOADING", loading: false });
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
      const historyEntry: HistoryEntry = { date, summary, sessionIndex };
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
    [],
  );

  const recordEvent = useCallback(
    async (event: Omit<EventRecord, "ts"> & { ts?: string }) => {
      await storage.appendEvent(event);
      dataEvents.emitEventRecorded(event.slug, event.type);
    },
    [],
  );

  const saveSessionState = useCallback(async (sessionState: SessionState) => {
    await storage.saveSessionState(sessionState);
    dataEvents.emitSessionStateChanged(
      sessionState.slug,
      sessionState.sessionIndex,
    );
  }, []);

  const loadSessionState = useCallback(
    async (slug: string, sessionIndex: number) => {
      return storage.loadSessionState(slug, sessionIndex);
    },
    [],
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

  const upsertExercise = useCallback(
    async (
      input: Pick<Exercise, "id" | "name" | "category" | "icon"> & {
        id?: string;
      },
    ) => {
      const id = input.id;
      if (id) {
        const existing = state.exercises.find((e) => e.id === id);
        if (existing?.source === "builtin") {
          throw new Error("Built-in exercises cannot be edited.");
        }
      }

      const saved = await storage.upsertExercise({
        id: input.id ?? "",
        name: input.name,
        category: input.category,
        icon: input.icon,
        source: "user",
      });

      const userExercises = await storage.loadExercises();
      const exercisesById = new Map<string, Exercise>();
      for (const e of state.exercises) {
        // keep builtins from current state (already contains seeds)
        if (e.source === "builtin") exercisesById.set(e.id, e);
      }
      for (const e of userExercises) exercisesById.set(e.id, e);
      const merged = Array.from(exercisesById.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      dispatch({ type: "SET_EXERCISES", exercises: merged });
      return saved;
    },
    [state.exercises],
  );

  const deleteExercise = useCallback(
    async (id: string) => {
      const existing = state.exercises.find((e) => e.id === id);
      if (!existing) return;
      if (existing.source === "builtin") {
        throw new Error("Built-in exercises cannot be deleted.");
      }

      const referencedBy = state.programs.find((p) =>
        p.sessions.some((s) =>
          s.blocks.some((b) => b.type === "exercise" && b.exerciseId === id),
        ),
      );
      if (referencedBy) {
        throw new Error(
          `This exercise is used by the program “${referencedBy.name}”. Remove it from the program first.`,
        );
      }

      await storage.deleteExercise(id);

      const userExercises = await storage.loadExercises();
      const merged = [
        ...state.exercises.filter((e) => e.source === "builtin"),
        ...userExercises,
      ].sort((a, b) => a.name.localeCompare(b.name));
      dispatch({ type: "SET_EXERCISES", exercises: merged });
    },
    [state.exercises, state.programs],
  );

  const upsertProgram = useCallback(
    async (
      input: Pick<Program, "id" | "name" | "description" | "sessions"> & {
        id?: string;
      },
    ) => {
      const id = input.id;
      if (id) {
        const existing = state.programs.find((p) => p.id === id);
        if (existing?.source === "builtin") {
          throw new Error("Built-in programs cannot be edited.");
        }
      }

      const saved = await storage.upsertProgram({
        id: input.id ?? "",
        name: input.name,
        description: input.description,
        sessions: input.sessions,
        source: "user",
      });

      const userPrograms = await storage.loadPrograms();
      const merged = [
        ...state.programs.filter((p) => p.source === "builtin"),
        ...userPrograms,
      ].sort((a, b) => a.name.localeCompare(b.name));
      dispatch({ type: "SET_PROGRAMS", programs: merged });
      return saved;
    },
    [state.programs],
  );

  const deleteProgram = useCallback(
    async (id: string) => {
      const existing = state.programs.find((p) => p.id === id);
      if (!existing) return;
      if (existing.source === "builtin") {
        throw new Error("Built-in programs cannot be deleted.");
      }

      await storage.deleteProgram(id);

      const userPrograms = await storage.loadPrograms();
      const merged = [
        ...state.programs.filter((p) => p.source === "builtin"),
        ...userPrograms,
      ].sort((a, b) => a.name.localeCompare(b.name));
      dispatch({ type: "SET_PROGRAMS", programs: merged });
    },
    [state.programs],
  );

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
      upsertExercise,
      deleteExercise,
      upsertProgram,
      deleteProgram,
    },
  };

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
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
export function useChallenges() {
  const { state } = useDataContext();
  return {
    data: state.challenges.length > 0 ? state.challenges : null,
    loading: state.challengesLoading,
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
