# API Contracts & Backend Integration

## Overview

This document describes the REST API contracts for Progressive Workout's Firebase backend. The API uses Firebase authentication tokens for all requests and follows RESTful principles.

---

## Authentication

### Firebase ID Token

All API requests require a valid Firebase ID token in the `Authorization` header:

```
Authorization: Bearer {firebase_id_token}
```

**Token Management:**
- Tokens are obtained via `firebase/auth` SDK
- Tokens expire after 1 hour
- Automatic refresh before expiry (see `lib/api.ts`)
- Force refresh available if needed

**Error Responses:**
- `401 Unauthorized` - Invalid or expired token
- `403 Forbidden` - User lacks permissions for resource

---

## API Client Configuration

### Environment Variables

Configure the API client via environment variables:

```env
# Firebase configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# API configuration
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
EXPO_PUBLIC_API_ENABLED=true
EXPO_PUBLIC_API_TIMEOUT=30000  # milliseconds
```

### Client Implementation

**File**: `lib/api.ts`

```typescript
// Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10)
const API_ENABLED = process.env.EXPO_PUBLIC_API_ENABLED === 'true'

// Error handling
export class APIError extends Error {
  code: string
  statusCode?: number
  originalError?: unknown
}

// Generic request handler
async function request<T>(
  endpoint: string,
  options?: { method?, body?, headers? }
): Promise<T>
```

---

## Exercises Endpoints

### List All Exercises

**Request:**
```
GET /api/v1/exercises
```

**Query Parameters:**
- `category` (optional) - Filter by category (strength, cardio, flexibility, skill)
- `source` (optional) - Filter by source (builtin, user, pt)
- `limit` (optional) - Results per page (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": "bench-press-1",
    "name": "Barbell Bench Press",
    "category": "strength",
    "icon": "barbell",
    "source": "builtin",
    "description": "Compound pressing movement",
    "instructions": "Feet on floor, shoulders pinned",
    "createdAt": "2026-03-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  }
]
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid token
- `500 Server Error` - Internal error

---

### Get Single Exercise

**Request:**
```
GET /api/v1/exercises/:id
```

**Response:**
```json
{
  "id": "bench-press-1",
  "name": "Barbell Bench Press",
  "category": "strength",
  "icon": "barbell",
  "source": "builtin",
  "description": "Compound pressing movement",
  "instructions": "Feet on floor, shoulders pinned",
  "media": "https://example.com/bench-press.jpg",
  "createdAt": "2026-03-01T00:00:00Z",
  "updatedAt": "2026-03-01T00:00:00Z"
}
```

**Status Codes:**
- `200 OK` - Exercise found
- `404 Not Found` - Exercise doesn't exist
- `401 Unauthorized` - Invalid token

---

### Create Exercise

**Request:**
```
POST /api/v1/exercises
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Dumbbell Rows",
  "category": "strength",
  "icon": "dumbbell",
  "description": "Unilateral back builder",
  "instructions": "Single arm, neutral grip, full range"
}
```

**Required Fields:**
- `name` - Exercise name (3+ chars, unique per user)
- `category` - One of: strength, cardio, flexibility, skill
- `icon` - Valid Ionicons glyph name

**Optional Fields:**
- `description` - Exercise description
- `instructions` - Form cues and technique notes
- `media` - URL to image or video

**Response:**
```json
{
  "id": "dumbbell-rows-user-123",
  "name": "Dumbbell Rows",
  "category": "strength",
  "icon": "dumbbell",
  "source": "user",
  "description": "Unilateral back builder",
  "instructions": "Single arm, neutral grip, full range",
  "createdAt": "2026-03-06T12:00:00Z",
  "updatedAt": "2026-03-06T12:00:00Z"
}
```

**Status Codes:**
- `201 Created` - Exercise created
- `400 Bad Request` - Invalid data
- `409 Conflict` - Duplicate name
- `401 Unauthorized` - Invalid token

---

### Update Exercise

**Request:**
```
PUT /api/v1/exercises/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Updated description",
  "instructions": "Updated instructions"
}
```

**Restrictions:**
- Cannot update `source` field
- Can only update exercises with `source: 'user'`
- Other sources (builtin, pt) are read-only

**Response:**
```json
{
  "id": "dumbbell-rows-user-123",
  "name": "Dumbbell Rows",
  "category": "strength",
  "icon": "dumbbell",
  "source": "user",
  "description": "Updated description",
  "instructions": "Updated instructions",
  "updatedAt": "2026-03-06T12:30:00Z"
}
```

**Status Codes:**
- `200 OK` - Updated
- `400 Bad Request` - Invalid data
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Exercise doesn't exist

---

### Delete Exercise

**Request:**
```
DELETE /api/v1/exercises/:id
Authorization: Bearer {token}
```

**Restrictions:**
- Can only delete exercises with `source: 'user'`
- Cannot delete if referenced by programs
- Dependency check performed server-side

**Response:**
```
204 No Content
```

**Status Codes:**
- `204 No Content` - Deleted
- `403 Forbidden` - Cannot delete
- `409 Conflict` - Exercise in use by programs
- `404 Not Found` - Exercise doesn't exist

---

## Workouts Endpoints

### List All Workouts

**Request:**
```
GET /api/v1/workouts
```

**Query Parameters:**
- `source` (optional) - Filter by source (builtin, user, pt)
- `expand` (optional) - Expand related data (e.g., `expand=blocks.exercise`)
- `limit` (optional) - Results per page
- `offset` (optional) - Pagination offset

**Response:**
```json
[
  {
    "id": "full-body-a",
    "name": "Full Body A",
    "description": "Compound-focused full body",
    "source": "user",
    "initialWarmup": 300,
    "defaultRestBetweenExercises": 60,
    "blocks": [
      {
        "exerciseId": "bench-press-1",
        "reps": [6, 6, 6, 6],
        "rests": [90, 90, 90],
        "durations": [0],
        "note": "Heavy compound"
      }
    ],
    "createdAt": "2026-03-01T12:00:00Z",
    "updatedAt": "2026-03-01T12:00:00Z"
  }
]
```

**Notes:**
- Workouts are called "Programs" in the frontend but "Workouts" in the API
- API uses array-based representation (reps[], rests[], durations[])
- Frontend mapper converts to scalar representation

---

### Get Single Workout

**Request:**
```
GET /api/v1/workouts/:id?expand=blocks.exercise
```

**Response:**
```json
{
  "id": "full-body-a",
  "name": "Full Body A",
  "description": "Compound-focused full body",
  "source": "user",
  "initialWarmup": 300,
  "defaultRestBetweenExercises": 60,
  "blocks": [
    {
      "exerciseId": "bench-press-1",
      "reps": [6, 6, 6, 6],
      "rests": [90, 90, 90],
      "durations": [0],
      "note": "Heavy compound",
      "exercise": {
        "id": "bench-press-1",
        "name": "Barbell Bench Press",
        "category": "strength",
        "icon": "barbell"
      }
    }
  ],
  "createdAt": "2026-03-01T12:00:00Z",
  "updatedAt": "2026-03-01T12:00:00Z"
}
```

---

### Create Workout

**Request:**
```
POST /api/v1/workouts
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Push Day",
  "description": "Chest, shoulders, triceps",
  "initialWarmup": 300,
  "defaultRestBetweenExercises": 60,
  "blocks": [
    {
      "exerciseId": "bench-press-1",
      "reps": [8, 8, 8],
      "rests": [90, 90],
      "durations": [0]
    },
    {
      "exerciseId": "shoulder-press-1",
      "reps": [10, 10, 10],
      "rests": [60, 60],
      "durations": [0]
    }
  ]
}
```

**Required Fields:**
- `name` - Workout name
- `blocks` - At least one block (array format)
- `initialWarmup` - Warmup duration in seconds
- `defaultRestBetweenExercises` - Default rest in seconds

**Block Format:**
- `exerciseId` - Reference to exercise
- `reps` - Array of target reps per set
- `rests` - Array of rest durations (length = reps.length - 1)
- `durations` - Array for timing blocks (usually [0] for exercises)

**Response:**
```json
{
  "id": "push-day-user-123",
  "name": "Push Day",
  "source": "user",
  "blocks": [ /* ... */ ],
  "createdAt": "2026-03-06T12:00:00Z",
  "updatedAt": "2026-03-06T12:00:00Z"
}
```

**Status Codes:**
- `201 Created` - Workout created
- `400 Bad Request` - Invalid structure
- `409 Conflict` - Invalid exercise references

---

### Update Workout

**Request:**
```
PUT /api/v1/workouts/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Updated description",
  "blocks": [ /* updated blocks */ ]
}
```

**Response:**
```json
{
  "id": "push-day-user-123",
  "name": "Push Day",
  "source": "user",
  "blocks": [ /* ... */ ],
  "updatedAt": "2026-03-06T12:30:00Z"
}
```

**Status Codes:**
- `200 OK` - Updated
- `400 Bad Request` - Invalid data
- `403 Forbidden` - Insufficient permissions

---

### Delete Workout

**Request:**
```
DELETE /api/v1/workouts/:id
Authorization: Bearer {token}
```

**Response:**
```
204 No Content
```

**Status Codes:**
- `204 No Content` - Deleted
- `403 Forbidden` - Cannot delete
- `404 Not Found` - Workout doesn't exist

---

## Statistics Endpoints

### Record Workout Completion

**Request:**
```
POST /api/v1/stats/workouts
Authorization: Bearer {token}
Content-Type: application/json

{
  "workoutId": "full-body-a",
  "completedAt": "2026-03-06T10:30:00Z",
  "timeSpentSeconds": 2400,
  "exercises": [
    {
      "exerciseId": "bench-press-1",
      "sets": [
        {
          "reps": 6,
          "weight": 225,
          "isBodyweight": false,
          "timestamp": "2026-03-06T10:05:00Z"
        },
        {
          "reps": 6,
          "weight": 225,
          "isBodyweight": false,
          "timestamp": "2026-03-06T10:08:00Z"
        }
      ],
      "lastCompletedAt": "2026-03-06T10:30:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "workoutLog": {
    "id": "log-123",
    "userId": "user-123",
    "workoutId": "full-body-a",
    "completedAt": "2026-03-06T10:30:00Z",
    "timeSpentSeconds": 2400,
    "exercises": [
      {
        "exerciseId": "bench-press-1",
        "repsCompleted": 12,
        "setsCompleted": 2,
        "totalVolume": 5400,
        "lastCompletedAt": "2026-03-06T10:30:00Z"
      }
    ]
  },
  "newPRs": [
    {
      "exerciseId": "bench-press-1",
      "type": "max_weight",
      "value": 225,
      "previousValue": 220
    }
  ]
}
```

**Status Codes:**
- `201 Created` - Workout recorded
- `400 Bad Request` - Invalid data
- `404 Not Found` - Workout doesn't exist

---

### Get Personal Records

**Request:**
```
GET /api/v1/stats/prs?limit=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional) - Max number of PRs to return (default: 50)
- `exerciseId` (optional) - Filter by exercise
- `current` (optional) - Only current PRs (true/false)

**Response:**
```json
[
  {
    "id": "pr-123",
    "userId": "user-123",
    "exerciseId": "bench-press-1",
    "type": "max_weight",
    "value": 225,
    "achievedAt": "2026-03-06T10:30:00Z",
    "workoutId": "full-body-a_workout_0",
    "details": {
      "weight": 225,
      "reps": 6
    },
    "isCurrent": true
  }
]
```

---

### Get Exercise-Specific PRs

**Request:**
```
GET /api/v1/stats/prs/:exerciseId?current=true
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "pr-bench-1",
    "exerciseId": "bench-press-1",
    "type": "max_weight",
    "value": 225,
    "achievedAt": "2026-03-06T10:30:00Z",
    "isCurrent": true
  },
  {
    "id": "pr-bench-2",
    "exerciseId": "bench-press-1",
    "type": "max_reps",
    "value": 12,
    "achievedAt": "2026-03-05T15:00:00Z",
    "isCurrent": true
  }
]
```

---

### Get Aggregated Progress

**Request:**
```
GET /api/v1/stats/progress
Authorization: Bearer {token}
```

**Response:**
```json
{
  "totalWorkoutsCompleted": 45,
  "totalTimeSpentSeconds": 108000,
  "totalRepsCompleted": 5400,
  "activeWorkouts": 3,
  "currentStreak": 12,
  "recentActivity": [
    {
      "date": "2026-03-06",
      "workoutId": "full-body-a"
    }
  ],
  "exercisesWithData": [
    "bench-press-1",
    "squat-1",
    "deadlift-1"
  ]
}
```

---

### Get Weekly Statistics

**Request:**
```
GET /api/v1/stats/weekly?weekStart=2026-03-02
Authorization: Bearer {token}
```

**Query Parameters:**
- `weekStart` (optional) - ISO date for week start (Monday)

**Response:**
```json
{
  "weekStart": "2026-03-02",
  "weekEnd": "2026-03-08",
  "workoutsCompleted": 4,
  "workoutGoal": 4,
  "totalTimeSeconds": 9600,
  "totalVolume": 21600,
  "totalReps": 480,
  "exercisesPerformed": ["bench-press-1", "squat-1"],
  "currentStreak": 4
}
```

---

### Get Consistency Data (Heatmap)

**Request:**
```
GET /api/v1/stats/consistency?weeks=12
Authorization: Bearer {token}
```

**Query Parameters:**
- `weeks` (optional) - Number of weeks to return (default: 12)

**Response:**
```json
[
  {
    "date": "2026-02-01",
    "workoutCount": 1
  },
  {
    "date": "2026-02-02",
    "workoutCount": 0
  },
  {
    "date": "2026-02-03",
    "workoutCount": 1
  }
]
```

**Notes:**
- `workoutCount` is 0 or 1 (one workout per day max for heatmap)
- Returns data for the last N weeks

---

### Get Exercise Progression Data

**Request:**
```
GET /api/v1/stats/exercises/:exerciseId/progression?days=90
Authorization: Bearer {token}
```

**Query Parameters:**
- `days` (optional) - Days of history (default: 90)

**Response:**
```json
[
  {
    "date": "2026-01-05",
    "reps": 8,
    "maxWeight": 220,
    "volume": 1760
  },
  {
    "date": "2026-01-12",
    "reps": 8,
    "maxWeight": 225,
    "volume": 1800
  }
]
```

**Notes:**
- One data point per workout session
- Shows progression over time for charts

---

## Error Handling

### Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "statusCode": 400,
    "details": {
      "field": "value",
      "violations": ["issue 1", "issue 2"]
    }
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request |
| `VALIDATION_ERROR` | 400 | Validation failed |
| `UNAUTHORIZED` | 401 | Invalid/missing token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Data conflict (e.g., duplicate) |
| `INTERNAL_ERROR` | 500 | Server error |

### Client Error Handling

**File**: `lib/api.ts`

```typescript
export class APIError extends Error {
  code: string
  statusCode?: number
  originalError?: unknown
}

// Usage in components
try {
  const exercises = await fetchExercises()
} catch (error) {
  if (error instanceof APIError) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Handle auth error
        break
      case 'TIMEOUT':
        // Handle timeout
        break
      case 'NETWORK_ERROR':
        // Fall back to local storage
        break
    }
  }
}
```

---

## Data Mappers

### Workout/Program Conversion

**File**: `lib/mappers/workout.ts`

The API uses array-based representation while the frontend uses scalars:

```typescript
// API format
{
  "blocks": [
    {
      "exerciseId": "bench-press-1",
      "reps": [8, 8, 8],           // Array per set
      "rests": [90, 90],           // Array between sets
      "durations": [0]             // Timing array
    }
  ]
}

// Frontend format
{
  "blocks": [
    {
      "type": "exercise",
      "exerciseId": "bench-press-1",
      "targetReps": [8],           // Scalar or array
      "sets": 3,                   // Derived from reps length
      "restBetweenSets": 90        // Scalar
    }
  ]
}

// Mapper functions
workoutBlockToProgram(apiBlock): ProgramBlock
programBlockToWorkout(block): APIWorkoutBlock
```

---

## Rate Limiting

**Current**: No rate limiting enforced (subject to change)

**Recommendations**:
- Implement exponential backoff on failures
- Cache API responses locally
- Use version counters to avoid unnecessary requests
- Batch operations when possible

---

## Offline Behavior

When API is unavailable:

1. **Failed API call** triggers error with code `NETWORK_ERROR`
2. **DataContext** automatically falls back to local storage
3. **User sees stale data** with visual indicator
4. **Automatic retry** when connection detected
5. **Cache invalidation** after successful sync

---

## Testing API Integration

### Mock API for Testing

Use Firebase Emulator Suite for local testing:

```bash
firebase emulators:start
```

### Test API Client

**File**: `__tests__/lib/api.test.ts`

```typescript
// Test API error handling
it('should handle network errors gracefully', async () => {
  // Mock fetch to fail
  const error = await fetchExercises().catch(e => e)
  expect(error).toBeInstanceOf(APIError)
  expect(error.code).toBe('NETWORK_ERROR')
})

// Test authentication
it('should include auth token in headers', async () => {
  // Verify token is attached to request
})
```

---

## Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/exercises` | GET/POST/PUT/DELETE | Exercise CRUD |
| `/api/v1/workouts` | GET/POST/PUT/DELETE | Workout CRUD |
| `/api/v1/stats/workouts` | POST | Record completion |
| `/api/v1/stats/prs` | GET | Get personal records |
| `/api/v1/stats/progress` | GET | Get aggregated progress |
| `/api/v1/stats/weekly` | GET | Get weekly stats |
| `/api/v1/stats/consistency` | GET | Get heatmap data |
| `/api/v1/stats/exercises/:id/progression` | GET | Get exercise trends |

All endpoints require authentication via Firebase ID token.
