# API Integration Summary

## Overview

The app now fetches exercises from your backend API (`/api/v1/exercises`) instead of relying solely on local storage. The integration is automatic and transparent to the rest of the app.

## Changes Made

### 1. Updated API SDK (`lib/api.ts`)
- Updated all endpoints to use `/api/v1/` prefix to match your backend
- Endpoints now match your local server structure:
  - `GET /api/v1/exercises` - Fetch all exercises
  - `GET /api/v1/exercises/:id` - Fetch single exercise
  - `GET /api/v1/exercises?category=:category` - Filter by category
  - `POST /api/v1/exercises` - Create exercise (admin)
  - `PUT /api/v1/exercises/:id` - Update exercise (admin)
  - `DELETE /api/v1/exercises/:id` - Delete exercise (admin)

### 2. Updated DataContext (`context/DataContext.tsx`)
- Added API imports: `fetchExercises`, `isAPIAvailable`
- Modified exercise loading logic to:
  1. Check if API is available
  2. Fetch exercises from API if available
  3. Fall back to local storage if API fails
  4. Merge API exercises with user-created exercises
  5. Sort and deduplicate by ID
- Updated `refreshAll()` function to also refresh from API
- Added proper error handling and logging

### 3. Updated Validation (`lib/validation.ts`)
- Extended `validateModificationPermissions()` to accept 'pt' (personal trainer) source
- Allows exercises from API with different source types

### 4. Created useAPIExercises Hook (`hooks/data/useAPIExercises.ts`)
- Provides direct API access for advanced use cases
- Includes loading, error, and availability states
- Useful for debugging or specialized components

### 5. Updated Environment Configuration (`.env`)
- Fixed Firebase environment variables to use `EXPO_PUBLIC_` prefix
- Existing API configuration already in place:
  - `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000`
  - `EXPO_PUBLIC_API_TIMEOUT=30000`
  - `EXPO_PUBLIC_API_ENABLED=true`

## How It Works

### On App Start
1. DataContext initializes
2. Checks if API is available (`EXPO_PUBLIC_API_ENABLED=true` and `EXPO_PUBLIC_API_BASE_URL` set)
3. If available, fetches exercises from `/api/v1/exercises` with Firebase auth token
4. Loads user-created exercises from local storage
5. Merges both sources (API exercises + user exercises)
6. Deduplicates by ID (user exercises override API exercises with same ID)
7. Sorts alphabetically by name
8. Updates state and notifies all subscribers

### On Refresh
- `refreshAll()` action triggers the same flow
- Useful for manual refresh or pull-to-refresh UI

### Error Handling
- If API fails, app falls back to local storage only
- Errors are logged but don't crash the app
- User can still work with local exercises

### Authentication
- Firebase auth token is automatically included in all API requests
- Token is refreshed on each request
- No manual token management needed

## Usage

### Standard Usage (Recommended)
```typescript
import { useExercises } from '@/hooks/data/useExercises'

export function MyComponent() {
  const { data: exercises, loading } = useExercises()
  // exercises now include both API and user-created exercises
}
```

### Direct API Usage (Advanced)
```typescript
import { useAPIExercises } from '@/hooks/data/useAPIExercises'

export function MyComponent() {
  const { data, loading, error, isAPIAvailable } = useAPIExercises()
  // data contains only API exercises
}
```

### Manual API Calls
```typescript
import { fetchExercises, APIError } from '@/lib/api'

try {
  const exercises = await fetchExercises()
} catch (error) {
  if (error instanceof APIError) {
    console.error(`API Error [${error.code}]:`, error.message)
  }
}
```

## Testing

### Test with cURL
```bash
curl --request GET \
  --url http://localhost:3000/api/v1/exercises \
  --header 'authorization: Bearer <your-firebase-token>'
```

### Test in App
1. Ensure backend is running on `http://localhost:3000`
2. Ensure `EXPO_PUBLIC_API_ENABLED=true` in `.env`
3. Start the app
4. Check console logs for "Loaded exercises from API: X"
5. Exercises should appear in the library

## Configuration

### Enable/Disable API
```env
# Enable API integration
EXPO_PUBLIC_API_ENABLED=true

# Disable API integration (use local storage only)
EXPO_PUBLIC_API_ENABLED=false
```

### Change API Base URL
```env
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
```

### Adjust Request Timeout
```env
EXPO_PUBLIC_API_TIMEOUT=60000  # 60 seconds
```

## Fallback Behavior

If the API is not available or fails:
1. App continues to work with local storage
2. User-created exercises are still accessible
3. No data loss occurs
4. User can still create/edit/delete exercises locally

## Next Steps

1. Test the integration with your local backend
2. Monitor console logs for any API errors
3. Verify exercises load correctly
4. Test with different network conditions
5. Consider adding retry logic for failed requests
6. Add UI indicators for API sync status

## Files Modified

- `context/DataContext.tsx` - Added API integration
- `lib/api.ts` - Updated endpoints to `/api/v1/`
- `lib/validation.ts` - Extended source type support
- `.env` - Fixed Firebase env var names
- `lib/firebase.ts` - Added debug logging

## Files Created

- `hooks/data/useAPIExercises.ts` - Direct API access hook
- `API_INTEGRATION_SUMMARY.md` - This file
