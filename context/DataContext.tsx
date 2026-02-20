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
  AuditLogEntry,
  DataAction,
  DataState,
  DataType,
  DependencyCheck,
  EnhancedDataActions,
  EnhancedDataState,
  Exercise,
  ExportData,
  Program,
  ProgramBlock,
  SearchFacets,
  SearchQuery,
  UsageStats
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
  programs: [],
  programsLoading: true,
  lastCompletedSlug: null,
  lastNewPRs: [],
  progressVersion: 0,
  historyVersion: 0,
  completedVersion: 0,
  // Enhanced state
  searchCache: new Map(),
  validationErrors: [],
  operationStatus: { type: 'idle' },
  auditLog: []
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

  // Use refs for caches that don't need to trigger re-renders
  const searchCacheRef = useRef<Map<string, any>>(new Map())
  const auditLogRef = useRef<AuditLogEntry[]>([])

  // Load exercises from API on auth state change
  useEffect(() => {
    let mounted = true

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser: User | null) => {
        if (!mounted) return

        if (!currentUser) {
          dispatch({ type: 'SET_EXERCISES', exercises: [] })
          return
        }

        try {
          const apiExercises = await fetchExercises()
          const sorted = apiExercises.sort((a, b) =>
            a.name.localeCompare(b.name)
          )
          if (mounted) dispatch({ type: 'SET_EXERCISES', exercises: sorted })
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

      // Store new PRs from response for UI display
      dispatch({ type: 'SET_LAST_NEW_PRS', prs: response.newPRs })

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
        dispatch({ type: 'SET_EXERCISES', exercises: [] })
        dispatch({ type: 'SET_PROGRAMS', programs: [] })
        dispatch({ type: 'REFRESH_ALL' })
        return
      }

      const apiExercises = await fetchExercises()
      const sortedExercises = apiExercises.sort((a, b) =>
        a.name.localeCompare(b.name)
      )
      dispatch({ type: 'SET_EXERCISES', exercises: sortedExercises })

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

      // Check for name uniqueness
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

      // Re-fetch full exercise list from API to ensure consistency
      const apiExercises = await fetchExercises()
      const sorted = apiExercises.sort((a, b) => a.name.localeCompare(b.name))
      dispatch({ type: 'SET_EXERCISES', exercises: sorted })

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

      // Re-fetch full exercise list from API to ensure consistency
      const apiExercises = await fetchExercises()
      const sorted = apiExercises.sort((a, b) => a.name.localeCompare(b.name))
      dispatch({ type: 'SET_EXERCISES', exercises: sorted })
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

  // TODO: bulkDeleteExercises removed — re-add when API batch endpoints are available

  // TODO: bulkDeletePrograms removed — re-add when API batch endpoints are available

  // TODO: duplicateProgram removed — re-implement via API create when needed

  const searchData = useCallback(
    async (query: SearchQuery) => {
      // Create cache key
      const cacheKey = JSON.stringify(query)

      // Check cache first (using ref to avoid state mutation)
      const cached = searchCacheRef.current.get(cacheKey)
      if (cached) {
        return cached
      }

      let items: any[] = []

      // Determine which data to search
      switch (query.type) {
        case 'exercises':
          items = state.exercises
          break
        case 'programs':
          items = state.programs
          break
        default:
          items = [...state.exercises, ...state.programs]
      }

      // Apply text search
      if (query.query) {
        const searchTerm = query.query.toLowerCase()
        items = items.filter(
          item =>
            item.name?.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm)
        )
      }

      // Apply filters
      if (query.filters) {
        if (query.filters.category && query.filters.category.length > 0) {
          items = items.filter(
            item =>
              item.category && query.filters!.category!.includes(item.category)
          )
        }

        if (query.filters.source && query.filters.source.length > 0) {
          items = items.filter(
            item => item.source && query.filters!.source!.includes(item.source)
          )
        }

        if (query.filters.dateRange) {
          const { start, end } = query.filters.dateRange
          items = items.filter(item => {
            const itemDate = item.createdAt || item.updatedAt
            return itemDate >= start && itemDate <= end
          })
        }
      }

      // Apply sorting
      const sortBy = query.sortBy || 'name'
      const sortOrder = query.sortOrder || 'asc'

      items.sort((a, b) => {
        let aVal: any, bVal: any

        switch (sortBy) {
          case 'name':
            aVal = a.name || ''
            bVal = b.name || ''
            break
          case 'created':
            aVal = a.createdAt || ''
            bVal = b.createdAt || ''
            break
          case 'updated':
            aVal = a.updatedAt || ''
            bVal = b.updatedAt || ''
            break
          case 'usage':
            aVal = a.usageCount || 0
            bVal = b.usageCount || 0
            break
          default:
            aVal = a.name || ''
            bVal = b.name || ''
        }

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return sortOrder === 'asc' ? comparison : -comparison
      })

      // Apply pagination
      const offset = query.offset || 0
      const limit = query.limit || 50
      const totalCount = items.length
      const paginatedItems = items.slice(offset, offset + limit)

      // Generate facets
      const facets: SearchFacets = {
        categories: {},
        sources: {},
        difficulties: {},
        tags: {}
      }

      items.forEach(item => {
        if (item.category) {
          facets.categories[item.category] =
            (facets.categories[item.category] || 0) + 1
        }
        if (item.source) {
          facets.sources[item.source] = (facets.sources[item.source] || 0) + 1
        }
        // Only exercises have difficulty and tags
        if (query.type === 'exercises') {
          if (item.difficulty) {
            facets.difficulties[item.difficulty] =
              (facets.difficulties[item.difficulty] || 0) + 1
          }
          if (item.tags) {
            item.tags.forEach((tag: string) => {
              facets.tags[tag] = (facets.tags[tag] || 0) + 1
            })
          }
        }
      })

      const result = {
        items: paginatedItems,
        totalCount,
        hasMore: offset + limit < totalCount,
        facets
      }

      // Cache the result (using ref to avoid state mutation)
      searchCacheRef.current.set(cacheKey, result)

      return result
    },
    [state.exercises, state.programs]
  )

  const exportData = useCallback(
    async (type: DataType, ids?: string[]): Promise<ExportData> => {
      let data: any[] = []

      switch (type) {
        case 'exercises':
          data = ids
            ? state.exercises.filter((e: Exercise) => ids.includes(e.id))
            : state.exercises.filter((e: Exercise) => e.source === 'user')
          break
        case 'programs':
          data = ids
            ? state.programs.filter((p: Program) => ids.includes(p.id))
            : state.programs.filter((p: Program) => p.source === 'user')
          break
      }

      return {
        type,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data,
        metadata: {
          exportedBy: 'Progressive Workout App',
          itemCount: data.length
        }
      }
    },
    [state.exercises, state.programs]
  )

  const validateDependencies = useCallback(
    async (type: DataType, id: string): Promise<DependencyCheck> => {
      const dependencies: DependencyCheck['dependencies'] = {}
      const warnings: string[] = []
      let canDelete = true

      if (type === 'exercises') {
        const referencingPrograms = state.programs.filter(p =>
          p.blocks.some(
            (b: ProgramBlock) => b.type === 'exercise' && b.exerciseId === id
          )
        )

        if (referencingPrograms.length > 0) {
          dependencies.programs = referencingPrograms
          canDelete = false
          warnings.push(
            `Exercise is referenced by ${referencingPrograms.length} program(s)`
          )
        }
      }

      return {
        canDelete,
        dependencies,
        warnings
      }
    },
    [state.programs]
  )

  const getUsageStats = useCallback(
    async (type: DataType, id: string): Promise<UsageStats> => {
      // This is a placeholder implementation
      // In a real app, you'd query actual usage data from storage
      return {
        entityId: id,
        entityType: type,
        totalUses: 0,
        lastUsed: undefined,
        averageSessionDuration: 0,
        popularityScore: 0,
        trends: []
      }
    },
    []
  )

  const logAuditEntry = useCallback(
    async (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> => {
      const auditEntry: AuditLogEntry = {
        ...entry,
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      }

      // In a real implementation, you'd persist this to storage
      // For now, we'll just add it to the in-memory audit log (using ref to avoid state mutation)
      auditLogRef.current.push(auditEntry)
    },
    []
  )

  const contextValue: DataContextValue = {
    state,
    actions: {
      completeSession,
      refreshAll,
      refreshProgress,
      upsertExercise,
      deleteExercise,
      upsertProgram,
      deleteProgram,
      // Enhanced actions (remaining)
      searchData,
      exportData,
      validateDependencies,
      getUsageStats,
      logAuditEntry
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
