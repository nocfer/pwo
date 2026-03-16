import { describe, expect, it } from 'vitest'
import { buildInitialState } from '@/lib/buildInitialState'
import type { Program } from '@/types'
import type { PrefillMap } from '@/types/workout'

function makeProgram(
  blocks: Program['blocks'],
  overrides?: Partial<Program>
): Program {
  return {
    id: 'prog-1',
    name: 'Push Day',
    blocks,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    source: 'user',
    ...overrides
  }
}

const nameMap = new Map([
  ['ex-bench', 'Bench Press'],
  ['ex-fly', 'Cable Fly'],
  ['ex-curl', 'Bicep Curl']
])

describe('buildInitialState', () => {
  it('uses program targetReps and weight=0 when no prefillMap', () => {
    const program = makeProgram([
      { type: 'exercise', exerciseId: 'ex-bench', sets: 3, targetReps: 10 }
    ])

    const state = buildInitialState(program, 0, nameMap)

    expect(state.exercises).toHaveLength(1)
    expect(state.exercises[0].sets).toHaveLength(3)
    state.exercises[0].sets.forEach((s, i) => {
      expect(s.reps).toBe(10)
      expect(s.weight).toBe(0)
      expect(s.status).toBe(i === 0 ? 'active' : 'pending')
    })
  })

  it('uses prefillMap reps and weight when provided', () => {
    const program = makeProgram([
      { type: 'exercise', exerciseId: 'ex-bench', sets: 3, targetReps: 10 }
    ])
    const prefillMap: PrefillMap = new Map([
      ['ex-bench', { reps: 8, weight: 185 }]
    ])

    const state = buildInitialState(program, 0, nameMap, prefillMap)

    state.exercises[0].sets.forEach(s => {
      expect(s.reps).toBe(8)
      expect(s.weight).toBe(185)
    })
  })

  it('applies per-exercise prefill (same values for all sets)', () => {
    const program = makeProgram([
      { type: 'exercise', exerciseId: 'ex-bench', sets: 4, targetReps: 12 }
    ])
    const prefillMap: PrefillMap = new Map([
      ['ex-bench', { reps: 6, weight: 225 }]
    ])

    const state = buildInitialState(program, 0, nameMap, prefillMap)

    expect(state.exercises[0].sets.every(s => s.reps === 6)).toBe(true)
    expect(state.exercises[0].sets.every(s => s.weight === 225)).toBe(true)
  })

  it('falls back to program targets for exercises missing from prefillMap', () => {
    const program = makeProgram([
      { type: 'exercise', exerciseId: 'ex-bench', sets: 2, targetReps: 10 },
      { type: 'exercise', exerciseId: 'ex-fly', sets: 2, targetReps: 15 }
    ])
    const prefillMap: PrefillMap = new Map([
      ['ex-bench', { reps: 8, weight: 185 }]
    ])

    const state = buildInitialState(program, 0, nameMap, prefillMap)

    expect(state.exercises[0].sets[0].reps).toBe(8)
    expect(state.exercises[0].sets[0].weight).toBe(185)
    expect(state.exercises[1].sets[0].reps).toBe(15)
    expect(state.exercises[1].sets[0].weight).toBe(0)
  })

  it('uses per-set array targetReps when no prefill', () => {
    const program = makeProgram([
      {
        type: 'exercise',
        exerciseId: 'ex-bench',
        sets: 3,
        targetReps: [12, 10, 8]
      }
    ])

    const state = buildInitialState(program, 0, nameMap)

    expect(state.exercises[0].sets[0].reps).toBe(12)
    expect(state.exercises[0].sets[1].reps).toBe(10)
    expect(state.exercises[0].sets[2].reps).toBe(8)
    expect(state.exercises[0].sets[0].weight).toBe(0)
  })

  it('prefill overrides array targetReps with single value for all sets', () => {
    const program = makeProgram([
      {
        type: 'exercise',
        exerciseId: 'ex-bench',
        sets: 3,
        targetReps: [12, 10, 8]
      }
    ])
    const prefillMap: PrefillMap = new Map([
      ['ex-bench', { reps: 15, weight: 200 }]
    ])

    const state = buildInitialState(program, 0, nameMap, prefillMap)

    expect(state.exercises[0].sets.every(s => s.reps === 15)).toBe(true)
    expect(state.exercises[0].sets.every(s => s.weight === 200)).toBe(true)
  })

  it('handles no targetReps and no prefill (reps=0, weight=0)', () => {
    const program = makeProgram([
      { type: 'exercise', exerciseId: 'ex-bench', sets: 2 }
    ])

    const state = buildInitialState(program, 0, nameMap)

    expect(state.exercises[0].sets[0].reps).toBe(0)
    expect(state.exercises[0].sets[0].weight).toBe(0)
  })

  it('marks first set of first exercise as active', () => {
    const program = makeProgram([
      { type: 'exercise', exerciseId: 'ex-bench', sets: 2, targetReps: 10 },
      { type: 'exercise', exerciseId: 'ex-fly', sets: 2, targetReps: 12 }
    ])

    const state = buildInitialState(program, 0, nameMap)

    expect(state.exercises[0].sets[0].status).toBe('active')
    expect(state.exercises[0].sets[1].status).toBe('pending')
    expect(state.exercises[1].sets[0].status).toBe('pending')
  })

  it('resolves exercise names from the provided map', () => {
    const program = makeProgram([
      { type: 'exercise', exerciseId: 'ex-bench', sets: 1, targetReps: 5 }
    ])

    const state = buildInitialState(program, 0, nameMap)
    expect(state.exercises[0].exerciseName).toBe('Bench Press')
  })

  it('uses exerciseId as fallback name when not in name map', () => {
    const program = makeProgram([
      { type: 'exercise', exerciseId: 'ex-unknown', sets: 1 }
    ])

    const state = buildInitialState(program, 0, nameMap)
    expect(state.exercises[0].exerciseName).toBe('ex-unknown')
  })

  it('clamps array targetReps to last value when array is shorter than sets', () => {
    const program = makeProgram([
      {
        type: 'exercise',
        exerciseId: 'ex-bench',
        sets: 5,
        targetReps: [12, 10]
      }
    ])

    const state = buildInitialState(program, 0, nameMap)

    expect(state.exercises[0].sets[0].reps).toBe(12)
    expect(state.exercises[0].sets[1].reps).toBe(10)
    expect(state.exercises[0].sets[2].reps).toBe(10)
    expect(state.exercises[0].sets[3].reps).toBe(10)
    expect(state.exercises[0].sets[4].reps).toBe(10)
  })

  it('sets correct metadata on the returned state', () => {
    const program = makeProgram([
      { type: 'exercise', exerciseId: 'ex-bench', sets: 1, targetReps: 5 }
    ])

    const state = buildInitialState(program, 2, nameMap)

    expect(state.programSlug).toBe('prog-1')
    expect(state.sessionIndex).toBe(2)
    expect(state.sessionName).toBe('Push Day')
    expect(state.expandedExerciseIndex).toBe(0)
    expect(state.activeSetIndex).toBe(0)
    expect(state.isCompleted).toBe(false)
    expect(state.completedAt).toBeNull()
  })
})
