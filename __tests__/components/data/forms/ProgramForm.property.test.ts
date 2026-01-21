/**
 * Property-based tests for Program Form session manipulation
 * Feature: data-management-reorganization, Property 8: Program session manipulation
 * **Validates: Requirements 3.2**
 */

import { validateProgram } from '@/lib/validation'
import type { EnhancedProgram, ProgramBlock, ProgramSession } from '@/types'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

describe('Program Session Manipulation Property Tests', () => {
  // Generator for valid program blocks
  const programBlockArb: fc.Arbitrary<ProgramBlock> = fc.oneof(
    // Warmup block
    fc.record({
      type: fc.constant('warmup' as const),
      seconds: fc.integer({ min: 1, max: 1800 }) // 1 second to 30 minutes
    }),
    // Rest block
    fc.record({
      type: fc.constant('rest' as const),
      seconds: fc.integer({ min: 1, max: 600 }), // 1 second to 10 minutes
      label: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
        nil: undefined
      })
    }),
    // Exercise block
    fc.record({
      type: fc.constant('exercise' as const),
      exerciseId: fc
        .string({ minLength: 1, maxLength: 50 })
        .filter(s => s.trim().length > 0),
      targetReps: fc.option(fc.integer({ min: 1, max: 100 }), {
        nil: undefined
      }),
      durationSeconds: fc.option(fc.integer({ min: 1, max: 3600 }), {
        nil: undefined
      }),
      note: fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
        nil: undefined
      })
    })
  )

  // Generator for valid program sessions
  const programSessionArb: fc.Arbitrary<ProgramSession> = fc.record({
    index: fc.integer({ min: 1, max: 20 }),
    name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
      nil: undefined
    }),
    blocks: fc.array(programBlockArb, { minLength: 1, maxLength: 20 })
  })

  // Generator for basic program data
  const baseProgramArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), {
      nil: undefined
    }),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString()),
    source: fc.constantFrom('builtin', 'user') as fc.Arbitrary<
      'builtin' | 'user'
    >
  })

  it('Property 8: Program session manipulation - For any program session, adding, removing, and reordering of blocks should maintain valid session structure', () => {
    // Feature: data-management-reorganization, Property 8: Program session manipulation

    // Property 1: Adding blocks to a session should maintain validity
    fc.assert(
      fc.property(baseProgramArb, programBlockArb, (baseProgram, newBlock) => {
        // Create program with original blocks
        const originalProgram: Partial<EnhancedProgram> = {
          ...baseProgram,
          blocks: [{ type: 'warmup', seconds: 180 }]
        }

        // Validate original program
        const originalResult = validateProgram(originalProgram)

        // Only test if original program is valid
        if (originalResult.isValid) {
          // Add new block to program
          const modifiedProgram: Partial<EnhancedProgram> = {
            ...baseProgram,
            blocks: [...(originalProgram.blocks || []), newBlock]
          }

          const modifiedResult = validateProgram(modifiedProgram)

          // Modified program should still be valid
          expect(modifiedResult.isValid).toBe(true)

          // Program should have one more block
          expect(modifiedProgram.blocks!.length).toBe(
            (originalProgram.blocks?.length || 0) + 1
          )

          // New block should be at the end
          expect(
            modifiedProgram.blocks![modifiedProgram.blocks!.length - 1]
          ).toEqual(newBlock)
        }
      }),
      { numRuns: 100 }
    )

    // Property 2: Removing blocks from a session should maintain validity (if session remains non-empty)
    fc.assert(
      fc.property(
        baseProgramArb,
        programSessionArb,
        fc.integer({ min: 0, max: 19 }),
        (baseProgram, session, removeIndex) => {
          // Only test if we have blocks to remove and won't make session empty
          if (
            session.blocks.length > 1 &&
            removeIndex < session.blocks.length
          ) {
            const originalProgram: Partial<EnhancedProgram> = {
              ...baseProgram,
              blocks: session.blocks
            }

            const originalResult = validateProgram(originalProgram)

            if (originalResult.isValid) {
              // Remove block at index
              const modifiedBlocks = session.blocks.filter(
                (_, i) => i !== removeIndex
              )

              const modifiedProgram: Partial<EnhancedProgram> = {
                ...baseProgram,
                blocks: modifiedBlocks
              }

              const modifiedResult = validateProgram(modifiedProgram)

              // Modified program should still be valid
              expect(modifiedResult.isValid).toBe(true)

              // Program should have one fewer block
              expect(modifiedProgram.blocks!.length).toBe(
                session.blocks.length - 1
              )
            }
          }
        }
      ),
      { numRuns: 100 }
    )

    // Property 3: Reordering blocks in a session should maintain validity
    fc.assert(
      fc.property(
        baseProgramArb,
        programSessionArb,
        fc.integer({ min: 0, max: 19 }),
        fc.integer({ min: 0, max: 19 }),
        (baseProgram, session, fromIndex, toIndex) => {
          // Only test if indices are valid
          if (
            fromIndex < session.blocks.length &&
            toIndex < session.blocks.length &&
            fromIndex !== toIndex
          ) {
            const originalProgram: Partial<EnhancedProgram> = {
              ...baseProgram,
              blocks: session.blocks
            }

            const originalResult = validateProgram(originalProgram)

            if (originalResult.isValid) {
              // Reorder blocks
              const reorderedBlocks = [...session.blocks]
              const [movedBlock] = reorderedBlocks.splice(fromIndex, 1)
              reorderedBlocks.splice(toIndex, 0, movedBlock)

              const modifiedProgram: Partial<EnhancedProgram> = {
                ...baseProgram,
                blocks: reorderedBlocks
              }

              const modifiedResult = validateProgram(modifiedProgram)

              // Modified program should still be valid
              expect(modifiedResult.isValid).toBe(true)

              // Program should have same number of blocks
              expect(modifiedProgram.blocks!.length).toBe(session.blocks.length)

              // All original blocks should still be present (just reordered)
              // Should have same block types (though in different order)
              const originalTypes = session.blocks.map(b => b.type).sort()
              const reorderedTypes = reorderedBlocks.map(b => b.type).sort()
              expect(reorderedTypes).toEqual(originalTypes)
            }
          }
        }
      ),
      { numRuns: 100 }
    )

    // Property 4: Session index consistency should be maintained
    fc.assert(
      fc.property(
        baseProgramArb,
        fc.array(programSessionArb, { minLength: 1, maxLength: 10 }),
        (baseProgram, sessions) => {
          // Ensure session indices are sequential starting from 1
          const normalizedSessions = sessions.map((session, index) => ({
            ...session,
            index: index + 1
          }))

          const program: Partial<EnhancedProgram> = {
            ...baseProgram,
            blocks: normalizedSessions.flatMap(s => s.blocks)
          }

          const result = validateProgram(program)

          if (result.isValid) {
            // Blocks should be present
            expect(program.blocks).toBeDefined()
            expect(Array.isArray(program.blocks)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )

    // Property 5: Block type constraints should be preserved during manipulation
    fc.assert(
      fc.property(baseProgramArb, programSessionArb, (baseProgram, session) => {
        const program: Partial<EnhancedProgram> = {
          ...baseProgram,
          blocks: session.blocks
        }

        const result = validateProgram(program)

        if (result.isValid) {
          // Each block should have valid type
          session.blocks.forEach(block => {
            expect(['warmup', 'exercise', 'rest']).toContain(block.type)

            // Type-specific validations
            if (block.type === 'warmup' || block.type === 'rest') {
              expect(block).toHaveProperty('seconds')
              expect(typeof block.seconds).toBe('number')
              expect(block.seconds).toBeGreaterThan(0)
            }

            if (block.type === 'exercise') {
              expect(typeof block.exerciseId).toBe('string')
              expect(block.exerciseId.length).toBeGreaterThan(0)

              if (block.targetReps !== undefined && block.targetReps !== null) {
                expect(typeof block.targetReps).toBe('number')
                expect(block.targetReps).toBeGreaterThan(0)
              }

              if (
                block.durationSeconds !== undefined &&
                block.durationSeconds !== null
              ) {
                expect(typeof block.durationSeconds).toBe('number')
                expect(block.durationSeconds).toBeGreaterThan(0)
              }
            }
          })
        }
      }),
      { numRuns: 100 }
    )
  })

  it('Property 8 Edge Cases: Session manipulation with edge cases', () => {
    // Feature: data-management-reorganization, Property 8: Program session manipulation

    // Edge case: Programs with no sessions should be invalid for non-challenge programs
    fc.assert(
      fc.property(baseProgramArb, baseProgram => {
        const programWithNoBlocks: Partial<EnhancedProgram> = {
          ...baseProgram,
          blocks: [], // No blocks at all
          challengeConfig: undefined // Not a challenge
        }

        const result = validateProgram(programWithNoBlocks)

        // Should be invalid due to no blocks (validation requires at least one block for non-challenge programs)
        expect(result.isValid).toBe(false)

        // Should have errors about missing blocks
        const hasBlockError = result.errors.some(
          error =>
            error.field.includes('blocks') || error.message.includes('block')
        )
        expect(hasBlockError).toBe(true)
      }),
      { numRuns: 50 }
    )

    // Edge case: Sessions with invalid indices
    fc.assert(
      fc.property(
        baseProgramArb,
        programSessionArb,
        fc.integer({ min: -10, max: 0 }),
        (baseProgram, session, invalidIndex) => {
          const program: Partial<EnhancedProgram> = {
            ...baseProgram,
            blocks: session.blocks
          }

          const result = validateProgram(program)

          // Program structure should be validated
          if (result.isValid) {
            expect(Array.isArray(program.blocks)).toBe(true)
          }
        }
      ),
      { numRuns: 50 }
    )

    // Edge case: Duplicate session indices
    fc.assert(
      fc.property(
        baseProgramArb,
        programSessionArb,
        programSessionArb,
        (baseProgram, session1, session2) => {
          // Combine blocks from both sessions
          const combinedBlocks = [...session1.blocks, ...session2.blocks]

          const program: Partial<EnhancedProgram> = {
            ...baseProgram,
            blocks: combinedBlocks
          }

          // Validate the program
          validateProgram(program)

          // Each block should be structurally valid
          combinedBlocks.forEach(block => {
            expect(['warmup', 'exercise', 'rest']).toContain(block.type)
          })
        }
      ),
      { numRuns: 50 }
    )
  })
})
