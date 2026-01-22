# PUT Exercise Integration Guide

## Overview

The app now supports updating exercises via the API. When a user edits an exercise, it's sent to your backend API (`PUT /api/v1/exercises/:id`) and updated there, with a fallback to local storage if the API fails.

## How It Works

### Flow Diagram
```
User edits exercise
  ↓
Validate exercise data
  ↓
Check if user is authenticated & API available
  ↓
  ├─ YES → PUT to /api/v1/exercises/:id
  │         ├─ Success → Update local state
  │         └─ Failure → Fall back to local storage
  │
  └─ NO → Save to local storage only
  ↓
Update app state
  ↓
Exercise list refreshes
```

## Implementation Details

**File: `context/DataContext.tsx`**

The `upsertExercise` action now:
1. Checks if exercise has an ID (update) or not (create)
2. If updating and user is authenticated & API available:
   - Calls `apiUpdateExercise(id, updates)`
   - Falls back to local storage if API fails
3. If creating, uses the create flow
4. Updates the exercises list in state
5. Returns the updated exercise

**Code:**
```typescript
const upsertExercise = useCallback(
  async (input: Pick<Exercise, 'id' | 'name' | 'category' | 'icon'>) => {
    const id = input.id
    
    // Validation...
    
    const currentUser = auth.currentUser
    if (currentUser && isAPIAvailable()) {
      try {
        if (id) {
          // Update existing exercise
          saved = await apiUpdateExercise(id, {
            name: input.name,
            category: input.category,
            icon: input.icon
          })
          console.debug('Exercise updated via API:', saved.id)
        } else {
          // Create new exercise
          saved = await apiCreateExercise({...})
        }
      } catch (error) {
        console.warn('Failed to save exercise via API, falling back to local:', error)
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

### PUT /api/v1/exercises/:id

**Request:**
```bash
curl --request PUT \
  --url http://localhost:3000/api/v1/exercises/6971e36b8141ca9bf75db03e \
  --header 'authorization: Bearer <firebase-token>' \
  --header 'content-type: application/json' \
  --data '{
    "name": "Updated Exercise Name",
    "category": "strength",
    "icon": "barbell",
    "description": "Updated description",
    "instructions": "Updated instructions",
    "media": "https://example.com/updated-image.jpg"
  }'
```

**URL Parameters:**
- `id` (required) - Exercise ID to update

**Request Body:**
```typescript
{
  name?: string              // Optional: Update name
  category?: string          // Optional: Update category
  icon?: string             // Optional: Update icon
  description?: string      // Optional: Update description
  instructions?: string     // Optional: Update instructions
  media?: string           // Optional: Update media URL
}
```

**Response:**
```typescript
{
  id: string              // Same ID
  name: string            // Updated name
  category?: string       // Updated category
  icon?: string          // Updated icon
  description?: string   // Updated description
  instructions?: string  // Updated instructions
  media?: string        // Updated media
  source: 'user' | 'pt'
  createdBy?: string
  createdAt: string      // Original creation time
  updatedAt: string      // New update time
}
```

**Status Codes:**
- `200` - Exercise updated successfully
- `400` - Invalid request data
- `401` - Unauthorized (invalid token)
- `404` - Exercise not found
- `409` - Exercise name already exists
- `500` - Server error

## Usage in Components

### Basic Usage

```typescript
import { useDataContext } from '@/context/DataContext'

export function EditExerciseForm({ exerciseId }: { exerciseId: string }) {
  const { actions } = useDataContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdate = async (formData: ExerciseFormData) => {
    try {
      setLoading(true)
      setError(null)
      
      const exercise = await actions.upsertExercise({
        id: exerciseId,  // Include ID to trigger update
        name: formData.name,
        category: formData.category,
        icon: formData.icon
      })
      
      console.log('Exercise updated:', exercise)
      // Navigate back or show success message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update exercise')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <ExerciseForm 
        onSubmit={handleUpdate}
        loading={loading}
      />
    </View>
  )
}
```

### With Full Exercise Data

```typescript
const exercise = await actions.upsertExercise({
  id: 'exercise-123',  // Required for update
  name: 'Updated Bench Press',
  category: 'strength',
  icon: 'barbell',
  description: 'Updated upper body push exercise',
  instructions: 'Updated instructions',
  media: 'https://example.com/updated-image.jpg'
})
```

### Error Handling

```typescript
try {
  const exercise = await actions.upsertExercise({
    id: 'exercise-123',
    name: 'Updated Name',
    category: 'strength',
    icon: 'dumbbell'
  })
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('not found')) {
      // Handle exercise not found
    } else if (error.message.includes('already exists')) {
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

### Test 1: Update Exercise (Authenticated)

1. Log in to the app
2. Navigate to edit exercise screen
3. Modify exercise details
4. Submit form
5. Check console: Should see "Exercise updated via API: <id>"
6. Exercise should update in the list

### Test 2: Update Exercise (Not Authenticated)

1. Don't log in (or log out)
2. Navigate to edit exercise screen
3. Modify exercise details
4. Submit form
5. Exercise should be updated in local storage only
6. No API errors should appear

### Test 3: API Failure Fallback

1. Log in
2. Stop backend server
3. Edit exercise
4. Check console: Should see "Failed to save exercise via API, falling back to local"
5. Exercise should be updated in local storage
6. App should continue working

### Test 4: Validation

1. Try to update exercise with empty name
2. Should see validation error
3. Exercise should not be updated

### Test 5: Duplicate Name

1. Have two exercises: "Bench Press" and "Dumbbell Press"
2. Try to rename "Dumbbell Press" to "Bench Press"
3. Should see "already exists" error
4. Exercise should not be updated

### Test 6: Exercise Not Found

1. Try to update non-existent exercise ID
2. Should see "not found" error
3. App should handle gracefully

## Console Logs

### Success
```
Exercise updated via API: exercise-123
```

### Fallback
```
Failed to save exercise via API, falling back to local: APIError: HTTP 500
```

### Validation Error
```
Validation failed: Exercise name is required
```

## Backend Requirements

Your backend should:

1. **Validate Firebase token** in Authorization header
2. **Find exercise by ID** in database
3. **Check if exercise exists** (return 404 if not)
4. **Validate request body** (optional fields)
5. **Check for duplicate names** (if name is being updated)
6. **Update exercise fields** (only provided fields)
7. **Update updatedAt timestamp**
8. **Return updated exercise** with all fields
9. **Handle errors gracefully** with appropriate status codes

### Example Fastify Handler

```typescript
fastify.put<{ Params: { id: string }; Body: UpdateExerciseRequest }>(
  '/api/v1/exercises/:id',
  async (request, reply) => {
    // Verify Firebase token
    const user = await verifyFirebaseToken(request.headers.authorization)
    if (!user) {
      return reply.code(401).send({ message: 'Unauthorized' })
    }

    // Find exercise
    const exercise = await db.exercises.findOne({ _id: new ObjectId(request.params.id) })
    if (!exercise) {
      return reply.code(404).send({ message: 'Exercise not found' })
    }

    // Check for duplicate name (if name is being updated)
    if (request.body.name && request.body.name !== exercise.name) {
      const existing = await db.exercises.findOne({ name: request.body.name })
      if (existing) {
        return reply.code(409).send({ message: 'Exercise name already exists' })
      }
    }

    // Update exercise
    const updated = {
      ...exercise,
      ...request.body,
      updatedAt: new Date().toISOString()
    }

    await db.exercises.updateOne(
      { _id: new ObjectId(request.params.id) },
      { $set: updated }
    )

    return reply.code(200).send(updated)
  }
)
```

## Differences from POST

| Aspect | POST (Create) | PUT (Update) |
|--------|---------------|-------------|
| Endpoint | `/api/v1/exercises` | `/api/v1/exercises/:id` |
| ID | Generated by server | Provided in URL |
| Request | Full exercise data | Partial updates |
| Response | New exercise | Updated exercise |
| Status | 201 Created | 200 OK |
| Idempotent | No | Yes |

## Files Modified

- `context/DataContext.tsx` - Added API integration to upsertExercise for updates

## Next Steps

1. Test updating exercises in your app
2. Verify exercises update in the list
3. Check backend logs for any errors
4. Test with API disabled
5. Test with network failures
6. Monitor console for any issues

## Troubleshooting

### "Exercise updated via API" not in console

- Check user is logged in
- Check API is enabled in `.env`
- Check backend is running
- Check network tab in DevTools

### "Failed to save exercise via API"

- Check backend logs for errors
- Verify request body format
- Check Firebase token is valid
- Check CORS is configured correctly

### "Exercise not found"

- Verify exercise ID is correct
- Check exercise exists in backend database
- Try refreshing the app

### Exercise not updating in list

- Check console for errors
- Verify exercise was updated (check backend database)
- Try refreshing the app
- Check local storage has the update

### Validation errors

- Check exercise name is not empty
- Check category is valid
- Check icon is valid Ionicons name
- Check no duplicate names exist

## Related Files

- `lib/api.ts` - API client with updateExercise function
- `context/DataContext.tsx` - upsertExercise action
- `lib/validation.ts` - Exercise validation
- `types/exercise.ts` - Exercise type definitions
- `POST_EXERCISE_INTEGRATION.md` - POST integration guide
