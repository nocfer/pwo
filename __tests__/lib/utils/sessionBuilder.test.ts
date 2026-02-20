import { buildWorkoutLog } from '@/lib/utils/sessionBuilder'
import type { AccumulatedSet } from '@/types/session'
import { describe, expect, it } from 'vitest'

describe('buildWorkoutLog', () => {
  const slug = 'test-workout'
  const completedAt = '2024-01-15T10:00:00.000Z'
  const timeSpentSeconds = 1800

  it('builds a valid WorkoutLogInput from accumulated sets', () => {
    const sets: AccumulatedSet[] = [
      {
        exerciseId: 'ex1',
        reps: 10,
        weight: 50,
        isBodyweight: false,
        timestamp: '2024-01-15T09:30:00.000Z'
      },
      {
        exerciseId: 'ex1',
        reps: 8,
        weight: 55,
        isBodyweight: false,
        timestamp: '2024-01-15T09:35:00.000Z'
      },
      {
        exerciseId: 'ex2',
        reps: 15,
        isBodyweight: true,
        timestamp: '2024-01-15T09:40:00.000Z'
      }
    ]

    const result = buildWorkoutLog(slug, completedAt, timeSpentSeconds, sets)

    expect(result.workoutId).toBe(slug)
    expect(result.completedAt).toBe(completedAt)
    expect(result.timeSpentSeconds).toBe(timeSpentSeconds)
    expect(result.exercises).toHaveLength(2)

    // First exercise group
    const ex1 = result.exercises.find(e => e.exerciseId === 'ex1')!
    expect(ex1.sets).toHaveLength(2)
    expect(ex1.sets[0]).toEqual({
      reps: 10,
      weight: 50,
      isBodyweight: false,
      timestamp: '2024-01-15T09:30:00.000Z'
    })
    expect(ex1.sets[1]).toEqual({
      reps: 8,
      weight: 55,
      isBodyweight: false,
      timestamp: '2024-01-15T09:35:00.000Z'
    })
    expect(ex1.lastCompletedAt).toBe('2024-01-15T09:35:00.000Z')

    // Second exercise group
    const ex2 = result.exercises.find(e => e.exerciseId === 'ex2')!
    expect(ex2.sets).toHaveLength(1)
    expect(ex2.sets[0]).toEqual({
      reps: 15,
      isBodyweight: true,
      timestamp: '2024-01-15T09:40:00.000Z'
    })
    expect(ex2.lastCompletedAt).toBe('2024-01-15T09:40:00.000Z')
  })

  it('returns empty exercises array when no sets provided', () => {
    const result = buildWorkoutLog(slug, completedAt, timeSpentSeconds, [])

    expect(result.workoutId).toBe(slug)
    expect(result.exercises).toEqual([])
  })

  it('omits weight field when weight is undefined', () => {
    const sets: AccumulatedSet[] = [
      {
        exerciseId: 'ex1',
        reps: 20,
        isBodyweight: true,
        timestamp: '2024-01-15T09:30:00.000Z'
      }
    ]

    const result = buildWorkoutLog(slug, completedAt, timeSpentSeconds, sets)
    const setResult = result.exercises[0].sets[0]

    expect(setResult).not.toHaveProperty('weight')
    expect(setResult.reps).toBe(20)
    expect(setResult.isBodyweight).toBe(true)
  })

  it('includes weight when it is 0', () => {
    const sets: AccumulatedSet[] = [
      {
        exerciseId: 'ex1',
        reps: 10,
        weight: 0,
        isBodyweight: false,
        timestamp: '2024-01-15T09:30:00.000Z'
      }
    ]

    const result = buildWorkoutLog(slug, completedAt, timeSpentSeconds, sets)

    expect(result.exercises[0].sets[0].weight).toBe(0)
  })

  it('uses the latest timestamp as lastCompletedAt per exercise', () => {
    const sets: AccumulatedSet[] = [
      {
        exerciseId: 'ex1',
        reps: 10,
        isBodyweight: true,
        timestamp: '2024-01-15T09:45:00.000Z'
      },
      {
        exerciseId: 'ex1',
        reps: 8,
        isBodyweight: true,
        timestamp: '2024-01-15T09:30:00.000Z'
      },
      {
        exerciseId: 'ex1',
        reps: 12,
        isBodyweight: true,
        timestamp: '2024-01-15T09:40:00.000Z'
      }
    ]

    const result = buildWorkoutLog(slug, completedAt, timeSpentSeconds, sets)

    expect(result.exercises[0].lastCompletedAt).toBe('2024-01-15T09:45:00.000Z')
  })

  it('preserves insertion order of exercise groups', () => {
    const sets: AccumulatedSet[] = [
      {
        exerciseId: 'ex3',
        reps: 5,
        isBodyweight: true,
        timestamp: '2024-01-15T09:30:00.000Z'
      },
      {
        exerciseId: 'ex1',
        reps: 10,
        isBodyweight: true,
        timestamp: '2024-01-15T09:35:00.000Z'
      },
      {
        exerciseId: 'ex2',
        reps: 8,
        isBodyweight: true,
        timestamp: '2024-01-15T09:40:00.000Z'
      }
    ]

    const result = buildWorkoutLog(slug, completedAt, timeSpentSeconds, sets)

    expect(result.exercises.map(e => e.exerciseId)).toEqual([
      'ex3',
      'ex1',
      'ex2'
    ])
  })
})
