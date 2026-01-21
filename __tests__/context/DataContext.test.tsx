import { dataReducer, initialState } from '@/context/DataContext'
import { describe, expect, it } from 'vitest'

describe('DataContext', () => {
  describe('initialState', () => {
    it('has correct initial properties', () => {
      expect(initialState).toHaveProperty('exercises')
      expect(initialState).toHaveProperty('exercisesLoading')
      expect(initialState).toHaveProperty('programs')
      expect(initialState).toHaveProperty('programsLoading')
      expect(initialState).toHaveProperty('lastCompletedSlug')
      expect(initialState).toHaveProperty('progressVersion')
      expect(initialState).toHaveProperty('historyVersion')
      expect(initialState).toHaveProperty('completedVersion')
    })

    it('exercises starts as empty array', () => {
      expect(initialState.exercises).toEqual([])
    })

    it('programs starts as empty array', () => {
      expect(initialState.programs).toEqual([])
    })

    it('lastCompletedSlug is null', () => {
      expect(initialState.lastCompletedSlug).toBeNull()
    })

    it('version counters start at 0', () => {
      expect(initialState.progressVersion).toBe(0)
      expect(initialState.historyVersion).toBe(0)
      expect(initialState.completedVersion).toBe(0)
    })

    it('loading flags start as true', () => {
      expect(initialState.exercisesLoading).toBe(true)
      expect(initialState.programsLoading).toBe(true)
    })
  })

  describe('dataReducer', () => {
    it('SET_EXERCISES updates exercises array', () => {
      const exercises = [
        {
          id: 'ex_1',
          name: 'Push Ups',
          category: 'strength' as const,
          icon: 'barbell',
          source: 'builtin' as const,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ]

      const newState = dataReducer(initialState, {
        type: 'SET_EXERCISES',
        exercises
      })

      expect(newState.exercises).toEqual(exercises)
    })

    it('SET_EXERCISES_LOADING updates loading flag', () => {
      const newState = dataReducer(initialState, {
        type: 'SET_EXERCISES_LOADING',
        loading: false
      })

      expect(newState.exercisesLoading).toBe(false)
    })

    it('SET_PROGRAMS updates programs array', () => {
      const programs = [
        {
          id: 'prg_1',
          name: 'Beginner',
          description: 'For beginners',
          blocks: [{ type: 'warmup' as const, seconds: 300 }],
          source: 'builtin' as const,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ]

      const newState = dataReducer(initialState, {
        type: 'SET_PROGRAMS',
        programs
      })

      expect(newState.programs).toEqual(programs)
    })

    it('SET_PROGRAMS_LOADING updates loading flag', () => {
      const newState = dataReducer(initialState, {
        type: 'SET_PROGRAMS_LOADING',
        loading: false
      })

      expect(newState.programsLoading).toBe(false)
    })

    it('SET_LAST_COMPLETED_SLUG updates slug', () => {
      const newState = dataReducer(initialState, {
        type: 'SET_LAST_COMPLETED_SLUG',
        slug: 'beginner-session-1'
      })

      expect(newState.lastCompletedSlug).toBe('beginner-session-1')
    })

    it('SET_LAST_COMPLETED_SLUG can set slug to null', () => {
      const prevState = {
        ...initialState,
        lastCompletedSlug: 'some-slug'
      }

      const newState = dataReducer(prevState, {
        type: 'SET_LAST_COMPLETED_SLUG',
        slug: null
      })

      expect(newState.lastCompletedSlug).toBeNull()
    })

    it('INCREMENT_PROGRESS_VERSION increments counter', () => {
      const newState = dataReducer(initialState, {
        type: 'INCREMENT_PROGRESS_VERSION'
      })

      expect(newState.progressVersion).toBe(1)
    })

    it('INCREMENT_PROGRESS_VERSION can increment multiple times', () => {
      let state = initialState
      state = dataReducer(state, { type: 'INCREMENT_PROGRESS_VERSION' })
      state = dataReducer(state, { type: 'INCREMENT_PROGRESS_VERSION' })
      state = dataReducer(state, { type: 'INCREMENT_PROGRESS_VERSION' })

      expect(state.progressVersion).toBe(3)
    })

    it('INCREMENT_HISTORY_VERSION increments counter', () => {
      const newState = dataReducer(initialState, {
        type: 'INCREMENT_HISTORY_VERSION'
      })

      expect(newState.historyVersion).toBe(1)
    })

    it('INCREMENT_COMPLETED_VERSION increments counter', () => {
      const newState = dataReducer(initialState, {
        type: 'INCREMENT_COMPLETED_VERSION'
      })

      expect(newState.completedVersion).toBe(1)
    })

    it('multiple state updates preserve previous state', () => {
      let state = initialState

      state = dataReducer(state, {
        type: 'SET_EXERCISES',
        exercises: [
          {
            id: 'ex_1',
            name: 'Push Ups',
            category: 'strength' as const,
            icon: 'barbell',
            source: 'builtin' as const,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z'
          }
        ]
      })

      state = dataReducer(state, {
        type: 'SET_EXERCISES_LOADING',
        loading: false
      })

      expect(state.exercises).toHaveLength(1)
      expect(state.exercisesLoading).toBe(false)
      expect(state.programs).toEqual([])
    })

    it('reducer returns same state for unknown action', () => {
      const newState = dataReducer(initialState, {
        type: 'INCREMENT_PROGRESS_VERSION'
      })

      expect(newState.progressVersion).toBe(initialState.progressVersion + 1)
    })
  })
})
