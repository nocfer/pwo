import { storage } from "@/lib/storage";
import { beforeEach, describe, expect, it } from "vitest";

// Mock localStorage globally
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    length: 0
  } as Storage;
})();

// Set up global localStorage and window object for Node.js
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true
});
Object.defineProperty(globalThis, "window", {
  value: {
    localStorage: localStorageMock
  },
  writable: true
});

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("exercises", () => {
    it("loadExercises returns empty array by default", async () => {
      const exercises = await storage.loadExercises();
      expect(exercises).toEqual([]);
    });

    it("saveExercises and loadExercises round-trip", async () => {
      const exercises = [
        {
          id: "ex_1",
          name: "Push Ups",
          category: "strength" as const,
          icon: "barbell",
          source: "builtin" as const,
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z"
        }
      ];

      await storage.saveExercises(exercises);
      const loaded = await storage.loadExercises();
      expect(loaded).toEqual(exercises);
    });

    it("upsertExercise creates exercises", async () => {
      const created = await storage.upsertExercise({
        id: "ex_new",
        name: "Pull Ups",
        category: "strength" as const,
        icon: "barbell",
        source: "user"
      });

      expect(created.id).toBe("ex_new");
      expect(created.name).toBe("Pull Ups");
      expect(created.createdAt).toBeDefined();
    });

    it("upsertExercise updates existing exercise", async () => {
      const initial = await storage.upsertExercise({
        id: "ex_test",
        name: "Test",
        category: "strength" as const,
        icon: "barbell",
        source: "user"
      });

      const updated = await storage.upsertExercise({
        id: initial.id,
        name: "Test Updated",
        category: "strength",
        icon: "barbell",
        source: "user"
      });

      expect(updated.name).toBe("Test Updated");
      expect(updated.createdAt).toBe(initial.createdAt);
    });

    it("deleteExercise removes exercise", async () => {
      const exercise = await storage.upsertExercise({
        id: "ex_delete",
        name: "To Delete",
        category: "strength" as const,
        icon: "barbell",
        source: "user"
      });

      await storage.deleteExercise(exercise.id);
      const exercises = await storage.loadExercises();
      expect(exercises.find((e) => e.id === exercise.id)).toBeUndefined();
    });
  });

  describe("programs", () => {
    it("loadPrograms returns empty array by default", async () => {
      const programs = await storage.loadPrograms();
      expect(programs).toEqual([]);
    });

    it("savePrograms and loadPrograms round-trip", async () => {
      const programs = [
        {
          id: "prg_1",
          name: "Beginner",
          description: "For beginners",
          sessions: [
            { index: 1, blocks: [{ type: "warmup" as const, seconds: 300 }] }
          ],
          source: "builtin" as const,
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z"
        }
      ];

      await storage.savePrograms(programs);
      const loaded = await storage.loadPrograms();
      expect(loaded).toEqual(programs);
    });

    it("upsertProgram creates programs", async () => {
      const created = await storage.upsertProgram({
        id: "prg_test",
        name: "Test Program",
        description: "Test",
        sessions: [{ index: 1, blocks: [] }],
        source: "user"
      });

      expect(created.id).toBe("prg_test");
      expect(created.name).toBe("Test Program");
      expect(created.createdAt).toBeDefined();
    });

    it("upsertProgram updates existing program", async () => {
      const initial = await storage.upsertProgram({
        id: "prg_upd",
        name: "Original",
        description: "Desc",
        sessions: [{ index: 1, blocks: [] }],
        source: "user"
      });

      const updated = await storage.upsertProgram({
        id: initial.id,
        name: "Updated",
        description: "Updated",
        sessions: initial.sessions,
        source: "user"
      });

      expect(updated.name).toBe("Updated");
      expect(updated.createdAt).toBe(initial.createdAt);
    });

    it("deleteProgram removes program", async () => {
      const program = await storage.upsertProgram({
        id: "prg_del",
        name: "To Delete",
        description: "Delete",
        sessions: [],
        source: "user"
      });

      await storage.deleteProgram(program.id);
      const programs = await storage.loadPrograms();
      expect(programs.find((p) => p.id === program.id)).toBeUndefined();
    });
  });

  describe("session state", () => {
    it("saveSessionState and loadSessionState round-trip", async () => {
      const sessionState = {
        slug: "test-program",
        sessionIndex: 1,
        phase: "warmup" as const,
        currentSet: 1,
        timer: 120,
        isPaused: false,
        warmupDone: false,
        sessionElapsedSeconds: 0
      };

      await storage.saveSessionState(sessionState);
      const loaded = await storage.loadSessionState("test-program", 1);
      expect(loaded).toEqual(sessionState);
    });

    it("loadSessionState returns null for non-existent session", async () => {
      const loaded = await storage.loadSessionState("non-existent", 999);
      expect(loaded).toBeNull();
    });

    it("clearSessionState removes session state", async () => {
      const sessionState = {
        slug: "test",
        sessionIndex: 1,
        phase: "working" as const,
        currentSet: 2,
        timer: 60,
        isPaused: true,
        warmupDone: true,
        sessionElapsedSeconds: 120
      };

      await storage.saveSessionState(sessionState);
      await storage.clearSessionState("test", 1);
      const loaded = await storage.loadSessionState("test", 1);
      expect(loaded).toBeNull();
    });
  });

  describe("events", () => {
    it("loadEvents returns empty array by default", async () => {
      const events = await storage.loadEvents();
      expect(events).toEqual([]);
    });

    it("appendEvent adds event to storage", async () => {
      await storage.appendEvent({
        slug: "test-program",
        sessionIndex: 1,
        type: "warmup_completed"
      });

      const events = await storage.loadEvents();
      expect(events).toHaveLength(1);
      expect(events[0].slug).toBe("test-program");
      expect(events[0].ts).toBeDefined();
    });

    it("loadEventsForSlug filters by slug", async () => {
      await storage.appendEvent({
        slug: "program-a",
        sessionIndex: 1,
        type: "warmup_completed"
      });
      await storage.appendEvent({
        slug: "program-b",
        sessionIndex: 1,
        type: "session_completed"
      });

      const eventsA = await storage.loadEventsForSlug("program-a");
      const eventsB = await storage.loadEventsForSlug("program-b");

      expect(eventsA).toHaveLength(1);
      expect(eventsA[0].slug).toBe("program-a");
      expect(eventsB).toHaveLength(1);
      expect(eventsB[0].slug).toBe("program-b");
    });
  });

  describe("history", () => {
    it("loadHistory returns empty array by default", async () => {
      const history = await storage.loadHistory("test");
      expect(history).toEqual([]);
    });

    it("appendHistory and loadHistory work together", async () => {
      const entry = {
        date: "2025-01-01",
        summary: "Test",
        sessionIndex: 1
      };

      await storage.appendHistory("test", entry);
      const history = await storage.loadHistory("test");
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(entry);
    });

    it("loadAllHistory returns entries from all slugs", async () => {
      await storage.appendHistory("a", {
        date: "2025-01-01",
        summary: "A",
        sessionIndex: 1
      });
      await storage.appendHistory("b", {
        date: "2025-01-02",
        summary: "B",
        sessionIndex: 1
      });

      const allHistory = await storage.loadAllHistory();
      expect(allHistory).toHaveLength(2);
    });
  });

  describe("streak tracking", () => {
    it("loadStreak returns null by default", async () => {
      const streak = await storage.loadStreak("test");
      expect(streak).toBeNull();
    });

    it("saveStreakHit creates streak", async () => {
      await storage.saveStreakHit("test", "2025-01-06T10:00:00.000Z");
      const streak = await storage.loadStreak("test");
      expect(streak).toBeDefined();
      expect(Array.isArray(streak)).toBe(true);
    });

    it("loadAllStreaks returns all entries", async () => {
      await storage.saveStreakHit("a", "2025-01-06T10:00:00.000Z");
      await storage.saveStreakHit("b", "2025-01-06T10:00:00.000Z");

      const allStreaks = await storage.loadAllStreaks();
      expect(allStreaks).toHaveLength(2);
    });
  });

  describe("completed sessions", () => {
    it("loadCompletedSessions returns empty set by default", async () => {
      const completed = await storage.loadCompletedSessions("test");
      expect(completed.size).toBe(0);
    });

    it("loadCompletedSessions tracks from events", async () => {
      await storage.appendEvent({
        slug: "test",
        sessionIndex: 1,
        type: "session_completed"
      });
      await storage.appendEvent({
        slug: "test",
        sessionIndex: 2,
        type: "session_completed"
      });

      const completed = await storage.loadCompletedSessions("test");
      expect(completed.size).toBe(2);
      expect(completed.has(1)).toBe(true);
      expect(completed.has(2)).toBe(true);
    });

    it("getLastCompletedSlug returns most recent", async () => {
      await storage.appendEvent({
        slug: "a",
        sessionIndex: 1,
        type: "session_completed"
      });
      await storage.appendEvent({
        slug: "b",
        sessionIndex: 1,
        type: "session_completed"
      });

      const last = await storage.getLastCompletedSlug();
      expect(last).toBe("b");
    });
  });

  describe("program progress", () => {
    it("loadProgramProgress returns null by default", async () => {
      const progress = await storage.loadProgramProgress("test");
      expect(progress).toBeNull();
    });

    it("saveProgramProgress and loadProgramProgress work together", async () => {
      const progress = {
        programId: "test",
        runs: [],
        lifetimeSessionsCompleted: 0,
        lifetimeTimeSpentSeconds: 0,
        lastActivityAt: null,
        updatedAt: "2025-01-01T00:00:00.000Z"
      };

      await storage.saveProgramProgress(progress);
      const loaded = await storage.loadProgramProgress("test");
      expect(loaded).not.toBeNull();
      expect(loaded?.programId).toBe("test");
      expect(loaded?.lifetimeSessionsCompleted).toBe(0);
      expect(loaded?.lifetimeTimeSpentSeconds).toBe(0);
    });
  });
});
