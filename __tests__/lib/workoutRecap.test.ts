import { buildWorkoutRecap } from '@/lib/workoutRecap'
import { formatClock } from '@/lib/utils/format'
import type { ExerciseState } from '@/types/workout'
import { describe, expect, it } from 'vitest'

function ex(
  exerciseId: string,
  exerciseName: string,
  sets: ExerciseState['sets']
): ExerciseState {
  return { exerciseId, exerciseName, sets }
}

describe('formatClock', () => {
  it('formats m:ss', () => {
    expect(formatClock(90_000)).toBe('1:30')
  })
  it('formats h:mm:ss past an hour', () => {
    expect(formatClock(3_661_000)).toBe('1:01:01')
  })
})

describe('buildWorkoutRecap', () => {
  it('aggregates time, sets, and completed volume', () => {
    const exercises = [
      ex('a', 'Bench', [
        { reps: 10, weight: 100, status: 'completed', confirmedReps: 10, confirmedWeight: 100 },
        { reps: 8, weight: 100, status: 'completed', confirmedReps: 8, confirmedWeight: 100 }
      ]),
      ex('b', 'Squat', [
        { reps: 5, weight: 200, status: 'completed', confirmedReps: 5, confirmedWeight: 200 }
      ])
    ]
    const recap = buildWorkoutRecap(exercises, 90_000, new Map())
    expect(recap.timeStr).toBe('1:30')
    expect(recap.setsCount).toBe(3)
    // 1000 + 800 + 1000
    expect(recap.volume).toBe(2800)
    expect(recap.totalSkipped).toBe(0)
  })

  it('counts skipped sets and renders skipped-only detail', () => {
    const exercises = [
      ex('a', 'Bench', [
        { reps: 10, weight: 100, status: 'skipped' },
        { reps: 10, weight: 100, status: 'skipped' }
      ])
    ]
    const recap = buildWorkoutRecap(exercises, 0, new Map())
    expect(recap.totalSkipped).toBe(2)
    expect(recap.setsCount).toBe(0)
    expect(recap.rows[0].detail).toBe('2 sets skipped')
    expect(recap.rows[0].isPR).toBe(false)
  })

  it('renders completed detail with top weight and trailing skipped note', () => {
    const exercises = [
      ex('a', 'Bench', [
        { reps: 10, weight: 135, status: 'completed', confirmedWeight: 135, confirmedReps: 10 },
        { reps: 8, weight: 145, status: 'completed', confirmedWeight: 145, confirmedReps: 8 },
        { reps: 8, weight: 145, status: 'skipped' }
      ])
    ]
    const recap = buildWorkoutRecap(exercises, 0, new Map())
    expect(recap.rows[0].detail).toBe('2 sets · top 145 lb · 1 skipped')
  })

  it('flags a PR when top weight beats the prior best', () => {
    const exercises = [
      ex('a', 'Bench', [
        { reps: 5, weight: 160, status: 'completed', confirmedWeight: 160, confirmedReps: 5 }
      ])
    ]
    const recap = buildWorkoutRecap(exercises, 0, new Map([['a', 150]]))
    expect(recap.rows[0].isPR).toBe(true)
  })

  it('does not flag a PR when at or below the prior best, or when unknown', () => {
    const exercises = [
      ex('a', 'Bench', [
        { reps: 5, weight: 150, status: 'completed', confirmedWeight: 150, confirmedReps: 5 }
      ]),
      ex('b', 'Squat', [
        { reps: 5, weight: 300, status: 'completed', confirmedWeight: 300, confirmedReps: 5 }
      ])
    ]
    // 'a' ties the best (not >), 'b' has no known best
    const recap = buildWorkoutRecap(exercises, 0, new Map([['a', 150]]))
    expect(recap.rows[0].isPR).toBe(false)
    expect(recap.rows[1].isPR).toBe(false)
  })
})
