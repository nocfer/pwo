/**
 * Data Context - Global State Management
 *
 * Provides reactive access to app data with automatic updates
 * when data changes anywhere in the app.
 */

import { generateChallengeSessions } from "@/hooks/data/useChallengeSessions";
import { dataEvents } from "@/lib/events";
import { storage } from "@/lib/storage";
import type {
  ChallengeProgress,
  DataAction,
  DataEvent,
  DataState,
  EventRecord,
  Exercise,
  ExerciseProgress,
  HistoryEntry,
  LegacyProgram,
  Program,
  ProgramBlock,
  ProgramProgress,
  SessionProgress,
  SessionState
} from "@/types";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer
} from "react";

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
    loadSessionState: (
      slug: string,
      sessionIndex: number
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
      }
    ) => Promise<Exercise>;
    deleteExercise: (id: string) => Promise<void>;

    // Programs CRUD
    upsertProgram: (
      input: Pick<Program, "id" | "name" | "description" | "sessions"> & {
        id?: string;
      }
    ) => Promise<Program>;
    deleteProgram: (id: string) => Promise<void>;
  };
};

// ============================================================================
// Initial State & Reducer
// ============================================================================

export const initialState: DataState = {
  exercises: [],
  exercisesLoading: true,
  programs: [],
  programsLoading: true,
  lastCompletedSlug: null,
  progressVersion: 0,
  historyVersion: 0,
  completedVersion: 0
};

export function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
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
        completedVersion: state.completedVersion + 1
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

  function migrateProgram(p: LegacyProgram): Program {
    if (!p || typeof p !== "object") return p as Program;
    if (!Array.isArray(p.sessions)) return p as Program;

    const nextSessions = p.sessions.map((s, idx) => {
      const blocksRaw = Array.isArray(s?.blocks) ? s.blocks : [];
      const blocks: ProgramBlock[] = [];

      for (const b of blocksRaw) {
        if (!b || typeof b !== "object") continue;

        if (b.type === "warmup") {
          blocks.push({ type: "warmup", seconds: Number(b.seconds) || 0 });
          continue;
        }

        if (b.type === "rest") {
          blocks.push({
            type: "rest",
            seconds: Number(b.seconds) || 0,
            label: typeof b.label === "string" ? b.label : undefined
          });
          continue;
        }

        if (b.type !== "exercise") continue;

        // New shape already?
        if ("targetReps" in b || "durationSeconds" in b || "note" in b) {
          blocks.push({
            type: "exercise",
            exerciseId: String(b.exerciseId ?? ""),
            targetReps:
              typeof b.targetReps === "number" ? b.targetReps : undefined,
            durationSeconds:
              typeof b.durationSeconds === "number"
                ? b.durationSeconds
                : undefined,
            note: typeof b.note === "string" ? b.note : undefined
          });
          continue;
        }

        // Old shape: { sets, repsPerSet, restSecondsBetweenSets }
        const sets = typeof b.sets === "number" ? b.sets : undefined;
        const reps = b.repsPerSet;
        let targetReps: number | undefined;
        const noteParts: string[] = [];

        if (typeof reps === "number") {
          targetReps = reps;
          if (sets && sets > 1) noteParts.push(`Previously: ${sets} sets`);
        } else if (Array.isArray(reps)) {
          const repsList = reps.filter((x) => typeof x === "number");
          if (repsList.length)
            noteParts.push(`Previously: ${repsList.join(", ")} reps`);
          if (sets && sets > 1) noteParts.push(`${sets} sets`);
        } else if (sets && sets > 1) {
          noteParts.push(`Previously: ${sets} sets`);
        }

        blocks.push({
          type: "exercise",
          exerciseId: String(b.exerciseId ?? ""),
          targetReps,
          note: noteParts.length ? noteParts.join(" • ") : undefined
        });

        const restBetween = Number(b.restSecondsBetweenSets);
        if (Number.isFinite(restBetween) && restBetween > 0) {
          blocks.push({ type: "rest", seconds: restBetween, label: "Rest" });
        }
      }

      return {
        index: typeof s?.index === "number" ? s.index : idx + 1,
        name: typeof s?.name === "string" ? s.name : undefined,
        blocks
      };
    });

    const result: Program = {
      id: String(p.id ?? ""),
      name: String(p.name ?? ""),
      description:
        typeof p.description === "string" ? p.description : undefined,
      sessions: nextSessions,
      createdAt: String(p.createdAt ?? new Date().toISOString()),
      updatedAt: String(p.updatedAt ?? new Date().toISOString()),
      source: p.source === "builtin" ? "builtin" : "user"
    };

    // Preserve challengeConfig if present
    if (p.challengeConfig && typeof p.challengeConfig === "object") {
      const config = p.challengeConfig;
      result.challengeConfig = {
        exerciseId: String(config.exerciseId ?? ""),
        sets: typeof config.sets === "number" ? config.sets : 5,
        targetReps:
          typeof config.targetReps === "number" ? config.targetReps : 100,
        warmUpSeconds:
          typeof config.warmUpSeconds === "number" ? config.warmUpSeconds : 0,
        breakSeconds:
          typeof config.breakSeconds === "number" ? config.breakSeconds : 0
      };
    }

    return result;
  }

  // Load exercises & programs (seed + user) on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [seedExercises, userExercises] = await Promise.all([
          (async () => {
            try {
              type ExerciseModule = { default: Exercise[] };
              const mod = await import("@/assets/data/exercises.json");
              return (mod as unknown as ExerciseModule).default;
            } catch {
              return [] as Exercise[];
            }
          })(),
          storage.loadExercises()
        ]);

        const exercisesById = new Map<string, Exercise>();
        for (const e of seedExercises) exercisesById.set(e.id, e);
        for (const e of userExercises) exercisesById.set(e.id, e);
        const mergedExercises = Array.from(exercisesById.values()).sort(
          (a, b) => a.name.localeCompare(b.name)
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
              type ProgramModule = { default: LegacyProgram[] };
              const mod = await import("@/assets/data/programs.json");
              return (mod as unknown as ProgramModule).default;
            } catch {
              return [] as LegacyProgram[];
            }
          })(),
          storage.loadPrograms()
        ]);

        const programsById = new Map<string, Program>();
        for (const p of seedPrograms) {
          const migrated = migrateProgram(p);
          programsById.set(migrated.id, migrated);
        }
        for (const p of userPrograms) {
          const migrated = migrateProgram(p);
          programsById.set(migrated.id, migrated);
        }
        const mergedPrograms = Array.from(programsById.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        if (mounted)
          dispatch({ type: "SET_PROGRAMS", programs: mergedPrograms });
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
        ts: dateISO
      });

      // Append to history
      const historyEntry: HistoryEntry = { date, summary, sessionIndex };
      await storage.appendHistory(slug, historyEntry);

      // Update streak
      await storage.saveStreakHit(slug, dateISO);

      // Get program to determine type and calculate progress
      const program = state.programs.find((p) => p.id === slug);
      if (program) {
        const isChallenge = Boolean(program.challengeConfig);
        const events = await storage.loadEventsForSlug(slug);
        const sessionEvents = events.filter(
          (e) => e.sessionIndex === sessionIndex
        );

        // Calculate time spent from events
        let timeSpentSeconds = 0;
        const exerciseProgressMap = new Map<string, ExerciseProgress>();

        for (const event of sessionEvents) {
          if (
            event.type === "warmup_started" ||
            event.type === "break_started"
          ) {
            const data = event.data as Record<string, unknown>;
            const durationSeconds = data?.["durationSeconds"];
            if (typeof durationSeconds === "number") {
              timeSpentSeconds += durationSeconds;
            }
          }
          if (event.type === "set_completed") {
            const data = event.data as Record<string, unknown>;
            const exerciseId = data?.["exerciseId"];
            const reps = data?.["reps"];
            const durationSeconds = data?.["durationSeconds"];

            if (typeof exerciseId === "string" && typeof reps === "number") {
              const existing = exerciseProgressMap.get(exerciseId) || {
                exerciseId,
                repsCompleted: 0,
                setsCompleted: 0,
                lastCompletedAt: dateISO
              };
              existing.repsCompleted += reps;
              existing.setsCompleted += 1;
              exerciseProgressMap.set(exerciseId, existing);
            }
            if (typeof durationSeconds === "number") {
              timeSpentSeconds += durationSeconds;
            }
          }
        }

        const exerciseProgress = Array.from(exerciseProgressMap.values());

        if (isChallenge && program.challengeConfig) {
          // Update challenge progress
          const existing = await storage.loadChallengeProgress(slug);
          const sessions = generateChallengeSessions(program.challengeConfig);

          let totalRepsCompleted = exerciseProgress.reduce(
            (sum, e) => sum + e.repsCompleted,
            0
          );

          if (existing) {
            // Update existing progress
            const sessionProgressIndex = existing.sessions.findIndex(
              (s) => s.sessionIndex === sessionIndex
            );
            const sessionProgress: SessionProgress = {
              sessionIndex,
              completed: true,
              completedAt: dateISO,
              timeSpentSeconds,
              exercises: exerciseProgress
            };

            if (sessionProgressIndex >= 0) {
              existing.sessions[sessionProgressIndex] = sessionProgress;
            } else {
              existing.sessions.push(sessionProgress);
            }

            // Recalculate total reps
            totalRepsCompleted = existing.sessions
              .filter((s) => s.completed)
              .reduce((sum, s) => {
                return (
                  sum +
                  s.exercises.reduce((eSum, e) => eSum + e.repsCompleted, 0)
                );
              }, 0);

            existing.totalRepsCompleted = totalRepsCompleted;
            existing.lastActivityAt = dateISO;
            existing.updatedAt = dateISO;

            // Check if challenge is completed
            const completedSessions = existing.sessions.filter(
              (s) => s.completed
            );
            if (
              completedSessions.length === sessions.length &&
              totalRepsCompleted >= program.challengeConfig.targetReps
            ) {
              existing.completedAt = dateISO;
            }

            await storage.saveChallengeProgress(existing);
          } else {
            // Create new challenge progress
            const newProgress: ChallengeProgress = {
              challengeId: slug,
              startedAt: dateISO,
              sessions: [
                {
                  sessionIndex,
                  completed: true,
                  completedAt: dateISO,
                  timeSpentSeconds,
                  exercises: exerciseProgress
                }
              ],
              totalRepsCompleted,
              targetReps: program.challengeConfig.targetReps,
              lastActivityAt: dateISO,
              updatedAt: dateISO
            };
            await storage.saveChallengeProgress(newProgress);
          }

          // Store history entry
          await storage.appendProgressHistory({
            date: dateISO.slice(0, 10),
            challengeId: slug,
            sessionsCompleted: 1,
            totalReps: totalRepsCompleted
          });
        } else {
          // Update program progress
          const existing = await storage.loadProgramProgress(slug);

          if (existing) {
            // Update existing progress
            const sessionProgressIndex = existing.sessions.findIndex(
              (s) => s.sessionIndex === sessionIndex
            );
            const sessionProgress: SessionProgress = {
              sessionIndex,
              completed: true,
              completedAt: dateISO,
              timeSpentSeconds,
              exercises: exerciseProgress
            };

            if (sessionProgressIndex >= 0) {
              existing.sessions[sessionProgressIndex] = sessionProgress;
            } else {
              existing.sessions.push(sessionProgress);
            }

            // Recalculate total time
            existing.totalTimeSpentSeconds = existing.sessions
              .filter((s) => s.completed)
              .reduce((sum, s) => sum + (s.timeSpentSeconds || 0), 0);

            existing.lastActivityAt = dateISO;
            existing.updatedAt = dateISO;

            // Check if program is completed
            const completedSessions = existing.sessions.filter(
              (s) => s.completed
            );
            if (completedSessions.length === program.sessions.length) {
              existing.completedAt = dateISO;
            }

            await storage.saveProgramProgress(existing);
          } else {
            // Create new program progress
            const newProgress: ProgramProgress = {
              programId: slug,
              startedAt: dateISO,
              sessions: [
                {
                  sessionIndex,
                  completed: true,
                  completedAt: dateISO,
                  timeSpentSeconds,
                  exercises: exerciseProgress
                }
              ],
              totalTimeSpentSeconds: timeSpentSeconds,
              lastActivityAt: dateISO,
              updatedAt: dateISO
            };
            await storage.saveProgramProgress(newProgress);
          }

          // Store history entry
          await storage.appendProgressHistory({
            date: dateISO.slice(0, 10),
            programId: slug,
            sessionsCompleted: 1,
            timeSpentSeconds
          });
        }
      }

      // Clear session state
      await storage.clearSessionState(slug, sessionIndex);

      // Emit events to notify subscribers
      dataEvents.emitSessionCompleted(slug, sessionIndex);
      dataEvents.emitProgressUpdated(slug);
      dataEvents.emitHistoryUpdated(slug);
    },
    [state.programs]
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
    dataEvents.emitSessionStateChanged(
      sessionState.slug,
      sessionState.sessionIndex
    );
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

  const upsertExercise = useCallback(
    async (
      input: Pick<Exercise, "id" | "name" | "category" | "icon"> & {
        id?: string;
      }
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
        source: "user"
      });

      const userExercises = await storage.loadExercises();
      const exercisesById = new Map<string, Exercise>();
      for (const e of state.exercises) {
        // keep builtins from current state (already contains seeds)
        if (e.source === "builtin") exercisesById.set(e.id, e);
      }
      for (const e of userExercises) exercisesById.set(e.id, e);
      const merged = Array.from(exercisesById.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      dispatch({ type: "SET_EXERCISES", exercises: merged });
      return saved;
    },
    [state.exercises]
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
          s.blocks.some((b) => b.type === "exercise" && b.exerciseId === id)
        )
      );
      if (referencedBy) {
        throw new Error(
          `This exercise is used by the program “${referencedBy.name}”. Remove it from the program first.`
        );
      }

      await storage.deleteExercise(id);

      const userExercises = await storage.loadExercises();
      const merged = [
        ...state.exercises.filter((e) => e.source === "builtin"),
        ...userExercises
      ].sort((a, b) => a.name.localeCompare(b.name));
      dispatch({ type: "SET_EXERCISES", exercises: merged });
    },
    [state.exercises, state.programs]
  );

  const upsertProgram = useCallback(
    async (
      input: Pick<Program, "id" | "name" | "description" | "sessions"> & {
        id?: string;
      }
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
        source: "user"
      });

      const userPrograms = await storage.loadPrograms();
      const merged = [
        ...state.programs.filter((p) => p.source === "builtin"),
        ...userPrograms
      ].sort((a, b) => a.name.localeCompare(b.name));
      dispatch({ type: "SET_PROGRAMS", programs: merged });
      return saved;
    },
    [state.programs]
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
        ...userPrograms
      ].sort((a, b) => a.name.localeCompare(b.name));
      dispatch({ type: "SET_PROGRAMS", programs: merged });
    },
    [state.programs]
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
      deleteProgram
    }
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
    completedVersion: state.completedVersion
  };
}

export default DataContext;
