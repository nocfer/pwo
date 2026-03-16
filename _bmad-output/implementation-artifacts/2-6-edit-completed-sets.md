# Story 2.6: Edit Completed Sets

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to tap a completed set to correct a mistake in my logged values,
So that my workout data is accurate even if I entered something wrong.

## Acceptance Criteria

1. **Given** a set has been confirmed and shows as completed (green) **When** the user taps the completed set dot or set row **Then** the exercise expands (if not already) and the set row enters editing state
2. In editing state, a pencil icon replaces the set number and the border changes to dashed primary
3. The logged reps and weight values are displayed and editable via the NumericKeypad
4. The user can modify values and tap the re-confirm button to save changes (FR13)
5. Re-confirming updates the stored values and returns the set to completed state
6. If the user navigates away from an editing set without re-confirming, edits are discarded and original logged values are preserved (FR14)
7. No data corruption occurs from abandoned edits
8. No file exceeds ~300 lines
9. The existing test suite passes (`npm run test:run`)

## Tasks / Subtasks

- [x] Task 1: Add EDIT_SET action and reducer handler (AC: #1, #2, #3, #6, #7)
  - [x] 1.1 Add `EDIT_SET` action type `{ type: 'EDIT_SET'; exerciseIndex: number; setIndex: number }` to `WorkoutAction` in `types/workout.ts`
  - [x] 1.2 Add `revertEditingSets(exercises)` pure helper in `workoutReducer.ts` — scans all exercises/sets for `status === 'editing'`, reverts each to `completed` with `reps = confirmedReps`, `weight = confirmedWeight`
  - [x] 1.3 Add `EDIT_SET` case in `workoutReducer`: call `revertEditingSets` first (handles edit-to-edit switching), then transition target set from `completed` to `editing` (guard: only if status is `completed`), set `expandedExerciseIndex` to the target exercise, set `activeSetIndex` to the target set
  - [x] 1.4 Integrate `revertEditingSets` into existing `EXPAND_EXERCISE` handler (call before collapsing current exercise — any editing set reverts to completed with original values)
  - [x] 1.5 Integrate `revertEditingSets` into `COMPLETE_WORKOUT` handler (revert before marking remaining as skipped — editing sets revert to completed, not skipped)
  - [x] 1.6 Unit tests in `__tests__/context/workoutReducer.test.ts` covering: EDIT_SET on completed set, EDIT_SET on non-completed set (no-op), EDIT_SET switches from one editing set to another, EXPAND_EXERCISE reverts editing set, COMPLETE_WORKOUT reverts editing set, CONFIRM_SET on editing set (re-confirm)

- [x] Task 2: Add editSet dispatcher to context (AC: #1)
  - [x] 2.1 Add `editSet: (exerciseIndex: number, setIndex: number) => void` to `WorkoutExecutionContextValue` type in `WorkoutExecutionContext.tsx`
  - [x] 2.2 Implement `editSet` dispatcher with `useCallback`: `dispatch({ type: 'EDIT_SET', exerciseIndex, setIndex })`
  - [x] 2.3 Add `editSet` to the context provider value object

- [x] Task 3: Wire editing entry points in v2 route (AC: #1, #3)
  - [x] 3.1 Update `handleSetDotNavigation(exerciseIndex, setIndex)`: check `state.exercises[exerciseIndex].sets[setIndex].status` — if `'completed'`, call `editSet(exerciseIndex, setIndex)` instead of `expandExercise(exerciseIndex, setIndex)`, then scroll
  - [x] 3.2 Create `handleSetRowPress(exerciseIndex, setIndex)`: if set status is `'completed'`, call `editSet(exerciseIndex, setIndex)` then `handleFieldPress(exerciseIndex, setIndex, 'reps')`. Otherwise, call `handleFieldPress(exerciseIndex, setIndex, 'reps')` (existing behavior)
  - [x] 3.3 Update ExerciseAccordionItem `onSetPress` prop to use `handleSetRowPress`
  - [x] 3.4 After entering edit mode via set dot from compact view, open keypad to reps: `handleFieldPress(exerciseIndex, setIndex, 'reps')`

- [x] Task 4: Handle discard-on-navigate (AC: #6, #7)
  - [x] 4.1 Verify `revertEditingSets` in `EXPAND_EXERCISE` handler correctly restores `reps`/`weight` from `confirmedReps`/`confirmedWeight`
  - [x] 4.2 Verify `CONFIRM_SET` on editing set works correctly: stores new `confirmedReps`/`confirmedWeight` from current `reps`/`weight`, transitions to `completed`, auto-advances to next pending
  - [x] 4.3 Verify keypad dismissal on navigate-away: when `EXPAND_EXERCISE` fires, keypad should auto-dismiss (existing `dismissKeypad` in `handleExpandExercise` handles this)
  - [x] 4.4 Edge case: user taps same editing set's dot again — should be no-op (already editing that set)

- [x] Task 5: Write tests (AC: #8, #9)
  - [x] 5.1 Reducer tests (`__tests__/context/workoutReducer.test.ts`):
    - EDIT_SET: completed → editing, activeSetIndex updated, expandedExerciseIndex updated
    - EDIT_SET: non-completed set → state unchanged
    - EDIT_SET: switching from editing set A to editing set B → A reverts to completed, B enters editing
    - EXPAND_EXERCISE: reverts editing set to completed with original confirmed values
    - CONFIRM_SET on editing set: updates confirmedReps/confirmedWeight, returns to completed
    - COMPLETE_WORKOUT: reverts editing set to completed (not skipped)
  - [ ] 5.2 V2 route integration: verify handleSetDotNavigation dispatches editSet for completed sets (descoped to reducer-level coverage — no component integration test written)
  - [x] 5.3 Verify no new TypeScript compilation errors (`npm run compile`)
  - [x] 5.4 Verify all tests pass (`npm run test:run`)
  - [x] 5.5 Verify all files pass Prettier (`npm run lint:fix`)

## Dev Notes

### Architecture Constraints

- **Brownfield project:** This story modifies existing files only — no new files expected.
- **Clean-room rebuild:** All changes remain within the v2 route and its component tree. Existing `[index].tsx` remains untouched.
- **Reducer is the source of truth:** All set status changes go through the reducer. Components NEVER mutate set state directly.
- **No external icon library:** SetRow already uses Unicode `✎` (pencil) for editing state — no changes needed.
- **Reanimated 4.2.1:** Already installed. No new animation work needed.
- **SetRow visual treatment for editing already exists:** Pencil icon, dashed primary border, re-confirm button — all implemented in Story 2.4. This story only adds the STATE TRANSITIONS and WIRING.

### What's Already Implemented (Stories 2.1–2.5)

**Types (already in `types/workout.ts`):**

- `SetStatus` = `'pending' | 'active' | 'completed' | 'skipped' | 'editing'` — editing already defined
- `ExerciseSetState` has `confirmedReps?: number` and `confirmedWeight?: number` — backup values already exist

**Reducer logic (all working, tested in `context/workoutReducer.ts`, 283 lines):**

- `CONFIRM_SET` — marks set as completed, stores `confirmedReps`/`confirmedWeight` from current `reps`/`weight`, auto-advances via `findNextPendingSet`
- `SKIP_SET` — marks set as skipped, auto-advances
- `EXPAND_EXERCISE` — collapses previous exercise (active→pending), expands new, supports optional `setIndex` for targeted navigation. Uses `activateInExercise` helper which only activates `pending` sets.
- `COMPLETE_WORKOUT` — marks all pending+active sets as skipped
- `findNextPendingSet` — pure helper with forward scan + wrap-around (searches for `pending` status only)

**SetRow visual states (`components/workout/SetRow.tsx`, 237 lines):**

- **editing state already fully styled:**
  - Pencil icon (`✎`) replaces set number
  - Dashed primary border (`rowEditing` style)
  - Confirm button styled same as active (acts as re-confirm)
  - Accessibility label: "Re-confirm set N"
  - Reps/weight fields are editable (same as active)

**Context (`context/WorkoutExecutionContext.tsx`, 145 lines):**

- Dispatchers: `expandExercise`, `logSet`, `confirmSet`, `skipSet`, `startRestTimer`, `dismissRestTimer`, `completeWorkout`, `restoreState`
- Missing: `editSet` dispatcher

**V2 route (`app/programs/[id]/session/[index]-v2.tsx`, 291 lines):**

- `handleSetDotNavigation(exerciseIndex, setIndex)` — currently calls `expandExercise(exerciseIndex, setIndex)` for ALL set statuses (doesn't check if completed)
- `handleFieldPress(exerciseIndex, setIndex, field)` — opens keypad, no status check
- `handleSetConfirm(exerciseIndex, setIndex)` — confirms set + dismisses keypad
- `onSetPress={(sIdx) => handleFieldPress(idx, sIdx, 'reps')}` — opens keypad on reps for any set press in expanded view

**useKeypadState (`hooks/workout/useKeypadState.ts`, 136 lines):**

- No status checks — works on any set regardless of status. Will work as-is for editing sets.

### Gaps This Story Fills

**Gap 1: No EDIT_SET action**

The `WorkoutAction` union has no way to transition a completed set to editing state. The `EXPAND_EXERCISE` action navigates to completed sets but doesn't change their status — the set stays `completed` and is read-only.

**Gap 2: No discard-on-navigate**

When a user navigates away (EXPAND_EXERCISE fires), there's no mechanism to revert an editing set back to completed with its original confirmed values. The `revertEditingSets` helper fixes this.

**Gap 3: Set dot and row press don't enter edit mode**

`handleSetDotNavigation` always dispatches `expandExercise`. For completed sets, it should dispatch `editSet`. Similarly, `onSetPress` in the expanded view doesn't distinguish between completed and other states.

### EDIT_SET Reducer Behavior

```
1. Call revertEditingSets(exercises) — revert any currently editing set
2. Guard: if target set status !== 'completed' → return state unchanged
3. Transition target set: status = 'editing' (reps/weight remain = confirmedReps/confirmedWeight — already there from CONFIRM_SET)
4. Set expandedExerciseIndex = exerciseIndex
5. Set activeSetIndex = setIndex
```

### revertEditingSets Helper

```
Pure function: (exercises: ExerciseState[]) => ExerciseState[]

For each exercise, for each set:
  if set.status === 'editing':
    set.status = 'completed'
    set.reps = set.confirmedReps (restore original)
    set.weight = set.confirmedWeight (restore original)

Returns new array (immutable update)
```

This helper is called by:

- `EDIT_SET` (before entering new edit — handles edit-to-edit switching)
- `EXPAND_EXERCISE` (before collapsing — discards uncommitted edits)
- `COMPLETE_WORKOUT` (before marking remaining — editing sets revert to completed, not skipped)

### Re-Confirm Flow (Already Works)

CONFIRM_SET on an editing set:

1. `status` → `'completed'` (same as normal confirm)
2. `confirmedReps` = current `reps` (now potentially modified)
3. `confirmedWeight` = current `weight` (now potentially modified)
4. Auto-advance to next pending set via `findNextPendingSet`

No special handling needed — the existing CONFIRM_SET handler already works correctly for editing sets.

### V2 Route Handler Changes

```typescript
// Updated handleSetDotNavigation:
const handleSetDotNavigation = useCallback(
  (exerciseIndex: number, setIndex: number) => {
    const set = state.exercises[exerciseIndex].sets[setIndex]
    if (set.status === 'completed') {
      editSet(exerciseIndex, setIndex)
      handleFieldPress(exerciseIndex, setIndex, 'reps')
    } else {
      expandExercise(exerciseIndex, setIndex)
    }
    scrollToExercise(exerciseIndex)
  },
  [state.exercises, editSet, expandExercise, handleFieldPress, scrollToExercise]
)

// New handleSetRowPress (replaces inline handleFieldPress for onSetPress):
const handleSetRowPress = useCallback(
  (exerciseIndex: number, setIndex: number) => {
    const set = state.exercises[exerciseIndex].sets[setIndex]
    if (set.status === 'completed') {
      editSet(exerciseIndex, setIndex)
    }
    handleFieldPress(exerciseIndex, setIndex, 'reps')
  },
  [state.exercises, editSet, handleFieldPress]
)
```

### Edge Cases

| Scenario                                                         | Expected Behavior                                                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Tap completed set dot from compact view                          | Expand exercise, enter editing, open keypad to reps                                                                             |
| Tap completed set row in expanded view                           | Enter editing, open keypad to reps                                                                                              |
| Tap completed reps/weight field                                  | Enter editing, open keypad to that field                                                                                        |
| Re-confirm with modified values                                  | CONFIRM_SET stores new values, returns to completed                                                                             |
| Re-confirm with same values (no changes)                         | CONFIRM_SET stores same values, returns to completed                                                                            |
| Navigate away while editing (tap different exercise)             | EXPAND_EXERCISE reverts editing → completed with original values                                                                |
| Navigate away while editing (tap different set in same exercise) | If pending: EXPAND_EXERCISE activates that set, reverts editing. If completed: EDIT_SET reverts old editing, enters new editing |
| End workout while editing                                        | COMPLETE_WORKOUT reverts editing → completed, then marks remaining pending/active as skipped                                    |
| Tap same editing set's dot again                                 | No-op — already editing that set in that exercise                                                                               |
| EDIT_SET on pending/active/skipped set                           | Guard: no-op — only `completed` sets can be edited                                                                              |

### Previous Story Learnings (Stories 2.1–2.5)

**What worked well:**

- Pure function reducer with zero mocking needed for tests
- Named action dispatchers (`expandExercise()`, `confirmSet()`) — components never access raw dispatch
- Unicode characters for icons (✓, –, ✎, ⌫) — no external icon library
- Separating `workoutReducer.ts` from context when files approach 300 lines
- Extracting helpers like `computeSetMeta` and `isExerciseComplete` as standalone pure functions
- `useKeypadState` as UI-only hook (transient state not in reducer)

**What went wrong:**

- **Wrong theme tokens:** `textSecondary` (doesn't exist) → use `subtext`, `borderRadius` → `radius`, `error` → `danger`. Always verify token names against `theme/theme.ts`.
- **Pre-existing TS errors from Epic 1 scope remain.** Do NOT fix: `haptics.notifyWarning` in `ConfirmationModal.tsx`, `SharedValue` in `profile.tsx`, and ~35 files referencing removed tokens. This story must not introduce NEW errors.
- **Test environment requires explicit `import React from 'react'`** for JSX in test files.
- **Component tests needed recursive tree traversal** — function-typed nodes must be resolved to mock objects. Use `__tests__/helpers/mockNodeTraversal.ts`.

**Current test count:** 154 tests (from stories 2.1-2.5). This story adds tests for EDIT_SET action, revertEditingSets behavior, and integration tests.

### Theme Token Reference (Verified Against `theme/theme.ts`)

All tokens from story 2.4/2.5 apply — no new tokens needed for this story. Editing visual state already uses:

| Token                        | Value   | Usage                              |
| ---------------------------- | ------- | ---------------------------------- |
| `theme.colors.primary`       | #818CF8 | Dashed border color on editing row |
| `theme.colors.subtext`       | #8C8EA0 | Skip text (existing, not modified) |
| `theme.colors.success`       | #34D399 | Completed set dot checkmark        |
| `theme.colors.phases.doneBg` | #161E1B | Completed dot background           |

### File Size Budget

| File                                           | Current Lines | Estimated After   | Budget                                                                                |
| ---------------------------------------------- | ------------- | ----------------- | ------------------------------------------------------------------------------------- |
| `types/workout.ts`                             | 64            | ~65               | Under 300                                                                             |
| `context/workoutReducer.ts`                    | 283           | ~310              | ⚠️ Close — extract `revertEditingSets` as inline helper (not a new file) to keep lean |
| `context/WorkoutExecutionContext.tsx`          | 145           | ~155              | Under 300                                                                             |
| `components/workout/SetRow.tsx`                | 237           | ~237 (no changes) | Under 300                                                                             |
| `components/workout/ExerciseAccordionItem.tsx` | 258           | ~258 (no changes) | Under 300                                                                             |
| `app/programs/[id]/session/[index]-v2.tsx`     | 291           | ~310              | ⚠️ Close — extract `handleSetRowPress` into existing handler pattern                  |

**If workoutReducer.ts exceeds 300 lines:** The `revertEditingSets` helper is small (~15 lines). Combined with the EDIT_SET case (~15 lines), the reducer grows to ~313 lines. If needed, extract `findNextPendingSet` + `activateInExercise` + `revertEditingSets` into a `lib/workout/reducerHelpers.ts` file. But try to keep them inline first — they're small and tightly coupled to the reducer.

**If v2 route exceeds 300 lines:** Extract `handleSetRowPress` as a combined handler that delegates to `editSet` or `handleFieldPress` based on status. Consider extracting all "set interaction" handlers into a `useSetInteractions` hook if needed.

### Anti-Patterns to Avoid

```typescript
// BAD: Adding local state for editing
const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null)

// GOOD: Editing state lives in reducer (status === 'editing')
const set = state.exercises[exerciseIndex].sets[setIndex]
if (set.status === 'editing') { ... }

// BAD: Separate CANCEL_EDIT action
dispatch({ type: 'CANCEL_EDIT', exerciseIndex, setIndex })

// GOOD: Implicit cancel via revertEditingSets in EXPAND_EXERCISE
// Navigation away = automatic discard

// BAD: Checking old values manually
if (reps !== originalReps || weight !== originalWeight) { ... }

// GOOD: confirmedReps/confirmedWeight are the backup
// revertEditingSets restores them, CONFIRM_SET overwrites them

// BAD: Modifying SetRow component
// SetRow already has editing visual state fully implemented!

// GOOD: Only modify reducer, context, and v2 route wiring

// BAD: Creating a new file for edit logic
// This story is small enough to fit in existing files

// GOOD: Add EDIT_SET to existing reducer, add editSet to existing context

// BAD: Hardcoded colors
<View style={{ borderColor: '#818CF8', borderStyle: 'dashed' }}>

// GOOD: Already done in SetRow with theme tokens
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

- **workoutReducer tests (new):** Test EDIT_SET action:
  - Completed set → editing: status changes, activeSetIndex and expandedExerciseIndex updated
  - Non-completed set → no change (guard)
  - Edit-to-edit switch: first editing set reverts, second enters editing
  - EXPAND_EXERCISE reverts editing: status back to completed, reps/weight restored from confirmedReps/confirmedWeight
  - CONFIRM_SET on editing set: confirmedReps/confirmedWeight updated, status → completed, auto-advance
  - COMPLETE_WORKOUT with editing set: editing → completed (not skipped), then remaining pending/active → skipped

- **Vitest patterns:** `describe`/`it` blocks, `expect()` assertions, no snapshot tests.

- **reanimated mock:** Already handled in `vitest.setup.ts` from Story 2.3.

- **Import React:** Required explicit `import React from 'react'` in test files with JSX.

### Project Structure Notes

- `types/workout.ts` — MODIFY (add EDIT_SET to WorkoutAction union)
- `context/workoutReducer.ts` — MODIFY (add revertEditingSets helper, add EDIT_SET case, integrate revert into EXPAND_EXERCISE and COMPLETE_WORKOUT)
- `context/WorkoutExecutionContext.tsx` — MODIFY (add editSet dispatcher and type)
- `app/programs/[id]/session/[index]-v2.tsx` — MODIFY (update handleSetDotNavigation, add handleSetRowPress, wire to ExerciseAccordionItem)
- `components/workout/SetRow.tsx` — NO CHANGES (editing visual already implemented)
- `components/workout/ExerciseAccordionItem.tsx` — NO CHANGES (passes onSetPress through generically)
- `__tests__/context/workoutReducer.test.ts` — MODIFY (add EDIT_SET and revert tests)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.6] — Acceptance criteria, user story, edit completed sets requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — SCREAMING_SNAKE_CASE actions, `on{Event}` callbacks
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — WorkoutAction union type, context-controlled state
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Import types from `types/workout.ts`, dispatch through `useWorkoutExecution()`, no raw dispatch
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Non-Linear Navigation Model] — "Tap completed set (green) → Expand exercise showing that set's logged values. User can edit and re-confirm."
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SetRow Component] — Editing state: pencil icon, dashed primary border, re-confirm button
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Edge Cases] — "If user navigates away from an editing set without re-confirming, edits are discarded. The original logged value is preserved."
- [Source: _bmad-output/planning-artifacts/prd.md#FR13] — Edit previously confirmed set and re-confirm
- [Source: _bmad-output/planning-artifacts/prd.md#FR14] — Discard uncommitted edits on navigate away
- [Source: _bmad-output/implementation-artifacts/2-5-set-confirmation-and-non-linear-navigation.md] — Previous story learnings, EXPAND_EXERCISE with setIndex, scroll-to-center, test patterns
- [Source: _bmad-output/implementation-artifacts/2-4-setrow-and-numerickeypad-for-set-logging.md] — SetRow editing visual state implementation, theme token corrections
- [Source: _bmad-output/project-context.md#Code Style] — Prettier config, no semicolons, single quotes, no trailing commas
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest, **tests**/ mirror, describe/it blocks

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Added `EDIT_SET` action to `WorkoutAction` union type, enabling completed → editing state transitions
- Implemented `revertEditingSets` pure helper that restores editing sets to completed with original confirmed values
- Integrated `revertEditingSets` into `EXPAND_EXERCISE` (discard-on-navigate) and `COMPLETE_WORKOUT` (prevent editing sets from being skipped)
- Added `editSet` dispatcher to `WorkoutExecutionContext` with proper typing and useCallback memoization
- Updated `handleSetDotNavigation` in v2 route to enter edit mode + open keypad for completed set dots
- Created `handleSetRowPress` in v2 route to enter edit mode when tapping completed set rows in expanded view
- Added no-op guard for tapping same editing set's dot again (edge case 4.4)
- Reordered `handleFieldPress` before dependent handlers to fix declaration order
- 12 new tests added: revertEditingSets (3), EDIT_SET (6), EXPAND_EXERCISE with editing (1), CONFIRM_SET re-confirm (1), COMPLETE_WORKOUT with editing (1)
- All 166 tests pass, no new TS errors, Prettier clean

**Code Review Fixes (2026-03-13):**

- [CRITICAL] Fixed EDIT_SET to deactivate existing 'active' sets before entering edit mode — prevented dual-active state bug where CONFIRM_SET after EDIT_SET created two active sets
- [HIGH] Extracted reducer helpers (findNextPendingSet, activateInExercise, revertEditingSets) into context/reducerHelpers.ts — workoutReducer.ts reduced from 336 → 247 lines
- [MEDIUM] Added dismissKeypad() to handleExpandExercise — keypad now reliably dismisses on exercise navigation
- [MEDIUM] Strengthened EDIT_SET test to verify active-set deactivation; added dual-active prevention regression test
- [NOTE] Task 5.2 (V2 route integration test) descoped to reducer-level coverage — no component test written

### Change Log

- 2026-03-13: Implemented edit completed sets feature — EDIT_SET reducer action, revertEditingSets helper, context dispatcher, v2 route wiring, and 11 unit tests
- 2026-03-13: [Code Review Fix] EDIT_SET now deactivates active sets before entering edit mode — prevents dual-active state after re-confirm
- 2026-03-13: [Code Review Fix] Extracted findNextPendingSet, activateInExercise, revertEditingSets into context/reducerHelpers.ts — workoutReducer.ts reduced from 336 to 247 lines
- 2026-03-13: [Code Review Fix] handleExpandExercise now calls dismissKeypad() — keypad reliably dismisses on exercise navigation
- 2026-03-13: [Code Review Fix] Added dual-active prevention test and strengthened EDIT_SET deactivation assertions — 166 total tests

### File List

- types/workout.ts (modified) — Added EDIT_SET to WorkoutAction union
- context/reducerHelpers.ts (new) — Extracted findNextPendingSet, activateInExercise, revertEditingSets pure helpers
- context/workoutReducer.ts (modified) — EDIT_SET case with active-set deactivation, imports helpers from reducerHelpers.ts
- context/WorkoutExecutionContext.tsx (modified) — Added editSet type, dispatcher, and provider value
- app/programs/[id]/session/[index]-v2.tsx (modified) — Updated handleSetDotNavigation, added handleSetRowPress, wired onSetPress, added dismissKeypad to handleExpandExercise
- **tests**/context/workoutReducer.test.ts (modified) — 12 new tests for EDIT_SET, revertEditingSets, deactivation, dual-active prevention, EXPAND_EXERCISE revert, CONFIRM_SET re-confirm, COMPLETE_WORKOUT revert
- \_bmad-output/implementation-artifacts/sprint-status.yaml (modified) — Story status tracking
