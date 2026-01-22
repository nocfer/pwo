# API Integration Quick Start

## What Changed?

Exercises are now fetched from your backend API (`http://localhost:3000/api/v1/exercises`) instead of just local storage.

## How to Test

### 1. Ensure Backend is Running
```bash
# Your backend should be running on http://localhost:3000
curl http://localhost:3000/api/v1/exercises \
  -H "Authorization: Bearer <your-firebase-token>"
```

### 2. Check Environment
Verify `.env` has:
```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000
EXPO_PUBLIC_API_ENABLED=true
```

### 3. Start App
```bash
npm start
```

### 4. Check Console
Look for:
```
Loaded exercises from API: 42
```

## How It Works

```
App Start
  ↓
Check if API available
  ↓
  ├─ YES → Fetch from /api/v1/exercises
  │         ↓
  │         Load user exercises from storage
  │         ↓
  │         Merge & deduplicate
  │         ↓
  │         Display to user
  │
  └─ NO → Load user exercises from storage
           ↓
           Display to user
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/api.ts` | API client with Firebase auth |
| `context/DataContext.tsx` | Automatic API integration |
| `hooks/data/useAPIExercises.ts` | Direct API access (advanced) |
| `lib/API_USAGE.md` | Full API documentation |
| `API_INTEGRATION_SUMMARY.md` | Detailed integration guide |

## Common Issues

### "API is disabled or not configured"
- Check `EXPO_PUBLIC_API_ENABLED=true` in `.env`
- Check `EXPO_PUBLIC_API_BASE_URL` is set
- Restart Expo dev server

### "Failed to get authentication token"
- Ensure user is logged in
- Check Firebase configuration in `.env`
- Check Firebase auth is initialized

### "HTTP 401: Unauthorized"
- Firebase token might be expired
- Check backend is validating tokens correctly
- Verify token format in Authorization header

### "Network error"
- Backend not running on `http://localhost:3000`
- Check firewall/network connectivity
- Try with cURL first to isolate issue

## API Endpoints

All endpoints require Firebase auth token in header:
```
Authorization: Bearer <firebase-id-token>
```

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/exercises` | Fetch all exercises |
| GET | `/api/v1/exercises/:id` | Fetch single exercise |
| GET | `/api/v1/exercises?category=push` | Filter by category |
| POST | `/api/v1/exercises` | Create exercise (admin) |
| PUT | `/api/v1/exercises/:id` | Update exercise (admin) |
| DELETE | `/api/v1/exercises/:id` | Delete exercise (admin) |

## Code Examples

### Use Exercises (Standard)
```typescript
import { useExercises } from '@/hooks/data/useExercises'

export function ExerciseList() {
  const { data: exercises, loading } = useExercises()
  
  if (loading) return <LoadingScreen />
  
  return (
    <FlatList
      data={exercises}
      renderItem={({ item }) => <Text>{item.name}</Text>}
    />
  )
}
```

### Direct API Access (Advanced)
```typescript
import { fetchExercises, APIError } from '@/lib/api'

try {
  const exercises = await fetchExercises()
  console.log('Loaded:', exercises.length)
} catch (error) {
  if (error instanceof APIError) {
    console.error(`[${error.code}] ${error.message}`)
  }
}
```

### Refresh Exercises
```typescript
import { useDataContext } from '@/context/DataContext'

export function MyComponent() {
  const { actions } = useDataContext()
  
  const handleRefresh = () => {
    actions.refreshAll()
  }
  
  return <Button onPress={handleRefresh} title="Refresh" />
}
```

## Debugging

### Enable Debug Logging
Check console for:
- `Loaded exercises from API: X` - Success
- `Failed to fetch exercises from API` - API error (falls back to local)
- `Error loading exercises:` - Critical error

### Check API Status
```typescript
import { getAPIStatus } from '@/lib/api'

console.log(getAPIStatus())
// Output: { enabled: true, baseUrl: 'http://127.0.0.1:3000', timeout: 30000, isAvailable: true }
```

### Test API Directly
```bash
# Get all exercises
curl http://localhost:3000/api/v1/exercises \
  -H "Authorization: Bearer $TOKEN"

# Get single exercise
curl http://localhost:3000/api/v1/exercises/exercise-id \
  -H "Authorization: Bearer $TOKEN"

# Filter by category
curl "http://localhost:3000/api/v1/exercises?category=push" \
  -H "Authorization: Bearer $TOKEN"
```

## Next Steps

1. ✅ API integration is complete
2. Test with your backend
3. Monitor console for errors
4. Add UI indicators for sync status
5. Consider adding retry logic
6. Add offline mode handling

## Support

For issues or questions:
1. Check `lib/API_USAGE.md` for detailed documentation
2. Check `API_INTEGRATION_SUMMARY.md` for implementation details
3. Review console logs for error messages
4. Test API endpoint with cURL first
