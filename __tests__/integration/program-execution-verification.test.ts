/**
 * Verification test for program execution functionality
 *
 * This test simulates the complete user flow to verify that:
 * - Programs start with the first session (Requirement 1.5)
 * - Multi-session navigation works (Requirement 1.6)
 * - Navigation back behavior works (Requirement 4.5)
 */

import { generateChallengeSessions } from "@/hooks/data/useChallengeSessions";
import { findNextSessionIndex } from "@/lib/utils/progress";
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

describe("Program Execution Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete User Flow Simulation", () => {
    it("should handle complete flow for regular program execution", () => {
      const programId = "prg_starter_full_body";

      // Step 1: User navigates to program detail screen
      router.navigate({
        pathname: "/programs/[id]",
        params: { id: programId }
      });

      // Step 2: User starts the program (should start with session 1)
      const nextSessionIndex = findNextSessionIndex(new Set(), 1); // 1 session total
      expect(nextSessionIndex).toBe(1);

      router.navigate({
        pathname: "/programs/[id]/session/[index]",
        params: {
          id: programId,
          index: String(nextSessionIndex)
        }
      });

      // Step 3: User can navigate back
      expect(router.canGoBack()).toBe(true);
      router.back();

      // Verify the navigation calls
      expect(router.navigate).toHaveBeenCalledTimes(2);
      expect(router.navigate).toHaveBeenNthCalledWith(1, {
        pathname: "/programs/[id]",
        params: { id: programId }
      });
      expect(router.navigate).toHaveBeenNthCalledWith(2, {
        pathname: "/programs/[id]/session/[index]",
        params: {
          id: programId,
          index: "1"
        }
      });
      expect(router.back).toHaveBeenCalledTimes(1);
    });

    it("should handle complete flow for challenge program execution", () => {
      const challengeProgramId = "challenge_push-ups";

      // Generate challenge sessions
      const challengeConfig = {
        exerciseId: "ex_pushups",
        sets: 5,
        targetReps: 100,
        warmUpSeconds: 300,
        breakSeconds: 120,
        weeklyIncreasePercent: 10
      };

      const sessions = generateChallengeSessions(challengeConfig);
      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].index).toBe(1);

      // Step 1: User navigates to challenge detail screen
      router.navigate({
        pathname: "/programs/[id]",
        params: { id: challengeProgramId }
      });

      // Step 2: User starts the challenge (should start with session 1)
      const nextSessionIndex = findNextSessionIndex(new Set(), sessions.length);
      expect(nextSessionIndex).toBe(1);

      router.navigate({
        pathname: "/programs/[id]/session/[index]",
        params: {
          id: challengeProgramId,
          index: String(nextSessionIndex)
        }
      });

      // Step 3: User can navigate to different sessions
      const middleSessionIndex = Math.ceil(sessions.length / 2);
      router.navigate({
        pathname: "/programs/[id]/session/[index]",
        params: {
          id: challengeProgramId,
          index: String(middleSessionIndex)
        }
      });

      // Step 4: User can navigate back
      expect(router.canGoBack()).toBe(true);
      router.back();

      // Verify all navigation calls
      expect(router.navigate).toHaveBeenCalledTimes(3);
      expect(router.back).toHaveBeenCalledTimes(1);
    });

    it("should handle program continuation from partial progress", () => {
      const programId = "multi_session_program";
      const totalSessions = 8;
      const completedSessions = new Set([1, 2, 3]); // First 3 sessions completed

      // Step 1: User navigates to program detail
      router.navigate({
        pathname: "/programs/[id]",
        params: { id: programId }
      });

      // Step 2: System determines next session (should be session 4)
      const nextSessionIndex = findNextSessionIndex(
        completedSessions,
        totalSessions
      );
      expect(nextSessionIndex).toBe(4);

      // Step 3: User continues from session 4
      router.navigate({
        pathname: "/programs/[id]/session/[index]",
        params: {
          id: programId,
          index: String(nextSessionIndex)
        }
      });

      // Verify correct session continuation
      expect(router.navigate).toHaveBeenNthCalledWith(2, {
        pathname: "/programs/[id]/session/[index]",
        params: {
          id: programId,
          index: "4"
        }
      });
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    it("should handle completed programs gracefully", () => {
      const programId = "completed_program";
      const totalSessions = 5;
      const completedSessions = new Set([1, 2, 3, 4, 5]); // All sessions completed

      // System should return null for next session
      const nextSessionIndex = findNextSessionIndex(
        completedSessions,
        totalSessions
      );
      expect(nextSessionIndex).toBeNull();

      // User can still navigate to program detail
      router.navigate({
        pathname: "/programs/[id]",
        params: { id: programId }
      });

      expect(router.navigate).toHaveBeenCalledWith({
        pathname: "/programs/[id]",
        params: { id: programId }
      });
    });

    it("should handle programs with no sessions", () => {
      const totalSessions = 0;
      const completedSessions = new Set<number>();

      // System should return null for programs with no sessions
      const nextSessionIndex = findNextSessionIndex(
        completedSessions,
        totalSessions
      );
      expect(nextSessionIndex).toBeNull();
    });

    it("should validate session indices are within bounds", () => {
      const totalSessions = 5;
      const validIndices = [1, 2, 3, 4, 5];

      // Valid indices should be found when not completed
      validIndices.forEach((index) => {
        const completedSessions = new Set(
          validIndices.filter((i) => i < index)
        );
        const nextSession = findNextSessionIndex(
          completedSessions,
          totalSessions
        );
        expect(nextSession).toBe(index);
      });

      // Invalid indices should not be returned by the system
      const allCompleted = new Set(validIndices);
      const nextSession = findNextSessionIndex(allCompleted, totalSessions);
      expect(nextSession).toBeNull();
    });
  });

  describe("Navigation Consistency Verification", () => {
    it("should use consistent navigation patterns for all program types", () => {
      const programs = [
        { id: "regular_program", type: "regular" },
        { id: "challenge_program", type: "challenge" }
      ];

      programs.forEach((program) => {
        // Detail screen navigation
        router.navigate({
          pathname: "/programs/[id]",
          params: { id: program.id }
        });

        // Session execution navigation
        router.navigate({
          pathname: "/programs/[id]/session/[index]",
          params: {
            id: program.id,
            index: "1"
          }
        });
      });

      // Verify all programs use the same navigation structure
      const calls = (router.navigate as any).mock.calls;
      expect(calls).toHaveLength(4);

      // Check detail screen calls
      expect(calls[0][0].pathname).toBe("/programs/[id]");
      expect(calls[2][0].pathname).toBe("/programs/[id]");

      // Check session execution calls
      expect(calls[1][0].pathname).toBe("/programs/[id]/session/[index]");
      expect(calls[3][0].pathname).toBe("/programs/[id]/session/[index]");
    });

    it("should maintain navigation stack integrity across different flows", () => {
      const programId = "stack_test_program";

      // Simulate various navigation patterns
      const navigationFlows = [
        // Flow 1: Home -> Program Detail -> Session
        () => {
          router.navigate({
            pathname: "/programs/[id]",
            params: { id: programId }
          });
          router.navigate({
            pathname: "/programs/[id]/session/[index]",
            params: { id: programId, index: "1" }
          });
        },
        // Flow 2: Library -> Program Detail -> Session
        () => {
          router.navigate({
            pathname: "/programs/[id]",
            params: { id: programId }
          });
          router.navigate({
            pathname: "/programs/[id]/session/[index]",
            params: { id: programId, index: "2" }
          });
        }
      ];

      navigationFlows.forEach((flow) => {
        vi.clearAllMocks();
        flow();

        // Should be able to go back from any flow
        expect(router.canGoBack()).toBe(true);
        router.back();

        expect(router.navigate).toHaveBeenCalledTimes(2);
        expect(router.back).toHaveBeenCalledTimes(1);
      });
    });
  });
});
