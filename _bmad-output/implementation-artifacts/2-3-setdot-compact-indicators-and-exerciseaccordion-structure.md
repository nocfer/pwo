# Story 2.3: SetDot Compact Indicators & ExerciseAccordion Structure

Status: ready-for-dev

## Story

As a user,
I want to see all my exercises with their set completion status at a glance,
So that I always know where I stand in my workout without expanding every exercise.

## Acceptance Criteria

1. **Given** a workout is active with multiple exercises **When** the workout matrix renders **Then** each exercise displays as a compact row showing exercise name, set count meta ("2/4 · 70 lbs"), and a row of `SetDot` indicators
2. `SetDot` renders at 28pt visual size with 48pt touch target (via hitSlop)
3. `SetDot` correctly displays all 4 states: pending (outlined + number), active (primary fill + white number), completed (done-bg + checkmark icon), skipped (dashed border + dash icon)
4. Each state has both color AND shape/icon differentiation for color-blind accessibility (NFR21)
5. Tapping a `SetDot` on any exercise dispatches `EXPAND_EXERCISE` for that exercise and scrolls to it (FR4)
6. Only one exercise is expanded at a time — expanding one collapses the other
7. The `ExerciseAccordion` uses `react-native-reanimated` `withTiming` for smooth height transitions between compact and expanded states
8. Completed exercises show in compact view with green exercise name and all dots checked
9. All interactive elements have accessibility labels ("Set 1, completed", "Bench Press, 2 of 4 sets complete, tap to expand")
10. No file exceeds ~300 lines
11. The existing test suite passes (`npm run test:run`)

## Tasks / Subtasks

- [ ] Task 1: Create `components/workout/SetDot.tsx` — Atomic set indicator (AC: #2, #3, #4, #9)
  - [ ] 1.1 Define `SetDotProps` type: `{ setNumber: number, status: SetStatus, onPress: () => void }`
  - [ ] 1.2 Render 28pt circle with status-based styling; wrap in `Pressable` with `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` for 48pt touch target
  - [ ] 1.3 `pending` state: `surfaceElevated` background, 1px `border` color border, `muted` number text
  - [ ] 1.4 `active` state: `primary` fill background, `primaryTextOn` (white) number text
  - [ ] 1.5 `completed` state: `phases.doneBg` background, `success` checkmark icon (use Unicode ✓ or Text glyph — no external icon library required)
  - [ ] 1.6 `skipped` state: dashed border via `borderStyle: 'dashed'`, `muted` border color, `muted` dash text ("–")
  - [ ] 1.7 Add `accessibilityRole="button"` with `accessibilityLabel` for each state: "Set {n}, pending", "Set {n}, current", "Set {n}, completed", "Set {n}, skipped"
  - [ ] 1.8 Add `accessibilityHint="Double tap to navigate to this set"`

- [ ] Task 2: Create `components/workout/ExerciseAccordionItem.tsx` — Single exercise row (AC: #1, #6, #7, #8, #9)
  - [ ] 2.1 Define `ExerciseAccordionItemProps` type: `{ exercise: ExerciseState, exerciseIndex: number, isExpanded: boolean, onToggle: () => void, onSetDotPress: (setIndex: number) => void, scrollRef?: React.RefObject<ScrollView> }`
  - [ ] 2.2 **Compact view:** Horizontal row with exercise name (`bodyBold` typography, `text` color), set meta (`caption`, `subtext`), and `SetDot` row
  - [ ] 2.3 Set meta format: `"{completed}/{total} · {lastWeight} lbs"` — compute completed count from sets array; use last confirmed weight if available, else first set weight if > 0
  - [ ] 2.4 **Expanded view:** `surfaceElevated` background, exercise name as `h2` typography, placeholder area for SetRows (actual SetRow component comes in Story 2.4)
  - [ ] 2.5 **Completed exercise:** Compact row with `success` color exercise name, all SetDots showing completed state
  - [ ] 2.6 **Compact-active:** Compact row with `primaryLight` background tint to indicate it contains the active set
  - [ ] 2.7 Wrap in `Pressable` for row toggle (tap compact row to expand/collapse)
  - [ ] 2.8 Accessibility: `accessibilityLabel="{exerciseName}, {completed} of {total} sets complete, tap to expand"` for compact; `accessibilityLabel="{exerciseName}, expanded"` for expanded
  - [ ] 2.9 Row styling: `surface` background, `radius.md` corners, `spacing.md` padding, `spacing.xs` (4pt) margin bottom

- [ ] Task 3: Implement accordion animation with `react-native-reanimated` (AC: #7)
  - [ ] 3.1 Use `useSharedValue` for content height, `useDerivedValue` with `withTiming` for animated height
  - [ ] 3.2 Measure expanded content height via `onLayout` callback on inner content `View`
  - [ ] 3.3 `Animated.View` wraps expanded content with `overflow: 'hidden'` and animated height style
  - [ ] 3.4 Animation config: `withTiming(targetHeight, { duration: 250 })` — 250ms matches UX spec transition timing
  - [ ] 3.5 When `isExpanded` goes false → animate height to 0; when true → animate to measured content height
  - [ ] 3.6 Compact content is always rendered (never animated); only the expanded detail area animates

- [ ] Task 4: Wire ExerciseAccordion into `[index]-v2.tsx` route (AC: #5, #6)
  - [ ] 4.1 Replace the placeholder exercise cards with `ExerciseAccordionItem` components
  - [ ] 4.2 Pass `isExpanded={idx === state.expandedExerciseIndex}` from workout state
  - [ ] 4.3 `onToggle` calls `expandExercise(idx)` from context
  - [ ] 4.4 `onSetDotPress` calls `expandExercise(idx)` from context (scroll-to comes with this)
  - [ ] 4.5 Add `ScrollView` ref and `scrollTo` behavior: when exercise expands, call `scrollTo({ y: expandedPosition, animated: true })` after a short delay (100ms) to allow layout to settle
  - [ ] 4.6 Keep v2 route under ~300 lines — extract `WorkoutSessionContent` to its own file if needed

- [ ] Task 5: Write tests (AC: #10, #11)
  - [ ] 5.1 Create `__tests__/components/workout/SetDot.test.tsx` — test all 4 states render correct accessibility labels; test onPress callback fires
  - [ ] 5.2 Create `__tests__/components/workout/ExerciseAccordionItem.test.tsx` — test compact render (exercise name, set meta, dots), test expanded state, test completed exercise styling, test onToggle fires, test accessibility labels
  - [ ] 5.3 Verify no new TypeScript compilation errors (`npm run compile`)
  - [ ] 5.4 Verify all tests pass (`npm run test:run`)
  - [ ] 5.5 Verify all new files pass Prettier (`npm run lint:fix`)

## Dev Notes

### Architecture Constraints

- **Brownfield project:** This story creates new files in `components/workout/`. The only existing file modified is the v2 route `app/programs/[id]/session/[index]-v2.tsx`.
- **Clean-room rebuild:** The new accordion is built inside the v2 route alongside the existing `[index].tsx` which remains untouched. The existing `WorkoutMatrix.tsx` (662 lines) is NOT modified or reused — these are new components.
- **No local state for expansion:** `expandedExerciseIndex` lives in the workout reducer (from Story 2.1). Components read it from context and dispatch `EXPAND_EXERCISE` to change it. Never use `useState` for which exercise is expanded.
- **SetRow placeholder:** The expanded area in this story shows a placeholder for set rows. The actual `SetRow` and `NumericKeypad` components come in Story 2.4. Wire `onSetDotPress` as a no-op for set-level actions beyond exercise expansion.
- **react-native-reanimated 4.2.1:** Already installed. Uses `useSharedValue`, `useDerivedValue`, `withTiming`, `useAnimatedStyle`, `Animated.View`. Import from `react-native-reanimated`.
- **No external icon library:** Use Unicode characters for checkmark (✓) and dash (–) in SetDot. The project does not use a vector icon package for workout components.

### Existing Context & Types (from Stories 2.1 and 2.2)

**WorkoutState fields relevant to this story:**

```typescript
state.exercises: ExerciseState[]       // array of exercises with sets
state.expandedExerciseIndex: number    // which exercise is expanded
state.activeSetIndex: number           // which set is active in expanded exercise
```

**ExerciseState and ExerciseSetState (from `types/workout.ts`):**

```typescript
type ExerciseState = {
  exerciseId: string
  exerciseName: string
  sets: ExerciseSetState[]
}

type ExerciseSetState = {
  reps: number
  weight: number
  status: SetStatus // 'pending' | 'active' | 'completed' | 'skipped' | 'editing'
  confirmedReps?: number
  confirmedWeight?: number
}
```

**Context consumer hook (from `hooks/workout/useWorkoutExecution.ts`):**

```typescript
const { state, expandExercise } = useWorkoutExecution()
expandExercise(2) // dispatches EXPAND_EXERCISE { exerciseIndex: 2 }
```

**Reducer behavior on EXPAND_EXERCISE (from `context/workoutReducer.ts`):**

- Deactivates the current active set in the previously expanded exercise (set to `pending`)
- Activates the first `pending` set in the newly expanded exercise (set to `active`)
- Updates `expandedExerciseIndex` and `activeSetIndex`
- If the target exercise is already expanded, returns state unchanged (no-op)

### SetDot Visual Specification

| State     | Background                  | Border                       | Content                          | Icon/Shape               |
| --------- | --------------------------- | ---------------------------- | -------------------------------- | ------------------------ |
| pending   | `surfaceElevated` (#1C1D24) | 1px solid `border` (#1F2029) | `muted` (#53556A) number         | Outlined circle + number |
| active    | `primary` (#818CF8)         | none                         | `primaryTextOn` (#FFFFFF) number | Filled circle + number   |
| completed | `phases.doneBg` (#161E1B)   | none                         | `success` (#34D399) checkmark    | Filled circle + ✓ icon   |
| skipped   | transparent                 | 1px dashed `muted` (#53556A) | `muted` (#53556A) dash           | Dashed circle + – icon   |

- Visual size: 28pt (width and height)
- Touch target: 48pt via `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}`
- Gap between dots: `spacing.xs` (4pt)
- Font for number/icon: `small` typography (11pt Medium)
- Text centered vertically and horizontally within circle

### ExerciseAccordionItem Layout

**Compact row:**

```
┌──────────────────────────────────────────────────────┐
│  Bench Press    2/4 · 70 lbs   [●][●][○][○]         │
│  (bodyBold)     (caption/sub)   SetDot row           │
└──────────────────────────────────────────────────────┘
```

- Background: `surface` (#14151A)
- Padding: `spacing.md` (12pt)
- Border radius: `radius.md` (12pt)
- Margin bottom: `spacing.xs` (4pt)
- Exercise name and meta on the left, SetDots aligned right

**Expanded area (below compact row, animated):**

```
┌──────────────────────────────────────────────────────┐
│  Bench Press    2/4 · 70 lbs   [●][●][○][○]         │
│──────────────────────────────────────────────────────│
│  ┌──────────────────────────────────────────────────┐│
│  │ [SetRow placeholder for Story 2.4]              ││
│  │ [SetRow placeholder for Story 2.4]              ││
│  │ [SetRow placeholder for Story 2.4]              ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

- Expanded area background: `surfaceElevated` (#1C1D24)
- Expanded area padding: `spacing.lg` (16pt)
- Animated with `react-native-reanimated` `withTiming`, 250ms duration

**Completed exercise (compact):**

```
┌──────────────────────────────────────────────────────┐
│  Bench Press    4/4              [✓][✓][✓][✓]        │
│  (success)      (caption/sub)   all completed        │
└──────────────────────────────────────────────────────┘
```

- Exercise name color: `success` (#34D399)
- All SetDots in completed state

### Accordion Animation Pattern

```typescript
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'

// Inside ExerciseAccordionItem:
const contentHeight = useSharedValue(0)
const animatedHeight = useDerivedValue(() =>
  withTiming(isExpanded ? contentHeight.value : 0, { duration: 250 })
)
const animatedStyle = useAnimatedStyle(() => ({
  height: animatedHeight.value,
  overflow: 'hidden' as const
}))

// Measure content height:
<View onLayout={e => { contentHeight.value = e.nativeEvent.layout.height }}>
  {/* expanded content here */}
</View>

// Apply animated style:
<Animated.View style={animatedStyle}>
  {/* measured content wrapper */}
</Animated.View>
```

**Important:** The `onLayout` content measurement view must render off-screen or with `position: 'absolute'` and `opacity: 0` so it can be measured without being visible when collapsed. A common pattern is to render the content both inside the animated view AND in a hidden measurement view, or to use `useCallback` with `onLayout` to capture the height once and reuse it.

### Scroll-To Behavior

When an exercise expands, scroll so it's visible:

```typescript
const scrollRef = useRef<ScrollView>(null)

const handleToggle = useCallback(
  (exerciseIndex: number) => {
    expandExercise(exerciseIndex)
    // Delay to allow layout animation to start
    setTimeout(() => {
      // scrollRef.current?.scrollTo() or use onLayout + measure
    }, 100)
  },
  [expandExercise]
)
```

Precise scroll position calculation is optional for this story — a basic `scrollToEnd` or rough offset estimate is acceptable. Refined 300ms animated scroll centering comes with Story 2.5 when the full set logging UI is in place.

### Previous Story Learnings (Stories 2.1, 2.2)

**What worked well:**

- Pure function reducer with zero mocking needed for tests
- Extracting `findNextPendingSet` as a separate pure function improved testability
- Separating `workoutReducer.ts` from `WorkoutExecutionContext.tsx` when context exceeded ~300 lines
- Named action dispatchers (e.g., `expandExercise()`) — components never access raw dispatch
- `requestAnimationFrame` for elapsed timer (not `setInterval`) — no Android timer drift
- `useElapsedTimer` hook accepts injectable `now()` for deterministic testing

**What went wrong:**

- **COMPLETE_WORKOUT** initially only marked `pending` sets as `skipped`, missing `active` sets — test caught the bug. Now correctly marks both.
- **v2 route used wrong theme tokens:** `textSecondary` (doesn't exist) → `subtext`, `borderRadius` → `radius`, `error` → `danger`. Always verify token names against `theme/theme.ts`.
- **Pre-existing TS errors from Epic 1 scope remain.** Do NOT fix: `haptics.notifyWarning` in `ConfirmationModal.tsx`, `SharedValue` in `profile.tsx`, and ~35 files referencing removed tokens (`h3`, `captionBold`, `card`, `shadows.md`, `shadows.lg`). This story must not introduce NEW errors.

**Current test count:** 64 tests (40 from 2.1, 24 from 2.2). This story should add tests for SetDot and ExerciseAccordionItem.

### Theme Token Reference (Verified Against `theme/theme.ts`)

**Colors used in this story:**

| Token                          | Value                     | Usage                                        |
| ------------------------------ | ------------------------- | -------------------------------------------- |
| `theme.colors.surface`         | #14151A                   | Compact row background                       |
| `theme.colors.surfaceElevated` | #1C1D24                   | Expanded area background, pending SetDot bg  |
| `theme.colors.text`            | #ECEDF0                   | Exercise name text                           |
| `theme.colors.subtext`         | #8C8EA0                   | Set meta text                                |
| `theme.colors.muted`           | #53556A                   | Pending SetDot number, skipped SetDot border |
| `theme.colors.primary`         | #818CF8                   | Active SetDot fill                           |
| `theme.colors.primaryTextOn`   | #FFFFFF                   | Active SetDot number                         |
| `theme.colors.primaryLight`    | rgba(129, 140, 248, 0.12) | Compact-active row tint                      |
| `theme.colors.success`         | #34D399                   | Completed exercise name, checkmark           |
| `theme.colors.phases.doneBg`   | #161E1B                   | Completed SetDot background                  |
| `theme.colors.border`          | #1F2029                   | Pending SetDot border                        |

**Typography:**

| Token                       | Usage                                     |
| --------------------------- | ----------------------------------------- |
| `theme.typography.bodyBold` | 16pt SemiBold — exercise name in compact  |
| `theme.typography.h2`       | 18pt SemiBold — exercise name in expanded |
| `theme.typography.caption`  | 13pt Medium — set count meta              |
| `theme.typography.small`    | 11pt Medium — SetDot numbers              |

**Spacing/Radius:**

| Token               | Value | Usage                                    |
| ------------------- | ----- | ---------------------------------------- |
| `theme.spacing.xs`  | 4pt   | Gap between SetDots, margin between rows |
| `theme.spacing.sm`  | 8pt   | Internal padding elements                |
| `theme.spacing.md`  | 12pt  | Compact row padding                      |
| `theme.spacing.lg`  | 16pt  | Expanded area padding                    |
| `theme.radius.md`   | 12pt  | Row corner radius                        |
| `theme.radius.full` | 9999  | SetDot circle border radius              |

### Existing Components Already in Use (Do NOT Rebuild)

- **`WorkoutHeader`** (`components/workout/WorkoutHeader.tsx`) — already wired in v2 route
- **`MaxWidthContainer`** (`components/common/MaxWidthContainer.tsx`) — already wrapping content in v2 route
- **`ConfirmationModal`** (`components/common/ConfirmationModal.tsx`) — already wired for end-workout
- **`WorkoutExecutionProvider`** + `useWorkoutExecution` — already mounting in v2 route

### V2 Route Current Structure (250 lines)

The v2 route (`app/programs/[id]/session/[index]-v2.tsx`) currently:

1. Builds initial state from program data in `ProgramSessionV2` (default export)
2. Renders `WorkoutExecutionProvider` wrapping `WorkoutSessionContent`
3. `WorkoutSessionContent` renders: `WorkoutHeader`, placeholder exercise cards, `ConfirmationModal`
4. Back handler intercepts hardware back / swipe back

This story replaces the placeholder exercise cards (lines 122-135) with `ExerciseAccordionItem` components.

### File Size Budget

| File                                                          | Estimated Lines | Budget    |
| ------------------------------------------------------------- | --------------- | --------- |
| `components/workout/SetDot.tsx`                               | ~80-100         | Under 300 |
| `components/workout/ExerciseAccordionItem.tsx`                | ~180-250        | Under 300 |
| `app/programs/[id]/session/[index]-v2.tsx`                    | ~250-280        | Under 300 |
| `__tests__/components/workout/SetDot.test.tsx`                | ~80-120         | Under 300 |
| `__tests__/components/workout/ExerciseAccordionItem.test.tsx` | ~120-180        | Under 300 |

If `ExerciseAccordionItem.tsx` approaches 300 lines, extract compact row rendering into a `ExerciseCompactRow` subcomponent within the same file or a separate file.

### Anti-Patterns to Avoid

```typescript
// BAD: Local state for which exercise is expanded
const [expandedIndex, setExpandedIndex] = useState(0)

// GOOD: Read from context
const { state } = useWorkoutExecution()
state.expandedExerciseIndex

// BAD: LayoutAnimation (deprecated/unreliable for height on Android)
LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)

// GOOD: react-native-reanimated withTiming
const animatedHeight = useDerivedValue(() =>
  withTiming(isExpanded ? contentHeight.value : 0, { duration: 250 })
)

// BAD: Hardcoded colors
backgroundColor: '#14151A'

// GOOD: Theme tokens
backgroundColor: theme.colors.surface

// BAD: External icon library import
import { Ionicons } from '@expo/vector-icons'

// GOOD: Unicode characters for SetDot icons
<Text>✓</Text>  // checkmark for completed
<Text>–</Text>  // dash for skipped

// BAD: setInterval for accordion animation
// GOOD: react-native-reanimated shared values

// BAD: Duplicating reducer logic in component
const isExerciseComplete = exercise.sets.every(s => s.status === 'completed')

// GOOD: Same logic but computed from context state (this specific check is fine as a derived value)
const isComplete = exercise.sets.every(
  s => s.status === 'completed' || s.status === 'skipped'
)

// BAD: Inline object creation in render
<SetDot style={{ marginRight: 4 }} />

// GOOD: StyleSheet.create for all styles
const styles = StyleSheet.create({
  dotGap: { marginRight: theme.spacing.xs }
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
- Import `SetStatus` from `@/types/workout` or `@/types` (re-exported)
- Import animation primitives from `react-native-reanimated`

### Testing Strategy

- **SetDot tests:** Pure render tests verifying each state renders correct content and accessibility labels. Test `onPress` fires. No animation testing needed (reanimated is mocked in RN test environment).
- **ExerciseAccordionItem tests:** Test compact render shows exercise name, set meta, and correct number of SetDots. Test expanded state shows different background. Test completed exercise has success-colored name. Test `onToggle` fires on row press. Test accessibility labels.
- **Mock react-native-reanimated:** The existing `vitest.setup.ts` and `__mocks__/react-native.ts` handle RN mocking. For reanimated, add a simple mock if not already present: `vi.mock('react-native-reanimated', () => ({ ...actual, useSharedValue: vi.fn(v => ({ value: v })), ... }))` — or use the official `jest/mock` from reanimated.
- **Vitest patterns:** `describe`/`it` blocks, `expect()` assertions, no snapshot tests.

### Project Structure Notes

- `components/workout/SetDot.tsx` — NEW file in existing `components/workout/` directory
- `components/workout/ExerciseAccordionItem.tsx` — NEW file in existing `components/workout/` directory
- `app/programs/[id]/session/[index]-v2.tsx` — MODIFY to replace placeholder cards with ExerciseAccordionItem
- `__tests__/components/workout/SetDot.test.tsx` — NEW test file (create `__tests__/components/workout/` directory)
- `__tests__/components/workout/ExerciseAccordionItem.test.tsx` — NEW test file

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — Acceptance criteria, user story, SetDot states, ExerciseAccordion behavior
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — Component props: `{ComponentName}Props`, callbacks: `on{Event}` prefix, SCREAMING_SNAKE_CASE actions
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — `components/workout/` directory, hooks/workout/ directory
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Context-controlled accordion (`expandedExerciseIndex` in reducer state)
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Accessibility labels format, loading/error/empty states
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SetDot] — 28pt visual, 48pt touch, 4 states with shape+icon differentiation
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ExerciseAccordionItem] — compact/expanded/completed/compact-active states, reanimated withTiming height animation
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System Application] — Color as state (green=done, indigo=active, muted=pending, amber=PR), shape as state (checkmark, number, dash)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Touch Target Strategy] — 48pt minimum tappable area, hitSlop for smaller visual elements
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] — Accordion expansion, set dot direct navigation, auto-advance
- [Source: _bmad-output/planning-artifacts/prd.md#Workout Execution] — FR2 (persistent compact overview), FR3 (expand exercise for set logging), FR4 (single-action set navigation), FR5 (non-linear), FR6 (auto-expand next)
- [Source: _bmad-output/project-context.md#Component Naming & Structure] — PascalCase files, named exports, functional components
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest patterns, **tests**/ mirror structure
- [Source: _bmad-output/implementation-artifacts/2-1-workout-state-machine-and-type-contracts.md] — Reducer behavior, type contracts, findNextPendingSet, previous story learnings
- [Source: _bmad-output/implementation-artifacts/2-2-workout-header-and-elapsed-timer.md] — WorkoutHeader component, v2 route structure, theme token corrections

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
