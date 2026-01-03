/**
 * Property-based tests for Exercise Form validation
 * Feature: data-management-reorganization, Property 6: Exercise categorization validation
 * **Validates: Requirements 2.5**
 */

import { VALID_EXERCISE_CATEGORIES, validateExercise } from "@/lib/validation";
import type { EnhancedExercise, ExerciseCategory } from "@/types";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

describe("Exercise Categorization Property Tests", () => {
  it("Property 6: Exercise categorization validation - For any exercise creation or modification, only predefined categories should be accepted", () => {
    // Feature: data-management-reorganization, Property 6: Exercise categorization validation
    
    // Generator for valid exercise categories
    const validCategoryArb = fc.constantFrom(...VALID_EXERCISE_CATEGORIES);
    
    // Generator for invalid categories (strings that are not in the valid list)
    const invalidCategoryArb = fc.string({ minLength: 1, maxLength: 20 })
      .filter(str => !VALID_EXERCISE_CATEGORIES.includes(str as ExerciseCategory));
    
    // Generator for basic exercise data
    const baseExerciseArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 50 }),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      icon: fc.string({ minLength: 1, maxLength: 20 }),
      source: fc.constantFrom("builtin", "user") as fc.Arbitrary<"builtin" | "user">,
      createdAt: fc.constant(new Date().toISOString()),
      updatedAt: fc.constant(new Date().toISOString())
    });

    // Property 1: Valid categories should always be accepted
    fc.assert(
      fc.property(
        baseExerciseArb,
        validCategoryArb,
        (baseExercise, validCategory) => {
          const exercise: Partial<EnhancedExercise> = {
            ...baseExercise,
            category: validCategory
          };

          const result = validateExercise(exercise);
          
          // Should not have category-related validation errors
          const categoryErrors = result.errors.filter(error => 
            error.field === "category" && error.code === "INVALID_CATEGORY"
          );
          
          expect(categoryErrors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );

    // Property 2: Invalid categories should always be rejected
    fc.assert(
      fc.property(
        baseExerciseArb,
        invalidCategoryArb,
        (baseExercise, invalidCategory) => {
          const exercise: Partial<EnhancedExercise> = {
            ...baseExercise,
            category: invalidCategory as ExerciseCategory
          };

          const result = validateExercise(exercise);
          
          // Should have category-related validation errors
          const categoryErrors = result.errors.filter(error => 
            error.field === "category" && error.code === "INVALID_CATEGORY"
          );
          
          expect(categoryErrors.length).toBeGreaterThan(0);
          expect(result.isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );

    // Property 3: Undefined/null categories should be handled gracefully (optional field)
    fc.assert(
      fc.property(
        baseExerciseArb,
        fc.constantFrom(undefined, null),
        (baseExercise, nullishCategory) => {
          const exercise: Partial<EnhancedExercise> = {
            ...baseExercise,
            category: nullishCategory as any
          };

          const result = validateExercise(exercise);
          
          // Should not have category-related validation errors for optional field
          const categoryErrors = result.errors.filter(error => 
            error.field === "category" && error.code === "INVALID_CATEGORY"
          );
          
          expect(categoryErrors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );

    // Property 4: Category validation should be case-sensitive
    fc.assert(
      fc.property(
        baseExerciseArb,
        validCategoryArb,
        (baseExercise, validCategory) => {
          // Test with different case variations
          const upperCaseCategory = validCategory.toUpperCase();
          const mixedCaseCategory = validCategory.charAt(0).toUpperCase() + validCategory.slice(1);
          
          // Only exact match should be valid if it's different from original
          if (upperCaseCategory !== validCategory) {
            const exerciseUpper: Partial<EnhancedExercise> = {
              ...baseExercise,
              category: upperCaseCategory as ExerciseCategory
            };

            const resultUpper = validateExercise(exerciseUpper);
            const categoryErrorsUpper = resultUpper.errors.filter(error => 
              error.field === "category" && error.code === "INVALID_CATEGORY"
            );
            
            expect(categoryErrorsUpper.length).toBeGreaterThan(0);
          }

          if (mixedCaseCategory !== validCategory) {
            const exerciseMixed: Partial<EnhancedExercise> = {
              ...baseExercise,
              category: mixedCaseCategory as ExerciseCategory
            };

            const resultMixed = validateExercise(exerciseMixed);
            const categoryErrorsMixed = resultMixed.errors.filter(error => 
              error.field === "category" && error.code === "INVALID_CATEGORY"
            );
            
            expect(categoryErrorsMixed.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );

    // Property 5: All predefined categories should be individually valid
    fc.assert(
      fc.property(
        baseExerciseArb,
        (baseExercise) => {
          // Test each predefined category
          for (const category of VALID_EXERCISE_CATEGORIES) {
            const exercise: Partial<EnhancedExercise> = {
              ...baseExercise,
              category
            };

            const result = validateExercise(exercise);
            const categoryErrors = result.errors.filter(error => 
              error.field === "category" && error.code === "INVALID_CATEGORY"
            );
            
            expect(categoryErrors).toHaveLength(0);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it("Property 6 Edge Cases: Exercise categorization with edge case inputs", () => {
    // Feature: data-management-reorganization, Property 6: Exercise categorization validation
    
    const baseExerciseArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 50 }),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      icon: fc.string({ minLength: 1, maxLength: 20 }),
      source: fc.constantFrom("builtin", "user") as fc.Arbitrary<"builtin" | "user">,
      createdAt: fc.constant(new Date('2023-01-01').toISOString()),
      updatedAt: fc.constant(new Date('2023-01-01').toISOString())
    });

    // Edge case: Empty string category
    fc.assert(
      fc.property(
        baseExerciseArb,
        (baseExercise) => {
          const exercise: Partial<EnhancedExercise> = {
            ...baseExercise,
            category: "" as ExerciseCategory
          };

          const result = validateExercise(exercise);
          const categoryErrors = result.errors.filter(error => 
            error.field === "category" && error.code === "INVALID_CATEGORY"
          );
          
          expect(categoryErrors.length).toBeGreaterThan(0);
          expect(result.isValid).toBe(false);
        }
      ),
      { numRuns: 50 }
    );

    // Edge case: Whitespace-only category
    fc.assert(
      fc.property(
        baseExerciseArb,
        fc.string().filter(str => str.trim() === "" && str.length > 0),
        (baseExercise, whitespaceCategory) => {
          const exercise: Partial<EnhancedExercise> = {
            ...baseExercise,
            category: whitespaceCategory as ExerciseCategory
          };

          const result = validateExercise(exercise);
          const categoryErrors = result.errors.filter(error => 
            error.field === "category" && error.code === "INVALID_CATEGORY"
          );
          
          expect(categoryErrors.length).toBeGreaterThan(0);
          expect(result.isValid).toBe(false);
        }
      ),
      { numRuns: 50 }
    );

    // Edge case: Categories with special characters
    fc.assert(
      fc.property(
        baseExerciseArb,
        fc.string({ minLength: 1, maxLength: 20 })
          .filter(str => /[^a-zA-Z]/.test(str) && !VALID_EXERCISE_CATEGORIES.includes(str as ExerciseCategory)),
        (baseExercise, specialCharCategory) => {
          const exercise: Partial<EnhancedExercise> = {
            ...baseExercise,
            category: specialCharCategory as ExerciseCategory
          };

          const result = validateExercise(exercise);
          const categoryErrors = result.errors.filter(error => 
            error.field === "category" && error.code === "INVALID_CATEGORY"
          );
          
          expect(categoryErrors.length).toBeGreaterThan(0);
          expect(result.isValid).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });
});