# Story 2.4: SetRow & NumericKeypad for Set Logging

Status: ready-for-dev

## Story

As a user,
I want to log my sets using large, gym-friendly inputs that show my expected reps and weight,
So that I can quickly confirm or adjust values between sets without fumbling with tiny inputs.

## Acceptance Criteria

1. **Given** an exercise is expanded in the accordion **When** the set rows render for that exercise **Then** each `SetRow` displays: set number, reps `NumericInput`, weight `NumericInput`, and confirm checkmark button in a single horizontal line
2. `SetRow` is a fully controlled component with no local state — all values flow from the workout context
3. `SetRow` displays 4 states: pending (muted text, outlined checkmark), active (primary set number, ready checkmark), completed (green values, green checkmark with icon), editing (pencil icon, dashed primary border, re-confirm button)
4. Tapping a reps or weight field opens the `NumericKeypad` overlay from the bottom (~40% of screen)
5. `NumericKeypad` displays digits 0-9, backspace, and Done in a grid layout with 48pt minimum button height and 8pt gaps
6. The first digit typed replaces the entire pre-filled value (not appends)
7. Backspace deletes the last digit; if all digits deleted, shows "0"
8. "Done" dismisses the keypad and moves focus to the next input (reps → weight → ready for confirm)
9. Tapping a different field moves focus without dismissing the keypad
10. Tapping outside inputs dismisses the keypad
11. Number inputs use `tabularNums` or fixed-width container for layout stability
12. The confirm checkmark has a 44x44pt touch target with filled primary background and white icon
13. All inputs and buttons meet the 48pt minimum touch target requirement (NFR20)
14. No file exceeds ~300 lines
15. The existing test suite passes (`npm run test:run`)

## Tasks / Subtasks

- [ ] Task 1: Create `components/workout/NumericKeypad.tsx` — Custom overlay keypad (AC: #5, #7)
  - [ ] 1.1 Define `NumericKeypadProps` type: `{ onDigit: (digit: number) => void, onBackspace: () => void, onDone: () => void }`
  - [ ] 1.2 Render 4×3 grid: digits 1-9 in rows, bottom row [⌫][0][Done]
  - [ ] 1.3 Each key: 48pt minimum height, `spacing.sm` (8pt) gaps between keys
  - [ ] 1.4 Digit keys: `surfaceElevated` background, `text` color, `bodyBold` typography, `radius.md` corners
  - [ ] 1.5 Backspace key: `surface` background, `subtext` color, "⌫" Unicode character
  - [ ] 1.6 Done key: `primary` background, `primaryTextOn` color, "Done" text
  - [ ] 1.7 All keys wrapped in `Pressable` with press feedback (opacity 0.7)
  - [ ] 1.8 Accessibility labels: "digit {n}", "backspace", "done, dismiss keypad"
  - [ ] 1.9 Keep component under ~80 lines — pure presentational, no state

- [ ] Task 2: Create `components/workout/SetRow.tsx` — Atomic set logging row (AC: #1, #2, #3, #12, #13)
  - [ ] 2.1 Define `SetRowProps` type: `{ setNumber: number, reps: number, weight: number, status: SetStatus, onRepsPress: () => void, onWeightPress: () => void, onConfirm: () => void, onPress: () => void, isRepsFocused?: boolean, isWeightFocused?: boolean }`
  - [ ] 2.2 Layout: horizontal row `[set#] [reps display] [weight display] [confirm button]` with `spacing.sm` gaps
  - [ ] 2.3 **Reps display:** Pressable area, 48pt min touch height, shows reps value in `bodyBold`, "reps" label in `caption`/`subtext`; focused state gets `primary` border
  - [ ] 2.4 **Weight display:** Same as reps but for weight value with "lbs" label
  - [ ] 2.5 Fixed-width container for numeric values (minWidth: 56pt) for layout stability when values change (AC: #11)
  - [ ] 2.6 **Confirm button:** 44×44pt Pressable, `radius.full` circle
  - [ ] 2.7 **Pending state:** `muted` text for set number and values, outlined confirm button (`border` color, 1px)
  - [ ] 2.8 **Active state:** `primary` color set number, `text` color values, filled `primary` confirm button with white "✓"
  - [ ] 2.9 **Completed state:** `success` color values, `phases.doneBg` confirm button background with `success` "✓", row background `successLight`
  - [ ] 2.10 **Editing state:** "✎" (pencil Unicode) replaces set number, `primary` dashed border on the row, `primary` confirm button for re-confirm
  - [ ] 2.11 Accessibility: `accessibilityLabel` per state ("Set {n}, pending", "Set {n}, ready to confirm", "Set {n}, completed, {reps} reps at {weight} lbs", "Set {n}, editing")
  - [ ] 2.12 Confirm button accessibility: "Confirm set {n}" for active, "Re-confirm set {n}" for editing
  - [ ] 2.13 No local state — component is fully controlled via props (AC: #2)

- [ ] Task 3: Create `hooks/workout/useKeypadState.ts` — Keypad focus & input management (AC: #4, #6, #8, #9, #10)
  - [ ] 3.1 Define keypad state type: `{ visible: boolean, exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', isFirstDigit: boolean }`
  - [ ] 3.2 `openKeypad(exerciseIndex, setIndex, field)` — sets visible true, stores focus target, sets `isFirstDigit` to true
  - [ ] 3.3 `handleDigit(digit)` — if `isFirstDigit`: replace value (dispatch `LOG_SET` with digit as the new value for the focused field); else: append digit (value * 10 + digit, max 4 digits / 9999). Set `isFirstDigit` to false.
  - [ ] 3.4 `handleBackspace()` — remove last digit: `Math.floor(value / 10)`, minimum 0. Set `isFirstDigit` to false.
  - [ ] 3.5 `handleDone()` — if field is 'reps', move focus to 'weight' on same set (keep keypad open); if field is 'weight', dismiss keypad
  - [ ] 3.6 `dismissKeypad()` — set visible to false, clear focus target
  - [ ] 3.7 `switchField(exerciseIndex, setIndex, field)` — change focus without dismissing (AC: #9)
  - [ ] 3.8 Read current value from workout state to compute digit append/replace correctly
  - [ ] 3.9 Hook consumes `useWorkoutExecution()` for state access and `logSet` dispatch

- [ ] Task 4: Update `components/workout/ExerciseAccordionItem.tsx` — Replace placeholders with SetRow (AC: #1)
  - [ ] 4.1 Add new props: `onSetRepsPress: (setIndex: number) => void`, `onSetWeightPress: (setIndex: number) => void`, `onSetConfirm: (setIndex: number) => void`, `onSetPress: (setIndex: number) => void`, `focusedField?: { setIndex: number, field: 'reps' | 'weight' } | null`
  - [ ] 4.2 Replace placeholder `View`/`Text` in expanded area with `SetRow` components
  - [ ] 4.3 Pass correct props: `reps={set.reps}`, `weight={set.weight}`, `status={set.status}`, `isRepsFocused` / `isWeightFocused` derived from `focusedField`
  - [ ] 4.4 Remove placeholder styles (`setRowPlaceholder`, `placeholderText`)
  - [ ] 4.5 Update measurement view to use SetRow-sized placeholders (or keep generic height estimate) so accordion height animation remains accurate
  - [ ] 4.6 Keep file under ~300 lines

- [ ] Task 5: Wire keypad overlay and SetRow interactions into `[index]-v2.tsx` (AC: #4, #10)
  - [ ] 5.1 Import and initialize `useKeypadState` hook
  - [ ] 5.2 Pass keypad interaction callbacks down through `ExerciseAccordionItem` props
  - [ ] 5.3 Render `NumericKeypad` overlay at the bottom of the screen layout (outside `ScrollView`, inside `MaxWidthContainer`)
  - [ ] 5.4 Keypad overlay: `position: 'absolute'`, bottom 0, full width, `overlayGlass` background, ~40% screen height
  - [ ] 5.5 Add `Pressable` wrapper around scroll area that calls `dismissKeypad()` when tapped outside inputs (AC: #10)
  - [ ] 5.6 Confirm button in SetRow dispatches `confirmSet(exerciseIndex, setIndex)` and dismisses keypad
  - [ ] 5.7 Keep v2 route under ~300 lines — if close, extract keypad overlay into a `KeypadOverlay` wrapper component

- [ ] Task 6: Write tests (AC: #14, #15)
  - [ ] 6.1 Create `__tests__/components/workout/NumericKeypad.test.tsx` — test all keys render, test onDigit/onBackspace/onDone callbacks fire with correct args, test accessibility labels
  - [ ] 6.2 Create `__tests__/components/workout/SetRow.test.tsx` — test all 4 states render correct content and styling cues, test accessibility labels per state, test onRepsPress/onWeightPress/onConfirm callbacks fire
  - [ ] 6.3 Create `__tests__/hooks/workout/useKeypadState.test.ts` — test first-digit-replace behavior, test digit append, test backspace, test Done focus advancement (reps→weight→dismiss), test switchField, test dismissKeypad
  - [ ] 6.4 Verify no new TypeScript compilation errors (`npm run compile`)
  - [ ] 6.5 Verify all tests pass (`npm run test:run`)
  - [ ] 6.6 Verify all new files pass Prettier (`npm run lint:fix`)

## Dev Notes

### Architecture Constraints

- **Brownfield project:** This story creates new files in `components/workout/` and `hooks/workout/`. Modifies `ExerciseAccordionItem.tsx` and the v2 route.
- **Clean-room rebuild:** All new components built inside the v2 route alongside existing `[index].tsx` which remains untouched.
- **No local state in SetRow:** SetRow is a **fully controlled component**. ALL values (reps, weight, status, focus state) flow down from the parent via props. The only stateful logic is in `useKeypadState` hook and the existing workout reducer.
- **No external icon library:** Use Unicode characters: "✓" for checkmark, "✎" for editing pencil, "⌫" for backspace. The project does not use a vector icon package.
- **NumericKeypad is pure presentational:** ~80 lines, no state, no context. Just buttons that fire callbacks.
- **Keypad state is UI-only:** The `useKeypadState` hook manages keypad visibility and focus. This is NOT stored in the workout reducer because it's transient UI state, not workout data.
- **react-native-reanimated 4.2.1:** Already installed. No animation needed for keypad in this story (simple show/hide). Accordion animation already handled in ExerciseAccordionItem.

### Existing Context & Types

**WorkoutState fields relevant to this story:**

```typescript
state.exercises: ExerciseState[]       // array of exercises with sets
state.expandedExerciseIndex: number    // which exercise is expanded
state.activeSetIndex: number           // which set is active in expanded exercise
```

**ExerciseSetState (from `types/workout.ts`):**

```typescript
type ExerciseSetState = {
  reps: number
  weight: number
  status: SetStatus  // 'pending' | 'active' | 'completed' | 'skipped' | 'editing'
  confirmedReps?: number
  confirmedWeight?: number
}
```

**Context dispatchers (from `hooks/workout/useWorkoutExecution.ts`):**

```typescript
const { state, logSet, confirmSet, expandExercise } = useWorkoutExecution()
logSet(exerciseIndex, setIndex, reps, weight)  // updates reps/weight values
confirmSet(exerciseIndex, setIndex)            // marks set completed, auto-advances
```

**Reducer behavior on LOG_SET:** Updates `reps` and `weight` on the specified set. Does not change status. Pure value update.

**Reducer behavior on CONFIRM_SET:** Marks set as `completed`, stores `confirmedReps`/`confirmedWeight`, then runs `findNextPendingSet` to auto-advance to next pending set (forward scan, wrap around). If next pending is in a different exercise, `expandedExerciseIndex` changes.

### SetRow Visual Specification

```
┌──────────────────────────────────────────────────────────────┐
│  [1]    [  8  reps]    [  135  lbs]    [ ✓ ]                 │
│  set#   reps input     weight input    confirm               │
└──────────────────────────────────────────────────────────────┘
```

| State     | Set # Style                     | Values Style                     | Confirm Button                                          | Row Background  |
| --------- | ------------------------------- | -------------------------------- | ------------------------------------------------------- | --------------- |
| pending   | `muted` (#53556A) number        | `muted` text                     | 44pt circle, 1px `border` outline, `muted` "✓"         | transparent     |
| active    | `primary` (#818CF8) number      | `text` (#ECEDF0) text            | 44pt circle, `primary` fill, white "✓"                  | transparent     |
| completed | `success` (#34D399) number      | `success` text                   | 44pt circle, `phases.doneBg` fill, `success` "✓"       | `successLight`  |
| editing   | `primary` "✎" (pencil Unicode) | `text` text, values editable     | 44pt circle, `primary` fill, white "✓" (re-confirm)    | dashed `primary` border |

- Row height: minimum 48pt (touch target)
- Input field touch areas: 48pt height minimum
- Confirm button: 44×44pt, `radius.full`
- Gap between elements: `spacing.sm` (8pt)
- Numeric values: `bodyBold` (16pt SemiBold), fixed minWidth: 56pt for layout stability

### NumericKeypad Visual Specification

```
┌──────────────────────────────────────────────────────┐
│  [  1  ]  [  2  ]  [  3  ]                            │
│  [  4  ]  [  5  ]  [  6  ]                            │
│  [  7  ]  [  8  ]  [  9  ]                            │
│  [  ⌫  ]  [  0  ]  [ Done ]                           │
└──────────────────────────────────────────────────────┘
```

- Position: bottom of screen, ~40% height, full width within `MaxWidthContainer`
- Background: `overlayGlass` (rgba(20, 21, 26, 0.95))
- Key height: 48pt minimum
- Key gap: `spacing.sm` (8pt)
- Key background: `surfaceElevated` (#1C1D24) for digits, `surface` for backspace, `primary` for Done
- Key text: `bodyBold` for digits, `primaryTextOn` for Done
- Key radius: `radius.md` (12pt)
- No backdrop dimming — content behind remains visible and scrollable

### First-Digit-Replace Behavior

When a field gets focus (user taps reps or weight), the existing pre-filled value is displayed. The `isFirstDigit` flag is set to `true`.

- **First digit typed:** Replaces the entire value. Example: field shows "135", user types "1" → value becomes "1" (not "1351"). This matches the common case of replacing a pre-fill.
- **Subsequent digits:** Append. Value is "1", user types "4" → value becomes "14", types "0" → "140".
- **Backspace:** Removes last digit. "140" → "14" → "1" → "0". Minimum is 0.
- **Max value:** 9999 (4 digits). Ignore additional digit input beyond 4 digits.
- **Done on reps field:** Move focus to weight field on same set (keypad stays open, `isFirstDigit` resets to true).
- **Done on weight field:** Dismiss keypad entirely.

### Keypad Focus Flow

```
User taps reps on Set 2
  → keypad opens, focus = { exerciseIndex, setIndex: 1, field: 'reps', isFirstDigit: true }
User types digits on keypad
  → logSet dispatched with new reps value
User taps "Done"
  → focus moves to weight: { field: 'weight', isFirstDigit: true }
User types digits
  → logSet dispatched with new weight value
User taps "Done"
  → keypad dismissed
User taps confirm checkmark
  → confirmSet dispatched, keypad dismissed if open
```

**Tapping a different field (AC #9):**

```
Keypad is open for Set 2 reps
User taps Set 3 weight field
  → focus moves to { setIndex: 2, field: 'weight' }, keypad stays open, isFirstDigit = true
```

**Tapping outside (AC #10):**

```
Keypad is open
User taps anywhere that's not an input field or keypad key
  → keypad dismissed
```

### Previous Story Learnings (Stories 2.1, 2.2, 2.3)

**What worked well:**
- Pure function reducer with zero mocking needed for tests
- Named action dispatchers (`expandExercise()`, `logSet()`, `confirmSet()`) — components never access raw dispatch
- Unicode characters for icons (✓, –) — no external icon library needed
- `requestAnimationFrame` for elapsed timer — no Android drift
- Separating `workoutReducer.ts` from context when files approach 300 lines
- Extracting helpers like `computeSetMeta` and `isExerciseComplete` as standalone pure functions

**What went wrong:**
- **Wrong theme tokens:** `textSecondary` (doesn't exist) → use `subtext`, `borderRadius` → `radius`, `error` → `danger`. Always verify token names against `theme/theme.ts`.
- **Pre-existing TS errors from Epic 1 scope remain.** Do NOT fix: `haptics.notifyWarning` in `ConfirmationModal.tsx`, `SharedValue` in `profile.tsx`, and ~35 files referencing removed tokens. This story must not introduce NEW errors.
- **COMPLETE_WORKOUT** initially missed `active` sets when marking skipped — both `pending` and `active` must be handled. Already fixed in reducer.
- **Test environment requires explicit `import React from 'react'`** for JSX in test files.
- **Component tests needed recursive tree traversal** — function-typed nodes must be resolved to mock objects.

**Current test count:** 90 tests (69 from 2.1/2.2, 21 from 2.3). This story should add tests for SetRow, NumericKeypad, and useKeypadState.

### Theme Token Reference (Verified Against `theme/theme.ts`)

**Colors used in this story:**

| Token                          | Value                     | Usage                                      |
| ------------------------------ | ------------------------- | ------------------------------------------ |
| `theme.colors.surface`         | #14151A                   | Backspace key background                   |
| `theme.colors.surfaceElevated` | #1C1D24                   | Digit key background                       |
| `theme.colors.text`            | #ECEDF0                   | Active state values text                   |
| `theme.colors.subtext`         | #8C8EA0                   | Field labels ("reps", "lbs")               |
| `theme.colors.muted`           | #53556A                   | Pending state text, outlined confirm       |
| `theme.colors.primary`         | #818CF8                   | Active set number, confirm button fill, focused input border, Done key, editing border |
| `theme.colors.primaryTextOn`   | #FFFFFF                   | Confirm button checkmark (active), Done key text |
| `theme.colors.success`         | #34D399                   | Completed set values, completed checkmark  |
| `theme.colors.successLight`    | rgba(52, 211, 153, 0.12)  | Completed row background                   |
| `theme.colors.phases.doneBg`   | #161E1B                   | Completed confirm button background        |
| `theme.colors.border`          | #1F2029                   | Pending confirm outline, input borders     |
| `theme.colors.overlayGlass`    | rgba(20, 21, 26, 0.95)    | Keypad overlay background                  |

**Typography:**

| Token                       | Usage                                      |
| --------------------------- | ------------------------------------------ |
| `theme.typography.bodyBold` | 16pt SemiBold — numeric values, keypad digits, set number |
| `theme.typography.caption`  | 13pt Medium — field labels ("reps", "lbs") |
| `theme.typography.body`     | 16pt Regular — Done key text               |

**Spacing/Radius:**

| Token               | Value | Usage                                  |
| ------------------- | ----- | -------------------------------------- |
| `theme.spacing.xs`  | 4pt   | Minor internal gaps                    |
| `theme.spacing.sm`  | 8pt   | Gaps between row elements, key gaps    |
| `theme.spacing.md`  | 12pt  | Row padding, key padding               |
| `theme.spacing.lg`  | 16pt  | Keypad container padding               |
| `theme.radius.md`   | 12pt  | Key corners, input field corners       |
| `theme.radius.full` | 9999  | Confirm button circle                  |

### Existing Components to Use (Do NOT Rebuild)

- **`WorkoutHeader`** (`components/workout/WorkoutHeader.tsx`) — already wired in v2 route
- **`MaxWidthContainer`** (`components/common/MaxWidthContainer.tsx`) — wrapping content in v2 route
- **`ConfirmationModal`** (`components/common/ConfirmationModal.tsx`) — end-workout flow
- **`WorkoutExecutionProvider`** + `useWorkoutExecution` — mounted in v2 route
- **`ExerciseAccordionItem`** — from Story 2.3, will be modified to render SetRow
- **`SetDot`** — from Story 2.3, no changes needed

### V2 Route Current Structure (255 lines)

The v2 route (`app/programs/[id]/session/[index]-v2.tsx`) currently renders:
1. `WorkoutExecutionProvider` wrapping `WorkoutSessionContent`
2. `WorkoutSessionContent`: `WorkoutHeader`, `ExerciseAccordionItem` list, `ConfirmationModal`
3. Back handler intercepts hardware back / swipe back

This story adds:
- `useKeypadState` hook initialization
- Keypad interaction callbacks passed down through accordion items
- `NumericKeypad` overlay rendered at the bottom (absolute positioned)
- Pressable wrapper or scroll tap handler for outside-tap dismissal

If the v2 route approaches 300 lines, extract the keypad overlay + state into a `KeypadOverlay` wrapper component or keep `useKeypadState` hook lean enough that inline usage is clean.

### File Size Budget

| File                                                    | Estimated Lines | Budget    |
| ------------------------------------------------------- | --------------- | --------- |
| `components/workout/NumericKeypad.tsx`                  | ~80-100         | Under 300 |
| `components/workout/SetRow.tsx`                         | ~130-180        | Under 300 |
| `hooks/workout/useKeypadState.ts`                       | ~80-120         | Under 300 |
| `components/workout/ExerciseAccordionItem.tsx`          | ~220-260        | Under 300 |
| `app/programs/[id]/session/[index]-v2.tsx`              | ~270-300        | Under 300 |
| `__tests__/components/workout/NumericKeypad.test.tsx`   | ~60-100         | Under 300 |
| `__tests__/components/workout/SetRow.test.tsx`          | ~120-180        | Under 300 |
| `__tests__/hooks/workout/useKeypadState.test.ts`        | ~120-180        | Under 300 |

If `ExerciseAccordionItem.tsx` or the v2 route approach 300 lines, extract subcomponents:
- `ExerciseAccordionItem`: extract compact row into `ExerciseCompactRow` subcomponent
- V2 route: extract keypad overlay rendering into standalone component

### Anti-Patterns to Avoid

```typescript
// BAD: Local state in SetRow
const [reps, setReps] = useState(initialReps)

// GOOD: Fully controlled — values from props
<Text>{reps}</Text>  // reps is a prop

// BAD: System keyboard for numeric input
<TextInput keyboardType="numeric" />

// GOOD: Custom NumericKeypad overlay
<NumericKeypad onDigit={handleDigit} onBackspace={handleBackspace} onDone={handleDone} />

// BAD: Hardcoded colors
backgroundColor: '#818CF8'

// GOOD: Theme tokens
backgroundColor: theme.colors.primary

// BAD: External icon library
import { Ionicons } from '@expo/vector-icons'

// GOOD: Unicode characters
<Text>✓</Text>   // checkmark
<Text>✎</Text>   // pencil for editing
<Text>⌫</Text>   // backspace

// BAD: Storing keypad state in the workout reducer
dispatch({ type: 'OPEN_KEYPAD', ... })

// GOOD: UI-only state in a local hook
const { keypadState, openKeypad, dismissKeypad } = useKeypadState()

// BAD: Dispatching logSet on every keypad digit without the replace behavior
const handleDigit = (d: number) => logSet(ei, si, currentReps * 10 + d, weight)

// GOOD: Checking isFirstDigit flag first
const handleDigit = (d: number) => {
  const newValue = isFirstDigit ? d : Math.min(currentValue * 10 + d, 9999)
  logSet(ei, si, ...) // dispatch with correct field updated
}

// BAD: Inline object creation in render
<SetRow style={{ marginBottom: 4 }} />

// GOOD: StyleSheet.create for all styles
const styles = StyleSheet.create({
  rowGap: { marginBottom: theme.spacing.xs }
})
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

- **NumericKeypad tests:** Pure render tests verifying all 12 keys render, test onDigit fires with correct digit number, test onBackspace and onDone fire, test accessibility labels exist.
- **SetRow tests:** Test all 4 states render correct accessibility labels and content cues (set number vs pencil, checkmark content, color-related style props). Test onRepsPress/onWeightPress/onConfirm callbacks fire on press. Test focused state renders focus indicator.
- **useKeypadState tests:** Test the core logic as a hook:
  - `openKeypad` sets visible + focus target + isFirstDigit
  - `handleDigit` on first digit replaces value (calls logSet with just the digit)
  - `handleDigit` on subsequent digits appends (value * 10 + digit)
  - `handleDigit` respects 4-digit max (9999)
  - `handleBackspace` removes last digit, minimum 0
  - `handleDone` on reps → moves focus to weight, keypad stays
  - `handleDone` on weight → dismisses keypad
  - `switchField` changes focus without dismissing
  - `dismissKeypad` sets visible to false
- **Mock `useWorkoutExecution`:** Mock the context hook to provide state and verify `logSet`/`confirmSet` dispatches.
- **Vitest patterns:** `describe`/`it` blocks, `expect()` assertions, no snapshot tests.
- **reanimated mock:** Already handled in vitest.setup.ts from Story 2.3.

### Project Structure Notes

- `components/workout/NumericKeypad.tsx` — NEW file
- `components/workout/SetRow.tsx` — NEW file
- `hooks/workout/useKeypadState.ts` — NEW file
- `components/workout/ExerciseAccordionItem.tsx` — MODIFY (replace placeholders with SetRow)
- `app/programs/[id]/session/[index]-v2.tsx` — MODIFY (add keypad overlay + state)
- `hooks/workout/index.ts` — MODIFY (export useKeypadState)
- `__tests__/components/workout/NumericKeypad.test.tsx` — NEW test file
- `__tests__/components/workout/SetRow.test.tsx` — NEW test file
- `__tests__/hooks/workout/useKeypadState.test.ts` — NEW test file

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — Acceptance criteria, user story, SetRow/NumericKeypad behavior
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — Component props: `{ComponentName}Props`, callbacks: `on{Event}`, SCREAMING_SNAKE_CASE actions
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — `components/workout/` directory, `hooks/workout/` directory, ~300 line limit
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — SetRow fully controlled, no local state, context-owned values
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Accessibility labels format, `isLoading`/`error` naming
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Import types from `types/workout.ts`, dispatch through `useWorkoutExecution()`, haptics through `lib/haptics.ts`
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SetRow] — 4 states, fully controlled, pencil icon for editing, uncommitted edits discarded
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#NumericInput] — default/focused/completed states, pre-filled value replacement
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#NumericKeypad] — 4×3 grid, digits 0-9 + backspace + Done, ~80 lines, no decimal
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Input Patterns] — First digit replaces entire value, backspace deletes last, Done advances focus
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Modal & Overlay Patterns] — NumericKeypad: bottom ~40%, no backdrop dim, dismissed by Done/outside tap
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Touch Target Strategy] — 48pt minimum tappable, 44pt confirm button
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Action Hierarchy] — Only one primary action (confirm checkmark), secondary for everything else
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — No haptics for keypad/typing (haptics come in Story 4.2)
- [Source: _bmad-output/planning-artifacts/prd.md#Set Logging] — FR10 (single-action confirm), FR11 (view pre-filled), FR12 (modify before confirm), FR15 (large-button keypad)
- [Source: _bmad-output/project-context.md#Code Style] — Prettier config, no semicolons, single quotes, no trailing commas
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest, __tests__/ mirror, describe/it blocks
- [Source: _bmad-output/implementation-artifacts/2-3-setdot-compact-indicators-and-exerciseaccordion-structure.md] — Previous story learnings, ExerciseAccordionItem structure, SetDot component, 90 current tests, theme token corrections

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
