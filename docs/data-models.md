# Data Models & Database Schema

## Overview

Progressive Workout uses a **type-driven data model** with TypeScript interfaces. Data is persisted to local storage (web) or Expo FileSystem (native), with optional Firebase Realtime Database sync.

---

## Core Entity Models

### Exercise

**File**: `types/exercise.ts`

```typescript
interface Exercise {
  id: string                              // Unique identifier
  name: string                            // Display name
  category: ExerciseCategory              // Type classification
  icon: string                            // Ionicons glyph name
  source: ExerciseSource                  // Data origin (determines mutability)
  description?: string                    // Optional description
  instructions?: string                   // Form cues or technique notes
  media?: string                          // URL to image/video
  createdAt: string                       // ISO 8601 timestamp
  updatedAt: string                       // ISO 8601 timestamp
}

type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'skill'
type ExerciseSource = 'builtin' | 'user' | 'pt'  // builtin=read-only, user=editable, pt=trainer
```

**Storage Key**: `pwo.exercises`

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
  id: string                              // Unique program slug
  name: string                            // Display name
  description?: string                    // Program overview
  blocks: ProgramBlock[]                  // Ordered sequence of workout blocks
  source: ProgramSource                   // Data origin
  challengeConfig?: ChallengeConfig       // If present, program is a challenge
  initialWarmup?: { seconds: number }     // Default warmup duration
  defaultRestBetweenExercises: number     // Default rest (seconds) between exercises
  createdAt: string
  updatedAt: string
}

type ProgramSource = 'builtin' | 'user' | 'pt'

interface ProgramBlock {
  type: 'exercise' | 'warmup' | 'break' | 'rest'
  
  // Exercise-specific fields (populated when type === 'exercise')
  exerciseId?: string                     // Reference to Exercise.id
  targetReps?: number | number[]          // Target rep range or single value
  durationSeconds?: number                // For timed work
  sets?: number                           // Number of sets (default: 1)
  restBetweenSets?: number                // Rest between sets (seconds)
  note?: string                           // Form cue or loading note
}

interface ChallengeConfig {
  exerciseId: string                      // Exercise to use
  sets: number                            // Sets per workout
  initialReps?: number                    // Starting reps (if auto-set)
  targetReps: number                      // Total reps to complete in challenge
  warmUpSeconds: number                   // Warmup before sets
  breakSeconds: number                    // Rest between sets
  weeklyIncreasePercent: number           // Auto-progression (e.g., 10%)
}
```

**Storage Key**: `pwo.programs`

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

**Example - Challenge Program**:
```json
{
  "id": "50-pushups-challenge",
  "name": "50 Pushups Challenge",
  "source": "builtin",
  "challengeConfig": {
    "exerciseId": "pushup-1",
    "sets": 5,
    "initialReps": 10,
    "targetReps": 50,
    "warmUpSeconds": 60,
    "breakSeconds": 60,
    "weeklyIncreasePercent": 10
  },
  "blocks": [
    {"type": "warmup", "durationSeconds": 60},
    {"type": "exercise", "exerciseId": "pushup-1", "sets": 5, "targetReps": 10},
    {"type": "rest", "durationSeconds": 60}
  ],
  "createdAt": "2026-03-01T00:00:00Z",
  "updatedAt": "2026-03-01T00:00:00Z"
}
```

---

## Progress Tracking Models

### ProgramProgress

**File**: `types/progress.ts`

```typescript
interface ProgramProgress {
  programId: string                       // Reference to Program.id
  workouts: WorkoutProgress[]             // All completed sessions
  lifetimeWorkoutsCompleted: number       // Total workouts for this program
  lifetimeTimeSpentSeconds: number        // Total time invested
  lastActivityAt: string                  // ISO 8601 timestamp
  updatedAt: string                       // Last update time
}

interface WorkoutProgress {
  workoutId: string                       // Format: "{programId}_workout_{sessionIndex}"
  programId: string                       // Reference to program
  completed: boolean                      // Completion flag
  completedAt?: string                    // When completed (ISO 8601)
  timeSpentSeconds: number                // Total duration
  exercises: ExerciseProgress[]           // Per-exercise tracking
}

interface ExerciseProgress {
  exerciseId: string                      // Exercise reference
  repsCompleted: number                   // Total reps (across all sets)
  setsCompleted: number                   // Sets finished
  lastCompletedAt: string                 // Timestamp
}
```

**Storage Key**: `pwo.program_progress`

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
        {
          "exerciseId": "bench-press-1",
          "repsCompleted": 24,
          "setsCompleted": 4,
          "lastCompletedAt": "2026-03-06T10:30:00Z"
        }
      ]
    }
  ]
}
```

### ChallengeProgress

**File**: `types/progress.ts`

```typescript
interface ChallengeProgress {
  challengeId: string                     // Reference to Program with challengeConfig
  workouts: WorkoutProgress[]             // Sessions for this challenge
  totalRepsCompleted: number              // Accumulator toward target
  targetReps: number                      // Goal reps
  completedAt?: string                    // When challenge completed
  startedAt: string                       // When started
  lastActivityAt: string                  // Most recent activity
}
```

**Storage Key**: `pwo.challenge_progress`

**Example**:
```json
{
  "challengeId": "50-pushups-challenge",
  "totalRepsCompleted": 150,
  "targetReps": 50,
  "startedAt": "2026-03-01T00:00:00Z",
  "lastActivityAt": "2026-03-06T10:30:00Z",
  "workouts": [
    {
      "workoutId": "50-pushups-challenge_workout_0",
      "completed": true,
      "completedAt": "2026-03-01T10:00:00Z",
      "timeSpentSeconds": 1200,
      "exercises": [
        {
          "exerciseId": "pushup-1",
          "repsCompleted": 50,
          "setsCompleted": 5,
          "lastCompletedAt": "2026-03-01T10:00:00Z"
        }
      ]
    }
  ]
}
```

---

### PersonalRecord

**File**: `types/progress.ts`

```typescript
interface PersonalRecord {
  id: string                              // Unique PR identifier
  exerciseId: string                      // Exercise reference
  type: PersonalRecordType                // Type of record
  value: number                           // Record value (weight, reps, volume, etc.)
  achievedAt: string                      // When achieved (ISO 8601)
  workoutId?: string                      // Optional: which workout established it
}

type PersonalRecordType = 
  | 'max_weight'                          // Heaviest weight lifted
  | 'max_reps'                            // Most reps in single set
  | 'max_volume'                          // Total volume (weight × reps × sets)
  | 'estimated_1rm'                       // Estimated one-rep max
```

**Storage Key**: `pwo.personal_records`

**Example**:
```json
{
  "id": "pr-bench-1",
  "exerciseId": "bench-press-1",
  "type": "max_weight",
  "value": 225,
  "achievedAt": "2026-03-06T10:30:00Z",
  "workoutId": "full-body-a_workout_0"
}
```

---

## Event Tracking

### WorkoutEvent

**File**: `types/events.ts`

```typescript
interface WorkoutEvent {
  ts: string                              // Timestamp (ISO 8601)
  slug: string                            // Program ID
  sessionIndex: number                    // Session number
  type: WorkoutEventType                  // Event classification
  data?: Record<string, unknown>          // Event-specific payload
}

type WorkoutEventType =
  // Warmup events
  | 'warmup_started'
  | 'warmup_paused'
  | 'warmup_resumed'
  | 'warmup_skipped'
  | 'warmup_completed'
  
  // Set events
  | 'set_completed'
  | 'set_skipped'
  
  // Break events
  | 'break_started'
  | 'break_paused'
  | 'break_resumed'
  | 'break_skipped'
  | 'break_completed'
  
  // Session events
  | 'session_completed'
  | 'step_jumped_to'
  | 'step_repeated'
```

**Storage Key**: `pwo.events`

**Example**:
```json
{
  "ts": "2026-03-06T10:30:00Z",
  "slug": "full-body-a",
  "sessionIndex": 0,
  "type": "set_completed",
  "data": {
    "exerciseId": "bench-press-1",
    "setNumber": 1,
    "reps": 8,
    "weight": 225
  }
}
```

---

## Statistics Models

### WeeklyStats

**File**: `types/progress.ts`

```typescript
interface WeeklyStats {
  weekStart: string                       // ISO 8601 start of week (Monday)
  weekEnd: string                         // ISO 8601 end of week (Sunday)
  workoutsCompleted: number               // Workouts this week
  totalTimeSeconds: number                // Total workout duration
  exercisesCompleted: ExerciseStats[]     // Per-exercise stats
  programIds: string[]                    // Programs trained this week
}

interface ExerciseStats {
  exerciseId: string
  totalReps: number                       // Reps this week
  totalSets: number                       // Sets this week
  totalVolume: number                     // Volume (weight × reps × sets)
  workoutCount: number                    // Times performed
}
```

**Storage Key**: `pwo.weekly_stats`

### ConsistencyData

**File**: `types/progress.ts`

```typescript
interface ConsistencyData {
  dates: {
    [dateString: string]: number          // ISO date → workout count (0 or 1)
  }
  currentStreak: number                   // Consecutive days with workout
  longestStreak: number                   // Longest streak on record
  lastWorkoutDate: string                 // Most recent workout (ISO 8601)
}
```

**Storage Key**: `pwo.progress_history`

---

## Session State (Transient)

### WorkoutState

**File**: `types/session.ts`

```typescript
interface WorkoutState {
  programId: string
  sessionIndex: number
  
  // Current position
  currentPhaseIndex: number               // Which phase (warmup, exercise, etc.)
  
  // Exercise-specific state
  currentSet: number                      // Current set number
  repsThisSet: number                     // Reps recorded for this set
  setsCompleted: number                   // Sets finished so far
  
  // Time tracking
  elapsedSeconds: number                  // Time on current phase
  isPaused: boolean                       // Pause flag
  
  // Context
  timestamp: string                       // When saved (ISO 8601)
}
```

**Storage Key**: `pwo.sessions`

**Lifecycle**: Saved when user pauses; cleared when workout completed

---

## Type Relationships Diagram

```
Program
  ├── blocks[]
  │   └── exerciseId ──→ Exercise
  └── challengeConfig? ──→ ChallengeConfig

WorkoutProgress
  ├── programId ──→ Program
  └── exercises[]
      └── exerciseId ──→ Exercise

ProgramProgress
  └── workouts[] ──→ WorkoutProgress

ChallengeProgress
  ├── challengeId ──→ Program (with challengeConfig)
  └── workouts[] ──→ WorkoutProgress

PersonalRecord
  └── exerciseId ──→ Exercise

WorkoutEvent
  ├── slug ──→ Program.id
  └── data.exerciseId? ──→ Exercise
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
- If `challengeConfig` present:
  - `exerciseId` must exist
  - `targetReps` > 0
  - `weeklyIncreasePercent` > 0

### Progress Constraints
- `workoutId`: Must match format `{programId}_workout_{index}`
- Exercise IDs in progress must reference valid exercises
- `totalReps` = sum of sets completed
- Cannot complete if program/exercise no longer exists

---

## Migration & Versioning

### Schema Version
Current: v1.0

### Future Considerations
- Add `version` field to all model roots for schema tracking
- Implement migration helpers for data structure changes
- Maintain backward compatibility with older formats

---

## Storage Examples

### Complete Workout Snapshot

```json
{
  "program": {
    "id": "full-body-a",
    "name": "Full Body A",
    "blocks": [
      {"type": "warmup", "durationSeconds": 300},
      {"type": "exercise", "exerciseId": "bench-1", "sets": 4, "targetReps": [6, 8]}
    ]
  },
  "progress": {
    "workoutsCompleted": 12,
    "lastWorkout": "2026-03-06T10:30:00Z"
  },
  "prs": [
    {"exercise": "bench-1", "type": "max_weight", "value": 225}
  ],
  "events": [
    {"ts": "2026-03-06T10:30:00Z", "type": "set_completed", "data": {"reps": 8}}
  ]
}
```

---

## Conclusion

The data model is designed for:
- **Flexibility**: Support exercises, programs, challenges, and custom tracking
- **Traceability**: Detailed event logs for analysis
- **Offline-first**: All data persists locally
- **Optional sync**: Firebase integration without requiring it
- **Type safety**: TypeScript ensures consistency

