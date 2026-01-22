# PUT Exercise - Quick Reference

## What's New

The app now updates exercises via your backend API with automatic fallback to local storage.

## How to Use

### In Your Component

```typescript
import { useDataContext } from '@/context/DataContext'

export function MyComponent() {
  const { actions } = useDataContext()

  const handleUpdateExercise = async () => {
    try {
      const exercise = await actions.upsertExercise({
        id: 'exercise-123',  // Include ID to trigger update
        name: 'Updated Name',
        category: 'strength',
        icon: 'barbell'
      })
      console.log('Updated:', exercise)
    } catch (error) {
      console.error('Failed:', error)
    }
  }

  return <Button onPress={handleUpdateExercise} title="Update" />
}
```

## API Endpoint

```
PUT /api/v1/exercises/:id
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "category": "strength",
  "icon": "barbell",
  "description": "Optional",
  "instructions": "Optional",
  "media": "Optional"
}
```

## Flow

```
User edits exercise
  ↓
Validate data
  ↓
User authenticated? & API available?
  ├─ YES → PUT to /api/v1/exercises/:id
  │         ├─ Success → Use API response
  │         └─ Fail → Fall back to local
  └─ NO → Save to local storage
  ↓
Update app state
  ↓
Exercise updates in list
```

## Console Logs

**Success:**
```
Exercise updated via API: exercise-123
```

**Fallback:**
```
Failed to save exercise via API, falling back to local: APIError: HTTP 500
```

## Testing

### Test with cURL

```bash
curl --request PUT \
  --url http://localhost:3000/api/v1/exercises/exercise-id \
  --header 'authorization: Bearer <token>' \
  --header 'content-type: application/json' \
  --data '{
    "name": "Updated Name",
    "category": "strength",
    "icon": "barbell"
  }'
```

### Test in App

1. Log in
2. Edit exercise
3. Check console for "Exercise updated via API"
4. Verify exercise updates in list

## Key Differences from Create

| Aspect | Create | Update |
|--------|--------|--------|
| Has ID? | No | Yes |
| Endpoint | POST /api/v1/exercises | PUT /api/v1/exercises/:id |
| Status | 201 Created | 200 OK |
| Idempotent | No | Yes |

## Error Handling

```typescript
try {
  const exercise = await actions.upsertExercise({
    id: 'exercise-123',
    name: 'Updated Name',
    category: 'strength',
    icon: 'dumbbell'
  })
} catch (error) {
  // Handle error
  console.error(error.message)
}
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "User not authenticated" | Not logged in | Log in first |
| "HTTP 401" | Invalid token | Check Firebase config |
| "HTTP 404" | Exercise not found | Check exercise ID |
| "HTTP 409" | Name exists | Use different name |
| "Network error" | Backend down | Start backend |
| "Validation failed" | Invalid data | Check required fields |

## Files Modified

- `context/DataContext.tsx` - Added API integration for updates

## Documentation

- `PUT_EXERCISE_INTEGRATION.md` - Full integration guide
- `POST_EXERCISE_INTEGRATION.md` - POST integration guide
- `TROUBLESHOOTING_API.md` - Troubleshooting guide

## Next Steps

1. Test updating exercises
2. Verify they update in the list
3. Check backend logs
4. Test with API disabled
5. Test error scenarios
