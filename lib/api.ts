/**
 * API SDK - Firebase-authenticated API client
 *
 * Provides methods to fetch exercises and other data from the backend API
 * using Firebase authentication tokens.
 */

import { auth } from '@/lib/firebase'
import type { APIWorkout, APIWorkoutCreateInput } from '@/lib/mappers/workout'
import type { Exercise } from '@/types'
import type { PrefillData } from '@/types/workout'

// Use global fetch — expo/fetch is for streaming (SSE) and has issues on iOS in Expo Go

// Configuration from environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || ''
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10)
const API_ENABLED = process.env.EXPO_PUBLIC_API_ENABLED === 'true'

/**
 * Paginated response shape from backend API
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

/**
 * API Error class for consistent error handling
 */
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Get Firebase auth token for API requests
 *
 * Uses Firebase's built-in token caching. The token is only refreshed
 * when it expires (typically after 1 hour). This is more efficient than
 * forcing a refresh on every request.
 *
 * @param forceRefresh - Force token refresh (default: false)
 *                       Set to true only if you need a guaranteed fresh token
 */
async function getAuthToken(forceRefresh: boolean = false): Promise<string> {
  const user = auth.currentUser
  if (!user) {
    throw new APIError('NO_AUTH', 'User not authenticated')
  }

  try {
    const token = await user.getIdToken(forceRefresh)
    return token
  } catch (error) {
    throw new APIError(
      'TOKEN_ERROR',
      'Failed to get authentication token',
      undefined,
      error
    )
  }
}

/**
 * Make an authenticated API request
 */
async function request<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: unknown
    headers?: Record<string, string>
  } = {}
): Promise<T> {
  if (!API_ENABLED || !API_BASE_URL) {
    throw new APIError(
      'API_DISABLED',
      'API integration is disabled or not configured'
    )
  }

  const url = `${API_BASE_URL}${endpoint}`
  const method = options.method || 'GET'

  try {
    // Get auth token
    const token = await getAuthToken()

    // Prepare headers. Only declare a JSON content-type when we actually send
    // a body — a bodyless request (e.g. DELETE) with `Content-Type:
    // application/json` is rejected by the server's body parser with
    // "body cannot be empty when content-type is application/json".
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    // Prepare request options with timeout via AbortController
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    const fetchOptions: Record<string, any> = {
      method,
      headers,
      signal: controller.signal
    }

    // Add body if provided (avoid null)
    if (options.body !== undefined) {
      fetchOptions.body = JSON.stringify(options.body)
    }

    // Make request
    let response: Response
    try {
      response = await fetch(url, fetchOptions as any)
    } finally {
      clearTimeout(timeoutId)
    }

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new APIError(
        'HTTP_ERROR',
        errorData.message || `HTTP ${response.status}`,
        response.status
      )
    }

    // Parse and return response. DELETE and other endpoints may reply with
    // 204 No Content (or an otherwise empty body); calling .json() on that
    // throws a SyntaxError, so treat an empty body as undefined.
    if (response.status === 204) {
      return undefined as T
    }
    const text = await response.text()
    if (text.length === 0) {
      return undefined as T
    }
    return JSON.parse(text) as T
  } catch (error) {
    // Re-throw APIError as-is
    if (error instanceof APIError) {
      throw error
    }

    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new APIError('TIMEOUT', 'Request timeout', undefined, error)
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new APIError(
        'NETWORK_ERROR',
        'Network request failed',
        undefined,
        error
      )
    }

    // Handle unknown errors
    throw new APIError(
      'UNKNOWN_ERROR',
      error instanceof Error ? error.message : 'Unknown error occurred',
      undefined,
      error
    )
  }
}

/**
 * Fetch a page of exercises from the API
 */
export async function fetchExercises(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Exercise>> {
  return request<PaginatedResponse<Exercise>>(
    `/api/v1/exercises?page=${page}&limit=${limit}`
  )
}

/**
 * Fetch a single exercise by ID
 */
export async function fetchExercise(id: string): Promise<Exercise> {
  return request<Exercise>(`/api/v1/exercises/${id}`)
}

/**
 * Fetch last-logged reps/weight per exercise for pre-filling workout sets.
 * Returns empty array on any error so callers fall back to program targets.
 */
export async function fetchPrefillData(
  exerciseIds: string[]
): Promise<PrefillData> {
  if (exerciseIds.length === 0) return []
  const ids = exerciseIds.map(encodeURIComponent).join(',')
  try {
    return await request<PrefillData>(
      `/api/v1/exercises/prefill?exerciseIds=${ids}`
    )
  } catch {
    return []
  }
}

/**
 * Create a new exercise (admin only)
 */
export async function createExercise(
  exercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Exercise> {
  return request<Exercise>('/api/v1/exercises', {
    method: 'POST',
    body: exercise
  })
}

/**
 * Update an exercise (admin only)
 */
export async function updateExercise(
  id: string,
  updates: Partial<Exercise>
): Promise<Exercise> {
  return request<Exercise>(`/api/v1/exercises/${id}`, {
    method: 'PUT',
    body: updates
  })
}

/**
 * Delete an exercise (admin only)
 */
export async function deleteExercise(id: string): Promise<void> {
  await request<void>(`/api/v1/exercises/${id}`, {
    method: 'DELETE'
  })
}

// ─── Workout API Functions ────────────────────────────────────────────────────

/**
 * Fetch all workouts from the API.
 *
 * Requests `?expand=blocks.exercise` so each block carries its full exercise
 * object (including name). This lets the UI display exercise names without
 * depending on the separately-paginated exercise catalog being fully loaded.
 */
export async function fetchWorkouts(): Promise<APIWorkout[]> {
  return request<APIWorkout[]>('/api/v1/workouts?expand=blocks.exercise')
}

/**
 * Fetch a single workout by ID, with exercises expanded (see fetchWorkouts).
 */
export async function fetchWorkout(id: string): Promise<APIWorkout> {
  return request<APIWorkout>(
    `/api/v1/workouts/${id}?expand=blocks.exercise`
  )
}

/**
 * Create a new workout
 */
export async function createWorkout(
  workout: APIWorkoutCreateInput
): Promise<APIWorkout> {
  return request<APIWorkout>('/api/v1/workouts', {
    method: 'POST',
    body: workout
  })
}

/**
 * Update a workout
 */
export async function updateWorkout(
  id: string,
  workout: APIWorkoutCreateInput
): Promise<APIWorkout> {
  return request<APIWorkout>(`/api/v1/workouts/${id}`, {
    method: 'PUT',
    body: workout
  })
}

/**
 * Delete a workout
 */
export async function deleteWorkout(id: string): Promise<void> {
  await request<void>(`/api/v1/workouts/${id}`, {
    method: 'DELETE'
  })
}

// ─── Stats API Types ──────────────────────────────────────────────────────────

/** Input for recording a completed workout */
export interface WorkoutLogInput {
  workoutId: string
  completedAt: string // ISO datetime
  timeSpentSeconds: number // minimum 1
  exercises: WorkoutLogExerciseInput[]
}

export interface WorkoutLogExerciseInput {
  exerciseId: string
  sets: WorkoutLogSetInput[] // minItems 1
  lastCompletedAt: string // ISO datetime
}

export interface WorkoutLogSetInput {
  reps: number
  weight?: number // minimum 0
  isBodyweight: boolean
  timestamp: string // ISO datetime
}

/** Response from recording a workout */
export interface WorkoutLogResponse {
  workoutLog: {
    id: string
    userId: string
    workoutId: string
    completedAt: string
    timeSpentSeconds: number
    exercises: WorkoutLogExerciseResult[]
  }
  newPRs: NewPREntry[]
}

export interface WorkoutLogExerciseResult {
  exerciseId: string
  repsCompleted: number
  setsCompleted: number
  sets: WorkoutLogSetInput[]
  totalVolume: number
  lastCompletedAt: string
}

export interface NewPREntry {
  exerciseId: string
  type: 'max_weight' | 'max_reps' | 'max_volume' | 'estimated_1rm'
  value: number
  previousValue?: number
}

/** Personal record from API */
export interface APIPR {
  id: string
  userId: string
  exerciseId: string
  type: 'max_weight' | 'max_reps' | 'max_volume' | 'estimated_1rm'
  value: number
  achievedAt: string // ISO datetime
  workoutId?: string
  details?: { weight?: number; reps?: number }
  isCurrent: boolean
}

/** Aggregated progress from API */
export interface APIProgress {
  totalWorkoutsCompleted: number
  totalTimeSpentSeconds: number
  totalRepsCompleted: number
  activeWorkouts: number
  currentStreak: number
  recentActivity: { date: string; workoutId: string }[]
  exercisesWithData: string[]
}

/** Weekly stats from API */
export interface APIWeeklyStats {
  weekStart: string
  weekEnd: string
  workoutsCompleted: number
  workoutGoal: number
  totalTimeSeconds: number
  totalVolume: number
  totalReps: number
  exercisesPerformed: string[]
  currentStreak: number
}

/** Consistency heatmap entry from API */
export interface ConsistencyEntry {
  date: string
  workoutCount: number
}

/** Exercise progression data point from API */
export interface ProgressionPoint {
  date: string
  reps: number
  maxWeight?: number
  volume?: number
}

// ─── Stats API Functions ──────────────────────────────────────────────────────

/**
 * Record a completed workout
 */
export async function recordWorkout(
  input: WorkoutLogInput
): Promise<WorkoutLogResponse> {
  return request<WorkoutLogResponse>('/api/v1/stats/workouts', {
    method: 'POST',
    body: input
  })
}

/**
 * Fetch personal records
 */
export async function fetchPRs(limit?: number): Promise<APIPR[]> {
  const params = limit !== undefined ? `?limit=${limit}` : ''
  return request<APIPR[]>(`/api/v1/stats/prs${params}`)
}

/**
 * Fetch personal records for a specific exercise
 */
export async function fetchExercisePRs(
  exerciseId: string,
  current?: boolean
): Promise<APIPR[]> {
  const params = current !== undefined ? `?current=${current}` : ''
  return request<APIPR[]>(
    `/api/v1/stats/prs/${encodeURIComponent(exerciseId)}${params}`
  )
}

/**
 * Fetch aggregated progress overview
 */
export async function fetchProgress(): Promise<APIProgress> {
  return request<APIProgress>('/api/v1/stats/progress')
}

/**
 * Fetch weekly stats
 */
export async function fetchWeeklyStats(
  weekStart?: string
): Promise<APIWeeklyStats> {
  const params = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : ''
  return request<APIWeeklyStats>(`/api/v1/stats/weekly${params}`)
}

/**
 * Fetch consistency heatmap data
 */
export async function fetchConsistency(
  weeks?: number
): Promise<ConsistencyEntry[]> {
  const params = weeks !== undefined ? `?weeks=${weeks}` : ''
  return request<ConsistencyEntry[]>(`/api/v1/stats/consistency${params}`)
}

/**
 * Fetch exercise progression data
 */
export async function fetchExerciseProgression(
  exerciseId: string,
  days?: number
): Promise<ProgressionPoint[]> {
  const params = days !== undefined ? `?days=${days}` : ''
  return request<ProgressionPoint[]>(
    `/api/v1/stats/exercises/${encodeURIComponent(exerciseId)}/progression${params}`
  )
}

/**
 * Check if API is available and configured
 */
export function isAPIAvailable(): boolean {
  return API_ENABLED && Boolean(API_BASE_URL)
}

/**
 * Whether an error from a data hook is a genuine load failure worth surfacing
 * as an error state (with retry). The API simply being disabled/unconfigured
 * is not a failure — it should read as "no data yet" (an empty state).
 */
export function isLoadFailure(error: unknown): boolean {
  if (!error) return false
  if (error instanceof APIError) {
    return error.code !== 'API_DISABLED'
  }
  return true
}

/**
 * Get API configuration status for debugging
 */
export function getAPIStatus() {
  return {
    enabled: API_ENABLED,
    baseUrl: API_BASE_URL || 'not configured',
    timeout: API_TIMEOUT,
    isAvailable: isAPIAvailable()
  }
}
