/**
 * Data Context - Global State Management
 *
 * Provides reactive access to app data with automatic updates
 * when data changes anywhere in the app.
 */

import {
  createExercise as apiCreateExercise,
  createWorkout as apiCreateWorkout,
  deleteExercise as apiDeleteExercise,
  deleteWorkout as apiDeleteWorkout,
  updateExercise as apiUpdateExercise,
  updateWorkout as apiUpdateWorkout,
  fetchExercises,
  fetchWorkouts,
  isAPIAvailable,
  recordWorkout
} from '@/lib/api'
import { canSafelyDelete } from '@/lib/dependencyChecker'
import { auth } from '@/lib/firebase'
import { programToWorkoutInput, workoutToProgram } from '@/lib/mappers/workout'
import { buildWorkoutLog } from '@/lib/utils/sessionBuilder'
import {
  validateExercise,
  validateModificationPermissions,
  validateUniqueName
} from '@/lib/validation'
import type {
  EnhancedDataActions,
  EnhancedDataState,
  Exercise,
  PersonalRecord,
  Program
} from '@/types'
import type { AccumulatedSet } from '@/types/session'
import { onAuthStateChanged, type User } from 'firebase/auth'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef
} from 'react'

// ============================================================================
// Types
// ============================================================================

interface ExercisePagination {
  currentPage: number
  totalPages: number
  totalItems: number
  hasMore: boolean
}

interface DataState {
  exercises: Exercise[]
  exercisesLoading: boolean
  exercisesLoadingMore: boolean
  exercisePagination: ExercisePagination
  programs: Program[]
  programsLoading: boolean
  lastCompletedSlug: string | null
  lastNewPRs: PersonalRecord[]
  progressVersion: number
  historyVersion: number
  completedVersion: number
}

type DataAction =
  | { type: 'SET_EXERCISES'; exercises: Exercise[] }
  | { type: 'SET_EXERCISES_LOADING'; loading: boolean }
  | {
      type: 'APPEND_EXERCISES'
      exercises: Exercise[]
      pagination: { page: number; totalPages: number; totalItems: number }
    }
  | { type: 'RESET_EXERCISES' }
  | { type: 'SET_EXERCISES_LOADING_MORE'; loading: boolean }
  | { type: 'SET_PROGRAMS'; programs: Program[] }
  | { type: 'SET_PROGRAMS_LOADING'; loading: boolean }
  | { type: 'SET_LAST_COMPLETED_SLUG'; slug: string | null }
  | { type: 'SET_LAST_NEW_PRS'; prs: PersonalRecord[] }
  | { type: 'INCREMENT_PROGRESS_VERSION' }
  | { type: 'INCREMENT_HISTORY_VERSION' }
  | { type: 'INCREMENT_COMPLETED_VERSION' }
  | { type: 'REFRESH_ALL' }

type DataContextValue = {
  state: DataState & EnhancedDataState

  // Actions
  actions: {
    // Session completion flow - call this when a session is completed
    completeSession: (
      slug: string,
      sessionIndex: number,
      summary: string,
      timeSpentSeconds: number,
      accumulatedSets: AccumulatedSet[]
    ) => Promise<void>

    // Refresh data
    refreshAll: () => void
    refreshProgress: () => void

    // Exercise pagination
    loadMoreExercises: () => Promise<void>

    // Exercises CRUD
    upsertExercise: (
      input: Pick<Exercise, 'id' | 'name' | 'category' | 'icon'> & {
        id?: string
      }
    ) => Promise<Exercise>
    deleteExercise: (id: string) => Promise<void>

    // Programs CRUD
    upsertProgram: (
      input: Pick<
        Program,
        | 'id'
        | 'name'
        | 'description'
        | 'blocks'
        | 'initialWarmup'
        | 'defaultRestBetweenExercises'
      > & {
        id?: string
      }
    ) => Promise<Program>
    deleteProgram: (id: string) => Promise<void>
  } & EnhancedDataActions
}

// ============================================================================
// Initial State & Reducer
// ============================================================================

export const initialState: DataState & EnhancedDataState = {
  exercises: [],
  exercisesLoading: true,
  exercisesLoadingMore: false,
  exercisePagination: {
    currentPage: 0,
    totalPages: 0,
    totalItems: 0,
    hasMore: true
  },
  programs: [],
  programsLoading: true,
  lastCompletedSlug: null,
  lastNewPRs: [],
  progressVersion: 0,
  historyVersion: 0,
  completedVersion: 0,
  // Enhanced state (placeholder for EnhancedDataState compatibility)

}

export function dataReducer(
  state: DataState & EnhancedDataState,
  action: DataAction
): DataState & EnhancedDataState {
  switch (action.type) {
    case 'SET_EXERCISES':
      return { ...state, exercises: action.exercises, exercisesLoading: false }
    case 'SET_EXERCISES_LOADING':
      return { ...state, exercisesLoading: action.loading }
    case 'APPEND_EXERCISES': {
      const existingIds = new Set(state.exercises.map(e => e.id))
      const unique = action.exercises.filter(e => !existingIds.has(e.id))
      const merged = [...state.exercises, ...unique].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
      return {
        ...state,
        exercises: merged,
        exercisesLoading: false,
        exercisesLoadingMore: false,
        exercisePagination: {
          currentPage: action.pagination.page,
          totalPages: action.pagination.totalPages,
          totalItems: action.pagination.totalItems,
          hasMore: action.pagination.page < action.pagination.totalPages
        }
      }
    }
    case 'RESET_EXERCISES':
      return {
        ...state,
        exercises: [],
        exercisesLoading: true,
        exercisesLoadingMore: false,
        exercisePagination: {
          currentPage: 0,
          totalPages: 0,
          totalItems: 0,
          hasMore: true
        }
      }
    case 'SET_EXERCISES_LOADING_MORE':
      return { ...state, exercisesLoadingMore: action.loading }
    case 'SET_PROGRAMS':
      return { ...state, programs: action.programs, programsLoading: false }
    case 'SET_PROGRAMS_LOADING':
      return { ...state, programsLoading: action.loading }
    case 'SET_LAST_COMPLETED_SLUG':
      return { ...state, lastCompletedSlug: action.slug }
    case 'SET_LAST_NEW_PRS':
      return { ...state, lastNewPRs: action.prs }
    case 'INCREMENT_PROGRESS_VERSION':
      return { ...state, progressVersion: state.progressVersion + 1 }
    case 'INCREMENT_HISTORY_VERSION':
      return { ...state, historyVersion: state.historyVersion + 1 }
    case 'INCREMENT_COMPLETED_VERSION':
      return { ...state, completedVersion: state.completedVersion + 1 }
    case 'REFRESH_ALL':
      return {
        ...state,
        progressVersion: state.progressVersion + 1,
        historyVersion: state.historyVersion + 1,
        completedVersion: state.completedVersion + 1
      }
    default:
      return state
  }
}

// ============================================================================
// Context
// ============================================================================

const DataContext = createContext<DataContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState)

  // Load exercises from API on auth state change
  useEffect(() => {
    let mounted = true

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser: User | null) => {
        if (!mounted) return

        if (!currentUser) {
          dispatch({ type: 'RESET_EXERCISES' })
          return
        }

        try {
          const response = await fetchExercises(1)
          if (mounted)
            dispatch({
              type: 'APPEND_EXERCISES',
              exercises: response.data,
              pagination: response.pagination
            })
        } catch (error) {
          console.error('Failed to load exercises from API:', error)
          if (mounted)
            dispatch({ type: 'SET_EXERCISES_LOADING', loading: false })
          throw error
        }
      }
    )

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  // Load programs from API on auth state change
  useEffect(() => {
    let mounted = true

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser: User | null) => {
        if (!mounted) return

        if (!currentUser) {
          dispatch({ type: 'SET_PROGRAMS', programs: [] })
          return
        }

        try {
          const workouts = await fetchWorkouts()
          const sorted = workouts
            .map(workoutToProgram)
            .sort((a, b) => a.name.localeCompare(b.name))
          if (mounted) dispatch({ type: 'SET_PROGRAMS', programs: sorted })
        } catch (error) {
          console.error('Failed to load programs from API:', error)
          if (mounted)
            dispatch({ type: 'SET_PROGRAMS_LOADING', loading: false })
          throw error
        }
      }
    )

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  // TODO: lastCompletedSlug will be derived from API data in a future task

  // Actions
  const completeSession = useCallback(
    async (
      slug: string,
      _sessionIndex: number,
      _summary: string,
      timeSpentSeconds: number,
      accumulatedSets: AccumulatedSet[]
    ) => {
      const completedAt = new Date().toISOString()

      // Build WorkoutLogInput from accumulated sets
      const workoutLogInput = buildWorkoutLog(
        slug,
        completedAt,
        Math.max(1, Math.round(timeSpentSeconds)),
        accumulatedSets
      )

      // POST workout data to API — errors propagate to caller
      const response = await recordWorkout(workoutLogInput)

      // Transform NewPREntry to PersonalRecord format
      const personalRecords: PersonalRecord[] = response.newPRs.map(
        (pr, index) => ({
          id: `pr_${Date.now()}_${index}`,
          exerciseId: pr.exerciseId,
          type: pr.type,
          value: pr.value,
          achievedAt: completedAt,
          details: {
            weight: undefined,
            reps: undefined
          }
        })
      )

      // Store new PRs from response for UI display
      dispatch({ type: 'SET_LAST_NEW_PRS', prs: personalRecords })

      // Mark this program as last completed
      dispatch({ type: 'SET_LAST_COMPLETED_SLUG', slug })

      // Increment progressVersion so dependent hooks re-fetch
      dispatch({ type: 'INCREMENT_PROGRESS_VERSION' })
    },
    []
  )

  // recordEvent, saveSessionState, loadSessionState removed — session data is now accumulated in-memory

  const refreshAll = useCallback(() => {
    ;(async () => {
      const currentUser = auth.currentUser

      if (!currentUser) {
        dispatch({ type: 'RESET_EXERCISES' })
        dispatch({ type: 'SET_PROGRAMS', programs: [] })
        dispatch({ type: 'REFRESH_ALL' })
        return
      }

      try {
        const exerciseResponse = await fetchExercises(1)
        dispatch({ type: 'RESET_EXERCISES' })
        dispatch({
          type: 'APPEND_EXERCISES',
          exercises: exerciseResponse.data,
          pagination: exerciseResponse.pagination
        })
      } catch (error) {
        console.error('Failed to refresh exercises:', error)
        dispatch({ type: 'SET_EXERCISES_LOADING', loading: false })
      }

      const workouts = await fetchWorkouts()
      const sortedPrograms = workouts
        .map(workoutToProgram)
        .sort((a, b) => a.name.localeCompare(b.name))
      dispatch({ type: 'SET_PROGRAMS', programs: sortedPrograms })

      dispatch({ type: 'REFRESH_ALL' })
    })()
  }, [])

  const refreshProgress = useCallback(() => {
    dispatch({ type: 'INCREMENT_PROGRESS_VERSION' })
  }, [])

  // refreshHistory and refreshCompleted consolidated into refreshProgress

  const loadMoreExercises = useCallback(async () => {
    if (
      state.exercisesLoadingMore ||
      !state.exercisePagination.hasMore ||
      !auth.currentUser
    )
      return

    dispatch({ type: 'SET_EXERCISES_LOADING_MORE', loading: true })

    try {
      const nextPage = state.exercisePagination.currentPage + 1
      const response = await fetchExercises(nextPage)
      dispatch({
        type: 'APPEND_EXERCISES',
        exercises: response.data,
        pagination: response.pagination
      })
    } catch (error) {
      console.error('Failed to load more exercises:', error)
      dispatch({ type: 'SET_EXERCISES_LOADING_MORE', loading: false })
    }
  }, [state.exercisesLoadingMore, state.exercisePagination])

  const upsertExercise = useCallback(
    async (
      input: Pick<Exercise, 'id' | 'name' | 'category' | 'icon'> & {
        id?: string
      }
    ) => {
      const id = input.id

      // Require authentication — no local storage fallback
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('Cannot save exercise: user is not authenticated.')
      }

      // Check modification permissions for existing exercises
      if (id) {
        const existing = state.exercises.find(e => e.id === id)
        if (existing) {
          const permissionResult = validateModificationPermissions(
            existing.source as 'builtin' | 'user' | 'pt',
            'edit'
          )
          if (!permissionResult.isValid) {
            throw new Error(permissionResult.errors[0].message)
          }
        }
      }

      // Validate exercise data
      const validationResult = validateExercise(input)
      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors
          .map(e => e.message)
          .join('; ')
        throw new Error(`Validation failed: ${errorMessages}`)
      }

      // Client-side uniqueness check (loaded pages only; server is authoritative)
      const nameValidation = validateUniqueName(input.name, id, state.exercises)
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.errors[0].message)
      }

      // Call API create or update — errors propagate directly to the caller
      let saved: Exercise
      if (id) {
        saved = await apiUpdateExercise(id, {
          name: input.name,
          category: input.category,
          icon: input.icon
        })
      } else {
        saved = await apiCreateExercise({
          name: input.name,
          category: input.category,
          icon: input.icon,
          source: 'user'
        })
      }

      // Fetch page 1 first, then replace atomically to avoid flash of empty state
      const exerciseResponse = await fetchExercises(1)
      dispatch({ type: 'RESET_EXERCISES' })
      dispatch({
        type: 'APPEND_EXERCISES',
        exercises: exerciseResponse.data,
        pagination: exerciseResponse.pagination
      })

      return saved
    },
    [state.exercises]
  )

  const deleteExercise = useCallback(
    async (id: string) => {
      const existing = state.exercises.find(e => e.id === id)
      if (!existing) return
      // Check modification permissions
      const permissionResult = validateModificationPermissions(
        existing.source as 'builtin' | 'user' | 'pt',
        'delete'
      )
      if (!permissionResult.isValid) {
        throw new Error(permissionResult.errors[0].message)
      }

      // Check dependencies using the dependency checker
      const dependencyCheck = canSafelyDelete(
        'exercises',
        id,
        state.exercises,
        state.programs
      )
      if (!dependencyCheck.canDelete) {
        const warnings = dependencyCheck.warnings.join('; ')
        throw new Error(`Cannot delete exercise: ${warnings}`)
      }

      // Require authentication
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('Cannot delete exercise: user is not authenticated.')
      }

      // Call API delete — errors propagate directly to the caller
      await apiDeleteExercise(id)

      // Fetch page 1 first, then replace atomically to avoid flash of empty state
      const exerciseResponse = await fetchExercises(1)
      dispatch({ type: 'RESET_EXERCISES' })
      dispatch({
        type: 'APPEND_EXERCISES',
        exercises: exerciseResponse.data,
        pagination: exerciseResponse.pagination
      })
    },
    [state.exercises, state.programs]
  )

  const upsertProgram = useCallback(
    async (
      input: Pick<
        Program,
        | 'id'
        | 'name'
        | 'description'
        | 'blocks'
        | 'initialWarmup'
        | 'defaultRestBetweenExercises'
      > & {
        id?: string
      }
    ) => {
      const id = input.id
      if (id) {
        const existing = state.programs.find(p => p.id === id)
        if (existing?.source === 'builtin') {
          throw new Error('Built-in programs cannot be edited.')
        }
      }

      let saved: Program

      const currentUser = auth.currentUser
      if (currentUser && isAPIAvailable()) {
        // Build a temporary Program object for the mapper
        const programForMapper: Program = {
          id: id ?? '',
          name: input.name,
          description: input.description,
          blocks: input.blocks,
          initialWarmup: input.initialWarmup,
          defaultRestBetweenExercises: input.defaultRestBetweenExercises,
          source: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        const workoutInput = programToWorkoutInput(programForMapper)

        if (id) {
          const apiWorkout = await apiUpdateWorkout(id, workoutInput)
          saved = workoutToProgram(apiWorkout)
          console.debug('Program updated via API:', saved.id)
        } else {
          const apiWorkout = await apiCreateWorkout(workoutInput)
          saved = workoutToProgram(apiWorkout)
          console.debug('Program created via API:', saved.id)
        }

        // Re-fetch all programs from API to ensure consistency
        let apiPrograms: Program[] = []
        try {
          const workouts = await fetchWorkouts()
          apiPrograms = workouts.map(workoutToProgram)
        } catch (error) {
          console.warn('Failed to fetch programs from API:', error)
        }

        const merged = [
          ...state.programs.filter((p: Program) => p.source === 'builtin'),
          ...apiPrograms
        ].sort((a, b) => a.name.localeCompare(b.name))
        dispatch({ type: 'SET_PROGRAMS', programs: merged })
      } else {
        // No local storage fallback — API is the sole source of truth for user programs
        throw new Error(
          'Cannot save program: user is not authenticated or API is unavailable.'
        )
      }

      return saved
    },
    [state.programs]
  )

  const deleteProgram = useCallback(
    async (id: string) => {
      const existing = state.programs.find(p => p.id === id)
      if (!existing) return
      if (existing.source === 'builtin') {
        throw new Error('Built-in programs cannot be deleted.')
      }

      const currentUser = auth.currentUser
      if (currentUser && isAPIAvailable()) {
        // Delete via API — errors propagate to the caller
        await apiDeleteWorkout(id)

        // Re-fetch all programs from API to ensure consistency
        let apiPrograms: Program[] = []
        try {
          const workouts = await fetchWorkouts()
          apiPrograms = workouts.map(workoutToProgram)
        } catch (error) {
          console.warn('Failed to fetch programs from API:', error)
        }

        const merged = [
          ...state.programs.filter(p => p.source === 'builtin'),
          ...apiPrograms
        ].sort((a, b) => a.name.localeCompare(b.name))
        dispatch({ type: 'SET_PROGRAMS', programs: merged })
      } else {
        // No local storage fallback — API is the sole source of truth for user programs
        throw new Error(
          'Cannot delete program: user is not authenticated or API is unavailable.'
        )
      }
    },
    [state.programs]
  )

  const contextValue: DataContextValue = {
    state,
    actions: {
      completeSession,
      refreshAll,
      refreshProgress,
      loadMoreExercises,
      upsertExercise,
      deleteExercise,
      upsertProgram,
      deleteProgram
    }
  }

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useDataContext() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider')
  }
  return context
}

// Convenience hooks
export function useDataActions() {
  const { actions } = useDataContext()
  return actions
}

export function useRefreshVersions() {
  const { state } = useDataContext()
  return {
    progressVersion: state.progressVersion,
    historyVersion: state.historyVersion,
    completedVersion: state.completedVersion
  }
}

export default DataContext
