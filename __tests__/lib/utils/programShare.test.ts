/**
 * Tests for program sharing utilities
 */

import {
  decodeProgramFromShare,
  encodeProgramForShare,
  validateProgramData
} from "@/lib/utils/programShare";
import { Program } from "@/types";
import { describe, expect, it } from "vitest";

describe("Program Share Utilities", () => {
  const mockProgram: Program = {
    id: "prg_test",
    name: "Test Program",
    description: "A test program for sharing",
    blocks: [
      {
        type: "warmup",
        seconds: 300
      },
      {
        type: "exercise",
        exerciseId: "ex_pushups",
        targetReps: 10
      },
      {
        type: "rest",
        seconds: 60
      }
    ],
    source: "user",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  };

  const mockChallenge: Program = {
    id: "prg_challenge",
    name: "Push-up Challenge",
    description: "30-day push-up challenge",
    blocks: [],
    challengeConfig: {
      exerciseId: "ex_pushups",
      sets: 3,
      targetReps: 100,
      warmUpSeconds: 300,
      breakSeconds: 60,
      sessionIncreasePercent: 5
    },
    source: "user",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  };

  describe("encodeProgramForShare", () => {
    it("should encode a regular program correctly", () => {
      const encoded = encodeProgramForShare(mockProgram);
      const parsed = JSON.parse(encoded);

      expect(parsed.name).toBe(mockProgram.name);
      expect(parsed.description).toBe(mockProgram.description);
      expect(parsed.blocks).toEqual(mockProgram.blocks);
      expect(parsed.challengeConfig).toBeUndefined();

      // Should not include metadata
      expect(parsed.id).toBeUndefined();
      expect(parsed.createdAt).toBeUndefined();
      expect(parsed.updatedAt).toBeUndefined();
    });

    it("should encode a challenge correctly", () => {
      const encoded = encodeProgramForShare(mockChallenge);
      const parsed = JSON.parse(encoded);

      expect(parsed.name).toBe(mockChallenge.name);
      expect(parsed.description).toBe(mockChallenge.description);
      expect(parsed.blocks).toEqual(mockChallenge.blocks);
      expect(parsed.challengeConfig).toEqual(mockChallenge.challengeConfig);

      // Should not include metadata
      expect(parsed.id).toBeUndefined();
      expect(parsed.createdAt).toBeUndefined();
      expect(parsed.updatedAt).toBeUndefined();
    });
  });

  describe("decodeProgramFromShare", () => {
    it("should decode a valid program correctly", () => {
      const encoded = encodeProgramForShare(mockProgram);
      const decoded = decodeProgramFromShare(encoded);

      expect(decoded.name).toBe(mockProgram.name);
      expect(decoded.description).toBe(mockProgram.description);
      expect(decoded.blocks).toEqual(mockProgram.blocks);
    });

    it("should decode a valid challenge correctly", () => {
      const encoded = encodeProgramForShare(mockChallenge);
      const decoded = decodeProgramFromShare(encoded);

      expect(decoded.name).toBe(mockChallenge.name);
      expect(decoded.challengeConfig).toEqual(mockChallenge.challengeConfig);
    });

    it("should throw error for invalid JSON", () => {
      expect(() => decodeProgramFromShare("invalid json")).toThrow(
        "Invalid JSON format"
      );
    });

    it("should throw error for invalid program structure", () => {
      const invalidData = JSON.stringify({ name: "" }); // Empty name
      expect(() => decodeProgramFromShare(invalidData)).toThrow(
        "Invalid program data structure"
      );
    });
  });

  describe("validateProgramData", () => {
    it("should validate a correct program", () => {
      const validData = {
        name: "Test Program",
        blocks: [
          { type: "warmup", seconds: 300 },
          { type: "exercise", exerciseId: "ex_test" }
        ]
      };

      expect(validateProgramData(validData)).toBe(true);
    });

    it("should validate a correct challenge", () => {
      const validChallenge = {
        name: "Test Challenge",
        blocks: [],
        challengeConfig: {
          exerciseId: "ex_test",
          sets: 3,
          targetReps: 100,
          warmUpSeconds: 300,
          breakSeconds: 60
        }
      };

      expect(validateProgramData(validChallenge)).toBe(true);
    });

    it("should reject invalid data types", () => {
      expect(validateProgramData(null)).toBe(false);
      expect(validateProgramData("string")).toBe(false);
      expect(validateProgramData(123)).toBe(false);
    });

    it("should reject missing required fields", () => {
      expect(validateProgramData({})).toBe(false);
      expect(validateProgramData({ name: "" })).toBe(false);
      expect(validateProgramData({ name: "Test" })).toBe(false); // Missing blocks
    });

    it("should reject invalid sessions", () => {
      const invalidBlocks = {
        name: "Test",
        blocks: "not an array"
      };
      expect(validateProgramData(invalidBlocks)).toBe(false);
    });

    it("should reject invalid blocks", () => {
      const invalidBlocks = {
        name: "Test",
        blocks: [{ type: "invalid" }]
      };
      expect(validateProgramData(invalidBlocks)).toBe(false);
    });

    it("should reject exercise blocks without exerciseId", () => {
      const missingExerciseId = {
        name: "Test",
        blocks: [{ type: "exercise" }] // Missing exerciseId
      };
      expect(validateProgramData(missingExerciseId)).toBe(false);
    });

    it("should reject warmup/rest blocks without seconds", () => {
      const missingSeconds = {
        name: "Test",
        blocks: [{ type: "warmup" }] // Missing seconds
      };
      expect(validateProgramData(missingSeconds)).toBe(false);
    });
  });

  describe("End-to-end QR code workflow", () => {
    it("should handle complete encode -> decode cycle", () => {
      // Encode program
      const encoded = encodeProgramForShare(mockProgram);

      // Simulate QR code generation (just verify it's valid JSON)
      expect(() => JSON.parse(encoded)).not.toThrow();

      // Decode from QR code scan
      const decoded = decodeProgramFromShare(encoded);

      // Verify data integrity
      expect(decoded.name).toBe(mockProgram.name);
      expect(decoded.description).toBe(mockProgram.description);
      expect(decoded.blocks).toEqual(mockProgram.blocks);
    });

    it("should handle challenge encode -> decode cycle", () => {
      const encoded = encodeProgramForShare(mockChallenge);
      const decoded = decodeProgramFromShare(encoded);

      expect(decoded.name).toBe(mockChallenge.name);
      expect(decoded.challengeConfig).toEqual(mockChallenge.challengeConfig);
      expect(decoded.blocks).toEqual([]); // Challenges have empty blocks
    });
  });
});
