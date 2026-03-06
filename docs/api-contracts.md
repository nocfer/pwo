# API Contracts & Integration

## Backend API Structure

Progressive Workout supports an optional backend API for exercise sync, program sharing, and user data synchronization. This API is **feature-flagged** and optional - all features work without it.

---

## Firebase Authentication API

### Initialization

**File**: `lib/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
```

### Authentication Endpoints

#### Sign In (Email/Password)

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth'

const result = await signInWithEmailAndPassword(
  auth,
  email,
  password
)

// Returns: UserCredential with user object
// Throws: FirebaseAuthError with code:
//   - auth/invalid-email
//   - auth/user-disabled
//   - auth/user-not-found
//   - auth/wrong-password
//   - auth/too-many-requests
```

**Error Mapping** (`context/AuthContext.tsx`):
```typescript
switch (error.code) {
  case 'auth/invalid-email':
    return 'Invalid email address'
  case 'auth/wrong-password':
    return 'Incorrect password'
  case 'auth/user-not-found':
    return 'No account found with this email'
  // ... more mappings
}
```

#### Sign Up (Create Account)

```typescript
import { createUserWithEmailAndPassword } from 'firebase/auth'

const result = await createUserWithEmailAndPassword(
  auth,
  email,
  password
)

// Throws: FirebaseAuthError with code:
//   - auth/weak-password (< 6 chars)
//   - auth/email-already-in-use
//   - auth/invalid-email
```

#### Sign In as Guest

```typescript
import { signInAnonymously } from 'firebase/auth'

const result = await signInAnonymously(auth)

// Returns: UserCredential with anonymous user
// User.isAnonymous === true
```

#### Link Account (Guest → Registered)

```typescript
import { 
  EmailAuthProvider,
  linkWithCredential
} from 'firebase/auth'

const credential = EmailAuthProvider.credential(email, password)
const result = await linkWithCredential(auth.currentUser, credential)

// Throws: FirebaseAuthError with code:
//   - auth/credential-already-in-use (email used by another account)
//   - auth/email-already-in-use
```

#### Sign Out

```typescript
import { signOut } from 'firebase/auth'

await signOut(auth)

// Returns: void
// Clears session
```

#### Get ID Token

```typescript
const idToken = await auth.currentUser?.getIdToken()

// Returns: JWT token (expires after 1 hour)
// Cached by Firebase SDK
// Used for API authentication (Bearer header)
```

#### Listen to Auth State

```typescript
import { onAuthStateChanged } from 'firebase/auth'

const unsubscribe = onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Authenticated:', user.email)
  } else {
    console.log('Not authenticated')
  }
})

// Don't forget to call unsubscribe on cleanup
```

---

## Optional Backend API

### Configuration

**Enable API**:
```bash
EXPO_PUBLIC_API_ENABLED=true
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
EXPO_PUBLIC_API_TIMEOUT=30000  # milliseconds
```

**File**: `lib/api.ts` (228 lines)

### Client Initialization

```typescript
import { APIClient } from '@/lib/api'

const apiClient = new APIClient({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: process.env.EXPO_PUBLIC_API_TIMEOUT || 30000,
})
```

### Authentication

All API requests include Firebase ID token:

```typescript
Authorization: Bearer {firebase_id_token}
```

### Endpoints

#### Exercise Management

##### GET `/api/v1/exercises`

Fetch all exercises (with optional filtering)

**Query Parameters**:
- `category`: string (optional) - Filter by category (strength, cardio, flexibility, skill)
- `source`: string (optional) - Filter by source (builtin, user, pt)
- `limit`: number (optional) - Pagination limit (default: 100)
- `offset`: number (optional) - Pagination offset (default: 0)

**Response**: 200 OK
```json
{
  "data": [
    {
      "id": "bench-press-1",
      "name": "Barbell Bench Press",
      "category": "strength",
      "icon": "barbell",
      "source": "builtin",
      "description": "Compound pressing movement",
      "createdAt": "2026-03-01T00:00:00Z",
      "updatedAt": "2026-03-01T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 150
  }
}
```

**Errors**:
- `401 Unauthorized` - Invalid token
- `400 Bad Request` - Invalid query parameters
- `500 Internal Server Error` - Server error

---

##### GET `/api/v1/exercises/:id`

Fetch single exercise

**Path Parameters**:
- `id`: string - Exercise ID

**Response**: 200 OK
```json
{
  "id": "bench-press-1",
  "name": "Barbell Bench Press",
  "category": "strength",
  "icon": "barbell",
  "source": "builtin",
  "description": "Compound pressing movement",
  "instructions": "Feet on floor, shoulders pinned, controlled descent",
  "media": "https://example.com/images/bench-press.jpg",
  "createdAt": "2026-03-01T00:00:00Z",
  "updatedAt": "2026-03-01T00:00:00Z"
}
```

**Errors**:
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Exercise not found
- `500 Internal Server Error` - Server error

---

##### POST `/api/v1/exercises`

Create new exercise (Admin only)

**Request Body**:
```json
{
  "name": "Dumbbell Bench Press",
  "category": "strength",
  "icon": "dumbbell",
  "description": "Single arm pressing movement",
  "instructions": "Unilateral press with neutral grip"
}
```

**Response**: 201 Created
```json
{
  "id": "db-bench-1",
  "name": "Dumbbell Bench Press",
  "category": "strength",
  "icon": "dumbbell",
  "source": "api",
  "description": "Single arm pressing movement",
  "instructions": "Unilateral press with neutral grip",
  "createdAt": "2026-03-06T12:00:00Z",
  "updatedAt": "2026-03-06T12:00:00Z"
}
```

**Errors**:
- `400 Bad Request` - Invalid data
- `401 Unauthorized` - Invalid token or insufficient permissions
- `409 Conflict` - Exercise name already exists
- `500 Internal Server Error` - Server error

---

##### PUT `/api/v1/exercises/:id`

Update exercise (Admin only)

**Path Parameters**:
- `id`: string - Exercise ID

**Request Body** (partial update):
```json
{
  "description": "Updated description",
  "instructions": "Updated instructions"
}
```

**Response**: 200 OK
```json
{
  "id": "bench-press-1",
  "name": "Barbell Bench Press",
  "category": "strength",
  "icon": "barbell",
  "description": "Updated description",
  "instructions": "Updated instructions",
  "createdAt": "2026-03-01T00:00:00Z",
  "updatedAt": "2026-03-06T12:30:00Z"
}
```

**Errors**:
- `400 Bad Request` - Invalid data
- `401 Unauthorized` - Invalid token or insufficient permissions
- `404 Not Found` - Exercise not found
- `500 Internal Server Error` - Server error

---

##### DELETE `/api/v1/exercises/:id`

Delete exercise (Admin only)

**Path Parameters**:
- `id`: string - Exercise ID

**Response**: 204 No Content

**Errors**:
- `401 Unauthorized` - Invalid token or insufficient permissions
- `404 Not Found` - Exercise not found
- `409 Conflict` - Exercise in use (referenced by programs)
- `500 Internal Server Error` - Server error

---

### Error Response Format

All API errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Exercise name is required",
    "details": [
      {
        "field": "name",
        "message": "Required field"
      }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Meaning |
|------|------------|---------|
| `INVALID_TOKEN` | 401 | Firebase token invalid or expired |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request data validation failed |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate name) |
| `SERVER_ERROR` | 500 | Unexpected server error |
| `TIMEOUT` | 408 | Request timeout (client-side) |

---

## API Client Usage

### Basic Usage

```typescript
import { APIClient } from '@/lib/api'

const apiClient = new APIClient({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 30000,
})

// Fetch exercises
try {
  const exercises = await apiClient.fetchExercises({
    category: 'strength',
    limit: 50,
  })
  console.log('Fetched:', exercises.length, 'exercises')
} catch (error) {
  console.error('API Error:', error.message)
}

// Create exercise
try {
  const newExercise = await apiClient.createExercise({
    name: 'New Exercise',
    category: 'cardio',
    icon: 'bicycle',
  })
  console.log('Created:', newExercise.id)
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    console.error('Validation failed:', error.details)
  }
}
```

### Error Handling

```typescript
try {
  const result = await apiClient.updateExercise('id', data)
} catch (error) {
  if (error instanceof APIError) {
    switch (error.code) {
      case 'INVALID_TOKEN':
        // Redirect to login
        break
      case 'NOT_FOUND':
        // Show "not found" message
        break
      case 'VALIDATION_ERROR':
        // Show validation errors
        console.error(error.details)
        break
      default:
        // Show generic error
        console.error(error.message)
    }
  }
}
```

### Custom APIError Class

```typescript
class APIError extends Error {
  code: string                            // Error code
  statusCode: number                      // HTTP status
  details?: Record<string, unknown>       // Additional context
  originalError?: Error                   // Original error
  
  constructor(code, message, statusCode, details?, originalError?)
}
```

---

## Integration Points

### In DataContext

```typescript
// Hook to fetch from API (if enabled)
const { data: apiExercises } = useAPIExercises()

// Merge API exercises with local
const allExercises = [
  ...localExercises,
  ...apiExercises,
]
```

### In useExercises Hook

```typescript
export function useExercises() {
  const { exercises } = useContext(DataContext)
  const { data: apiExercises } = useAPIExercises()
  
  return {
    data: [...exercises, ...apiExercises],
    loading: exercisesLoading || apiLoading,
  }
}
```

### Feature Flag

All API calls check the feature flag:

```typescript
if (process.env.EXPO_PUBLIC_API_ENABLED !== 'true') {
  return { data: [], loading: false }
}
```

---

## Offline Behavior

When API is unavailable or disabled:

✅ **Works Offline**:
- Load local exercises
- Create/edit/delete programs
- Track workouts and progress
- Access all local data

❌ **Requires API**:
- Sync exercises from server
- Access professional trainer library
- Cloud backup/restore

---

## Authentication Flow Diagram

```
User Interaction
    ↓
signIn() / signUp() / signInAsGuest()
    ↓
Firebase Auth
    ├─ Validate credentials
    ├─ Create/retrieve user
    └─ Generate ID token
    ↓
Set auth.currentUser
    ↓
Store ID token (cached by Firebase)
    ↓
Available for:
  - API calls (Bearer header)
  - Session persistence
  - User identification
```

---

## Example Implementations

### Complete Sign-In Flow

```typescript
async function handleSignIn(email: string, password: string) {
  try {
    // 1. Authenticate
    await signIn(email, password)
    
    // 2. Get token
    const token = await auth.currentUser?.getIdToken()
    
    // 3. Optional: Sync data from API
    if (process.env.EXPO_PUBLIC_API_ENABLED) {
      await syncExercisesFromAPI(token)
    }
    
    // 4. Navigate to app
    navigation.replace('tabs')
  } catch (error) {
    showError(mapFirebaseError(error))
  }
}
```

### Fetch with Authentication

```typescript
async function fetchExercisesWithAuth() {
  const token = await auth.currentUser?.getIdToken()
  
  if (!token) throw new Error('Not authenticated')
  
  const response = await fetch(
    `${API_BASE}/api/v1/exercises`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )
  
  if (!response.ok) {
    throw new APIError(
      'API_ERROR',
      'Failed to fetch exercises',
      response.status
    )
  }
  
  return response.json()
}
```

---

## Summary

- **Firebase**: Handles authentication, optional database sync
- **Optional API**: For exercise library, programs, sync (feature-flagged)
- **Offline-first**: All features work without API
- **Token-based**: Firebase ID token used for API auth
- **Error handling**: Comprehensive error codes and user-friendly messages
- **Type-safe**: TypeScript contracts for all endpoints

See [API Client Implementation](../lib/api.ts) for complete code.

