/**
 * Property-based tests for validation infrastructure
 * Feature: data-management-reorganization, Property 26: Input validation consistency
 */

import {
  checkExerciseDependencies,
  VALID_DIFFICULTIES,
  VALID_EXERCISE_CATEGORIES,
  VALID_EXERCISE_ICONS,
  validateExercise,
  validateField,
  validateModificationPermissions,
  validateProgram,
  validateUniqueName
} from "@/lib/validation";
import type {
  ExerciseCategory,
  Program,
  ProgramBlock
} from "@/types";
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
const programBlocksArb: fc.Arbitrary<ProgramBlock[]> = fc.array(programBlockArb, { minLength: 1, maxLength: 20 });

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
