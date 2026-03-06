# Progressive Workout - Architecture Documentation

## Executive Summary

Progressive Workout is a React Native mobile application built on Expo with Firebase backend integration. The architecture follows **component-based UI design** with **context-driven state management**, emphasizing offline-first data persistence and platform agnosticity.

**Key Architectural Principles:**
- **Component Isolation**: 54 reusable components, organized by feature domain
- **Context-Driven State**: Centralized state management through React Context API
- **Custom Hooks**: 25 specialized hooks for data fetching and session management
- **Unified Persistence**: Single storage layer abstraction for web and native platforms
- **Offline-First**: All features work without internet; Firebase sync is optional

---

## Technology Stack

### Runtime & Framework

```
React 19.1.0
    ↓
React Native 0.81.5 (native bridge)
    ↓
Expo 54.0.27 (development platform)
    └─→ Expo Router 6.0.17 (file-based routing)
```

### Core Dependencies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **UI Framework** | React | 19.1.0 | Component library |
| **Native** | React Native | 0.81.5 | Native bridge |
| **Platform** | Expo | ~54.0.27 | Build + run system |
| **Routing** | Expo Router | ~6.0.17 | File-based navigation |
| **Navigation** | React Navigation | 7.1.8 | Screen navigation |
| **Auth/DB** | Firebase | 12.8.0 | Backend services |
| **Language** | TypeScript | ~5.9.2 | Type safety |

### UI & Visualization

- **Victory Native** (41.20.2) - Charts and graphs
- **Expo Vector Icons** (15.0.3) - Ionicons library
- **React Native Reanimated** (~4.1.1) - Smooth animations
- **Expo Linear Gradient** (~15.0.8) - Gradient backgrounds
- **React Native SVG** (15.12.1) - Vector graphics

### Development

- **Vitest** (2.1.0) - Unit & integration testing
- **ESLint** (9.25.0) - Code linting
- **Prettier** - Code formatting (no semicolons, single quotes)

---

## Application Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────┐
│   Screens / Views (21 screens in app/)          │
│   Route-based UI entry points                   │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│   Reusable Components (54 components)           │
│   Button, Card, List, Form, Chart, etc.        │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│   Custom Hooks (25 hooks)                       │
│   Data fetching, session management             │
│   - usePrograms, useProgramProgress             │
│   - useWorkoutTimer, useAsyncData               │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│   Context Providers (2 contexts)                │
│   AuthContext (Firebase auth)                   │
│   DataContext (CRUD + state)                    │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│   Storage Layer (lib/storage.ts)                │
│   Unified API for web/native                    │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│   Persistence Backends                          │
│   └─ Web: localStorage                          │
│   └─ Native: Expo FileSystem                    │
│   └─ Remote: Firebase                           │
└─────────────────────────────────────────────────┘
```

### Component Organization

```
components/
├── common/        # Atomic UI (Button, Card, Input, etc.)
├── auth/          # Authentication-specific (AuthLayout, etc.)
├── program/       # Program execution (WorkoutExecutionScreen, etc.)
├── progress/      # Progress visualization (Charts, Heatmaps, etc.)
├── data/          # Data management (Forms, Lists, CRUD UI)
├── challenge/     # Challenge-specific
└── cards/         # Card components
```

### Hooks Organization

```
hooks/
├── data/          # Data fetching (17 hooks)
│   ├── usePrograms           # Load all programs
│   ├── useProgramProgress    # Get program stats
│   ├── usePRs                # Load personal records
│   ├── useWeeklyStats        # Aggregate weekly data
│   └── ... (13 more)
├── session/       # Workout execution (4 hooks)
│   ├── useWorkoutTimer       # Timer logic (637+ lines)
│   ├── useWorkoutSteps       # Convert blocks to steps
│   └── useStepCompletion     # Step navigation
└── useAsyncData              # Generic async hook
```

---

## State Management Architecture

### Context Structure

#### **AuthContext** (`context/AuthContext.tsx`)

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
- Session persistence
- Haptic feedback on actions

#### **DataContext** (`context/DataContext.tsx` - 1518 lines)

```typescript
type DataContextValue = {
  // Data
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
  completeSession(workoutId, progress)
  recordEvent(slug, sessionIndex, event)
  upsertExercise(data)
  upsertProgram(data)
  saveSessionState(state)
  loadSessionState()
  ... (20+ more actions)
}
```

**Key Features:**
- **Reducer pattern** for complex state mutations
- **CRUD operations** (exercises, programs, challenges)
- **Event recording** for granular workout tracking
- **Progress calculations** (streaks, PRs, statistics)
- **Session persistence** for pause/resume
- **Data export/import** for portability

### Data Flow Pattern

```
Component
    ↓ (call hook)
useProgram()
    ↓ (subscribe to context)
DataContext
    ↓ (reducer actions)
State Update
    ↓ (storage sync)
Storage (localStorage/FileSystem)
    ↓ (optional)
Firebase (if authenticated)
```

### Loose Coupling via Version Counters

Instead of direct notifications, DataContext uses version counters:

```typescript
// In component
const { progressVersion } = useContext(DataContext)
const { data: progress } = useAsyncData(
  () => fetchProgress(),
  [progressVersion]  // Re-run when version changes
)

// In DataContext
const completeSession = (data) => {
  // ... save progress ...
  setProgressVersion(v => v + 1)  // Trigger all subscribers
}
```

**Benefit:** Components don't know about each other; updates cascade through subscriptions.

---

## Data Models & Schema

### Core Entities

#### Exercise

```typescript
interface Exercise {
  id: string                              // Unique ID
  name: string                            // Exercise name
  category: 'strength' | 'cardio' | ...   // Category
  icon: string                            // Ionicons glyph
  source: 'builtin' | 'user' | 'pt'      // Source type (read-only vs editable)
  description?: string
  instructions?: string
  media?: string                          // URL to image/video
  createdAt: ISO8601
  updatedAt: ISO8601
}
```

#### Program

```typescript
interface Program {
  id: string
  name: string
  description?: string
  blocks: ProgramBlock[]                  // Sequence of work
  source: 'builtin' | 'user' | 'pt'
  challengeConfig?: ChallengeConfig       // If present, is challenge
  initialWarmup?: { seconds: number }
  defaultRestBetweenExercises: number
  createdAt: ISO8601
  updatedAt: ISO8601
}

interface ProgramBlock {
  type: 'exercise' | 'warmup' | 'break' | 'rest'
  // Exercise-specific
  exerciseId?: string
  targetReps?: number | number[]
  durationSeconds?: number
  sets?: number
  restBetweenSets?: number
  note?: string
}
```

#### Progress Tracking

```typescript
interface ProgramProgress {
  programId: string
  workouts: WorkoutProgress[]             // Sessions completed
  lifetimeWorkoutsCompleted: number
  lifetimeTimeSpentSeconds: number
  lastActivityAt: ISO8601
}

interface WorkoutProgress {
  workoutId: string                       // Format: slug_workout_index
  completed: boolean
  completedAt?: ISO8601
  timeSpentSeconds: number
  exercises: ExerciseProgress[]
}

interface ExerciseProgress {
  exerciseId: string
  repsCompleted: number
  setsCompleted: number
  lastCompletedAt: ISO8601
}
```

#### Challenge Tracking

```typescript
interface ChallengeProgress {
  challengeId: string
  workouts: WorkoutProgress[]
  totalRepsCompleted: number              // Accumulator
  targetReps: number                      // Goal
  completedAt?: ISO8601
}

interface ChallengeConfig {
  exerciseId: string
  sets: number
  initialReps?: number
  targetReps: number                      // Total to complete
  weeklyIncreasePercent: number           // Auto-progression
}
```

#### Personal Records

```typescript
interface PersonalRecord {
  id: string
  exerciseId: string
  type: 'max_weight' | 'max_reps' | 'max_volume' | 'estimated_1rm'
  value: number
  achievedAt: ISO8601
  workoutId?: string                      // Context of achievement
}
```

---

## Storage Architecture

### Unified Storage Layer (`lib/storage.ts` - 950+ lines)

```
Application Code
        ↓
StorageService.ts (unified API)
        ├→ Web Branch: localStorage
        ├→ Native Branch: Expo FileSystem
        └→ Platform Detection: Platform.OS
```

### Storage Keys

| Key | Purpose | Type |
|-----|---------|------|
| `pwo.exercises` | User/imported exercises | JSON |
| `pwo.programs` | User programs | JSON |
| `pwo.program_progress` | Lifetime program stats | JSON |
| `pwo.challenge_progress` | Challenge tracking | JSON |
| `pwo.progress_history` | Historical workouts | JSON |
| `pwo.personal_records` | PRs database | JSON |
| `pwo.weekly_stats` | Aggregated weekly data | JSON |
| `pwo.sessions` | Current session state | JSON |
| `pwo.events` | Workout event log | JSON |

### Storage Operations

```typescript
// Exercise CRUD
loadExercises(): Promise<Exercise[]>
upsertExercise(data): Promise<Exercise>
deleteExercise(id): Promise<void>

// Program CRUD
loadPrograms(): Promise<Program[]>
upsertProgram(data): Promise<Program>
deleteProgram(id): Promise<void>

// Progress Management
saveProgramProgress(data): Promise<void>
loadProgramProgress(): Promise<ProgramProgress>
detectAndSavePRs(progress): Promise<PersonalRecord[]>

// Session State
saveSessionState(state): Promise<void>
loadSessionState(): Promise<WorkoutState | null>
clearSessionState(): Promise<void>
```

### Platform Abstraction

**Web (localStorage):**
```typescript
// Direct key-value store
localStorage.setItem('pwo.exercises', JSON.stringify(data))
```

**Native (Expo FileSystem):**
```typescript
// File-based store in DocumentDirectory
await FileSystem.writeAsStringAsync(
  `${DocumentDirectory}/pwo.exercises.json`,
  JSON.stringify(data)
)
```

---

## API Integration Architecture

### Optional Backend API (`lib/api.ts`)

The application supports an optional backend API for:
- Syncing exercises from professional trainer
- Custom program library
- Advanced statistics
- User sync across devices

**Feature Flag:** `EXPO_PUBLIC_API_ENABLED`

```typescript
// API Client
class APIClient {
  async fetchExercises(): Promise<Exercise[]>
  async createExercise(data): Promise<Exercise>
  async updateExercise(id, data): Promise<Exercise>
  async deleteExercise(id): Promise<void>
  // ... similar for programs, progress, etc.
}
```

**Authentication:** Firebase ID tokens in Bearer header

```typescript
Authorization: Bearer {firebase_id_token}
```

**Error Handling:** Custom APIError class with user-friendly messages

**Timeout:** 30 seconds (configurable via `EXPO_PUBLIC_API_TIMEOUT`)

### Firebase Integration

**Authentication:**
- Email/password via `firebase/auth`
- Anonymous guest access
- Account linking

**Database:**
- Optional Realtime Database for sync
- User-scoped data (implicit ownership)
- Fallback to local storage if offline

---

## Screen & Navigation Architecture

### File-Based Routing (Expo Router 6.0.17)

```
app/
├── _layout.tsx           # Root providers
├── index.tsx             # Auth routing
├── (tabs)/               # Tab group
│   ├── _layout.tsx       # 4-tab config
│   ├── index.tsx         # Home
│   ├── library.tsx       # Library
│   ├── progress.tsx      # Stats
│   └── profile.tsx       # Settings
├── (auth)/               # Auth group
│   ├── sign-in.tsx
│   └── sign-up.tsx
├── programs/
│   ├── [id].tsx          # Detail
│   └── [id]/session/[index].tsx  # Execution
└── library/
    ├── exercises/
    ├── programs/
    ├── challenges/
    ├── scan.tsx          # QR scanner
    └── import/
```

### Navigation Structure

```
Root
├── Authenticated User
│   └── (tabs) [Bottom Tab Navigation]
│       ├── Home
│       ├── Library
│       ├── Progress
│       └── Profile
│       └── Deep Link: programs/[id]/session/[index]
│
└── Unauthenticated User
    └── (auth) [Stack Navigation]
        ├── Sign In (with Guest option)
        └── Sign Up
```

### Key Screens

| Screen | Purpose | Key Features |
|--------|---------|--------------|
| Home | Workout quick-start | Program selector, weekly activity |
| Library | Content management | Browse, create, edit exercises/programs |
| Progress | Statistics dashboard | Charts, heatmaps, PRs, streaks |
| Profile | User settings | Auth, preferences, data management |
| Workout | Session execution | Timer, navigation, event tracking (1256 lines) |

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
  └─ Completion with stats
```

### useWorkoutTimer Hook (637+ lines)

The `useWorkoutTimer` hook manages:

```typescript
{
  // Current state
  currentPhaseIndex: number              // Which step
  phase: WorkoutPhase                    // Current phase (warmup, exercise, etc.)
  elapsedSeconds: number                 // Timer countdown
  
  // Counters
  currentSet: number                     // Set number
  repsThisSet: number                    // Reps entered
  setsCompleted: number                  // Completed sets
  
  // Controls
  togglePause(): void                    // Pause/resume timer
  skipPhase(): void                      // Skip current phase
  jumpToPhase(index): void               // Free navigation
  completeExercise(): void               // Mark set done
  addRep(): void                         // Increment reps
  removeRep(): void                      // Decrement reps
  
  // UI State
  isPaused: boolean
  canSkip: boolean
  isPhaseCompleted: boolean
}
```

### Session State Persistence

When workout paused:
1. `DataContext.saveSessionState()` saves to storage
2. User can close app
3. On return, `DataContext.loadSessionState()` restores exact state
4. Workout resumes from same position

---

## Component Architecture

### Component Hierarchy Example

```
WorkoutExecutionScreen (Screen)
  └─ WorkoutPhaseView (Container)
     ├─ Timer Component
     ├─ StepIndicator Component
     ├─ ExerciseDisplay Component
     │  ├─ ExerciseName (Text)
     │  ├─ ExerciseIcon (Icon)
     │  └─ ExerciseInstructions (Text)
     ├─ TimerControls Component
     │  ├─ Button (Pause/Resume)
     │  ├─ Button (Skip)
     │  ├─ Button (Complete)
     │  └─ Button (Jump To)
     └─ ProgressIndicator Component
```

### Component Composition Patterns

**Presentational + Container:**
```typescript
// Container (hooks, logic)
function ProgramProgressView({ programId }) {
  const { data: progress } = useProgramProgress(programId)
  return <ProgressCard data={progress} />
}

// Presentational (UI only)
function ProgressCard({ data }) {
  return <View>{/* render data */}</View>
}
```

**Variant Pattern:**
```typescript
// Reusable with variants
<Button variant="primary" size="md" />
<Button variant="secondary" size="lg" />
<Button variant="ghost" size="sm" />
```

---

## Validation & Permissions

### Validation Layer (`lib/validation.ts` - 1070+ lines)

```typescript
// Exercise validation
validateExercise(data): ValidationResult
  ├─ Name is required & unique
  ├─ Category is valid
  ├─ Icon is valid Ionicons glyph
  └─ Returns errors or validated data

// Program validation
validateProgram(data): ValidationResult
  ├─ Has at least one block
  ├─ Exercise references are valid
  ├─ Rest/break values are positive
  └─ Block structure is valid

// Challenge config validation
validateChallengeConfig(config): ValidationResult
  ├─ Exercise exists
  ├─ Rep/set calculations valid
  ├─ Warmup/break >= 0
  └─ Auto-progression > 0
```

### Permission System

```typescript
// Source types with different permissions
'builtin'  → Read-only (cannot modify/delete)
'user'     → Full CRUD (owner)
'pt'       → Read-only, cannot delete if in use

// Permission check
function validateModificationPermissions(
  source: 'builtin' | 'user' | 'pt',
  action: 'edit' | 'delete'
): boolean {
  // Enforce permissions before mutations
}
```

---

## Event System

### Pub-Sub Pattern

```typescript
// Custom event emitter for cross-component communication
class EventEmitter<T> {
  subscribe(callback: (event: T) => void): () => void
  emit(event: T): void
}

// Usage
const sessionEvents = new EventEmitter<SessionEvent>()

// Subscribe
sessionEvents.subscribe((event) => {
  console.log('Workout:', event.type)
})

// Publish
sessionEvents.emit({
  type: 'SET_COMPLETED',
  timestamp: new Date(),
  data: { setNumber: 1, reps: 12 }
})
```

### Event Types

- `SESSION_COMPLETED` - Workout finished
- `PROGRESS_UPDATED` - Progress changed
- `EVENT_RECORDED` - Workout event logged
- `SESSION_STATE_CHANGED` - State persisted

---

## Performance Optimizations

### Code Splitting
- Expo Router automatic per-screen splitting
- LazyLoad screens based on route

### Caching Strategies
- Firebase ID token cached, refreshed on expiry
- Search results cached with Map data structure
- Async data cached with useAsyncData hook

### Rendering Optimizations
- Skeleton screens for loading states
- Victory Native for optimized charts
- Platform-specific rendering

### Memory Management
- Session state cleared after workout completion
- Event history paginated
- Large lists virtualized (FlatList)

---

## Security Considerations

### Authentication
- Firebase Auth handles credentials
- ID tokens used for API auth
- Automatic token refresh

### Authorization
- Source-based permission model
- Owner-implicit data access
- Server-side validation recommended for API

### Data Validation
- Client-side validation before persistence
- Type safety via TypeScript
- Schema validation for imports

### Audit Logging
- AuditLogger tracks modifications
- Event logging for compliance
- Dependency checking prevents orphaned data

---

## Testing Architecture

### Test Structure

```
__tests__/
├── lib/                # Utility testing
│   ├── validation.test.ts
│   ├── storage.test.ts
│   └── events.test.ts
├── context/            # State management
│   ├── DataContext.test.tsx
│   └── dataReducer.test.ts
├── components/         # Component testing
│   └── forms/ (property-based tests)
└── integration/        # End-to-end flows
    ├── data-context-integration.test.ts
    └── program-execution-*.test.ts
```

### Testing Patterns

- **Unit Tests**: Utilities, validation, storage
- **Component Tests**: Form validation, data management
- **Integration Tests**: Data flow, workout execution
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
| `EXPO_PUBLIC_API_BASE_URL` | Backend API | https://api.example.com |
| `EXPO_PUBLIC_API_ENABLED` | Enable API | true/false |
| `EXPO_PUBLIC_API_TIMEOUT` | Request timeout | 30000 |

---

## Conclusion

Progressive Workout's architecture prioritizes:
- **Modularity** through components and custom hooks
- **Offline-first** with optional cloud sync
- **Type safety** with TypeScript strict mode
- **Performance** through optimization and caching
- **Maintainability** with clear separation of concerns

The system is designed for extensibility, allowing addition of features like cloud sync, advanced analytics, or third-party integrations without architectural changes.
