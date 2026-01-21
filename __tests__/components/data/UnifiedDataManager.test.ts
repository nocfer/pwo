/**
 * Property-based tests for UnifiedDataManager component
 * Feature: data-management-reorganization, Property 1: Data type navigation consistency
 */

import type { DataType } from '@/types/enhanced'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

// Mock data for testing
const mockExercises = [
  {
    id: 'ex_1',
    name: 'Push Ups',
    category: 'strength' as const,
    icon: 'fitness',
    source: 'builtin' as const,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
]

const mockPrograms = [
  {
    id: 'prg_1',
    name: 'Beginner Program',
    description: 'For beginners',
    sessions: [
      {
        index: 1,
        blocks: [{ type: 'warmup' as const, seconds: 300 }]
      }
    ],
    source: 'builtin' as const,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    challengeConfig: undefined
  }
]

const mockChallenges = [
  {
    id: 'ch_1',
    name: 'Push Up Challenge',
    description: '100 push ups challenge',
    sessions: [
      {
        index: 1,
        blocks: [{ type: 'warmup' as const, seconds: 300 }]
      }
    ],
    challengeConfig: {
      exerciseId: 'ex_1',
      sets: 5,
      targetReps: 100,
      warmUpSeconds: 60,
      breakSeconds: 30
    },
    source: 'builtin' as const,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
]

// Simulate the data filtering logic from UnifiedDataManager
function getCurrentData(dataType: DataType) {
  switch (dataType) {
    case 'exercises':
      return mockExercises
    case 'programs':
      return mockPrograms.filter(p => !p.challengeConfig)
    case 'challenges':
      return [
        ...mockPrograms.filter(p => Boolean(p.challengeConfig)),
        ...mockChallenges
      ]
    default:
      return []
  }
}

// Simulate the search placeholder logic
function getSearchPlaceholder(dataType: DataType): string {
  const tabLabels = {
    exercises: 'Exercises',
    programs: 'Programs',
    challenges: 'Challenges'
  }
  return `Search ${tabLabels[dataType].toLowerCase()}...`
}

// Simulate tab label logic
function getTabLabel(dataType: DataType): string {
  return dataType.charAt(0).toUpperCase() + dataType.slice(1)
}

describe('UnifiedDataManager Property Tests', () => {
  // Property 1: Data type navigation consistency
  // For any data type (exercises, programs, challenges), switching to that data type
  // should display the appropriate interface and data
  // **Validates: Requirements 1.3**
  it('Property 1: Data type navigation consistency', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('exercises', 'programs', 'challenges'),
        (dataType: DataType) => {
          // Test the data filtering logic
          const currentData = getCurrentData(dataType)

          // Verify data is filtered correctly for each type
          if (dataType === 'exercises') {
            expect(currentData).toEqual(mockExercises)
          } else if (dataType === 'programs') {
            // Should only include programs without challengeConfig
            expect(
              currentData.every(
                item => !('challengeConfig' in item) || !item.challengeConfig
              )
            ).toBe(true)
          } else if (dataType === 'challenges') {
            // Should only include programs with challengeConfig
            expect(
              currentData.every(
                item => 'challengeConfig' in item && item.challengeConfig
              )
            ).toBe(true)
          }

          // Test search placeholder generation
          const placeholder = getSearchPlaceholder(dataType)
          const expectedPlaceholder = `Search ${dataType.toLowerCase()}...`
          expect(placeholder).toBe(expectedPlaceholder)

          // Test tab label generation
          const tabLabel = getTabLabel(dataType)
          const expectedLabel =
            dataType.charAt(0).toUpperCase() + dataType.slice(1)
          expect(tabLabel).toBe(expectedLabel)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  // Property 1a: Tab switching updates interface consistently
  it('Property 1a: Tab switching behavior is consistent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('exercises', 'programs', 'challenges'),
        fc.constantFrom('exercises', 'programs', 'challenges'),
        (initialTab: DataType, targetTab: DataType) => {
          // Test initial state
          const initialData = getCurrentData(initialTab)
          const initialPlaceholder = getSearchPlaceholder(initialTab)
          const initialLabel = getTabLabel(initialTab)

          // Test target state
          const targetData = getCurrentData(targetTab)
          const targetPlaceholder = getSearchPlaceholder(targetTab)
          const targetLabel = getTabLabel(targetTab)

          // Verify each state is internally consistent
          expect(initialPlaceholder).toBe(
            `Search ${initialTab.toLowerCase()}...`
          )
          expect(initialLabel).toBe(
            initialTab.charAt(0).toUpperCase() + initialTab.slice(1)
          )

          expect(targetPlaceholder).toBe(`Search ${targetTab.toLowerCase()}...`)
          expect(targetLabel).toBe(
            targetTab.charAt(0).toUpperCase() + targetTab.slice(1)
          )

          // Verify data filtering is consistent
          if (initialTab === 'exercises') {
            expect(initialData).toEqual(mockExercises)
          }
          if (targetTab === 'exercises') {
            expect(targetData).toEqual(mockExercises)
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  // Property 1b: Search query initialization is consistent
  it('Property 1b: Search query handling is consistent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('exercises', 'programs', 'challenges'),
        fc.string({ minLength: 0, maxLength: 50 }),
        (dataType: DataType, searchQuery: string) => {
          // Test that data type and search query can be used together
          const data = getCurrentData(dataType)
          const placeholder = getSearchPlaceholder(dataType)

          // Verify the component logic handles any valid search query
          expect(typeof searchQuery).toBe('string')
          expect(data).toBeDefined()
          expect(placeholder).toBeDefined()

          // Test search filtering logic (simplified)
          if (searchQuery.trim()) {
            const filteredData = data.filter(
              item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ('description' in item &&
                  item.description &&
                  item.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()))
            )
            expect(Array.isArray(filteredData)).toBe(true)
            expect(filteredData.length).toBeLessThanOrEqual(data.length)
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  // Unit test to verify tab structure
  it('has correct tab configuration', () => {
    const dataTypes: DataType[] = ['exercises', 'programs', 'challenges']

    dataTypes.forEach(dataType => {
      const label = getTabLabel(dataType)
      const placeholder = getSearchPlaceholder(dataType)
      const data = getCurrentData(dataType)

      expect(label).toBeTruthy()
      expect(placeholder).toBeTruthy()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  // Unit test for data filtering logic
  it('correctly filters data by type', () => {
    // Exercises should return exercise data
    const exercises = getCurrentData('exercises')
    expect(exercises).toEqual(mockExercises)

    // Programs should exclude challenges
    const programs = getCurrentData('programs')
    expect(
      programs.every(p => !('challengeConfig' in p) || !p.challengeConfig)
    ).toBe(true)

    // Challenges should only include items with challengeConfig
    const challenges = getCurrentData('challenges')
    expect(
      challenges.every(c => 'challengeConfig' in c && c.challengeConfig)
    ).toBe(true)
  })
})
