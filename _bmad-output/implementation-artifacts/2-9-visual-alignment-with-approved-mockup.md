# Story 2.9: Visual Alignment with Approved Mockup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the workout execution screen to match the approved dark-first design mockup,
So that the interface feels cohesive, flat, and minimalist as originally designed.

## Acceptance Criteria

1. **Given** the approved HTML mockup (`_bmad-output/planning-artifacts/ux-design-directions.html`, Direction A: Matrix Accordion) as visual baseline **When** the workout components are rendered **Then** `SetDot` uses `borderRadius: theme.radius.xs` (4px, rounded square) instead of `theme.radius.full`
2. **Given** the SetRow component renders **When** the confirm button displays **Then** it uses `borderRadius: theme.radius.sm` (8px, rounded rectangle) instead of `theme.radius.full`
3. **Given** the ExerciseAccordionItem renders in compact mode **When** multiple exercises are listed **Then** compact rows render full-width with `borderBottom` dividers and no `borderRadius` or `marginBottom` gaps
4. **Given** an exercise is expanded **When** the expanded area renders **Then** it fills the full row width with `surfaceElevated` background (not a nested card with border-radius or margin)
5. **Given** an exercise is expanded **When** the exercise title displays **Then** the expanded exercise title displays in `theme.colors.primary` (indigo) color
6. **Given** the SetRow component renders **When** input fields display **Then** input fields use `borderRadius: theme.radius.sm` (8px)
7. **Given** an exercise is expanded **When** the expanded area renders **Then** a thin progress bar appears at the bottom of the expanded exercise area showing set completion fraction
8. All existing behavioral tests continue to pass (`npm run test:run`)
9. The visual result matches the Direction A phone mockup in the HTML design directions file

## Tasks / Subtasks

- [x] Task 1: Update SetDot to rounded square (AC: #1)
  - [x] 1.1 Change `borderRadius` in `styles.dot` from `theme.radius.full` to `theme.radius.xs`
  - [x] 1.2 Visually verify all 5 states (pending, active, completed, skipped, editing)

- [x] Task 2: Update SetRow confirm button and input fields (AC: #2, #6)
  - [x] 2.1 Change `borderRadius` in `styles.confirmButton` from `theme.radius.full` to `theme.radius.sm`
  - [x] 2.2 Change `borderRadius` in `styles.inputField` from `theme.radius.md` to `theme.radius.sm`
  - [x] 2.3 Verify confirm button renders correctly in all 4 states (pending, active, completed, editing)

- [x] Task 3: Update ExerciseAccordionItem compact rows to full-width divider style (AC: #3)
  - [x] 3.1 Remove `borderRadius: theme.radius.md` from `styles.row`
  - [x] 3.2 Remove `marginBottom: theme.spacing.xs` from `styles.row`
  - [x] 3.3 Add `borderBottomWidth: 1` and `borderBottomColor: theme.colors.border` to `styles.row`
  - [x] 3.4 Ensure last row does not have a bottom border (or it is acceptable if the container handles the edge)

- [x] Task 4: Update ExerciseAccordionItem expanded area to full-width (AC: #4, #5)
  - [x] 4.1 Remove `borderRadius: theme.radius.md` from `styles.expandedContent`
  - [x] 4.2 Remove `marginTop: theme.spacing.sm` from `styles.expandedContent`
  - [x] 4.3 Change `expandedTitle` color from `theme.colors.text` to `theme.colors.primary`

- [x] Task 5: Add progress bar to expanded exercise area (AC: #7)
  - [x] 5.1 Add a thin progress bar View at the bottom of `ExpandedContent` (4px height, full width)
  - [x] 5.2 Track: `theme.colors.border` background, fill: `theme.colors.primary`, `borderRadius: theme.radius.xs`
  - [x] 5.3 Calculate fill width as `(completedSets / totalSets) * 100%`
  - [x] 5.4 Pass `exercise.sets` completion data to compute progress fraction

- [x] Task 6: Run tests and verify (AC: #8)
  - [x] 6.1 Run `npm run test:run` — all existing 208 tests must pass
  - [x] 6.2 Run `npm run compile` — no new TypeScript errors
  - [x] 6.3 Run `npm run lint:fix` — Prettier clean

## Dev Notes

### Architecture Constraints

- **Brownfield project:** Modifying 3 existing component files. No new files needed (unless progress bar warrants extraction, which it should not at ~10 lines).
- **Clean-room rebuild:** All changes stay within the v2 route component tree. Existing `[index].tsx` remains untouched.
- **Style-only changes:** No behavioral changes, no state changes, no new props (except passing set data for progress calculation). The reducer, context, and hooks are untouched.
- **No file exceeds ~300 lines:** `SetDot.tsx` (100 lines), `SetRow.tsx` (237 lines), `ExerciseAccordionItem.tsx` (258 lines). None approach the limit after these changes.
- **React Context API only.** No Redux/Zustand.

### What's Already Implemented (Stories 2.1–2.8)

**Current `SetDot.tsx` (100 lines):**

- 28×28 size, `borderRadius: theme.radius.full` (circle — **WRONG, needs `theme.radius.xs`**)
- 5 states: pending (surfaceElevated + border), active (primary fill), completed (doneBg + ✓), skipped (dashed border + –), editing (primary fill)
- hitSlop: `{ top: 10, bottom: 10, left: 10, right: 10 }` for 48pt touch target
- Accessibility labels per state

**Current `SetRow.tsx` (237 lines):**

- Confirm button: 44×44, `borderRadius: theme.radius.full` (**WRONG, needs `theme.radius.sm`**)
- Input fields: `borderRadius: theme.radius.md` (12px — **WRONG, needs `theme.radius.sm`** 8px)
- Row states: pending, active, completed (successLight bg + radius.md), editing (dashed primary border + radius.md), skipped (opacity 0.5)
- Fully controlled, no local state

**Current `ExerciseAccordionItem.tsx` (258 lines):**

- `styles.row`: `borderRadius: theme.radius.md` (**WRONG, needs 0 + borderBottom dividers**)
- `styles.row`: `marginBottom: theme.spacing.xs` (**WRONG, needs 0 — no gaps**)
- `styles.expandedContent`: `borderRadius: theme.radius.md` (**WRONG, needs 0**)
- `styles.expandedContent`: `marginTop: theme.spacing.sm` (**WRONG, needs 0**)
- `styles.expandedTitle`: `color: theme.colors.text` (**WRONG, needs `theme.colors.primary`**)
- No progress bar in expanded area (**MISSING**)
- Uses `react-native-reanimated` `withTiming` for expand/collapse animation
- `ExpandedContent` is extracted as internal function component
- `measureContainer` uses absolute positioning + opacity 0 for height measurement

### Exact Style Changes Required

| Component                                        | Property            | Current Value              | Target Value           |
| ------------------------------------------------ | ------------------- | -------------------------- | ---------------------- |
| `SetDot` `styles.dot`                            | `borderRadius`      | `theme.radius.full` (9999) | `theme.radius.xs` (4)  |
| `SetRow` `styles.confirmButton`                  | `borderRadius`      | `theme.radius.full` (9999) | `theme.radius.sm` (8)  |
| `SetRow` `styles.inputField`                     | `borderRadius`      | `theme.radius.md` (12)     | `theme.radius.sm` (8)  |
| `ExerciseAccordionItem` `styles.row`             | `borderRadius`      | `theme.radius.md` (12)     | remove entirely        |
| `ExerciseAccordionItem` `styles.row`             | `marginBottom`      | `theme.spacing.xs` (4)     | remove entirely        |
| `ExerciseAccordionItem` `styles.row`             | `borderBottomWidth` | (none)                     | `1`                    |
| `ExerciseAccordionItem` `styles.row`             | `borderBottomColor` | (none)                     | `theme.colors.border`  |
| `ExerciseAccordionItem` `styles.expandedContent` | `borderRadius`      | `theme.radius.md` (12)     | remove entirely        |
| `ExerciseAccordionItem` `styles.expandedContent` | `marginTop`         | `theme.spacing.sm` (8)     | remove entirely        |
| `ExerciseAccordionItem` `styles.expandedTitle`   | `color`             | `theme.colors.text`        | `theme.colors.primary` |

### Progress Bar Implementation

Add inside `ExpandedContent`, after the SetRow map, before the closing `</View>`:

```typescript
const completedCount = exercise.sets.filter(
  s => s.status === 'completed' || s.status === 'skipped'
).length
const fraction = exercise.sets.length > 0
  ? completedCount / exercise.sets.length
  : 0

// After SetRow map:
<View style={styles.progressTrack}>
  <View style={[styles.progressFill, { width: `${fraction * 100}%` }]} />
</View>
```

Style definitions:

```typescript
progressTrack: {
  height: 4,
  backgroundColor: theme.colors.border,
  borderRadius: theme.radius.xs,
  marginTop: theme.spacing.md,
  overflow: 'hidden'
},
progressFill: {
  height: '100%',
  backgroundColor: theme.colors.primary,
  borderRadius: theme.radius.xs
}
```

### Visual Reference

The HTML mockup file is the pixel-level visual authority: `_bmad-output/planning-artifacts/ux-design-directions.html` (Direction A: Matrix Accordion). Key rules from UX spec Visual Baseline section:

- **SetDot:** `radius.xs` (4px) rounded square, not circular
- **Confirm button:** `radius.sm` (8px) rounded rectangle, not circular
- **Exercise rows:** Full-width with border dividers, no card-style border-radius or gaps
- **Expanded exercise area:** Full-width elevation (`surfaceElevated` fills entire row width)
- **Expanded exercise title:** `primary` color (indigo), not `text` color (white)
- **Input fields:** `radius.sm` (8px)
- **Elevation via surface color steps** (not shadows): background → surface → surfaceElevated

### Theme Token Reference

```
radius.xs  = 4    ← SetDot
radius.sm  = 8    ← confirm button, input fields
radius.md  = 12   ← (no longer used in these components after this story)
radius.full = 9999 ← (no longer used in workout components after this story)

colors.border = '#1F2029'      ← dividers between compact rows, progress track
colors.primary = '#818CF8'     ← expanded title, progress fill
colors.surfaceElevated = '#1C1D24' ← expanded content background
colors.surface = '#14151A'     ← compact row background
```

### Previous Story Learnings (Stories 2.1–2.8)

**What worked well:**

- Pure style changes with no behavioral impact are the safest — tests pass untouched
- Theme token references (`theme.radius.*`, `theme.colors.*`) are the only way to set visual properties
- The `measureContainer` pattern for reanimated height animation is stable — don't touch it

**What went wrong in previous stories:**

- **Wrong theme tokens:** `textSecondary` (doesn't exist) → use `subtext`, `borderRadius` → `radius`, `error` → `danger`. Always verify token names against `theme/theme.ts`.
- **Pre-existing TS errors from Epic 1 scope remain.** Do NOT fix: `haptics.notifyWarning` in `ConfirmationModal.tsx`, `SharedValue` in `profile.tsx`, and ~35 files referencing removed tokens. This story must not introduce NEW errors.
- **Test environment requires explicit `import React from 'react'`** for JSX in test files.

**Current test count:** 208 tests (from stories 2.1-2.8). This story adds zero new tests — all changes are style-only and existing tests cover rendering and behavior.

### Git Intelligence (Recent Commits)

```
993b4eb feat: implement useWebKeyboardShortcuts hook (story 2.8)
1624fd6 feat: add prefill functionality (story 2.7)
cc08299 feat: implement NumericKeypad and SetRow components (story 2.4)
d46f0e5 test: add unit tests for ExerciseAccordionItem and SetDot (story 2.3)
00998fd test: add comprehensive unit tests for workoutReducer (story 2.1)
```

**Patterns observed:**

- Style changes in component files never required test changes in previous stories
- All component files use `StyleSheet.create()` with theme token imports
- The existing test suite tests behavior (onPress callbacks, rendering, accessibility) not pixel values — style changes won't break them

### Anti-Patterns to Avoid

```typescript
// BAD: Hardcoded px values
borderRadius: 4
// GOOD: Theme tokens
borderRadius: theme.radius.xs

// BAD: Inline styles for permanent visual properties
style={{ borderRadius: 8 }}
// GOOD: StyleSheet.create
styles.confirmButton  // with borderRadius: theme.radius.sm

// BAD: Adding a progress bar component to components/workout/ (overkill for 10 lines)
// GOOD: Inline View inside ExpandedContent with StyleSheet styles

// BAD: Changing the row's border pattern for the last item with array index check
// GOOD: Simple borderBottom on all rows — the container edge naturally hides the last border

// BAD: Changing the Animated.View or measureContainer pattern
// GOOD: Only touch style values, never animation mechanics
```

### Edge Cases

| Scenario                                              | Expected Behavior                                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| SetDot with rounded square at 28×28 with xs radius    | 4px radius on 28px square is clearly a rounded square, not a circle                                                |
| Confirm button at 44×44 with sm radius                | 8px radius on 44px button is a pill-adjacent rounded rectangle                                                     |
| Last compact row in the list                          | Has borderBottom; container/scroll edge absorbs it visually                                                        |
| Expanded content no longer a nested card              | `surfaceElevated` fills row width, no visual gap from parent row                                                   |
| Progress bar at 0% (no sets completed)                | Only border-colored track visible, no fill                                                                         |
| Progress bar at 100% (all sets done)                  | Full primary-colored fill                                                                                          |
| measureContainer hidden content with new progress bar | progress bar renders in measurement container too (ExpandedContent is reused), height calculation remains accurate |

### File Size Budget

| File                                           | Current Lines | Estimated After | Budget    |
| ---------------------------------------------- | ------------- | --------------- | --------- |
| `components/workout/SetDot.tsx`                | 100           | 100             | Under 300 |
| `components/workout/SetRow.tsx`                | 237           | 237             | Under 300 |
| `components/workout/ExerciseAccordionItem.tsx` | 258           | ~275            | Under 300 |

The only file that grows is `ExerciseAccordionItem.tsx` (+~17 lines for progress bar View + styles). Stays well under 300.

### Prettier Rules (Project Enforced)

- No semicolons (`semi: false`)
- Single quotes (`singleQuote: true`)
- No trailing commas (`trailingComma: none`)
- Avoid arrow parens when possible (`arrowParens: avoid`)

### Import Conventions

- Path alias: `@/` for all imports (e.g., `import { theme } from '@/theme/theme'`)
- Named exports for components and hooks
- `Platform` imported from `react-native`

### Project Structure Notes

- `components/workout/SetDot.tsx` — MODIFY (borderRadius change)
- `components/workout/SetRow.tsx` — MODIFY (borderRadius changes for confirm button and inputs)
- `components/workout/ExerciseAccordionItem.tsx` — MODIFY (row styling, expanded content styling, title color, add progress bar)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.9] — Acceptance criteria, user story, visual alignment requirements
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Baseline] — Direction A mockup rules: SetDot radius.xs, confirm radius.sm, full-width rows with dividers, surfaceElevated expansion, primary-colored title
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision] — Direction A: Matrix Accordion selected, implementation approach
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Border Radius] — xs=4, sm=8, md=12, lg=16, xl=20, full=9999
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Elevation Strategy] — surface color steps: background → surface → surfaceElevated
- [Source: _bmad-output/planning-artifacts/ux-design-directions.html] — HTML mockup visual reference (Direction A phone mockup)
- [Source: _bmad-output/project-context.md#Code Style] — Prettier config, no semicolons, single quotes
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest, **tests**/ mirror structure
- [Source: _bmad-output/implementation-artifacts/2-8-web-keyboard-shortcuts.md] — Previous story learnings, current test count (208), file sizes, wrong token names to avoid
- [Source: theme/theme.ts#radius] — xs=4, sm=8, md=12, lg=16, xl=20, full=9999
- [Source: theme/theme.ts#colors] — primary=#818CF8, border=#1F2029, surfaceElevated=#1C1D24, surface=#14151A

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

No debug issues encountered. All changes were pure style modifications — no behavioral changes, no state changes, no new props needed (except set completion data for progress bar which was already available in ExpandedContent via `exercise.sets`).

### Completion Notes List

- **Task 1:** Changed SetDot `borderRadius` from `theme.radius.full` (circle) to `theme.radius.xs` (4px rounded square). All 5 states (pending, active, completed, skipped, editing) use the shared `styles.dot` base style, so one change covers all states.
- **Task 2:** Changed confirm button `borderRadius` from `theme.radius.full` to `theme.radius.sm` (8px rounded rectangle). Changed input field `borderRadius` from `theme.radius.md` (12px) to `theme.radius.sm` (8px). All states render through the same base styles.
- **Task 3:** Removed `borderRadius: theme.radius.md` and `marginBottom: theme.spacing.xs` from compact row style. Added `borderBottomWidth: 1` and `borderBottomColor: theme.colors.border` for full-width divider style. Last row border is absorbed by container edge.
- **Task 4:** Removed `borderRadius: theme.radius.md` and `marginTop: theme.spacing.sm` from expanded content. Changed expanded title color from `theme.colors.text` to `theme.colors.primary` (indigo).
- **Task 5:** Added progress bar inside `ExpandedContent` after the SetRow map. 4px height track with `theme.colors.border` background and `theme.colors.primary` fill. Width calculated as `(completedSets / totalSets) * 100%`. Progress bar also renders in the hidden `measureContainer`, keeping reanimated height measurement accurate.
- **Task 6:** All 208 tests pass. No new TypeScript errors (2 pre-existing errors from Epic 1 scope remain). Prettier clean.
- **Zero new tests added** — all changes are style-only and existing behavioral tests cover rendering and interactions.

### File List

- `components/workout/SetDot.tsx` — Modified (borderRadius: full → xs)
- `components/workout/SetRow.tsx` — Modified (confirmButton borderRadius: full → sm, inputField borderRadius: md → sm)
- `components/workout/ExerciseAccordionItem.tsx` — Modified (row: removed borderRadius/marginBottom, added borderBottom dividers; expandedContent: removed borderRadius/marginTop; expandedTitle: color → primary; added progressTrack/progressFill styles and progress bar View; review fixes: accessibility on progress bar, extracted getCompletedCount helper, Math.round on progress width)
- `__tests__/components/workout/ExerciseAccordionItem.test.tsx` — Modified (added 3 progress bar tests: 0%, 100%, 50% accessibility value; updated View mock to pass through all props)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Modified (2-9 status: ready-for-dev → done)

## Senior Developer Review (AI)

**Reviewer:** Nocfer on 2026-03-17
**Outcome:** Approved with fixes applied

### Review Findings (5 total: 0 High, 1 Medium, 4 Low)

**MEDIUM — Fixed:**
1. **Missing accessibility on progress bar** — Added `accessibilityRole="progressbar"`, `accessibilityValue`, and `accessibilityLabel` to the progress track View.

**LOW — Fixed:**
2. **DRY violation: completed set count calculated 3 times** — Extracted `getCompletedCount(exercise)` helper; replaced all 3 inline filter expressions.
3. **Float precision in progress width** — Changed `${fraction * 100}%` to `${Math.round(...)}%` via `progressPercent` variable.
4. **No test coverage for progress bar** — Added 3 tests (0%, 50%, 100%) verifying progress bar renders with correct accessibility values.

**LOW — Not Fixed (by design):**
5. **No animation on progress bar fill** — Width changes abruptly vs. animated expand/collapse. Not required by ACs; adding reanimated to ExpandedContent would increase complexity for marginal polish.

### Verification

- All 9 ACs validated against git diffs and source code
- All 6 tasks marked [x] confirmed done with file:line evidence
- 211 tests pass (208 original + 3 new)
- TypeScript: no new errors (2 pre-existing from Epic 1 remain)
- Prettier: clean

## Change Log

- **2026-03-17:** Visual alignment with approved Direction A mockup — SetDot rounded square (radius.xs), confirm button and inputs rounded rectangle (radius.sm), full-width compact rows with border dividers, flat expanded area with primary-colored title, set completion progress bar in expanded exercise area. All 208 tests pass, zero regressions.
- **2026-03-17 (review):** Code review fixes — progress bar accessibility attributes, extracted getCompletedCount helper (DRY), Math.round on progress width, 3 new progress bar tests. 211 tests pass.
