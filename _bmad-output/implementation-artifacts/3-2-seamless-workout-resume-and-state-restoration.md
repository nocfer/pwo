# Story 3.2: Seamless Workout Resume & State Restoration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to reopen the app after my phone dies or I force-quit and see my workout exactly where I left it,
So that I can trust the app completely and never worry about losing my progress.

## Acceptance Criteria

1. **Given** a workout state has been persisted to MMKV (by Story 3.1's `useWorkoutPersistence`) **When** the workout screen mounts (`[index]-v2.tsx`) **Then** the route checks MMKV synchronously for an active workout state before rendering the provider
2. **Given** a valid persisted state exists in MMKV matching the current route's program and session **When** the provider initializes **Then** the persisted `WorkoutState` is used as `initialState` for `WorkoutExecutionProvider` instead of calling `buildInitialState` — no `RESTORE_STATE` dispatch needed, no render flash
3. **Given** a valid persisted state exists in MMKV for a DIFFERENT program or session than the current route **When** the workout screen mounts **Then** the persisted state is ignored (not cleared) and `buildInitialState` runs normally for the new workout
4. The workout resumes showing the exact exercise, set, input values, expanded exercise index, and active set index from the persisted data (FR29)
5. The elapsed workout timer recalculates correctly from the persisted `startedAt` timestamp using `Date.now()` — accurate regardless of how long the app was suspended (FR28)
6. State restoration completes in < 1 second from route mount to fully rendered workout UI (NFR8) — MMKV synchronous read + JSON.parse is sub-millisecond
7. No recovery dialog, spinner, "Resuming workout..." message, or any visual indicator of restoration is shown — the workout simply appears as if it was never interrupted (FR29)
8. Resume works identically for all termination paths: phone lock, app backgrounding, battery death, OS force-quit, and app restart (FR28)
9. **Given** the persisted state JSON is corrupted or unparseable **When** `JSON.parse` throws **Then** the corrupted key is removed from MMKV, the route falls back to `buildInitialState`, and the user starts a fresh workout (no crash, no error UI)
10. **Given** the persisted state has `isCompleted: true` **When** the route reads it **Then** the state is treated as invalid (stale completed workout), cleared from MMKV, and `buildInitialState` runs normally
11. `useWorkoutPersistence` preserves the persisted session ID on resume — when MMKV contains an existing `WORKOUT_SESSION_ID`, the hook uses it instead of generating a new one
12. **Given** the app launches with an active workout persisted in MMKV **When** the user navigates to the home screen **Then** a non-blocking indicator or auto-navigation directs the user back to their active workout (implementation: a resume banner or auto-redirect hook in the `(tabs)` layout)
13. Integration tests in `__tests__/integration/workout-persistence.test.ts` verify the full persist → terminate → restore cycle, including timer recalculation, corrupted state handling, and session ID preservation
14. No file exceeds ~300 lines
15. The existing test suite passes (`npm run test:run`)

## Tasks / Subtasks

- [x] Task 1: Create `readPersistedWorkout` utility function (AC: #1, #9, #10)
  - [x] 1.1 Create `lib/workout-persistence.ts` — a pure function (not a hook) that reads and validates persisted workout state from MMKV
  - [x] 1.2 Function signature: `readPersistedWorkout(): WorkoutState | null` — synchronous, no React dependency
  - [x] 1.3 Read `STORAGE_KEYS.WORKOUT_ACTIVE_STATE` via `storage.getString()`
  - [x] 1.4 If key is empty/undefined → return `null`
  - [x] 1.5 Wrap `JSON.parse()` in try/catch — on failure, call `storage.remove(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)` and return `null`
  - [x] 1.6 Validate required shape: `workoutId`, `programSlug`, `sessionIndex`, `exercises` (array with length > 0), `startedAt` (number > 0), `isCompleted` must be `false`
  - [x] 1.7 If `isCompleted === true` → clear key from MMKV (stale completed workout), return `null`
  - [x] 1.8 If validation fails (missing/wrong-type fields) → clear key from MMKV, return `null`
  - [x] 1.9 Return the validated `WorkoutState`

- [x] Task 2: Integrate restore into v2 route (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 2.1 In `ProgramSessionV2` (the outer component in `[index]-v2.tsx`), call `readPersistedWorkout()` inside a `useMemo` with empty deps — synchronous, runs once on mount
  - [x] 2.2 Compare persisted state's `programSlug` and `sessionIndex` against the current route params (`id` and parsed `index`)
  - [x] 2.3 If persisted state matches AND `isCompleted === false` → use it as `initialState`, skip `buildInitialState` and the async data loading (programs, exercises, prefill) for state purposes
  - [x] 2.4 If persisted state does NOT match (different workout) → return `null`, proceed with normal `buildInitialState` flow
  - [x] 2.5 When restoring, still render `WorkoutExecutionProvider` with `initialState={persistedState}` — the provider initializes `useReducer` with the restored state directly (no RESTORE_STATE dispatch needed)
  - [x] 2.6 Ensure `useElapsedTimer` receives the restored `startedAt` — it already recalculates elapsed time via `Date.now() - startedAt`, so no changes needed to the timer hook
  - [x] 2.7 Ensure restored state works with all downstream hooks: `useEndWorkout`, `useKeypadState`, `useScrollToExercise`, `useWorkoutKeyboardHandlers`
  - [x] 2.8 Loading states: when restoring from MMKV, skip the loading skeleton entirely (data is already available synchronously)

- [x] Task 3: Modify `useWorkoutPersistence` for session ID preservation (AC: #11)
  - [x] 3.1 In `useWorkoutPersistence`, on mount check `storage.getString(STORAGE_KEYS.WORKOUT_SESSION_ID)` before generating a new one
  - [x] 3.2 If an existing session ID is found in MMKV → use it (assign to `sessionIdRef.current`)
  - [x] 3.3 If no session ID in MMKV → generate new one via `generateSessionId()` (existing behavior)
  - [x] 3.4 The session ID write `useEffect` still runs — it's a no-op if the ID is already stored, or writes the new one if fresh

- [x] Task 4: Active workout detection for app-level resume (AC: #12)
  - [x] 4.1 Create `hooks/workout/useActiveWorkoutRedirect.ts` — a hook that checks MMKV for active workout state on mount
  - [x] 4.2 If active state found, use `router.replace()` from `expo-router` to navigate to `/programs/${programSlug}/session/${sessionIndex}-v2`
  - [x] 4.3 Only redirect once on mount — use a `useRef` flag to prevent repeated redirects
  - [x] 4.4 The redirect must NOT fire if the user is already on a workout route (check `usePathname()` or `useSegments()`)
  - [x] 4.5 Call `useActiveWorkoutRedirect()` in the `(tabs)` layout or home screen — determine the correct integration point
  - [x] 4.6 Export from `hooks/workout/index.ts`

- [x] Task 5: Write unit tests for `readPersistedWorkout` (AC: #9, #10, #14, #15)
  - [x] 5.1 Create `__tests__/lib/workout-persistence.test.ts` with test cases:
    - Returns `null` when no persisted state exists
    - Returns valid `WorkoutState` when JSON is valid and `isCompleted` is `false`
    - Returns `null` and clears MMKV when JSON is corrupted/unparseable
    - Returns `null` and clears MMKV when `isCompleted` is `true`
    - Returns `null` and clears MMKV when required fields are missing (`workoutId`, `exercises`, `startedAt`, etc.)
    - Returns `null` and clears MMKV when `exercises` is empty array
    - Returns `null` when `startedAt` is 0 or negative
  - [x] 5.2 Mock `@/lib/mmkv` storage for controlled test scenarios
  - [x] 5.3 Use `describe`/`it` blocks with `vi.fn()` mocking (Vitest patterns)

- [x] Task 6: Write integration tests for persist → restore cycle (AC: #13)
  - [x] 6.1 Create `__tests__/integration/` directory if it doesn't exist
  - [x] 6.2 Create `__tests__/integration/workout-persistence.test.ts` with test scenarios:
    - Full cycle: dispatch actions → state persisted to MMKV → simulate remount → `readPersistedWorkout()` returns correct state
    - Timer recalculation: persisted `startedAt` from past → elapsed time correctly calculated on restore
    - Session ID preservation: session ID persisted → on resume, same session ID used (not regenerated)
    - Corrupted state recovery: write garbage to MMKV key → `readPersistedWorkout()` clears it and returns `null`
    - Completed workout cleanup: persisted state with `isCompleted: true` → cleared and returns `null`
    - Mismatched workout: persisted state from different program → `readPersistedWorkout()` returns the state (route decides whether to use it)
  - [x] 6.3 Mock MMKV storage for integration test scenarios

- [x] Task 7: Update `useWorkoutPersistence` tests and verify (AC: #15)
  - [x] 7.1 Add test case to `__tests__/hooks/workout/useWorkoutPersistence.test.ts`: "preserves existing session ID from MMKV on mount instead of generating new one"
  - [x] 7.2 Add test case: "generates new session ID when MMKV has no existing session ID"
  - [x] 7.3 Verify all existing persistence tests still pass
  - [x] 7.4 Run `npm run compile` — no new TypeScript errors
  - [x] 7.5 Run `npm run test:run` — all tests pass
  - [x] 7.6 Run `npm run lint:fix` — all files pass Prettier

## Dev Notes

### Architecture Constraints

- **Brownfield project:** Creating 2 new files (`lib/workout-persistence.ts`, `hooks/workout/useActiveWorkoutRedirect.ts`), modifying 3 existing files (`hooks/workout/useWorkoutPersistence.ts`, `hooks/workout/index.ts`, `app/programs/[id]/session/[index]-v2.tsx`). No changes to components, context, or types.
- **Clean-room rebuild:** All changes stay within the v2 route and its hook/lib ecosystem. Existing `[index].tsx` (legacy) remains untouched.
- **React Context API only:** No Redux/Zustand. State management through context and hooks.
- **No file exceeds ~300 lines.**
- **Story 3.1 created the write pipeline.** This story adds the read-and-restore pipeline. The `RESTORE_STATE` action and `restoreState` dispatcher already exist in `WorkoutExecutionContext` but are NOT needed for this implementation — we use `initialState` prop directly.
- **No UI changes:** This story is infrastructure-only. No new components, no visual changes. The workout UI already renders correctly from any valid `WorkoutState`.

### Critical Design Decision: initialState vs RESTORE_STATE

There are two ways to restore persisted state:

**Option A (CHOSEN): Pass persisted state as `initialState` to provider**

- MMKV read is synchronous → no render flash, no intermediate state
- Provider's `useReducer(workoutReducer, initialState)` gets the correct state from the first render
- Zero visual artifacts — the workout appears as if it was never interrupted
- Matches NFR8 (< 1 second) and FR29 (no recovery dialogs/spinners)

**Option B (REJECTED): Dispatch RESTORE_STATE after mount**

- Provider initializes with `buildInitialState()` result (fresh state)
- `useEffect` fires on mount, reads MMKV, dispatches `RESTORE_STATE`
- Causes 1 frame (~16ms) of incorrect state before replacement
- Potential visual flicker as exercise list, timer, set states snap to restored values

The `restoreState` dispatcher and `RESTORE_STATE` action remain available for future use cases (e.g., cross-device sync) but are NOT used in this story.

### What's Already Implemented (Story 3.1 Complete)

**Write pipeline (`hooks/workout/useWorkoutPersistence.ts`, 38 lines):**

```
useWorkoutPersistence()
├── Generates session ID on mount → writes to MMKV
├── useEffect on state change → writes full WorkoutState as JSON to MMKV
└── On isCompleted === true → removes WORKOUT_ACTIVE_STATE from MMKV
```

**MMKV instance (`lib/mmkv.ts`, 3 lines):**

```typescript
import { createMMKV } from 'react-native-mmkv'
export const storage = createMMKV({ id: 'pwo' })
```

**Storage keys (`lib/storage-keys.ts`, 6 lines):**

```typescript
export const STORAGE_KEYS = {
  WORKOUT_ACTIVE_STATE: 'pwo:workout:active-state',
  WORKOUT_SYNC_QUEUE: 'pwo:workout:sync-queue',
  WORKOUT_SESSION_ID: 'pwo:workout:session-id'
} as const
```

**Context RESTORE_STATE handler (`context/workoutReducer.ts`):**

```typescript
case 'RESTORE_STATE':
  return action.state
```

**Current `WorkoutState` type (`types/workout.ts`, 74 lines):**

```
WorkoutState = {
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

This is the exact shape serialized to MMKV and the shape that must be validated on restore.

**Current v2 route (`app/programs/[id]/session/[index]-v2.tsx`, 336 lines):**

The route's data flow (lines ~240-300):

1. `useLocalSearchParams()` → `id`, `index`
2. `usePrograms()` → `programs` (async, from DataContext)
3. `useExercises()` → `exercises` (async, from DataContext)
4. `usePrefill(exerciseIds)` → `prefillMap` (async, API call)
5. `buildInitialState(program, sessionIndex, exerciseNameById, prefillMap)` → `initialState`
6. `WorkoutExecutionProvider initialState={initialState}` → renders workout

**On restore, steps 2-5 are bypassed.** The persisted state already contains everything — exercise names, set values, timer anchors, expanded index. No network calls or context data needed.

**`useElapsedTimer` (`hooks/workout/useElapsedTimer.ts`, 51 lines):**

Uses absolute timestamps: `Date.now() - startedAt`. On restore, the persisted `startedAt` (e.g., 45 minutes ago) produces the correct elapsed time immediately. No special resume handling needed.

**`buildInitialState` (`lib/buildInitialState.ts`):**

Builds fresh state from program + session + prefill. Only called when NO persisted state is available.

**Current test count:** 225 tests (from stories 2.1–3.1)

### Implementation Details: `readPersistedWorkout`

```typescript
// lib/workout-persistence.ts
import { storage } from '@/lib/mmkv'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import type { WorkoutState } from '@/types/workout'

export function readPersistedWorkout(): WorkoutState | null {
  const json = storage.getString(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)
  if (!json) return null

  try {
    const parsed = JSON.parse(json) as WorkoutState

    // Validate required shape
    if (
      !parsed.workoutId ||
      !parsed.programSlug ||
      typeof parsed.sessionIndex !== 'number' ||
      !Array.isArray(parsed.exercises) ||
      parsed.exercises.length === 0 ||
      typeof parsed.startedAt !== 'number' ||
      parsed.startedAt <= 0
    ) {
      storage.remove(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)
      return null
    }

    // Stale completed workout
    if (parsed.isCompleted) {
      storage.remove(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)
      return null
    }

    return parsed
  } catch {
    storage.remove(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)
    return null
  }
}
```

This is a **pure utility function** (not a hook) because:

- MMKV reads are synchronous — no async, no state, no effects
- Called in `useMemo` in the route — needs to be a plain function
- Testable without React rendering infrastructure

### Implementation Details: Route Integration

The key change in `[index]-v2.tsx` is injecting restore logic BEFORE the `initialState` computation. Pseudocode:

```typescript
// Inside ProgramSessionV2 component
const sessionIndex = parseInt(index as string, 10)

// RESTORE CHECK: synchronous, runs once
const persistedState = useMemo(() => {
  const state = readPersistedWorkout()
  if (!state) return null
  // Only restore if this is the SAME workout
  if (state.programSlug !== id || state.sessionIndex !== sessionIndex) {
    return null
  }
  return state
}, []) // Empty deps: only check on mount

// If restoring, skip async data loading for state purposes
// Still need programs/exercises for rendering (exercise names, etc.)
// BUT the persisted state already has exerciseName in each ExerciseState

const initialState = persistedState ?? buildInitialState(...)
```

**Important nuance:** When restoring, the route still needs to handle the case where `program` or `exercises` haven't loaded from DataContext yet. Since the persisted state is self-contained (has `exerciseName` per exercise), the workout can render immediately without waiting for DataContext. However, the `isLoading` guard in the route currently blocks rendering until programs/exercises are loaded.

**The fix:** Add a condition that bypasses the loading guard when `persistedState` is available:

```typescript
if (!persistedState && (isLoading || !program)) {
  return <LoadingScreen />
}
```

This means:

- **Resuming:** Renders immediately (persisted state has all data)
- **Fresh start:** Shows loading skeleton while programs/exercises/prefill load

### Implementation Details: Session ID Preservation

Modify `useWorkoutPersistence` to check for existing session ID:

```typescript
// Before (always generates new)
if (sessionIdRef.current === '') {
  sessionIdRef.current = generateSessionId()
}

// After (preserves on resume)
if (sessionIdRef.current === '') {
  const existing = storage.getString(STORAGE_KEYS.WORKOUT_SESSION_ID)
  sessionIdRef.current = existing ?? generateSessionId()
}
```

This ensures the same session ID persists across app restarts — critical for the idempotency key in Story 7.2's sync queue.

### Implementation Details: Active Workout Redirect

```typescript
// hooks/workout/useActiveWorkoutRedirect.ts
import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'expo-router'
import { readPersistedWorkout } from '@/lib/workout-persistence'

export function useActiveWorkoutRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (hasRedirected.current) return
    if (pathname.includes('/session/')) return // Already on workout

    const state = readPersistedWorkout()
    if (!state) return

    hasRedirected.current = true
    router.replace(
      `/programs/${state.programSlug}/session/${state.sessionIndex}-v2`
    )
  }, [router, pathname])
}
```

**Integration point:** Call in `(tabs)` layout or home screen. The redirect fires once on mount. If the user is already on a workout route, it no-ops.

### Previous Story Learnings (Stories 2.1–3.1)

**What worked well:**

- Pure function reducer with zero mocking for tests
- Named action dispatchers — components never access raw dispatch
- `useAsyncData<T>` pattern for data fetching hooks
- MMKV v4 automatic mocking in Vitest — `createMMKV()` returns working in-memory mock
- Separating pure utility functions from hooks for testability

**What went wrong (avoid repeating):**

- **Wrong theme tokens:** `textSecondary` → use `subtext`, `borderRadius` → `radius`, `error` → `danger`. Always verify token names against `theme/theme.ts`.
- **Pre-existing TS errors remain.** Do NOT fix: `haptics.notifyWarning` in `ConfirmationModal.tsx`, `SharedValue` in `profile.tsx`, and ~35 files referencing removed tokens. This story must not introduce NEW errors.
- **Test environment requires explicit `import React from 'react'`** for JSX in test files.
- **V2 route at 336 lines** — close to ~300 guideline. Adding restore logic adds ~15-20 lines. Route is a composition root; moderate overage acceptable.
- **Code review found inverted dependency in 2-7:** `lib/` was importing from `hooks/`. Be careful about import direction: `lib/` should NOT import from `hooks/`.
- **Session ID side effect during render (3-1 H1 finding):** Was fixed by moving MMKV write into useEffect. The new session ID read is also synchronous but happens inside a ref initialization (same pattern as current `generateSessionId`), so no side effect issue.

### Git Intelligence (Recent Commits)

```
49a302b feat: implement MMKV persistence layer for workout state management
075fa16 feat: enhance ExerciseAccordionItem with progress bar and styling updates
32320a0 chore: add Story 2.9 for visual alignment with approved mockup
993b4eb feat: implement useWebKeyboardShortcuts hook
1624fd6 feat: add prefill functionality for workout sets
cc08299 feat: implement NumericKeypad and SetRow components
```

**Patterns observed:**

- Test files placed in `__tests__/` mirroring source structure
- `vi.fn()` for mocking, `describe`/`it` blocks
- Pure function tests with no mocking for reducer-like logic
- Hook tests mock dependencies via `vi.mock()`
- New hooks get their own test file and barrel export
- Pure utility functions in `lib/` tested separately from hooks
- Commit messages follow `[type]: description` format

### react-native-mmkv v4 API Reference (Read Operations)

```typescript
// Read string (returns undefined if not set)
const json = storage.getString(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)

// Check key existence
const exists = storage.contains(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)

// Delete key
storage.remove(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)
```

All operations are **synchronous** — sub-millisecond latency. No async/await needed.

**Web support:** Uses LocalStorage under the hood. Falls back to in-memory if LocalStorage disabled. On web, data won't persist across page refresh with in-memory fallback — acceptable.

**Vitest mocking:** MMKV v4 provides automatic in-memory mock in test environment. To spy on reads for assertions, mock `@/lib/mmkv`:

```typescript
const mockStorage = {
  set: vi.fn(),
  getString: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn()
}

vi.mock('@/lib/mmkv', () => ({
  storage: mockStorage
}))
```

### Testing Strategy

**`readPersistedWorkout` tests (`__tests__/lib/workout-persistence.test.ts`):**

Pure function — no React rendering needed. Mock `@/lib/mmkv` and test all branches:

```
Test cases:
- Returns null when no data in MMKV
- Returns valid WorkoutState when JSON is well-formed and isCompleted is false
- Returns null + clears MMKV when JSON.parse throws (corrupted data)
- Returns null + clears MMKV when isCompleted is true (stale completed workout)
- Returns null + clears MMKV when required fields missing (workoutId, exercises, startedAt)
- Returns null + clears MMKV when exercises is empty array
- Returns null + clears MMKV when startedAt is 0 or negative
- Does NOT clear MMKV when valid state is returned (key preserved for continued writes)
```

**Integration tests (`__tests__/integration/workout-persistence.test.ts`):**

Test the full cycle without rendering. Use the actual `readPersistedWorkout` function with mocked MMKV:

```
Test cases:
- Persist cycle: JSON.stringify(state) → write to mock MMKV → readPersistedWorkout() returns same state
- Timer recalculation: persisted startedAt from 30 min ago → useElapsedTimer produces ~30 min elapsed
- Session ID preservation: write session ID → read back → same value
- Corrupted state recovery: write "{{bad json" → readPersistedWorkout() clears and returns null
- Completed workout cleanup: write state with isCompleted:true → readPersistedWorkout() clears and returns null
- Mismatched workout: readPersistedWorkout() returns state regardless of route match (route decides)
```

**`useWorkoutPersistence` updated tests:**

Add to existing `__tests__/hooks/workout/useWorkoutPersistence.test.ts`:

```
New test cases:
- Preserves existing session ID from MMKV on mount instead of generating new
- Generates new session ID when MMKV has no existing session ID
```

### Edge Cases

| Scenario                                          | Expected Behavior                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| No persisted state (fresh start)                  | `readPersistedWorkout()` returns `null`, normal `buildInitialState` flow                          |
| Persisted state matches current route             | Use as `initialState`, skip loading skeleton, render immediately                                  |
| Persisted state from different program            | Return `null` from route check (programSlug mismatch), start fresh workout                        |
| Persisted state from different session            | Return `null` from route check (sessionIndex mismatch), start fresh workout                       |
| Persisted state with `isCompleted: true`          | `readPersistedWorkout()` clears MMKV and returns `null`                                           |
| Corrupted JSON in MMKV                            | `readPersistedWorkout()` clears MMKV and returns `null`, no crash                                 |
| MMKV contains `undefined` for active state key    | `getString()` returns `undefined`, function returns `null`                                        |
| Extremely large state (100 exercises)             | JSON.parse handles any valid JSON; MMKV read still sub-ms                                         |
| Multiple rapid app restarts                       | Each mount checks MMKV fresh; synchronous reads prevent race conditions                           |
| User starts new workout while old state persisted | `buildInitialState` creates new state → `useWorkoutPersistence` overwrites MMKV with new state    |
| Battery death during MMKV write                   | Previous complete write survives; MMKV uses memory-mapped files with OS-level write guarantees    |
| Web: LocalStorage disabled                        | MMKV falls back to in-memory; `getString()` returns `undefined` on fresh page load — starts fresh |

### File Size Budget

| File                                                    | Current Lines | Estimated After | Budget                                      |
| ------------------------------------------------------- | ------------- | --------------- | ------------------------------------------- |
| `lib/workout-persistence.ts`                            | NEW           | ~35             | Under 300                                   |
| `hooks/workout/useActiveWorkoutRedirect.ts`             | NEW           | ~25             | Under 300                                   |
| `hooks/workout/useWorkoutPersistence.ts`                | 38            | ~42             | Under 300                                   |
| `hooks/workout/index.ts`                                | 9             | ~11             | Under 300                                   |
| `app/programs/[id]/session/[index]-v2.tsx`              | 336           | ~355            | ⚠️ Over 300 (composition root — acceptable) |
| `__tests__/lib/workout-persistence.test.ts`             | NEW           | ~90             | Under 300                                   |
| `__tests__/integration/workout-persistence.test.ts`     | NEW           | ~120            | Under 300                                   |
| `__tests__/hooks/workout/useWorkoutPersistence.test.ts` | 207           | ~230            | Under 300                                   |

### Anti-Patterns to Avoid

```typescript
// BAD: Using RESTORE_STATE dispatch (causes 1-frame flash of wrong state)
useEffect(() => {
  const state = readPersistedWorkout()
  if (state) restoreState(state)
}, [])

// GOOD: Pass persisted state as initialState to provider (no flash)
const initialState = persistedState ?? buildInitialState(...)
<WorkoutExecutionProvider initialState={initialState}>

// BAD: Async state restoration (MMKV is synchronous — async adds unnecessary delay)
const [restored, setRestored] = useState<WorkoutState | null>(null)
useEffect(() => { setRestored(readPersistedWorkout()) }, [])

// GOOD: Synchronous read in useMemo (runs during render, no delay)
const persistedState = useMemo(() => readPersistedWorkout(), [])

// BAD: Reading MMKV inside useEffect (causes render without restored state)
useEffect(() => {
  const json = storage.getString(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)
  ...
}, [])

// GOOD: Reading MMKV synchronously before render decision
const persistedState = useMemo(() => readPersistedWorkout(), [])

// BAD: Always generating new session ID on resume
sessionIdRef.current = generateSessionId()

// GOOD: Check for existing session ID first
const existing = storage.getString(STORAGE_KEYS.WORKOUT_SESSION_ID)
sessionIdRef.current = existing ?? generateSessionId()

// BAD: Showing a "Resuming workout..." message or spinner
if (isRestoring) return <Text>Resuming workout...</Text>

// GOOD: No UI indication of restore — it just works
const initialState = persistedState ?? buildInitialState(...)

// BAD: Clearing persisted state when it's from a different workout
if (state.programSlug !== id) {
  storage.remove(STORAGE_KEYS.WORKOUT_ACTIVE_STATE) // Don't clear!
}

// GOOD: Ignore mismatched state, don't clear (user might return to that workout)
if (state.programSlug !== id) return null

// BAD: Import direction violation — lib/ importing from hooks/
import { useWorkoutExecution } from '@/hooks/workout'

// GOOD: lib/ only imports from lib/ and types/
import { storage } from '@/lib/mmkv'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import type { WorkoutState } from '@/types/workout'

// BAD: Using hook inside readPersistedWorkout (it's a pure function)
export function readPersistedWorkout() {
  const state = useWorkoutExecution() // WRONG: can't use hooks in non-hook

// GOOD: Pure function, no React dependencies
export function readPersistedWorkout(): WorkoutState | null {
  const json = storage.getString(...)
```

### Prettier Rules (Project Enforced)

- No semicolons (`semi: false`)
- Single quotes (`singleQuote: true`)
- No trailing commas (`trailingComma: none`)
- Avoid arrow parens when possible (`arrowParens: avoid`)

### Import Conventions

- Path alias: `@/` for all imports (e.g., `import { storage } from '@/lib/mmkv'`)
- Named exports for all non-route files
- `export type` for type-only exports
- Import order: React/external → `@/` path alias → relative
- Import storage keys from `@/lib/storage-keys`
- Import types from `@/types/workout`
- Import MMKV from `@/lib/mmkv`

### Project Structure Notes

- `lib/workout-persistence.ts` — NEW (pure function for reading/validating persisted state)
- `hooks/workout/useActiveWorkoutRedirect.ts` — NEW (app-level active workout detection)
- `hooks/workout/useWorkoutPersistence.ts` — MODIFY (session ID preservation on resume)
- `hooks/workout/index.ts` — MODIFY (add new exports)
- `app/programs/[id]/session/[index]-v2.tsx` — MODIFY (integrate restore logic before provider)
- `__tests__/lib/workout-persistence.test.ts` — NEW (readPersistedWorkout unit tests)
- `__tests__/integration/workout-persistence.test.ts` — NEW (full persist→restore cycle tests)
- `__tests__/hooks/workout/useWorkoutPersistence.test.ts` — MODIFY (add session ID preservation tests)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — Acceptance criteria, user story, resume requirements (FR28, FR29)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — "Single flat JSON object in MMKV (~5KB typical payload, sub-millisecond write), entire workout state serialized as one key"
- [Source: _bmad-output/planning-artifacts/architecture.md#Timer Architecture Pattern] — "Absolute timestamps (Date.now()), not interval-based countdown. On resume after backgrounding, remaining time is recalculated as startTimestamp + durationMs - Date.now()"
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — "WorkoutExecutionContext + useReducer, RESTORE_STATE action for state restoration"
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — MMKV key naming, reducer action patterns, import conventions
- [Source: _bmad-output/planning-artifacts/architecture.md#Context Boundaries] — Provider tree structure showing useWorkoutPersistence inside WorkoutExecutionContext.Provider
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Use MMKV keys from lib/storage-keys.ts, never hardcode storage key strings
- [Source: _bmad-output/planning-artifacts/prd.md#FR28] — "Resume after phone lock, app backgrounding, battery death, OS force-quit, or app restart with no data loss"
- [Source: _bmad-output/planning-artifacts/prd.md#FR29] — "Resume to exact workout state without recovery dialogs, spinners, or re-navigation"
- [Source: _bmad-output/planning-artifacts/prd.md#NFR7] — "State persistence write completes in < 50ms per state change"
- [Source: _bmad-output/planning-artifacts/prd.md#NFR8] — "Workout resume (app reopen) restores full workout state in < 1 second"
- [Source: _bmad-output/planning-artifacts/prd.md#NFR10] — "Zero workout data loss across all termination paths"
- [Source: _bmad-output/planning-artifacts/prd.md#NFR12] — "Exact state restoration (exercise, set, timer, values) on resume from any termination"
- [Source: _bmad-output/project-context.md#Code Style] — Prettier config, no semicolons, single quotes, no trailing commas
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest, **tests**/ mirror structure, describe/it blocks
- [Source: _bmad-output/project-context.md#State Management] — React Context API only, no Redux/Zustand
- [Source: _bmad-output/implementation-artifacts/3-1-mmkv-persistence-layer-and-continuous-state-saving.md] — Complete Story 3.1 context, MMKV v4 API, session ID generation, persistence hook, write pipeline details, code review findings
- [Source: _bmad-output/implementation-artifacts/3-1-mmkv-persistence-layer-and-continuous-state-saving.md#react-native-mmkv v4 Technical Specifics] — V4 API: createMMKV(), getString(), remove(), automatic Vitest mocking
- [Source: _bmad-output/implementation-artifacts/3-1-mmkv-persistence-layer-and-continuous-state-saving.md#Serialization Shape] — Full JSON shape for persisted WorkoutState (~5KB typical)
- [Source: _bmad-output/implementation-artifacts/3-1-mmkv-persistence-layer-and-continuous-state-saving.md#Previous Story Learnings] — Wrong theme tokens, pre-existing TS errors, test import requirements, route file size

## Change Log

- 2026-03-17: Implemented full workout state restoration pipeline — synchronous MMKV read with `readPersistedWorkout()` utility, v2 route integration via `useMemo` initialState pattern, session ID preservation on resume, and active workout redirect from home screen. Added 21 new tests (11 unit, 8 integration, 2 persistence hook tests). All 246 tests pass, no regressions.
- 2026-03-17: Code review fixes — (H1) Fixed session ID reuse bug: new workouts after completion now generate a fresh session ID instead of reusing the stale one; checks `WORKOUT_ACTIVE_STATE` existence to distinguish resume from fresh start. (H2) Rewrote fake integration test that was only testing `Map.get/set` instead of actual session ID preservation behavior. (M1) Added `sessionName` validation to `readPersistedWorkout`. (M2) Eliminated home screen flash before redirect by returning synchronous `redirecting` flag from `useActiveWorkoutRedirect`. (M3) Improved integration tests to verify serialization round-trip identity. (M4) Added per-exercise element validation (`exerciseId`, `exerciseName`, non-empty `sets`) to `readPersistedWorkout`. Added 7 new tests. All 253 tests pass.

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (via Cursor)

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

- Created `lib/workout-persistence.ts` (34 lines) — pure synchronous function that reads MMKV, parses JSON, validates shape (workoutId, programSlug, sessionIndex, exercises array, startedAt > 0), rejects completed workouts, and clears corrupted/invalid entries from MMKV
- Modified `app/programs/[id]/session/[index]-v2.tsx` (+15 lines) — added `readPersistedWorkout()` call in `useMemo` with empty deps for mount-only synchronous read; compares programSlug and sessionIndex against route params; bypasses loading skeleton when restoring; uses `persistedState ?? freshState` as initialState
- Modified `hooks/workout/useWorkoutPersistence.ts` (+2 lines) — reads existing session ID from MMKV before generating new one, preserving session ID across app restarts
- Created `hooks/workout/useActiveWorkoutRedirect.ts` (21 lines) — checks for persisted active workout on mount, redirects to workout route via `router.replace()`, guards against double-redirect with useRef and skips if already on workout route
- Modified `hooks/workout/index.ts` (+1 line) — added barrel export for `useActiveWorkoutRedirect`
- Modified `app/(tabs)/index.tsx` (+2 lines) — integrated `useActiveWorkoutRedirect()` in home screen
- Created `__tests__/lib/workout-persistence.test.ts` (11 tests) — covers all readPersistedWorkout branches: null/empty, valid state, corrupted JSON, completed workout, missing fields, empty exercises, invalid startedAt, empty string
- Created `__tests__/integration/workout-persistence.test.ts` (8 tests) — full persist→restore cycle, timer recalculation, session ID preservation, corrupted recovery, completed cleanup, mismatched workout, exercise state preservation
- Added 2 tests to `__tests__/hooks/workout/useWorkoutPersistence.test.ts` — session ID preservation and fresh generation
- TypeScript: no new errors (only pre-existing SharedValue and notifyWarning)
- Test suite: 246 tests pass (was 225, +21 new), 19 test files, zero regressions
- All files under 300 lines (v2 route at ~355 lines — composition root, acceptable per story notes)

### File List

New:

- lib/workout-persistence.ts
- hooks/workout/useActiveWorkoutRedirect.ts
- **tests**/lib/workout-persistence.test.ts
- **tests**/integration/workout-persistence.test.ts

Modified:

- app/programs/[id]/session/[index]-v2.tsx
- hooks/workout/useWorkoutPersistence.ts
- hooks/workout/index.ts
- app/(tabs)/index.tsx
- **tests**/hooks/workout/useWorkoutPersistence.test.ts
- \_bmad-output/implementation-artifacts/sprint-status.yaml
