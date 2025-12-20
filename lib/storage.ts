/**
 * Unified Storage Layer
 *
 * Single source of truth for all data persistence operations.
 * Works consistently across web (localStorage) and native (FileSystem).
 */

import type {
  ChallengeProgress,
  EventRecord,
  Exercise,
  ExerciseProgress,
  HistoryEntry,
  HistoryFile,
  PersonalRecord,
  PRHistory,
  Program,
  ProgramProgress,
  ProgressHistory,
  SessionState,
  StreakEntry,
  WeeklyStats
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
  EXERCISES: "pwo.exercises",
  PROGRAMS: "pwo.programs",
  PROGRAM_PROGRESS: "pwo.program_progress",
  CHALLENGE_PROGRESS: "pwo.challenge_progress",
  PROGRESS_HISTORY: "pwo.progress_history",
  PERSONAL_RECORDS: "pwo.personal_records",
  WEEKLY_STATS: "pwo.weekly_stats"
} as const;

// ============================================================================
// Platform-specific helpers
// ============================================================================

const isWeb = Platform.OS === "web";
type FileSystemType = typeof FileSystem & {
  documentDirectory?: string;
  cacheDirectory?: string;
};
const FS = FileSystem as FileSystemType;
const DOC_DIR: string = FS.documentDirectory || FS.cacheDirectory || "";

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

function generateId(prefix: string): string {
  // Prefer crypto.randomUUID if available (web)
  const crypto =
    typeof globalThis !== "undefined"
      ? (globalThis as typeof globalThis & { crypto: Crypto })?.crypto
      : undefined;
  const rand =
    typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`;
}

// ============================================================================
// Program progress migration helpers
// ============================================================================

function migrateProgramProgressRecord(raw: any): ProgramProgress | null {
  if (!raw || typeof raw !== "object") return null;

  const programId = String(raw.programId ?? "");
  if (!programId) return null;

  const nowISO = new Date().toISOString();

  // If already in new shape (has runs array), normalize lifetime aggregates.
  if (Array.isArray((raw as any).runs)) {
    const runs = (raw as any).runs.map((run: any, idx: number) => {
      const runId =
        typeof run?.runId === "string" && run.runId.length > 0
          ? run.runId
          : `run_${idx + 1}`;
      const startedAt = String(run?.startedAt ?? nowISO);
      const sessions = Array.isArray(run?.sessions) ? run.sessions : [];
      const completedSessions = sessions.filter(
        (s: any) => s && typeof s === "object" && s.completed
      );
      const totalTimeSpentSeconds =
        typeof run?.totalTimeSpentSeconds === "number"
          ? run.totalTimeSpentSeconds
          : completedSessions.reduce(
              (sum: number, s: any) =>
                sum +
                (typeof s.timeSpentSeconds === "number" ? s.timeSpentSeconds : 0),
              0
            );
      const lastActivityAt =
        typeof run?.lastActivityAt === "string" && run.lastActivityAt
          ? run.lastActivityAt
          : completedSessions.reduce<string | null>((latest, s: any) => {
              const ts = typeof s.completedAt === "string" ? s.completedAt : null;
              if (!ts) return latest;
              if (!latest) return ts;
              return new Date(ts) > new Date(latest) ? ts : latest;
            }, null);
      const updatedAt = String(run?.updatedAt ?? lastActivityAt ?? startedAt);

      return {
        runId,
        startedAt,
        completedAt:
          typeof run?.completedAt === "string" ? run.completedAt : undefined,
        sessions,
        totalTimeSpentSeconds,
        lastActivityAt,
        updatedAt
      };
    });

    const allCompletedSessions = runs.flatMap((r) =>
      r.sessions.filter((s) => s.completed)
    );
    const lifetimeSessionsCompleted = allCompletedSessions.length;
    const lifetimeTimeSpentSeconds = runs.reduce(
      (sum, r) =>
        sum +
        (typeof r.totalTimeSpentSeconds === "number"
          ? r.totalTimeSpentSeconds
          : 0),
      0
    );
    const lastActivityAt = runs.reduce<string | null>((latest, r) => {
      if (!r.lastActivityAt) return latest;
      if (!latest) return r.lastActivityAt;
      return new Date(r.lastActivityAt) > new Date(latest)
        ? r.lastActivityAt
        : latest;
    }, null);
    const updatedAt =
      typeof (raw as any).updatedAt === "string"
        ? (raw as any).updatedAt
        : lastActivityAt ?? runs[0]?.startedAt ?? nowISO;

    return {
      programId,
      runs,
      lifetimeSessionsCompleted,
      lifetimeTimeSpentSeconds,
      lastActivityAt,
      updatedAt,
      // Legacy fields (best-effort for backwards compatibility)
      startedAt:
        typeof (raw as any).startedAt === "string"
          ? (raw as any).startedAt
          : runs[0]?.startedAt,
      completedAt:
        typeof (raw as any).completedAt === "string"
          ? (raw as any).completedAt
          : runs[0]?.completedAt,
      sessions: Array.isArray((raw as any).sessions)
        ? (raw as any).sessions
        : runs[0]?.sessions,
      totalTimeSpentSeconds:
        typeof (raw as any).totalTimeSpentSeconds === "number"
          ? (raw as any).totalTimeSpentSeconds
          : lifetimeTimeSpentSeconds
    };
  }

  // Legacy single-run shape → wrap into first run + lifetime aggregates
  const sessions = Array.isArray((raw as any).sessions)
    ? (raw as any).sessions
    : [];
  const completedSessions = sessions.filter(
    (s: any) => s && typeof s === "object" && s.completed
  );
  const totalTimeSpentSeconds =
    typeof (raw as any).totalTimeSpentSeconds === "number"
      ? (raw as any).totalTimeSpentSeconds
      : completedSessions.reduce(
          (sum: number, s: any) =>
            sum +
            (typeof s.timeSpentSeconds === "number" ? s.timeSpentSeconds : 0),
          0
        );
  const lastActivityAt =
    typeof (raw as any).lastActivityAt === "string" &&
    (raw as any).lastActivityAt
      ? (raw as any).lastActivityAt
      : completedSessions.reduce<string | null>((latest, s: any) => {
          const ts = typeof s.completedAt === "string" ? s.completedAt : null;
          if (!ts) return latest;
          if (!latest) return ts;
          return new Date(ts) > new Date(latest) ? ts : latest;
        }, null);
  const startedAt =
    typeof (raw as any).startedAt === "string" && (raw as any).startedAt
      ? (raw as any).startedAt
      : nowISO;
  const updatedAt =
    typeof (raw as any).updatedAt === "string" && (raw as any).updatedAt
      ? (raw as any).updatedAt
      : lastActivityAt ?? startedAt;

  const run = {
    runId: "run_1",
    startedAt,
    completedAt:
      typeof (raw as any).completedAt === "string" &&
      (raw as any).completedAt
        ? (raw as any).completedAt
        : undefined,
    sessions,
    totalTimeSpentSeconds,
    lastActivityAt,
    updatedAt
  };

  return {
    programId,
    runs: [run],
    lifetimeSessionsCompleted: completedSessions.length,
    lifetimeTimeSpentSeconds: totalTimeSpentSeconds,
    lastActivityAt,
    updatedAt,
    // Legacy fields preserved
    startedAt,
    completedAt: run.completedAt,
    sessions,
    totalTimeSpentSeconds
  };
}

// ============================================================================
// Storage API
// ============================================================================

export const storage = {
  // --------------------------------------------------------------------------
  // Exercises
  // --------------------------------------------------------------------------

  async loadExercises(): Promise<Exercise[]> {
    return read<Exercise[]>(KEYS.EXERCISES, []);
  },

  async saveExercises(exercises: Exercise[]): Promise<void> {
    await write(KEYS.EXERCISES, exercises);
  },

  async upsertExercise(
    input: Omit<Exercise, "createdAt" | "updatedAt"> &
      Partial<Pick<Exercise, "createdAt" | "updatedAt">>
  ): Promise<Exercise> {
    const now = new Date().toISOString();
    const arr = await this.loadExercises();
    const id = input.id || generateId("ex");
    const idx = arr.findIndex((e) => e.id === id);
    const createdAt = idx >= 0 ? arr[idx].createdAt : (input.createdAt ?? now);
    const next: Exercise = {
      id,
      name: input.name,
      category: input.category,
      icon: input.icon,
      source: input.source,
      createdAt,
      updatedAt: input.updatedAt ?? now
    };
    if (idx >= 0) arr[idx] = next;
    else arr.push(next);
    await this.saveExercises(arr);
    return next;
  },

  async deleteExercise(id: string): Promise<void> {
    const arr = await this.loadExercises();
    await this.saveExercises(arr.filter((e) => e.id !== id));
  },

  // --------------------------------------------------------------------------
  // Programs
  // --------------------------------------------------------------------------

  async loadPrograms(): Promise<Program[]> {
    return read<Program[]>(KEYS.PROGRAMS, []);
  },

  async savePrograms(programs: Program[]): Promise<void> {
    await write(KEYS.PROGRAMS, programs);
  },

  async upsertProgram(
    input: Omit<Program, "createdAt" | "updatedAt"> &
      Partial<Pick<Program, "createdAt" | "updatedAt">>
  ): Promise<Program> {
    const now = new Date().toISOString();
    const arr = await this.loadPrograms();
    const id = input.id || generateId("prg");
    const idx = arr.findIndex((p) => p.id === id);
    const createdAt = idx >= 0 ? arr[idx].createdAt : (input.createdAt ?? now);
    const next: Program = {
      id,
      name: input.name,
      description: input.description,
      sessions: input.sessions,
      challengeConfig: input.challengeConfig,
      source: input.source,
      createdAt,
      updatedAt: input.updatedAt ?? now
    };
    if (idx >= 0) arr[idx] = next;
    else arr.push(next);
    await this.savePrograms(arr);
    return next;
  },

  async deleteProgram(id: string): Promise<void> {
    const arr = await this.loadPrograms();
    await this.savePrograms(arr.filter((p) => p.id !== id));
  },

  // --------------------------------------------------------------------------
  // Session State
  // --------------------------------------------------------------------------

  async loadSessionState(
    slug: string,
    sessionIndex: number
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
      (s) => s.slug === state.slug && s.sessionIndex === state.sessionIndex
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
      (s) => !(s.slug === slug && s.sessionIndex === sessionIndex)
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
    event: Omit<EventRecord, "ts"> & { ts?: string }
  ): Promise<void> {
    const arr = await read<EventRecord[]>(KEYS.EVENTS, []);
    const record: EventRecord = {
      ...event,
      ts: event.ts ?? new Date().toISOString()
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

  // --------------------------------------------------------------------------
  // Program Progress
  // --------------------------------------------------------------------------

  async loadProgramProgress(
    programId: string
  ): Promise<ProgramProgress | null> {
    const arr = await read<unknown[]>(KEYS.PROGRAM_PROGRESS, []);
    const migrated = arr
      .map((raw) => migrateProgramProgressRecord(raw))
      .filter((p): p is ProgramProgress => p !== null);
    const match = migrated.find((p) => p.programId === programId) ?? null;
    return match;
  },

  async saveProgramProgress(progress: ProgramProgress): Promise<void> {
    const arr = await read<ProgramProgress[]>(KEYS.PROGRAM_PROGRESS, []);
    const idx = arr.findIndex((p) => p.programId === progress.programId);
    if (idx >= 0) {
      arr[idx] = progress;
    } else {
      arr.push(progress);
    }
    await write(KEYS.PROGRAM_PROGRESS, arr);
  },

  async loadAllProgramProgress(): Promise<ProgramProgress[]> {
    const arr = await read<unknown[]>(KEYS.PROGRAM_PROGRESS, []);
    const migrated = arr
      .map((raw) => migrateProgramProgressRecord(raw))
      .filter((p): p is ProgramProgress => p !== null);
    return migrated;
  },

  // --------------------------------------------------------------------------
  // Challenge Progress
  // --------------------------------------------------------------------------

  async loadChallengeProgress(
    challengeId: string
  ): Promise<ChallengeProgress | null> {
    const arr = await read<ChallengeProgress[]>(KEYS.CHALLENGE_PROGRESS, []);
    return arr.find((c) => c.challengeId === challengeId) ?? null;
  },

  async saveChallengeProgress(progress: ChallengeProgress): Promise<void> {
    const arr = await read<ChallengeProgress[]>(KEYS.CHALLENGE_PROGRESS, []);
    const idx = arr.findIndex((c) => c.challengeId === progress.challengeId);
    if (idx >= 0) {
      arr[idx] = progress;
    } else {
      arr.push(progress);
    }
    await write(KEYS.CHALLENGE_PROGRESS, arr);
  },

  async loadAllChallengeProgress(): Promise<ChallengeProgress[]> {
    return read<ChallengeProgress[]>(KEYS.CHALLENGE_PROGRESS, []);
  },

  // --------------------------------------------------------------------------
  // Progress History
  // --------------------------------------------------------------------------

  async appendProgressHistory(entry: ProgressHistory[number]): Promise<void> {
    const history = await read<ProgressHistory>(KEYS.PROGRESS_HISTORY, []);
    history.push(entry);
    // Keep only last 365 days of history
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 365);
    const filtered = history.filter((e) => new Date(e.date) >= cutoff);
    await write(KEYS.PROGRESS_HISTORY, filtered);
  },

  async getProgressHistory(
    programId?: string,
    challengeId?: string,
    days: number = 30
  ): Promise<ProgressHistory> {
    const history = await read<ProgressHistory>(KEYS.PROGRESS_HISTORY, []);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return history.filter((entry) => {
      if (new Date(entry.date) < cutoff) return false;
      if (programId && entry.programId === programId) return true;
      if (challengeId && entry.challengeId === challengeId) return true;
      if (!programId && !challengeId) return true;
      return false;
    });
  },

  // --------------------------------------------------------------------------
  // Personal Records (PRs)
  // --------------------------------------------------------------------------

  async loadAllPRs(): Promise<PRHistory[]> {
    return read<PRHistory[]>(KEYS.PERSONAL_RECORDS, []);
  },

  async loadPRsForExercise(exerciseId: string): Promise<PersonalRecord[]> {
    const prHistory = await this.loadAllPRs();
    const exercisePRs = prHistory.find((h) => h.exerciseId === exerciseId);
    return exercisePRs?.records ?? [];
  },

  async getLatestPRs(limit: number = 10): Promise<PersonalRecord[]> {
    const prHistory = await this.loadAllPRs();
    const allRecords = prHistory.flatMap((h) => h.records);
    // Sort by achievedAt descending
    allRecords.sort(
      (a, b) =>
        new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
    );
    return allRecords.slice(0, limit);
  },

  async savePR(pr: PersonalRecord): Promise<void> {
    const prHistory = await this.loadAllPRs();
    const idx = prHistory.findIndex((h) => h.exerciseId === pr.exerciseId);

    if (idx >= 0) {
      // Add to existing exercise PRs
      prHistory[idx].records.push(pr);
      // Keep only last 50 PRs per exercise
      if (prHistory[idx].records.length > 50) {
        prHistory[idx].records = prHistory[idx].records.slice(-50);
      }
    } else {
      // New exercise
      prHistory.push({ exerciseId: pr.exerciseId, records: [pr] });
    }

    await write(KEYS.PERSONAL_RECORDS, prHistory);
  },

  /**
   * Detect and save PRs from exercise progress
   * Returns the newly achieved PRs
   */
  async detectAndSavePRs(
    exerciseId: string,
    exerciseProgress: ExerciseProgress,
    sessionId?: string
  ): Promise<PersonalRecord[]> {
    const existingPRs = await this.loadPRsForExercise(exerciseId);
    const newPRs: PersonalRecord[] = [];
    const now = new Date().toISOString();

    // Get current max values from existing PRs
    const currentMaxReps =
      existingPRs
        .filter((pr) => pr.type === "max_reps")
        .reduce((max, pr) => Math.max(max, pr.value), 0) || 0;

    const currentMaxWeight =
      existingPRs
        .filter((pr) => pr.type === "max_weight")
        .reduce((max, pr) => Math.max(max, pr.value), 0) || 0;

    const currentMaxVolume =
      existingPRs
        .filter((pr) => pr.type === "max_volume")
        .reduce((max, pr) => Math.max(max, pr.value), 0) || 0;

    // Check for max reps PR (bodyweight exercises)
    if (exerciseProgress.repsCompleted > currentMaxReps) {
      const pr: PersonalRecord = {
        id: generateId("pr"),
        exerciseId,
        type: "max_reps",
        value: exerciseProgress.repsCompleted,
        achievedAt: now,
        sessionId,
        details: { reps: exerciseProgress.repsCompleted }
      };
      newPRs.push(pr);
    }

    // Check for weight-based PRs from set records
    if (exerciseProgress.sets && exerciseProgress.sets.length > 0) {
      const weightedSets = exerciseProgress.sets.filter(
        (s) => !s.isBodyweight && s.weight && s.weight > 0
      );

      if (weightedSets.length > 0) {
        // Max weight PR
        const maxWeightSet = weightedSets.reduce((max, s) =>
          (s.weight ?? 0) > (max.weight ?? 0) ? s : max
        );
        if ((maxWeightSet.weight ?? 0) > currentMaxWeight) {
          const pr: PersonalRecord = {
            id: generateId("pr"),
            exerciseId,
            type: "max_weight",
            value: maxWeightSet.weight!,
            achievedAt: now,
            sessionId,
            details: { weight: maxWeightSet.weight, reps: maxWeightSet.reps }
          };
          newPRs.push(pr);
        }

        // Max volume PR (weight x reps for a single set)
        const maxVolumeSet = weightedSets.reduce((max, s) => {
          const vol = (s.weight ?? 0) * s.reps;
          const maxVol = (max.weight ?? 0) * max.reps;
          return vol > maxVol ? s : max;
        });
        const maxSetVolume = (maxVolumeSet.weight ?? 0) * maxVolumeSet.reps;
        if (maxSetVolume > currentMaxVolume) {
          const pr: PersonalRecord = {
            id: generateId("pr"),
            exerciseId,
            type: "max_volume",
            value: maxSetVolume,
            achievedAt: now,
            sessionId,
            details: { weight: maxVolumeSet.weight, reps: maxVolumeSet.reps }
          };
          newPRs.push(pr);
        }

        // Estimated 1RM (Epley formula: weight * (1 + reps/30))
        const best1RM = weightedSets.reduce((max, s) => {
          if (!s.weight || s.reps === 0) return max;
          const estimated = s.weight * (1 + s.reps / 30);
          return estimated > max ? estimated : max;
        }, 0);

        const currentMax1RM =
          existingPRs
            .filter((pr) => pr.type === "estimated_1rm")
            .reduce((max, pr) => Math.max(max, pr.value), 0) || 0;

        if (best1RM > currentMax1RM) {
          const pr: PersonalRecord = {
            id: generateId("pr"),
            exerciseId,
            type: "estimated_1rm",
            value: Math.round(best1RM * 10) / 10, // Round to 1 decimal
            achievedAt: now,
            sessionId
          };
          newPRs.push(pr);
        }
      }
    }

    // Save all new PRs
    for (const pr of newPRs) {
      await this.savePR(pr);
    }

    return newPRs;
  },

  /**
   * Get the current best PR for each type for an exercise
   */
  async getCurrentPRs(
    exerciseId: string
  ): Promise<Map<PersonalRecord["type"], PersonalRecord>> {
    const prs = await this.loadPRsForExercise(exerciseId);
    const bestPRs = new Map<PersonalRecord["type"], PersonalRecord>();

    for (const pr of prs) {
      const existing = bestPRs.get(pr.type);
      if (!existing || pr.value > existing.value) {
        bestPRs.set(pr.type, pr);
      }
    }

    return bestPRs;
  },

  // --------------------------------------------------------------------------
  // Weekly Stats
  // --------------------------------------------------------------------------

  /**
   * Get the start of the week (Monday) for a given date
   */
  getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  /**
   * Get the end of the week (Sunday) for a given date
   */
  getWeekEnd(date: Date): Date {
    const start = this.getWeekStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  },

  async loadWeeklyStats(): Promise<WeeklyStats[]> {
    return read<WeeklyStats[]>(KEYS.WEEKLY_STATS, []);
  },

  async saveWeeklyStats(stats: WeeklyStats[]): Promise<void> {
    await write(KEYS.WEEKLY_STATS, stats);
  },

  /**
   * Get or create weekly stats for a specific week
   */
  async getWeeklyStats(weekStart?: Date): Promise<WeeklyStats> {
    const targetWeekStart = weekStart
      ? this.getWeekStart(weekStart)
      : this.getWeekStart(new Date());
    const weekStartISO = targetWeekStart.toISOString().slice(0, 10);
    const weekEndISO = this.getWeekEnd(targetWeekStart)
      .toISOString()
      .slice(0, 10);

    const allStats = await this.loadWeeklyStats();
    const existing = allStats.find((s) => s.weekStart === weekStartISO);

    if (existing) return existing;

    // Create new week stats by aggregating from progress data
    return this.calculateWeeklyStats(targetWeekStart);
  },

  /**
   * Calculate weekly stats from progress history and PRs
   */
  async calculateWeeklyStats(weekStart: Date): Promise<WeeklyStats> {
    const weekStartISO = weekStart.toISOString().slice(0, 10);
    const weekEnd = this.getWeekEnd(weekStart);
    const weekEndISO = weekEnd.toISOString().slice(0, 10);

    // Get all program and challenge progress
    const [programProgress, challengeProgress, prHistory, history] =
      await Promise.all([
        this.loadAllProgramProgress(),
        this.loadAllChallengeProgress(),
        this.loadAllPRs(),
        this.getProgressHistory(undefined, undefined, 7)
      ]);

    let workoutsCompleted = 0;
    let totalTimeSeconds = 0;
    let totalVolume = 0;
    let totalReps = 0;
    const exercisesSet = new Set<string>();

    // Process program progress
    for (const prog of programProgress) {
      for (const run of prog.runs ?? []) {
        for (const session of run.sessions ?? []) {
          if (!session.completed || !session.completedAt) continue;
          const sessionDate = session.completedAt.slice(0, 10);
          if (sessionDate >= weekStartISO && sessionDate <= weekEndISO) {
            workoutsCompleted++;
            totalTimeSeconds += session.timeSpentSeconds ?? 0;

            for (const ex of session.exercises ?? []) {
              exercisesSet.add(ex.exerciseId);
              totalReps += ex.repsCompleted ?? 0;
              totalVolume += ex.totalVolume ?? 0;
            }
          }
        }
      }
    }

    // Process challenge progress
    for (const challenge of challengeProgress) {
      for (const session of challenge.sessions ?? []) {
        if (!session.completed || !session.completedAt) continue;
        const sessionDate = session.completedAt.slice(0, 10);
        if (sessionDate >= weekStartISO && sessionDate <= weekEndISO) {
          workoutsCompleted++;
          totalTimeSeconds += session.timeSpentSeconds ?? 0;

          for (const ex of session.exercises ?? []) {
            exercisesSet.add(ex.exerciseId);
            totalReps += ex.repsCompleted ?? 0;
          }
        }
      }
    }

    // Count PRs achieved this week
    let prsAchieved = 0;
    for (const exercisePRs of prHistory) {
      for (const pr of exercisePRs.records) {
        const prDate = pr.achievedAt.slice(0, 10);
        if (prDate >= weekStartISO && prDate <= weekEndISO) {
          prsAchieved++;
        }
      }
    }

    // Calculate current streak
    const currentStreak = await this.calculateCurrentStreak();

    return {
      weekStart: weekStartISO,
      weekEnd: weekEndISO,
      workoutsCompleted,
      workoutGoal: 4, // Default goal
      totalTimeSeconds,
      totalVolume,
      totalReps,
      exercisesPerformed: Array.from(exercisesSet),
      prsAchieved,
      currentStreak
    };
  },

  /**
   * Calculate the current workout streak (consecutive days)
   */
  async calculateCurrentStreak(): Promise<number> {
    const [programProgress, challengeProgress] = await Promise.all([
      this.loadAllProgramProgress(),
      this.loadAllChallengeProgress()
    ]);

    // Collect all workout dates
    const workoutDates = new Set<string>();

    for (const prog of programProgress) {
      for (const run of prog.runs ?? []) {
        for (const session of run.sessions ?? []) {
          if (session.completed && session.completedAt) {
            workoutDates.add(session.completedAt.slice(0, 10));
          }
        }
      }
    }

    for (const challenge of challengeProgress) {
      for (const session of challenge.sessions ?? []) {
        if (session.completed && session.completedAt) {
          workoutDates.add(session.completedAt.slice(0, 10));
        }
      }
    }

    if (workoutDates.size === 0) return 0;

    // Sort dates descending
    const sortedDates = Array.from(workoutDates).sort().reverse();

    // Check streak from today or yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().slice(0, 10);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().slice(0, 10);

    // Streak must start from today or yesterday
    if (sortedDates[0] !== todayISO && sortedDates[0] !== yesterdayISO) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date(sortedDates[0]);

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      const diff = Math.floor(
        (checkDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diff === 0) {
        streak++;
        checkDate = new Date(date);
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (diff > 1) {
        break;
      }
    }

    return streak;
  },

  /**
   * Get consistency data for heatmap (last N weeks)
   * Returns a map of date -> workout count
   */
  async getConsistencyData(weeks: number = 12): Promise<Map<string, number>> {
    const [programProgress, challengeProgress] = await Promise.all([
      this.loadAllProgramProgress(),
      this.loadAllChallengeProgress()
    ]);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - weeks * 7);
    const cutoffISO = cutoffDate.toISOString().slice(0, 10);

    const workoutCounts = new Map<string, number>();

    // Count program workouts
    for (const prog of programProgress) {
      for (const run of prog.runs ?? []) {
        for (const session of run.sessions ?? []) {
          if (session.completed && session.completedAt) {
            const dateISO = session.completedAt.slice(0, 10);
            if (dateISO >= cutoffISO) {
              workoutCounts.set(dateISO, (workoutCounts.get(dateISO) ?? 0) + 1);
            }
          }
        }
      }
    }

    // Count challenge workouts
    for (const challenge of challengeProgress) {
      for (const session of challenge.sessions ?? []) {
        if (session.completed && session.completedAt) {
          const dateISO = session.completedAt.slice(0, 10);
          if (dateISO >= cutoffISO) {
            workoutCounts.set(dateISO, (workoutCounts.get(dateISO) ?? 0) + 1);
          }
        }
      }
    }

    return workoutCounts;
  },

  /**
   * Get exercise progression data for charts
   * Returns data points with date and value (reps or weight)
   */
  async getExerciseProgression(
    exerciseId: string,
    days: number = 30
  ): Promise<{ date: string; reps: number; maxWeight?: number; volume?: number }[]> {
    const [programProgress, challengeProgress] = await Promise.all([
      this.loadAllProgramProgress(),
      this.loadAllChallengeProgress()
    ]);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffISO = cutoffDate.toISOString().slice(0, 10);

    const dataPoints: {
      date: string;
      reps: number;
      maxWeight?: number;
      volume?: number;
    }[] = [];

    // Process program sessions
    for (const prog of programProgress) {
      for (const run of prog.runs ?? []) {
        for (const session of run.sessions ?? []) {
          if (!session.completed || !session.completedAt) continue;
          const dateISO = session.completedAt.slice(0, 10);
          if (dateISO < cutoffISO) continue;

          for (const ex of session.exercises ?? []) {
            if (ex.exerciseId !== exerciseId) continue;

            let maxWeight: number | undefined;
            let volume: number | undefined;

            if (ex.sets && ex.sets.length > 0) {
              const weightedSets = ex.sets.filter(
                (s) => !s.isBodyweight && s.weight
              );
              if (weightedSets.length > 0) {
                maxWeight = Math.max(...weightedSets.map((s) => s.weight ?? 0));
                volume = weightedSets.reduce(
                  (sum, s) => sum + (s.weight ?? 0) * s.reps,
                  0
                );
              }
            }

            dataPoints.push({
              date: dateISO,
              reps: ex.repsCompleted,
              maxWeight,
              volume
            });
          }
        }
      }
    }

    // Process challenge sessions
    for (const challenge of challengeProgress) {
      for (const session of challenge.sessions ?? []) {
        if (!session.completed || !session.completedAt) continue;
        const dateISO = session.completedAt.slice(0, 10);
        if (dateISO < cutoffISO) continue;

        for (const ex of session.exercises ?? []) {
          if (ex.exerciseId !== exerciseId) continue;

          dataPoints.push({
            date: dateISO,
            reps: ex.repsCompleted
          });
        }
      }
    }

    // Sort by date
    dataPoints.sort((a, b) => a.date.localeCompare(b.date));

    return dataPoints;
  },

  // --------------------------------------------------------------------------
  // Data Management
  // --------------------------------------------------------------------------

  /**
   * Clear all user data (progress, history, PRs, etc.)
   * Does NOT clear exercises and programs (library data)
   */
  async clearAllProgressData(): Promise<void> {
    await Promise.all([
      write(KEYS.SESSIONS, []),
      write(KEYS.EVENTS, []),
      write(KEYS.HISTORY, []),
      write(KEYS.PROGRESS, []),
      write(KEYS.PROGRAM_PROGRESS, []),
      write(KEYS.CHALLENGE_PROGRESS, []),
      write(KEYS.PROGRESS_HISTORY, []),
      write(KEYS.PERSONAL_RECORDS, []),
      write(KEYS.WEEKLY_STATS, [])
    ]);
  },

  /**
   * Clear ALL data including library (exercises and programs)
   * Use with caution - this is a full reset
   */
  async clearAllData(): Promise<void> {
    await Promise.all([
      write(KEYS.SESSIONS, []),
      write(KEYS.EVENTS, []),
      write(KEYS.HISTORY, []),
      write(KEYS.PROGRESS, []),
      write(KEYS.EXERCISES, []),
      write(KEYS.PROGRAMS, []),
      write(KEYS.PROGRAM_PROGRESS, []),
      write(KEYS.CHALLENGE_PROGRESS, []),
      write(KEYS.PROGRESS_HISTORY, []),
      write(KEYS.PERSONAL_RECORDS, []),
      write(KEYS.WEEKLY_STATS, [])
    ]);
  }
};

export default storage;
