# Story 2.5: Set Confirmation & Non-Linear Navigation

Status: done

## Story

As a user,
I want to confirm sets with a single tap and navigate freely between exercises,
So that I can log my workout at my own pace in whatever order suits my gym session.

## Acceptance Criteria

1. **Given** a set row is active with pre-filled values **When** the user taps the checkmark button **Then** the set is confirmed via CONFIRM_SET dispatch (FR10)
2. The set dot turns green with a checkmark icon
3. The next pending set in the same exercise becomes active with pre-filled values
4. If all sets for the current exercise are completed, the exercise collapses and the next pending exercise auto-expands via forward scan with wrap-around (FR6)
5. The user can tap any exercise row to expand it instantly with no confirmation dialog (FR5)
6. The user can tap any set dot on any compact exercise to jump directly to that set (FR4)
7. Navigation between exercises is instant (< 200ms visual response)
8. The user can complete sets in any order across any exercises (FR5)
9. Sets can be skipped individually without completing them via a skip action (FR9)
10. "End Workout" marks all remaining pending sets as skipped (FR7)
11. The scroll position auto-adjusts to center the expanded exercise (300ms animated scroll)
12. No file exceeds ~300 lines
13. The existing test suite passes (`npm run test:run`)

## Tasks / Subtasks

- [x] Task 1: Extend EXPAND_EXERCISE for targeted set navigation (AC: #6, #8)
  - [x] 1.1 Add optional `setIndex?: number` to EXPAND_EXERCISE in `types/workout.ts`
  - [x] 1.2 Update `workoutReducer.ts` EXPAND_EXERCISE handler: when `setIndex` provided, activate that specific set (if pending) instead of first pending. Set `activeSetIndex` to the provided index.
  - [x] 1.3 If the targeted set is completed or skipped, still expand the exercise and set `activeSetIndex` to that index, but don't change the set's status (editing is story 2.6)
  - [x] 1.4 If no `setIndex` provided, keep current behavior (activate first pending)
  - [x] 1.5 Add unit tests in `__tests__/context/workoutReducer.test.ts` covering: EXPAND_EXERCISE with setIndex to pending set, to completed set, to skipped set, and without setIndex (regression)

- [x] Task 2: Wire SetDot to navigate to specific sets (AC: #6)
  - [x] 2.1 Update `onSetDotPress` handler in `[index]-v2.tsx` to pass the set index: `onSetDotPress={(sIdx) => handleSetDotNavigation(idx, sIdx)}`
  - [x] 2.2 Create `handleSetDotNavigation(exerciseIndex, setIndex)` that dispatches `expandExercise(exerciseIndex, setIndex)` and scrolls to the exercise
  - [x] 2.3 Update `expandExercise` dispatcher in `WorkoutExecutionContext.tsx` to accept optional `setIndex` parameter
  - [x] 2.4 Update `useWorkoutExecution` type to expose the updated `expandExercise` signature

- [x] Task 3: Add skip set UI to SetRow (AC: #9)
  - [x] 3.1 Add optional `onSkip?: () => void` prop to `SetRowProps` in `components/workout/SetRow.tsx`
  - [x] 3.2 For `active` state only: render a small "Skip" text (caption size, `subtext` color) as a Pressable below the set number on the left side
  - [x] 3.3 Skip text touch target: minimum 48pt height via hitSlop, `subtext` color, `caption` typography
  - [x] 3.4 Skip text accessibility: `accessibilityLabel="Skip set {n}"`, `accessibilityRole="button"`
  - [x] 3.5 Do NOT render skip for pending, completed, or editing states
  - [x] 3.6 Keep SetRow under ~300 lines — if close, extract state-specific render functions

- [x] Task 4: Wire skip action through components (AC: #9)
  - [x] 4.1 Add `onSetSkip?: (setIndex: number) => void` prop to `ExerciseAccordionItemProps`
  - [x] 4.2 Pass `onSkip` to SetRow in ExpandedContent: `onSkip={() => onSetSkip?.(sIdx)}`
  - [x] 4.3 In `[index]-v2.tsx`, create `handleSetSkip(exerciseIndex, setIndex)` that calls `skipSet(exerciseIndex, setIndex)` and dismisses the keypad
  - [x] 4.4 Pass `onSetSkip={sIdx => handleSetSkip(idx, sIdx)}` to each ExerciseAccordionItem

- [x] Task 5: Improve scroll-to-center behavior (AC: #11)
  - [x] 5.1 Track per-exercise layout positions using `onLayout` on each ExerciseAccordionItem wrapper
  - [x] 5.2 Store layout data in a ref: `Map<number, { y: number, height: number }>`
  - [x] 5.3 When expanding an exercise, calculate the scroll offset to center it: `exerciseY - (viewportHeight / 2) + (exerciseHeight / 2)`
  - [x] 5.4 Use `scrollRef.current?.scrollTo({ y: offset, animated: true })` with the content container aware of keypad padding
  - [x] 5.5 Delay scroll by ~100ms to allow the expand animation to begin
  - [x] 5.6 Fallback: if no layout data yet, use `exerciseIndex * ESTIMATED_ROW_HEIGHT` (current behavior)

- [x] Task 6: Write tests (AC: #12, #13)
  - [x] 6.1 Add tests to `__tests__/context/workoutReducer.test.ts` for EXPAND_EXERCISE with setIndex: pending target activates, completed target doesn't change status, missing setIndex keeps current behavior
  - [x] 6.2 Add tests to `__tests__/components/workout/SetRow.test.tsx` for skip button: renders only in active state, does not render in pending/completed/editing, fires onSkip callback, has correct accessibility label
  - [x] 6.3 Update `__tests__/components/workout/ExerciseAccordionItem.test.tsx` for onSetSkip prop wiring
  - [x] 6.4 Verify no new TypeScript compilation errors (`npm run compile`)
  - [x] 6.5 Verify all tests pass (`npm run test:run`)
  - [x] 6.6 Verify all files pass Prettier (`npm run lint:fix`)

## Dev Notes

### Architecture Constraints

- **Brownfield project:** This story modifies existing files only — no new files expected unless line count forces extraction.
- **Clean-room rebuild:** All changes remain within the v2 route and its component tree. Existing `[index].tsx` remains untouched.
- **Reducer is the source of truth:** All set status changes (confirm, skip, expand) go through the reducer. Components NEVER mutate set state directly.
- **No external icon library:** Use Unicode characters. "Skip" is text, not an icon.
- **Reanimated 4.2.1:** Already installed. Accordion animation already handled in ExerciseAccordionItem — no new animation libraries needed.

### What's Already Implemented (Stories 2.1–2.4)

**Reducer logic (all working, tested):**

- `CONFIRM_SET` — marks set as completed, stores confirmedReps/confirmedWeight, auto-advances via `findNextPendingSet` (forward scan, wrap-around), updates `expandedExerciseIndex` and `activeSetIndex`
- `SKIP_SET` — marks set as skipped, auto-advances to next pending set
- `EXPAND_EXERCISE` — collapses previous exercise (active→pending), expands new (first pending→active), updates `expandedExerciseIndex` and `activeSetIndex`
- `COMPLETE_WORKOUT` — marks all pending+active sets as skipped, sets `isCompleted=true`
- `findNextPendingSet` — pure helper with forward scan + wrap-around

**Components (all working, tested):**

- `SetDot` — 4 visual states (pending/active/completed/skipped), 28pt visual with hitSlop for 48pt touch, onPress callback already passes setIndex from ExerciseAccordionItem
- `SetRow` — 4 visual states (pending/active/completed/editing), fully controlled, no local state, confirm checkmark
- `NumericKeypad` — pure presentational 4×3 grid
- `KeypadOverlay` — absolute positioned overlay wrapper
- `ExerciseAccordionItem` — compact/expanded with reanimated height animation, renders SetRow and SetDot
- `WorkoutHeader` — elapsed timer, program name, End button
- `ConfirmationModal` — End Workout confirmation

**V2 route wiring (working):**

- `handleExpandExercise` — calls `expandExercise`, scrolls to estimated position
- `handleFieldPress` — opens/switches keypad for reps/weight input
- `handleSetConfirm` — calls `confirmSet` + `dismissKeypad`
- Back handler + beforeRemove listener → End Workout confirmation

### Gaps This Story Fills

**Gap 1: SetDot navigation ignores setIndex**

Currently in the v2 route:

```typescript
onSetDotPress={(_setIndex: number) => handleExpandExercise(idx)}
```

The `_setIndex` parameter is received but ignored. The exercise expands to its first pending set, NOT the tapped set. This story wires it to navigate to the specific set.

**Gap 2: No EXPAND_EXERCISE targeted set support**

The `EXPAND_EXERCISE` action currently always activates the first pending set in the target exercise. There's no way to specify "expand this exercise and make set N active." This story adds an optional `setIndex` parameter.

**Gap 3: No skip set UI**

`SKIP_SET` exists in the reducer and `skipSet` dispatcher exists in the context, but there's no UI to trigger it. SetRow has no skip button. This story adds a skip affordance on active sets.

**Gap 4: Rough scroll estimation**

Current scroll behavior uses `exerciseIndex * ESTIMATED_ROW_HEIGHT` (80px). This doesn't account for varying row heights (compact vs expanded) or the actual exercise position in the scroll view. This story adds layout-aware centering.

### WorkoutAction Type Change

Add optional `setIndex` to EXPAND_EXERCISE:

```typescript
// Before (types/workout.ts):
| { type: 'EXPAND_EXERCISE'; exerciseIndex: number }

// After:
| { type: 'EXPAND_EXERCISE'; exerciseIndex: number; setIndex?: number }
```

This is a backwards-compatible change — all existing dispatches that don't include `setIndex` will continue to work with the current behavior (activate first pending).

### Reducer Behavior for Targeted Navigation

When `EXPAND_EXERCISE` receives `setIndex`:

1. Collapse current exercise: all `active` sets → `pending` (unchanged from current)
2. In target exercise:
   - If `setIndex` provided AND `sets[setIndex].status === 'pending'` → activate that set
   - If `setIndex` provided AND status is `completed`/`skipped` → do NOT change status (editing is story 2.6), still set `activeSetIndex` to that index
   - If `setIndex` not provided → activate first pending set (current behavior)
3. Set `expandedExerciseIndex` to the new exercise
4. Set `activeSetIndex` to the resolved set index

### Skip Set Visual Specification

Skip appears as secondary text below the set number, only for active state:

```
┌──────────────────────────────────────────────────────────────┐
│  [1]    [  8  reps]    [  135  lbs]    [ ✓ ]                 │
│  Skip                                                         │
└──────────────────────────────────────────────────────────────┘
```

| Element | Style                                        |
| ------- | -------------------------------------------- |
| "Skip"  | `caption` (13pt Medium), `subtext` (#8C8EA0) |
| Touch   | Pressable with hitSlop for 48pt target       |
| Visible | Only when `status === 'active'`              |
| Hidden  | Pending, completed, editing states           |

The skip action:

1. Dispatches `skipSet(exerciseIndex, setIndex)`
2. Dismisses the keypad if open
3. Reducer auto-advances to next pending set (same behavior as CONFIRM_SET advancement)

### Scroll-to-Center Algorithm

```
1. User taps exercise row or set dot
2. handleExpandExercise or handleSetDotNavigation fires
3. After 100ms delay (let expand animation begin):
   a. Look up exercise layout: { y, height } from layoutRef
   b. Calculate viewport center: viewportHeight / 2
   c. Target scroll offset: exerciseY - viewportCenter + exerciseHeight / 2
   d. Clamp to [0, scrollContentHeight - viewportHeight]
   e. scrollRef.current.scrollTo({ y: offset, animated: true })
4. If layout not yet measured, fallback to index × ESTIMATED_ROW_HEIGHT
```

### Context Dispatcher Update

```typescript
// WorkoutExecutionContext.tsx - updated expandExercise:
const expandExercise = useCallback(
  (exerciseIndex: number, setIndex?: number) =>
    dispatch({ type: 'EXPAND_EXERCISE', exerciseIndex, setIndex }),
  []
)

// WorkoutExecutionContextValue type update:
expandExercise: (exerciseIndex: number, setIndex?: number) => void
```

### Previous Story Learnings (Stories 2.1–2.4)

**What worked well:**

- Pure function reducer with zero mocking needed for tests
- Named action dispatchers (`expandExercise()`, `logSet()`, `confirmSet()`) — components never access raw dispatch
- Unicode characters for icons (✓, –, ✎, ⌫) — no external icon library needed
- Separating `workoutReducer.ts` from context when files approach 300 lines
- Extracting helpers like `computeSetMeta` and `isExerciseComplete` as standalone pure functions
- `useKeypadState` as UI-only hook (transient state not in reducer)

**What went wrong:**

- **Wrong theme tokens:** `textSecondary` (doesn't exist) → use `subtext`, `borderRadius` → `radius`, `error` → `danger`. Always verify token names against `theme/theme.ts`.
- **Pre-existing TS errors from Epic 1 scope remain.** Do NOT fix: `haptics.notifyWarning` in `ConfirmationModal.tsx`, `SharedValue` in `profile.tsx`, and ~35 files referencing removed tokens. This story must not introduce NEW errors.
- **COMPLETE_WORKOUT** initially missed `active` sets when marking skipped — both `pending` and `active` must be handled. Already fixed in reducer.
- **Test environment requires explicit `import React from 'react'`** for JSX in test files.
- **Component tests needed recursive tree traversal** — function-typed nodes must be resolved to mock objects. Use `__tests__/helpers/mockNodeTraversal.ts`.
- **V2 route exceeded 300 lines in 2.4** — required extracting `buildInitialState` to `lib/workout/buildInitialState.ts` and keypad overlay to `components/workout/KeypadOverlay.tsx`.

**Current test count:** 138 tests (90 from 2.1/2.2/2.3, 48 from 2.4). This story adds tests for EXPAND_EXERCISE with setIndex, SetRow skip button, and ExerciseAccordionItem skip wiring.

### Theme Token Reference (Verified Against `theme/theme.ts`)

**Colors used in this story (all previously verified in story 2.4):**

| Token                          | Value                     | Usage                             |
| ------------------------------ | ------------------------- | --------------------------------- |
| `theme.colors.subtext`         | #8C8EA0                   | Skip text color                   |
| `theme.colors.primary`         | #818CF8                   | Active set number, focused inputs |
| `theme.colors.success`         | #34D399                   | Completed set dot checkmark       |
| `theme.colors.phases.doneBg`   | #161E1B                   | Completed dot background          |
| `theme.colors.muted`           | #53556A                   | Pending state, skipped dash       |
| `theme.colors.primaryTextOn`   | #FFFFFF                   | Active dot number                 |
| `theme.colors.surface`         | #14151A                   | Compact row background            |
| `theme.colors.surfaceElevated` | #1C1D24                   | Expanded content background       |
| `theme.colors.primaryLight`    | rgba(129, 140, 248, 0.12) | Compact-active row background     |

**Typography:**

| Token                      | Usage                     |
| -------------------------- | ------------------------- |
| `theme.typography.caption` | 13pt Medium — "Skip" text |

### Existing Components to Use (Do NOT Rebuild)

- **`SetDot`** (`components/workout/SetDot.tsx`) — already passes `sIdx` on press, no changes needed
- **`SetRow`** (`components/workout/SetRow.tsx`) — modify to add skip button on active state
- **`ExerciseAccordionItem`** (`components/workout/ExerciseAccordionItem.tsx`) — modify to pass skip handler
- **`WorkoutHeader`** + `ConfirmationModal` — no changes needed
- **`KeypadOverlay`** — no changes needed
- **`useKeypadState`** — no changes needed
- **`useEndWorkout`** — no changes needed

### V2 Route Current Structure (274 lines)

The v2 route (`app/programs/[id]/session/[index]-v2.tsx`) is at 274 lines after story 2.4. This story adds:

- `handleSetDotNavigation` callback (~5 lines)
- `handleSetSkip` callback (~5 lines)
- Layout tracking ref and onLayout wrapper (~15 lines)
- Updated scroll logic (~10 lines)

**Estimated total: ~300-310 lines.** If it exceeds 300, extract the scroll management into a `useScrollToExercise` hook.

### File Size Budget

| File                                           | Current Lines | Estimated After | Budget    |
| ---------------------------------------------- | ------------- | --------------- | --------- |
| `types/workout.ts`                             | 64            | ~64             | Under 300 |
| `context/workoutReducer.ts`                    | 250           | ~265            | Under 300 |
| `context/WorkoutExecutionContext.tsx`          | 145           | ~148            | Under 300 |
| `components/workout/SetRow.tsx`                | ~175          | ~195            | Under 300 |
| `components/workout/ExerciseAccordionItem.tsx` | 253           | ~260            | Under 300 |
| `app/programs/[id]/session/[index]-v2.tsx`     | 274           | ~300-310        | Under 300 |
| `__tests__/context/workoutReducer.test.ts`     | existing      | +~40            | Under 300 |
| `__tests__/components/workout/SetRow.test.tsx` | existing      | +~25            | Under 300 |

If the v2 route exceeds 300 lines, extract scroll management into `hooks/workout/useScrollToExercise.ts`.

### Anti-Patterns to Avoid

```typescript
// BAD: Ignoring setIndex on SetDot press
onSetDotPress={(_setIndex) => handleExpandExercise(idx)}

// GOOD: Pass setIndex for targeted navigation
onSetDotPress={(sIdx) => handleSetDotNavigation(idx, sIdx)}

// BAD: Adding skip state to the SetRow component
const [isSkipping, setIsSkipping] = useState(false)

// GOOD: Skip is a single dispatch — no local state needed
onSkip={() => onSkip?.()}

// BAD: Measuring scroll position synchronously during animation
const offset = scrollRef.current?.getScrollPosition() // doesn't exist

// GOOD: Use stored layout data from onLayout callbacks
const layout = exerciseLayoutsRef.current.get(exerciseIndex)
if (layout) { scrollRef.current?.scrollTo({ y: ... }) }

// BAD: New action type for set navigation
dispatch({ type: 'NAVIGATE_TO_SET', exerciseIndex, setIndex })

// GOOD: Extend existing EXPAND_EXERCISE with optional parameter
dispatch({ type: 'EXPAND_EXERCISE', exerciseIndex, setIndex })

// BAD: Hardcoded colors
<Text style={{ color: '#8C8EA0' }}>Skip</Text>

// GOOD: Theme tokens
<Text style={{ color: theme.colors.subtext }}>Skip</Text>
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
- Import `SetStatus` from `@/types/workout`
- Import context hooks from `@/hooks/workout`

### Testing Strategy

- **workoutReducer tests (new):** Test EXPAND_EXERCISE with setIndex:
  - Pending target set → set becomes active, activeSetIndex updated
  - Completed target set → status unchanged, activeSetIndex updated
  - Skipped target set → status unchanged, activeSetIndex updated
  - No setIndex provided → current behavior (first pending activates), regression test
  - Same exercise re-expand with different setIndex → correct set targeted

- **SetRow tests (additions):** Test skip button:
  - Active state: "Skip" text renders, has correct accessibility label
  - Pending/completed/editing states: no skip text rendered
  - onSkip callback fires when skip is pressed

- **ExerciseAccordionItem tests (additions):** Test onSetSkip prop:
  - onSetSkip fires with correct setIndex when skip pressed in expanded content

- **Mock `useWorkoutExecution`:** Mock the context hook to verify `expandExercise` receives setIndex, verify `skipSet` dispatches.

- **Vitest patterns:** `describe`/`it` blocks, `expect()` assertions, no snapshot tests.

- **reanimated mock:** Already handled in vitest.setup.ts from Story 2.3.

### Project Structure Notes

- `types/workout.ts` — MODIFY (add setIndex to EXPAND_EXERCISE)
- `context/workoutReducer.ts` — MODIFY (handle setIndex in EXPAND_EXERCISE)
- `context/WorkoutExecutionContext.tsx` — MODIFY (update expandExercise dispatcher signature)
- `components/workout/SetRow.tsx` — MODIFY (add skip button for active state)
- `components/workout/ExerciseAccordionItem.tsx` — MODIFY (add onSetSkip prop, pass to SetRow)
- `app/programs/[id]/session/[index]-v2.tsx` — MODIFY (wire SetDot navigation, wire skip, improve scroll)
- `hooks/workout/index.ts` — MODIFY only if extracting useScrollToExercise
- `__tests__/context/workoutReducer.test.ts` — MODIFY (add EXPAND_EXERCISE with setIndex tests)
- `__tests__/components/workout/SetRow.test.tsx` — MODIFY (add skip button tests)
- `__tests__/components/workout/ExerciseAccordionItem.test.tsx` — MODIFY (add onSetSkip tests)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5] — Acceptance criteria, user story, set confirmation and non-linear navigation
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — SCREAMING_SNAKE_CASE actions, `on{Event}` callbacks
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — EXPAND_EXERCISE action type, findNextPendingSet helper, context-controlled accordion
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Import types from `types/workout.ts`, dispatch through `useWorkoutExecution()`, no raw dispatch
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] — Accordion expansion (one at a time), set dot direct navigation, auto-advance on set completion, 300ms animated scroll
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Non-Linear Navigation Model] — Arbitrary navigation, tap pending/completed set on different exercise, auto-expand priority
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Action Hierarchy] — Only one primary action (confirm checkmark), skip is secondary tier
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — Navigation gets selection (light) haptic (Story 4.2 scope, not this story)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Modal & Overlay Patterns] — Only destructive actions get confirmation modal
- [Source: _bmad-output/planning-artifacts/prd.md#FR4] — Navigate to any set with a single action
- [Source: _bmad-output/planning-artifacts/prd.md#FR5] — Complete sets in any order (non-linear)
- [Source: _bmad-output/planning-artifacts/prd.md#FR6] — Auto-expand next pending exercise
- [Source: _bmad-output/planning-artifacts/prd.md#FR7] — End workout with remaining sets marked skipped
- [Source: _bmad-output/planning-artifacts/prd.md#FR9] — Skip individual sets without completing
- [Source: _bmad-output/planning-artifacts/prd.md#FR10] — Confirm pre-filled set with single action
- [Source: _bmad-output/implementation-artifacts/2-4-setrow-and-numerickeypad-for-set-logging.md] — Previous story learnings, SetRow structure, NumericKeypad, useKeypadState, test patterns, theme token corrections
- [Source: _bmad-output/project-context.md#Code Style] — Prettier config, no semicolons, single quotes, no trailing commas
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest, **tests**/ mirror, describe/it blocks

## Change Log

- 2026-03-13: Implemented set confirmation & non-linear navigation — EXPAND_EXERCISE targeted set support, SetDot→specific-set wiring, skip set UI on SetRow, skip action wiring through accordion, layout-aware scroll-to-center via useScrollToExercise hook. 12 new tests (150 total). All tests pass, no new TS errors, Prettier clean.
- 2026-03-13: Code review fixes — (1) Skip button hitSlop increased to 14 for 48pt touch target compliance. (2) Added skipped status visual treatment to SetRow (dash icon, muted color, reduced opacity). (3) useScrollToExercise: setTimeout cleanup on unmount, upper bound scroll clamping. (4) Added 4 new tests: 2 reducer tests for same-exercise targeting completed/skipped sets, 2 SetRow tests for skipped state rendering. 154 total tests passing.

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (via Cursor)

### Debug Log References

- No blockers or debug issues encountered during implementation.

### Completion Notes List

- **Task 1**: Extended EXPAND_EXERCISE action with optional `setIndex`. Added `activateInExercise` pure helper to handle targeted vs first-pending activation. Pending targets get activated; completed/skipped targets preserve status but update `activeSetIndex`. Same-exercise re-expansion with setIndex now works (was previously a no-op). 5 new reducer tests.
- **Task 2**: Wired SetDot presses to `handleSetDotNavigation` which dispatches `expandExercise(exerciseIndex, setIndex)`. Updated context dispatcher and type signature to accept optional `setIndex`.
- **Task 3**: Added `onSkip` prop to SetRow. Skip text renders only for active state as a Pressable below the set number with caption typography, subtext color, and hitSlop for 48pt touch target. Correct accessibility labels.
- **Task 4**: Added `onSetSkip` prop through ExerciseAccordionItem → ExpandedContent → SetRow. V2 route creates `handleSetSkip` that calls `skipSet` + `dismissKeypad`.
- **Task 5**: Extracted scroll management into `useScrollToExercise` hook. Uses per-exercise `onLayout` callbacks to track actual positions. Scroll-to-center calculates `exerciseY - viewportHeight/2 + exerciseHeight/2` with fallback to estimated row height. V2 route stays at 292 lines.
- **Task 6**: Added 7 skip button tests to SetRow, 1 skip wiring test to ExerciseAccordionItem, 4 targeted navigation tests to reducer (written during Task 1 RED phase). All 150 tests pass. No new TS compilation errors. Prettier clean.

### File List

- `types/workout.ts` — modified (added `setIndex?: number` to EXPAND_EXERCISE action)
- `context/workoutReducer.ts` — modified (added `activateInExercise` helper, updated EXPAND_EXERCISE handler for targeted set navigation and same-exercise re-expansion)
- `context/WorkoutExecutionContext.tsx` — modified (updated `expandExercise` dispatcher and type to accept optional `setIndex`)
- `components/workout/SetRow.tsx` — modified (added `onSkip` prop, skip text UI for active state; review: added skipped status visual treatment with dash icon and opacity, increased skip hitSlop to 14)
- `components/workout/ExerciseAccordionItem.tsx` — modified (added `onSetSkip` prop, wired through ExpandedContent to SetRow)
- `app/programs/[id]/session/[index]-v2.tsx` — modified (wired SetDot navigation, skip action, replaced inline scroll with `useScrollToExercise` hook, added `onLayout` wrappers)
- `hooks/workout/useScrollToExercise.ts` — new (layout-aware scroll-to-center hook; review: added timeout cleanup, upper bound scroll clamping)
- `hooks/workout/index.ts` — modified (exported `useScrollToExercise`)
- `__tests__/context/workoutReducer.test.ts` — modified (added 4 EXPAND_EXERCISE with setIndex tests; review: added 2 same-exercise completed/skipped targeting tests)
- `__tests__/components/workout/SetRow.test.tsx` — modified (added 7 skip button tests; review: added 2 skipped state rendering tests)
- `__tests__/components/workout/ExerciseAccordionItem.test.tsx` — modified (added 1 onSetSkip wiring test)
