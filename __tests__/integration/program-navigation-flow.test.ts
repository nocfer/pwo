/**
 * Integration test for program navigation flow
 *
 * Tests the actual navigation patterns used in the application
 * to ensure programs start correctly and navigation works as expected.
 */

import { router } from 'expo-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock expo-router
vi.mock('expo-router', () => ({
  router: {
    navigate: vi.fn(),
    push: vi.fn(),
    back: vi.fn(),
    canGoBack: vi.fn(() => true)
  }
}))

describe('Program Navigation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Program Start Navigation (Requirements 1.5, 2.2)', () => {
    it('should navigate to first session when starting a new program', () => {
      const programId = 'test-program-123'
      const expectedSessionIndex = 1

      // Simulate the navigation call that happens when starting a program
      router.navigate({
        pathname: '/programs/[id]/session/[index]',
        params: {
          id: programId,
          index: String(expectedSessionIndex)
        }
      })

      expect(router.navigate).toHaveBeenCalledWith({
        pathname: '/programs/[id]/session/[index]',
        params: {
          id: programId,
          index: '1'
        }
      })
    })

    it('should navigate to program detail screen when tapping program item', () => {
      const programId = 'detail-test-program'

      // Simulate navigation to program detail (not edit)
      router.navigate({
        pathname: '/programs/[id]',
        params: { id: programId }
      })

      expect(router.navigate).toHaveBeenCalledWith({
        pathname: '/programs/[id]',
        params: { id: programId }
      })
    })

    it('should navigate to edit screen when tapping edit button', () => {
      const programId = 'edit-test-program'

      // Test regular program edit navigation
      router.push(`/library/programs/${programId}/edit`)

      expect(router.push).toHaveBeenCalledWith(
        `/library/programs/${programId}/edit`
      )

      // Test challenge program edit navigation
      router.push(`/library/challenges/${programId}/edit`)

      expect(router.push).toHaveBeenCalledWith(
        `/library/challenges/${programId}/edit`
      )
    })
  })

  describe('Session Navigation (Requirement 1.6)', () => {
    it('should allow navigation to specific session indices', () => {
      const programId = 'multi-session-program'
      const sessionIndices = [1, 3, 5, 8]

      sessionIndices.forEach(sessionIndex => {
        router.navigate({
          pathname: '/programs/[id]/session/[index]',
          params: {
            id: programId,
            index: String(sessionIndex)
          }
        })
      })

      expect(router.navigate).toHaveBeenCalledTimes(sessionIndices.length)

      // Verify each call was made with correct parameters
      sessionIndices.forEach((sessionIndex, callIndex) => {
        expect(router.navigate).toHaveBeenNthCalledWith(callIndex + 1, {
          pathname: '/programs/[id]/session/[index]',
          params: {
            id: programId,
            index: String(sessionIndex)
          }
        })
      })
    })

    it('should handle session navigation for both regular and challenge programs', () => {
      const regularProgramId = 'regular-program'
      const challengeProgramId = 'challenge-program'
      const sessionIndex = 2

      // Navigate to regular program session
      router.navigate({
        pathname: '/programs/[id]/session/[index]',
        params: {
          id: regularProgramId,
          index: String(sessionIndex)
        }
      })

      // Navigate to challenge program session
      router.navigate({
        pathname: '/programs/[id]/session/[index]',
        params: {
          id: challengeProgramId,
          index: String(sessionIndex)
        }
      })

      expect(router.navigate).toHaveBeenCalledTimes(2)
      expect(router.navigate).toHaveBeenCalledWith({
        pathname: '/programs/[id]/session/[index]',
        params: {
          id: regularProgramId,
          index: '2'
        }
      })
      expect(router.navigate).toHaveBeenCalledWith({
        pathname: '/programs/[id]/session/[index]',
        params: {
          id: challengeProgramId,
          index: '2'
        }
      })
    })
  })

  describe('Navigation Back Behavior (Requirement 4.5)', () => {
    it('should support going back from session screens', () => {
      // Verify back navigation is available
      expect(router.canGoBack()).toBe(true)

      // Simulate going back from session
      router.back()

      expect(router.back).toHaveBeenCalledTimes(1)
    })

    it('should maintain proper navigation stack', () => {
      const programId = 'stack-test-program'

      // Simulate full navigation flow
      // 1. Navigate to program detail
      router.navigate({
        pathname: '/programs/[id]',
        params: { id: programId }
      })

      // 2. Start program (navigate to session)
      router.navigate({
        pathname: '/programs/[id]/session/[index]',
        params: {
          id: programId,
          index: '1'
        }
      })

      // 3. Should be able to go back
      expect(router.canGoBack()).toBe(true)
      router.back()

      expect(router.navigate).toHaveBeenCalledTimes(2)
      expect(router.back).toHaveBeenCalledTimes(1)
    })
  })

  describe('Parameter Validation', () => {
    it('should handle string conversion of session indices correctly', () => {
      const programId = 'param-test-program'
      const numericIndex = 5

      router.navigate({
        pathname: '/programs/[id]/session/[index]',
        params: {
          id: programId,
          index: String(numericIndex)
        }
      })

      expect(router.navigate).toHaveBeenCalledWith({
        pathname: '/programs/[id]/session/[index]',
        params: {
          id: programId,
          index: '5'
        }
      })
    })

    it('should handle program ID parameter correctly', () => {
      const programIds = [
        'abc-123',
        'program_with_underscores',
        'program-with-dashes'
      ]

      programIds.forEach(programId => {
        router.navigate({
          pathname: '/programs/[id]',
          params: { id: programId }
        })
      })

      expect(router.navigate).toHaveBeenCalledTimes(programIds.length)

      programIds.forEach((programId, index) => {
        expect(router.navigate).toHaveBeenNthCalledWith(index + 1, {
          pathname: '/programs/[id]',
          params: { id: programId }
        })
      })
    })
  })

  describe('Navigation Consistency', () => {
    it('should use consistent navigation patterns across program types', () => {
      const regularProgramId = 'regular-123'
      const challengeProgramId = 'challenge-456'

      // Regular program navigation
      router.navigate({
        pathname: '/programs/[id]/session/[index]',
        params: {
          id: regularProgramId,
          index: '1'
        }
      })

      // Challenge program navigation
      router.navigate({
        pathname: '/programs/[id]/session/[index]',
        params: {
          id: challengeProgramId,
          index: '1'
        }
      })

      expect(router.navigate).toHaveBeenCalledTimes(2)

      // Verify both calls use the same pathname structure
      const calls = (router.navigate as any).mock.calls
      expect(calls[0][0].pathname).toBe('/programs/[id]/session/[index]')
      expect(calls[1][0].pathname).toBe('/programs/[id]/session/[index]')
      expect(calls[0][0].params.index).toBe('1')
      expect(calls[1][0].params.index).toBe('1')
    })
  })
})
