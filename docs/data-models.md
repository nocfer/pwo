# Data Models & Database Schema

## Overview

Progressive Workout uses a **type-driven data model** with TypeScript interfaces. Data is persisted to local storage (web) or Expo FileSystem (native), with **primary API backend** sync via Firebase. This document reflects the **refactored data model** with simplified progress tracking and removal of the challenge system.

---

## Core Entity Models

### Exercise

**File**: `types/exercise.ts`

```typescript
interface Exercise {
  id: string // Unique identifier
  name: string // Display name
  category: ExerciseCategory // Type classification
  icon: string // Ionicons glyph name
  source: ExerciseSource // Data origin (determines mutability)
  description?: string // Optional description
  instructions?: string // Form cues or technique notes
  media?: string // URL to image/video
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
}

type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'skill'
type ExerciseSource = 'builtin' | 'user' | 'pt' // builtin=read-only, user=editable, pt=trainer
```

**Storage Key**: `pwo.exercises` (local fallback)
**API Endpoints**: `GET/POST/PUT/DELETE /api/v1/exercises`

**Permissions**:

- `builtin`: Read-only (built-in exercises)
- `user`: Full CRUD (user-created)
- `pt`: Read-only (professional trainer)

**Examples**:

```json
{
  "id": "bench-press-1",
  "name": "Barbell Bench Press",
  "category": "strength",
  "icon": "barbell",
  "source": "builtin",
  "description": "Compound pressing movement",
  "instructions": "Feet on floor, shoulders pinned, controlled descent",
  "createdAt": "2026-03-01T00:00:00Z",
  "updatedAt": "2026-03-01T00:00:00Z"
}
```

---

### Program

**File**: `types/program.ts`

```typescript
interface Program {
  id: string // Unique program slug
  name: string // Display name
  description?: string // Program overview
  blocks: ProgramBlock[] // Ordered sequence of workout blocks
  source: ProgramSource // Data origin
  initialWarmup?: { seconds: number } // Default warmup duration
  defaultRestBetweenExercises: number // Default rest (seconds) between exercises
  createdAt: string
  updatedAt: string
}

type ProgramSource = 'builtin' | 'user' | 'pt'

interface ProgramBlock {
  type: 'exercise' | 'warmup' | 'break' | 'rest'

  // Exercise-specific fields (populated when type === 'exercise')
  exerciseId?: string // Reference to Exercise.id
  targetReps?: number | number[] // Target rep range or single value
  durationSeconds?: number // For timed work
  sets?: number // Number of sets (default: 1)
  restBetweenSets?: number // Rest between sets (seconds)
  note?: string // Form cue or loading note
}
```

**Storage Key**: `pwo.programs` (local fallback)
**API Endpoints**: `GET/POST/PUT/DELETE /api/v1/workouts`

**Example - Regular Program**:

```json
{
  "id": "full-body-a",
  "name": "Full Body A",
  "source": "user",
  "initialWarmup": { "seconds": 300 },
  "defaultRestBetweenExercises": 60,
  "blocks": [
    {
      "type": "warmup",
      "durationSeconds": 300
    },
    {
      "type": "exercise",
      "exerciseId": "bench-press-1",
      "sets": 4,
      "targetReps": [6, 8],
      "restBetweenSets": 90,
      "note": "Heavy day - heavier weight, fewer reps"
    },
    {
      "type": "rest",
      "durationSeconds": 60
    }
  ],
  "createdAt": "2026-03-01T12:00:00Z",
  "updatedAt": "2026-03-01T12:00:00Z"
}
```

---

## Progress Tracking Models (REFACTORED)

### ⚠️ Breaking Change: SessionProgress → WorkoutProgress

**Old Model (DELETED):**

```typescript
// ❌ SessionProgress - NO LONGER USED
interface SessionProgress {
  sessionId: string
  programId: string
  sessions: ProgramRun[] // Complex nested structure
  // ... complex fields
}
```

**New Model (SIMPLIFIED):**

```typescript
interface WorkoutProgress {
  workoutId: string // Unique ID for this workout instance
  programId: string // Reference to program
  completed: boolean // Completion flag
  completedAt?: string // When completed (ISO 8601)
  timeSpentSeconds?: number // Total duration
  exercises: ExerciseProgress[] // Per-exercise tracking
}
```

### WorkoutProgress

**File**: `types/progress.ts`

Individual workout completion record:

```typescript
interface WorkoutProgress {
  workoutId: string // Format: "{programId}_workout_{sessionIndex}"
  programId: string // Reference to program
  completed: boolean // Completion flag
  completedAt?: string // When completed (ISO 8601)
  timeSpentSeconds?: number // Total duration
  exercises: ExerciseProgress[] // Per-exercise tracking
}

interface ExerciseProgress {
  exerciseId: string // Exercise reference
  repsCompleted: number // Total reps (across all sets)
  setsCompleted: number // Sets finished
  sets?: SetRecord[] // Detailed per-set tracking
  totalVolume?: number // weight × reps (for weighted)
  lastCompletedAt: string // Timestamp
}

interface SetRecord {
  reps: number
  weight?: number // kg or lbs (undefined for bodyweight)
  isBodyweight: boolean
  timestamp: string // ISO date
}
```

**Storage Key**: `pwo.progress_history` (local fallback)
**API Endpoint**: `POST /api/v1/stats/workouts` (to record), `GET /api/v1/stats/progress` (to fetch)

**Example**:

```json
{
  "workoutId": "full-body-a_workout_0",
  "programId": "full-body-a",
  "completed": true,
  "completedAt": "2026-03-06T10:30:00Z",
  "timeSpentSeconds": 2400,
  "exercises": [
    {
      "exerciseId": "bench-press-1",
      "repsCompleted": 24,
      "setsCompleted": 4,
      "sets": [
        {
          "reps": 6,
          "weight": 225,
          "isBodyweight": false,
          "timestamp": "2026-03-06T10:05:00Z"
        },
        {
          "reps": 6,
          "weight": 225,
          "isBodyweight": false,
          "timestamp": "2026-03-06T10:08:00Z"
        }
      ],
      "totalVolume": 5400,
      "lastCompletedAt": "2026-03-06T10:30:00Z"
    }
  ]
}
```

### ProgramProgress

**File**: `types/progress.ts`

Aggregate statistics for a program:

```typescript
interface ProgramProgress {
  programId: string // Reference to Program.id
  workouts: WorkoutProgress[] // All completed workouts
  lifetimeWorkoutsCompleted: number // Total workouts for this program
  lifetimeTimeSpentSeconds: number // Total time invested
  lastActivityAt: string | null // ISO 8601 timestamp
  updatedAt: string // Last update time
}
```

**Storage Key**: `pwo.program_progress` (local fallback)
**API Endpoint**: `GET /api/v1/stats/progress`

**Example**:

```json
{
  "programId": "full-body-a",
  "lifetimeWorkoutsCompleted": 12,
  "lifetimeTimeSpentSeconds": 28800,
  "lastActivityAt": "2026-03-06T10:30:00Z",
  "workouts": [
    {
      "workoutId": "full-body-a_workout_0",
      "programId": "full-body-a",
      "completed": true,
      "completedAt": "2026-03-06T10:30:00Z",
      "timeSpentSeconds": 2400,
      "exercises": [
        /* ... */
      ]
    }
  ]
}
```

### PersonalRecord

**File**: `types/progress.ts`

Personal best records:

```typescript
interface PersonalRecord {
  id: string // Unique PR identifier
  exerciseId: string // Exercise reference
  type: PersonalRecordType // Type of record
  value: number // Record value
  achievedAt: string // When achieved (ISO 8601)
  workoutId?: string // Optional: which workout
  details?: {
    // Optional detailed info
    weight?: number
    reps?: number
  }
}

type PersonalRecordType =
  | 'max_weight' // Heaviest weight lifted
  | 'max_reps' // Most reps in single set
  | 'max_volume' // Total volume (weight × reps × sets)
  | 'estimated_1rm' // Estimated one-rep max
```

**Storage Key**: `pwo.personal_records` (local fallback)
**API Endpoint**: `GET /api/v1/stats/prs`

**⚠️ Breaking Change**: `sessionId` → `workoutId` in PersonalRecord.workoutId

**Example**:

```json
{
  "id": "pr-bench-1",
  "exerciseId": "bench-press-1",
  "type": "max_weight",
  "value": 225,
  "achievedAt": "2026-03-06T10:30:00Z",
  "workoutId": "full-body-a_workout_0",
  "details": {
    "weight": 225,
    "reps": 6
  }
}
```

---

## Statistics Models

### WeeklyStats

**File**: `types/progress.ts`

Aggregated weekly statistics:

```typescript
interface WeeklyStats {
  weekStart: string // ISO 8601 start of week (Monday)
  weekEnd: string // ISO 8601 end of week (Sunday)
  workoutsCompleted: number // Workouts this week
  workoutGoal: number // Target workouts per week
  totalTimeSeconds: number // Total workout duration
  totalVolume: number // Sum of (weight × reps × sets)
  totalReps: number // Sum of all reps
  exercisesPerformed: string[] // Unique exercise IDs
  currentStreak: number // Consecutive days ending this week
}

interface ExerciseStats {
  exerciseId: string
  totalReps: number // Reps this week
  totalSets: number // Sets this week
  totalVolume: number // Volume this week
  workoutCount: number // Times performed
}
```

**Storage Key**: `pwo.weekly_stats` (local fallback)
**API Endpoint**: `GET /api/v1/stats/weekly`

### ConsistencyData

**File**: `types/progress.ts`

Heatmap and streak data:

```typescript
interface ConsistencyData {
  dates: {
    [dateString: string]: number // ISO date → workout count (0 or 1)
  }
  currentStreak: number // Consecutive days with workout
  longestStreak: number // Longest streak on record
  lastWorkoutDate: string // Most recent workout (ISO 8601)
}
```

**Storage Key**: `pwo.progress_history` (local fallback)
**API Endpoint**: `GET /api/v1/stats/consistency`

---

## Session State (Transient)

### WorkoutState

**File**: `types/session.ts`

In-progress workout state (temporary):

```typescript
interface WorkoutState {
  programId: string
  sessionIndex: number

  // Current position
  currentPhaseIndex: number // Which phase (warmup, exercise, etc.)

  // Exercise-specific state
  currentSet: number // Current set number
  repsThisSet: number // Reps recorded for this set
  setsCompleted: number // Sets finished so far

  // Time tracking
  elapsedSeconds: number // Time on current phase
  isPaused: boolean // Pause flag

  // Context
  timestamp: string // When saved (ISO 8601)
}
```

**Storage Key**: `pwo.sessions`
**Lifecycle**: Saved when user pauses; cleared when workout completed

---

## Enhanced Data Types (NEW)

### File: `types/enhanced.ts`

Extended models with metadata and validation:

```typescript
// Enhanced Exercise Model
interface EnhancedExercise extends Exercise {
  description?: string
  instructions?: string
  muscleGroups?: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  equipment?: string[]
  tags?: string[]
  usageCount?: number
  lastUsed?: string
}

// Enhanced Program Model
interface EnhancedProgram extends Program {
  thumbnail?: string
  usageCount?: number
  lastUsed?: string
  averageRating?: number
}

// Validation Results
type ValidationResult = {
  isValid: boolean
  errors: ValidationError[]
  warnings?: ValidationWarning[]
}

type ValidationError = {
  field: string
  message: string
  code: ValidationErrorCode
  severity: 'error' | 'warning' | 'info'
}

enum ValidationErrorCode {
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  DUPLICATE_NAME = 'DUPLICATE_NAME',
  INVALID_REFERENCE = 'INVALID_REFERENCE',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS'
  // ... more codes
}

// Audit Logging
type AuditLogEntry = {
  id: string
  timestamp: string
  userId?: string
  action: AuditAction // CREATE, UPDATE, DELETE, IMPORT, EXPORT
  entityType: DataType // 'exercises' | 'programs'
  entityId: string
  changes?: Record<string, { from: any; to: any }>
}

enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT'
}
```

---

## ❌ DELETED Models

### Challenge System (Completely Removed)

The entire challenge system has been removed:

**Deleted Entities:**

- ❌ `ChallengeProgress` interface
- ❌ `ChallengeConfig` interface (on Program)
- ❌ `ChallengeSessions` type
- ❌ All challenge-related types and enums

**Deleted Components:**

- ❌ `components/challenge/` directory
- ❌ Challenge UI components
- ❌ Challenge progress tracking

**Migration Path:**

- Use **Programs** for structured workouts instead
- Use **PersonalRecords** for achievement tracking
- Create separate programs for progressive training

---

### Event System (Removed)

The pub-sub event system has been removed:

**Deleted:**

- ❌ `WorkoutEvent` interface
- ❌ `WorkoutEventType` enum
- ❌ `lib/events.ts` event emitter
- ❌ Event subscription patterns

**New Approach:**

- Direct API calls via `recordWorkout()` in `lib/api.ts`
- Context updates via DataContext version counters
- Optional detailed logging via audit system

---

## Type Relationships Diagram

```
Program
  ├── blocks[]
  │   └── exerciseId ──→ Exercise
  └── [challengeConfig removed]

WorkoutProgress
  ├── programId ──→ Program
  ├── workoutId (simple ID)
  └── exercises[]
      └── exerciseId ──→ Exercise

ProgramProgress
  └── workouts[] ──→ WorkoutProgress[]

PersonalRecord
  ├── exerciseId ──→ Exercise
  └── workoutId ──→ WorkoutProgress (CHANGED from sessionId)

WeeklyStats
  └── exerciseIds ──→ Exercise[]
```

---

## Data Constraints & Validation

### Exercise Constraints

- `name`: Required, minimum 3 characters, must be unique per source
- `category`: Must be one of 4 categories
- `icon`: Must be valid Ionicons glyph name
- `source`: Cannot be changed after creation

### Program Constraints

- `name`: Required, minimum 3 characters
- `blocks`: Minimum 1 block
- Exercise references must exist
- `defaultRestBetweenExercises`: >= 0
- ❌ `challengeConfig` no longer supported

### Progress Constraints

- `workoutId`: Must match format `{programId}_workout_{index}`
- Exercise IDs in progress must reference valid exercises
- `totalReps` = sum of sets completed
- Cannot complete if program/exercise no longer exists

---

## API Data Transformation (Mappers)

### File: `lib/mappers/workout.ts`

Bidirectional conversion between API and frontend models:

```typescript
// API uses array-based representation
interface APIWorkoutBlock {
  exerciseId: string
  reps: number[]          // [8, 8, 8, 8]
  rests: number[]         // [90, 90, 90]
  durations: number[]     // [0]
}

// Frontend uses scalar representation
interface ProgramBlock {
  type: 'exercise'
  exerciseId: string
  sets: number            // 4
  targetReps: number      // 8
  restBetweenSets: number // 90
}

// Mapper functions
workoutBlockToProgram(apiBlock): ProgramBlock
programToWorkoutBlock(block): APIWorkoutBlock
```

---

## Storage Examples

### Complete Workout Snapshot

```json
{
  "workoutId": "full-body-a_workout_0",
  "programId": "full-body-a",
  "completed": true,
  "completedAt": "2026-03-06T10:30:00Z",
  "timeSpentSeconds": 2400,
  "exercises": [
    {
      "exerciseId": "bench-press-1",
      "repsCompleted": 24,
      "setsCompleted": 4,
      "totalVolume": 5400,
      "lastCompletedAt": "2026-03-06T10:30:00Z"
    }
  ]
}
```

---

## Migration Path: Old → New

### SessionProgress → WorkoutProgress

**If you have stored data using the old SessionProgress model:**

1. Extract individual workout records from `sessions` array
2. Map each to new `WorkoutProgress` format
3. Flatten nested structure
4. Update `sessionId` references to `workoutId`
5. Update PersonalRecord references: `sessionId` → `workoutId`

**Example Migration:**

```typescript
// Old data
{
  sessionId: "session-1",
  sessions: [
    { completed: true, completedAt: "..." }
  ]
}

// New data
{
  workoutId: "full-body-a_workout_0",
  programId: "full-body-a",
  completed: true,
  completedAt: "..."
}
```

---

## Conclusion

The refactored data model:

- **Simplifies** progress tracking (WorkoutProgress replaces SessionProgress)
- **Removes complexity** (challenges, event system deleted)
- **Improves performance** with flattened structures
- **Maintains type safety** with comprehensive TypeScript
- **Supports auditing** with validation and audit logging
- **API-ready** with mappers for backend integration

All data is now stored on the backend API first, with local fallback for offline scenarios.
