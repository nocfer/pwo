/**
 * Program Sharing Utilities
 *
 * Handles encoding and decoding of program data for QR code sharing
 */

import { Program } from "@/types";

/**
 * Program data structure for sharing (excludes metadata that should be regenerated)
 */
export type ShareableProgramData = Omit<
  Program,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * Encodes a program to JSON string for QR code sharing
 * Removes id, createdAt, and updatedAt to allow fresh import
 */
export function encodeProgramForShare(program: Program): string {
  const shareable: ShareableProgramData = {
    name: program.name,
    description: program.description,
    sessions: program.sessions,
    source: "user", // Always set to user for imported programs
    challengeConfig: program.challengeConfig
  };

  return JSON.stringify(shareable);
}

/**
 * Decodes a JSON string to program data
 * Validates the structure and returns a shareable program object
 */
export function decodeProgramFromShare(data: string): ShareableProgramData {
  try {
    const parsed = JSON.parse(data);

    if (!validateProgramData(parsed)) {
      throw new Error("Invalid program data structure");
    }

    return parsed as ShareableProgramData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid JSON format");
    }
    throw error;
  }
}

/**
 * Validates that the data structure matches a shareable program
 */
export function validateProgramData(
  data: unknown
): data is ShareableProgramData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Check required fields
  if (typeof obj.name !== "string" || obj.name.trim().length === 0) {
    return false;
  }

  // Sessions must be an array
  if (!Array.isArray(obj.sessions)) {
    return false;
  }

  // For challenges, sessions can be empty (sessions are generated from challengeConfig)
  // For regular programs, sessions must not be empty
  const isChallenge = obj.challengeConfig !== undefined;
  if (!isChallenge && obj.sessions.length === 0) {
    return false;
  }

  // Validate each session
  for (const session of obj.sessions) {
    if (!session || typeof session !== "object") {
      return false;
    }

    const sessionObj = session as Record<string, unknown>;

    // Index should be a number
    if (
      sessionObj.index !== undefined &&
      typeof sessionObj.index !== "number"
    ) {
      return false;
    }

    // Name is optional but must be string if present
    if (sessionObj.name !== undefined && typeof sessionObj.name !== "string") {
      return false;
    }

    // Blocks must be an array
    if (!Array.isArray(sessionObj.blocks)) {
      return false;
    }

    // Validate each block
    for (const block of sessionObj.blocks) {
      if (!block || typeof block !== "object") {
        return false;
      }

      const blockObj = block as Record<string, unknown>;

      // Type must be one of the valid types
      if (
        blockObj.type !== "warmup" &&
        blockObj.type !== "exercise" &&
        blockObj.type !== "rest"
      ) {
        return false;
      }

      // Exercise blocks must have exerciseId
      if (blockObj.type === "exercise") {
        if (typeof blockObj.exerciseId !== "string") {
          return false;
        }
      }

      // Warmup and rest blocks must have seconds
      if (blockObj.type === "warmup" || blockObj.type === "rest") {
        if (typeof blockObj.seconds !== "number") {
          return false;
        }
      }
    }
  }

  // Description is optional but must be string if present
  if (obj.description !== undefined && typeof obj.description !== "string") {
    return false;
  }

  // Source is optional but must be valid if present
  if (
    obj.source !== undefined &&
    obj.source !== "builtin" &&
    obj.source !== "user"
  ) {
    return false;
  }

  // ChallengeConfig is optional but must be valid structure if present
  if (obj.challengeConfig !== undefined) {
    if (!obj.challengeConfig || typeof obj.challengeConfig !== "object") {
      return false;
    }

    const config = obj.challengeConfig as Record<string, unknown>;
    if (typeof config.exerciseId !== "string") {
      return false;
    }
    if (typeof config.sets !== "number") {
      return false;
    }
    if (typeof config.targetReps !== "number") {
      return false;
    }
    if (typeof config.warmUpSeconds !== "number") {
      return false;
    }
    if (typeof config.breakSeconds !== "number") {
      return false;
    }
  }

  return true;
}
