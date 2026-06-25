/**
 * Data Context - Global State Management
 *
 * Provides reactive access to app data with automatic updates
 * when data changes anywhere in the app.
 */

import {
  APIError,
  createExercise as apiCreateExercise,
  createWorkout as apiCreateWorkout,
  deleteExercise as apiDeleteExercise,
  deleteWorkout as apiDeleteWorkout,
  updateExercise as apiUpdateExercise,
  updateWorkout as apiUpdateWorkout,
  fetchExercise,
  fetchExercises,
  fetchWorkouts,
  isAPIAvailable,
  recordWorkout
} from '@/lib/api'
import { canSafelyDelete } from '@/lib/dependencyChecker'
import { auth } from '@/lib/firebase'
import { programToWorkoutInput, workoutToProgram } from '@/lib/mappers/workout'
import {
  clearQueue,
  dequeue,
  enqueue,
  loadQueue,
  pendingEntityIds,
  remapEntityId,
  updateEntry
} from '@/lib/syncQueue'
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
  PendingMutation,
  PersonalRecord,
  Program,
  SyncState
} from '@/types'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import type { AccumulatedSet } from '@/types/session'
import { onAuthStateChanged, type User } from 'firebase/auth'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  /**
   * Supplemental exerciseId → name map for exercises referenced by programs,
   * PRs, or progress data that are not in the currently-loaded catalog page.
   * Populated on demand via ensureExerciseNames so the UI never has to fall
   * back to showing a raw exercise id.
   */
  exerciseNameCache: Record<string, string>
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
  | { type: 'MERGE_EXERCISE_NAMES'; names: Record<string, string> }
  | { type: 'SET_EXERCISES_LOADING_MORE'; loading: boolean }
  | { type: 'SET_PROGRAMS'; programs: Program[] }
  | { type: 'SET_PROGRAMS_LOADING'; loading: boolean }
  | { type: 'SET_LAST_COMPLETED_SLUG'; slug: string | null }
  | { type: 'SET_LAST_NEW_PRS'; prs: PersonalRecord[] }
  | { type: 'INCREMENT_PROGRESS_VERSION' }
  | { type: 'INCREMENT_HISTORY_VERSION' }
  | { type: 'INCREMENT_COMPLETED_VERSION' }
  | { type: 'REFRESH_ALL' }
  // Offline / sync
  | { type: 'SET_ONLINE'; isOnline: boolean }
  | { type: 'SET_SYNC_STATE'; syncState: SyncState }
  | { type: 'SET_LAST_SYNC_AT'; at: number | null }
  | { type: 'SET_PENDING_MUTATIONS'; pending: PendingMutation[] }
  // Optimistic local list edits (offline writes)
  | { type: 'UPSERT_EXERCISE_LOCAL'; exercise: Exercise }
  | { type: 'REMOVE_EXERCISE_LOCAL'; id: string }
  | { type: 'UPSERT_PROGRAM_LOCAL'; program: Program }
  | { type: 'REMOVE_PROGRAM_LOCAL'; id: string }

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

    // Resolve names for exercise ids not in the loaded catalog (fetch + cache)
    ensureExerciseNames: (ids: string[]) => void

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

/** Build a temporary id for an entity created while offline. */
function tempId(prefix: string): string {
  return `pending_${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
}

function isNetworkError(error: unknown): boolean {
  return (
    error instanceof APIError &&
    (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT')
  )
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
  exerciseNameCache: {},
  programs: [],
  programsLoading: true,
  lastCompletedSlug: null,
  lastNewPRs: [],
  progressVersion: 0,
  historyVersion: 0,
  completedVersion: 0,
  // Offline / sync
  isOnline: true,
  syncState: 'idle',
  lastSyncAt: null,
  pendingMutations: []
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
        },
        exerciseNameCache: {}
      }
    case 'MERGE_EXERCISE_NAMES':
      return {
        ...state,
        exerciseNameCache: { ...state.exerciseNameCache, ...action.names }
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
    case 'SET_ONLINE':
      return { ...state, isOnline: action.isOnline }
    case 'SET_SYNC_STATE':
      return { ...state, syncState: action.syncState }
    case 'SET_LAST_SYNC_AT':
      return { ...state, lastSyncAt: action.at }
    case 'SET_PENDING_MUTATIONS':
      return { ...state, pendingMutations: action.pending }
    case 'UPSERT_EXERCISE_LOCAL': {
      const exists = state.exercises.some(e => e.id === action.exercise.id)
      const exercises = (
        exists
          ? state.exercises.map(e =>
              e.id === action.exercise.id ? action.exercise : e
            )
          : [...state.exercises, action.exercise]
      ).sort((a, b) => a.name.localeCompare(b.name))
      return { ...state, exercises }
    }
    case 'REMOVE_EXERCISE_LOCAL':
      return {
        ...state,
        exercises: state.exercises.filter(e => e.id !== action.id)
      }
    case 'UPSERT_PROGRAM_LOCAL': {
      const exists = state.programs.some(p => p.id === action.program.id)
      const programs = (
        exists
          ? state.programs.map(p =>
              p.id === action.program.id ? action.program : p
            )
          : [...state.programs, action.program]
      ).sort((a, b) => a.name.localeCompare(b.name))
      return { ...state, programs }
    }
    case 'REMOVE_PROGRAM_LOCAL':
      return {
        ...state,
        programs: state.programs.filter(p => p.id !== action.id)
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

  // Refs let ensureExerciseNames stay referentially stable while still reading
  // the latest catalog/cache, and dedupe in-flight/attempted id fetches.
  const exercisesRef = useRef<Exercise[]>(state.exercises)
  exercisesRef.current = state.exercises
  const nameCacheRef = useRef<Record<string, string>>(state.exerciseNameCache)
  nameCacheRef.current = state.exerciseNameCache
  const attemptedNameIdsRef = useRef<Set<string>>(new Set())

  // Load exercises from API on auth state change
  useEffect(() => {
    let mounted = true

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser: User | null) => {
        if (!mounted) return

        if (!currentUser) {
          attemptedNameIdsRef.current.clear()
          // Drop another user's queued offline writes so they can't replay
          // into the next account signed in on this device.
          clearQueue()
          dispatch({ type: 'SET_PENDING_MUTATIONS', pending: [] })
          dispatch({ type: 'SET_SYNC_STATE', syncState: 'idle' })
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

  // ==========================================================================
  // Offline / sync
  // ==========================================================================

  const { isOnline } = useNetworkStatus()
  const isOnlineRef = useRef(isOnline)
  const flushingRef = useRef(false)

  // Replay a single queued write against the API. `entityId` is the resolved
  // target (a temp id remapped to its server id once the create has replayed).
  // Returns the server-assigned id for creates so callers can remap followers.
  const replayEntry = useCallback(
    async (
      entry: PendingMutation,
      entityId: string
    ): Promise<string | undefined> => {
      if (entry.entity === 'exercise') {
        if (entry.op === 'delete') {
          await apiDeleteExercise(entityId)
          return
        }
        const input = entry.payload as Pick<
          Exercise,
          'name' | 'category' | 'icon'
        >
        if (entry.op === 'create') {
          const saved = await apiCreateExercise({
            name: input.name,
            category: input.category,
            icon: input.icon,
            source: 'user'
          })
          return saved.id
        }
        await apiUpdateExercise(entityId, {
          name: input.name,
          category: input.category,
          icon: input.icon
        })
        return
      }

      // program
      if (entry.op === 'delete') {
        await apiDeleteWorkout(entityId)
        return
      }
      const input = entry.payload as Pick<
        Program,
        | 'name'
        | 'description'
        | 'blocks'
        | 'initialWarmup'
        | 'defaultRestBetweenExercises'
      >
      const now = new Date().toISOString()
      const programForMapper: Program = {
        id: entry.op === 'update' ? entityId : '',
        name: input.name,
        description: input.description,
        blocks: input.blocks,
        initialWarmup: input.initialWarmup,
        defaultRestBetweenExercises: input.defaultRestBetweenExercises,
        source: 'user',
        createdAt: now,
        updatedAt: now
      }
      const workoutInput = programToWorkoutInput(programForMapper)
      if (entry.op === 'create') {
        const apiWorkout = await apiCreateWorkout(workoutInput)
        return workoutToProgram(apiWorkout).id
      }
      await apiUpdateWorkout(entityId, workoutInput)
      return
    },
    []
  )

  // Flush the pending-write queue in FIFO order. Stops on a network error
  // (still offline) and drops poison entries after a retry cap.
  const flushQueue = useCallback(async () => {
    if (flushingRef.current || !isOnlineRef.current || !auth.currentUser) return
    const queue = loadQueue()
    if (!queue.length) return

    flushingRef.current = true
    dispatch({ type: 'SET_SYNC_STATE', syncState: 'syncing' })
    // Temp id → server id, so an offline create's later update/delete writes
    // hit the real id rather than the (now non-existent) temp id.
    const idMap = new Map<string, string>()
    try {
      for (const entry of queue) {
        const entityId = idMap.get(entry.entityId) ?? entry.entityId
        try {
          const serverId = await replayEntry(entry, entityId)
          if (entry.op === 'create' && serverId && serverId !== entry.entityId) {
            idMap.set(entry.entityId, serverId)
            // Persist the remap so followers survive a mid-flush interruption.
            remapEntityId(entry.entityId, serverId)
          }
          dispatch({
            type: 'SET_PENDING_MUTATIONS',
            pending: dequeue(entry.id)
          })
        } catch (e) {
          if (isNetworkError(e)) break // still offline — retry on next reconnect
          // Permanent failure: bump retry, drop after the cap so it can't wedge.
          const bumped = updateEntry(entry.id, {
            retryCount: entry.retryCount + 1
          })
          const current = bumped.find(x => x.id === entry.id)
          dispatch({
            type: 'SET_PENDING_MUTATIONS',
            pending:
              !current || current.retryCount >= 5 ? dequeue(entry.id) : bumped
          })
        }
      }
    } finally {
      flushingRef.current = false
    }

    const remaining = loadQueue()
    if (remaining.length) {
      dispatch({ type: 'SET_SYNC_STATE', syncState: 'error' })
    } else {
      dispatch({ type: 'SET_SYNC_STATE', syncState: 'idle' })
      dispatch({ type: 'SET_LAST_SYNC_AT', at: Date.now() })
    }
    // Reconcile optimistic local state (e.g. temp ids → server ids) if anything synced.
    if (remaining.length !== queue.length) {
      refreshAll()
    }
  }, [replayEntry, refreshAll])

  const retrySync = useCallback(() => {
    flushQueue()
  }, [flushQueue])

  // Shared optimistic-write control flow for the CRUD mutations: when known
  // offline, or when the online attempt fails with a network error, apply the
  // optimistic change + enqueue and return the optimistic value; otherwise run
  // the online path. Non-network errors (validation/permission) still throw.
  const withOfflineFallback = useCallback(
    async <T,>(
      queueOffline: () => void,
      online: () => Promise<T>,
      offlineResult: T
    ): Promise<T> => {
      if (!isOnlineRef.current) {
        queueOffline()
        return offlineResult
      }
      try {
        return await online()
      } catch (e) {
        if (isNetworkError(e)) {
          queueOffline()
          return offlineResult
        }
        throw e
      }
    },
    []
  )

  // Hydrate the queue once on mount.
  useEffect(() => {
    const q = loadQueue()
    if (q.length) dispatch({ type: 'SET_PENDING_MUTATIONS', pending: q })
  }, [])

  // Track connectivity; flush whatever is queued when we come back online.
  useEffect(() => {
    isOnlineRef.current = isOnline
    dispatch({ type: 'SET_ONLINE', isOnline })
    if (isOnline) flushQueue()
  }, [isOnline, flushQueue])

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

  const ensureExerciseNames = useCallback((ids: string[]) => {
    if (!ids.length || !auth.currentUser || !isAPIAvailable()) return

    const known = new Set(exercisesRef.current.map(e => e.id))
    const cache = nameCacheRef.current
    const toFetch = ids.filter(
      id =>
        Boolean(id) &&
        !known.has(id) &&
        !(id in cache) &&
        !attemptedNameIdsRef.current.has(id)
    )
    if (!toFetch.length) return

    // Mark as attempted up-front so concurrent renders don't refetch.
    toFetch.forEach(id => attemptedNameIdsRef.current.add(id))
    ;(async () => {
      const entries = await Promise.all(
        toFetch.map(async id => {
          try {
            const ex = await fetchExercise(id)
            return [id, ex.name] as const
          } catch {
            return null
          }
        })
      )
      const names: Record<string, string> = {}
      for (const entry of entries) {
        if (entry) names[entry[0]] = entry[1]
      }
      if (Object.keys(names).length > 0) {
        dispatch({ type: 'MERGE_EXERCISE_NAMES', names })
      }
    })()
  }, [])

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

      // Optimistic copy used for offline writes (and as the offline return value).
      const existing = id ? state.exercises.find(e => e.id === id) : undefined
      const effectiveId = id ?? tempId('ex')
      const optimistic = {
        ...existing,
        id: effectiveId,
        name: input.name,
        category: input.category,
        icon: input.icon,
        source: 'user',
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Exercise

      const queueOffline = () => {
        dispatch({ type: 'UPSERT_EXERCISE_LOCAL', exercise: optimistic })
        dispatch({
          type: 'SET_PENDING_MUTATIONS',
          pending: enqueue({
            entity: 'exercise',
            op: id ? 'update' : 'create',
            entityId: effectiveId,
            payload: {
              name: input.name,
              category: input.category,
              icon: input.icon
            }
          })
        })
      }

      return withOfflineFallback(
        queueOffline,
        async () => {
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
        optimistic
      )
    },
    [state.exercises, withOfflineFallback]
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

      const queueOffline = () => {
        dispatch({ type: 'REMOVE_EXERCISE_LOCAL', id })
        dispatch({
          type: 'SET_PENDING_MUTATIONS',
          pending: enqueue({
            entity: 'exercise',
            op: 'delete',
            entityId: id
          })
        })
      }

      await withOfflineFallback(
        queueOffline,
        async () => {
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
        undefined
      )
    },
    [state.exercises, state.programs, withOfflineFallback]
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

      const currentUser = auth.currentUser
      if (!currentUser || !isAPIAvailable()) {
        // No local storage fallback — API is the sole source of truth for user programs
        throw new Error(
          'Cannot save program: user is not authenticated or API is unavailable.'
        )
      }

      // Optimistic copy used for offline writes (and as the offline return value).
      const existing = id ? state.programs.find(p => p.id === id) : undefined
      const effectiveId = id ?? tempId('prog')
      const optimistic: Program = {
        id: effectiveId,
        name: input.name,
        description: input.description,
        blocks: input.blocks,
        initialWarmup: input.initialWarmup,
        defaultRestBetweenExercises: input.defaultRestBetweenExercises,
        source: 'user',
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const queueOffline = () => {
        dispatch({ type: 'UPSERT_PROGRAM_LOCAL', program: optimistic })
        dispatch({
          type: 'SET_PENDING_MUTATIONS',
          pending: enqueue({
            entity: 'program',
            op: id ? 'update' : 'create',
            entityId: effectiveId,
            payload: {
              name: input.name,
              description: input.description,
              blocks: input.blocks,
              initialWarmup: input.initialWarmup,
              defaultRestBetweenExercises: input.defaultRestBetweenExercises
            }
          })
        })
      }

      return withOfflineFallback(
        queueOffline,
        async () => {
          const programForMapper: Program = {
            ...optimistic,
            id: id ?? ''
          }
          const workoutInput = programToWorkoutInput(programForMapper)

          let saved: Program
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

          return saved
        },
        optimistic
      )
    },
    [state.programs, withOfflineFallback]
  )

  const deleteProgram = useCallback(
    async (id: string) => {
      const existing = state.programs.find(p => p.id === id)
      if (!existing) return
      if (existing.source === 'builtin') {
        throw new Error('Built-in programs cannot be deleted.')
      }

      const currentUser = auth.currentUser
      if (!currentUser || !isAPIAvailable()) {
        // No local storage fallback — API is the sole source of truth for user programs
        throw new Error(
          'Cannot delete program: user is not authenticated or API is unavailable.'
        )
      }

      const queueOffline = () => {
        dispatch({ type: 'REMOVE_PROGRAM_LOCAL', id })
        dispatch({
          type: 'SET_PENDING_MUTATIONS',
          pending: enqueue({
            entity: 'program',
            op: 'delete',
            entityId: id
          })
        })
      }

      await withOfflineFallback(
        queueOffline,
        async () => {
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
        },
        undefined
      )
    },
    [state.programs, withOfflineFallback]
  )

  const contextValue: DataContextValue = {
    state,
    actions: {
      completeSession,
      refreshAll,
      refreshProgress,
      loadMoreExercises,
      ensureExerciseNames,
      upsertExercise,
      deleteExercise,
      upsertProgram,
      deleteProgram,
      retrySync
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

/**
 * Resolve exercise ids → names, regardless of which catalog page is loaded.
 *
 * Builds a map from the loaded catalog plus the on-demand name cache, and
 * triggers background fetches for any still-unknown ids. Components should
 * read `map.get(id)` and only fall back to the raw id as a last resort.
 */
export function useExerciseNames(ids: string[]): Map<string, string> {
  const { state, actions } = useDataContext()
  const { ensureExerciseNames } = actions
  const idsKey = ids.join(',')

  useEffect(() => {
    ensureExerciseNames(ids)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- idsKey captures ids; ensureExerciseNames is stable
  }, [idsKey, ensureExerciseNames])

  return useMemo(() => {
    const map = new Map<string, string>()
    state.exercises.forEach(e => map.set(e.id, e.name))
    for (const [id, name] of Object.entries(state.exerciseNameCache)) {
      if (!map.has(id)) map.set(id, name)
    }
    return map
  }, [state.exercises, state.exerciseNameCache])
}

export function useRefreshVersions() {
  const { state } = useDataContext()
  return {
    progressVersion: state.progressVersion,
    historyVersion: state.historyVersion,
    completedVersion: state.completedVersion
  }
}

/**
 * Offline / sync status for indicators (offline banner, sync chip).
 */
export function useSyncStatus() {
  const { state, actions } = useDataContext()
  return {
    isOnline: state.isOnline,
    syncState: state.syncState,
    lastSyncAt: state.lastSyncAt,
    pendingCount: state.pendingMutations.length,
    retrySync: actions.retrySync
  }
}

/**
 * Set of entity ids with a queued offline write, for per-item "pending" dots.
 */
export function usePendingIds(): Set<string> {
  const { state } = useDataContext()
  return useMemo(
    () => pendingEntityIds(state.pendingMutations),
    [state.pendingMutations]
  )
}

export default DataContext
