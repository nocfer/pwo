# Authentication Integration Fix

## Problem

The app was throwing this error when trying to fetch exercises from the API:

```
Failed to fetch exercises from API, falling back to local: APIError: User not authenticated
```

This happened because the DataContext was trying to fetch exercises from the API before the user was authenticated.

## Root Cause

The original implementation tried to fetch exercises immediately on app start, but Firebase authentication is asynchronous. The user might not be authenticated yet when the DataContext initializes.

## Solution

Updated the DataContext to:

1. **Subscribe to auth state changes** instead of fetching immediately
2. **Only fetch from API when user is authenticated** (`currentUser` is not null)
3. **Fall back to local storage** if user is not authenticated or API fails
4. **Check auth state in refreshAll()** before attempting API calls

## Changes Made

### 1. Updated Imports (`context/DataContext.tsx`)

```typescript
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'
```

### 2. Modified Exercise Loading Effect

**Before:**

```typescript
useEffect(() => {
  // Tried to fetch immediately, before auth was ready
  if (isAPIAvailable()) {
    apiExercises = await fetchExercises()
  }
}, [])
```

**After:**

```typescript
useEffect(() => {
  // Subscribe to auth state changes
  const unsubscribe = onAuthStateChanged(
    auth,
    async (currentUser: User | null) => {
      // Only fetch from API if user is authenticated
      if (currentUser && isAPIAvailable()) {
        apiExercises = await fetchExercises()
      }
      // Otherwise use local storage only
    }
  )

  return () => unsubscribe()
}, [])
```

### 3. Updated refreshAll() Function

Added auth check before API calls:

```typescript
const currentUser = auth.currentUser
if (currentUser && isAPIAvailable()) {
  apiExercises = await fetchExercises()
}
```

## How It Works Now

### On App Start

1. App initializes
2. Firebase auth state listener is set up
3. If user is already logged in → fetch from API
4. If user is not logged in → use local storage only
5. When user logs in → exercises are fetched from API
6. When user logs out → fall back to local storage

### On Manual Refresh

1. Check if user is currently authenticated
2. If yes and API available → fetch from API
3. If no → use local storage only

## Testing

### Test 1: Guest/Anonymous User

1. Start app without logging in
2. Check console: Should NOT see "Loaded exercises from API"
3. Exercises should load from local storage
4. No API errors should appear

### Test 2: Authenticated User

1. Log in with email/password
2. Check console: Should see "Loaded exercises from API: X"
3. Exercises should load from API + local storage
4. No authentication errors

### Test 3: Manual Refresh

1. Log in
2. Pull to refresh or call `refreshAll()`
3. Should fetch from API again
4. No errors should appear

### Test 4: API Failure

1. Log in
2. Stop backend server
3. Pull to refresh
4. Should see "Failed to fetch exercises from API, falling back to local"
5. App should continue working with local exercises

## Error Handling

The app now handles these scenarios gracefully:

| Scenario               | Behavior                   |
| ---------------------- | -------------------------- |
| User not authenticated | Use local storage only     |
| API not configured     | Use local storage only     |
| API fails              | Fall back to local storage |
| User logs in           | Fetch from API             |
| User logs out          | Use local storage only     |
| Network error          | Fall back to local storage |

## Console Logs

### Success

```
Loaded exercises from API: 42
```

### Fallback (No Auth)

```
Failed to fetch exercises from API, falling back to local: APIError: User not authenticated
```

### Fallback (API Error)

```
Failed to fetch exercises from API, falling back to local: APIError: HTTP 500
```

## Files Modified

- `context/DataContext.tsx` - Added auth state subscription and checks

## Next Steps

1. Test with your backend
2. Verify exercises load after login
3. Test with API disabled
4. Test with network failures
5. Monitor console for any errors

## Debugging

If you still see authentication errors:

1. Check Firebase is initialized correctly
2. Verify user is logged in before API calls
3. Check Firebase token is valid
4. Check backend is validating tokens correctly
5. Review console logs for detailed error messages

## Related Files

- `lib/api.ts` - API client with Firebase auth
- `context/AuthContext.tsx` - Authentication state management
- `lib/firebase.ts` - Firebase initialization
