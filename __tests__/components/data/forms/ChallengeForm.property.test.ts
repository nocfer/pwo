/**
 * Property-based tests for Challenge Form configuration
 * Feature: data-management-reorganization, Property 12: Challenge parameter configuration
 * **Validates: Requirements 4.1, 4.2, 4.5**
 */

import { validateChallengeConfig } from '@/lib/validation'
import type { ChallengeConfig } from '@/types'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

describe('Challenge Configuration Property Tests', () => {
  // Generator for valid challenge configuration
  const validChallengeConfigArb: fc.Arbitrary<ChallengeConfig> = fc.record({
    exerciseId: fc
      .string({ minLength: 1, maxLength: 50 })
      .filter(str => str.trim().length > 0),
    sets: fc.integer({ min: 1, max: 20 }),
    targetReps: fc.integer({ min: 1, max: 1000 }),
    warmUpSeconds: fc.integer({ min: 0, max: 1800 }), // 0 to 30 minutes
    breakSeconds: fc.integer({ min: 0, max: 600 }), // 0 to 10 minutes
    weeklyIncreasePercent: fc.integer({ min: 1, max: 100 })
  })

  // Generator for invalid challenge configuration (with invalid ranges)
  const invalidChallengeConfigArb = fc.record({
    exerciseId: fc.oneof(
      fc.constant(''), // Empty string
      fc.constant(null as any),
      fc.constant(undefined as any)
    ),
    sets: fc.oneof(
      fc.integer({ min: -10, max: 0 }), // Invalid: <= 0
      fc.constant(null as any),
      fc.constant('invalid' as any)
    ),
    targetReps: fc.oneof(
      fc.integer({ min: -10, max: 0 }), // Invalid: <= 0
      fc.constant(null as any),
      fc.constant('invalid' as any)
    ),
    warmUpSeconds: fc.oneof(
      fc.integer({ min: -10, max: -1 }), // Invalid: < 0
      fc.constant(null as any),
      fc.constant('invalid' as any)
    ),
    breakSeconds: fc.oneof(
      fc.integer({ min: -10, max: -1 }), // Invalid: < 0
      fc.constant(null as any),
      fc.constant('invalid' as any)
    ),
    weeklyIncreasePercent: fc.oneof(
      fc.integer({ min: -10, max: 0 }), // Invalid: <= 0
      fc.integer({ min: 101, max: 200 }), // Invalid: > 100
      fc.constant(null as any),
      fc.constant('invalid' as any)
    )
  })

  it('Property 12: Challenge parameter configuration - For any challenge creation or modification, all progression parameters should be configurable and validated for positive values and achievable rates', () => {
    // Feature: data-management-reorganization, Property 12: Challenge parameter configuration

    // Property 1: Valid challenge configurations should always pass validation
    fc.assert(
      fc.property(validChallengeConfigArb, config => {
        const result = validateChallengeConfig(config)

        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)

        // Verify all parameters are within valid ranges
        expect(config.exerciseId).toBeTruthy()
        expect(config.sets).toBeGreaterThan(0)
        expect(config.targetReps).toBeGreaterThan(0)
        expect(config.warmUpSeconds).toBeGreaterThanOrEqual(0)
        expect(config.breakSeconds).toBeGreaterThanOrEqual(0)
        expect(config.weeklyIncreasePercent).toBeGreaterThan(0)
        expect(config.weeklyIncreasePercent).toBeLessThanOrEqual(100)
      }),
      { numRuns: 100 }
    )

    // Property 2: Invalid challenge configurations should always fail validation
    fc.assert(
      fc.property(invalidChallengeConfigArb, config => {
        const result = validateChallengeConfig(config)

        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )

    // Property 3: Exercise ID validation should be strict
    fc.assert(
      fc.property(
        validChallengeConfigArb,
        fc.oneof(
          fc.constant(''),
          fc.constant('   '), // Whitespace only
          fc.constant(null as any),
          fc.constant(undefined as any)
        ),
        (baseConfig, invalidExerciseId) => {
          const config = { ...baseConfig, exerciseId: invalidExerciseId }
          const result = validateChallengeConfig(config)

          expect(result.isValid).toBe(false)

          const exerciseIdErrors = result.errors.filter(
            error => error.field === 'exerciseId'
          )
          expect(exerciseIdErrors.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )

    // Property 4: Sets validation should enforce positive integers
    fc.assert(
      fc.property(
        validChallengeConfigArb,
        fc.oneof(
          fc.integer({ min: -10, max: 0 }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(10.9) }), // Non-integer
          fc.constant(null as any),
          fc.constant('invalid' as any)
        ),
        (baseConfig, invalidSets) => {
          const config = { ...baseConfig, sets: invalidSets }
          const result = validateChallengeConfig(config)

          expect(result.isValid).toBe(false)

          const setsErrors = result.errors.filter(
            error => error.field === 'sets'
          )
          expect(setsErrors.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )

    // Property 5: Target reps validation should enforce positive integers
    fc.assert(
      fc.property(
        validChallengeConfigArb,
        fc.oneof(
          fc.integer({ min: -10, max: 0 }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(10.9) }), // Non-integer
          fc.constant(null as any),
          fc.constant('invalid' as any)
        ),
        (baseConfig, invalidTargetReps) => {
          const config = { ...baseConfig, targetReps: invalidTargetReps }
          const result = validateChallengeConfig(config)

          expect(result.isValid).toBe(false)

          const targetRepsErrors = result.errors.filter(
            error => error.field === 'targetReps'
          )
          expect(targetRepsErrors.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )

    // Property 6: Session increase percentage should be between 1-100
    fc.assert(
      fc.property(
        validChallengeConfigArb,
        fc.oneof(
          fc.integer({ min: -10, max: 0 }), // Too low
          fc.integer({ min: 101, max: 200 }), // Too high
          fc.float({ min: Math.fround(0.1), max: Math.fround(100.9) }), // Non-integer
          fc.constant(null as any),
          fc.constant('invalid' as any)
        ),
        (baseConfig, invalidPercentage) => {
          const config = {
            ...baseConfig,
            weeklyIncreasePercent: invalidPercentage
          }
          const result = validateChallengeConfig(config)

          expect(result.isValid).toBe(false)

          const percentageErrors = result.errors.filter(
            error => error.field === 'weeklyIncreasePercent'
          )
          expect(percentageErrors.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )

    // Property 7: Warm-up and break seconds should be non-negative
    fc.assert(
      fc.property(
        validChallengeConfigArb,
        fc.integer({ min: -10, max: -1 }),
        fc.integer({ min: -10, max: -1 }),
        (baseConfig, invalidWarmUp, invalidBreak) => {
          const configWithInvalidWarmUp = {
            ...baseConfig,
            warmUpSeconds: invalidWarmUp
          }
          const configWithInvalidBreak = {
            ...baseConfig,
            breakSeconds: invalidBreak
          }

          const warmUpResult = validateChallengeConfig(configWithInvalidWarmUp)
          const breakResult = validateChallengeConfig(configWithInvalidBreak)

          expect(warmUpResult.isValid).toBe(false)
          expect(breakResult.isValid).toBe(false)

          const warmUpErrors = warmUpResult.errors.filter(
            error => error.field === 'warmUpSeconds'
          )
          const breakErrors = breakResult.errors.filter(
            error => error.field === 'breakSeconds'
          )

          expect(warmUpErrors.length).toBeGreaterThan(0)
          expect(breakErrors.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 12 Edge Cases: Challenge configuration with boundary values', () => {
    // Feature: data-management-reorganization, Property 12: Challenge parameter configuration

    // Edge case: Minimum valid values should be accepted
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter(str => str.trim().length > 0),
        exerciseId => {
          const minimalConfig: ChallengeConfig = {
            exerciseId,
            sets: 1, // Minimum
            targetReps: 1, // Minimum
            warmUpSeconds: 0, // Minimum
            breakSeconds: 0, // Minimum
            weeklyIncreasePercent: 1 // Minimum
          }

          const result = validateChallengeConfig(minimalConfig)
          expect(result.isValid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 50 }
    )

    // Edge case: Maximum reasonable values should be accepted
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter(str => str.trim().length > 0),
        exerciseId => {
          const maximalConfig: ChallengeConfig = {
            exerciseId,
            sets: 20, // High but reasonable
            targetReps: 1000, // High but reasonable
            warmUpSeconds: 1800, // 30 minutes
            breakSeconds: 600, // 10 minutes
            weeklyIncreasePercent: 100 // Maximum
          }

          const result = validateChallengeConfig(maximalConfig)
          expect(result.isValid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 50 }
    )

    // Edge case: Zero values for optional timing parameters
    fc.assert(
      fc.property(validChallengeConfigArb, baseConfig => {
        const configWithZeroTiming = {
          ...baseConfig,
          warmUpSeconds: 0,
          breakSeconds: 0
        }

        const result = validateChallengeConfig(configWithZeroTiming)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      }),
      { numRuns: 50 }
    )

    // Edge case: Boundary percentage values
    fc.assert(
      fc.property(
        validChallengeConfigArb,
        fc.constantFrom(1, 50, 100), // Boundary and middle values
        (baseConfig, percentage) => {
          const config = { ...baseConfig, weeklyIncreasePercent: percentage }
          const result = validateChallengeConfig(config)

          expect(result.isValid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 50 }
    )

    // Edge case: Legacy weeklyIncreasePercent field should be handled
    fc.assert(
      fc.property(
        validChallengeConfigArb,
        fc.integer({ min: 1, max: 100 }),
        (baseConfig, legacyPercentage) => {
          const configWithLegacyField = {
            ...baseConfig,
            weeklyIncreasePercent: legacyPercentage
          }

          const result = validateChallengeConfig(configWithLegacyField)

          // Should still be valid when using legacy field
          expect(result.isValid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('Property 12 Consistency: Challenge parameter relationships', () => {
    // Feature: data-management-reorganization, Property 12: Challenge parameter configuration

    // Property: Configuration should maintain internal consistency
    fc.assert(
      fc.property(validChallengeConfigArb, config => {
        const result = validateChallengeConfig(config)

        if (result.isValid) {
          // Verify logical relationships
          expect(config.sets).toBeGreaterThan(0)
          expect(config.targetReps).toBeGreaterThan(0)

          // Session increase should be reasonable for the target
          expect(config.weeklyIncreasePercent).toBeGreaterThan(0)
          expect(config.weeklyIncreasePercent).toBeLessThanOrEqual(100)

          // Timing values should be reasonable
          expect(config.warmUpSeconds).toBeGreaterThanOrEqual(0)
          expect(config.breakSeconds).toBeGreaterThanOrEqual(0)

          // Exercise ID should be non-empty string
          expect(typeof config.exerciseId).toBe('string')
          expect(config.exerciseId.trim().length).toBeGreaterThan(0)
        }
      }),
      { numRuns: 100 }
    )

    // Property: Multiple validation runs should be consistent
    fc.assert(
      fc.property(validChallengeConfigArb, config => {
        const result1 = validateChallengeConfig(config)
        const result2 = validateChallengeConfig(config)

        // Results should be identical
        expect(result1.isValid).toBe(result2.isValid)
        expect(result1.errors.length).toBe(result2.errors.length)

        // Error messages should be the same
        result1.errors.forEach((error, index) => {
          expect(error.field).toBe(result2.errors[index]?.field)
          expect(error.code).toBe(result2.errors[index]?.code)
        })
      }),
      { numRuns: 100 }
    )
  })
})
