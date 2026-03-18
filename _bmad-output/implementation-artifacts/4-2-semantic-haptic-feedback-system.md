# Story 4.2: Semantic Haptic Feedback System

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to feel satisfying tactile feedback when I complete sets, hit PRs, and finish workouts,
So that each action feels confirmed and rewarding.

## Acceptance Criteria

1. **Given** the existing `lib/haptics.ts` abstraction **When** semantic haptic functions are added **Then** `haptics.setConfirmed()` fires medium impact haptic on set confirmation (FR33)
2. `haptics.exerciseCompleted()` fires success notification haptic when all sets of an exercise are done
3. `haptics.prDetected()` fires heavy impact haptic on personal record detection (FR33)
4. `haptics.restTimerFinished()` fires light impact haptic when rest timer reaches zero (FR33) — **already implemented in Story 4.1**
5. `haptics.workoutCompleted()` fires success notification haptic on workout completion (FR33)
6. `haptics.navigationTap()` fires selection (light) haptic on exercise/set navigation
7. All haptic calls go through `lib/haptics.ts` — no component directly imports `expo-haptics`
8. All haptic functions gracefully no-op on web (no errors, no warnings)
9. Haptic functions are called from the correct trigger points: `[index]-v2.tsx` `handleSetConfirm` on confirm, exercise-completion detection after confirm, `useRestTimer` on timer finish (already done), `useEndWorkout`/completion path on workout done
10. Unit tests in `__tests__/lib/haptics.test.ts` verify all semantic functions exist and call the correct haptic types
11. No file exceeds ~300 lines
12. The existing test suite passes (`npm run test:run`)

## Tasks / Subtasks

- [x] Task 1: Add missing semantic haptic functions to `lib/haptics.ts` (AC: #1, #2, #3, #5, #6, #8)
  - [x] 1.1 Add `setConfirmed: tapMedium` — medium impact for set confirmation (UX spec: medium impact, 200ms)
  - [x] 1.2 Add `exerciseCompleted: notifySuccess` — success notification when all sets of an exercise are done
  - [x] 1.3 Add `prDetected: tapHeavy` — heavy impact for PR detection (UX spec: heavy impact, 400ms)
  - [x] 1.4 Add `workoutCompleted: notifySuccess` — success notification on workout completion (UX spec: success, 1000ms animation context)
  - [x] 1.5 Add `navigationTap: selectionChanged` — selection haptic on exercise/set navigation (UX spec: light selection, 250ms)
  - [x] 1.6 Verify `restTimerFinished: tapLight` already exists (added in Story 4.1) — no change needed
  - [x] 1.7 Verify all base functions (`tapLight`, `tapMedium`, `tapHeavy`, `notifySuccess`, `selectionChanged`) already check `Platform.OS === 'ios'` for web safety — no change needed

- [x] Task 2: Integrate `haptics.setConfirmed()` into set confirmation flow (AC: #1, #9)
  - [x] 2.1 In `app/programs/[id]/session/[index]-v2.tsx`, import `haptics` from `@/lib/haptics`
  - [x] 2.2 In `handleSetConfirm`, call `haptics.setConfirmed()` after `confirmSet(exerciseIndex, setIndex)` — fire-and-forget, no await
  - [x] 2.3 Verify haptic fires on both fresh set confirm AND re-confirm after editing

- [x] Task 3: Integrate `haptics.exerciseCompleted()` on exercise completion (AC: #2, #9)
  - [x] 3.1 In `handleSetConfirm`, after calling `confirmSet()`, detect if the confirmed exercise is now fully done by checking if all sets in `state.exercises[exerciseIndex]` are `completed` or `skipped` (check the PREVIOUS set status since the current one was just confirmed)
  - [x] 3.2 **CRITICAL TIMING:** The reducer runs synchronously, but `state` in the callback closure is the pre-dispatch snapshot. Use a `useEffect` that watches for `expandedExerciseIndex` changes to detect exercise transitions instead, OR compute completion from the pre-confirm state (the current set being confirmed is the one to check)
  - [x] 3.3 Recommended approach: In `handleSetConfirm`, before calling `confirmSet`, check if this is the last non-completed/non-skipped set in the exercise. If so, the exercise will be complete after confirmation → call `haptics.exerciseCompleted()` after `haptics.setConfirmed()`
  - [x] 3.4 Do NOT fire `exerciseCompleted` on SKIP_SET (only on confirm of the last pending set)

- [x] Task 4: Integrate `haptics.navigationTap()` on navigation actions (AC: #6, #9)
  - [x] 4.1 In `handleExpandExercise`, call `haptics.navigationTap()` — fire-and-forget
  - [x] 4.2 In `handleSetDotNavigation`, call `haptics.navigationTap()` — fire-and-forget
  - [x] 4.3 Do NOT add haptic to `handleFieldPress` (opening keypad) or `handleSetRowPress` (editing) — UX spec says no feedback for opening numeric keypad

- [x] Task 5: Integrate `haptics.workoutCompleted()` on workout completion (AC: #5, #9)
  - [x] 5.1 In `useEndWorkout` hook (or in `confirmEnd` handler in `[index]-v2.tsx`), call `haptics.workoutCompleted()` when the workout transitions to completed state
  - [x] 5.2 Also detect "natural completion" — when all sets across all exercises are done after a confirm, the workout should also trigger `haptics.workoutCompleted()`. If this auto-complete doesn't exist yet, add the haptic call where it will be wired in Epic 7 CompletionSummary
  - [x] 5.3 If CompletionSummary component doesn't exist yet, wire the haptic into the `confirmEnd` function call in `[index]-v2.tsx` as the interim trigger point (Epic 7 will refine placement)

- [x] Task 6: Write unit tests for haptics (AC: #10, #12)
  - [x] 6.1 Create `__tests__/lib/haptics.test.ts`
  - [x] 6.2 Mock `expo-haptics` module and `Platform` from `react-native`
  - [x] 6.3 Test all semantic function mappings exist on the `haptics` object
  - [x] 6.4 Test `setConfirmed` calls `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`
  - [x] 6.5 Test `exerciseCompleted` calls `Haptics.notificationAsync(NotificationFeedbackType.Success)`
  - [x] 6.6 Test `prDetected` calls `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)`
  - [x] 6.7 Test `workoutCompleted` calls `Haptics.notificationAsync(NotificationFeedbackType.Success)`
  - [x] 6.8 Test `navigationTap` calls `Haptics.selectionAsync()`
  - [x] 6.9 Test `restTimerFinished` calls `Haptics.impactAsync(ImpactFeedbackStyle.Light)` (verify existing mapping)
  - [x] 6.10 Test all base functions no-op when `Platform.OS !== 'ios'` (web safety)
  - [x] 6.11 Run `npm run compile` — no new TypeScript errors
  - [x] 6.12 Run `npm run test:run` — all tests pass
  - [x] 6.13 Run `npm run lint:fix` — all files pass Prettier

## Dev Notes

### Architecture Constraints

- **Brownfield project:** Modifying 2 existing files (`lib/haptics.ts`, `app/programs/[id]/session/[index]-v2.tsx`), creating 1 new test file (`__tests__/lib/haptics.test.ts`). Potentially modifying `hooks/workout/useEndWorkout.ts` for workout completion haptic.
- **Clean-room rebuild:** All changes stay within the v2 route and its component/hook/lib ecosystem. Existing `[index].tsx` (legacy) remains untouched.
- **React Context API only:** No Redux/Zustand. State management through context and hooks.
- **No file exceeds ~300 lines.**
- **Haptics MUST go through `lib/haptics.ts`:** No component directly imports `expo-haptics`.
- **Fire-and-forget pattern:** Haptic calls are async but should NOT be awaited in event handlers. They're side effects that must never block the UI.

### What's Already Implemented (Stories 1.1–4.1)

**Current `lib/haptics.ts` (114 lines):**

```
Base functions (already implemented):
  tapLight()        → Haptics.impactAsync(Light)      — Platform.OS === 'ios' guard
  tapMedium()       → Haptics.impactAsync(Medium)     — Platform.OS === 'ios' guard
  tapHeavy()        → Haptics.impactAsync(Heavy)      — Platform.OS === 'ios' guard
  notifySuccess()   → Haptics.notificationAsync(Success)
  notifyWarning()   → Haptics.notificationAsync(Warning)
  notifyError()     → Haptics.notificationAsync(Error)
  selectionChanged() → Haptics.selectionAsync()

Existing semantic object (haptics = {}):
  buttonTap: tapLight
  tabSwitch: selectionChanged
  setComplete: notifySuccess        ← WRONG mapping per UX spec (should be medium impact)
  sessionComplete: notifySuccess    ← Legacy name, will be superseded by workoutCompleted
  skipAction: notifyWarning
  pauseTimer: tapLight
  resumeTimer: tapMedium
  restTimerFinished: tapLight       ← Already added in Story 4.1 ✓
  celebration: notifySuccess        ← Will be superseded by workoutCompleted
  (plus CRUD/form/data management haptics — leave unchanged)
```

**CRITICAL FINDING — `setComplete` mapping is wrong:**

The existing `setComplete: notifySuccess` fires a success notification haptic. The UX design specification mandates **medium impact** for set confirmation (see Haptic Feedback Scale table). The architecture spec also specifies medium impact. This story adds `setConfirmed: tapMedium` with the correct mapping. The old `setComplete` can remain for backward compatibility but should not be used in new workout code.

**Rest timer haptic already wired (Story 4.1):**

`hooks/workout/useRestTimer.ts` lines 82 and 97 already call `haptics.restTimerFinished()` when the timer expires. No additional work needed for this trigger point.

**Current v2 route (`app/programs/[id]/session/[index]-v2.tsx`, ~390 lines):**

Relevant handler functions that need haptic integration:

```
handleSetConfirm(exerciseIndex, setIndex)     → needs haptics.setConfirmed()
                                                + exercise completion detection
handleExpandExercise(exerciseIndex)            → needs haptics.navigationTap()
handleSetDotNavigation(exerciseIndex, setIndex) → needs haptics.navigationTap()
confirmEnd (via useEndWorkout)                 → needs haptics.workoutCompleted()
```

No haptic calls exist in any `components/workout/*.tsx` files currently — all integration happens at the orchestrator level in the v2 route.

**`useEndWorkout` hook** — handles the "End Workout" confirmation flow. `confirmEnd` dispatches `COMPLETE_WORKOUT`. The `workoutCompleted` haptic should fire here.

### Haptic Feedback Scale (from UX Design Specification)

| Action                        | Haptic Function     | Haptic Type                            | Trigger Point                                    |
| ----------------------------- | ------------------- | -------------------------------------- | ------------------------------------------------ |
| Set confirmed                 | `setConfirmed`      | `tapMedium` (Medium impact)            | `handleSetConfirm` in `[index]-v2.tsx`           |
| Exercise completed (all sets) | `exerciseCompleted` | `notifySuccess` (Success notification) | After confirm when last set in exercise is done  |
| Rest timer finished           | `restTimerFinished` | `tapLight` (Light impact)              | `useRestTimer.ts` (**already done**)             |
| PR detected                   | `prDetected`        | `tapHeavy` (Heavy impact)              | Epic 5 `usePRComparison` (future)                |
| Workout completed             | `workoutCompleted`  | `notifySuccess` (Success notification) | `confirmEnd` / Epic 7 CompletionSummary          |
| Navigation (tap exercise/set) | `navigationTap`     | `selectionChanged` (Selection)         | `handleExpandExercise`, `handleSetDotNavigation` |

### Exercise Completion Detection Strategy

The reducer's `CONFIRM_SET` handler completes a set and auto-expands the next exercise if needed. Since the reducer is synchronous and the `state` object in callbacks is the pre-dispatch snapshot, detection must work from pre-dispatch data:

```
In handleSetConfirm(exerciseIndex, setIndex):
  1. Read state.exercises[exerciseIndex].sets BEFORE dispatch
  2. Count non-completed/non-skipped sets in this exercise
  3. If exactly 1 remaining (the current one being confirmed) → this exercise will be complete
  4. Fire haptics.setConfirmed() always
  5. Fire haptics.exerciseCompleted() only if exercise will be complete
  6. Then dispatch confirmSet + startRestTimer
```

**Edge cases:**

- Editing a completed set and re-confirming: exercise was already complete, don't fire `exerciseCompleted` again
- Skipping a set: do NOT fire `exerciseCompleted` (only on explicit confirmation)
- Last exercise last set: fire both `exerciseCompleted` AND potentially `workoutCompleted`

### `prDetected` — Future Wiring (Epic 5)

The `haptics.prDetected()` function will be defined now but NOT wired to any trigger point. Epic 5 (`5-1-per-set-pr-detection-and-inline-notification`) will call it from `usePRComparison.ts` when a set exceeds the user's previous personal record. Defining it now ensures the haptic semantic layer is complete for the full v1.2 scope.

### `workoutCompleted` — Partial Wiring

`CompletionSummary` component doesn't exist yet (Epic 7). Wire the haptic into `confirmEnd` flow for now:

```
useEndWorkout → confirmEnd → completeWorkout() → haptics.workoutCompleted()
```

Epic 7 will add the confetti celebration and may relocate the haptic to fire alongside the animation. The function is defined and callable from either location.

### Previous Story Learnings (Stories 2.1–4.1)

**What worked well:**

- Pure function reducer with zero mocking for tests
- Named action dispatchers — components never access raw dispatch
- `useElapsedTimer` pattern with injectable `now()` — reused for `useRestTimer`
- Separating pure utility functions from hooks for testability
- MMKV v4 automatic mocking in Vitest

**What went wrong (avoid repeating):**

- **Wrong theme tokens:** `textSecondary` → use `subtext`, `borderRadius` → `radius`, `error` → `danger`. Always verify token names against `theme/theme.ts`.
- **Pre-existing TS errors remain.** Do NOT fix: `haptics.notifyWarning` in `ConfirmationModal.tsx`, `SharedValue` in `profile.tsx`, and ~35 files referencing removed tokens. This story must not introduce NEW errors.
- **Test environment requires explicit `import React from 'react'`** for JSX in test files.
- **V2 route at ~390 lines** — over ~300 guideline. Adding haptic calls adds ~15 lines. Route is a composition root; overage acceptable.
- **Code review found inverted dependency in 2-7:** `lib/` was importing from `hooks/`. Be careful: `lib/haptics.ts` must NOT import from `hooks/` or `context/`.
- **Session ID side effect during render (3-1 finding):** Side effects must be in `useEffect`, not during render.

### Git Intelligence (Recent Commits)

```
597813a feat: implement workout state restoration and session ID preservation
49a302b feat: implement MMKV persistence layer for workout state management
075fa16 feat: enhance ExerciseAccordionItem with progress bar and styling
993b4eb feat: implement useWebKeyboardShortcuts and keyboard handlers
1624fd6 feat: add prefill functionality for workout sets
cc08299 feat: implement NumericKeypad and SetRow components
```

**Patterns observed:**

- Test files placed in `__tests__/` mirroring source structure
- `vi.fn()` for mocking, `describe`/`it` blocks
- Pure function tests with no mocking for reducer-like logic
- Hook tests mock dependencies via `vi.mock()`
- Commit messages follow `[type]: description` format
- No components directly import `expo-haptics` — all go through `lib/haptics.ts`

### Testing Strategy

**`__tests__/lib/haptics.test.ts`:**

Mock `expo-haptics` and `react-native` Platform module:

```
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' }
}))
```

Test cases:

```
describe('semantic haptic functions', () => {
  describe('workout-specific functions', () => {
    - haptics.setConfirmed calls impactAsync with Medium
    - haptics.exerciseCompleted calls notificationAsync with Success
    - haptics.prDetected calls impactAsync with Heavy
    - haptics.restTimerFinished calls impactAsync with Light
    - haptics.workoutCompleted calls notificationAsync with Success
    - haptics.navigationTap calls selectionAsync
  })

  describe('web safety', () => {
    - All base functions no-op when Platform.OS is 'web'
    - All base functions no-op when Platform.OS is 'android' (current guard is iOS-only)
    - No errors thrown on any platform
  })

  describe('existing functions', () => {
    - buttonTap, tabSwitch, skipAction, etc. still work correctly
  })
})
```

### Edge Cases

| Scenario                                | Expected Behavior                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| Set confirmed (normal)                  | `setConfirmed` fires medium impact                                                      |
| Set re-confirmed after editing          | `setConfirmed` fires, `exerciseCompleted` does NOT fire (exercise was already complete) |
| Last set in exercise confirmed          | Both `setConfirmed` and `exerciseCompleted` fire                                        |
| Set skipped (not confirmed)             | No haptic fires (UX spec: no feedback for skip action in new workout flow)              |
| Last set of entire workout confirmed    | `setConfirmed` + `exerciseCompleted` + potentially `workoutCompleted`                   |
| User taps "End Workout" and confirms    | `workoutCompleted` fires                                                                |
| Exercise navigation tap                 | `navigationTap` fires (selection haptic)                                                |
| SetDot navigation to different exercise | `navigationTap` fires                                                                   |
| Opening numeric keypad                  | No haptic (UX spec: no feedback for opening keypad)                                     |
| Web platform                            | All haptic calls silently no-op                                                         |
| Rapid set confirmations                 | Each confirmation fires its own haptic (no debounce needed — hardware handles queuing)  |
| Rest timer finishes                     | `restTimerFinished` fires (already wired in Story 4.1)                                  |

### File Size Budget

| File                                       | Current Lines | Estimated After | Budget                                      |
| ------------------------------------------ | ------------- | --------------- | ------------------------------------------- |
| `lib/haptics.ts`                           | 114           | ~120            | Under 300                                   |
| `app/programs/[id]/session/[index]-v2.tsx` | ~390          | ~410            | ⚠️ Over 300 (composition root — acceptable) |
| `__tests__/lib/haptics.test.ts`            | NEW           | ~100            | Under 300                                   |
| `hooks/workout/useEndWorkout.ts`           | unknown       | +2-3 lines      | Under 300                                   |

### Anti-Patterns to Avoid

```typescript
// BAD: Awaiting haptic calls in event handlers (blocks UI)
const handleSetConfirm = async (ei, si) => {
  await haptics.setConfirmed()  // WRONG: blocks next operations
  confirmSet(ei, si)
}

// GOOD: Fire-and-forget haptic calls
const handleSetConfirm = (ei, si) => {
  confirmSet(ei, si)
  haptics.setConfirmed()  // fire-and-forget, no await
}

// BAD: Direct expo-haptics import in component
import * as Haptics from 'expo-haptics'
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

// GOOD: Semantic haptic function through lib/haptics.ts
import { haptics } from '@/lib/haptics'
haptics.setConfirmed()

// BAD: Haptic in reducer (side effects in pure function)
case 'CONFIRM_SET':
  haptics.setConfirmed()  // WRONG: reducers must be pure

// GOOD: Haptic in event handler (side effect in UI layer)
const handleSetConfirm = (ei, si) => {
  haptics.setConfirmed()
  confirmSet(ei, si)
}

// BAD: Firing exerciseCompleted after every set confirm
haptics.setConfirmed()
haptics.exerciseCompleted()  // WRONG if exercise isn't actually complete

// GOOD: Check if exercise will be complete before firing
const isLastPendingSet = exercise.sets.filter(s =>
  s.status !== 'completed' && s.status !== 'skipped'
).length === 1
haptics.setConfirmed()
if (isLastPendingSet) haptics.exerciseCompleted()

// BAD: Adding haptic to skip action (UX spec says no)
const handleSetSkip = (ei, si) => {
  haptics.skipAction()  // WRONG for new workout flow
  skipSet(ei, si)
}

// GOOD: No haptic on skip in workout flow
const handleSetSkip = (ei, si) => {
  skipSet(ei, si)
  dismissKeypad()
}

// BAD: lib/haptics.ts importing from hooks/ or context/
import { useWorkoutExecution } from '@/hooks/workout'

// GOOD: lib/ only imports from lib/, types/, and external packages
import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'
```

### Prettier Rules (Project Enforced)

- No semicolons (`semi: false`)
- Single quotes (`singleQuote: true`)
- No trailing commas (`trailingComma: none`)
- Avoid arrow parens when possible (`arrowParens: avoid`)

### Import Conventions

- Path alias: `@/` for all imports (e.g., `import { haptics } from '@/lib/haptics'`)
- Named exports for all non-route files
- `export type` for type-only exports
- Import order: React/external → `@/` path alias → relative

### Project Structure Notes

- `lib/haptics.ts` — MODIFY (add semantic workout functions to haptics object)
- `app/programs/[id]/session/[index]-v2.tsx` — MODIFY (add haptic calls to handlers)
- `hooks/workout/useEndWorkout.ts` — MODIFY (add workoutCompleted haptic to confirmEnd)
- `__tests__/lib/haptics.test.ts` — NEW (comprehensive haptic function tests)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2] — Acceptance criteria, user story, haptic feedback requirements (FR33)
- [Source: _bmad-output/planning-artifacts/architecture.md#Haptic Feedback] — "6 distinct haptic trigger points including set confirm, exercise complete, rest timer finish, PR detected, workout complete, navigation. Centralized through existing lib/haptics.ts"
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — `haptics.setConfirmed()`, `haptics.exerciseCompleted()`, `haptics.prDetected()`, `haptics.restTimerFinished()`, `haptics.workoutCompleted()`, `haptics.navigationTap()` — semantic function names describe why, not how
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — "Route haptic calls through lib/haptics.ts — never import expo-haptics. Haptic intensity decisions are centralized, not per-component"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — Haptic feedback scale table: Set confirmed=Medium impact, Exercise completed=Success notification, Rest timer=Light impact, PR=Heavy impact, Workout complete=Success notification, Navigation=Selection
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — "Rule: haptics confirm actions, not selections. The intensity scales with the significance of the action."
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — "No feedback for: scrolling, rest timer counting, opening numeric keypad, typing digits"
- [Source: _bmad-output/planning-artifacts/prd.md#FR33] — "System provides haptic feedback on set confirmation, personal record detection, rest timer completion, and workout completion"
- [Source: _bmad-output/project-context.md#Haptics Integration] — "Import Pattern: import { haptics } from '@/lib/haptics'"
- [Source: _bmad-output/project-context.md#Code Style] — Prettier config, no semicolons, single quotes, no trailing commas
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest, **tests**/ mirror structure, describe/it blocks
- [Source: lib/haptics.ts] — Current haptics implementation with base functions and semantic object
- [Source: hooks/workout/useRestTimer.ts#L82,L97] — Already calls `haptics.restTimerFinished()` on timer expiry
- [Source: context/workoutReducer.ts#CONFIRM_SET] — Pure reducer for set confirmation, auto-expand next exercise
- [Source: app/programs/[id]/session/[index]-v2.tsx#handleSetConfirm] — Primary trigger point for set confirmation haptics
- [Source: _bmad-output/implementation-artifacts/4-1-rest-timer-bar-with-background-notification.md] — Previous story learnings, wrong theme tokens, pre-existing TS errors, test patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `isHapticsAvailable` changed from module-level constant to function call `() => Platform.OS === 'ios'` to enable proper test isolation (Platform.OS is mocked as 'web' by default in test environment, computed-at-load constant couldn't be overridden per-test)

### Completion Notes List

- Added 5 semantic haptic functions to `lib/haptics.ts`: `setConfirmed` (tapMedium), `exerciseCompleted` (notifySuccess), `prDetected` (tapHeavy), `workoutCompleted` (notifySuccess), `navigationTap` (selectionChanged)
- Verified `restTimerFinished` already exists from Story 4.1
- Integrated `haptics.setConfirmed()` into `handleSetConfirm` in `[index]-v2.tsx` — fire-and-forget after confirmSet
- Integrated `haptics.exerciseCompleted()` with pre-dispatch detection: checks if current set is the last pending set before confirming, fires only on last-set confirmation (not on skip)
- Integrated `haptics.navigationTap()` into `handleExpandExercise` and `handleSetDotNavigation` — no haptic on keypad open or set row press per UX spec
- Integrated `haptics.workoutCompleted()` into `confirmEnd` in `useEndWorkout.ts` — fires when user confirms ending workout. Natural completion haptic deferred to Epic 7 CompletionSummary
- `prDetected` defined but not wired — Epic 5 will integrate with `usePRComparison`
- Changed `isHapticsAvailable` from `const = Platform.OS === 'ios'` to `() => Platform.OS === 'ios'` for testability — no behavioral change in production
- Created 21 unit tests covering all semantic functions, correct haptic type mappings, web safety no-op behavior, and existing function regression
- All 300 tests pass (23 test files), no regressions
- No new TypeScript errors introduced (pre-existing errors unchanged)
- All files pass Prettier

### Change Log

- 2026-03-17: Implemented Story 4.2 — semantic haptic feedback system with 5 new functions, 4 integration points, and 21 unit tests

### File List

- `lib/haptics.ts` — MODIFIED: added 5 semantic workout functions, changed `isHapticsAvailable` to function for testability
- `app/programs/[id]/session/[index]-v2.tsx` — MODIFIED: added haptic calls to handleSetConfirm (setConfirmed + exerciseCompleted), handleExpandExercise (navigationTap), handleSetDotNavigation (navigationTap)
- `hooks/workout/useEndWorkout.ts` — MODIFIED: added haptics.workoutCompleted() to confirmEnd
- `__tests__/lib/haptics.test.ts` — NEW: 21 unit tests for haptic function mappings, web safety, and existing function regression
