# POST Exercise - Quick Reference

## What's New

The app now creates exercises via your backend API with automatic fallback to local storage.

## How to Use

### In Your Component

```typescript
import { useDataContext } from '@/context/DataContext'

export function MyComponent() {
  const { actions } = useDataContext()

  const handleCreateExercise = async () => {
    try {
      const exercise = await actions.upsertExercise({
        name: 'Bench Press',
        category: 'strength',
        icon: 'barbell'
      })
      console.log('Created:', exercise)
    } catch (error) {
      console.error('Failed:', error)
    }
  }

  return <Button onPress={handleCreateExercise} title="Create" />
}
```

## API Endpoint

```
POST /api/v1/exercises
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "name": "Exercise Name",
  "category": "strength",
  "icon": "barbell",
  "description": "Optional description",
  "instructions": "Optional instructions",
  "media": "Optional image URL"
}
```

## Flow

```
User creates exercise
  ↓
Validate data
  ↓
User authenticated? & API available?
  ├─ YES → POST to API
  │         ├─ Success → Use API response
  │         └─ Fail → Fall back to local
  └─ NO → Save to local storage
  ↓
Update app state
  ↓
Exercise appears in list
```

## Console Logs

**Success:**
```
Exercise created via API: exercise-123
```

**Fallback:**
```
Failed to create exercise via API, falling back to local: APIError: HTTP 500
```

## Testing

### Test with cURL

```bash
curl --request POST \
  --url http://localhost:3000/api/v1/exercises \
  --header 'authorization: Bearer <token>' \
  --header 'content-type: application/json' \
  --data '{
    "name": "Test Exercise",
    "category": "strength",
    "icon": "barbell"
  }'
```

### Test in App

1. Log in
2. Create exercise
3. Check console for "Exercise created via API"
4. Verify exercise appears in list

## Error Handling

```typescript
try {
  const exercise = await actions.upsertExercise({
    name: 'New Exercise',
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
| "HTTP 409" | Name exists | Use different name |
| "Network error" | Backend down | Start backend |
| "Validation failed" | Invalid data | Check required fields |

## Files Modified

- `context/DataContext.tsx` - Added API integration
- `lib/api.ts` - Removed debug logging

## Documentation

- `POST_EXERCISE_INTEGRATION.md` - Full integration guide
- `TROUBLESHOOTING_API.md` - Troubleshooting guide
- `API_USAGE.md` - API documentation

## Next Steps

1. Test creating exercises
2. Verify they appear in the list
3. Check backend logs
4. Test with API disabled
5. Test error scenarios
