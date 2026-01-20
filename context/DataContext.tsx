/**
 * Data Context - Global State Management
 *
 * Provides reactive access to app data with automatic updates
 * when data changes anywhere in the app.
 */

import { generateChallengeSessions } from "@/hooks/data/useChallengeSessions";
import { canSafelyDelete } from "@/lib/dependencyChecker";
import { dataEvents } from "@/lib/events";
import { storage } from "@/lib/storage";
import {
  validateExercise,
  validateModificationPermissions,
  validateUniqueName
} from "@/lib/validation";
import type {
  AuditLogEntry,
  ChallengeProgress,
  DataAction,
  DataEvent,
  DataState,
  DataType,
  DependencyCheck,
  EnhancedDataActions,
  EnhancedDataState,
  EventRecord,
  Exercise,
  ExerciseProgress,
  ExportData,
  HistoryEntry,
  ImportData,
  ImportResult,
  LegacyProgram,
  Program,
  ProgramProgress,
  SearchFacets,
  SearchQuery,
  SessionState,
  UsageStats,
  WorkoutProgress
} from "@/types";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef
} from "react";

type DataContextValue = {
  state: DataState & EnhancedDataState;

  // Actions
  actions: {
    // Session completion flow - call this when a session is completed
    completeSession: (
      slug: string,
      sessionIndex: number,
      summary: string,
      timeSpentSeconds?: number
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
      input: Pick<
        Program,
        | "id"
        | "name"
        | "description"
        | "blocks"
        | "challengeConfig"
        | "initialWarmup"
        | "defaultRestBetweenExercises"
      > & {
        id?: string;
      }
    ) => Promise<Program>;
    deleteProgram: (id: string) => Promise<void>;
  } & EnhancedDataActions;
};

// ============================================================================
// Initial State & Reducer
// ============================================================================

export const initialState: DataState & EnhancedDataState = {
  exercises: [],
  exercisesLoading: true,
  programs: [],
  programsLoading: true,
  lastCompletedSlug: null,
  progressVersion: 0,
  historyVersion: 0,
  completedVersion: 0,
  // Enhanced state
  searchCache: new Map(),
  validationErrors: [],
  operationStatus: { type: "idle" },
  auditLog: []
};

export function dataReducer(
  state: DataState & EnhancedDataState,
  action: DataAction
): DataState & EnhancedDataState {
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

  // Use refs for caches that don't need to trigger re-renders
  const searchCacheRef = useRef<Map<string, any>>(new Map());
  const auditLogRef = useRef<AuditLogEntry[]>([]);

  function migrateProgram(p: LegacyProgram): Program {
    if (!p || typeof p !== "object") return p as Program;

    // Check if this is already a modern Program with blocks
    const existingBlocks = (p as any).blocks;
    const hasValidBlocks =
      Array.isArray(existingBlocks) && existingBlocks.length > 0;

    // For the new structure, programs should already have blocks
    // Preserve existing blocks if present, otherwise start with empty array
    const result: Program = {
      id: String(p.id ?? ""),
      name: String(p.name ?? ""),
      description:
        typeof p.description === "string" ? p.description : undefined,
      blocks: hasValidBlocks ? existingBlocks : [],
      createdAt: String(p.createdAt ?? new Date().toISOString()),
      updatedAt: String(p.updatedAt ?? new Date().toISOString()),
      source: p.source === "builtin" ? "builtin" : "user",
      // Preserve initialWarmup and defaultRestBetweenExercises if present
      initialWarmup: (p as any).initialWarmup,
      defaultRestBetweenExercises: (p as any).defaultRestBetweenExercises
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
          typeof config.warmUpSeconds === "number" ? config.warmUpSeconds : 180,
        breakSeconds:
          typeof config.breakSeconds === "number" ? config.breakSeconds : 90,
        weeklyIncreasePercent:
          typeof config.weeklyIncreasePercent === "number"
            ? config.weeklyIncreasePercent
            : 10
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
    async (
      slug: string,
      sessionIndex: number,
      summary: string,
      providedTimeSpentSeconds?: number
    ) => {
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

        // Use provided time if available, otherwise calculate from events
        let timeSpentSeconds: number;
        const exerciseProgressMap = new Map<string, ExerciseProgress>();

        // If time was provided, use it; otherwise calculate from events
        if (providedTimeSpentSeconds !== undefined) {
          timeSpentSeconds = providedTimeSpentSeconds;
        } else {
          timeSpentSeconds = 0;
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
              const durationSeconds = data?.["durationSeconds"];
              if (typeof durationSeconds === "number") {
                timeSpentSeconds += durationSeconds;
              }
            }
          }
        }

        // Always process exercise progress from events
        for (const event of sessionEvents) {
          if (event.type === "set_completed") {
            const data = event.data as Record<string, unknown>;
            const exerciseId = data?.["exerciseId"];
            const reps = data?.["reps"];

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
          }
        }

        const exerciseProgress = Array.from(exerciseProgressMap.values());

        // Detect and save personal records for each exercise
        const sessionId = `${slug}_session_${sessionIndex}`;
        for (const exProgress of exerciseProgress) {
          try {
            await storage.detectAndSavePRs(
              exProgress.exerciseId,
              exProgress,
              sessionId
            );
          } catch (error) {
            // Log error but don't fail session completion
            console.error(
              `Failed to detect PRs for exercise ${exProgress.exerciseId}:`,
              error
            );
          }
        }

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
            const workoutId = `${slug}_workout_${sessionIndex}`;
            const workoutProgressIndex = existing.workouts.findIndex(
              (w) => w.workoutId === workoutId
            );
            const workoutProgress: WorkoutProgress = {
              workoutId,
              programId: slug,
              completed: true,
              completedAt: dateISO,
              timeSpentSeconds,
              exercises: exerciseProgress
            };

            if (workoutProgressIndex >= 0) {
              existing.workouts[workoutProgressIndex] = workoutProgress;
            } else {
              existing.workouts.push(workoutProgress);
            }

            // Recalculate total reps
            totalRepsCompleted = existing.workouts
              .filter((w) => w.completed)
              .reduce((sum, w) => {
                return (
                  sum +
                  w.exercises.reduce((eSum, e) => eSum + e.repsCompleted, 0)
                );
              }, 0);

            existing.totalRepsCompleted = totalRepsCompleted;
            existing.lastActivityAt = dateISO;
            existing.updatedAt = dateISO;

            // Check if challenge is completed
            const completedWorkouts = existing.workouts.filter(
              (w) => w.completed
            );
            if (
              completedWorkouts.length === sessions.length &&
              totalRepsCompleted >= program.challengeConfig.targetReps
            ) {
              existing.completedAt = dateISO;
            }

            await storage.saveChallengeProgress(existing);
          } else {
            // Create new challenge progress
            const workoutId = `${slug}_workout_${sessionIndex}`;
            const newProgress: ChallengeProgress = {
              challengeId: slug,
              startedAt: dateISO,
              workouts: [
                {
                  workoutId,
                  programId: slug,
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
            workoutsCompleted: 1,
            totalReps: totalRepsCompleted
          });
        } else {
          // Update program progress (open-ended runs model)
          const existing = await storage.loadProgramProgress(slug);

          const workoutId = `${slug}_workout_${sessionIndex}`;
          const workoutProgress: WorkoutProgress = {
            workoutId,
            programId: slug,
            completed: true,
            completedAt: dateISO,
            timeSpentSeconds,
            exercises: exerciseProgress
          };

          if (existing) {
            const workouts = existing.workouts ?? [];

            // Upsert workout
            const workoutIdx = workouts.findIndex(
              (w) => w.workoutId === workoutId
            );
            if (workoutIdx >= 0) {
              workouts[workoutIdx] = workoutProgress;
            } else {
              workouts.push(workoutProgress);
            }

            // Recalculate aggregates
            const completedWorkouts = workouts.filter((w) => w.completed);
            const totalTimeSpentSeconds = completedWorkouts.reduce(
              (sum, w) => sum + (w.timeSpentSeconds || 0),
              0
            );

            existing.workouts = workouts;
            existing.lifetimeWorkoutsCompleted = completedWorkouts.length;
            existing.lifetimeTimeSpentSeconds = totalTimeSpentSeconds;
            existing.lastActivityAt = dateISO;
            existing.updatedAt = dateISO;

            await storage.saveProgramProgress(existing);
          } else {
            // Create new program progress
            const newProgress: ProgramProgress = {
              programId: slug,
              workouts: [workoutProgress],
              lifetimeWorkoutsCompleted: 1,
              lifetimeTimeSpentSeconds: timeSpentSeconds,
              lastActivityAt: dateISO,
              updatedAt: dateISO
            };
            await storage.saveProgramProgress(newProgress);
          }

          // Store history entry
          await storage.appendProgressHistory({
            date: dateISO.slice(0, 10),
            programId: slug,
            workoutsCompleted: 1,
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
    // Reload exercises and programs from storage
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

        dispatch({ type: "SET_EXERCISES", exercises: mergedExercises });
      } catch (error) {
        console.error("Failed to reload exercises:", error);
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

        dispatch({ type: "SET_PROGRAMS", programs: mergedPrograms });
      } catch (error) {
        console.error("Failed to reload programs:", error);
        dispatch({ type: "SET_PROGRAMS_LOADING", loading: false });
      }
    })();

    // Also increment version counters for progress/history
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

      // Check modification permissions for existing exercises
      if (id) {
        const existing = state.exercises.find((e) => e.id === id);
        if (existing) {
          const permissionResult = validateModificationPermissions(
            existing.source,
            "edit"
          );
          if (!permissionResult.isValid) {
            throw new Error(permissionResult.errors[0].message);
          }
        }
      }

      // Validate exercise data
      const validationResult = validateExercise(input);
      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors
          .map((e) => e.message)
          .join("; ");
        throw new Error(`Validation failed: ${errorMessages}`);
      }

      // Check for name uniqueness
      const nameValidation = validateUniqueName(
        input.name,
        id,
        state.exercises
      );
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.errors[0].message);
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
      // Check modification permissions
      const permissionResult = validateModificationPermissions(
        existing.source,
        "delete"
      );
      if (!permissionResult.isValid) {
        throw new Error(permissionResult.errors[0].message);
      }

      // Check dependencies using the dependency checker
      const dependencyCheck = canSafelyDelete(
        "exercises",
        id,
        state.exercises,
        state.programs
      );
      if (!dependencyCheck.canDelete) {
        const warnings = dependencyCheck.warnings.join("; ");
        throw new Error(`Cannot delete exercise: ${warnings}`);
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
      input: Pick<
        Program,
        | "id"
        | "name"
        | "description"
        | "blocks"
        | "challengeConfig"
        | "initialWarmup"
        | "defaultRestBetweenExercises"
      > & {
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
        blocks: input.blocks,
        challengeConfig: input.challengeConfig,
        initialWarmup: input.initialWarmup,
        defaultRestBetweenExercises: input.defaultRestBetweenExercises,
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

  // Enhanced Actions Implementation
  const bulkDeleteExercises = useCallback(
    async (ids: string[]) => {
      const errors: string[] = [];

      for (const id of ids) {
        try {
          const existing = state.exercises.find((e) => e.id === id);
          if (!existing) continue;

          if (existing.source === "builtin") {
            errors.push(
              `Built-in exercise "${existing.name}" cannot be deleted.`
            );
            continue;
          }

          // Check dependencies
          const referencedBy = state.programs.find((p) =>
            p.blocks.some((b) => b.type === "exercise" && b.exerciseId === id)
          );

          if (referencedBy) {
            errors.push(
              `Exercise "${existing.name}" is used by program "${referencedBy.name}".`
            );
            continue;
          }

          await storage.deleteExercise(id);
        } catch (error) {
          errors.push(
            `Failed to delete exercise ${id}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      if (errors.length > 0) {
        throw new Error(
          `Bulk delete completed with errors:\n${errors.join("\n")}`
        );
      }

      // Refresh exercises list
      const userExercises = await storage.loadExercises();
      const merged = [
        ...state.exercises.filter((e) => e.source === "builtin"),
        ...userExercises
      ].sort((a, b) => a.name.localeCompare(b.name));
      dispatch({ type: "SET_EXERCISES", exercises: merged });
    },
    [state.exercises, state.programs]
  );

  const bulkDeletePrograms = useCallback(
    async (ids: string[]) => {
      const errors: string[] = [];

      for (const id of ids) {
        try {
          const existing = state.programs.find((p) => p.id === id);
          if (!existing) continue;

          if (existing.source === "builtin") {
            errors.push(
              `Built-in program "${existing.name}" cannot be deleted.`
            );
            continue;
          }

          await storage.deleteProgram(id);
        } catch (error) {
          errors.push(
            `Failed to delete program ${id}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      if (errors.length > 0) {
        throw new Error(
          `Bulk delete completed with errors:\n${errors.join("\n")}`
        );
      }

      // Refresh programs list
      const userPrograms = await storage.loadPrograms();
      const merged = [
        ...state.programs.filter((p) => p.source === "builtin"),
        ...userPrograms
      ].sort((a, b) => a.name.localeCompare(b.name));
      dispatch({ type: "SET_PROGRAMS", programs: merged });
    },
    [state.programs]
  );

  const duplicateProgram = useCallback(
    async (id: string, newName: string): Promise<Program> => {
      const existing = state.programs.find((p) => p.id === id);
      if (!existing) {
        throw new Error("Program not found");
      }

      // Check for name conflicts
      const nameExists = state.programs.some((p) => p.name === newName);
      if (nameExists) {
        throw new Error(`A program with the name "${newName}" already exists`);
      }

      const duplicated: Program = {
        ...existing,
        id: "", // Will be generated by storage
        name: newName,
        source: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const saved = await storage.upsertProgram(duplicated);

      // Refresh programs list
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

  const searchData = useCallback(
    async (query: SearchQuery) => {
      // Create cache key
      const cacheKey = JSON.stringify(query);

      // Check cache first (using ref to avoid state mutation)
      const cached = searchCacheRef.current.get(cacheKey);
      if (cached) {
        return cached;
      }

      let items: any[] = [];

      // Determine which data to search
      switch (query.type) {
        case "exercises":
          items = state.exercises;
          break;
        case "programs":
          items = state.programs.filter((p: Program) => !p.challengeConfig);
          break;
        case "challenges":
          items = state.programs.filter((p: Program) =>
            Boolean(p.challengeConfig)
          );
          break;
        default:
          items = [...state.exercises, ...state.programs];
      }

      // Apply text search
      if (query.query) {
        const searchTerm = query.query.toLowerCase();
        items = items.filter(
          (item) =>
            item.name?.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm)
        );
      }

      // Apply filters
      if (query.filters) {
        if (query.filters.category && query.filters.category.length > 0) {
          items = items.filter(
            (item) =>
              item.category && query.filters!.category!.includes(item.category)
          );
        }

        if (query.filters.source && query.filters.source.length > 0) {
          items = items.filter(
            (item) =>
              item.source && query.filters!.source!.includes(item.source)
          );
        }

        if (query.filters.dateRange) {
          const { start, end } = query.filters.dateRange;
          items = items.filter((item) => {
            const itemDate = item.createdAt || item.updatedAt;
            return itemDate >= start && itemDate <= end;
          });
        }
      }

      // Apply sorting
      const sortBy = query.sortBy || "name";
      const sortOrder = query.sortOrder || "asc";

      items.sort((a, b) => {
        let aVal: any, bVal: any;

        switch (sortBy) {
          case "name":
            aVal = a.name || "";
            bVal = b.name || "";
            break;
          case "created":
            aVal = a.createdAt || "";
            bVal = b.createdAt || "";
            break;
          case "updated":
            aVal = a.updatedAt || "";
            bVal = b.updatedAt || "";
            break;
          case "usage":
            aVal = a.usageCount || 0;
            bVal = b.usageCount || 0;
            break;
          default:
            aVal = a.name || "";
            bVal = b.name || "";
        }

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === "asc" ? comparison : -comparison;
      });

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 50;
      const totalCount = items.length;
      const paginatedItems = items.slice(offset, offset + limit);

      // Generate facets
      const facets: SearchFacets = {
        categories: {},
        sources: {},
        difficulties: {},
        tags: {}
      };

      items.forEach((item) => {
        if (item.category) {
          facets.categories[item.category] =
            (facets.categories[item.category] || 0) + 1;
        }
        if (item.source) {
          facets.sources[item.source] = (facets.sources[item.source] || 0) + 1;
        }
        // Only exercises have difficulty and tags
        if (query.type === "exercises") {
          if (item.difficulty) {
            facets.difficulties[item.difficulty] =
              (facets.difficulties[item.difficulty] || 0) + 1;
          }
          if (item.tags) {
            item.tags.forEach((tag: string) => {
              facets.tags[tag] = (facets.tags[tag] || 0) + 1;
            });
          }
        }
      });

      const result = {
        items: paginatedItems,
        totalCount,
        hasMore: offset + limit < totalCount,
        facets
      };

      // Cache the result (using ref to avoid state mutation)
      searchCacheRef.current.set(cacheKey, result);

      return result;
    },
    [state.exercises, state.programs]
  );

  const exportData = useCallback(
    async (type: DataType, ids?: string[]): Promise<ExportData> => {
      let data: any[] = [];

      switch (type) {
        case "exercises":
          data = ids
            ? state.exercises.filter((e) => ids.includes(e.id))
            : state.exercises.filter((e) => e.source === "user");
          break;
        case "programs":
          data = ids
            ? state.programs.filter(
                (p) => ids.includes(p.id) && !p.challengeConfig
              )
            : state.programs.filter(
                (p) => p.source === "user" && !p.challengeConfig
              );
          break;
        case "challenges":
          data = ids
            ? state.programs.filter(
                (p) => ids.includes(p.id) && p.challengeConfig
              )
            : state.programs.filter(
                (p) => p.source === "user" && p.challengeConfig
              );
          break;
      }

      return {
        type,
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        data,
        metadata: {
          exportedBy: "Progressive Workout App",
          itemCount: data.length
        }
      };
    },
    [state.exercises, state.programs]
  );

  const importData = useCallback(
    async (importData: ImportData): Promise<ImportResult> => {
      const result: ImportResult = {
        success: true,
        imported: [],
        skipped: [],
        errors: [],
        conflicts: []
      };

      for (const item of importData.data) {
        try {
          switch (importData.type) {
            case "exercises":
              // Check for conflicts
              const existingExercise = state.exercises.find(
                (e) => e.id === item.id || e.name === item.name
              );
              if (existingExercise) {
                result.conflicts.push({
                  itemId: item.id,
                  itemName: item.name,
                  conflictType:
                    existingExercise.id === item.id
                      ? "id_conflict"
                      : "name_conflict",
                  resolution: "skip"
                });
                result.skipped.push({
                  name: item.name,
                  type: "exercises",
                  reason: "Name or ID conflict"
                });
                continue;
              }

              const savedExercise = await storage.upsertExercise({
                ...item,
                id: "", // Generate new ID
                source: "user",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });

              result.imported.push({
                id: savedExercise.id,
                name: savedExercise.name,
                type: "exercises",
                action: "created"
              });
              break;

            case "programs":
            case "challenges":
              // Check for conflicts
              const existingProgram = state.programs.find(
                (p) => p.id === item.id || p.name === item.name
              );
              if (existingProgram) {
                result.conflicts.push({
                  itemId: item.id,
                  itemName: item.name,
                  conflictType:
                    existingProgram.id === item.id
                      ? "id_conflict"
                      : "name_conflict",
                  resolution: "skip"
                });
                result.skipped.push({
                  name: item.name,
                  type: importData.type,
                  reason: "Name or ID conflict"
                });
                continue;
              }

              const savedProgram = await storage.upsertProgram({
                ...item,
                id: "", // Generate new ID
                source: "user",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });

              result.imported.push({
                id: savedProgram.id,
                name: savedProgram.name,
                type: importData.type,
                action: "created"
              });
              break;
          }
        } catch (error) {
          result.errors.push({
            item,
            reason: error instanceof Error ? error.message : "Unknown error",
            code: "VALIDATION_FAILED" as any,
            recoverable: false
          });
          result.success = false;
        }
      }

      // Refresh data after import
      if (result.imported.length > 0) {
        if (importData.type === "exercises") {
          const userExercises = await storage.loadExercises();
          const merged = [
            ...state.exercises.filter((e) => e.source === "builtin"),
            ...userExercises
          ].sort((a, b) => a.name.localeCompare(b.name));
          dispatch({ type: "SET_EXERCISES", exercises: merged });
        } else {
          const userPrograms = await storage.loadPrograms();
          const merged = [
            ...state.programs.filter((p) => p.source === "builtin"),
            ...userPrograms
          ].sort((a, b) => a.name.localeCompare(b.name));
          dispatch({ type: "SET_PROGRAMS", programs: merged });
        }
      }

      return result;
    },
    [state.exercises, state.programs]
  );

  const validateDependencies = useCallback(
    async (type: DataType, id: string): Promise<DependencyCheck> => {
      const dependencies: DependencyCheck["dependencies"] = {};
      const warnings: string[] = [];
      let canDelete = true;

      if (type === "exercises") {
        const referencingPrograms = state.programs.filter((p) =>
          p.blocks.some((b) => b.type === "exercise" && b.exerciseId === id)
        );

        if (referencingPrograms.length > 0) {
          dependencies.programs = referencingPrograms;
          canDelete = false;
          warnings.push(
            `Exercise is referenced by ${referencingPrograms.length} program(s)`
          );
        }

        const referencingChallenges = state.programs.filter(
          (p) => p.challengeConfig?.exerciseId === id
        );

        if (referencingChallenges.length > 0) {
          dependencies.challenges = referencingChallenges;
          canDelete = false;
          warnings.push(
            `Exercise is used by ${referencingChallenges.length} challenge(s)`
          );
        }
      }

      return {
        canDelete,
        dependencies,
        warnings
      };
    },
    [state.programs]
  );

  const getUsageStats = useCallback(
    async (type: DataType, id: string): Promise<UsageStats> => {
      // This is a placeholder implementation
      // In a real app, you'd query actual usage data from storage
      return {
        entityId: id,
        entityType: type,
        totalUses: 0,
        lastUsed: undefined,
        averageSessionDuration: 0,
        popularityScore: 0,
        trends: []
      };
    },
    []
  );

  const logAuditEntry = useCallback(
    async (entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void> => {
      const auditEntry: AuditLogEntry = {
        ...entry,
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };

      // In a real implementation, you'd persist this to storage
      // For now, we'll just add it to the in-memory audit log (using ref to avoid state mutation)
      auditLogRef.current.push(auditEntry);
    },
    []
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
      // Enhanced actions
      bulkDeleteExercises,
      bulkDeletePrograms,
      duplicateProgram,
      searchData,
      exportData,
      importData,
      validateDependencies,
      getUsageStats,
      logAuditEntry
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
