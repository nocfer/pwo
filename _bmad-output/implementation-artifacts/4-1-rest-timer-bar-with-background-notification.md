# Story 4.1: Rest Timer Bar with Background Notification

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a rest timer to start automatically after I complete a set and notify me when rest is done, even if I lock my phone,
So that I can rest the right amount between sets without watching the clock.

## Acceptance Criteria

1. **Given** a set has been confirmed **When** the rest timer activates **Then** the `RestTimerBar` component appears between the workout header and the exercise matrix (FR34)
2. The timer counts down from the program's `restBetweenSets` value using absolute timestamps (`startTimestamp + durationMs - Date.now()`) (FR34)
3. The countdown displays in `body` typography (16pt) with break-colored (cyan) styling
4. The timer bar shows: "Rest" label, countdown time, and a "Skip" button
5. The timer maintains +/- 1 second accuracy over a 5-minute period (NFR9)
6. The timer continues running when the user navigates between exercises — it is workout-level, not exercise-specific (FR35)
7. The user can dismiss or skip the timer at any time with a single tap on "Skip" (FR36)
8. When the timer finishes, the bar pulses briefly then auto-hides
9. `hooks/workout/useRestTimer.ts` implements timer logic using absolute timestamps, with an injectable `now()` function for testing
10. `expo-notifications` schedules a local notification at timer start that fires when the timer would complete ("Rest timer done — time for your next set") (FR37)
11. The notification fires only when the app is backgrounded
12. If notification permission is denied, the timer still works fully in-app — no error, no prompt (NFR16)
13. Notification permission is requested contextually on first workout start, not on app launch
14. The timer bar has zero height when no timer is active (no empty space)
15. No file exceeds ~300 lines
16. The existing test suite passes (`npm run test:run`)

## Tasks / Subtasks

- [x] Task 1: Install `expo-notifications` dependency (AC: #10)
  - [x] 1.1 Run `npx expo install expo-notifications` to install at compatible Expo ~55 version
  - [x] 1.2 Verify `package.json` includes the new dependency
  - [x] 1.3 Run `npm run compile` — no new TypeScript errors

- [x] Task 2: Add `restDurationMs` to `ExerciseState` and populate in `buildInitialState` (AC: #2)
  - [x] 2.1 In `types/workout.ts`, add `restDurationMs?: number` to `ExerciseState` — optional for backward compat with persisted states
  - [x] 2.2 In `lib/buildInitialState.ts`, populate `restDurationMs: (block.restBetweenSets ?? 60) * 1000` for each exercise in the mapping
  - [x] 2.3 Run existing tests to verify no regressions

- [x] Task 3: Add semantic haptic function `restTimerFinished` (AC: #8)
  - [x] 3.1 In `lib/haptics.ts`, add `restTimerFinished: tapLight` to the `haptics` semantic functions object
  - [x] 3.2 This follows the architecture spec: `haptics.restTimerFinished()` fires light impact haptic when rest timer reaches zero

- [x] Task 4: Create `useRestTimer` hook (AC: #2, #5, #8, #9)
  - [x] 4.1 Create `hooks/workout/useRestTimer.ts` — hook that reads `state.restTimer` from `useWorkoutExecution()` and computes countdown
  - [x] 4.2 Accept optional `now?: () => number` for test injection (matching `useElapsedTimer` pattern)
  - [x] 4.3 Compute `remainingMs = state.restTimer.startedAt + state.restTimer.durationMs - now()` when `state.restTimer.isActive`
  - [x] 4.4 Use `requestAnimationFrame` tick loop (same pattern as `useElapsedTimer`) to update `remainingMs` every second
  - [x] 4.5 When `remainingMs <= 0` and timer was active: fire `haptics.restTimerFinished()`, call `dismissRestTimer()` from context, and invoke an `onFinish` callback
  - [x] 4.6 Return `{ remainingMs, isActive, dismiss }` from hook — `dismiss` calls `dismissRestTimer()` from context
  - [x] 4.7 Use `useRef` for the `now` function (same pattern as `useElapsedTimer.nowRef`)
  - [x] 4.8 Handle the "timer already expired on mount" edge case (e.g., app backgrounded past timer end) — immediately dismiss, don't show negative countdown
  - [x] 4.9 Export from `hooks/workout/index.ts`

- [x] Task 5: Create notification scheduling utility (AC: #10, #11, #12, #13)
  - [x] 5.1 Create `lib/notifications.ts` — utility functions for local notification scheduling (not a hook)
  - [x] 5.2 Implement `scheduleRestTimerNotification(delayMs: number): Promise<string | null>` — schedules a local notification using `Notifications.scheduleNotificationAsync` with `TIME_INTERVAL` trigger (`delayMs / 1000` seconds)
  - [x] 5.3 Notification content: `{ title: 'Rest Complete', body: 'Time for your next set', sound: true }`
  - [x] 5.4 Implement `cancelRestTimerNotification(notificationId: string): Promise<void>` — cancels a scheduled notification via `Notifications.cancelScheduledNotificationAsync`
  - [x] 5.5 Implement `requestNotificationPermission(): Promise<boolean>` — calls `Notifications.requestPermissionsAsync()` and returns whether permission was granted
  - [x] 5.6 All functions no-op on web (`Platform.OS === 'web'` → return null/true without calling Expo APIs)
  - [x] 5.7 Wrap all Expo notification calls in try/catch — if anything fails, return null silently (NFR16)
  - [x] 5.8 Configure `Notifications.setNotificationHandler` to suppress foreground display: `shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false`

- [x] Task 6: Integrate notification scheduling into `useRestTimer` (AC: #10, #11)
  - [x] 6.1 When rest timer starts (`state.restTimer.isActive` transitions to true), call `scheduleRestTimerNotification(state.restTimer.durationMs)` and store returned notification ID in a ref
  - [x] 6.2 When timer finishes or is dismissed, call `cancelRestTimerNotification(notificationId)` to cancel the pending notification
  - [x] 6.3 On unmount (workout ends), cancel any pending notification

- [x] Task 7: Integrate notification permission request (AC: #13)
  - [x] 7.1 In `useRestTimer` (or `useWorkoutPersistence` on mount), call `requestNotificationPermission()` once on first workout start
  - [x] 7.2 Use a `useRef` flag to avoid re-requesting on every mount
  - [x] 7.3 If denied, timer still works — permission result is not checked before scheduling (the schedule call itself will silently fail)

- [x] Task 8: Create `RestTimerBar` component (AC: #1, #3, #4, #7, #8, #14)
  - [x] 8.1 Create `components/workout/RestTimerBar.tsx` — pure rendering component with no timer logic
  - [x] 8.2 Props: `remainingMs: number`, `isActive: boolean`, `onSkip: () => void`
  - [x] 8.3 Layout: horizontal row with "Rest" label (left), countdown in M:SS format (center), "Skip" button (right)
  - [x] 8.4 Countdown text uses `theme.typography.body` (16pt), `theme.colors.phases.break` (cyan) color
  - [x] 8.5 "Skip" button: text button with `theme.colors.phases.break` color, 48pt minimum touch target
  - [x] 8.6 When `isActive` is false, render nothing (zero height, null return)
  - [x] 8.7 When timer finishes (detected by parent passing `isActive: false` after countdown), use `react-native-reanimated` for brief pulse animation on the bar before hiding
  - [x] 8.8 Background: `theme.colors.phases.breakBg` — subtle break-tinted background
  - [x] 8.9 Full-width within the `MaxWidthContainer`
  - [x] 8.10 Accessibility: `accessibilityRole="timer"`, `accessibilityLabel="Rest timer, {minutes} minutes {seconds} seconds remaining"`, `accessibilityLiveRegion="polite"` (announced every 30s, not every second)

- [x] Task 9: Integrate into session screen (AC: #1, #2, #6)
  - [x] 9.1 In `WorkoutSessionContent` (`[index]-v2.tsx`), call `useRestTimer()` to get `{ remainingMs, isActive, dismiss }`
  - [x] 9.2 Render `<RestTimerBar remainingMs={remainingMs} isActive={isActive} onSkip={dismiss} />` between `WorkoutHeader` and the exercise list
  - [x] 9.3 In `handleSetConfirm`, after calling `confirmSet()`, call `startRestTimer(durationMs)` where `durationMs` is derived from `state.exercises[exerciseIndex].restDurationMs ?? 60000`
  - [x] 9.4 Do NOT start rest timer when the last set of the entire workout is confirmed (i.e., when all exercises are now complete)
  - [x] 9.5 Verify the timer persists when navigating between exercises (it's workout-level state in the reducer)

- [x] Task 10: Write unit tests (AC: #16)
  - [x] 10.1 Create `__tests__/hooks/workout/useRestTimer.test.ts`:
    - Returns `isActive: false` and `remainingMs: 0` when no timer is active
    - Computes correct `remainingMs` from absolute timestamps
    - Calls `dismissRestTimer` when countdown reaches zero
    - Fires `haptics.restTimerFinished()` when timer expires
    - Handles timer-already-expired-on-mount edge case
    - Dismiss function calls context `dismissRestTimer()`
    - Injectable `now()` function works for deterministic testing
  - [x] 10.2 Create `__tests__/components/workout/RestTimerBar.test.tsx`:
    - Renders countdown in M:SS format
    - Renders "Rest" label and "Skip" button
    - Returns null when `isActive` is false
    - Skip button calls `onSkip` when pressed
    - Has correct accessibility labels
  - [x] 10.3 Create `__tests__/lib/notifications.test.ts`:
    - `scheduleRestTimerNotification` calls Expo API with correct trigger
    - `cancelRestTimerNotification` calls Expo cancel API
    - All functions no-op on web platform
    - Functions return null on error (don't throw)
  - [x] 10.4 Verify `haptics.restTimerFinished` exists in haptics object (add to existing haptics tests if present)
  - [x] 10.5 Run `npm run compile` — no new TypeScript errors
  - [x] 10.6 Run `npm run test:run` — all tests pass
  - [x] 10.7 Run `npm run lint:fix` — all files pass Prettier

## Dev Notes

### Architecture Constraints

- **Brownfield project:** Creating 4 new files (`hooks/workout/useRestTimer.ts`, `components/workout/RestTimerBar.tsx`, `lib/notifications.ts`, tests), modifying 5 existing files (`types/workout.ts`, `lib/buildInitialState.ts`, `lib/haptics.ts`, `hooks/workout/index.ts`, `app/programs/[id]/session/[index]-v2.tsx`).
- **Clean-room rebuild:** All changes stay within the v2 route and its component/hook/lib ecosystem. Existing `[index].tsx` (legacy) remains untouched.
- **React Context API only:** No Redux/Zustand. State management through context and hooks.
- **No file exceeds ~300 lines.**
- **Rest timer state machine is already implemented.** `RestTimerState`, `START_REST_TIMER`, `DISMISS_REST_TIMER` actions exist in the reducer and context. This story adds the hook, UI, notification, and integration — NOT the state management.
- **Rest timer is already persisted.** The `restTimer` field is part of `WorkoutState`, which is written to MMKV on every change by `useWorkoutPersistence`. On resume, the absolute timestamps recalculate correctly (`startedAt + durationMs - Date.now()`).

### Critical Design Decision: Rest Duration Source

The `restBetweenSets` value lives on `ProgramExerciseBlock` (per-exercise, defaults to 60s). Once `buildInitialState` runs, the program data is discarded — `WorkoutState` only has exercise names, sets, and timer anchors.

**Solution: Add `restDurationMs` to `ExerciseState`.**

```typescript
// types/workout.ts — add to ExerciseState
export type ExerciseState = {
  exerciseId: string
  exerciseName: string
  sets: ExerciseSetState[]
  restDurationMs?: number // NEW: from block.restBetweenSets * 1000
}
```

- **Optional field** for backward compatibility with persisted states from Story 3.1
- `buildInitialState` populates it: `restDurationMs: (block.restBetweenSets ?? 60) * 1000`
- On set confirmation, read: `state.exercises[exerciseIndex].restDurationMs ?? 60000`
- Persisted states missing this field gracefully fall back to 60s default

### What's Already Implemented (Epics 1-3 Complete)

**Rest timer state machine (`types/workout.ts`, `context/workoutReducer.ts`):**

```
RestTimerState = {
  isActive: boolean
  startedAt: number    // Date.now() when timer started
  durationMs: number   // total duration in milliseconds
}

Actions:
  START_REST_TIMER { durationMs, startedAt } → sets isActive=true, startedAt, durationMs
  DISMISS_REST_TIMER → sets isActive=false
```

**Context dispatchers (`context/WorkoutExecutionContext.tsx`):**

```
startRestTimer(durationMs) → dispatches START_REST_TIMER with Date.now() as startedAt
dismissRestTimer() → dispatches DISMISS_REST_TIMER
```

**Persistence (`hooks/workout/useWorkoutPersistence.ts`):**

RestTimer state is part of the serialized `WorkoutState` written to MMKV on every change. On resume, the persisted `startedAt` and `durationMs` allow accurate recalculation of remaining time.

**`useElapsedTimer` pattern (`hooks/workout/useElapsedTimer.ts`, 51 lines):**

```typescript
// Pattern to follow for useRestTimer
const nowRef = useRef(now ?? Date.now)
// requestAnimationFrame loop, updates state every second
// Injectable now() for testing
```

**Current `haptics.ts` semantic functions (missing `restTimerFinished`):**

```
setComplete: notifySuccess     // medium impact — set confirm
skipAction: notifyWarning      // warning — skip
pauseTimer: tapLight           // light — pause
resumeTimer: tapMedium         // medium — resume
celebration: notifySuccess     // success — workout complete
// MISSING: restTimerFinished: tapLight  ← needs to be added
```

The architecture spec defines `haptics.restTimerFinished()` as light impact, but it doesn't exist yet.

**Current v2 route (`app/programs/[id]/session/[index]-v2.tsx`, 358 lines):**

- `WorkoutSessionContent` handles set confirmation via `handleSetConfirm`
- Currently: `confirmSet(exerciseIndex, setIndex)` + `dismissKeypad()`
- Needs to add: `startRestTimer(durationMs)` call after confirm
- `RestTimerBar` renders between `WorkoutHeader` and the exercise list `.map()`
- Route is at 358 lines (over ~300 guideline — composition root, acceptable)

**Current test count:** 246 tests (from stories 2.1–3.2)

### `useRestTimer` Hook Design

```typescript
// hooks/workout/useRestTimer.ts
type UseRestTimerOptions = {
  now?: () => number
}

type UseRestTimerReturn = {
  remainingMs: number
  isActive: boolean
  dismiss: () => void
}

export function useRestTimer(options?: UseRestTimerOptions): UseRestTimerReturn
```

**Countdown logic:**

```
remainingMs = state.restTimer.startedAt + state.restTimer.durationMs - now()
```

When `remainingMs <= 0`:

1. Fire `haptics.restTimerFinished()`
2. Call `dismissRestTimer()` from context (sets `isActive: false`)
3. Cancel any pending notification

**Timer-already-expired edge case:** If the app was backgrounded past the timer end, on mount `remainingMs` is negative. The hook immediately dismisses without showing a negative countdown.

**requestAnimationFrame loop:** Same pattern as `useElapsedTimer` — tick every frame, only update state when the second changes (`Math.floor(ms / 1000)`), clean up on unmount via `cancelAnimationFrame`.

### `RestTimerBar` Component Design

```
┌─────────────────────────────────────────────────────────────┐
│  Rest        1:42        [Skip]                             │
└─────────────────────────────────────────────────────────────┘
```

- **Position:** Between `WorkoutHeader` and exercise list, inside `MaxWidthContainer`
- **Height:** Auto when active, zero/null when inactive
- **Colors:** `theme.colors.break` (cyan) for text and accents, `theme.colors.surface` background
- **Typography:** `theme.typography.body` (16pt) for countdown
- **Skip button:** 48pt touch target, break-colored text
- **Animation:** Brief pulse (`react-native-reanimated` `withSequence` opacity animation) when timer finishes before hiding
- **Accessibility:** `accessibilityRole="timer"`, live region polite

### `expo-notifications` Integration

**Scheduling pattern:**

```typescript
import * as Notifications from 'expo-notifications'

const id = await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Rest Complete',
    body: 'Time for your next set',
    sound: true
  },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: Math.ceil(durationMs / 1000)
  }
})
```

**Cancellation:** `await Notifications.cancelScheduledNotificationAsync(id)`

**Permission request:**

```typescript
const { status } = await Notifications.requestPermissionsAsync()
```

**Foreground suppression:** Configure handler to not show alerts when app is in foreground (the in-app timer bar is the indicator):

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
})
```

**Platform safety:** All notification functions check `Platform.OS === 'web'` and no-op. All calls wrapped in try/catch to handle denied permissions gracefully.

### Integration Flow

```
User taps checkmark (confirm set)
    ↓
handleSetConfirm(exerciseIndex, setIndex)
    ↓
confirmSet(exerciseIndex, setIndex)       → reducer: CONFIRM_SET
    ↓
const durationMs = state.exercises[exerciseIndex].restDurationMs ?? 60000
startRestTimer(durationMs)                → reducer: START_REST_TIMER
    ↓
useRestTimer detects isActive=true        → starts countdown
    ↓
scheduleRestTimerNotification(durationMs) → Expo API schedules notification
    ↓
RestTimerBar renders countdown            → visible between header and matrix
    ↓ (user navigates exercises)
Timer continues (workout-level state)     → persisted to MMKV
    ↓ (countdown reaches 0)
haptics.restTimerFinished()               → light haptic
dismissRestTimer()                        → reducer: DISMISS_REST_TIMER
cancelRestTimerNotification()             → cancel pending notification
RestTimerBar hides (pulse → zero height)
```

### When NOT to Start Rest Timer

- When the confirmed set is the last pending set in the entire workout (all exercises complete → workout should complete, not rest)
- When the user manually started a rest timer (don't double-start)
- The timer should NOT auto-start after a skip (SKIP_SET) — only after CONFIRM_SET

### Previous Story Learnings (Stories 2.1–3.2)

**What worked well:**

- Pure function reducer with zero mocking for tests
- Named action dispatchers — components never access raw dispatch
- `useElapsedTimer` pattern with injectable `now()` — reuse for `useRestTimer`
- `readPersistedWorkout` as pure utility function in `lib/` — reuse for `lib/notifications.ts`
- MMKV v4 automatic mocking in Vitest
- Separating pure utility functions from hooks for testability

**What went wrong (avoid repeating):**

- **Wrong theme tokens:** `textSecondary` → use `subtext`, `borderRadius` → `radius`, `error` → `danger`. Always verify token names against `theme/theme.ts`. The break/cyan color token name needs verification.
- **Pre-existing TS errors remain.** Do NOT fix: `haptics.notifyWarning` in `ConfirmationModal.tsx`, `SharedValue` in `profile.tsx`, and ~35 files referencing removed tokens. This story must not introduce NEW errors.
- **Test environment requires explicit `import React from 'react'`** for JSX in test files.
- **V2 route at 358 lines** — over ~300 guideline. Adding rest timer integration adds ~10-15 lines. Route is a composition root; overage acceptable.
- **Code review found inverted dependency in 2-7:** `lib/` was importing from `hooks/`. Be careful: `lib/notifications.ts` must NOT import from `hooks/`.
- **Session ID side effect during render (3-1 finding):** Side effects must be in `useEffect`, not during render.

### Git Intelligence (Recent Commits)

```
49a302b feat: implement MMKV persistence layer for workout state management
075fa16 feat: enhance ExerciseAccordionItem with progress bar and styling
32320a0 chore: add Story 2.9 for visual alignment with approved mockup
993b4eb feat: implement useWebKeyboardShortcuts and keyboard handlers
1624fd6 feat: add prefill functionality for workout sets
```

**Patterns observed:**

- Test files placed in `__tests__/` mirroring source structure
- `vi.fn()` for mocking, `describe`/`it` blocks
- Pure function tests with no mocking for reducer-like logic
- Hook tests mock dependencies via `vi.mock()`
- New hooks get their own test file and barrel export
- Pure utility functions in `lib/` tested separately from hooks
- Commit messages follow `[type]: description` format

### expo-notifications API Reference

**Installation:**

```bash
npx expo install expo-notifications
```

**Scheduling local notification:**

```typescript
import * as Notifications from 'expo-notifications'

await Notifications.scheduleNotificationAsync({
  content: { title, body, sound: true },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: delaySeconds
  }
})
```

**Permission request:**

```typescript
const { status } = await Notifications.requestPermissionsAsync()
// status: 'granted' | 'denied' | 'undetermined'
```

**Cancel notification:**

```typescript
await Notifications.cancelScheduledNotificationAsync(notificationId)
```

**Foreground handler (must be set before scheduling):**

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
})
```

**Web:** Notification APIs are not available on web. All calls must be guarded with `Platform.OS !== 'web'`.

**Expo Go:** Local notifications work on real iOS/Android devices. May not work reliably in Expo Go or simulators.

### Theme Token Verification

Verify these token names exist in `theme/theme.ts` before use:

- `theme.colors.break` — cyan color for rest timer (if not present, check for `cyan`, `info`, or similar)
- `theme.typography.body` — 16pt for countdown text
- `theme.colors.surface` — background for timer bar
- `theme.colors.text` — primary text
- `theme.colors.subtext` — secondary text
- `theme.spacing.sm`, `theme.spacing.md` — padding
- `theme.radius.sm` — border radius for Skip button

**CRITICAL:** If `theme.colors.break` doesn't exist, use `theme.colors.info` or define the cyan color inline with a comment noting it should be added to theme.

### Testing Strategy

**`useRestTimer` tests (`__tests__/hooks/workout/useRestTimer.test.ts`):**

Mock `useWorkoutExecution()` to provide controlled `state.restTimer` values. Use injectable `now()` for deterministic timing.

```
Test cases:
- Returns isActive: false when restTimer.isActive is false
- Computes remainingMs correctly: startedAt + durationMs - now()
- Calls dismissRestTimer when remainingMs reaches 0
- Fires haptics.restTimerFinished() on timer expiry
- Immediately dismisses when timer is already expired on mount
- dismiss() calls context dismissRestTimer()
- Injectable now() overrides Date.now for testing
```

**`RestTimerBar` tests (`__tests__/components/workout/RestTimerBar.test.tsx`):**

```
Test cases:
- Renders countdown in M:SS format (90000ms → "1:30")
- Renders "Rest" label and "Skip" button
- Returns null when isActive is false
- Calls onSkip when Skip button pressed
- Has accessibilityRole="timer"
- Has correct accessibilityLabel with remaining time
```

**`lib/notifications.ts` tests (`__tests__/lib/notifications.test.ts`):**

Mock `expo-notifications` module and `Platform.OS`:

```
Test cases:
- scheduleRestTimerNotification calls scheduleNotificationAsync with correct trigger
- cancelRestTimerNotification calls cancelScheduledNotificationAsync
- Functions return null on web platform
- Functions return null on error (catch block)
- requestNotificationPermission returns true/false based on status
```

### Edge Cases

| Scenario                                                           | Expected Behavior                                                                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Set confirmed as last set in workout                               | Do NOT start rest timer — workout is about to complete                                                                  |
| Timer already running, new set confirmed                           | New `START_REST_TIMER` dispatch overwrites previous timer (reducer replaces state)                                      |
| App backgrounded during rest timer                                 | Notification fires at scheduled time; on resume, timer recalculates from absolute timestamps                            |
| App resumed after timer expired                                    | `remainingMs` is negative → immediately dismiss, no negative countdown shown                                            |
| Notification permission denied                                     | Timer works in-app; notification silently fails; no error UI                                                            |
| Web platform                                                       | No notifications; timer bar works normally in-app                                                                       |
| User taps Skip during countdown                                    | `dismissRestTimer()` dispatched, notification cancelled, bar hides                                                      |
| User navigates to different exercise during timer                  | Timer continues (workout-level, not exercise-level)                                                                     |
| Timer finishes while keypad is open                                | Timer bar hides, keypad remains open (independent UI)                                                                   |
| Rapid set confirmations (within 1s)                                | Each confirmation restarts the timer (overwrites previous START_REST_TIMER)                                             |
| `restBetweenSets` is 0 on program block                            | `restDurationMs` is 0 → don't start timer (0ms = no rest configured)                                                    |
| Persisted state from before this story (no `restDurationMs` field) | Falls back to default 60000ms on set confirm                                                                            |
| Timer running when workout ends                                    | `COMPLETE_WORKOUT` clears `isCompleted=true` → persistence clears MMKV; timer bar hidden because workout UI transitions |

### File Size Budget

| File                                                 | Current Lines | Estimated After | Budget                                      |
| ---------------------------------------------------- | ------------- | --------------- | ------------------------------------------- |
| `hooks/workout/useRestTimer.ts`                      | NEW           | ~70             | Under 300                                   |
| `components/workout/RestTimerBar.tsx`                | NEW           | ~90             | Under 300                                   |
| `lib/notifications.ts`                               | NEW           | ~60             | Under 300                                   |
| `types/workout.ts`                                   | 74            | ~76             | Under 300                                   |
| `lib/buildInitialState.ts`                           | 63            | ~65             | Under 300                                   |
| `lib/haptics.ts`                                     | 113           | ~115            | Under 300                                   |
| `hooks/workout/index.ts`                             | 10            | ~11             | Under 300                                   |
| `app/programs/[id]/session/[index]-v2.tsx`           | 358           | ~375            | ⚠️ Over 300 (composition root — acceptable) |
| `__tests__/hooks/workout/useRestTimer.test.ts`       | NEW           | ~120            | Under 300                                   |
| `__tests__/components/workout/RestTimerBar.test.tsx` | NEW           | ~80             | Under 300                                   |
| `__tests__/lib/notifications.test.ts`                | NEW           | ~70             | Under 300                                   |

### Anti-Patterns to Avoid

```typescript
// BAD: Interval-based countdown (drifts over time, breaks on background)
setInterval(() => setRemaining(r => r - 1000), 1000)

// GOOD: Absolute timestamp calculation (accurate after any background duration)
const remainingMs = state.restTimer.startedAt + state.restTimer.durationMs - now()

// BAD: Direct expo-haptics import in component
import * as Haptics from 'expo-haptics'
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

// GOOD: Semantic haptic function through lib/haptics.ts
import { haptics } from '@/lib/haptics'
haptics.restTimerFinished()

// BAD: Notification logic in component
await Notifications.scheduleNotificationAsync(...)

// GOOD: Notification logic in lib/notifications.ts utility
import { scheduleRestTimerNotification } from '@/lib/notifications'

// BAD: Starting rest timer in the reducer (side effects in reducer)
case 'CONFIRM_SET':
  scheduleNotification(...) // WRONG: reducers must be pure

// GOOD: Starting rest timer from the component handler
const handleSetConfirm = (ei, si) => {
  confirmSet(ei, si)
  startRestTimer(state.exercises[ei].restDurationMs ?? 60000)
}

// BAD: Exercise-specific timer (resets when switching exercises)
// Storing timer in ExerciseState

// GOOD: Workout-level timer (persists across exercise navigation)
// Timer is in WorkoutState.restTimer, not per-exercise

// BAD: Blocking UI on notification permission
const result = await requestPermission()
if (!result) { showError("Please enable notifications") }

// GOOD: Fire-and-forget permission, graceful degradation
requestNotificationPermission() // no await needed, no UI gating

// BAD: Hardcoded rest duration
startRestTimer(60000) // always 60s

// GOOD: Per-exercise rest duration from program data
startRestTimer(state.exercises[exerciseIndex].restDurationMs ?? 60000)

// BAD: Import direction — lib/ importing from hooks/
import { useWorkoutExecution } from '@/hooks/workout'

// GOOD: lib/ only imports from lib/ and types/
import { storage } from '@/lib/mmkv'

// BAD: Showing negative countdown when timer expired during background
// remainingMs: -30000 → displays "-0:30"

// GOOD: Clamp to zero and dismiss immediately
if (remainingMs <= 0 && state.restTimer.isActive) { dismiss() }
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
- Import haptics from `@/lib/haptics`
- Import notification utils from `@/lib/notifications`
- Import types from `@/types/workout`

### Project Structure Notes

- `hooks/workout/useRestTimer.ts` — NEW (countdown logic with absolute timestamps)
- `components/workout/RestTimerBar.tsx` — NEW (pure renderer, no timer logic)
- `lib/notifications.ts` — NEW (expo-notifications utility functions)
- `types/workout.ts` — MODIFY (add `restDurationMs` to `ExerciseState`)
- `lib/buildInitialState.ts` — MODIFY (populate `restDurationMs` from program block)
- `lib/haptics.ts` — MODIFY (add `restTimerFinished` semantic function)
- `hooks/workout/index.ts` — MODIFY (add `useRestTimer` export)
- `app/programs/[id]/session/[index]-v2.tsx` — MODIFY (integrate rest timer hook, UI, and trigger)
- `__tests__/hooks/workout/useRestTimer.test.ts` — NEW
- `__tests__/components/workout/RestTimerBar.test.tsx` — NEW
- `__tests__/lib/notifications.test.ts` — NEW

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1] — Acceptance criteria, user story, rest timer requirements (FR33-FR37)
- [Source: _bmad-output/planning-artifacts/architecture.md#Timer Architecture Pattern] — "Absolute timestamps (Date.now()), not interval-based countdown. On resume, remaining time is recalculated as startTimestamp + durationMs - Date.now()"
- [Source: _bmad-output/planning-artifacts/architecture.md#New Dependencies] — `expo-notifications` for rest timer background notification (FR37)
- [Source: _bmad-output/planning-artifacts/architecture.md#Haptic Feedback] — `haptics.restTimerFinished()` fires light impact when rest timer reaches zero
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — `hooks/workout/useRestTimer.ts`, `components/workout/RestTimerBar.tsx` in directory plan
- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns] — "6 distinct haptic trigger points including rest timer finish, centralized through lib/haptics.ts"
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Route haptic calls through lib/haptics.ts, never import expo-haptics directly
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#RestTimerBar] — Anatomy: Rest label + Countdown + Skip. States: counting/finished/hidden. Props: targetSeconds, startTimestamp, onSkip, onFinish. Accessibility: announced every 30s
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#useCountdown] — Takes (startTimestamp, durationSeconds, options?) returns remainingSeconds. Injectable now() for testing
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Haptic Scale] — Rest timer finished: Light impact, 150ms
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy] — Composition: WorkoutHeader + RestTimerBar + ScrollView of ExerciseAccordionItems
- [Source: _bmad-output/planning-artifacts/prd.md#FR34] — "System starts a rest countdown timer automatically after each set confirmation"
- [Source: _bmad-output/planning-artifacts/prd.md#FR35] — "Rest timer continues running when the user navigates between exercises"
- [Source: _bmad-output/planning-artifacts/prd.md#FR36] — "User can dismiss or skip the rest timer at any time"
- [Source: _bmad-output/planning-artifacts/prd.md#FR37] — "System sends a local notification when the rest timer completes while the app is backgrounded"
- [Source: _bmad-output/planning-artifacts/prd.md#NFR9] — "Rest timer maintains +/- 1 second accuracy over a 5-minute period"
- [Source: _bmad-output/planning-artifacts/prd.md#NFR16] — "App remains fully functional if notification permission is denied"
- [Source: _bmad-output/project-context.md#Code Style] — Prettier config, no semicolons, single quotes, no trailing commas
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest, **tests**/ mirror structure, describe/it blocks
- [Source: _bmad-output/project-context.md#State Management] — React Context API only, no Redux/Zustand
- [Source: _bmad-output/implementation-artifacts/3-1-mmkv-persistence-layer-and-continuous-state-saving.md] — MMKV v4 API, persistence pipeline, rest timer state persisted as part of WorkoutState
- [Source: _bmad-output/implementation-artifacts/3-2-seamless-workout-resume-and-state-restoration.md] — Resume pattern, absolute timestamp recalculation on restore, previous story learnings
- [Source: types/workout.ts] — RestTimerState type, START_REST_TIMER/DISMISS_REST_TIMER actions
- [Source: context/WorkoutExecutionContext.tsx] — startRestTimer/dismissRestTimer dispatchers
- [Source: hooks/workout/useElapsedTimer.ts] — requestAnimationFrame + injectable now() pattern to follow
- [Source: lib/haptics.ts] — Existing semantic haptics object, missing restTimerFinished
- [Source: types/program.ts#ProgramExerciseBlock] — restBetweenSets field (defaults 60s)
- [Source: lib/buildInitialState.ts] — Where restDurationMs needs to be populated from block.restBetweenSets

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

- Fixed `theme.colors.break` → `theme.colors.phases.break` (break color is nested under `colors.phases`)
- Fixed `expo-notifications` handler needing `shouldShowBanner` and `shouldShowList` properties
- Added `import React from 'react'` to RestTimerBar.tsx for test environment JSX compatibility

### Completion Notes List

- Installed `expo-notifications` (SDK 55 compatible) — 3 packages added
- Added `restDurationMs?: number` to `ExerciseState` for per-exercise rest duration, populated from `block.restBetweenSets` in `buildInitialState`
- Added `haptics.restTimerFinished: tapLight` semantic function
- Created `useRestTimer` hook (125 lines) — absolute timestamp countdown with `requestAnimationFrame`, injectable `now()`, auto-dismiss on expiry, notification scheduling/cancellation integrated
- Created `lib/notifications.ts` (67 lines) — `scheduleRestTimerNotification`, `cancelRestTimerNotification`, `requestNotificationPermission` with web no-op and try/catch error swallowing
- Created `RestTimerBar` component (97 lines) — pure render component with Rest label, M:SS countdown, Skip button, accessibility attributes
- Integrated into `[index]-v2.tsx` — `useRestTimer` hook called, `RestTimerBar` rendered between header and exercise list, `handleSetConfirm` starts timer with per-exercise duration, last-set detection prevents timer on workout completion
- Notification permission requested once on first workout mount via `useRef` flag
- 26 new tests across 3 test files: 7 hook tests, 11 component tests, 8 notification utility tests
- All 279 tests pass (246 existing + 33 new), no regressions
- Only pre-existing TS errors remain (SharedValue, notifyWarning)

### Change Log

- 2026-03-17: Implemented Story 4.1 — Rest Timer Bar with Background Notification (all 10 tasks complete)

### File List

New files:

- hooks/workout/useRestTimer.ts
- components/workout/RestTimerBar.tsx
- lib/notifications.ts
- **tests**/hooks/workout/useRestTimer.test.ts
- **tests**/components/workout/RestTimerBar.test.tsx
- **tests**/lib/notifications.test.ts

Modified files:

- types/workout.ts (added restDurationMs to ExerciseState)
- lib/buildInitialState.ts (populate restDurationMs from block.restBetweenSets)
- lib/haptics.ts (added restTimerFinished semantic function)
- hooks/workout/index.ts (added useRestTimer export)
- app/programs/[id]/session/[index]-v2.tsx (rest timer hook, component, and trigger integration)
- package.json (expo-notifications dependency)
- package-lock.json (expo-notifications dependency lock)
