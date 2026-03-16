# Story 2.8: Web Keyboard Shortcuts

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user on web,
I want to use keyboard shortcuts to log sets efficiently,
So that the desktop experience feels native and productive for reviewing or logging workouts.

## Acceptance Criteria

1. **Given** the workout execution screen is active on web **When** the user presses Enter **Then** the active set is confirmed (equivalent to tapping the checkmark) (FR16)
2. **Given** the keypad is visible on web **When** the user presses Tab **Then** focus moves to the next input field (reps → weight → next set's reps → dismiss) (FR16)
3. **Given** the keypad is visible on web **When** the user presses Escape **Then** the NumericKeypad is dismissed (FR16)
4. Arrow keys are not required but can optionally navigate between exercises
5. Keyboard shortcuts are progressive enhancement — they do not appear on or execute on mobile
6. All keyboard interactions produce the same state changes as their touch equivalents
7. Keyboard shortcuts do not interfere with system keyboard shortcuts or browser navigation (Ctrl+key, Alt+key, Meta+key combos are ignored)
8. Digit keys (0-9) and Backspace route to the keypad when visible on web, enabling fully keyboard-driven value entry
9. No file exceeds ~300 lines
10. The existing test suite passes (`npm run test:run`)

## Tasks / Subtasks

- [ ] Task 1: Create useWebKeyboardShortcuts hook (AC: #1, #2, #3, #5, #6, #7, #8)
  - [ ] 1.1 Create `hooks/workout/useWebKeyboardShortcuts.ts` — new hook that adds a `keydown` event listener on `document` when `Platform.OS === 'web'`
  - [ ] 1.2 Hook accepts a config object: `{ onEnter, onTab, onEscape, onDigit?, onBackspace?, enabled }` — all callbacks are invoked on the corresponding key presses
  - [ ] 1.3 Gate all event listeners behind `Platform.OS === 'web'` AND `enabled` — no-op on iOS/Android
  - [ ] 1.4 Ignore key events when modifier keys are held (Ctrl, Alt, Meta) to avoid hijacking browser shortcuts
  - [ ] 1.5 Call `e.preventDefault()` for Enter, Tab, Escape, digit keys, and Backspace to stop default browser behavior (Tab focus cycling, Enter form submission, Backspace navigation)
  - [ ] 1.6 Route digit keys `0-9` → `onDigit(parseInt(e.key, 10))` when `onDigit` callback is provided (keypad visible)
  - [ ] 1.7 Route Backspace → `onBackspace()` when `onBackspace` callback is provided (keypad visible)
  - [ ] 1.8 Cleanup: remove event listener on unmount or when config changes
  - [ ] 1.9 Export `useWebKeyboardShortcuts` from `hooks/workout/index.ts`

- [ ] Task 2: Build composed handlers in v2 route (AC: #1, #2, #3, #6, #8)
  - [ ] 2.1 Create `handleEnterConfirm` callback in `WorkoutSessionContent`: find the current active or editing set from `state.exercises`, call `handleSetConfirm(exerciseIndex, setIndex)`. No-op if no active/editing set exists.
  - [ ] 2.2 Create `handleTabAdvance` callback: if keypad not visible → open keypad on active set's reps field. If keypad on reps → switch to weight. If keypad on weight → find next pending/active set in same exercise and open on reps. If no more sets → dismiss keypad.
  - [ ] 2.3 Create `handleEscapeDismiss` callback: call `dismissKeypad()` — same as tapping outside the keypad
  - [ ] 2.4 Call `useWebKeyboardShortcuts({ onEnter: handleEnterConfirm, onTab: handleTabAdvance, onEscape: handleEscapeDismiss, onDigit: keypadState.visible ? handleDigit : undefined, onBackspace: keypadState.visible ? handleBackspace : undefined, enabled: !state.isCompleted })`
  - [ ] 2.5 Ensure `enabled` is `false` when workout is completed (no shortcuts on completion screen)

- [ ] Task 3: Write tests (AC: #5, #6, #7, #9, #10)
  - [ ] 3.1 Unit tests for `useWebKeyboardShortcuts` in `__tests__/hooks/workout/useWebKeyboardShortcuts.test.ts`:
    - Enter key fires `onEnter` callback with `preventDefault`
    - Tab key fires `onTab` callback with `preventDefault`
    - Escape key fires `onEscape` callback with `preventDefault`
    - Digit keys (0-9) fire `onDigit` with parsed integer when callback provided
    - Digit keys ignored when `onDigit` is undefined
    - Backspace fires `onBackspace` when callback provided
    - Modifier key combos (Ctrl+Enter, Alt+Tab, Meta+Escape) are ignored
    - Hook is no-op when `Platform.OS !== 'web'` (mock Platform)
    - Hook is no-op when `enabled` is false
    - Event listener is cleaned up on unmount
    - Unrecognized keys are ignored (no errors)
  - [ ] 3.2 Verify no new TypeScript compilation errors (`npm run compile`)
  - [ ] 3.3 Verify all tests pass (`npm run test:run`)
  - [ ] 3.4 Verify all files pass Prettier (`npm run lint:fix`)

## Dev Notes

### Architecture Constraints

- **Brownfield project:** Creating 1 new hook file, modifying 2 existing files. No architectural changes.
- **Clean-room rebuild:** All changes stay within the v2 route and its component tree. Existing `[index].tsx` remains untouched.
- **Progressive enhancement ONLY:** Keyboard shortcuts must never execute on mobile. The `Platform.OS === 'web'` gate is the enforcement mechanism. No `Platform.OS` branching in business logic — the hook is a self-contained web enhancement layer.
- **Same state changes:** Every keyboard shortcut must produce identical reducer dispatches to its touch equivalent. Enter = confirmSet, Tab = field navigation, Escape = dismissKeypad. No new reducer actions needed.
- **React Context API only:** No Redux/Zustand. State management through context and hooks.
- **No file exceeds ~300 lines.**

### What's Already Implemented (Stories 2.1–2.7)

**Current `useKeypadState.ts` (136 lines):**

- Manages keypad visibility, focus (exerciseIndex, setIndex, field), and isFirstDigit state
- `openKeypad(exerciseIndex, setIndex, field)` — opens keypad with focus on a specific field
- `handleDigit(digit)` — processes digit input (first digit replaces, subsequent append)
- `handleBackspace()` — removes last digit
- `handleDone()` — reps→weight (switch field), weight→dismiss (close keypad)
- `switchField(exerciseIndex, setIndex, field)` — directly sets focus to a specific field
- `dismissKeypad()` — closes keypad and clears focus
- **Gap:** No concept of "advance to next set" — handleDone only goes reps→weight→dismiss within the same set

**Current v2 route (`app/programs/[id]/session/[index]-v2.tsx`, 328 lines):**

- `WorkoutSessionContent` inner component wires all handlers together
- `handleSetConfirm(exerciseIndex, setIndex)` — calls `confirmSet` + `dismissKeypad`
- `handleFieldPress(exerciseIndex, setIndex, field)` — opens or switches keypad
- `handleExpandExercise(exerciseIndex)` — dismisses keypad + expands + scrolls
- `handleSetDotNavigation` — handles set dot taps (edit completed, expand others)
- `handleSetRowPress` — handles row taps (edit completed, open keypad)
- `handleBackPress` — hardware back triggers end confirmation
- Uses `BackHandler` for Android back and `navigation.addListener('beforeRemove')` for swipe back
- **Gap:** No keyboard event handling for web
- **⚠️ 328 lines — close to 300-line limit.** Adding ~25 lines for keyboard shortcut integration. If it exceeds, extract keyboard-related handlers into the hook itself or simplify the integration.

**Current `WorkoutExecutionContextValue` dispatchers:**

- `expandExercise`, `logSet`, `confirmSet`, `skipSet`, `editSet`, `startRestTimer`, `dismissRestTimer`, `completeWorkout`, `restoreState`
- No changes needed — keyboard shortcuts use existing dispatchers through existing composed handlers.

**Current `WorkoutState` (in `types/workout.ts`):**

- `expandedExerciseIndex: number` — which exercise is currently expanded
- `activeSetIndex: number` — which set is active within the expanded exercise
- `exercises: ExerciseState[]` — each with `sets: ExerciseSetState[]`
- `isCompleted: boolean` — workout done flag

**Current `KeypadState` type:**

```
{ visible: boolean, focus: { exerciseIndex, setIndex, field } | null, isFirstDigit: boolean }
```

**Current `SetStatus` type:** `'pending' | 'active' | 'completed' | 'skipped' | 'editing'`

### Keyboard Shortcut Design

**Enter — Confirm Active Set:**

```
1. Find the set with status 'active' or 'editing' across all exercises
2. If found → call handleSetConfirm(exerciseIndex, setIndex)
3. If not found → no-op (all sets completed/skipped/pending)
```

The active set can be found using `state.expandedExerciseIndex` and `state.activeSetIndex`. The set at `state.exercises[expandedExerciseIndex].sets[activeSetIndex]` should have status `active` or `editing`. Guard against out-of-bounds.

**Tab — Advance Input Focus:**

```
1. If keypad NOT visible:
   → Open keypad on active set's reps field
   → openKeypad(state.expandedExerciseIndex, state.activeSetIndex, 'reps')

2. If keypad on reps:
   → Switch to weight (same set)
   → switchField(exerciseIndex, setIndex, 'weight')

3. If keypad on weight:
   → Find next navigable set in same exercise (pending or active, setIndex + 1)
   → If found → switchField(exerciseIndex, nextSetIndex, 'reps')
   → If not found → dismissKeypad()
```

**Escape — Dismiss Keypad:**

```
1. If keypad visible → dismissKeypad()
2. If keypad NOT visible → no-op (don't trigger End Workout)
```

**Digit Keys (0-9) — Route to Keypad:**

```
1. If keypad visible → handleDigit(parseInt(key, 10))
2. If keypad NOT visible → no-op (don't intercept normal typing)
```

**Backspace — Route to Keypad:**

```
1. If keypad visible → handleBackspace()
2. If keypad NOT visible → no-op (browser default)
```

### Web Platform Considerations

**`document` access on web:**

- `document.addEventListener('keydown', handler)` is the standard web API for keyboard events
- Available in Expo Web runtime, but NOT in React Native iOS/Android
- The `Platform.OS === 'web'` gate prevents any `document` access on native platforms
- TypeScript may not type `document` in RN environment — use conditional access: `typeof document !== 'undefined' && document.addEventListener(...)` as a safety belt

**`KeyboardEvent.key` values:**

| Key Pressed | `e.key` Value | Action |
| --- | --- | --- |
| Enter | `'Enter'` | Confirm active set |
| Tab | `'Tab'` | Advance to next field |
| Escape | `'Escape'` | Dismiss keypad |
| 0-9 | `'0'` to `'9'` | Route digit to keypad |
| Backspace | `'Backspace'` | Delete last digit |

**`preventDefault()` requirement:**

- **Tab** — browser default is focus cycling between DOM elements. Must prevent.
- **Enter** — browser default is form submission. Must prevent.
- **Escape** — browser default may close fullscreen. Must prevent.
- **Backspace** — browser default is page navigation (older browsers). Must prevent when keypad visible.
- **Digits** — no default behavior to prevent, but `preventDefault()` is harmless and keeps the pattern consistent.

**Modifier key exclusion:**

All shortcuts must be ignored when `e.ctrlKey`, `e.altKey`, or `e.metaKey` is true. This prevents hijacking browser shortcuts like Ctrl+C (copy), Ctrl+Tab (switch tabs), Alt+Tab (switch windows), Cmd+Z (undo), etc.

### Previous Story Learnings (Stories 2.1–2.7)

**What worked well:**

- Pure function reducer with zero mocking needed for tests
- Named action dispatchers (`expandExercise()`, `confirmSet()`) — components never access raw dispatch
- Separating `workoutReducer.ts` from context when files approach 300 lines
- Extracting helpers into `context/reducerHelpers.ts`
- `useKeypadState` as UI-only hook (transient state not in reducer)
- `useAsyncData<T>` pattern for data fetching hooks

**What went wrong:**

- **Wrong theme tokens:** `textSecondary` (doesn't exist) → use `subtext`, `borderRadius` → `radius`, `error` → `danger`. Always verify token names against `theme/theme.ts`.
- **Pre-existing TS errors from Epic 1 scope remain.** Do NOT fix: `haptics.notifyWarning` in `ConfirmationModal.tsx`, `SharedValue` in `profile.tsx`, and ~35 files referencing removed tokens. This story must not introduce NEW errors.
- **Test environment requires explicit `import React from 'react'`** for JSX in test files.
- **V2 route is at 328 lines** — already over the ~300 guideline. Keyboard shortcut integration adds ~25 lines. Consider extracting handler callbacks into the hook if the route gets too large.

**Current test count:** 191 tests (from stories 2.1-2.7). This story adds tests for the keyboard shortcuts hook.

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
- Hook tests use `renderHook` from `@testing-library/react`
- New hooks get their own test file

### Testing Strategy

**`useWebKeyboardShortcuts` tests (`__tests__/hooks/workout/useWebKeyboardShortcuts.test.ts`):**

Since this hook uses `document.addEventListener` (web-only API), tests need:
1. Mock `Platform.OS` to `'web'` to enable the hook
2. Mock `document.addEventListener` and `document.removeEventListener`
3. Fire synthetic `KeyboardEvent` objects to simulate key presses
4. Assert that the correct callbacks are invoked

```
Test cases:
- Enter key → onEnter called, preventDefault called
- Tab key → onTab called, preventDefault called
- Escape key → onEscape called, preventDefault called
- Digit 5 → onDigit(5) called when onDigit provided
- Digit 5 → ignored when onDigit is undefined
- Backspace → onBackspace called when onBackspace provided
- Ctrl+Enter → onEnter NOT called (modifier key exclusion)
- Alt+Tab → onTab NOT called
- Meta+Escape → onEscape NOT called
- Platform.OS = 'ios' → no event listeners registered
- enabled = false → no event listeners registered
- Unmount → removeEventListener called (cleanup)
- Random key 'a' → no callbacks fired
```

**Vitest patterns:** `describe`/`it` blocks, `expect()` assertions, `vi.fn()` mocking, no snapshot tests.

**Testing approach for Platform gating:**

```typescript
vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native')
  return { ...actual, Platform: { OS: 'web' } }
})
```

For non-web tests, mock Platform.OS to 'ios' and verify no event listeners are added.

**Testing approach for document events:**

```typescript
const listeners: Record<string, EventListener> = {}
vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
  listeners[event] = handler as EventListener
})

// Simulate keydown
listeners.keydown(new KeyboardEvent('keydown', { key: 'Enter' }))
expect(onEnter).toHaveBeenCalledTimes(1)
```

### Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| Enter pressed with no active set (all completed/skipped) | No-op — no set to confirm |
| Enter pressed on pending set (not yet active) | No-op — only active/editing sets can be confirmed via Enter |
| Tab pressed with keypad closed | Opens keypad on active set's reps field |
| Tab pressed on weight field, no more pending sets in exercise | Dismiss keypad |
| Tab pressed on weight field, next set is pending | Open keypad on next set's reps |
| Tab pressed on weight field, next set is completed | Skip to next pending set, or dismiss if none |
| Escape pressed with keypad already closed | No-op |
| Ctrl+Enter pressed | Ignored (modifier key) — browser handles normally |
| Alt+Tab pressed | Ignored — OS handles normally |
| Digit key pressed with keypad closed | No-op — digits only route when keypad visible |
| Backspace pressed with keypad closed | No-op — browser default (may navigate back) |
| Keyboard shortcut pressed after workout completed | No-op — `enabled: false` |
| Rapid key presses (Enter Enter Enter) | Each fires independently; confirms sequential sets |
| Shift+Tab (reverse tab) | Shift is not a modifier we check for; Tab handler fires. Could optionally reverse direction but AC doesn't require it. |

### File Size Budget

| File | Current Lines | Estimated After | Budget |
| --- | --- | --- | --- |
| `hooks/workout/useWebKeyboardShortcuts.ts` | NEW | ~55 | Under 300 |
| `hooks/workout/index.ts` | 6 | ~7 | Under 300 |
| `app/programs/[id]/session/[index]-v2.tsx` | 328 | ~355 | ⚠️ Over 300 — see mitigation below |
| `__tests__/hooks/workout/useWebKeyboardShortcuts.test.ts` | NEW | ~120 | Under 300 |

**V2 route mitigation if exceeding 300 lines:**

The v2 route is already at 328 lines (over the guideline from stories 2.6/2.7). Adding keyboard shortcut integration adds ~25 lines. Options to mitigate:

1. **Move composed handlers into the hook itself** — `useWebKeyboardShortcuts` could accept `state`, `keypadState`, and raw action handlers, then compose `handleEnterConfirm`, `handleTabAdvance`, `handleEscapeDismiss` internally. This moves ~15 lines out of the route.
2. **Extract a `useWorkoutSessionHandlers` hook** — consolidate `handleExpandExercise`, `handleFieldPress`, `handleSetConfirm`, etc. into a single hook. But this is a larger refactor better suited for a separate cleanup task.
3. **Accept the overage** — the route is a composition root where handlers are wired to components. Some size is inherent. The ~300 guideline is a soft target.

**Recommended approach:** Option 1 — make the hook accept enough context to compose the handlers internally. Keep the v2 route integration to a single hook call with minimal config.

### Anti-Patterns to Avoid

```typescript
// BAD: Adding event listeners directly in a component
useEffect(() => {
  document.addEventListener('keydown', handler) // Not platform-gated!
}, [])

// GOOD: Encapsulate in platform-gated hook
useWebKeyboardShortcuts({
  onEnter: handleEnterConfirm,
  onTab: handleTabAdvance,
  onEscape: handleEscapeDismiss,
  enabled: !state.isCompleted
})

// BAD: New reducer actions for keyboard shortcuts
dispatch({ type: 'KEYBOARD_CONFIRM_SET' })

// GOOD: Reuse existing actions — same state changes as touch
confirmSet(exerciseIndex, setIndex)

// BAD: Platform branching in business logic
if (Platform.OS === 'web') {
  confirmSet(exerciseIndex, setIndex)
} else {
  // touch confirm
}

// GOOD: Keyboard shortcuts are additive — they call the same handlers
// that touch events call. No branching.

// BAD: Capturing all keyboard events
const handler = (e: KeyboardEvent) => {
  e.preventDefault() // Breaks all browser shortcuts!
  ...
}

// GOOD: Only preventDefault for recognized shortcuts, ignore modifier combos
if (e.ctrlKey || e.altKey || e.metaKey) return
switch (e.key) {
  case 'Enter': e.preventDefault(); onEnter(); break
  // only known keys get preventDefault
  default: return // no preventDefault for unknown keys
}

// BAD: Using keypress event (deprecated)
document.addEventListener('keypress', handler)

// GOOD: Using keydown event (standard)
document.addEventListener('keydown', handler)

// BAD: Hardcoded key codes
if (e.keyCode === 13) // deprecated

// GOOD: Modern key names
if (e.key === 'Enter')

// BAD: Accessing document without platform check
document.addEventListener('keydown', handler) // crashes on native

// GOOD: Double gate with Platform check AND typeof check
if (Platform.OS !== 'web') return
if (typeof document === 'undefined') return
document.addEventListener('keydown', handler)
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
- Import context hooks from `@/hooks/workout`
- `Platform` imported from `react-native`

### Project Structure Notes

- `hooks/workout/useWebKeyboardShortcuts.ts` — NEW (web-only keyboard event hook)
- `hooks/workout/index.ts` — MODIFY (add useWebKeyboardShortcuts export)
- `app/programs/[id]/session/[index]-v2.tsx` — MODIFY (integrate useWebKeyboardShortcuts with composed handlers)
- `__tests__/hooks/workout/useWebKeyboardShortcuts.test.ts` — NEW (comprehensive hook tests)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.8] — Acceptance criteria, user story, keyboard shortcut requirements (FR16)
- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns] — "Web adds keyboard shortcuts (Enter/Tab/Escape) as progressive enhancement"
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — "keyboard shortcuts as progressive enhancement only"
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Import types from `types/workout.ts`, dispatch through `useWorkoutExecution()`, no raw dispatch
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Web Desktop Behavior] — "Keyboard shortcuts as progressive enhancement: Enter = confirm set, Escape = dismiss keypad, Tab = next input field, arrow keys = navigate exercises"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Desktop context] — "Mouse/keyboard interactions must feel native (tab between inputs, enter to confirm)"
- [Source: _bmad-output/planning-artifacts/prd.md#FR16] — "User can confirm sets, navigate inputs, and dismiss the keypad using keyboard shortcuts on web"
- [Source: _bmad-output/project-context.md#Expo-Specific Considerations] — "Platform.OS === 'web' for web-only features"
- [Source: _bmad-output/project-context.md#Code Style] — Prettier config, no semicolons, single quotes
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest, __tests__/ mirror structure, describe/it blocks
- [Source: _bmad-output/implementation-artifacts/2-7-pre-fill-engine-last-logged-and-program-targets.md] — Previous story learnings, current test count (191), file sizes, patterns
- [Source: _bmad-output/implementation-artifacts/2-6-edit-completed-sets.md] — Edit mode interactions, handleSetConfirm/handleFieldPress patterns, reducer helper extraction

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
