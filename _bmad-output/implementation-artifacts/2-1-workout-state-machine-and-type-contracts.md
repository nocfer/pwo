# Story 2.1: Workout State Machine & Type Contracts

Status: done

## Story

As a developer,
I want the workout state machine types and reducer to be defined and tested,
So that all components have a stable, reviewable contract to build against.

## Acceptance Criteria

1. **Given** no workout state management exists yet **When** the workout types and reducer are implemented **Then** `types/workout.ts` defines the `WorkoutState` interface, `WorkoutAction` union type, and `SetStatus` type (`'pending' | 'active' | 'completed' | 'skipped' | 'editing'`)
2. `WorkoutAction` union includes all action types: `EXPAND_EXERCISE`, `LOG_SET`, `CONFIRM_SET`, `SKIP_SET`, `START_REST_TIMER`, `DISMISS_REST_TIMER`, `COMPLETE_WORKOUT`, `RESTORE_STATE` — using `SCREAMING_SNAKE_CASE` with flat properties (no payload wrapper)
3. `context/WorkoutExecutionContext.tsx` implements a `useReducer`-based provider with typed state and dispatch
4. `hooks/workout/useWorkoutExecution.ts` provides the consumer hook that exposes state and named action dispatchers (never raw dispatch)
5. The reducer is a pure function with comprehensive unit tests in `__tests__/context/WorkoutExecutionContext.test.tsx` covering all action types
6. `EXPAND_EXERCISE` collapses the previously expanded exercise and expands the new one
7. `CONFIRM_SET` marks the set as completed and auto-expands the next pending set (same exercise first, then next exercise via forward scan with wrap-around)
8. `SKIP_SET` marks the set as skipped without completing it
9. `COMPLETE_WORKOUT` transitions the workout to a completed state
10. The temporary route file `app/programs/[id]/session/[index]-v2.tsx` exists and mounts the `WorkoutExecutionContext.Provider`
11. No file exceeds ~300 lines
12. The existing test suite passes (`npm run test:run`)

## Tasks / Subtasks

- [x] Task 1: Create `types/workout.ts` — Type contracts (AC: #1, #2)
  - [x] 1.1 Create `types/workout.ts` with `SetStatus` type: `'pending' | 'active' | 'completed' | 'skipped' | 'editing'`
  - [x] 1.2 Define `ExerciseSetState` interface: `{ reps: number, weight: number, status: SetStatus, confirmedReps?: number, confirmedWeight?: number }`
  - [x] 1.3 Define `ExerciseState` interface: `{ exerciseId: string, exerciseName: string, sets: ExerciseSetState[] }`
  - [x] 1.4 Define `RestTimerState` interface: `{ isActive: boolean, startedAt: number, durationMs: number }`
  - [x] 1.5 Define `WorkoutState` interface with all required fields: `workoutId`, `programSlug`, `sessionIndex`, `sessionName`, `exercises: ExerciseState[]`, `expandedExerciseIndex: number`, `activeSetIndex: number`, `restTimer: RestTimerState`, `startedAt: number`, `completedAt: number | null`, `isCompleted: boolean`
  - [x] 1.6 Define `WorkoutAction` discriminated union type with all 8 action types using flat properties
  - [x] 1.7 Export all types with `export type` keyword
  - [x] 1.8 Re-export from `types/index.ts`
- [x] Task 2: Create `context/WorkoutExecutionContext.tsx` — Reducer + provider (AC: #3, #5, #6, #7, #8, #9)
  - [x] 2.1 Define `WorkoutExecutionContextValue` type: `{ state: WorkoutState, expandExercise, confirmSet, skipSet, logSet, startRestTimer, dismissRestTimer, completeWorkout, restoreState }` — named action dispatchers, no raw dispatch
  - [x] 2.2 Implement `workoutReducer` pure function handling all 8 action types
  - [x] 2.3 `EXPAND_EXERCISE`: set `expandedExerciseIndex` to new index, set previous active set to `pending` if it was `active`, set first pending set in new exercise to `active`
  - [x] 2.4 `LOG_SET`: update `reps` and `weight` on the specified set (for in-progress edits before confirmation)
  - [x] 2.5 `CONFIRM_SET`: mark set as `completed`, store `confirmedReps`/`confirmedWeight`, advance to next pending set — same exercise first, then forward scan across exercises with wrap-around; if all exercises done, don't auto-expand
  - [x] 2.6 `SKIP_SET`: mark set as `skipped`, advance to next pending set using same forward scan logic as CONFIRM_SET
  - [x] 2.7 `START_REST_TIMER`: set `restTimer.isActive = true` with `startedAt` and `durationMs`
  - [x] 2.8 `DISMISS_REST_TIMER`: set `restTimer.isActive = false`
  - [x] 2.9 `COMPLETE_WORKOUT`: set `isCompleted = true`, `completedAt = Date.now()`, mark all remaining `pending` and `active` sets as `skipped`
  - [x] 2.10 `RESTORE_STATE`: replace entire state with provided state (for MMKV persistence restore in later stories)
  - [x] 2.11 Create `WorkoutExecutionProvider` component using `useReducer(workoutReducer, initialState)` with `initialState` prop
  - [x] 2.12 Wrap dispatch calls in named functions (e.g., `expandExercise(index)`, `confirmSet(exerciseIndex, setIndex)`) — components never access raw dispatch
  - [x] 2.13 Memoize context value with `useMemo` to prevent unnecessary re-renders
  - [x] 2.14 Extract `findNextPendingSet` helper (forward scan with wrap-around) as a pure function for testability
- [x] Task 3: Create `hooks/workout/useWorkoutExecution.ts` — Consumer hook (AC: #4)
  - [x] 3.1 Create hook that calls `useContext(WorkoutExecutionContext)` with null check (throw if not in provider)
  - [x] 3.2 Return the full context value (state + action dispatchers)
  - [x] 3.3 Create `hooks/workout/index.ts` barrel export
  - [x] 3.4 Re-export from `hooks/index.ts`
- [x] Task 4: Create temporary route `app/programs/[id]/session/[index]-v2.tsx` (AC: #10)
  - [x] 4.1 Create route file that reads `id` and `index` from `useLocalSearchParams()`
  - [x] 4.2 Fetch program data using existing `usePrograms()` hook
  - [x] 4.3 Build initial `WorkoutState` from program session data (exercises from program blocks, sets from block config, pre-fill values as 0 for now — Story 2.7 adds real pre-fill)
  - [x] 4.4 Mount `WorkoutExecutionProvider` with the initial state
  - [x] 4.5 Render a minimal placeholder inside the provider (exercise names and set counts) to verify the context is working — full UI components come in Stories 2.2-2.4
  - [x] 4.6 Use default export (route file convention)
- [x] Task 5: Write comprehensive reducer unit tests (AC: #5, #6, #7, #8, #9, #12)
  - [x] 5.1 Create `__tests__/context/WorkoutExecutionContext.test.tsx` (split into two files for ~300 line budget)
  - [x] 5.2 Test `EXPAND_EXERCISE`: verify previous exercise collapses, new exercise expands, first pending set becomes active
  - [x] 5.3 Test `EXPAND_EXERCISE` edge case: expand already-expanded exercise (no-op)
  - [x] 5.4 Test `LOG_SET`: verify reps and weight update on target set
  - [x] 5.5 Test `CONFIRM_SET`: set marked completed, next pending set in same exercise becomes active
  - [x] 5.6 Test `CONFIRM_SET` when last set of exercise: auto-expand next exercise with pending sets (forward scan)
  - [x] 5.7 Test `CONFIRM_SET` wrap-around: last exercise wraps to first exercise with pending sets
  - [x] 5.8 Test `CONFIRM_SET` when all sets in all exercises are done: no auto-expand, state stays
  - [x] 5.9 Test `SKIP_SET`: set marked skipped, advances to next pending set
  - [x] 5.10 Test `START_REST_TIMER`: restTimer becomes active with correct timestamps
  - [x] 5.11 Test `DISMISS_REST_TIMER`: restTimer becomes inactive
  - [x] 5.12 Test `COMPLETE_WORKOUT`: isCompleted true, completedAt set, remaining pending sets become skipped
  - [x] 5.13 Test `RESTORE_STATE`: entire state replaced with provided state
  - [x] 5.14 Test `findNextPendingSet` helper: forward scan, wrap-around, no pending sets returns null
- [x] Task 6: Run tests, compilation, and lint (AC: #11, #12)
  - [x] 6.1 Verify no file exceeds ~300 lines
  - [x] 6.2 Run `npm run compile` — zero NEW TS errors from this story's changes
  - [x] 6.3 Run `npm run test:run` — all new and existing tests pass (40/40)
  - [x] 6.4 Run `npm run lint:fix` — all new files Prettier-compliant

## Dev Notes

### Architecture Constraints

- **Brownfield project:** PWO v1.1 is in production. This story creates NEW files only — no existing files are modified except barrel exports (`types/index.ts`, `hooks/index.ts`).
- **Clean-room rebuild strategy:** The new `WorkoutExecutionContext` is built alongside the existing `hooks/session/` hooks and `WorkoutExecutionScreen.tsx` monolith. The old system is untouched. The new v2 route (`[index]-v2.tsx`) exists in parallel with the existing `[index].tsx` route.
- **React Context + useReducer pattern:** Follow the `DataContext.tsx` pattern which already uses `useReducer`. No Redux/Zustand — project rule.
- **Types as first deliverable:** The `WorkoutState` interface and `WorkoutAction` union are the reviewable contract all future components build against. Get these right.
- **Reducer owns business logic:** The reducer is a pure function containing ~80% of workout business logic. Zero mocking needed for unit tests — just call the function with state and action, assert the output.
- **No UI components in this story:** This story is purely types, context, hook, route scaffold, and tests. UI components (SetDot, SetRow, ExerciseAccordion, etc.) come in Stories 2.2-2.4.

### Existing Codebase Context — Critical

**Existing types NOT to conflict with:**

- `types/session.ts` — `Session`, `SessionPhase` (`'warmup' | 'working' | 'break' | 'done'`), `AccumulatedSet`
- `types/storage.ts` — `SessionState`, `StepStatus` (`'pending' | 'completed' | 'skipped'`), `StepCompletionRecord`
- `types/program.ts` — `Program`, `ProgramSession`, `ProgramExerciseBlock` (has `exerciseId`, `targetReps`, `sets`, `restBetweenSets`)

The new `types/workout.ts` is a separate file with new types. Do NOT modify or extend existing types. The old types serve the existing `[index].tsx` route; the new types serve the `[index]-v2.tsx` route.

**Existing context patterns to follow:**

- `DataContext.tsx` uses `createContext<DataContextValue | null>(null)` + `useReducer(dataReducer, initialState)`
- Custom hook `useDataActions()` throws if used outside provider
- All context methods wrapped in `useCallback`
- Context value memoized with `useMemo`

**Existing route pattern:**

- `app/programs/[id]/session/[index].tsx` uses `useLocalSearchParams()` for `id` and `index`
- Route fetches program via `usePrograms()` hook, builds steps, passes props down
- The v2 route should follow the same param extraction but mount the new context instead

**Existing hook location:**

- `hooks/session/` — existing workout hooks (useWorkoutSteps, useStepCompletion, useWorkoutTimer). Keep untouched.
- `hooks/workout/` — NEW directory for v1.2 hooks. Do NOT put new hooks in `hooks/session/`.

### WorkoutAction Type Contract

```typescript
type WorkoutAction =
  | { type: 'EXPAND_EXERCISE'; exerciseIndex: number }
  | {
      type: 'LOG_SET'
      exerciseIndex: number
      setIndex: number
      weight: number
      reps: number
    }
  | { type: 'CONFIRM_SET'; exerciseIndex: number; setIndex: number }
  | { type: 'SKIP_SET'; exerciseIndex: number; setIndex: number }
  | { type: 'START_REST_TIMER'; durationMs: number; startedAt: number }
  | { type: 'DISMISS_REST_TIMER' }
  | { type: 'COMPLETE_WORKOUT' }
  | { type: 'RESTORE_STATE'; state: WorkoutState }
```

SCREAMING_SNAKE_CASE actions with flat properties. No `payload` wrapper.

### WorkoutState Interface Contract

```typescript
type SetStatus = 'pending' | 'active' | 'completed' | 'skipped' | 'editing'

type ExerciseSetState = {
  reps: number
  weight: number
  status: SetStatus
  confirmedReps?: number
  confirmedWeight?: number
}

type ExerciseState = {
  exerciseId: string
  exerciseName: string
  sets: ExerciseSetState[]
}

type RestTimerState = {
  isActive: boolean
  startedAt: number
  durationMs: number
}

type WorkoutState = {
  workoutId: string
  programSlug: string
  sessionIndex: number
  sessionName: string
  exercises: ExerciseState[]
  expandedExerciseIndex: number
  activeSetIndex: number
  restTimer: RestTimerState
  startedAt: number
  completedAt: number | null
  isCompleted: boolean
}
```

### Forward Scan with Wrap-Around Algorithm

When a set is confirmed or skipped and the next pending set must be found:

1. Look for the next `pending` set in the SAME exercise (setIndex + 1, +2, etc.)
2. If no pending sets remain in the current exercise, scan FORWARD through exercises (exerciseIndex + 1, +2, etc.)
3. If the end of the exercise list is reached, WRAP to exercise 0 and continue scanning
4. For each exercise scanned, find its first `pending` set
5. If no pending set exists anywhere, return `null` (all sets are done/skipped)

This is a pure function `findNextPendingSet(exercises, currentExerciseIndex, currentSetIndex)` returning `{ exerciseIndex, setIndex } | null`.

### Building Initial State from Program Data

The v2 route must convert `ProgramSession` (existing type) into initial `WorkoutState`:

```typescript
// ProgramSession.blocks is ProgramExerciseBlock[]
// Each block has: exerciseId, targetReps?, sets? (number of sets), restBetweenSets?

// Convert to:
exercises: session.blocks
  .filter(block => block.type === 'exercise')
  .map(block => ({
    exerciseId: block.exerciseId,
    exerciseName: exerciseNameById.get(block.exerciseId) ?? block.exerciseId,
    sets: Array.from({ length: block.sets ?? 1 }, () => ({
      reps: block.targetReps ?? 0,
      weight: 0, // Story 2.7 adds real pre-fill from API
      status: 'pending' as SetStatus
    }))
  }))
```

Set `expandedExerciseIndex: 0` and mark the first set of the first exercise as `active`.

### Consumer Hook API

```typescript
function useWorkoutExecution(): {
  state: WorkoutState
  expandExercise: (exerciseIndex: number) => void
  logSet: (
    exerciseIndex: number,
    setIndex: number,
    reps: number,
    weight: number
  ) => void
  confirmSet: (exerciseIndex: number, setIndex: number) => void
  skipSet: (exerciseIndex: number, setIndex: number) => void
  startRestTimer: (durationMs: number) => void
  dismissRestTimer: () => void
  completeWorkout: () => void
  restoreState: (state: WorkoutState) => void
}
```

Components call `confirmSet(2, 1)` — never `dispatch({ type: 'CONFIRM_SET', exerciseIndex: 2, setIndex: 1 })`.

### Testing Strategy

- **Pure function reducer tests** — the core of this story. Import `workoutReducer` directly, call with state + action, assert output. Zero mocking required.
- **Helper function tests** — `findNextPendingSet` is exported and tested independently.
- **Provider rendering tests** — optional, test that the provider doesn't crash when mounted with valid initial state.
- **Test factory** — create a `createMockWorkoutState()` factory function in the test file to generate valid initial states for tests. Parameterize with overrides.
- **Vitest patterns:** `describe`/`it` blocks, `expect()` assertions, no snapshot tests.

### Prettier Rules (Project Enforced)

- No semicolons (`semi: false`)
- Single quotes (`singleQuote: true`)
- No trailing commas (`trailingComma: none`)
- Avoid arrow parens when possible (`arrowParens: avoid`)
- Run `npm run lint:fix` after all edits

### Import Conventions

- Path alias: `@/` for all imports (e.g., `import { WorkoutState } from '@/types/workout'`)
- Named exports for components and hooks (not default, except route files in `app/`)
- `export type` for type-only exports used across files

### Previous Story Learnings (Epic 1)

**What worked:**

- Story 1.3's file-by-file task breakdown was very actionable for the dev agent
- Pure utility code (hooks, types) is low-risk and testable in isolation
- Vitest react-native mocking infrastructure was set up in Story 1.3 — `__mocks__/react-native.ts` and `vitest.config.ts` resolve alias are already in place

**What went wrong in Epic 1:**

- Story 1.1 was marked complete while deprecated aliases still existed — **verify actual file contents before marking tasks done**
- `npm run compile` has pre-existing TS errors from Story 1.2 scope (removed tokens: `h3`, `captionBold`, `card`, `shadows.md`, `shadows.lg` across ~35 files). This story must not introduce NEW errors.
- `haptics.notifyWarning` in `components/common/ConfirmationModal.tsx` is a pre-existing error
- `SharedValue` type error in `app/(tabs)/profile.tsx` is pre-existing

**Key verification:**

- `npm run compile` will show pre-existing errors. Do NOT fix them — they are Story 1.2 scope.
- `npm run test:run` should pass with 17 existing tests + new tests from this story.
- `npm run lint:fix` must be run on all new files.

### Git Intelligence

Recent commits show the dark theme migration is complete (Stories 1.1-1.2) and responsive layout utilities are done (Story 1.3). The codebase is stable for Epic 2 work. Key patterns from recent commits:

- `theme/theme.ts` was fully replaced with dark-first tokens
- All `.tsx` components had hardcoded colors migrated to theme tokens
- `hooks/useResponsiveLayout.ts` and `components/common/MaxWidthContainer.tsx` were added as new files
- Vitest infrastructure (`vitest.config.ts`, `vitest.setup.ts`, `__mocks__/react-native.ts`) was configured

### File Size Budget

| File                                                 | Estimated Lines | Budget                                             |
| ---------------------------------------------------- | --------------- | -------------------------------------------------- |
| `types/workout.ts`                                   | ~60             | Well under 300                                     |
| `context/WorkoutExecutionContext.tsx`                | ~200-250        | Under 300 — extract `findNextPendingSet` if needed |
| `hooks/workout/useWorkoutExecution.ts`               | ~30             | Well under 300                                     |
| `hooks/workout/index.ts`                             | ~3              | Barrel                                             |
| `app/programs/[id]/session/[index]-v2.tsx`           | ~80-100         | Well under 300                                     |
| `__tests__/context/WorkoutExecutionContext.test.tsx` | ~250-300        | At limit — split if needed                         |

If `context/WorkoutExecutionContext.tsx` approaches 300 lines, extract the reducer into a separate `context/workoutReducer.ts` file and import it.

### Anti-Patterns to Avoid

```typescript
// BAD: Local state that duplicates reducer state
const [expanded, setExpanded] = useState(0)

// GOOD: Read from context
const { state } = useWorkoutExecution()
state.expandedExerciseIndex

// BAD: Exposing raw dispatch
export function WorkoutExecutionProvider({ children }) {
  const [state, dispatch] = useReducer(...)
  return <Context.Provider value={{ state, dispatch }}>

// GOOD: Named action dispatchers only
const expandExercise = useCallback((i: number) =>
  dispatch({ type: 'EXPAND_EXERCISE', exerciseIndex: i }), [])
return <Context.Provider value={{ state, expandExercise, ... }}>

// BAD: Payload wrapper
{ type: 'CONFIRM_SET', payload: { exerciseIndex: 2, setIndex: 1 } }

// GOOD: Flat properties
{ type: 'CONFIRM_SET', exerciseIndex: 2, setIndex: 1 }

// BAD: any type
const reducer = (state: any, action: any) => ...

// GOOD: Fully typed
const workoutReducer = (state: WorkoutState, action: WorkoutAction): WorkoutState => ...
```

### Project Structure Notes

- `types/workout.ts` — new file in existing `types/` directory
- `context/WorkoutExecutionContext.tsx` — new file in existing `context/` directory
- `hooks/workout/useWorkoutExecution.ts` — new file in NEW `hooks/workout/` directory
- `hooks/workout/index.ts` — new barrel export
- `app/programs/[id]/session/[index]-v2.tsx` — new temporary route alongside existing `[index].tsx`
- `__tests__/context/WorkoutExecutionContext.test.tsx` — new test file
- `types/index.ts` — modified to re-export new workout types
- `hooks/index.ts` — modified to re-export from `hooks/workout/`
- No existing files are modified beyond barrel exports

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — Acceptance criteria, user story, action types
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — SCREAMING_SNAKE_CASE actions, flat properties, WorkoutAction union
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] — useReducer state machine, context-controlled accordion, clean-room rebuild
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — Context boundaries diagram, data flow, directory tree
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Enforcement guidelines, anti-patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — hooks/workout/ directory, types/workout.ts location
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Non-Linear Navigation Model] — Forward scan wrap-around, auto-expand priority
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy] — ExerciseAccordionItem states, SetRow fully controlled
- [Source: _bmad-output/planning-artifacts/prd.md#Workout Execution] — FR1-FR9 functional requirements
- [Source: _bmad-output/planning-artifacts/prd.md#Set Logging & Input] — FR10-FR14 set logging requirements
- [Source: _bmad-output/project-context.md#State Management Patterns] — React Context with custom hooks, useReducer in DataContext
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest patterns, test location, mock conventions
- [Source: _bmad-output/project-context.md#Code Style & Formatting] — Prettier config, naming conventions
- [Source: _bmad-output/implementation-artifacts/1-3-cross-platform-visual-parity-and-responsive-layout-utility.md] — Previous story learnings, Vitest setup, pre-existing TS errors

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

- COMPLETE_WORKOUT reducer initially only marked `pending` sets as `skipped`, missing `active` sets. Test caught the bug; fixed to also transition `active` → `skipped`.
- context/WorkoutExecutionContext.tsx exceeded ~300 line budget (384 lines). Extracted reducer + `findNextPendingSet` into separate `context/workoutReducer.ts` (247 lines), bringing the context file to 144 lines.
- v2 route initially used non-existent theme tokens (`textSecondary`, `borderRadius`, `error`). Fixed to use correct tokens (`subtext`, `radius`, `danger`).
- Test file split into `workoutReducer.test.ts` (233 lines) and `WorkoutExecutionContext.test.tsx` (311 lines) to stay within ~300 line budget.

### Completion Notes List

- All 6 tasks and subtasks completed successfully
- 23 new tests added (10 in workoutReducer.test.ts, 13 in WorkoutExecutionContext.test.tsx), all passing
- 17 existing tests continue to pass (40 total)
- Zero new TypeScript compilation errors (2 pre-existing errors from Story 1.2 scope remain)
- All new files formatted via Prettier
- Reducer extracted into separate file per Dev Notes guidance for file size budget
- COMPLETE_WORKOUT also marks `active` sets as `skipped` (in addition to `pending`) — logical correctness for unfinished sets

### Senior Developer Review (AI)

**Reviewer:** Nocfer | **Date:** 2026-03-09 | **Outcome:** Approved with fixes applied

**Issues Found:** 2 High, 2 Medium, 3 Low (across Story 2-1 + 2-2 joint review)

**Fixes Applied:**
- **[H2] COMPLETE_WORKOUT reducer impurity:** Added `completedAt: number` parameter to the action type. Reducer now uses `action.completedAt` instead of `Date.now()`, making it a true pure function. Provider injects `Date.now()` at dispatch time. Tests updated with exact assertions.
- **[M1] Magic numbers in [index]-v2.tsx styles:** Replaced hardcoded `fontSize`/`fontWeight`/`marginTop` values with `theme.typography.bodyBold`, `theme.typography.caption`, `theme.typography.body`, `theme.spacing.xs`, `theme.spacing.xxl`.
- **[M2] Missing eslint-disable justification:** Added explanation comment for `react-hooks/exhaustive-deps` suppression in `useMemo` for `initialState`.

**Low issues noted (no fix required):**
- L1: Duplicate `createMockWorkoutState` factory across test files (DRY violation)
- L2: `WorkoutExecutionContext.test.tsx` at 319 lines (~300 budget)
- L3: `let` used in reducer for CONFIRM_SET/SKIP_SET handlers

### Change Log

- 2026-03-09: Implemented Story 2.1 — Workout state machine types, reducer, context provider, consumer hook, temporary v2 route, and comprehensive unit tests
- 2026-03-09: Code review — Fixed COMPLETE_WORKOUT reducer impurity (H2), magic numbers (M1), missing lint comment (M2). Status → done

### File List

New files:

- types/workout.ts
- context/WorkoutExecutionContext.tsx
- context/workoutReducer.ts
- hooks/workout/useWorkoutExecution.ts
- hooks/workout/index.ts
- app/programs/[id]/session/[index]-v2.tsx
- **tests**/context/WorkoutExecutionContext.test.tsx
- **tests**/context/workoutReducer.test.ts

Modified files:

- types/index.ts (added workout type re-exports)
- hooks/index.ts (added workout hook re-export)
