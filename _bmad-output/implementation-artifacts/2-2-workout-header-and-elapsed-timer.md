# Story 2.2: Workout Header & Elapsed Timer

Status: done

## Story

As a user,
I want to see my workout duration and program name at the top of the screen with a way to end the workout,
So that I always know how long I've been working out and can finish when ready.

## Acceptance Criteria

1. **Given** an active workout session started from a program **When** the WorkoutHeader component renders **Then** the elapsed time displays in `display` typography (32pt Bold) and counts up from 0:00 using absolute timestamps (`Date.now()` at workout start)
2. The program name displays in the header using `subtext` color and `caption` typography
3. An "End" button is visible with `danger` styling (`dangerLight` background, `danger` text, `caption` size)
4. Tapping "End" shows a confirmation modal ("End workout? X sets remaining") using the existing `ConfirmationModal` component
5. Confirming ends the workout with remaining pending sets marked as skipped (dispatches `COMPLETE_WORKOUT`)
6. Canceling dismisses the modal and returns to the workout
7. Hardware back / swipe back triggers the same "End Workout" confirmation
8. The timer continues counting accurately after phone lock and resume (absolute timestamps, not intervals)
9. The header renders within the `MaxWidthContainer` on larger screens
10. The `useElapsedTimer` hook is a pure timer hook with an injectable `now()` function for testing
11. No file exceeds ~300 lines
12. The existing test suite passes (`npm run test:run`)

## Tasks / Subtasks

- [x] Task 1: Create `components/workout/WorkoutHeader.tsx` — Header component (AC: #1, #2, #3, #9)
  - [x] 1.1 Create `components/workout/` directory
  - [x] 1.2 Define `WorkoutHeaderProps` interface: `{ programName: string, sessionName?: string, elapsedMs: number, onEnd: () => void }`
  - [x] 1.3 Implement layout: elapsed timer (left), program name (center/right), End button (right)
  - [x] 1.4 Elapsed timer displays `MM:SS` format using `display` typography (32pt Bold, `theme.typography.display`)
  - [x] 1.5 When elapsed time >= 60 minutes, display `H:MM:SS` format
  - [x] 1.6 Program name displays in `caption` typography with `subtext` color
  - [x] 1.7 Session name displays below program name if provided, in `small` typography with `muted` color
  - [x] 1.8 "End" button uses `dangerLight` background, `danger` text, `caption` typography, `radius.sm` border radius, 48pt minimum touch target
  - [x] 1.9 Wrap content in horizontal row with `spacing.lg` padding
  - [x] 1.10 Add accessibility labels: timer as live region (polite), End button as "End workout"

- [x] Task 2: Create `hooks/workout/useElapsedTimer.ts` — Timer hook (AC: #1, #8, #10)
  - [x] 2.1 Accept `startedAt: number` (absolute timestamp from `WorkoutState.startedAt`) and optional `now?: () => number` for test injection
  - [x] 2.2 Use `requestAnimationFrame` loop to compute `elapsedMs = now() - startedAt` on each frame
  - [x] 2.3 Throttle state updates to once per second (1000ms) to avoid excessive re-renders — compare `Math.floor(elapsedMs / 1000)` to previous value
  - [x] 2.4 Return `{ elapsedMs: number }` — the component formats it
  - [x] 2.5 Clean up `cancelAnimationFrame` on unmount
  - [x] 2.6 When `isCompleted` is true (from context), stop the timer and freeze at `completedAt - startedAt`
  - [x] 2.7 Export from `hooks/workout/index.ts`

- [x] Task 3: Create `hooks/workout/useEndWorkout.ts` — End workout logic with modal state (AC: #4, #5, #6, #7)
  - [x] 3.1 Manage modal visibility state: `showEndConfirmation: boolean`
  - [x] 3.2 Compute `pendingSetsCount` from workout state: count all sets where `status === 'pending' || status === 'active'`
  - [x] 3.3 `requestEnd()` — sets `showEndConfirmation = true`
  - [x] 3.4 `confirmEnd()` — dispatches `completeWorkout()` from context, sets modal to false
  - [x] 3.5 `cancelEnd()` — sets modal to false
  - [x] 3.6 Return `{ showEndConfirmation, pendingSetsCount, requestEnd, confirmEnd, cancelEnd }`
  - [x] 3.7 Export from `hooks/workout/index.ts`

- [x] Task 4: Wire WorkoutHeader into `[index]-v2.tsx` route (AC: #7, #9)
  - [x] 4.1 Import `WorkoutHeader` and `useElapsedTimer` into `WorkoutSessionContent` component
  - [x] 4.2 Import `useEndWorkout` for end-workout modal state
  - [x] 4.3 Render `WorkoutHeader` above the exercise list inside `MaxWidthContainer`
  - [x] 4.4 Render `ConfirmationModal` with end-workout props: `title="End workout?"`, `message="X sets remaining will be marked as skipped."`, `confirmLabel="End Workout"`, `cancelLabel="Keep Going"`
  - [x] 4.5 Add `useBackHandler` (or `BackHandler` listener) to intercept hardware back / swipe back and trigger `requestEnd()` instead of navigating away
  - [x] 4.6 When workout is completed (`state.isCompleted`), for now show a simple "Workout Complete!" text (CompletionSummary comes in Epic 7)

- [x] Task 5: Create `formatElapsedTime` utility (AC: #1)
  - [x] 5.1 Add `formatElapsedTime(ms: number): string` to a new or existing utility location (e.g., inside `WorkoutHeader.tsx` or `lib/utils/formatTime.ts`)
  - [x] 5.2 Format as `M:SS` for < 10 min, `MM:SS` for < 60 min, `H:MM:SS` for >= 60 min
  - [x] 5.3 Leading zero on seconds always; no leading zero on minutes until >= 10 min; no leading zero on hours

- [x] Task 6: Write tests (AC: #10, #11, #12)
  - [x] 6.1 Create `__tests__/hooks/workout/useElapsedTimer.test.ts` — test timer with injected `now()`: verify elapsed calculation, verify 1s update throttle, verify freeze on completion
  - [x] 6.2 Create `__tests__/hooks/workout/useEndWorkout.test.ts` — test modal state: requestEnd, confirmEnd, cancelEnd, pendingSetsCount computation
  - [x] 6.3 Test `formatElapsedTime`: `0ms → "0:00"`, `65000ms → "1:05"`, `605000ms → "10:05"`, `3661000ms → "1:01:01"`
  - [x] 6.4 Verify no new TypeScript compilation errors (`npm run compile`)
  - [x] 6.5 Verify all tests pass (`npm run test:run`)
  - [x] 6.6 Verify all new files pass Prettier (`npm run lint:fix`)

## Dev Notes

### Architecture Constraints

- **Brownfield project:** This story creates new files in the NEW `components/workout/` directory and adds hooks to `hooks/workout/`. No existing files are modified except the v2 route file and barrel exports.
- **Clean-room rebuild strategy:** The new `WorkoutHeader` is built inside the v2 route (`[index]-v2.tsx`), alongside the existing `[index].tsx` which remains untouched.
- **Timer uses absolute timestamps:** `WorkoutState.startedAt` is a `Date.now()` value set when the workout begins. The elapsed timer computes `now() - startedAt` on each frame. This guarantees accuracy after phone lock, app backgrounding, and OS force-quit + restore (the stored `startedAt` value doesn't change).
- **No `setInterval`:** React Native has known timer accuracy issues with `setInterval` on Android (RN issues #32567, #34995). Use `requestAnimationFrame` for the update loop, throttled to 1-second UI updates.
- **`MaxWidthContainer` is required:** The header must render inside the existing `MaxWidthContainer` component (from Story 1.3) to constrain to 480pt on larger screens.

### Existing Components to Reuse

**`ConfirmationModal` (components/common/ConfirmationModal.tsx):**

```typescript
interface ConfirmationModalProps {
  visible: boolean
  title: string
  message: string
  itemName?: string
  itemType?: 'exercise' | 'program'
  confirmLabel?: string // default: 'Delete'
  cancelLabel?: string // default: 'Cancel'
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  loading?: boolean
}
```

Use with: `title="End workout?"`, `message="${pendingSetsCount} sets remaining will be marked as skipped."`, `confirmLabel="End Workout"`, `cancelLabel="Keep Going"`. The modal already handles `haptics.notifyWarning()` on confirm and `haptics.buttonTap()` on cancel.

**`MaxWidthContainer` (components/common/MaxWidthContainer.tsx):**

```typescript
type MaxWidthContainerProps = {
  children: ReactNode
  style?: ViewStyle
}
```

Uses `useResponsiveLayout()` internally. Wrap the header content inside this component.

### Existing Types & Context API

**WorkoutState (from Story 2-1):**

- `startedAt: number` — absolute timestamp when workout began
- `completedAt: number | null` — null while active, timestamp when completed
- `isCompleted: boolean` — false while active, true when COMPLETE_WORKOUT dispatched
- `exercises: ExerciseState[]` — array of exercises with sets
- `sessionName: string` — the session name from the program
- `programSlug: string` — the program identifier

**WorkoutExecutionContext consumer hook:**

```typescript
const { state, completeWorkout } = useWorkoutExecution()
```

`completeWorkout()` dispatches `COMPLETE_WORKOUT` which sets `isCompleted = true`, `completedAt = Date.now()`, and marks all remaining `pending`/`active` sets as `skipped`.

### WorkoutHeader Layout Spec

```
┌──────────────────────────────────────────────────────┐
│  0:00          Push Day A              [End]         │
│  (display)     (caption/subtext)       (danger btn)  │
│                Session 1                              │
│                (small/muted)                          │
└──────────────────────────────────────────────────────┘
```

- Timer on the left: `display` typography (32pt Bold), `text` color
- Program name center-right: `caption` typography (13pt Medium), `subtext` color
- Session name below program name: `small` typography (11pt Medium), `muted` color
- End button on the right: `caption` typography, `danger` text on `dangerLight` background, `radius.sm` corners
- Horizontal padding: `spacing.lg` (16pt)
- Vertical padding: `spacing.md` (12pt)
- All elements vertically centered in the row

### Timer Format

| Elapsed | Display |
| ------- | ------- |
| 0s      | 0:00    |
| 5s      | 0:05    |
| 65s     | 1:05    |
| 605s    | 10:05   |
| 3661s   | 1:01:01 |

### Hardware Back Handler

Use React Native's `BackHandler` API:

```typescript
import { BackHandler } from 'react-native'

useEffect(() => {
  const handler = BackHandler.addEventListener('hardwareBackPress', () => {
    requestEnd()
    return true // prevent default back navigation
  })
  return () => handler.remove()
}, [requestEnd])
```

On web, the Expo Router back behavior should be intercepted via the `beforeRemove` navigation event:

```typescript
import { useNavigation } from 'expo-router'

useEffect(() => {
  const unsubscribe = navigation.addListener('beforeRemove', e => {
    e.preventDefault()
    requestEnd()
  })
  return unsubscribe
}, [navigation, requestEnd])
```

### Previous Story (2-1) Learnings

**What worked well:**

- Pure function reducer with zero mocking needed for tests — reducer is fully testable
- Extracting `findNextPendingSet` as a separate pure function improved testability
- `context/workoutReducer.ts` was separated from `WorkoutExecutionContext.tsx` when the context file exceeded ~300 lines
- `WorkoutExecutionProvider` wraps `useReducer` with named action dispatchers (`confirmSet`, `skipSet`, etc.)

**What went wrong:**

- COMPLETE_WORKOUT reducer initially only marked `pending` sets as `skipped`, missing `active` sets — test caught the bug. Current implementation correctly marks both `pending` and `active` sets as `skipped`.
- v2 route initially used non-existent theme tokens (`textSecondary`, `borderRadius`, `error`) — always verify token names against `theme/theme.ts`. Correct tokens: `subtext` (not `textSecondary`), `radius` (not `borderRadius`), `danger` (not `error`).
- Pre-existing TS errors from Epic 1 scope remain in compilation output. Do NOT fix them — they are out of scope.

**Key context from 2-1:**

- 23 new tests were added (40 total). This story should add tests for the new hooks.
- The v2 route currently renders a minimal placeholder inside the provider. This story replaces the placeholder header area with the real `WorkoutHeader` component.
- `buildInitialState()` in `[index]-v2.tsx` already sets `startedAt: Date.now()` when creating the initial state.

### Git Intelligence

Recent commits (from Epic 1 + Story 2-1):

- `50fe1e2` feat: implement responsive layout hook and MaxWidthContainer — `useResponsiveLayout.ts` and `MaxWidthContainer.tsx` available
- `38f1186` refactor: migrate hardcoded colors to theme tokens — all components use theme tokens
- `2dbe9ea` refactor: remove deprecated theme tokens and finalize dark-first design system
- `a9e3c7f` refactor: update theme colors and fonts to DMSans

Patterns established: DM Sans fonts loaded, dark theme tokens in place, `MaxWidthContainer` for responsive layout.

### Latest Technical Context

**Timer implementation:** Use `requestAnimationFrame` (not `setInterval`) for elapsed timer updates. React Native has known `setInterval` accuracy issues on Android. Compute elapsed from `Date.now() - startedAt` on each frame. Throttle React state updates to 1-second intervals.

**expo-haptics (Expo SDK 55):**

- `Haptics.ImpactFeedbackStyle.Light | Medium | Heavy | Rigid | Soft`
- `Haptics.NotificationFeedbackType.Success | Warning | Error`
- The existing `lib/haptics.ts` already wraps these — use semantic functions from `haptics.*`.

### Prettier Rules (Project Enforced)

- No semicolons (`semi: false`)
- Single quotes (`singleQuote: true`)
- No trailing commas (`trailingComma: none`)
- Avoid arrow parens when possible (`arrowParens: avoid`)

### Import Conventions

- Path alias: `@/` for all imports (e.g., `import { theme } from '@/theme/theme'`)
- Named exports for components and hooks
- `export type` for type-only exports

### File Size Budget

| File                                              | Estimated Lines | Budget    |
| ------------------------------------------------- | --------------- | --------- |
| `components/workout/WorkoutHeader.tsx`            | ~100-130        | Under 300 |
| `hooks/workout/useElapsedTimer.ts`                | ~50-60          | Under 300 |
| `hooks/workout/useEndWorkout.ts`                  | ~40-50          | Under 300 |
| `__tests__/hooks/workout/useElapsedTimer.test.ts` | ~80-100         | Under 300 |
| `__tests__/hooks/workout/useEndWorkout.test.ts`   | ~60-80          | Under 300 |
| `app/programs/[id]/session/[index]-v2.tsx`        | ~220-250        | Under 300 |

### Anti-Patterns to Avoid

```typescript
// BAD: setInterval for elapsed timer (drift + Android issues)
const [elapsed, setElapsed] = useState(0)
useEffect(() => {
  const id = setInterval(() => setElapsed(e => e + 1), 1000)
  return () => clearInterval(id)
}, [])

// GOOD: requestAnimationFrame with absolute timestamps
const [elapsedMs, setElapsedMs] = useState(0)
useEffect(() => {
  let raf: number
  let lastSecond = -1
  const tick = () => {
    const ms = (now?.() ?? Date.now()) - startedAt
    const second = Math.floor(ms / 1000)
    if (second !== lastSecond) {
      setElapsedMs(ms)
      lastSecond = second
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}, [startedAt])

// BAD: Local state for modal (duplicates what hook manages)
const [showModal, setShowModal] = useState(false)

// GOOD: Use useEndWorkout hook
const { showEndConfirmation, requestEnd, confirmEnd, cancelEnd } =
  useEndWorkout()

// BAD: Direct haptic import in component
import * as Haptics from 'expo-haptics'

// GOOD: Haptics through lib/haptics.ts (already handled by ConfirmationModal)
import { haptics } from '@/lib/haptics'

// BAD: Using non-existent theme tokens
theme.colors.textSecondary // WRONG — use theme.colors.subtext
theme.colors.error // WRONG — use theme.colors.danger
theme.borderRadius // WRONG — use theme.radius

// GOOD: Correct theme token usage
theme.colors.subtext
theme.colors.danger
theme.colors.dangerLight
theme.radius.sm
theme.typography.display
theme.typography.caption
```

### Project Structure Notes

- `components/workout/WorkoutHeader.tsx` — NEW file in NEW `components/workout/` directory
- `hooks/workout/useElapsedTimer.ts` — NEW file in existing `hooks/workout/` directory
- `hooks/workout/useEndWorkout.ts` — NEW file in existing `hooks/workout/` directory
- `hooks/workout/index.ts` — MODIFY to add new exports
- `app/programs/[id]/session/[index]-v2.tsx` — MODIFY to wire in WorkoutHeader + ConfirmationModal + back handler
- `__tests__/hooks/workout/useElapsedTimer.test.ts` — NEW test file
- `__tests__/hooks/workout/useEndWorkout.test.ts` — NEW test file

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — Acceptance criteria, user story
- [Source: _bmad-output/planning-artifacts/architecture.md#Timer Architecture Pattern] — Absolute timestamps for rest timer and elapsed timer
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — Component props: `{ComponentName}Props`, callbacks: `on{Event}` prefix
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — `components/workout/` directory, hooks/workout/ directory
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Loading/error/empty states, accessibility labels
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#WorkoutHeader] — Header anatomy, props interface, timer live region
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography Application] — `display` for workout timer (32/Bold), `caption` for exercise meta
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Action Hierarchy] — Tier 3 destructive: End button with dangerLight bg, danger text, caption size, requires confirmation
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] — Hardware back / swipe back triggers End Workout confirmation
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — Haptic scale: end workout confirmed = warning notification
- [Source: _bmad-output/planning-artifacts/prd.md#Workout Execution] — FR7 (end early, mark skipped), FR8 (view elapsed time)
- [Source: _bmad-output/planning-artifacts/prd.md#Performance] — NFR3 (< 200ms navigation response)
- [Source: _bmad-output/project-context.md#Component Naming & Structure] — PascalCase files, named exports, functional components
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest patterns, **tests**/ mirror structure
- [Source: _bmad-output/implementation-artifacts/2-1-workout-state-machine-and-type-contracts.md] — Previous story learnings, theme token corrections, WorkoutState contract

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (via Cursor)

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

- **Task 1:** Created `WorkoutHeader` component with `WorkoutHeaderProps` interface, horizontal layout (timer left, program name center-right, End button right), `display` typography for timer, `caption`/`subtext` for program name, `small`/`muted` for session name, `dangerLight`/`danger` End button with 48pt min touch target, accessibility labels (timer live region, End button).
- **Task 2:** Created `useElapsedTimer` hook using `requestAnimationFrame` loop with `now()` injection for testing. Throttles state updates to 1-second intervals via `Math.floor(ms / 1000)` comparison. Freezes at `completedAt - startedAt` when workout is completed. Cleans up via `cancelAnimationFrame` on unmount.
- **Task 3:** Created `useEndWorkout` hook managing modal visibility state, computing `pendingSetsCount` from workout state (counts pending + active sets), with `requestEnd`, `confirmEnd` (dispatches `completeWorkout()`), and `cancelEnd` callbacks.
- **Task 4:** Wired `WorkoutHeader` into v2 route inside `MaxWidthContainer`. Added `ConfirmationModal` with end-workout messaging. Implemented `BackHandler` listener for hardware back and `beforeRemove` navigation listener for web/swipe back. Added "Workout Complete!" placeholder when `state.isCompleted` is true.
- **Task 5:** `formatElapsedTime` exported from `WorkoutHeader.tsx` as a named function. Handles `M:SS`, `MM:SS`, `H:MM:SS` formats with leading zeros on seconds, no leading zeros on minutes < 10 or hours.
- **Task 6:** Created 24 new tests (64 total): 14 in `useElapsedTimer.test.ts` (formatElapsedTime: 9 pure function tests, elapsed computation logic: 5 tests), 10 in `useEndWorkout.test.ts` (pendingSetsCount: 7 tests, modal state transitions: 3 tests). All 64 tests pass. No new TS compilation errors. All files pass Prettier.

### Senior Developer Review (AI)

**Reviewer:** Nocfer | **Date:** 2026-03-09 | **Outcome:** Approved with fixes applied

**Issues Found:** 3 High, 4 Medium, 3 Low (joint review with Story 2-1)

**Fixes Applied:**
- **[H1] Navigation trapped after completion (Bug):** Added `state.isCompleted` guard to both `BackHandler` and `beforeRemove` listeners in `[index]-v2.tsx`. Users can now navigate away after workout completion.
- **[H3] Hook tests not testing actual hooks:** Rewrote `useElapsedTimer.test.ts` and `useEndWorkout.test.ts` to call the actual hooks with mocked React primitives and context, following the project's established `useResponsiveLayout.test.ts` pattern. Added 5 new tests (69 total).
- **[M3] useElapsedTimer `getNow` instability:** Replaced inline `getNow` variable with `useRef`-based `nowRef`, removing the function reference from the `useEffect` dependency array. Prevents infinite re-render if a consumer passes an inline `now` function.
- **[M4] Missing session name in header:** Added `sessionName` prop to `WorkoutHeader` call, displaying `Session {index}` below the program name.

### Change Log

- **2026-03-09:** Implemented Story 2.2 — WorkoutHeader component, useElapsedTimer hook (rAF-based with absolute timestamps), useEndWorkout hook (modal state + pending set count), wired into v2 route with back handler intercept and confirmation modal. Added 24 new tests. All ACs satisfied.
- **2026-03-09:** Code review — Fixed navigation trap after completion (H1), rewrote hook tests to call actual hooks (H3), stabilized useElapsedTimer now-ref (M3), added session name to header (M4). Status → done

### File List

- `components/workout/WorkoutHeader.tsx` — NEW (109 lines)
- `hooks/workout/useElapsedTimer.ts` — NEW (49 lines)
- `hooks/workout/useEndWorkout.ts` — NEW (40 lines)
- `hooks/workout/index.ts` — MODIFIED (added useElapsedTimer, useEndWorkout exports)
- `hooks/index.ts` — MODIFIED (added useElapsedTimer, useEndWorkout to barrel export)
- `app/programs/[id]/session/[index]-v2.tsx` — MODIFIED (250 lines; added WorkoutHeader, ConfirmationModal, back handler, completion state)
- `__tests__/hooks/workout/useElapsedTimer.test.ts` — NEW (104 lines)
- `__tests__/hooks/workout/useEndWorkout.test.ts` — NEW (155 lines)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED (status update)
