# Story 2.7: Pre-Fill Engine (Last-Logged & Program Targets)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want my sets to show the weight and reps I used last time (or the program's targets if it's my first time),
So that I can confirm most sets with a single tap instead of typing everything from scratch.

## Acceptance Criteria

1. **Given** a user starts a workout from a program **When** the workout loads **Then** the system calls `GET /api/v1/exercises/prefill` (or equivalent) to fetch last-logged values per exercise for the authenticated user (FR22)
2. `hooks/workout/usePrefill.ts` implements the API call following the existing `useAsyncData<T>` pattern
3. If last-logged values exist for an exercise, those values pre-fill all set rows for that exercise (FR22)
4. If no last-logged values exist (first session), program target reps and weight are used as pre-fill (FR23)
5. Once the user has completed at least one session with an exercise, all subsequent sessions use last-logged values over program targets (FR24)
6. Pre-fill values are per-exercise (same values for all sets regardless of set number or completion order)
7. If the pre-fill API call fails, program targets are used as fallback
8. A loading skeleton displays while pre-fill data is being fetched
9. Pre-filled values display in the set row inputs before user interaction (FR11)
10. The user can modify pre-filled values before confirming (FR12)
11. No file exceeds ~300 lines
12. The existing test suite passes (`npm run test:run`)

## Tasks / Subtasks

- [x] Task 1: Add prefill API types and function (AC: #1, #2)
  - [x] 1.1 Define `PrefillData` type in `types/workout.ts`: `{ exerciseId: string; reps: number; weight: number }[]` — array of last-logged values per exercise
  - [x] 1.2 Add `fetchPrefillData(exerciseIds: string[]): Promise<PrefillData>` to `lib/api.ts` — calls `GET /api/v1/exercises/prefill?exerciseIds=id1,id2,...` with auth token, returns array of `{ exerciseId, reps, weight }`
  - [x] 1.3 Handle API unavailable / 404 gracefully: return empty array (not throw), so fallback to program targets is seamless

- [x] Task 2: Create usePrefill hook (AC: #2, #3, #4, #5, #6, #7, #8)
  - [x] 2.1 Create `hooks/workout/usePrefill.ts` — new hook using `useAsyncData<PrefillData>` pattern
  - [x] 2.2 Hook accepts `exerciseIds: string[]` and calls `fetchPrefillData` with those IDs
  - [x] 2.3 Hook returns `{ prefillMap, isLoading, error }` where `prefillMap` is a `Map<string, { reps: number; weight: number }>` keyed by exerciseId for O(1) lookup
  - [x] 2.4 If `skip` is true (exerciseIds empty), return empty map immediately
  - [x] 2.5 Export `usePrefill` from `hooks/workout/index.ts`

- [x] Task 3: Modify buildInitialState to accept prefill data (AC: #3, #4, #5, #6)
  - [x] 3.1 Add optional `prefillMap?: Map<string, { reps: number; weight: number }>` parameter to `buildInitialState`
  - [x] 3.2 For each exercise block: if `prefillMap` has an entry for `exerciseId`, use its `reps` and `weight` values for ALL sets of that exercise (per-exercise, not per-set)
  - [x] 3.3 If `prefillMap` is missing or has no entry for an exercise, fall back to program `targetReps` for reps and `0` for weight (existing behavior)
  - [x] 3.4 If `targetReps` is an array, use per-set values from the array when no prefill exists (e.g., `[12, 10, 8]` → set 1 gets 12 reps, set 2 gets 10, set 3 gets 8)

- [x] Task 4: Integrate prefill into v2 route (AC: #1, #8, #9)
  - [x] 4.1 In `ProgramSessionV2`, extract `exerciseIds` from the program blocks using `useMemo`
  - [x] 4.2 Call `usePrefill(exerciseIds)` to fetch last-logged data
  - [x] 4.3 Pass `prefillMap` into `buildInitialState(program, index, exerciseNameById, prefillMap)`
  - [x] 4.4 Show loading skeleton (existing `Skeleton` component or simple loading text) while `prefillLoading` is true — do NOT build initial state until prefill resolves or fails
  - [x] 4.5 If prefill fails (error), still build initial state with `undefined` prefillMap (graceful fallback to program targets)
  - [x] 4.6 Ensure `initialState` useMemo depends on `prefillMap` so state is built only after prefill resolves

- [x] Task 5: Write tests (AC: #11, #12)
  - [x] 5.1 Unit tests for `fetchPrefillData` in `__tests__/lib/fetchPrefillData.test.ts`: mock `request` function, verify correct URL construction, verify empty array on error
  - [x] 5.2 Unit tests for `usePrefill` in `__tests__/hooks/workout/usePrefill.test.ts`: loading state, success with data, success with empty data (no history), API failure returns empty map, skip when no exerciseIds
  - [x] 5.3 Unit tests for updated `buildInitialState` in `__tests__/lib/buildInitialState.test.ts`: with prefill map (uses last-logged), without prefill map (uses program targets), partial prefill (some exercises have history, others don't), array targetReps fallback, weight=0 when no prefill and no target weight
  - [x] 5.4 Verify no new TypeScript compilation errors (`npm run compile`)
  - [x] 5.5 Verify all tests pass (`npm run test:run`)
  - [x] 5.6 Verify all files pass Prettier (`npm run lint:fix`)

## Dev Notes

### Architecture Constraints

- **Brownfield project:** Modifying existing files and creating 1 new hook file. No architectural changes.
- **Clean-room rebuild:** All changes stay within the v2 route and its component tree. Existing `[index].tsx` remains untouched.
- **Pre-fill data source decision (from Architecture doc):** API query at workout start. New backend endpoint returns last-logged weight/reps per exercise. Always fresh, multi-device consistent. Fallback to program target values on failure.
- **useAsyncData pattern REQUIRED:** All async data fetching hooks must follow the `useAsyncData<T>` pattern with `mountedRef` + `fetchIdRef` for race condition prevention.
- **React Context API only:** No Redux/Zustand. State management through context and hooks.
- **No file exceeds ~300 lines.**

### What's Already Implemented (Stories 2.1–2.6)

**Current `buildInitialState.ts` (43 lines):**

- Takes `program`, `sessionIndex`, `exerciseNameById`
- Maps `program.blocks` → `ExerciseState[]`
- Sets `reps` from `block.targetReps` (handles number and array[0]) — BUT always sets `weight: 0`
- First set of first exercise is marked `active`
- **Gap:** Does not accept or apply pre-fill data; weight is always 0

**Current `ExerciseSetState` type (in `types/workout.ts`):**

- `reps: number` — holds pre-filled or user-entered reps
- `weight: number` — holds pre-filled or user-entered weight (currently always 0)
- `status: SetStatus` — set lifecycle status
- `confirmedReps?: number` — backup values after CONFIRM_SET
- `confirmedWeight?: number` — backup values after CONFIRM_SET

**Current v2 route (`app/programs/[id]/session/[index]-v2.tsx`, 317 lines):**

- Creates `initialState` via `useMemo` from `buildInitialState(program, index, exerciseNameById)`
- Wraps content in `WorkoutExecutionProvider` with `initialState`
- Shows loading text while programs/exercises load
- **Gap:** Does not fetch or use pre-fill data; `initialState` is built immediately from program targets only

**Current `lib/api.ts` (467 lines):**

- Has `request<T>` generic function for authenticated API calls
- Follows pattern: `export async function fetchX(): Promise<T> { return request<T>('/api/v1/...') }`
- Query params appended manually with template literals
- Error handling via `APIError` class with codes
- **Gap:** No `fetchPrefillData` function exists

**Current `hooks/workout/index.ts`:**

- Exports: `useElapsedTimer`, `useEndWorkout`, `useKeypadState`, `useScrollToExercise`, `useWorkoutExecution`
- **Gap:** No `usePrefill` export

**Current `hooks/useAsyncData.ts`:**

- Generic: `useAsyncData<T>(fetcher, deps, options?)` → `{ data, loading, error, refetch }`
- Handles race conditions via `fetchIdRef` and `mountedRef`
- `options.skip` bypasses fetching
- Pattern to follow exactly for `usePrefill`

**ProgramExerciseBlock type (in `types/program.ts`):**

- `targetReps?: number | number[]` — can be single number OR per-set array
- `sets?: number` — number of sets (defaults to 1)
- `restBetweenSets?: number` — rest duration in seconds
- No `targetWeight` field exists — weight has always been 0 for initial state

### Pre-Fill Logic (from UX Spec & Architecture)

```
On workout start:
1. Extract exerciseIds from program blocks
2. Call GET /api/v1/exercises/prefill?exerciseIds=id1,id2,...
3. Response: [{ exerciseId, reps, weight }, ...]
4. Build prefillMap: Map<exerciseId, { reps, weight }>
5. For each exercise in workout:
   a. If prefillMap.has(exerciseId) → use prefillMap values for ALL sets
   b. Else → use program targetReps for reps, 0 for weight (existing behavior)
6. If API call fails entirely → use program targets for all exercises
```

**Pre-fill is per-exercise, not per-set:** All sets of an exercise get the same reps/weight from the last-logged values. This matches the UX spec: "Pre-fill is per-exercise, not per-position — same values regardless of which set or what order."

**Program targetReps array handling:** When falling back to program targets, if `targetReps` is an array like `[12, 10, 8]`, each set gets its corresponding index value. When prefill data exists, it overrides ALL sets with the same value (matching the "same values for all sets" requirement).

### Previous Story Learnings (Stories 2.1–2.6)

**What worked well:**

- Pure function reducer with zero mocking needed for tests
- Named action dispatchers (`expandExercise()`, `confirmSet()`) — components never access raw dispatch
- Separating `workoutReducer.ts` from context when files approach 300 lines
- Extracting helpers into `context/reducerHelpers.ts`
- `useKeypadState` as UI-only hook (transient state not in reducer)

**What went wrong:**

- **Wrong theme tokens:** `textSecondary` (doesn't exist) → use `subtext`, `borderRadius` → `radius`, `error` → `danger`. Always verify token names against `theme/theme.ts`.
- **Pre-existing TS errors from Epic 1 scope remain.** Do NOT fix: `haptics.notifyWarning` in `ConfirmationModal.tsx`, `SharedValue` in `profile.tsx`, and ~35 files referencing removed tokens. This story must not introduce NEW errors.
- **Test environment requires explicit `import React from 'react'`** for JSX in test files.
- **Component tests needed recursive tree traversal** — function-typed nodes must be resolved to mock objects.

**Current test count:** 166 tests (from stories 2.1-2.6). This story adds tests for API function, usePrefill hook, and buildInitialState updates.

### Git Intelligence (Recent Commits)

```
cc08299 feat: implement NumericKeypad and SetRow components
d46f0e5 test: add unit tests for ExerciseAccordionItem and SetDot
00998fd test: add comprehensive unit tests for workoutReducer
50fe1e2 feat: implement responsive layout hook and MaxWidthContainer
38f1186 refactor: migrate hardcoded colors to theme tokens
```

**Patterns observed:**

- Test files placed in `__tests__/` mirroring source structure
- `vi.fn()` for mocking, `describe`/`it` blocks
- Pure function tests with no mocking for reducer-like logic
- Hook tests use `renderHook` from `@testing-library/react` (implied)

### API Endpoint Design

The backend endpoint `GET /api/v1/exercises/prefill` is defined in the Architecture doc. If the endpoint doesn't exist yet (backend team dependency), the hook should:

1. Attempt the API call
2. On 404 or any error → return empty array
3. `usePrefill` converts empty array to empty map → fallback to program targets

**Request format:**

```
GET /api/v1/exercises/prefill?exerciseIds=ex1,ex2,ex3
Authorization: Bearer <firebase-id-token>
```

**Response format (expected):**

```json
[
  { "exerciseId": "ex1", "reps": 8, "weight": 185 },
  { "exerciseId": "ex2", "reps": 12, "weight": 70 }
]
```

Exercises with no history are omitted from the response (not included with null values).

### File Size Budget

| File                                         | Current Lines | Estimated After | Budget                                                                                               |
| -------------------------------------------- | ------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| `types/workout.ts`                           | 65            | ~72             | Under 300                                                                                            |
| `lib/api.ts`                                 | 467           | ~485            | ⚠️ Already large but acceptable — only adding one function                                           |
| `lib/buildInitialState.ts`                   | 43            | ~65             | Under 300                                                                                            |
| `hooks/workout/usePrefill.ts`                | NEW           | ~45             | Under 300                                                                                            |
| `hooks/workout/index.ts`                     | 5             | ~6              | Under 300                                                                                            |
| `app/programs/[id]/session/[index]-v2.tsx`   | 317           | ~340            | ⚠️ Close to 300 — if needed, extract `usePrefillExerciseIds` inline helper or simplify loading state |
| `__tests__/lib/buildInitialState.test.ts`    | NEW           | ~80             | Under 300                                                                                            |
| `__tests__/hooks/workout/usePrefill.test.ts` | NEW           | ~90             | Under 300                                                                                            |

**If v2 route exceeds 300 lines:** The prefill integration adds ~20 lines (useMemo for exerciseIds, usePrefill call, loading guard, prefillMap in buildInitialState). Current file is 317 lines. May need to consolidate the loading states or extract the outer shell into a separate component.

### Anti-Patterns to Avoid

```typescript
// BAD: Fetching prefill inside WorkoutSessionContent (too late — state already built)
function WorkoutSessionContent() {
  const { prefillMap } = usePrefill(exerciseIds)  // state already initialized!
}

// GOOD: Fetch prefill in ProgramSessionV2 BEFORE building initialState
export default function ProgramSessionV2() {
  const { prefillMap, isLoading } = usePrefill(exerciseIds)
  const initialState = useMemo(() => buildInitialState(program, index, nameMap, prefillMap), [...])
}

// BAD: Blocking entire app on prefill failure
if (prefillError) return <ErrorScreen />

// GOOD: Graceful fallback — build state without prefill data
const initialState = useMemo(() => {
  if (!program) return null
  return buildInitialState(program, index, nameMap, prefillMap ?? undefined)
}, [program, index, nameMap, prefillMap])

// BAD: Per-set prefill values
sets: Array.from({ length: block.sets }, (_, i) => ({
  reps: prefillMap.get(block.exerciseId)?.reps[i],  // NO — prefill is per-exercise
}))

// GOOD: Same prefill value for all sets of an exercise
const prefill = prefillMap?.get(block.exerciseId)
sets: Array.from({ length: block.sets }, () => ({
  reps: prefill?.reps ?? targetReps,
  weight: prefill?.weight ?? 0,
}))

// BAD: Hardcoded API URL
const data = await request('/exercises/prefill')

// GOOD: Full API path
const data = await request('/api/v1/exercises/prefill?exerciseIds=...')

// BAD: Using useEffect to re-initialize state after prefill loads
useEffect(() => { if (prefillMap) restoreState(applyPrefill(state, prefillMap)) }, [prefillMap])

// GOOD: Wait for prefill before building initial state — no re-initialization needed
```

### Prettier Rules (Project Enforced)

- No semicolons (`semi: false`)
- Single quotes (`singleQuote: true`)
- No trailing commas (`trailingComma: none`)
- Avoid arrow parens when possible (`arrowParens: avoid`)

### Import Conventions

- Path alias: `@/` for all imports (e.g., `import { theme } from '@/theme/theme'`)
- Named exports for components and hooks
- `export type` for type-only exports
- Import types from `@/types/workout`, hooks from `@/hooks/workout`

### Testing Strategy

- **`fetchPrefillData` tests (`__tests__/lib/api.test.ts` or separate file):**
  - Success: returns parsed response
  - API error: returns empty array (no throw)
  - Correct URL construction with exerciseIds query param

- **`usePrefill` tests (`__tests__/hooks/workout/usePrefill.test.ts`):**
  - Initial loading state
  - Success: converts API response to Map
  - Empty response: returns empty Map
  - API failure: returns empty Map (graceful fallback)
  - Skip when exerciseIds is empty array
  - Refetch works

- **`buildInitialState` tests (`__tests__/lib/buildInitialState.test.ts`):**
  - Without prefillMap: uses targetReps, weight=0 (existing behavior preserved)
  - With prefillMap: uses prefill reps and weight for matching exercises
  - Partial prefill: exercises with prefill get last-logged; others get program targets
  - Array targetReps fallback: per-set values when no prefill
  - Single targetReps fallback: same value for all sets
  - No targetReps and no prefill: reps=0, weight=0
  - First set of first exercise is 'active'

- **Vitest patterns:** `describe`/`it` blocks, `expect()` assertions, `vi.fn()` mocking, no snapshot tests.
- **Mock `lib/api`:** Mock the `request` function or `fetchPrefillData` directly.
- **Import React:** Required explicit `import React from 'react'` in test files with JSX.

### Edge Cases

| Scenario                                                        | Expected Behavior                                                           |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| First workout ever (no history for any exercise)                | API returns empty array → all exercises use program targets                 |
| Returning user with full history                                | API returns values for all exercises → all sets pre-filled from last-logged |
| Mixed history (some exercises new, some have history)           | Exercises with history get last-logged; new exercises get program targets   |
| API endpoint returns 404 (backend not deployed yet)             | Hook returns empty map → fallback to program targets transparently          |
| API timeout / network error                                     | Same as 404 — empty map, program targets used                               |
| Program has no targetReps for an exercise                       | Sets get reps=0, weight=0 (user must enter manually)                        |
| Program targetReps is array [12, 10, 8] with no prefill         | Set 1 gets 12 reps, set 2 gets 10 reps, set 3 gets 8 reps                   |
| Program targetReps is array [12, 10, 8] WITH prefill (reps: 15) | All sets get 15 reps (prefill overrides array)                              |
| Prefill data loads slowly (>2s)                                 | Loading skeleton shown; state not built until resolved                      |
| Prefill request races with component unmount                    | useAsyncData handles via mountedRef + fetchIdRef                            |

### Project Structure Notes

- `types/workout.ts` — MODIFY (add PrefillData type)
- `lib/api.ts` — MODIFY (add fetchPrefillData function)
- `lib/buildInitialState.ts` — MODIFY (add optional prefillMap parameter, apply prefill logic)
- `hooks/workout/usePrefill.ts` — NEW (useAsyncData-based hook for prefill API)
- `hooks/workout/index.ts` — MODIFY (add usePrefill export)
- `app/programs/[id]/session/[index]-v2.tsx` — MODIFY (integrate usePrefill, pass to buildInitialState, loading guard)
- `__tests__/hooks/workout/usePrefill.test.ts` — NEW (hook tests)
- `__tests__/lib/buildInitialState.test.ts` — NEW (updated buildInitialState tests)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.7] — Acceptance criteria, user story, pre-fill requirements (FR22, FR23, FR24)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Pre-fill data source decision: API query at workout start, new endpoint, fallback to program targets
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — New endpoint `GET /api/v1/exercises/prefill`
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — `hooks/workout/usePrefill.ts` in directory plan
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — useAsyncData pattern required, no hardcoded storage keys
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Smart set pre-population] — "First session uses program targets, subsequent sessions pre-fill from last logged values"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Non-Linear Navigation Model] — "Pre-fill is per-exercise, not per-position — same values regardless of which set or what order"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 1: Starting a Workout] — Pre-fill flow on workout start
- [Source: _bmad-output/planning-artifacts/prd.md#FR22] — Pre-fill from last-logged values
- [Source: _bmad-output/planning-artifacts/prd.md#FR23] — Pre-fill from program targets (first session)
- [Source: _bmad-output/planning-artifacts/prd.md#FR24] — Automatic pre-fill source switching
- [Source: _bmad-output/planning-artifacts/prd.md#FR11] — View pre-filled values before confirming
- [Source: _bmad-output/planning-artifacts/prd.md#FR12] — Modify reps and weight before confirming
- [Source: _bmad-output/project-context.md#Custom Hooks Architecture] — useAsyncData pattern template
- [Source: _bmad-output/project-context.md#API Client Usage] — API function patterns, error handling
- [Source: _bmad-output/project-context.md#Code Style] — Prettier config, no semicolons, single quotes
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest, **tests**/ mirror structure
- [Source: _bmad-output/implementation-artifacts/2-6-edit-completed-sets.md] — Previous story learnings, theme token issues, test patterns, file sizes

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Added `PrefillEntry` and `PrefillData` types to `types/workout.ts` for last-logged exercise values
- Added `fetchPrefillData(exerciseIds)` to `lib/api.ts` with graceful error handling — returns empty array on any API failure (404, timeout, network error)
- Created `hooks/workout/usePrefill.ts` using `useAsyncData<PrefillData>` pattern — returns `prefillMap` (Map keyed by exerciseId), `isLoading`, and `error`
- Refactored `lib/buildInitialState.ts` to accept optional `prefillMap` parameter — extracted `resolveSetValues` helper for clean prefill-vs-target logic
- Enhanced array `targetReps` handling: per-set values from array when no prefill, with clamping to last value when array shorter than sets count
- Integrated `usePrefill` into v2 route: extracts exerciseIds from program blocks, fetches prefill data, delays state construction until prefill resolves
- Loading state shown while prefill data is being fetched (existing loading text pattern)
- 25 new tests: 12 for buildInitialState, 7 for usePrefill hook, 6 for fetchPrefillData API function
- All 191 tests pass, no new TS errors, Prettier clean

### Change Log

- 2026-03-13: Implemented pre-fill engine — API types, fetchPrefillData, usePrefill hook, buildInitialState with prefill support, v2 route integration, and 25 unit tests
- 2026-03-16: Code review fixes — (1) Rewrote fetchPrefillData tests to test the real implementation via fetch mocking instead of re-implementing the function in the mock, (2) Moved PrefillMap type from hooks/workout/usePrefill.ts to types/workout.ts to fix inverted dependency (lib/ was importing from hooks/), (3) Replaced inline dynamic type imports in lib/api.ts with top-level import for PrefillData

### File List

- types/workout.ts (modified) — Added PrefillEntry, PrefillData, and PrefillMap types
- lib/api.ts (modified) — Added fetchPrefillData function with graceful error handling; added top-level PrefillData import
- lib/buildInitialState.ts (modified) — Added prefillMap parameter, resolveSetValues helper, per-set array targetReps support; imports PrefillMap from types/workout
- hooks/workout/usePrefill.ts (new) — useAsyncData-based hook returning prefillMap; imports PrefillMap from types/workout
- hooks/workout/index.ts (modified) — Added usePrefill export
- app/programs/[id]/session/[index]-v2.tsx (modified) — Integrated usePrefill, exerciseIds extraction, prefill-aware loading state
- __tests__/lib/buildInitialState.test.ts (new) — 12 tests for buildInitialState with/without prefill
- __tests__/hooks/workout/usePrefill.test.ts (new) — 7 tests for usePrefill hook
- __tests__/lib/fetchPrefillData.test.ts (new) — 6 tests for fetchPrefillData (real implementation via fetch mock)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified) — Story status tracking

### Review Follow-ups

- [ ] [AI-Review][MEDIUM] Uncommitted story 2-6 changes in working directory: context/WorkoutExecutionContext.tsx, context/workoutReducer.ts, context/reducerHelpers.ts, __tests__/context/workoutReducer.test.ts — these should be committed separately before story 2-7 changes
