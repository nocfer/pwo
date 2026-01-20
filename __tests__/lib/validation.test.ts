/**
 * Property-based tests for validation infrastructure
 * Feature: data-management-reorganization, Property 26: Input validation consistency
 */

import {
  autoAdjustChallengeConfig,
  calculateMaxTargetReps,
  calculateMinimumDuration,
  calculateSessionsToTarget,
  checkExerciseDependencies,
  VALID_DIFFICULTIES,
  VALID_EXERCISE_CATEGORIES,
  VALID_EXERCISE_ICONS,
  validateChallengeInterdependencies,
  validateExercise,
  validateField,
  validateModificationPermissions,
  validateProgram,
  validateUniqueName
} from "@/lib/validation";
import type { ExerciseCategory, Program, ProgramBlock } from "@/types";
import type {
  EnhancedExercise,
  EnhancedProgram,
  FieldValidation
} from "@/types/enhanced";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

// ============================================================================
// Generators for Property-Based Testing
// ============================================================================

// Generate valid exercise categories
const validCategoryArb = fc.constantFrom(...VALID_EXERCISE_CATEGORIES);

// Generate valid difficulties
const validDifficultyArb = fc.constantFrom(...VALID_DIFFICULTIES);

// Generate valid exercise icons
const validIconArb = fc.constantFrom(...VALID_EXERCISE_ICONS);

// Generate valid exercise names (alphanumeric with spaces, hyphens, underscores, parentheses)
const validNameArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => /^[a-zA-Z0-9\s\-_()]+$/.test(s) && s.trim().length > 0)
  .map((s) => s.trim()); // Ensure no leading/trailing whitespace

// Generate invalid exercise names (containing invalid characters)
const invalidNameArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => /[^a-zA-Z0-9\s\-_()]/.test(s));

// Generate valid string arrays
const validStringArrayArb = fc.array(
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  { minLength: 0, maxLength: 10 }
);

// Generate valid enhanced exercise
const validEnhancedExerciseArb: fc.Arbitrary<Partial<EnhancedExercise>> =
  fc.record({
    id: fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s) => s.trim().length > 0)
      .map((s) => s.trim()),
    name: validNameArb,
    category: fc.option(validCategoryArb, { nil: undefined }),
    icon: fc.option(validIconArb, { nil: undefined }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    instructions: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
    muscleGroups: fc.option(validStringArrayArb, { nil: undefined }),
    difficulty: fc.option(validDifficultyArb, { nil: undefined }),
    equipment: fc.option(validStringArrayArb, { nil: undefined }),
    tags: fc.option(validStringArrayArb, { nil: undefined }),
    usageCount: fc.option(fc.nat(), { nil: undefined }),
    lastUsed: fc.option(fc.constant("2024-01-01T00:00:00.000Z"), {
      nil: undefined
    }),
    createdAt: fc.constant("2024-01-01T00:00:00.000Z"),
    updatedAt: fc.constant("2024-01-01T00:00:00.000Z"),
    source: fc.constantFrom("builtin", "user")
  });

// Generate program blocks
const programBlockArb: fc.Arbitrary<ProgramBlock> = fc.oneof(
  // Warmup block
  fc.record({
    type: fc.constant("warmup" as const),
    seconds: fc.integer({ min: 1, max: 600 })
  }),
  // Rest block
  fc.record({
    type: fc.constant("rest" as const),
    seconds: fc.integer({ min: 1, max: 600 }),
    label: fc.option(fc.string({ maxLength: 50 }), { nil: undefined })
  }),
  // Exercise block
  fc.record({
    type: fc.constant("exercise" as const),
    exerciseId: fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s) => s.trim().length > 0)
      .map((s) => s.trim()),
    targetReps: fc.option(fc.integer({ min: 1, max: 1000 }), {
      nil: undefined
    }),
    durationSeconds: fc.option(fc.integer({ min: 1, max: 3600 }), {
      nil: undefined
    }),
    note: fc.option(fc.string({ maxLength: 200 }), { nil: undefined })
  })
);

// Generate program blocks array
const programBlocksArb: fc.Arbitrary<ProgramBlock[]> = fc.array(
  programBlockArb,
  { minLength: 1, maxLength: 20 }
);

// Generate valid enhanced program
const validEnhancedProgramArb: fc.Arbitrary<Partial<EnhancedProgram>> =
  fc.record({
    id: fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s) => s.trim().length > 0)
      .map((s) => s.trim()),
    name: validNameArb,
    description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
    blocks: programBlocksArb,
    usageCount: fc.option(fc.nat(), { nil: undefined }),
    lastUsed: fc.option(fc.constant("2024-01-01T00:00:00.000Z"), {
      nil: undefined
    }),
    createdAt: fc.constant("2024-01-01T00:00:00.000Z"),
    updatedAt: fc.constant("2024-01-01T00:00:00.000Z"),
    source: fc.constantFrom("builtin", "user")
  });

// ============================================================================
// Property Tests
// ============================================================================

describe("Validation Infrastructure Property Tests", () => {
  describe("Property 26: Input validation consistency", () => {
    /**
     * **Validates: Requirements 8.1**
     * For any user input across all forms, validation should be applied according to defined constraints
     */

    it("should consistently validate valid exercise data", () => {
      fc.assert(
        fc.property(validEnhancedExerciseArb, (exercise) => {
          const result = validateExercise(exercise);

          // Valid exercises should pass validation
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it("should consistently reject exercises with invalid names", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: invalidNameArb,
            category: fc.option(validCategoryArb, { nil: undefined })
          }),
          (exercise) => {
            const result = validateExercise(exercise);

            // Invalid names should fail validation
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.field === "name")).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should consistently validate exercise categories", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: validNameArb,
            category: fc
              .string()
              .filter(
                (s) =>
                  !VALID_EXERCISE_CATEGORIES.includes(s as ExerciseCategory)
              )
          }),
          (data) => {
            const exercise: Partial<EnhancedExercise> = {
              name: data.name,
              category: data.category as any // Invalid category for testing
            };
            const result = validateExercise(exercise);

            // Invalid categories should fail validation
            if (exercise.category) {
              expect(result.isValid).toBe(false);
              expect(result.errors.some((e) => e.field === "category")).toBe(
                true
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should consistently validate exercise icons", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: validNameArb,
            icon: fc.string().filter((s) => !VALID_EXERCISE_ICONS.includes(s))
          }),
          (data) => {
            const exercise: Partial<EnhancedExercise> = {
              name: data.name,
              icon: data.icon // Invalid icon for testing
            };
            const result = validateExercise(exercise);

            // Invalid icons should fail validation
            if (exercise.icon) {
              expect(result.isValid).toBe(false);
              expect(result.errors.some((e) => e.field === "icon")).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should consistently validate required fields", () => {
      fc.assert(
        fc.property(
          fc.record({
            // Omit required name field
            category: fc.option(validCategoryArb, { nil: undefined }),
            icon: fc.option(validIconArb, { nil: undefined })
          }),
          (exercise) => {
            const result = validateExercise(exercise);

            // Missing required name should fail validation
            expect(result.isValid).toBe(false);
            expect(
              result.errors.some(
                (e) => e.field === "name" && e.code === "REQUIRED_FIELD"
              )
            ).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should consistently validate string length constraints", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 101, maxLength: 200 }), // Exceeds max length
            description: fc.string({ minLength: 501, maxLength: 1000 }) // Exceeds max length
          }),
          (exercise) => {
            const result = validateExercise(exercise);

            // Should fail validation for length violations
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should consistently validate program structure", () => {
      fc.assert(
        fc.property(validEnhancedProgramArb, (program) => {
          const result = validateProgram(program);

          // Valid programs should pass validation
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it("should consistently validate program blocks", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: validNameArb,
            blocks: fc.array(programBlockArb, { minLength: 1 })
          }),
          (program) => {
            const result = validateProgram(program);

            // Valid blocks should pass validation
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should consistently validate field validation rules", () => {
      fc.assert(
        fc.property(
          fc.record({
            value: fc.string(),
            minLength: fc.integer({ min: 1, max: 10 }),
            maxLength: fc.integer({ min: 11, max: 20 }),
            required: fc.boolean()
          }),
          ({ value, minLength, maxLength, required }) => {
            const validation: FieldValidation<any> = {
              field: "testField",
              required,
              minLength,
              maxLength
            };

            const errors = validateField(value, validation, "testField");

            // Validation should be consistent with rules
            if (required && (!value || value.length === 0)) {
              expect(errors.some((e) => e.code === "REQUIRED_FIELD")).toBe(
                true
              );
            }

            if (value && value.length < minLength) {
              expect(errors.some((e) => e.code === "INVALID_FORMAT")).toBe(
                true
              );
            }

            if (value && value.length > maxLength) {
              expect(errors.some((e) => e.code === "INVALID_FORMAT")).toBe(
                true
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should consistently validate array fields", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: validNameArb,
            muscleGroups: fc.array(fc.string({ minLength: 0 }))
          }),
          (exercise: Partial<EnhancedExercise>) => {
            const result = validateExercise(exercise);

            // Arrays with invalid elements should fail validation
            if (
              exercise.muscleGroups &&
              exercise.muscleGroups.some(
                (g) =>
                  typeof g !== "string" ||
                  (typeof g === "string" && g.trim().length === 0)
              )
            ) {
              expect(result.isValid).toBe(false);
              expect(
                result.errors.some((e) => e.field === "muscleGroups")
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should consistently validate numeric ranges", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: validNameArb,
            usageCount: fc.integer({ min: -100, max: -1 }) // Invalid negative number
          }),
          (data) => {
            const exerciseResult = validateExercise(data);

            // Negative usage count should fail exercise validation
            if (data.usageCount !== undefined && data.usageCount < 0) {
              expect(exerciseResult.isValid).toBe(false);
              expect(
                exerciseResult.errors.some((e) => e.field === "usageCount")
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should consistently validate dependency checking", () => {
      fc.assert(
        fc.property(
          fc.record({
            exerciseId: fc.string({ minLength: 1 }),
            programs: fc.array(
              fc.record({
                id: fc.string({ minLength: 1 }),
                name: fc.string({ minLength: 1 }),
                blocks: fc.array(
                  fc.oneof(
                    fc.record({
                      type: fc.constant("exercise" as const),
                      exerciseId: fc.string({ minLength: 1 })
                    }),
                    fc.record({
                      type: fc.constant("warmup" as const),
                      seconds: fc.integer({ min: 1 })
                    })
                  )
                ),
                createdAt: fc.constant("2024-01-01T00:00:00.000Z"),
                updatedAt: fc.constant("2024-01-01T00:00:00.000Z"),
                source: fc.constantFrom("builtin", "user")
              })
            )
          }),
          ({ exerciseId, programs }) => {
            const result = checkExerciseDependencies(
              exerciseId,
              programs as Program[]
            );

            // Dependency checking should be consistent
            const hasReferences = programs.some((program) =>
              program.blocks.some(
                (block) =>
                  block.type === "exercise" && block.exerciseId === exerciseId
              )
            );

            expect(result.canDelete).toBe(!hasReferences);
            if (hasReferences) {
              expect(result.dependentPrograms.length).toBeGreaterThan(0);
              expect(result.warnings.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should consistently validate unique names", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            currentId: fc.option(fc.string({ minLength: 1 }), {
              nil: undefined
            }),
            collection: fc.array(
              fc.record({
                id: fc.string({ minLength: 1 }),
                name: fc.string({ minLength: 1 })
              })
            )
          }),
          ({ name, currentId, collection }) => {
            const result = validateUniqueName(name, currentId, collection);

            // Name uniqueness validation should be consistent
            const duplicate = collection.find(
              (item) =>
                item.name.toLowerCase() === name.toLowerCase() &&
                item.id !== currentId
            );

            expect(result.isValid).toBe(!duplicate);
            if (duplicate) {
              expect(
                result.errors.some((e) => e.code === "DUPLICATE_NAME")
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should consistently validate modification permissions", () => {
      fc.assert(
        fc.property(
          fc.record({
            source: fc.constantFrom("builtin", "user"),
            operation: fc.constantFrom("edit", "delete")
          }),
          ({ source, operation }) => {
            const result = validateModificationPermissions(source, operation);

            // Permission validation should be consistent
            if (source === "builtin") {
              expect(result.isValid).toBe(false);
              expect(
                result.errors.some((e) => e.code === "INSUFFICIENT_PERMISSIONS")
              ).toBe(true);
            } else {
              expect(result.isValid).toBe(true);
              expect(result.errors).toHaveLength(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Challenge Interdependency Tests
// ============================================================================

describe("Challenge Interdependency Validation", () => {
  describe("calculateSessionsToTarget", () => {
    it("should return 1 session when initial reps equals target reps", () => {
      const sessions = calculateSessionsToTarget(100, 100, 10);
      expect(sessions).toBe(1);
    });

    it("should return 1 session when initial reps exceeds target reps", () => {
      const sessions = calculateSessionsToTarget(150, 100, 10);
      expect(sessions).toBe(1);
    });

    it("should calculate correct sessions for basic progression", () => {
      // Starting at 20 reps, target 100 reps, 10% weekly increase
      // Week 1 (sessions 1-7): 20 reps
      // Week 2 (sessions 8-14): 22 reps (20 * 1.1)
      // Week 3 (sessions 15-21): 24.2 reps
      // Week 4 (sessions 22-28): 26.62 reps
      // Week 5 (sessions 29-35): 29.28 reps
      // Week 6 (sessions 36-42): 32.21 reps
      // Week 7 (sessions 43-49): 35.43 reps
      // Week 8 (sessions 50-56): 38.97 reps
      // Week 9 (sessions 57-63): 42.87 reps
      // Week 10 (sessions 64-70): 47.15 reps
      // Week 11 (sessions 71-77): 51.87 reps
      // Week 12 (sessions 78-84): 57.05 reps
      // Week 13 (sessions 85-91): 62.76 reps
      // Week 14 (sessions 92-98): 69.03 reps
      // Week 15 (sessions 99-105): 75.93 reps
      // Week 16 (sessions 106-112): 83.53 reps
      // Week 17 (sessions 113-119): 91.88 reps
      // Week 18 (sessions 120-126): 101.07 reps (exceeds 100)
      const sessions = calculateSessionsToTarget(20, 100, 10);
      expect(sessions).toBeGreaterThan(100);
      expect(sessions).toBeLessThan(130);
    });

    it("should handle 0% weekly increase (no progression)", () => {
      // With 0% increase, reps never progress, so it returns Infinity
      const sessions = calculateSessionsToTarget(20, 100, 0);
      expect(sessions).toBe(Infinity);
    });

    it("should handle high weekly increase percentage", () => {
      // 50% weekly increase should reach target much faster
      const sessions50 = calculateSessionsToTarget(20, 100, 50);
      const sessions10 = calculateSessionsToTarget(20, 100, 10);
      expect(sessions50).toBeLessThan(sessions10);
    });

    it("should handle small initial reps and large target", () => {
      const sessions = calculateSessionsToTarget(1, 1000, 10);
      expect(sessions).toBeGreaterThan(0);
    });

    it("should handle large initial reps and small target difference", () => {
      const sessions = calculateSessionsToTarget(95, 100, 10);
      expect(sessions).toBeGreaterThan(0);
    });
  });

  describe("calculateMinimumDuration", () => {
    it("should return same value as calculateSessionsToTarget", () => {
      const duration = calculateMinimumDuration(20, 100, 10);
      const sessions = calculateSessionsToTarget(20, 100, 10);
      expect(duration).toBe(sessions);
    });

    it("should return 1 day when initial equals target", () => {
      const duration = calculateMinimumDuration(100, 100, 10);
      expect(duration).toBe(1);
    });

    it("should increase with higher target reps", () => {
      const duration100 = calculateMinimumDuration(20, 100, 10);
      const duration200 = calculateMinimumDuration(20, 200, 10);
      expect(duration200).toBeGreaterThan(duration100);
    });

    it("should decrease with higher weekly increase percentage", () => {
      const duration10 = calculateMinimumDuration(20, 100, 10);
      const duration50 = calculateMinimumDuration(20, 100, 50);
      expect(duration50).toBeLessThan(duration10);
    });
  });

  describe("calculateMaxTargetReps", () => {
    it("should return initial reps for 1 day duration", () => {
      const maxReps = calculateMaxTargetReps(20, 1, 10);
      expect(maxReps).toBe(20);
    });

    it("should return initial reps for 7 days (no increase yet)", () => {
      const maxReps = calculateMaxTargetReps(20, 7, 10);
      expect(maxReps).toBe(20);
    });

    it("should increase after 7 days (first weekly increase)", () => {
      const maxReps7 = calculateMaxTargetReps(20, 7, 10);
      const maxReps8 = calculateMaxTargetReps(20, 8, 10);
      expect(maxReps8).toBeGreaterThan(maxReps7);
    });

    it("should calculate correct progression over multiple weeks", () => {
      // After 7 days: still at 20 (increase happens at end of day 7)
      const maxReps7 = calculateMaxTargetReps(20, 7, 10);
      expect(maxReps7).toBe(20);

      // After 8 days: increase happened, now at 22
      const maxReps8 = calculateMaxTargetReps(20, 8, 10);
      expect(maxReps8).toBe(22);

      // After 14 days: still at 22 (second increase happens at end of day 14)
      const maxReps14 = calculateMaxTargetReps(20, 14, 10);
      expect(maxReps14).toBe(22);

      // After 15 days: second increase happened, now at 24.2
      const maxReps15 = calculateMaxTargetReps(20, 15, 10);
      expect(maxReps15).toBe(24);
    });

    it("should increase with higher weekly increase percentage", () => {
      const maxReps10 = calculateMaxTargetReps(20, 30, 10);
      const maxReps50 = calculateMaxTargetReps(20, 30, 50);
      expect(maxReps50).toBeGreaterThan(maxReps10);
    });

    it("should handle long durations", () => {
      const maxReps = calculateMaxTargetReps(20, 365, 10);
      expect(maxReps).toBeGreaterThan(1000);
    });
  });

  describe("validateChallengeInterdependencies", () => {
    it("should be valid for reasonable configuration", () => {
      // Use a duration that's actually sufficient
      const result = validateChallengeInterdependencies(20, 100, 150, 10);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("should reject when initial reps > target reps", () => {
      const result = validateChallengeInterdependencies(150, 100, 30, 10);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain("cannot be greater");
    });

    it("should warn when initial reps = target reps", () => {
      const result = validateChallengeInterdependencies(100, 100, 30, 10);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain("should be less");
    });

    it("should reject when duration is too short", () => {
      // 20 -> 100 with 10% increase needs ~120 days minimum
      const result = validateChallengeInterdependencies(20, 100, 30, 10);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain("too short");
    });

    it("should provide minimum duration suggestion", () => {
      const result = validateChallengeInterdependencies(20, 100, 30, 10);
      expect(result.suggestions.minDuration).toBeDefined();
      expect(result.suggestions.minDuration).toBeGreaterThan(30);
    });

    it("should provide max target reps suggestion for given duration", () => {
      const result = validateChallengeInterdependencies(20, 100, 30, 10);
      expect(result.suggestions.maxTargetReps).toBeDefined();
      expect(result.suggestions.maxTargetReps).toBeLessThan(100);
    });

    it("should be valid when duration is sufficient", () => {
      // Calculate minimum duration first
      const minDuration = calculateMinimumDuration(20, 100, 10);
      const result = validateChallengeInterdependencies(
        20,
        100,
        minDuration,
        10
      );
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("should be valid when duration is more than sufficient", () => {
      const result = validateChallengeInterdependencies(20, 100, 200, 10);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("should handle undefined duration (optional field)", () => {
      const result = validateChallengeInterdependencies(20, 100, undefined, 10);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.suggestions.minDuration).toBeDefined();
    });

    it("should handle 0% weekly increase", () => {
      // With 0% increase, reps never progress, so it's invalid
      const result = validateChallengeInterdependencies(20, 100, 30, 0);
      expect(result.isValid).toBe(false);
    });

    it("should handle very high weekly increase", () => {
      // 100% weekly increase should reach target quickly
      const result = validateChallengeInterdependencies(20, 100, 30, 100);
      expect(result.isValid).toBe(true);
    });

    it("should handle edge case: 1 rep initial, 1000 reps target", () => {
      const result = validateChallengeInterdependencies(1, 1000, 100, 10);
      expect(result.suggestions.minDuration).toBeDefined();
      if (result.isValid === false) {
        expect(result.issues.length).toBeGreaterThan(0);
      }
    });

    it("should handle edge case: very close initial and target", () => {
      const result = validateChallengeInterdependencies(99, 100, 30, 10);
      expect(result.isValid).toBe(true);
    });

    it("should provide consistent suggestions across multiple calls", () => {
      const result1 = validateChallengeInterdependencies(20, 100, 30, 10);
      const result2 = validateChallengeInterdependencies(20, 100, 30, 10);
      expect(result1.suggestions.minDuration).toBe(
        result2.suggestions.minDuration
      );
      expect(result1.suggestions.maxTargetReps).toBe(
        result2.suggestions.maxTargetReps
      );
    });

    it("should handle realistic challenge scenarios", () => {
      // Scenario 1: Push-ups challenge
      const pushups = validateChallengeInterdependencies(10, 50, 60, 5);
      expect(pushups.suggestions.minDuration).toBeDefined();

      // Scenario 2: Running challenge
      const running = validateChallengeInterdependencies(1, 10, 90, 15);
      expect(running.suggestions.minDuration).toBeDefined();

      // Scenario 3: Strength challenge
      const strength = validateChallengeInterdependencies(5, 100, 120, 20);
      expect(strength.suggestions.minDuration).toBeDefined();
    });
  });

  describe("Edge cases and boundary conditions", () => {
    it("should handle minimum valid values", () => {
      // 10 -> 11 with 10% increase needs 15 days minimum
      const result = validateChallengeInterdependencies(10, 11, 15, 10);
      expect(result.isValid).toBe(true);
    });

    it("should handle maximum reasonable values", () => {
      const result = validateChallengeInterdependencies(1, 10000, 1000, 100);
      expect(result.isValid).toBe(true);
    });

    it("should handle fractional weekly increases", () => {
      const result = validateChallengeInterdependencies(20, 100, 150, 5.5);
      expect(result.suggestions.minDuration).toBeDefined();
    });

    it("should maintain consistency between functions", () => {
      const initialReps = 20;
      const targetReps = 100;
      const weeklyIncrease = 10;

      const minDuration = calculateMinimumDuration(
        initialReps,
        targetReps,
        weeklyIncrease
      );
      const maxReps = calculateMaxTargetReps(
        initialReps,
        minDuration,
        weeklyIncrease
      );

      // Max reps at minimum duration should be >= target reps
      expect(maxReps).toBeGreaterThanOrEqual(targetReps);
    });

    it("should handle rapid progression scenarios", () => {
      // User wants to go from 20 to 100 reps in just 14 days
      const result = validateChallengeInterdependencies(20, 100, 14, 10);
      expect(result.isValid).toBe(false);
      expect(result.suggestions.minDuration).toBeGreaterThan(14);
    });

    it("should handle conservative progression scenarios", () => {
      // User wants to go from 20 to 100 reps over 365 days
      const result = validateChallengeInterdependencies(20, 100, 365, 10);
      expect(result.isValid).toBe(true);
    });
  });
});

// ============================================================================
// Auto-Adjustment Tests
// ============================================================================

describe("Challenge Auto-Adjustment", () => {
  describe("autoAdjustChallengeConfig", () => {
    const baseConfig = {
      initialReps: 20,
      targetReps: 100,
      weeklyIncreasePercent: 10,
      duration: 150
    };

    it("should adjust target reps when initial reps exceed target", () => {
      const result = autoAdjustChallengeConfig("initialReps", 150, baseConfig);
      expect(result.targetReps).toBeGreaterThan(150);
      expect(result.targetReps).toBe(Math.ceil(150 * 1.5));
    });

    it("should adjust target reps when target reps <= initial reps", () => {
      const config = { ...baseConfig, initialReps: 100, targetReps: 100 };
      const result = autoAdjustChallengeConfig("targetReps", 100, config);
      expect(result.targetReps).toBeGreaterThan(100);
    });

    it("should increase duration when initial reps change and duration becomes insufficient", () => {
      const config = { ...baseConfig, initialReps: 20, duration: 30 };
      const result = autoAdjustChallengeConfig("initialReps", 50, config);
      expect(result.duration).toBeGreaterThan(30);
    });

    it("should increase duration when target reps increase and duration becomes insufficient", () => {
      const config = { ...baseConfig, targetReps: 100, duration: 30 };
      const result = autoAdjustChallengeConfig("targetReps", 200, config);
      expect(result.duration).toBeGreaterThan(30);
    });

    it("should set minimum 1% when weekly increase is 0 or negative", () => {
      const result = autoAdjustChallengeConfig(
        "weeklyIncreasePercent",
        0,
        baseConfig
      );
      expect(result.weeklyIncreasePercent).toBe(1);
    });

    it("should increase duration when weekly increase percentage decreases", () => {
      const config = {
        ...baseConfig,
        weeklyIncreasePercent: 10,
        duration: 120
      };
      const result = autoAdjustChallengeConfig(
        "weeklyIncreasePercent",
        5,
        config
      );
      expect(result.duration).toBeGreaterThan(120);
    });

    it("should decrease target reps when duration is too short", () => {
      const config = { ...baseConfig, targetReps: 100, duration: 30 };
      const result = autoAdjustChallengeConfig("duration", 20, config);
      expect(result.targetReps).toBeLessThan(100);
      expect(result.targetReps).toBeGreaterThan(config.initialReps);
    });

    it("should maintain valid configuration after initial reps adjustment", () => {
      const result = autoAdjustChallengeConfig("initialReps", 50, baseConfig);
      expect(result.initialReps).toBe(50);
      expect(result.targetReps).toBeGreaterThan(result.initialReps);
      expect(result.duration).toBeGreaterThan(0);
    });

    it("should maintain valid configuration after target reps adjustment", () => {
      const result = autoAdjustChallengeConfig("targetReps", 200, baseConfig);
      expect(result.targetReps).toBe(200);
      expect(result.targetReps).toBeGreaterThan(result.initialReps);
      expect(result.duration).toBeGreaterThan(0);
    });

    it("should maintain valid configuration after weekly increase adjustment", () => {
      const result = autoAdjustChallengeConfig(
        "weeklyIncreasePercent",
        20,
        baseConfig
      );
      expect(result.weeklyIncreasePercent).toBe(20);
      expect(result.targetReps).toBeGreaterThan(result.initialReps);
    });

    it("should maintain valid configuration after duration adjustment", () => {
      const result = autoAdjustChallengeConfig("duration", 200, baseConfig);
      expect(result.duration).toBe(200);
      expect(result.targetReps).toBeGreaterThan(result.initialReps);
    });

    it("should handle undefined duration gracefully", () => {
      const config = { ...baseConfig, duration: undefined };
      const result = autoAdjustChallengeConfig("initialReps", 50, config);
      expect(result.initialReps).toBe(50);
      expect(result.targetReps).toBeGreaterThan(50);
    });

    it("should not modify fields that don't need adjustment", () => {
      const result = autoAdjustChallengeConfig("initialReps", 25, baseConfig);
      expect(result.weeklyIncreasePercent).toBe(
        baseConfig.weeklyIncreasePercent
      );
    });

    it("should handle realistic user scenario: increasing initial reps", () => {
      // User starts with 20 reps, then changes to 30
      const result = autoAdjustChallengeConfig("initialReps", 30, baseConfig);
      expect(result.initialReps).toBe(30);
      expect(result.targetReps).toBeGreaterThan(30);
      expect(result.duration).toBeGreaterThanOrEqual(baseConfig.duration);
    });

    it("should handle realistic user scenario: decreasing duration", () => {
      // User wants to complete challenge faster
      const result = autoAdjustChallengeConfig("duration", 60, baseConfig);
      expect(result.duration).toBe(60);
      expect(result.targetReps).toBeLessThan(baseConfig.targetReps);
      expect(result.targetReps).toBeGreaterThan(result.initialReps);
    });

    it("should handle realistic user scenario: increasing weekly increase", () => {
      // User wants faster progression
      const result = autoAdjustChallengeConfig(
        "weeklyIncreasePercent",
        25,
        baseConfig
      );
      expect(result.weeklyIncreasePercent).toBe(25);
      // Duration might decrease since progression is faster
      expect(result.duration).toBeLessThanOrEqual(baseConfig.duration);
    });
  });
});
