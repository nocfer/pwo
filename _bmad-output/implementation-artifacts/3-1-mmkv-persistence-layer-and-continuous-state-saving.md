# Story 3.1: MMKV Persistence Layer & Continuous State Saving

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want my workout progress to be saved automatically after every action I take,
So that I never have to think about saving and never lose data.

## Acceptance Criteria

1. **Given** `react-native-mmkv` (v4) and `react-native-nitro-modules` are installed as project dependencies **When** the app builds **Then** both native modules resolve successfully on iOS, Android, and Web
2. **Given** the persistence layer is implemented **When** the app initializes **Then** `lib/mmkv.ts` exports a singleton MMKV storage instance created via `createMMKV()` with a `pwo` instance ID
3. `lib/storage-keys.ts` defines all MMKV key constants with `pwo:` prefix: `WORKOUT_ACTIVE_STATE`, `WORKOUT_SYNC_QUEUE`, `WORKOUT_SESSION_ID`
4. **Given** a workout is active **When** any state change occurs (set confirmation, exercise navigation, timer start, skip, edit) **Then** `hooks/workout/useWorkoutPersistence.ts` writes the complete `WorkoutState` to MMKV within the same render cycle
5. The complete workout state (exercises, set values, expandedExerciseIndex, activeSetIndex, restTimer, startedAt, completedAt, isCompleted) is serialized as a single JSON key under `STORAGE_KEYS.WORKOUT_ACTIVE_STATE`
6. MMKV writes complete in < 50ms and do not block the UI thread (NFR7)
7. A unique workout session ID is generated at workout start (via `crypto.randomUUID()` or fallback) and stored in MMKV under `STORAGE_KEYS.WORKOUT_SESSION_ID`
8. **Given** a workout is completed **When** `COMPLETE_WORKOUT` is dispatched **Then** the active state key is cleared from MMKV (persisted state removed)
9. Unit tests in `__tests__/hooks/workout/useWorkoutPersistence.test.ts` verify write-on-every-change behavior and cleanup-on-complete behavior
10. No hardcoded storage key strings exist in any file — all keys imported from `lib/storage-keys.ts`
11. No file exceeds ~300 lines
12. The existing test suite passes (`npm run test:run`)

## Tasks / Subtasks

- [ ] Task 1: Install dependencies (AC: #1)
  - [ ] 1.1 Run `npx expo install react-native-mmkv react-native-nitro-modules` to install both packages at compatible versions
  - [ ] 1.2 Verify `package.json` includes both new dependencies
  - [ ] 1.3 Run `npx expo prebuild --clean` if native modules need rebuilding (EAS custom dev client already in use for expo-camera)
  - [ ] 1.4 Verify `npm run compile` passes with new dependencies

- [ ] Task 2: Create storage keys constants (AC: #3, #10)
  - [ ] 2.1 Create `lib/storage-keys.ts` — defines `STORAGE_KEYS` as a `const` object with `pwo:` prefixed keys:
    - `WORKOUT_ACTIVE_STATE: 'pwo:workout:active-state'`
    - `WORKOUT_SYNC_QUEUE: 'pwo:workout:sync-queue'`
    - `WORKOUT_SESSION_ID: 'pwo:workout:session-id'`
  - [ ] 2.2 Export `STORAGE_KEYS` as named export

- [ ] Task 3: Create MMKV instance (AC: #2)
  - [ ] 3.1 Create `lib/mmkv.ts` — imports `createMMKV` from `react-native-mmkv`, creates and exports a singleton: `export const storage = createMMKV({ id: 'pwo' })`
  - [ ] 3.2 Keep file minimal (~5-10 lines) — just initialization and export

- [ ] Task 4: Create useWorkoutPersistence hook (AC: #4, #5, #6, #7, #8)
  - [ ] 4.1 Create `hooks/workout/useWorkoutPersistence.ts` — hook that subscribes to `WorkoutState` from `useWorkoutExecution()` and writes to MMKV on every state change
  - [ ] 4.2 Use `useEffect` with `state` as dependency — when state changes, serialize entire `WorkoutState` as JSON and write to `STORAGE_KEYS.WORKOUT_ACTIVE_STATE`
  - [ ] 4.3 Import `storage` from `@/lib/mmkv` and `STORAGE_KEYS` from `@/lib/storage-keys`
  - [ ] 4.4 Generate a unique session ID on mount (before first write) using `crypto.randomUUID()` with `Date.now().toString(36)` fallback for environments without crypto API — store in `STORAGE_KEYS.WORKOUT_SESSION_ID`
  - [ ] 4.5 On workout completion (`state.isCompleted === true`), remove `STORAGE_KEYS.WORKOUT_ACTIVE_STATE` from MMKV (cleanup)
  - [ ] 4.6 Return `{ sessionId }` from hook for downstream use (sync queue in Story 3.2+)
  - [ ] 4.7 Export `useWorkoutPersistence` from `hooks/workout/index.ts`

- [ ] Task 5: Integrate hook into v2 route (AC: #4, #5)
  - [ ] 5.1 In `WorkoutSessionContent` (inside `[index]-v2.tsx`), call `useWorkoutPersistence()` — this activates state subscription and MMKV writes
  - [ ] 5.2 This is a single-line addition: `const { sessionId } = useWorkoutPersistence()` (sessionId unused until Story 3.2/7.2 but establishes the persistence pipeline)
  - [ ] 5.3 Verify the hook is called INSIDE the `WorkoutExecutionProvider` tree so `useWorkoutExecution()` resolves correctly

- [ ] Task 6: Write tests (AC: #9, #11, #12)
  - [ ] 6.1 Unit tests for `useWorkoutPersistence` in `__tests__/hooks/workout/useWorkoutPersistence.test.ts`:
    - Writes state to MMKV on mount (initial state persisted)
    - Writes to MMKV when state changes (simulated dispatch → new state → MMKV write)
    - Uses correct storage key (`STORAGE_KEYS.WORKOUT_ACTIVE_STATE`)
    - Serializes full WorkoutState as JSON string
    - Generates and stores session ID on mount
    - Clears active state from MMKV when `isCompleted` becomes true
    - Does NOT clear session ID on completion (needed for sync queue)
    - Returns sessionId from hook
  - [ ] 6.2 Unit tests for `lib/storage-keys.ts`: all keys have `pwo:` prefix, STORAGE_KEYS is a frozen/readonly object
  - [ ] 6.3 Verify no new TypeScript compilation errors (`npm run compile`)
  - [ ] 6.4 Verify all tests pass (`npm run test:run`)
  - [ ] 6.5 Verify all files pass Prettier (`npm run lint:fix`)

## Dev Notes

### Architecture Constraints

- **Brownfield project:** Creating 3 new files (`lib/mmkv.ts`, `lib/storage-keys.ts`, `hooks/workout/useWorkoutPersistence.ts`), modifying 2 existing files (`hooks/workout/index.ts`, `app/programs/[id]/session/[index]-v2.tsx`). No architectural changes to existing components.
- **Clean-room rebuild:** All changes stay within the v2 route and its component tree. Existing `[index].tsx` remains untouched.
- **React Context API only:** No Redux/Zustand. State management through context and hooks.
- **Persistence is transparent:** Components don't know about MMKV. The `useWorkoutPersistence` hook subscribes to context state and writes behind the scenes. No component changes needed.
- **No file exceeds ~300 lines.**
- **Story 3.2 dependency:** This story creates the write pipeline. Story 3.2 (Seamless Resume) will add the read-and-restore pipeline using `RESTORE_STATE` action. Do NOT implement restoration in this story.

### What's Already Implemented (Epic 2 Complete)

**Current `WorkoutState` type (in `types/workout.ts`, 75 lines):**

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

This is the exact shape that gets serialized to MMKV. It contains all transient workout state — no component UI state (keypad visibility, scroll position) is included.

**Current `WorkoutExecutionContext` (154 lines):**

- `useReducer(workoutReducer, initialState)` — state machine with typed actions
- Named action dispatchers: `expandExercise`, `logSet`, `confirmSet`, `skipSet`, `editSet`, `startRestTimer`, `dismissRestTimer`, `completeWorkout`, `restoreState`
- `restoreState(state)` dispatches `RESTORE_STATE` which replaces the entire state — this is the restore entry point for Story 3.2

**Current `WorkoutExecutionContextValue` type:**

Exposes `state: WorkoutState` — this is what `useWorkoutPersistence` reads from to write to MMKV.

**Current v2 route (`app/programs/[id]/session/[index]-v2.tsx`, 387 lines):**

- `WorkoutSessionContent` is the inner component inside `WorkoutExecutionProvider`
- This is where `useWorkoutPersistence()` must be called — inside the provider tree
- Route is at 387 lines (over ~300 guideline, but it's a composition root)
- Adding `useWorkoutPersistence()` is a single-line addition (~389 lines after)

**Current `hooks/workout/index.ts` (7 lines):**

- Exports: `useElapsedTimer`, `useEndWorkout`, `useKeypadState`, `usePrefill`, `useScrollToExercise`, `useWebKeyboardShortcuts`, `useWorkoutExecution`

**Current test count:** 205 tests (from stories 2.1–2.8)

### react-native-mmkv v4 Technical Specifics

**CRITICAL API CHANGE — v4 uses Nitro Modules:**

```typescript
// V4 API (CORRECT — what we use)
import { createMMKV } from 'react-native-mmkv'
export const storage = createMMKV({ id: 'pwo' })

// V3 API (WRONG — do NOT use)
import { MMKV } from 'react-native-mmkv'
const storage = new MMKV()
```

**Installation requires TWO packages:**

```bash
npx expo install react-native-mmkv react-native-nitro-modules
```

`react-native-nitro-modules` is a required peer dependency for v4. Missing it causes "native MMKV Module could not be found" runtime error.

**Core API:**

| Method | Description |
|---|---|
| `storage.set(key, value)` | Set string, number, or boolean (synchronous) |
| `storage.getString(key)` | Get string value (returns `undefined` if not set) |
| `storage.contains(key)` | Check if key exists |
| `storage.remove(key)` | Delete a key |
| `storage.clearAll()` | Delete all keys in this instance |

**JSON serialization pattern (for complex objects like WorkoutState):**

```typescript
// Write
storage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(state))

// Read (Story 3.2)
const json = storage.getString(STORAGE_KEYS.WORKOUT_ACTIVE_STATE)
if (json) {
  const persisted = JSON.parse(json) as WorkoutState
  restoreState(persisted)
}
```

**Testing with Vitest:** react-native-mmkv v4 provides automatic mocking for Jest/Vitest — `createMMKV()` returns a working in-memory mock during tests. No manual mocking of MMKV needed. However, if you want to spy on writes for assertions, mock `@/lib/mmkv` to control the `storage` instance.

**Web support:** Uses LocalStorage under the hood. Falls back to in-memory storage if LocalStorage is disabled. Data won't persist on page refresh with in-memory fallback — acceptable for web development/testing.

**Performance:** Synchronous writes complete in sub-millisecond time (~0.5ms for 5KB JSON). Well within the <50ms NFR. No async/await needed — this means no race conditions between writes.

### Serialization Shape (~5KB Typical)

The entire `WorkoutState` is serialized as one JSON key. For a typical workout with 6 exercises × 4 sets each:

```json
{
  "workoutId": "abc123",
  "programSlug": "push-pull-legs",
  "sessionIndex": 0,
  "sessionName": "Push Day A",
  "exercises": [
    {
      "exerciseId": "ex1",
      "exerciseName": "Bench Press",
      "sets": [
        { "reps": 8, "weight": 185, "status": "completed", "confirmedReps": 8, "confirmedWeight": 185 },
        { "reps": 8, "weight": 185, "status": "active" },
        { "reps": 8, "weight": 185, "status": "pending" },
        { "reps": 8, "weight": 185, "status": "pending" }
      ]
    }
  ],
  "expandedExerciseIndex": 0,
  "activeSetIndex": 1,
  "restTimer": { "isActive": false, "startedAt": 0, "durationMs": 0 },
  "startedAt": 1710600000000,
  "completedAt": null,
  "isCompleted": false
}
```

This is a flat, fully self-contained snapshot. No references to external data. Resume just deserializes and dispatches `RESTORE_STATE`.

### Integration Architecture

```
User Action (tap confirm, expand, skip, etc.)
    ↓
WorkoutSessionContent → dispatch(action)
    ↓
workoutReducer → new WorkoutState
    ↓
useWorkoutPersistence (useEffect on state change)
    ↓
storage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(state))
    ↓ (synchronous, ~0.5ms)
MMKV native storage
```

The persistence hook sits INSIDE the provider tree, consumes state via `useWorkoutExecution()`, and writes on every state transition. Components are completely unaware of persistence.

### Session ID Generation

The workout session ID serves as:
1. **Persistence identity:** Links the MMKV active state to a specific workout session
2. **Idempotency key:** Used later (Story 7.2) for `POST /api/v1/stats/workouts` to prevent duplicate sync submissions

Generation strategy:
- Primary: `crypto.randomUUID()` — available in modern browsers and React Native Hermes
- Fallback: `Date.now().toString(36) + Math.random().toString(36).substring(2)` — for environments without `crypto.randomUUID()`
- Generated once at mount time of `useWorkoutPersistence`, stored in MMKV immediately

### Previous Story Learnings (Stories 2.1–2.8)

**What worked well:**

- Pure function reducer with zero mocking for tests
- Named action dispatchers — components never access raw dispatch
- Separating `workoutReducer.ts` from context when files approach 300 lines
- `useKeypadState` as UI-only hook (transient state not in reducer)
- `useAsyncData<T>` pattern for data fetching hooks
- `useWorkoutExecution()` hook as the single entry point to context

**What went wrong:**

- **Wrong theme tokens:** `textSecondary` → use `subtext`, `borderRadius` → `radius`, `error` → `danger`. Always verify token names against `theme/theme.ts`.
- **Pre-existing TS errors from Epic 1 scope remain.** Do NOT fix: `haptics.notifyWarning` in `ConfirmationModal.tsx`, `SharedValue` in `profile.tsx`, and ~35 files referencing removed tokens. This story must not introduce NEW errors.
- **Test environment requires explicit `import React from 'react'`** for JSX in test files.
- **V2 route at 387 lines** — already over ~300 guideline. Adding persistence is +1 line. This is a composition root; the overage is acceptable.
- **Code review found inverted dependency in 2-7:** `lib/` was importing from `hooks/` — fixed by moving `PrefillMap` type to `types/workout.ts`. Be careful about import direction: `lib/` should NOT import from `hooks/`.

### Git Intelligence (Recent Commits)

```
1624fd6 feat: add prefill functionality for workout sets
cc08299 feat: implement NumericKeypad and SetRow components
d46f0e5 test: add unit tests for ExerciseAccordionItem and SetDot
00998fd test: add comprehensive unit tests for workoutReducer
50fe1e2 feat: implement responsive layout hook and MaxWidthContainer
```

**Patterns observed:**

- Test files placed in `__tests__/` mirroring source structure
- `vi.fn()` for mocking, `describe`/`it` blocks
- Pure function tests with no mocking for reducer-like logic
- Hook tests mock dependencies via `vi.mock()`
- New hooks get their own test file
- Commit messages follow `[type]: description` format

### Testing Strategy

**`useWorkoutPersistence` tests (`__tests__/hooks/workout/useWorkoutPersistence.test.ts`):**

Mock `@/lib/mmkv` to provide a controllable storage mock. The hook uses `useWorkoutExecution()` internally, so tests need the `WorkoutExecutionProvider` wrapper.

```
Test cases:
- Writes initial state to MMKV on mount
- Writes updated state when reducer state changes
- Uses STORAGE_KEYS.WORKOUT_ACTIVE_STATE key
- Value written is JSON.stringify(state)
- Generates session ID on mount and writes to STORAGE_KEYS.WORKOUT_SESSION_ID
- Removes WORKOUT_ACTIVE_STATE when state.isCompleted is true
- Does NOT remove WORKOUT_SESSION_ID on completion
- Returns sessionId string from hook
```

**Mock pattern for MMKV:**

```typescript
import { vi } from 'vitest'

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

**Mock pattern for context:**

Wrap `renderHook` in `WorkoutExecutionProvider` with a known `initialState`. To simulate state changes, use the `act()` + dispatch approach from existing reducer tests.

**`lib/storage-keys.ts` tests (`__tests__/lib/storage-keys.test.ts`):**

```
Test cases:
- All keys start with 'pwo:' prefix
- WORKOUT_ACTIVE_STATE key is defined
- WORKOUT_SYNC_QUEUE key is defined
- WORKOUT_SESSION_ID key is defined
- All keys are unique (no duplicates)
```

**Vitest patterns:** `describe`/`it` blocks, `expect()` assertions, `vi.fn()` mocking, no snapshot tests.

### Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Very first state write (mount) | Initial state is persisted immediately — even before user does anything |
| Rapid successive state changes (confirm → auto-expand → timer start) | Each state change triggers a write; MMKV handles synchronous overwrites |
| Workout completed (COMPLETE_WORKOUT dispatched) | Active state key is removed from MMKV; session ID preserved |
| App crash during JSON.stringify | Extremely unlikely (pure data, no circular refs). Previous persisted state survives in MMKV |
| MMKV write failure on web (LocalStorage disabled) | MMKV falls back to in-memory — data not persisted across page refresh. Acceptable for web. |
| State contains `completedAt: null` vs `completedAt: number` | Both serialize correctly to JSON; `null` round-trips as `null` |
| `Map` or `Set` in state | WorkoutState has NO Map/Set types — all plain objects and arrays. JSON.stringify is safe. |
| Multiple workouts started (edge case) | New workout overwrites the MMKV key — only one active workout at a time |
| Hook unmounts mid-write | MMKV writes are synchronous — no async cleanup needed |

### File Size Budget

| File | Current Lines | Estimated After | Budget |
|---|---|---|---|
| `lib/mmkv.ts` | NEW | ~5 | Under 300 |
| `lib/storage-keys.ts` | NEW | ~10 | Under 300 |
| `hooks/workout/useWorkoutPersistence.ts` | NEW | ~55 | Under 300 |
| `hooks/workout/index.ts` | 7 | ~8 | Under 300 |
| `app/programs/[id]/session/[index]-v2.tsx` | 387 | ~389 | ⚠️ Over 300 (composition root — acceptable) |
| `__tests__/hooks/workout/useWorkoutPersistence.test.ts` | NEW | ~100 | Under 300 |
| `__tests__/lib/storage-keys.test.ts` | NEW | ~25 | Under 300 |

### Anti-Patterns to Avoid

```typescript
// BAD: V3 API — createMMKV is the V4 way
import { MMKV } from 'react-native-mmkv'
const storage = new MMKV()

// GOOD: V4 API
import { createMMKV } from 'react-native-mmkv'
export const storage = createMMKV({ id: 'pwo' })

// BAD: Hardcoded storage key
storage.set('workoutState', JSON.stringify(state))

// GOOD: Centralized key constants
storage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(state))

// BAD: Async writes (MMKV is synchronous — no need for async)
await storage.setAsync('key', 'value')

// GOOD: Synchronous write
storage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(state))

// BAD: Persisting UI-only state (keypad visibility, scroll position)
storage.set(key, JSON.stringify({ ...workoutState, keypadVisible: true }))

// GOOD: Only persist reducer state (WorkoutState from context)
storage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(state))

// BAD: Writing from multiple places
// In SetRow.tsx: storage.set(key, ...)
// In ExerciseAccordion.tsx: storage.set(key, ...)

// GOOD: Single persistence point (hook subscribes to state)
// useWorkoutPersistence.ts: useEffect → write on state change

// BAD: Implementing restore in this story
const persisted = storage.getString(key)
if (persisted) restoreState(JSON.parse(persisted))

// GOOD: Restore is Story 3.2 — this story only writes
// useWorkoutPersistence writes state; useWorkoutResume (3.2) reads and restores

// BAD: Forgetting to install react-native-nitro-modules
npx expo install react-native-mmkv

// GOOD: Both packages required for V4
npx expo install react-native-mmkv react-native-nitro-modules

// BAD: Import direction — lib/ importing from hooks/
import { something } from '@/hooks/workout/useWorkoutPersistence'

// GOOD: hooks/ imports from lib/, never the reverse
import { storage } from '@/lib/mmkv'
import { STORAGE_KEYS } from '@/lib/storage-keys'

// BAD: Using useMMKVObject hook for writes (adds unnecessary reactivity)
const [state, setState] = useMMKVObject('key')

// GOOD: Direct storage.set() in useEffect (write-only, no read subscription)
useEffect(() => {
  storage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(state))
}, [state])
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
- Import context hooks from `@/hooks/workout`
- Import storage keys from `@/lib/storage-keys`

### Project Structure Notes

- `lib/mmkv.ts` — NEW (MMKV singleton instance)
- `lib/storage-keys.ts` — NEW (centralized key constants)
- `hooks/workout/useWorkoutPersistence.ts` — NEW (state subscription → MMKV write)
- `hooks/workout/index.ts` — MODIFY (add useWorkoutPersistence export)
- `app/programs/[id]/session/[index]-v2.tsx` — MODIFY (call useWorkoutPersistence in WorkoutSessionContent)
- `__tests__/hooks/workout/useWorkoutPersistence.test.ts` — NEW (persistence hook tests)
- `__tests__/lib/storage-keys.test.ts` — NEW (key constants tests)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — Acceptance criteria, user story, MMKV requirements (FR27)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — "Single flat JSON object in MMKV (~5KB typical payload, sub-millisecond write)"
- [Source: _bmad-output/planning-artifacts/architecture.md#New Dependencies] — `react-native-mmkv` for continuous workout state persistence, synchronous writes ~30x faster than AsyncStorage
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — `pwo:` prefixed MMKV keys in centralized constants, SCREAMING_SNAKE_CASE keys
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — `hooks/workout/useWorkoutPersistence.ts`, `lib/storage-keys.ts`, `lib/mmkv.ts` in directory plan
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow Boundary] — "WorkoutExecutionContext reducer → useWorkoutPersistence → MMKV (sync, <1ms)"
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Use MMKV keys from `lib/storage-keys.ts`, never hardcode storage key strings
- [Source: _bmad-output/planning-artifacts/architecture.md#Context Boundaries] — useWorkoutPersistence sits inside WorkoutExecutionContext.Provider, subscribes to state, writes MMKV on change
- [Source: _bmad-output/planning-artifacts/prd.md#FR27] — "System persists the complete workout state to local storage on every state change"
- [Source: _bmad-output/planning-artifacts/prd.md#NFR7] — "State persistence write completes in < 50ms per state change, non-blocking UI thread"
- [Source: _bmad-output/planning-artifacts/prd.md#NFR10] — "Zero workout data loss across all termination paths"
- [Source: _bmad-output/planning-artifacts/prd.md#NFR11] — "100% of state changes persisted before next user action"
- [Source: _bmad-output/project-context.md#Code Style] — Prettier config, no semicolons, single quotes
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest, __tests__/ mirror structure, describe/it blocks
- [Source: _bmad-output/project-context.md#State Management] — React Context API only, no Redux/Zustand
- [Source: _bmad-output/implementation-artifacts/2-8-web-keyboard-shortcuts.md] — Previous story learnings, current test count (205), v2 route file size (387 lines)
- [Source: _bmad-output/implementation-artifacts/2-7-pre-fill-engine-last-logged-and-program-targets.md] — Prefill integration patterns, buildInitialState patterns, inverted dependency fix
- [Source: react-native-mmkv v4.2.0 README] — V4 API: `createMMKV()`, requires `react-native-nitro-modules`, automatic Vitest mocking, Web LocalStorage support

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
