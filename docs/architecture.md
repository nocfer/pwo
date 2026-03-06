# Progressive Workout - Architecture Documentation

## Executive Summary

Progressive Workout is a React Native mobile application built on Expo with **Firebase-backed API-driven architecture**. The system has undergone a major architectural shift from local storage to centralized API integration. The application follows **component-based UI design** with **context-driven state management**, emphasizing Firebase authentication and API-first data operations.

**Key Architectural Principles:**
- **API-Driven Architecture**: Firebase backend API as primary data layer (optional fallback to local storage)
- **Component Isolation**: 76 reusable components, organized by feature domain
- **Context-Driven State**: Centralized state management through React Context API (Auth + Data)
- **Custom Hooks**: 30 specialized hooks for API data fetching and session management
- **Authentication-First**: Firebase Auth with sign-in, sign-up, and guest access
- **Offline-Graceful**: Automatic fallback to local data when API unavailable
- **Type Safety**: Full TypeScript strict mode with comprehensive validation

**Breaking Changes:**
- ⚠️ **Challenge System Removed**: All challenge-related components, types, and data models deleted
- ⚠️ **SessionProgress → WorkoutProgress**: Simplified workout tracking model
- ⚠️ **Event System Removed**: Replaced with direct API calls + context updates
- ⚠️ **Storage → API**: Primary data flow now API-driven instead of local-first

---

## Technology Stack

### Runtime & Framework

```
React 19.2.0
    ↓
React Native 0.81.5 (native bridge)
    ↓
Expo ~55.0.0 (development platform)
    └─→ Expo Router 6.0.17 (file-based routing)
```

### Core Dependencies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **UI Framework** | React | 19.2.0 | Component library |
| **Native** | React Native | 0.81.5 | Native bridge |
| **Platform** | Expo | ~55.0.0 | Build + run system |
| **Routing** | Expo Router | ~6.0.17 | File-based navigation |
| **Navigation** | React Navigation | 7.1.8 | Screen navigation |
| **Auth/API** | Firebase | 12.10.0 | Auth + Realtime Database |
| **Language** | TypeScript | ~5.9.2 | Type safety |

### UI & Visualization

- **Victory Native** (41.20.2) - Charts and graphs
- **Expo Vector Icons** (15.0.3) - Ionicons library
- **React Native Reanimated** (~4.1.1) - Smooth animations
- **Expo Linear Gradient** (~15.0.8) - Gradient backgrounds
- **React Native SVG** (15.12.1) - Vector graphics
- **Expo Camera** (~17.0.10) - QR code scanning

### Development

- **Vitest** (2.1.0) - Unit & integration testing
- **ESLint** (9.25.0) - Code linting
- **Prettier** - Code formatting (no semicolons, single quotes)

---

## Application Architecture

### API-Driven Layered Architecture (NEW)

```
┌─────────────────────────────────────────────────────────────┐
│   Screens / Views (21 screens + Auth flows in app/)         │
│   Route-based UI entry points                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│   Reusable Components (76 components)                       │
│   UI, Data Management, Auth, Forms, Charts, QR             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│   Custom Hooks (30 hooks)                                   │
│   API Integration (useAPIExercises, etc.)                  │
│   Session management (useWorkoutTimer, useAsyncData)       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│   Context Providers (2 contexts)                            │
│   AuthContext (Firebase auth + user state)                 │
│   DataContext (API data + local cache)                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│   API Integration Layer (lib/api.ts) [NEW]                 │
│   Firebase token management                                │
│   Request/response handling with mappers                   │
│   Error handling and offline fallback                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│   Mappers & Validators (lib/mappers/, lib/validation.ts)   │
│   API ↔ Frontend data transformation                       │
│   Schema validation and type conversion                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│   Backend API (Firebase / Custom REST)                     │
│   Exercises, Programs, Workouts, Stats endpoints          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│   Local Storage (Fallback)                                  │
│   └─ Web: localStorage                                      │
│   └─ Native: Expo FileSystem                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Organization (NEW: 76 total)

```
components/
├── common/           # Atomic UI (Button, Card, Input, etc.) - 12 components
├── auth/             # Authentication (SignIn, SignUp, GuestAccess) - 8 NEW
├── program/          # Program execution (WorkoutExecutionScreen, etc.) - 15
├── progress/         # Progress visualization (Charts, Heatmaps, etc.) - 12
├── data/             # Data management (DataList, Forms, CRUD UI) - 12 NEW
├── forms/            # Form components (ExerciseForm, ProgramEditor) - 10 NEW
├── qr/               # QR code features (Scanner, Generator) - 5 NEW
└── cards/            # Card components - 2
```

**Deleted Component Groups** (17 components removed):
- `components/challenge/` - Challenge execution screens
- Challenge-related components scattered across other directories
- Legacy components for old event system

### Hooks Organization (NEW: 30 total)

```
hooks/
├── data/             # API Data fetching (17 hooks) [NEW/EXPANDED]
│   ├── useAPIExercises       # Fetch exercises from API
│   ├── useAPIPrograms        # Fetch programs from API
│   ├── useAPIWorkouts        # Fetch workouts from API
│   ├── useProgramProgress    # Get program-specific stats
│   ├── usePRs                # Load personal records
│   ├── useWeeklyStats        # Aggregate weekly data
│   ├── useConsistency        # Heatmap data
│   └── ... (10 more data hooks)
├── session/          # Workout execution (4 hooks)
│   ├── useWorkoutTimer       # Timer logic (637+ lines)
│   ├── useWorkoutSteps       # Convert blocks to steps
│   └── useStepCompletion     # Step navigation
├── auth/             # Authentication (3 NEW hooks)
│   ├── useAuthState
│   ├── useSignIn
│   └── useSignUp
├── ui/               # UI/UX hooks (5 NEW)
│   ├── useFormValidation
│   ├── useSearchState
│   └── ... (3 more)
└── useAsyncData              # Generic async hook with caching
```

---

## State Management Architecture

### Context Structure

#### **AuthContext** (`context/AuthContext.tsx` - NEW)

Handles Firebase authentication and user session management:

```typescript
type AuthContextValue = {
  user: User | null              // Firebase auth user
  loading: boolean               // Auth state loading
  error: string | null           // Error messages
  isAnonymous: boolean           // Anonymous guest flag
  
  signIn(email, password)        // Email login
  signUp(email, password)        // Account creation
  signInAsGuest()                // Anonymous access
  linkAccount(email, password)   // Guest → registered
  signOut()                      // Sign out
}
```

**Features:**
- Firebase Authentication integration
- Automatic error code mapping to user messages
- Session persistence via Firebase
- Haptic feedback on actions
- Token management for API calls

#### **DataContext** (`context/DataContext.tsx` - REFACTORED)

Now API-driven with local fallback:

```typescript
type DataContextValue = {
  // Data (from API or local fallback)
  exercises: Exercise[]
  programs: Program[]
  lastCompletedSlug: string | null
  
  // Loading states
  exercisesLoading: boolean
  programsLoading: boolean
  
  // Version counters (for loose coupling)
  progressVersion: number
  historyVersion: number
  completedVersion: number
  
  // Actions
  completeWorkout(workoutId, progress)    // Record API workout
  recordEvent(slug, sessionIndex, event)  // Log detailed events (if needed)
  upsertExercise(data)                    // Create/update exercise via API
  upsertProgram(data)                     // Create/update program via API
  saveSessionState(state)                 // Persist workout-in-progress
  loadSessionState()                      // Resume paused workout
  ... (20+ more actions)
}
```

**Key Changes:**
- **API-First**: All data reads/writes go through API first
- **Reducer pattern** for complex state mutations
- **CRUD operations** now API-driven with local cache fallback
- **Version counters** trigger cache invalidation and refetches
- **Progress calculations** from API or local data

### Data Flow Pattern (API-Driven)

```
Component
    ↓ (call hook)
useAPIExercises() / useProgram()
    ↓ (subscribe to AuthContext for token)
AuthContext (get Firebase token)
    ↓ (request data)
API Client (lib/api.ts)
    ↓ (make authenticated request)
Firebase Backend API
    ↓ (response with data)
Mapper (lib/mappers/)
    ↓ (transform to frontend types)
DataContext
    ↓ (cache in local state)
Local Storage (optional fallback)
```

### Offline Fallback Strategy

When API is unavailable:
1. **Failed API call** triggers fallback
2. **Load from local storage** (localStorage/FileSystem)
3. **User sees stale data** with visual indicator
4. **Automatic retry** when connection restored
5. **Cache invalidation** after sync

---

## New API Integration Layer

### Firebase API Client (`lib/api.ts` - NEW)

Centralized API client with Firebase authentication:

```typescript
// Authentication
async function getAuthToken(forceRefresh?: boolean): Promise<string>

// Generic request handler
async function request<T>(
  endpoint: string,
  options?: { method?, body?, headers? }
): Promise<T>

// Exercises
async function fetchExercises(): Promise<Exercise[]>
async function fetchExercise(id: string): Promise<Exercise>
async function createExercise(data): Promise<Exercise>
async function updateExercise(id, updates): Promise<Exercise>
async function deleteExercise(id): Promise<void>

// Workouts
async function fetchWorkouts(): Promise<APIWorkout[]>
async function createWorkout(data): Promise<APIWorkout>
async function updateWorkout(id, data): Promise<APIWorkout>
async function deleteWorkout(id): Promise<void>

// Stats
async function recordWorkout(input): Promise<WorkoutLogResponse>
async function fetchPRs(limit?): Promise<APIPR[]>
async function fetchProgress(): Promise<APIProgress>
async function fetchWeeklyStats(): Promise<APIWeeklyStats>
async function fetchConsistency(weeks?): Promise<ConsistencyEntry[]>
```

**Error Handling:**
```typescript
export class APIError extends Error {
  code: string              // 'NO_AUTH', 'TIMEOUT', 'NETWORK_ERROR', etc.
  statusCode?: number       // HTTP status if applicable
  originalError?: unknown   // Underlying error
}
```

### Data Mappers (`lib/mappers/` - NEW)

Bidirectional transformation between API and frontend models:

```
lib/mappers/
├── workout.ts    # APIWorkout ↔ Program conversion
└── stats.ts      # Stats API → frontend types
```

**Example: `workoutBlockToProgram`**
Converts API array-based block representation to frontend scalar model:
- `reps: [8, 8, 8]` (API) → `targetReps: [8], sets: 3` (Frontend)
- `rests: [90]` (API) → `restBetweenSets: 90` (Frontend)

---

## Authentication Architecture (NEW)

### Firebase Auth Flow

```
User Opens App
    ↓
Check Firebase Auth State
    ├─ Authenticated → Load UserContext
    ├─ Guest (Anonymous) → Show Guest UX
    └─ Not Authenticated → Auth Screens
    
Auth Screens:
├── Sign In (email/password)
├── Sign Up (new account)
└── Guest Option (Anonymous access)

After Authentication:
    ↓
Get Firebase ID Token
    ↓
Use token in API requests
    ↓
Automatic token refresh before expiry
```

### Auth Routes (`app/(auth)/` - NEW)

```
app/(auth)/
├── _layout.tsx       # Auth stack layout
├── sign-in.tsx       # Sign in screen with guest option
└── sign-up.tsx       # Account creation screen
```

### Session Persistence

- **Firebase Auth** handles persistent authentication
- **Auth state changes** trigger context updates
- **Automatic redirect** to appropriate screen based on auth state
- **Token refresh** handled transparently

---

## Data Models & Schema (REFACTORED)

### Core Entities (Breaking Changes)

#### Simplified Progress Tracking

**Old Model (Removed):**
```typescript
interface SessionProgress {          // ❌ DELETED
  sessionId: string
  programId: string
  sessions: ProgramRun[]            // Complex nesting
  // ... complex fields
}
```

**New Model (WorkoutProgress):**
```typescript
interface WorkoutProgress {
  workoutId: string                 // Simple ID
  programId: string
  completed: boolean
  completedAt?: string
  timeSpentSeconds: number
  exercises: ExerciseProgress[]
}

interface ProgramProgress {
  programId: string
  workouts: WorkoutProgress[]       // Flat array
  lifetimeWorkoutsCompleted: number
  lifetimeTimeSpentSeconds: number
  lastActivityAt: string | null
}
```

### New Types from Enhanced Model (`types/enhanced.ts`)

```typescript
// Enhanced models with metadata
interface EnhancedExercise extends Exercise {
  muscleGroups?: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  equipment?: string[]
  usageCount?: number
}

interface EnhancedProgram extends Program {
  thumbnail?: string
  averageRating?: number
  usageCount?: number
}

// Validation result types
type ValidationResult = {
  isValid: boolean
  errors: ValidationError[]
  warnings?: ValidationWarning[]
}

// Audit logging
type AuditLogEntry = {
  id: string
  timestamp: string
  userId?: string
  action: AuditAction  // CREATE, UPDATE, DELETE, IMPORT, EXPORT
  entityType: DataType  // 'exercises' | 'programs'
  entityId: string
  changes?: Record<string, { from: any; to: any }>
}
```

### Deleted Types

❌ **Challenge-Related** (completely removed):
- `ChallengeProgress`
- `ChallengeConfig` (program variant)
- `ChallengeSessions`
- All challenge enum types

❌ **Event System** (removed):
- `WorkoutEvent`
- `WorkoutEventType`
- Event system context

---

## Validation & Permission System

### Validation Layer (`lib/validation.ts`)

Enhanced validation with error codes:

```typescript
// Exercise validation
validateExercise(data): ValidationResult
  ├─ Name is required & unique
  ├─ Category is valid
  ├─ Icon is valid Ionicons glyph
  └─ Returns typed errors

// Program validation
validateProgram(data): ValidationResult
  ├─ Has at least one block
  ├─ Exercise references are valid
  ├─ Rest/break values are positive
  └─ Block structure is valid
```

### Permission System

```typescript
'builtin'  → Read-only (cannot modify/delete)
'user'     → Full CRUD (owner)
'pt'       → Read-only, cannot delete if in use

// API enforces permissions server-side
// Client validates before showing edit/delete UX
```

### Dependency Checking (`lib/dependencyChecker.ts` - NEW)

Prevent orphaned data:

```typescript
canDeleteExercise(exerciseId): boolean
  ├─ Check all programs for references
  ├─ Check all progress records
  └─ Return false if in use
```

### Audit Logging (`lib/auditLogger.ts` - NEW)

Track all modifications:

```typescript
logAuditEntry({
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT',
  entityType: 'exercises' | 'programs',
  entityId: string,
  changes?: { field: { from, to } }
})
```

---

## Screen & Navigation Architecture

### File-Based Routing (Expo Router 6.0.17)

```
app/
├── _layout.tsx                   # Root providers (Auth + Data context)
├── index.tsx                     # Auth routing redirect
├── (auth)/                       # Auth group (NEW)
│   ├── _layout.tsx              # Stack layout
│   ├── sign-in.tsx              # Sign in screen
│   └── sign-up.tsx              # Sign up screen
├── (tabs)/                       # Tab group (authenticated)
│   ├── _layout.tsx              # 4-tab config
│   ├── index.tsx                # Home screen
│   ├── library.tsx              # Exercise/Program library
│   ├── progress.tsx             # Statistics dashboard
│   └── profile.tsx              # Settings & profile
├── programs/
│   ├── [id].tsx                 # Program detail
│   └── [id]/session/[index].tsx # Workout execution
└── library/
    ├── exercises/               # Exercise management
    ├── programs/                # Program management
    ├── scan.tsx                 # QR scanner (NEW)
    └── import/                  # Import flows (NEW)
```

### Navigation Structure (API-Integrated)

```
Root
├── Unauthenticated
│   └── (auth) [Stack Navigation]
│       ├── Sign In (with Guest option)
│       └── Sign Up
│
└── Authenticated User
    ├── (tabs) [Bottom Tab Navigation]
    │   ├── Home → Recent programs, quick-start
    │   ├── Library → Browse/manage exercises & programs
    │   ├── Progress → Stats, charts, PRs
    │   └── Profile → Settings, auth, data management
    └── Deep Links
        ├── programs/[id] → Program detail
        ├── programs/[id]/session/[index] → Workout
        └── library/scan → QR scanner
```

### Key Screens

| Screen | Purpose | Features |
|--------|---------|----------|
| Sign In | User authentication | Email/password, guest access |
| Sign Up | Account creation | Email registration with validation |
| Home | Workout quick-start | Program selector, weekly activity feed |
| Library | Content management | Browse, create, edit exercises/programs, QR import |
| Progress | Statistics dashboard | Charts, heatmaps, PRs, streaks, weekly stats |
| Profile | User settings | Auth management, preferences, data export |
| Workout | Session execution | Timer, navigation, set tracking (1256 lines) |

---

## Workout Execution Flow

### Workout State Machine

```
START
  ↓
WARMUP
  ├─ Timer running
  ├─ Skip button
  └─ Complete → EXERCISE or END
  
EXERCISE
  ├─ Sets/reps tracking
  ├─ Rep/set skip
  └─ Complete → BREAK or EXERCISE or END
  
BREAK/REST
  ├─ Timer running
  ├─ Skip rest
  └─ Complete → EXERCISE or END
  
END
  └─ Call API recordWorkout()
  └─ Update DataContext
  └─ Update local progress
```

### Session State Persistence

When workout paused:
1. `DataContext.saveSessionState()` saves to storage
2. User can close app
3. On return, `DataContext.loadSessionState()` restores exact state
4. Workout resumes from same position

---

## Component Architecture Example

```
WorkoutExecutionScreen (Screen)
  └─ useWorkoutTimer() [Hook]
     ├─ Timer state management
     └─ useContext(DataContext) [State]
  └─ WorkoutPhaseView (Container)
     ├─ Timer Component
     ├─ StepIndicator Component
     ├─ ExerciseDisplay Component
     ├─ TimerControls Component
     └─ ProgressIndicator Component
```

### Component Composition Patterns

**Container + Presentational:**
```typescript
// Container with hooks
function ProgramProgressView({ programId }) {
  const { data: progress } = useProgramProgress(programId)
  return <ProgressCard data={progress} />
}

// Presentational (UI only)
function ProgressCard({ data }) {
  return <View>{/* render data */}</View>
}
```

---

## Performance Optimizations

### Code Splitting
- Expo Router automatic per-screen splitting
- Lazy load screens based on route

### Caching Strategies
- Firebase ID token cached, refreshed on expiry
- API responses cached in DataContext with version counters
- Search results cached with Map data structure
- Async data cached with useAsyncData hook

### Rendering Optimizations
- Skeleton screens for loading states
- Victory Native for optimized charts
- Platform-specific rendering
- Memoization of expensive computations

### Memory Management
- Session state cleared after workout completion
- Event history paginated (no longer stored locally)
- Large lists virtualized (FlatList)

---

## Security Considerations

### Authentication
- Firebase Auth handles credentials securely
- ID tokens used for API authentication
- Automatic token refresh before expiry
- No sensitive data in local storage

### Authorization
- Source-based permission model (builtin/user/pt)
- Owner-implicit data access
- Server-side validation enforced for all API operations

### Data Validation
- Client-side validation before persistence
- Type safety via TypeScript strict mode
- Schema validation for imports
- Dependency checking before deletions

### Audit Logging
- AuditLogger tracks all modifications
- Event logging for compliance
- Dependency checking prevents orphaned data

---

## API Contracts & Endpoints

### Exercise Endpoints
```
GET /api/v1/exercises
GET /api/v1/exercises/:id
GET /api/v1/exercises?category=strength
POST /api/v1/exercises
PUT /api/v1/exercises/:id
DELETE /api/v1/exercises/:id
```

### Workout Endpoints
```
GET /api/v1/workouts
GET /api/v1/workouts/:id
POST /api/v1/workouts
PUT /api/v1/workouts/:id
DELETE /api/v1/workouts/:id
```

### Stats Endpoints
```
POST /api/v1/stats/workouts          # Record completed workout
GET /api/v1/stats/prs                # Fetch personal records
GET /api/v1/stats/prs/:exerciseId    # Exercise-specific PRs
GET /api/v1/stats/progress           # Aggregated progress
GET /api/v1/stats/weekly             # Weekly statistics
GET /api/v1/stats/consistency        # Heatmap data
GET /api/v1/stats/exercises/:id/progression  # Exercise trends
```

---

## Testing Architecture

### Test Structure

```
__tests__/
├── lib/                # Utility testing
│   ├── validation.test.ts
│   ├── api.test.ts      # NEW: API client tests
│   └── mappers.test.ts  # NEW: Mapper tests
├── context/            # State management
│   ├── AuthContext.test.tsx  # NEW
│   ├── DataContext.test.tsx
│   └── dataReducer.test.ts
├── components/         # Component testing
│   └── forms/ (property-based tests)
└── integration/        # End-to-end flows
    ├── auth-flow.test.ts      # NEW
    ├── data-api-sync.test.ts  # NEW
    └── workout-execution.test.ts
```

### Testing Patterns

- **Unit Tests**: API client, validation, mappers
- **Component Tests**: Form validation, data management
- **Integration Tests**: Auth flow, data sync, workout execution
- **Property-Based Tests**: Complex business logic (fast-check)

---

## Deployment Architecture

### Web Deployment
```
expo export -p web  → Generates dist/
gh-pages deploy     → Publishes to GitHub Pages
```

### Mobile Deployment
```
EAS Build (Expo Application Services)
  ├─ iOS → App Store
  └─ Android → Play Store
```

### Environment Configuration

| Variable | Purpose | Example |
|----------|---------|---------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase config | (secret) |
| `EXPO_PUBLIC_API_BASE_URL` | Backend API URL | https://api.example.com |
| `EXPO_PUBLIC_API_ENABLED` | Enable API integration | true/false |
| `EXPO_PUBLIC_API_TIMEOUT` | Request timeout (ms) | 30000 |

---

## Summary of Major Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Data Source** | Local storage first | API first with fallback |
| **Challenges** | Supported feature | ❌ Completely removed |
| **Progress Model** | SessionProgress (complex) | WorkoutProgress (simple) |
| **Event System** | Pub-sub EventEmitter | ❌ Removed, API-driven |
| **Components** | 54 | 76 (+22 new) |
| **Hooks** | 25 | 30 (+5 new) |
| **Auth** | Optional Firebase | ✅ Required Firebase Auth |
| **Validation** | Basic | Enhanced with error codes |
| **Audit Logging** | None | ✅ Full audit trail |

---

## Conclusion

Progressive Workout's refactored architecture prioritizes:
- **API-Driven Design** for scalability and multi-device sync
- **Security** through Firebase Auth and server-side validation
- **Resilience** via graceful offline fallback
- **Developer Experience** with type safety and comprehensive validation
- **Extensibility** for future features without architectural changes

The system is designed for production deployment with comprehensive error handling, audit logging, and offline support.
