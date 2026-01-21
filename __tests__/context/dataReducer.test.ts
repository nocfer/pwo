import { dataReducer, initialState } from '@/context/DataContext'
import { describe, expect, it } from 'vitest'

describe('dataReducer', () => {
  it('SET_EXERCISES updates exercises and sets loading to false', () => {
    const exercises = [
      {
        id: 'ex_1',
        name: 'Push Ups',
        source: 'user' as const,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      }
    ]
    const result = dataReducer(initialState, {
      type: 'SET_EXERCISES',
      exercises
    })
    expect(result.exercises).toEqual(exercises)
    expect(result.exercisesLoading).toBe(false)
  })

  it('SET_PROGRAMS updates programs and sets loading to false', () => {
    const programs = [
      {
        id: 'prg_1',
        name: 'Test Program',
        blocks: [],
        source: 'user' as const,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      }
    ]
    const result = dataReducer(initialState, {
      type: 'SET_PROGRAMS',
      programs
    })
    expect(result.programs).toEqual(programs)
    expect(result.programsLoading).toBe(false)
  })

  it('SET_LAST_COMPLETED_SLUG updates slug', () => {
    const result = dataReducer(initialState, {
      type: 'SET_LAST_COMPLETED_SLUG',
      slug: 'test-slug'
    })
    expect(result.lastCompletedSlug).toBe('test-slug')
  })

  it('SET_LAST_COMPLETED_SLUG can set to null', () => {
    const stateWithSlug = { ...initialState, lastCompletedSlug: 'test-slug' }
    const result = dataReducer(stateWithSlug, {
      type: 'SET_LAST_COMPLETED_SLUG',
      slug: null
    })
    expect(result.lastCompletedSlug).toBeNull()
  })

  it('INCREMENT_PROGRESS_VERSION increments version', () => {
    expect(initialState.progressVersion).toBe(0)
    const result = dataReducer(initialState, {
      type: 'INCREMENT_PROGRESS_VERSION'
    })
    expect(result.progressVersion).toBe(1)
  })

  it('INCREMENT_HISTORY_VERSION increments version', () => {
    expect(initialState.historyVersion).toBe(0)
    const result = dataReducer(initialState, {
      type: 'INCREMENT_HISTORY_VERSION'
    })
    expect(result.historyVersion).toBe(1)
  })

  it('INCREMENT_COMPLETED_VERSION increments version', () => {
    expect(initialState.completedVersion).toBe(0)
    const result = dataReducer(initialState, {
      type: 'INCREMENT_COMPLETED_VERSION'
    })
    expect(result.completedVersion).toBe(1)
  })

  it('REFRESH_ALL increments all versions', () => {
    const state = {
      ...initialState,
      progressVersion: 5,
      historyVersion: 3,
      completedVersion: 2
    }
    const result = dataReducer(state, { type: 'REFRESH_ALL' })
    expect(result.progressVersion).toBe(6)
    expect(result.historyVersion).toBe(4)
    expect(result.completedVersion).toBe(3)
  })

  it('returns unchanged state for unknown action', () => {
    const result = dataReducer(initialState, {
      type: 'INCREMENT_PROGRESS_VERSION'
    })
    expect(result.progressVersion).toBe(initialState.progressVersion + 1)
  })

  it('preserves other state properties on partial updates', () => {
    const stateWithData = {
      ...initialState,
      lastCompletedSlug: 'test',
      progressVersion: 5
    }

    const result = dataReducer(stateWithData, {
      type: 'INCREMENT_HISTORY_VERSION'
    })

    expect(result.lastCompletedSlug).toBe('test')
    expect(result.progressVersion).toBe(5)
    expect(result.historyVersion).toBe(1)
  })
})

describe('initialState', () => {
  it('has correct default values', () => {
    expect(initialState.exercises).toEqual([])
    expect(initialState.exercisesLoading).toBe(true)
    expect(initialState.programs).toEqual([])
    expect(initialState.programsLoading).toBe(true)
    expect(initialState.lastCompletedSlug).toBeNull()
    expect(initialState.progressVersion).toBe(0)
    expect(initialState.historyVersion).toBe(0)
    expect(initialState.completedVersion).toBe(0)
  })
})
