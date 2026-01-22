# API Integration Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "User not authenticated"

**Error:**
```
Failed to fetch exercises from API, falling back to local: APIError: User not authenticated
```

**Causes:**
- User is not logged in
- Firebase auth is not initialized
- Auth state hasn't been set yet

**Solutions:**
1. Ensure user is logged in before API calls
2. Check Firebase configuration in `.env`
3. Wait for auth state to be ready (app handles this automatically now)
4. Check browser console for Firebase errors

---

### Issue 2: "HTTP 401: Unauthorized"

**Error:**
```
APIError: HTTP 401
```

**Causes:**
- Firebase token is invalid or expired
- Backend is not validating tokens correctly
- Token format is wrong

**Solutions:**
1. Check Firebase token is being sent correctly:
   ```typescript
   import { auth } from '@/lib/firebase'
   const token = await auth.currentUser?.getIdToken()
   console.log('Token:', token)
   ```

2. Verify backend is validating Firebase tokens
3. Check token expiration (tokens expire after 1 hour)
4. Restart app to get fresh token

---

### Issue 3: "Network error" or "ECONNREFUSED"

**Error:**
```
APIError: Network request failed
```

**Causes:**
- Backend not running
- Wrong API URL
- Firewall blocking connection
- Network connectivity issue

**Solutions:**
1. Check backend is running:
   ```bash
   curl http://localhost:3000/api/v1/exercises
   ```

2. Verify API URL in `.env`:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000
   ```

3. Check firewall settings
4. Try with different network (WiFi vs cellular)
5. Restart Expo dev server

---

### Issue 4: "API is disabled or not configured"

**Error:**
```
APIError: API is disabled or not configured
```

**Causes:**
- `EXPO_PUBLIC_API_ENABLED=false`
- `EXPO_PUBLIC_API_BASE_URL` not set

**Solutions:**
1. Check `.env` file:
   ```env
   EXPO_PUBLIC_API_ENABLED=true
   EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000
   ```

2. Restart Expo dev server after changing `.env`
3. Verify environment variables are loaded:
   ```typescript
   import { getAPIStatus } from '@/lib/api'
   console.log(getAPIStatus())
   ```

---

### Issue 5: "Request timeout"

**Error:**
```
APIError: Request timeout
```

**Causes:**
- Backend is slow
- Network latency
- Timeout is too short

**Solutions:**
1. Check backend performance
2. Increase timeout in `.env`:
   ```env
   EXPO_PUBLIC_API_TIMEOUT=60000  # 60 seconds
   ```

3. Check network latency:
   ```bash
   ping localhost
   ```

4. Restart Expo dev server

---

### Issue 6: Exercises not loading from API

**Symptoms:**
- No "Loaded exercises from API" in console
- Only local exercises appear
- No error messages

**Causes:**
- User not authenticated
- API not available
- API returns empty array

**Solutions:**
1. Check user is logged in
2. Verify API is enabled:
   ```typescript
   import { isAPIAvailable } from '@/lib/api'
   console.log('API available:', isAPIAvailable())
   ```

3. Test API directly:
   ```bash
   curl http://localhost:3000/api/v1/exercises \
     -H "Authorization: Bearer $TOKEN"
   ```

4. Check backend logs for errors

---

### Issue 7: Firebase configuration errors

**Error:**
```
Firebase configuration missing: apiKey, authDomain, ...
```

**Causes:**
- Environment variables not set
- Wrong variable names
- Missing `EXPO_PUBLIC_` prefix

**Solutions:**
1. Check `.env` has all Firebase variables:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...
   ```

2. Ensure all variables have `EXPO_PUBLIC_` prefix
3. Restart Expo dev server
4. Check Firebase console for correct values

---

## Debugging Steps

### Step 1: Check Console Logs
```typescript
// In any component
import { getAPIStatus } from '@/lib/api'

useEffect(() => {
  console.log('API Status:', getAPIStatus())
}, [])
```

### Step 2: Test API Directly
```bash
# Get Firebase token
TOKEN=$(firebase auth:export --format=json | jq -r '.users[0].customClaims.token')

# Test API
curl http://localhost:3000/api/v1/exercises \
  -H "Authorization: Bearer $TOKEN"
```

### Step 3: Check Auth State
```typescript
import { auth } from '@/lib/firebase'

useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(user => {
    console.log('Current user:', user?.email)
    console.log('Is authenticated:', !!user)
  })
  return unsubscribe
}, [])
```

### Step 4: Monitor Network Requests
1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for requests to `/api/v1/exercises`
4. Check response status and headers
5. Verify Authorization header is present

### Step 5: Check Backend Logs
```bash
# If using Node.js backend
tail -f logs/app.log

# Look for:
# - Authentication errors
# - Authorization failures
# - Request logs
```

---

## Quick Checklist

- [ ] User is logged in
- [ ] Firebase is configured in `.env`
- [ ] API is enabled: `EXPO_PUBLIC_API_ENABLED=true`
- [ ] API URL is correct: `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000`
- [ ] Backend is running on correct port
- [ ] Backend can validate Firebase tokens
- [ ] Network connectivity is working
- [ ] Expo dev server has been restarted after `.env` changes
- [ ] Console shows no errors
- [ ] API returns valid exercise data

---

## Getting Help

If you're still having issues:

1. Check console logs for specific error messages
2. Review `AUTH_INTEGRATION_FIX.md` for auth flow
3. Review `API_INTEGRATION_SUMMARY.md` for implementation details
4. Test API endpoint with cURL first
5. Check backend logs for errors
6. Verify Firebase configuration

---

## Useful Commands

### Test API with cURL
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

### Check Environment Variables
```bash
# In Expo console
console.log(process.env.EXPO_PUBLIC_API_BASE_URL)
console.log(process.env.EXPO_PUBLIC_API_ENABLED)
```

### Monitor Firebase Auth
```typescript
import { auth } from '@/lib/firebase'

// Check current user
console.log('Current user:', auth.currentUser)

// Get token
auth.currentUser?.getIdToken().then(token => {
  console.log('Token:', token)
})
```

### Check API Status
```typescript
import { getAPIStatus, isAPIAvailable } from '@/lib/api'

console.log('API Status:', getAPIStatus())
console.log('API Available:', isAPIAvailable())
```
