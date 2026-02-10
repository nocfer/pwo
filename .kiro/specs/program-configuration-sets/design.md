# Design Document: Program Configuration with Sets and Rest Timers

## Overview

This design extends the program configuration system to support more granular control over workout structure. The system will support:

1. **Initial Warmup** - An optional, visually distinct warmup block at the start of programs
2. **Default Rest Timer** - A global setting for rest between exercises
3. **Sets and Rest Between Sets** - Per-exercise configuration for number of sets and rest duration between them
4. **Block Expansion** - Automatic expansion of exercise blocks into multiple blocks (one per set) with rest periods inserted during execution

The implementation maintains the existing visual design while adding new configuration options through additional UI elements (buttons/menus).

## Architecture

### Data Model Extensions

The `Program` type will be extended to include:

```typescript
type Program = {
  // ... existing fields
  initialWarmup?: {
    seconds: number
  }
  defaultRestBetweenExercises?: number // in seconds
}

type ProgramExerciseBlock = {
  // ... existing fields
  sets?: number // defaults to 1
  restBetweenSets?: number // in seconds, defaults to 60
}
```

### Block Expansion Logic

During program execution, the system will expand exercise blocks into multiple steps:

**Input:**

- Exercise block: Push-ups, 10 reps, 3 sets, 30 sec rest between sets
- Default rest between exercises: 60 sec

**Output (expanded steps):**

1. Push-ups - 10 reps (Set 1 of 3)
2. Rest - 30 seconds
3. Push-ups - 10 reps (Set 2 of 3)
4. Rest - 30 seconds
5. Push-ups - 10 reps (Set 3 of 3)
6. Rest - 60 seconds (between exercises)

### Component Architecture

#### ProgramForm Component Updates

The existing `ProgramForm` component will be extended with:

1. **Initial Warmup Option** - Accessible via an existing button (not a separate field)
   - When activated, displays warmup configuration at the top
   - Can be toggled on/off without affecting other blocks

2. **Rest Configuration Option** - Accessible via a rest button or menu
   - Allows configuration of default rest between exercises
   - Appears as an additional option when triggered

3. **Exercise Block Extensions** - Each exercise block will include:
   - Sets field (defaults to 1)
   - Rest Between Sets field (defaults to 60 seconds)

#### ProgramSessionView Component Updates

The `ProgramSessionView` component will display expanded blocks:

1. **Warmup Display** - Distinct visual styling with warmup color
2. **Exercise Display** - Shows set information (e.g., "Set 1 of 3")
3. **Rest Display** - Shows rest duration and context (between sets or between exercises)

#### useWorkoutSteps Hook Updates

The `useWorkoutSteps` hook will be extended to:

1. Accept configuration for sets and rest periods
2. Expand exercise blocks into multiple steps based on sets configuration
3. Insert rest blocks between sets and between exercises
4. Apply default rest timer between exercises

## Components and Interfaces

### Updated Type Definitions

```typescript
// In types/program.ts

export type ProgramExerciseBlock = {
  type: 'exercise'
  exerciseId: string
  targetReps?: number
  durationSeconds?: number
  note?: string
  sets?: number // NEW: defaults to 1
  restBetweenSets?: number // NEW: in seconds, defaults to 60
}

export type Program = {
  id: string
  name: string
  description?: string
  blocks: ProgramBlock[]
  createdAt: string
  updatedAt: string
  source: ProgramSource
  challengeConfig?: ChallengeConfig
  initialWarmup?: {
    // NEW
    seconds: number
  }
  defaultRestBetweenExercises?: number // NEW: in seconds
}
```

### ProgramForm Component

**New Props/State:**

- `showWarmupConfig: boolean` - Toggle for warmup configuration
- `defaultRestBetweenExercises: string` - Global rest timer value
- `blockSets: Map<number, number>` - Sets per exercise block
- `blockRestBetweenSets: Map<number, number>` - Rest between sets per block

**New Methods:**

- `toggleWarmupConfig()` - Show/hide warmup configuration
- `toggleRestConfig()` - Show/hide rest configuration
- `updateDefaultRest(value: string)` - Update global rest timer
- `updateBlockSets(index: number, value: string)` - Update sets for a block
- `updateBlockRestBetweenSets(index: number, value: string)` - Update rest between sets

**UI Changes:**

- Add button to toggle Initial Warmup configuration
- Add button/menu to configure Default Rest Between Exercises
- Add "Sets" and "Rest Between Sets" fields to exercise blocks
- Display defaults in placeholder text

### useWorkoutSteps Hook

**New Logic:**

- Extract sets and rest configuration from exercise blocks
- For each exercise block with sets > 1:
  - Create one step per set with set number label
  - Insert rest block between consecutive sets
  - Insert rest block between different exercises using default rest timer

**Example Expansion:**

```typescript
// Input blocks:
;[
  { type: 'warmup', seconds: 300 },
  {
    type: 'exercise',
    exerciseId: 'push-ups',
    targetReps: 10,
    sets: 3,
    restBetweenSets: 30
  },
  {
    type: 'exercise',
    exerciseId: 'pull-ups',
    targetReps: 15,
    sets: 3,
    restBetweenSets: 45
  }
][
  // With defaultRestBetweenExercises: 60

  // Output steps:
  ({ type: 'warmup', seconds: 300 },
  {
    type: 'exercise',
    exerciseId: 'push-ups',
    targetReps: 10,
    setNumber: 1,
    totalSets: 3
  },
  { type: 'rest', seconds: 30, label: 'between sets' },
  {
    type: 'exercise',
    exerciseId: 'push-ups',
    targetReps: 10,
    setNumber: 2,
    totalSets: 3
  },
  { type: 'rest', seconds: 30, label: 'between sets' },
  {
    type: 'exercise',
    exerciseId: 'push-ups',
    targetReps: 10,
    setNumber: 3,
    totalSets: 3
  },
  { type: 'rest', seconds: 60, label: 'between exercises' },
  {
    type: 'exercise',
    exerciseId: 'pull-ups',
    targetReps: 15,
    setNumber: 1,
    totalSets: 3
  },
  { type: 'rest', seconds: 45, label: 'between sets' },
  {
    type: 'exercise',
    exerciseId: 'pull-ups',
    targetReps: 15,
    setNumber: 2,
    totalSets: 3
  },
  { type: 'rest', seconds: 45, label: 'between sets' },
  {
    type: 'exercise',
    exerciseId: 'pull-ups',
    targetReps: 15,
    setNumber: 3,
    totalSets: 3
  })
]
```

## Data Models

### Program Configuration

```typescript
type ProgramConfig = {
  name: string
  initialWarmup?: {
    seconds: number
  }
  defaultRestBetweenExercises?: number
  blocks: ProgramBlock[]
}
```

### Exercise Block Configuration

```typescript
type ExerciseBlockConfig = {
  exerciseId: string
  targetReps?: number
  durationSeconds?: number
  sets: number // defaults to 1
  restBetweenSets: number // defaults to 60 seconds
  note?: string
}
```

### Expanded Workout Step

```typescript
type ExpandedWorkoutStep = WorkoutStep & {
  setNumber?: number // 1-based set number
  totalSets?: number // total number of sets
  restContext?: 'between-sets' | 'between-exercises' // context for rest blocks
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Block Expansion Completeness

_For any_ program with exercise blocks configured with sets and rest periods, when the program is executed, the expanded steps should include all sets and all rest periods between sets and between exercises.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 2: Set Numbering Accuracy

_For any_ exercise block with N sets, the expanded steps should display set numbers from 1 to N, with each set labeled correctly (e.g., "Set 1 of 3").

**Validates: Requirements 4.4**

### Property 3: Rest Period Insertion

_For any_ program with exercise blocks, rest blocks should be inserted between consecutive sets using the configured rest duration, and between different exercises using the default rest timer.

**Validates: Requirements 4.2, 4.3, 4.5, 4.6**

### Property 4: Default Rest Application

_For any_ program with a default rest timer configured, all transitions between different exercises should use that default rest duration unless explicitly overridden.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 5: Warmup Display Distinctness

_For any_ program with an initial warmup configured, the warmup should be displayed as the first block with distinct visual styling (warmup-specific color).

**Validates: Requirements 1.3, 1.5**

### Property 6: Configuration Persistence Round Trip

_For any_ program with sets, rest periods, and default rest timer configured, saving and loading the program should preserve all configuration values exactly.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 7: Sensible Defaults Application

_For any_ new exercise block created without explicit configuration, the system should apply default values (1 set, 60 seconds rest between sets).

**Validates: Requirements 7.1, 7.2**

### Property 8: Default Rest Timer Application

_For any_ new program created without explicit default rest configuration, the system should apply a default value of 60 seconds between exercises.

**Validates: Requirements 7.3**

## Error Handling

### Validation Rules

1. **Sets Validation**
   - Must be a positive integer (≥ 1)
   - Display error: "Sets must be at least 1"

2. **Rest Duration Validation**
   - Must be a non-negative integer (≥ 0)
   - Display error: "Rest duration must be 0 or greater"

3. **Program Validation**
   - At least one exercise block required
   - Display error: "Add at least one exercise block"

4. **Exercise Reference Validation**
   - All referenced exercises must exist
   - Display error: "One or more exercises no longer exist"

### Error Recovery

- Invalid values revert to previous valid state
- Validation errors prevent save operation
- User receives clear feedback on what needs to be corrected

## Testing Strategy

### Unit Tests

**ProgramForm Component:**

- Test adding/removing exercise blocks
- Test updating sets and rest between sets values
- Test toggling warmup configuration
- Test toggling rest configuration
- Test validation of numeric inputs
- Test default values are applied correctly

**useWorkoutSteps Hook:**

- Test block expansion with various set configurations
- Test rest period insertion between sets
- Test rest period insertion between exercises
- Test default rest timer application
- Test warmup block handling
- Test edge cases (single set, zero rest, etc.)

**Data Persistence:**

- Test saving program with new configuration fields
- Test loading program preserves all values
- Test export/import includes new fields

### Property-Based Tests

**Property 1: Block Expansion Completeness**

- Generate random programs with 1-5 exercises, 1-5 sets each
- Verify expanded steps include all sets and rest periods
- Verify total step count = sum of (sets + rest blocks between sets) + rest blocks between exercises

**Property 2: Set Numbering Accuracy**

- Generate random exercise blocks with 1-10 sets
- Verify set numbers are sequential from 1 to N
- Verify each set is labeled correctly

**Property 3: Rest Period Insertion**

- Generate random programs with various rest configurations
- Verify rest blocks appear between consecutive sets
- Verify rest blocks appear between different exercises
- Verify rest durations match configuration

**Property 4: Default Rest Application**

- Generate programs with default rest timer set
- Verify all exercise transitions use default rest
- Verify explicit rest overrides default

**Property 5: Warmup Display Distinctness**

- Generate programs with and without warmup
- Verify warmup appears first when configured
- Verify warmup has distinct visual styling

**Property 6: Configuration Persistence Round Trip**

- Generate random program configurations
- Save and load programs
- Verify all configuration values match original

**Property 7: Sensible Defaults Application**

- Create new exercise blocks without explicit configuration
- Verify defaults are applied (1 set, 60 sec rest)

**Property 8: Default Rest Timer Application**

- Create new programs without explicit default rest
- Verify default is applied (60 seconds)

### Integration Tests

- Test complete program creation flow with new configuration options
- Test program execution with expanded blocks
- Test navigation between program creation and execution
- Test data persistence across app sessions
- Test import/export with new configuration fields

## Visual Design

### Warmup Configuration

- **Trigger:** Existing button (to be determined based on current design)
- **Display:** Distinct section at top of program configuration
- **Color:** Warmup-specific color (orange/amber from theme)
- **Label:** "Warmup - X minutes"

### Rest Configuration

- **Trigger:** Rest button or menu option
- **Display:** Modal or additional section for default rest timer
- **Input:** Duration in seconds
- **Label:** "Default Rest Between Exercises"

### Exercise Block Extensions

- **Sets Field:** Numeric input, defaults to 1
- **Rest Between Sets Field:** Numeric input, defaults to 60 seconds
- **Display:** Below exercise selection in block configuration

### Program Execution Display

- **Warmup Block:** Distinct color (warmup phase color)
- **Exercise Block:** Shows set information (e.g., "Set 1 of 3")
- **Rest Block:** Shows duration and context (between sets or between exercises)
- **Completion:** "Workout Complete! 🎉" message

## Implementation Notes

1. **Backward Compatibility:** Programs without new configuration fields should work with defaults
2. **Migration:** Existing programs should automatically get default values when loaded
3. **Validation:** All numeric inputs should be validated before saving
4. **Performance:** Block expansion should be computed once and cached
5. **Storage:** New fields should be included in serialization format for import/export
