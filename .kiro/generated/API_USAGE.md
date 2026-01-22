# API SDK Usage Guide

The API SDK (`lib/api.ts`) provides Firebase-authenticated API client methods for fetching exercises and other data from your backend.

## Setup

The API SDK is automatically configured using environment variables from `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_API_ENABLED=true
```

Firebase authentication is automatically initialized from:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

## Basic Usage

### Fetch All Exercises

```typescript
import { fetchExercises, APIError } from '@/lib/api'

try {
  const exercises = await fetchExercises()
  console.log('Exercises:', exercises)
} catch (error) {
  if (error instanceof APIError) {
    console.error(`API Error [${error.code}]:`, error.message)
  }
}
```

### Fetch Single Exercise

```typescript
import { fetchExercise } from '@/lib/api'

const exercise = await fetchExercise('exercise-id-123')
```

### Fetch Exercises by Category

```typescript
import { fetchExercisesByCategory } from '@/lib/api'

const pushExercises = await fetchExercisesByCategory('push')
```

### Create Exercise (Admin)

```typescript
import { createExercise } from '@/lib/api'

const newExercise = await createExercise({
  name: 'Bench Press',
  category: 'push',
  icon: 'dumbbell'
})
```

### Update Exercise (Admin)

```typescript
import { updateExercise } from '@/lib/api'

const updated = await updateExercise('exercise-id-123', {
  name: 'Updated Name',
  category: 'pull'
})
```

### Delete Exercise (Admin)

```typescript
import { deleteExercise } from '@/lib/api'

await deleteExercise('exercise-id-123')
```

## Error Handling

The API SDK throws `APIError` exceptions with specific error codes:

```typescript
import { APIError } from '@/lib/api'

try {
  const exercises = await fetchExercises()
} catch (error) {
  if (error instanceof APIError) {
    switch (error.code) {
      case 'NO_AUTH':
        console.error('User not authenticated')
        break
      case 'TOKEN_ERROR':
        console.error('Failed to get auth token')
        break
      case 'HTTP_ERROR':
        console.error(`HTTP ${error.statusCode}: ${error.message}`)
        break
      case 'TIMEOUT':
        console.error('Request timed out')
        break
      case 'NETWORK_ERROR':
        console.error('Network error')
        break
      case 'API_DISABLED':
        console.error('API is disabled or not configured')
        break
      default:
        console.error('Unknown error:', error.message)
    }
  }
}
```

## API Status

Check if the API is available and configured:

```typescript
import { isAPIAvailable, getAPIStatus } from '@/lib/api'

if (isAPIAvailable()) {
  console.log('API is available')
  const status = getAPIStatus()
  console.log('Status:', status)
  // Output: { enabled: true, baseUrl: 'http://127.0.0.1:3000', timeout: 30000, isAvailable: true }
} else {
  console.log('API is not available - using local mode')
}
```

## Authentication

The API SDK automatically:
1. Gets the current Firebase user
2. Retrieves a fresh ID token
3. Includes it in the `Authorization: Bearer <token>` header

No manual token management is required. The token is automatically refreshed on each request.

## Integration with DataContext

The DataContext automatically integrates API fetching. When the app starts:

1. It checks if the API is available and configured
2. If available, it fetches exercises from `/api/v1/exercises`
3. It merges API exercises with user-created exercises from local storage
4. If the API fails, it falls back to local storage only

You don't need to manually call the API - just use the standard hooks:

```typescript
import { useExercises } from '@/hooks/data/useExercises'

export function MyComponent() {
  const { data: exercises, loading } = useExercises()
  
  if (loading) return <LoadingScreen />
  
  return (
    <FlatList
      data={exercises}
      renderItem={({ item }) => <ExerciseItem exercise={item} />}
    />
  )
}
```

### Manual API Usage

If you need to fetch exercises directly from the API (for advanced use cases), use the `useAPIExercises` hook:

```typescript
import { useAPIExercises } from '@/hooks/data/useAPIExercises'

export function MyComponent() {
  const { data, loading, error, isAPIAvailable } = useAPIExercises()
  
  if (!isAPIAvailable) {
    return <Text>API not available</Text>
  }
  
  if (error) {
    return <Text>Error: {error.message}</Text>
  }
  
  if (loading) return <LoadingScreen />
  
  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <ExerciseItem exercise={item} />}
    />
  )
}
```

To integrate API fetching with the DataContext, you can use the API SDK in custom hooks:

```typescript
import { useEffect, useState } from 'react'
import { fetchExercises, APIError } from '@/lib/api'

export function useAPIExercises() {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<APIError | null>(null)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const data = await fetchExercises()
        if (mounted) {
          setExercises(data)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof APIError ? err : new APIError('UNKNOWN', 'Unknown error'))
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  return { exercises, loading, error }
}
```

## Backend API Endpoints

The API SDK expects the following endpoints on your backend:

### GET /api/v1/exercises
Fetch all exercises
- **Auth**: Required (Bearer token)
- **Response**: `Exercise[]`

### GET /api/v1/exercises/:id
Fetch a single exercise
- **Auth**: Required
- **Response**: `Exercise`

### GET /api/v1/exercises?category=:category
Fetch exercises by category
- **Auth**: Required
- **Response**: `Exercise[]`

### POST /api/v1/exercises
Create a new exercise (admin only)
- **Auth**: Required
- **Body**: `Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>`
- **Response**: `Exercise`

### PUT /api/v1/exercises/:id
Update an exercise (admin only)
- **Auth**: Required
- **Body**: `Partial<Exercise>`
- **Response**: `Exercise`

### DELETE /api/v1/exercises/:id
Delete an exercise (admin only)
- **Auth**: Required
- **Response**: `void`

## Configuration

### Disable API Integration

To use local-only mode without API calls, set in `.env`:

```env
EXPO_PUBLIC_API_ENABLED=false
```

### Change API Base URL

```env
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
```

### Adjust Request Timeout

```env
EXPO_PUBLIC_API_TIMEOUT=60000
```

## Notes

- All requests include Firebase authentication tokens
- Tokens are automatically refreshed on each request
- The API SDK requires a logged-in Firebase user
- Network errors are caught and wrapped in `APIError`
- Requests timeout after the configured duration (default: 30s)
