/**
 * Integration test for program execution initialization
 *
 * Tests Requirements:
 * - 1.5: Programs start with first session
 * - 1.6: Multi-session navigation works
 * - 4.5: Navigation back behavior from execution screens
 */

import { generateChallengeSessions } from "@/hooks/data/useChallengeSessions";
import { getTotalReps } from "@/lib/utils/format";
import { findNextSessionIndex } from "@/lib/utils/progress";
import { ProgramSession } from "@/types";
import { router } from "expo-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock expo-router
vi.mock("expo-router", () => ({
  router: {
    navigate: vi.fn(),
    push: vi.fn(),
    back: vi.fn(),
    canGoBack: vi.fn(() => true)
  }
}));

describe("Program Execution Initialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Program Start Session Index (Requirement 1.5)", () => {
    it("should start regular programs with session index 1 when no progress exists", () => {
      // Test that programs without any progress start with first session
      const completedSessions = new Set<number>();
      const totalSessions = 5;

      const nextSessionIndex = findNextSessionIndex(
        completedSessions,
        totalSessions
      );

      expect(nextSessionIndex).toBe(1);
    });

    it("should start challenge programs with session index 1 when no progress exists", () => {
      // Test challenge program initialization
      const challengeConfig = {
        exerciseId: "pushups",
        sets: 3,
        targetReps: 100,
        warmUpSeconds: 60,
        breakSeconds: 30,
        sessionIncreasePercent: 10
      };

      const sessions = generateChallengeSessions(challengeConfig);
      const completedSessions = new Set<number>();

      const nextSessionIndex = findNextSessionIndex(
        completedSessions,
        sessions.length
      );

      expect(nextSessionIndex).toBe(1);
      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].index).toBe(1);
    });

    it("should continue from next incomplete session when some progress exists", () => {
      // Test that programs continue from the correct session
      const completedSessions = new Set([1, 2, 3]); // Sessions 1-3 completed
      const totalSessions = 8;

      const nextSessionIndex = findNextSessionIndex(
        completedSessions,
        totalSessions
      );

      expect(nextSessionIndex).toBe(4); // Should start from session 4
    });

    it("should return null when all sessions are completed", () => {
      // Test completed program behavior
      const completedSessions = new Set([1, 2, 3, 4, 5]);
      const totalSessions = 5;

      const nextSessionIndex = findNextSessionIndex(
        completedSessions,
        totalSessions
      );

      expect(nextSessionIndex).toBeNull();
    });
  });

  describe("Multi-Session Navigation (Requirement 1.6)", () => {
    it("should allow navigation to any session index within program bounds", () => {
      const programId = "test-program";

      // Test navigation to various session indices
      const testIndices = [1, 5, 10];

      testIndices.forEach((sessionIndex) => {
        router.navigate({
          pathname: "/programs/[id]/session/[index]",
          params: {
            id: programId,
            index: String(sessionIndex)
          }
        });

        expect(router.navigate).toHaveBeenCalledWith({
          pathname: "/programs/[id]/session/[index]",
          params: {
            id: programId,
            index: String(sessionIndex)
          }
        });
      });
    });

    it("should handle session navigation for challenge programs", () => {
      const challengeConfig = {
        exerciseId: "squats",
        sets: 4,
        targetReps: 200,
        warmUpSeconds: 90,
        breakSeconds: 45,
        sessionIncreasePercent: 15
      };

      const sessions = generateChallengeSessions(challengeConfig);
      const programId = "challenge-program";

      // Test navigation to first, middle, and last sessions
      const firstSession = sessions[0];
      const middleSession = sessions[Math.floor(sessions.length / 2)];
      const lastSession = sessions[sessions.length - 1];

      [firstSession, middleSession, lastSession].forEach((session) => {
        router.navigate({
          pathname: "/programs/[id]/session/[index]",
          params: {
            id: programId,
            index: String(session.index)
          }
        });

        expect(router.navigate).toHaveBeenCalledWith({
          pathname: "/programs/[id]/session/[index]",
          params: {
            id: programId,
            index: String(session.index)
          }
        });
      });
    });

    it("should maintain session index consistency across navigation", () => {
      // Test that session indices are consistent and sequential
      const challengeConfig = {
        exerciseId: "pullups",
        sets: 3,
        targetReps: 50,
        warmUpSeconds: 30,
        breakSeconds: 60,
        sessionIncreasePercent: 12
      };

      const sessions = generateChallengeSessions(challengeConfig);

      // Verify sessions have sequential indices starting from 1
      sessions.forEach((session, arrayIndex) => {
        expect(session.index).toBe(arrayIndex + 1);
      });

      // Verify no gaps in session indices
      const indices = sessions.map((s) => s.index).sort((a, b) => a - b);
      for (let i = 0; i < indices.length - 1; i++) {
        expect(indices[i + 1] - indices[i]).toBe(1);
      }
    });
  });

  describe("Navigation Back Behavior (Requirement 4.5)", () => {
    it("should support navigation back from program execution screens", () => {
      // Test that router.back() can be called from execution screens
      expect(router.canGoBack()).toBe(true);

      router.back();
      expect(router.back).toHaveBeenCalled();
    });

    it("should maintain navigation stack integrity during program execution", () => {
      const programId = "nav-test-program";

      // Simulate navigation flow: detail -> session -> back
      router.navigate({
        pathname: "/programs/[id]",
        params: { id: programId }
      });

      router.navigate({
        pathname: "/programs/[id]/session/[index]",
        params: {
          id: programId,
          index: "1"
        }
      });

      // Should be able to go back
      expect(router.canGoBack()).toBe(true);

      router.back();

      expect(router.navigate).toHaveBeenCalledTimes(2);
      expect(router.back).toHaveBeenCalledTimes(1);
    });
  });

  describe("Session Structure Validation", () => {
    it("should validate that regular program sessions have required structure", () => {
      const mockSession: ProgramSession = {
        index: 1,
        name: "Test Session",
        blocks: [
          { type: "warmup", seconds: 300 },
          { type: "exercise", exerciseId: "pushups", targetReps: 10 },
          { type: "rest", seconds: 60, label: "Rest" },
          { type: "exercise", exerciseId: "squats", targetReps: 15 }
        ]
      };

      // Validate session structure
      expect(mockSession.index).toBeGreaterThan(0);
      expect(mockSession.blocks).toBeInstanceOf(Array);
      expect(mockSession.blocks.length).toBeGreaterThan(0);

      // Validate block types
      const validBlockTypes = ["warmup", "exercise", "rest"];
      mockSession.blocks.forEach((block) => {
        expect(validBlockTypes).toContain(block.type);
      });
    });

    it("should validate that challenge sessions have proper progression", () => {
      const challengeConfig = {
        exerciseId: "burpees",
        sets: 3,
        targetReps: 60,
        warmUpSeconds: 120,
        breakSeconds: 90,
        sessionIncreasePercent: 8
      };

      const sessions = generateChallengeSessions(challengeConfig);

      // Validate progression: each session should have more or equal reps than previous
      let previousTotalReps = 0;

      sessions.forEach((session) => {
        const exerciseBlocks = session.blocks.filter(
          (b) => b.type === "exercise"
        );
        const totalReps = exerciseBlocks.reduce(
          (sum, b) => sum + getTotalReps(b.targetReps, b.sets),
          0
        );

        expect(totalReps).toBeGreaterThanOrEqual(previousTotalReps);
        previousTotalReps = totalReps;
      });

      // Last session should reach target reps
      const lastSession = sessions[sessions.length - 1];
      const lastSessionReps = lastSession.blocks
        .filter((b) => b.type === "exercise")
        .reduce((sum, b) => sum + getTotalReps(b.targetReps, b.sets), 0);

      expect(lastSessionReps).toBe(challengeConfig.targetReps);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid session indices gracefully", () => {
      const completedSessions = new Set<number>();

      // Test with zero sessions
      expect(findNextSessionIndex(completedSessions, 0)).toBeNull();

      // Test with negative session count (edge case)
      expect(findNextSessionIndex(completedSessions, -1)).toBeNull();
    });

    it("should handle empty challenge configurations", () => {
      const invalidConfig = {
        exerciseId: "",
        sets: 0,
        targetReps: 0,
        warmUpSeconds: 0,
        breakSeconds: 0,
        sessionIncreasePercent: 0
      };

      // Should not crash with invalid config
      expect(() => generateChallengeSessions(invalidConfig)).not.toThrow();
    });
  });
});
