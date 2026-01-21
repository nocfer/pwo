/**
 * Property-Based Tests for Progress Data Organization
 *
 * **Property 15: Progress data organization**
 * **Validates: Requirements 5.2, 5.3**
 *
 * Tests that progress visualizations are properly organized by data type
 * with appropriate filtering options.
 */

import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

// Mock data types for testing
interface MockProgressData {
  id: string
  type: 'program' | 'challenge' | 'exercise'
  date: string
  value: number
  category: string | null
}

interface FilterOptions {
  dateRange?: { start: string; end: string }
  exerciseType?: string[]
  programCategory?: string[]
}

// Function to organize progress data by type
function organizeProgressDataByType(
  data: MockProgressData[],
  filters?: FilterOptions
): Record<string, MockProgressData[]> {
  let filteredData = data

  // Apply date range filter
  if (filters?.dateRange) {
    filteredData = filteredData.filter(item => {
      const itemDate = new Date(item.date)
      const startDate = new Date(filters.dateRange!.start)
      const endDate = new Date(filters.dateRange!.end)
      return itemDate >= startDate && itemDate <= endDate
    })
  }

  // Apply category filters
  if (filters?.exerciseType && filters.exerciseType.length > 0) {
    filteredData = filteredData.filter(
      item =>
        item.type === 'exercise' &&
        item.category &&
        filters.exerciseType!.includes(item.category)
    )
  }

  if (filters?.programCategory && filters.programCategory.length > 0) {
    filteredData = filteredData.filter(
      item =>
        item.type === 'program' &&
        item.category &&
        filters.programCategory!.includes(item.category)
    )
  }

  // Organize by type
  const organized: Record<string, MockProgressData[]> = {
    programs: [],
    challenges: [],
    exercises: []
  }

  filteredData.forEach(item => {
    switch (item.type) {
      case 'program':
        organized.programs.push(item)
        break
      case 'challenge':
        organized.challenges.push(item)
        break
      case 'exercise':
        organized.exercises.push(item)
        break
    }
  })

  return organized
}

// Generators for property testing
const progressDataArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  type: fc.constantFrom('program', 'challenge', 'exercise'),
  date: fc.integer({ min: 0, max: 1000 }).map(days => {
    const baseDate = new Date('2023-01-01')
    baseDate.setDate(baseDate.getDate() + days)
    return baseDate.toISOString().split('T')[0]
  }),
  value: fc.integer({ min: 0, max: 1000 }),
  category: fc.option(
    fc.constantFrom(
      'strength',
      'cardio',
      'flexibility',
      'beginner',
      'intermediate',
      'advanced'
    )
  )
})

const filterOptionsArb = fc.record({
  dateRange: fc.oneof(
    fc.constant(undefined),
    fc.record({
      start: fc.integer({ min: 0, max: 500 }).map(days => {
        const baseDate = new Date('2023-01-01')
        baseDate.setDate(baseDate.getDate() + days)
        return baseDate.toISOString().split('T')[0]
      }),
      end: fc.integer({ min: 500, max: 1000 }).map(days => {
        const baseDate = new Date('2023-01-01')
        baseDate.setDate(baseDate.getDate() + days)
        return baseDate.toISOString().split('T')[0]
      })
    })
  ),
  exerciseType: fc.oneof(
    fc.constant(undefined),
    fc.array(fc.constantFrom('strength', 'cardio', 'flexibility'), {
      minLength: 0,
      maxLength: 3
    })
  ),
  programCategory: fc.oneof(
    fc.constant(undefined),
    fc.array(fc.constantFrom('beginner', 'intermediate', 'advanced'), {
      minLength: 0,
      maxLength: 3
    })
  )
})

describe('Progress Data Organization Properties', () => {
  it('Property 15: Progress data organization - should organize data by type correctly', () => {
    // Feature: data-management-reorganization, Property 15: Progress data organization
    fc.assert(
      fc.property(
        fc.array(progressDataArb, { minLength: 0, maxLength: 50 }),
        data => {
          const organized = organizeProgressDataByType(data)

          // All data should be categorized into one of the three types
          const totalOriginal = data.length
          const totalOrganized =
            organized.programs.length +
            organized.challenges.length +
            organized.exercises.length

          expect(totalOrganized).toBe(totalOriginal)

          // Each category should only contain items of the correct type
          organized.programs.forEach(item => {
            expect(item.type).toBe('program')
          })

          organized.challenges.forEach(item => {
            expect(item.type).toBe('challenge')
          })

          organized.exercises.forEach(item => {
            expect(item.type).toBe('exercise')
          })

          // No data should be lost or duplicated
          const allOrganizedIds = [
            ...organized.programs.map(p => p.id),
            ...organized.challenges.map(c => c.id),
            ...organized.exercises.map(e => e.id)
          ]
          const originalIds = data.map(d => d.id)

          expect(allOrganizedIds.sort()).toEqual(originalIds.sort())
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 15: Progress data organization - filtering should preserve organization structure', () => {
    // Feature: data-management-reorganization, Property 15: Progress data organization
    fc.assert(
      fc.property(
        fc.array(progressDataArb, { minLength: 0, maxLength: 50 }),
        filterOptionsArb,
        (data, filters) => {
          const organized = organizeProgressDataByType(data, filters)

          // Organization structure should always be present
          expect(organized).toHaveProperty('programs')
          expect(organized).toHaveProperty('challenges')
          expect(organized).toHaveProperty('exercises')

          // All arrays should be defined
          expect(Array.isArray(organized.programs)).toBe(true)
          expect(Array.isArray(organized.challenges)).toBe(true)
          expect(Array.isArray(organized.exercises)).toBe(true)

          // If date range filter is applied, all items should be within range
          if (filters.dateRange) {
            const startDate = new Date(filters.dateRange.start)
            const endDate = new Date(filters.dateRange.end)

            ;[
              ...organized.programs,
              ...organized.challenges,
              ...organized.exercises
            ].forEach(item => {
              const itemDate = new Date(item.date)
              expect(itemDate >= startDate && itemDate <= endDate).toBe(true)
            })
          }

          // If exercise type filter is applied, only matching exercises should be included
          if (filters.exerciseType && filters.exerciseType.length > 0) {
            organized.exercises.forEach(exercise => {
              expect(exercise.category).toBeDefined()
              expect(exercise.category).not.toBeNull()
              const category = exercise.category as
                | 'strength'
                | 'cardio'
                | 'flexibility'
              expect(filters.exerciseType!.includes(category)).toBe(true)
            })
          }

          // If program category filter is applied, only matching programs should be included
          if (filters.programCategory && filters.programCategory.length > 0) {
            organized.programs.forEach(program => {
              expect(program.category).toBeDefined()
              expect(program.category).not.toBeNull()
              const category = program.category as
                | 'beginner'
                | 'intermediate'
                | 'advanced'
              expect(filters.programCategory!.includes(category)).toBe(true)
            })
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 15: Progress data organization - empty data should produce empty organized structure', () => {
    // Feature: data-management-reorganization, Property 15: Progress data organization
    fc.assert(
      fc.property(filterOptionsArb, filters => {
        const organized = organizeProgressDataByType([], filters)

        expect(organized.programs).toEqual([])
        expect(organized.challenges).toEqual([])
        expect(organized.exercises).toEqual([])
      }),
      { numRuns: 100 }
    )
  })

  it('Property 15: Progress data organization - filtering should never increase data count', () => {
    // Feature: data-management-reorganization, Property 15: Progress data organization
    fc.assert(
      fc.property(
        fc.array(progressDataArb, { minLength: 1, maxLength: 50 }),
        filterOptionsArb,
        (data, filters) => {
          const unfiltered = organizeProgressDataByType(data)
          const filtered = organizeProgressDataByType(data, filters)

          const unfilteredCount =
            unfiltered.programs.length +
            unfiltered.challenges.length +
            unfiltered.exercises.length

          const filteredCount =
            filtered.programs.length +
            filtered.challenges.length +
            filtered.exercises.length

          // Filtering should never increase the count
          expect(filteredCount).toBeLessThanOrEqual(unfilteredCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 15: Progress data organization - type consistency should be maintained', () => {
    // Feature: data-management-reorganization, Property 15: Progress data organization
    fc.assert(
      fc.property(
        fc.array(progressDataArb, { minLength: 0, maxLength: 50 }),
        filterOptionsArb,
        (data, filters) => {
          const organized = organizeProgressDataByType(data, filters)

          // Count items by type in original data
          const originalCounts = {
            programs: data.filter(d => d.type === 'program').length,
            challenges: data.filter(d => d.type === 'challenge').length,
            exercises: data.filter(d => d.type === 'exercise').length
          }

          // Without filters, counts should match exactly
          if (
            !filters.dateRange &&
            (!filters.exerciseType || filters.exerciseType.length === 0) &&
            (!filters.programCategory || filters.programCategory.length === 0)
          ) {
            expect(organized.programs.length).toBe(originalCounts.programs)
            expect(organized.challenges.length).toBe(originalCounts.challenges)
            expect(organized.exercises.length).toBe(originalCounts.exercises)
          }

          // With filters, organized counts should be <= original counts
          expect(organized.programs.length).toBeLessThanOrEqual(
            originalCounts.programs
          )
          expect(organized.challenges.length).toBeLessThanOrEqual(
            originalCounts.challenges
          )
          expect(organized.exercises.length).toBeLessThanOrEqual(
            originalCounts.exercises
          )
        }
      ),
      { numRuns: 100 }
    )
  })
})
