# POST Exercise Integration Guide

## Overview

The app now supports creating exercises via the API. When a user creates a new exercise, it's sent to your backend API (`POST /api/v1/exercises`) and stored there, with a fallback to local storage if the API fails.

## How It Works

### Flow Diagram

```
User creates exercise
  ↓
Validate exercise data
  ↓
Check if user is authenticated & API available
  ↓
  ├─ YES → POST to /api/v1/exercises
  │         ↓
  │         Success → Update local state
  │         ↓
  │         Failure → Fall back to local storage
  │
  └─ NO → Save to local storage only
```

### Implementation Details

**File: `context/DataContext.tsx`**

The `upsertExercise` action now:

1. Validates exercise data
2. Checks user authentication and API availability
3. Attempts to create via API if available
4. Falls back to local storage if API fails
5. Updates the exercises list in state
6. Returns the created exercise

**Code:**

```typescript
const upsertExercise = useCallback(
  async (input: Pick<Exercise, 'id' | 'name' | 'category' | 'icon'>) => {
    // Validation...

    const currentUser = auth.currentUser
    if (currentUser && isAPIAvailable()) {
      try {
        saved = await apiCreateExercise({
          name: input.name,
          category: input.category,
          icon: input.icon,
          source: 'user'
        })
        console.debug('Exercise created via API:', saved.id)
      } catch (error) {
        console.warn('Failed to create exercise via API, falling back to local:', error)
        saved = await storage.upsertExercise({...})
      }
    } else {
      saved = await storage.upsertExercise({...})
    }

    // Update state...
    return saved
  },
  [state.exercises]
)
```

## API Endpoint

### POST /api/v1/exercises

**Request:**

```bash
curl --request POST \
  --url http://localhost:3000/api/v1/exercises \
  --header 'authorization: Bearer <firebase-token>' \
  --header 'content-type: application/json' \
  --data '{
    "name": "Bench Press",
    "description": "Upper body push exercise",
    "instructions": "Lie on bench, press weight up",
    "media": "https://example.com/image.jpg",
    "category": "strength",
    "icon": "barbell"
  }'
```

**Request Body:**

```typescript
{
  name: string              // Required: Exercise name
  category?: string         // Optional: Exercise category
  icon?: string            // Optional: Ionicons glyph name
  description?: string     // Optional: Exercise description
  instructions?: string    // Optional: How to perform
  media?: string          // Optional: Image/video URL
  source?: 'user' | 'pt'  // Optional: Source (defaults to 'user')
}
```

**Response:**

```typescript
{
  id: string              // Generated ID
  name: string
  category?: string
  icon?: string
  description?: string
  instructions?: string
  media?: string
  source: 'user' | 'pt'
  createdBy?: string      // User ID
  createdAt: string       // ISO timestamp
  updatedAt: string       // ISO timestamp
}
```

**Status Codes:**

- `201` - Exercise created successfully
- `400` - Invalid request data
- `401` - Unauthorized (invalid token)
- `409` - Exercise name already exists
- `500` - Server error

## Usage in Components

### Basic Usage

```typescript
import { useDataContext } from '@/context/DataContext'

export function CreateExerciseForm() {
  const { actions } = useDataContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (formData: ExerciseFormData) => {
    try {
      setLoading(true)
      setError(null)

      const exercise = await actions.upsertExercise({
        name: formData.name,
        category: formData.category,
        icon: formData.icon
      })

      console.log('Exercise created:', exercise)
      // Navigate back or show success message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exercise')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <ExerciseForm
        onSubmit={handleCreate}
        loading={loading}
      />
    </View>
  )
}
```

### With Full Exercise Data

```typescript
const exercise = await actions.upsertExercise({
  name: 'Bench Press',
  category: 'strength',
  icon: 'barbell',
  description: 'Upper body push exercise',
  instructions: 'Lie on bench, press weight up',
  media: 'https://example.com/bench-press.jpg'
})
```

### Error Handling

```typescript
try {
  const exercise = await actions.upsertExercise({
    name: 'New Exercise',
    category: 'strength',
    icon: 'dumbbell'
  })
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('already exists')) {
      // Handle duplicate name
    } else if (error.message.includes('Validation failed')) {
      // Handle validation error
    } else {
      // Handle other errors
    }
  }
}
```

## Testing

### Test 1: Create Exercise (Authenticated)

1. Log in to the app
2. Navigate to create exercise screen
3. Fill in exercise details
4. Submit form
5. Check console: Should see "Exercise created via API: <id>"
6. Exercise should appear in the list

### Test 2: Create Exercise (Not Authenticated)

1. Don't log in (or log out)
2. Navigate to create exercise screen
3. Fill in exercise details
4. Submit form
5. Exercise should be saved to local storage only
6. No API errors should appear

### Test 3: API Failure Fallback

1. Log in
2. Stop backend server
3. Create exercise
4. Check console: Should see "Failed to create exercise via API, falling back to local"
5. Exercise should be saved to local storage
6. App should continue working

### Test 4: Validation

1. Try to create exercise with empty name
2. Should see validation error
3. Exercise should not be created

### Test 5: Duplicate Name

1. Create exercise with name "Bench Press"
2. Try to create another with same name
3. Should see "already exists" error
4. Second exercise should not be created

## Console Logs

### Success

```
Exercise created via API: exercise-123
```

### Fallback

```
Failed to create exercise via API, falling back to local: APIError: HTTP 500
```

### Validation Error

```
Validation failed: Exercise name is required
```

## Backend Requirements

Your backend should:

1. **Validate Firebase token** in Authorization header
2. **Validate request body** (name required, etc.)
3. **Check for duplicate names** (optional but recommended)
4. **Generate unique ID** for exercise
5. **Set timestamps** (createdAt, updatedAt)
6. **Store user ID** (createdBy)
7. **Return created exercise** with all fields
8. **Handle errors gracefully** with appropriate status codes

### Example Fastify Handler

```typescript
fastify.post<{ Body: CreateExerciseRequest }>(
  '/api/v1/exercises',
  async (request, reply) => {
    // Verify Firebase token
    const user = await verifyFirebaseToken(request.headers.authorization)
    if (!user) {
      return reply.code(401).send({ message: 'Unauthorized' })
    }

    // Validate request body
    if (!request.body.name) {
      return reply.code(400).send({ message: 'Name is required' })
    }

    // Check for duplicates
    const existing = await db.exercises.findOne({ name: request.body.name })
    if (existing) {
      return reply.code(409).send({ message: 'Exercise name already exists' })
    }

    // Create exercise
    const exercise = {
      id: generateId(),
      name: request.body.name,
      category: request.body.category,
      icon: request.body.icon,
      description: request.body.description,
      instructions: request.body.instructions,
      media: request.body.media,
      source: request.body.source || 'user',
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Save to database
    await db.exercises.insertOne(exercise)

    return reply.code(201).send(exercise)
  }
)
```

## Files Modified

- `context/DataContext.tsx` - Added API integration to upsertExercise
- `lib/api.ts` - Removed debug token logging

## Next Steps

1. Test creating exercises in your app
2. Verify exercises appear in the list
3. Check backend logs for any errors
4. Test with API disabled
5. Test with network failures
6. Monitor console for any issues

## Troubleshooting

### "Exercise created via API" not in console

- Check user is logged in
- Check API is enabled in `.env`
- Check backend is running
- Check network tab in DevTools

### "Failed to create exercise via API"

- Check backend logs for errors
- Verify request body format
- Check Firebase token is valid
- Check CORS is configured correctly

### Exercise not appearing in list

- Check console for errors
- Verify exercise was created (check backend database)
- Try refreshing the app
- Check local storage has the exercise

### Validation errors

- Check exercise name is not empty
- Check category is valid
- Check icon is valid Ionicons name
- Check no duplicate names exist

## Related Files

- `lib/api.ts` - API client with createExercise function
- `context/DataContext.tsx` - upsertExercise action
- `lib/validation.ts` - Exercise validation
- `types/exercise.ts` - Exercise type definitions
