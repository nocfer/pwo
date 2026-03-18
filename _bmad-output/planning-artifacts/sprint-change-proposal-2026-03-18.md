# Sprint Change Proposal — Visual State & Layout Alignment

**Date:** 2026-03-18
**Triggered by:** Story 2.9 (Visual Alignment with Approved Mockup) marked done but acceptance criteria not met
**Change scope:** Minor — contained to styling and render logic in 3 files
**Status:** Approved

---

## Section 1: Issue Summary

The Matrix Accordion UI (Direction A) implements the correct structural pattern but deviates from the approved design spec in both visual state mappings (colors) and layout structure (duplicate content, excessive padding, compact row not hiding on expand). The delivered UI does not match the Direction A phone mockup in `ux-design-directions.html`.

**Evidence:** Side-by-side comparison of approved Direction A mockup (`Screenshot 2026-03-18 at 12.28.10.png`) vs. delivered implementation (`Screenshot 2026-03-18 at 12.31.08.png`), plus code inspection of `SetRow.tsx`, `SetDot.tsx`, `ExerciseAccordionItem.tsx` against the CSS in `ux-design-directions.html`.

**Issue type:** Implementation deviation from approved UX design specification.

---

## Section 2: Impact Analysis

### Epic Impact

- **Epic 2 (Core Workout Logging Experience):** Only affected epic. Story 2.9 needs reopening.
- **Epics 1, 3-7:** No impact.

### Story Impact

- **Story 2.9 (Visual Alignment with Approved Mockup):** Reopened from `done` to `in-progress`. All 8 fixes fall within existing acceptance criteria: _"the visual result matches the Direction A phone mockup in the HTML design directions file."_
- No new stories required.

### Artifact Conflicts

- **PRD:** No conflict. Requirements intact.
- **Architecture:** No conflict. Component structure correct.
- **UX Design Spec:** No conflict. The spec is the source of truth; implementation deviates from it.

### Technical Impact

- Style changes + render conditional in 3 component files
- `onSkip` prop removal is the only functional change (touches SetRow, ExerciseAccordionItem, session screen)
- No state machine logic changes, no data flow changes, no architecture changes

---

## Section 3: Recommended Approach

**Direct Adjustment** — reopen Story 2.9, apply 8 targeted fixes.

### Fix List

| #   | Fix                                                                                    | File(s)                                                  | Type         | Effort        |
| --- | -------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------ | ------------- |
| 1   | Progress bar fill: `primary` → `success`                                               | `ExerciseAccordionItem.tsx`                              | Style        | Trivial       |
| 2   | Completed check button: solid `success` bg + white icon (was `doneBg` bg + green icon) | `SetRow.tsx`                                             | Style        | Low           |
| 3   | Remove "Skip" label + `onSkip` prop entirely                                           | `SetRow.tsx`, `ExerciseAccordionItem.tsx`, `[index].tsx` | Prop removal | Low           |
| 4   | Active row values: render in `text` color (was incorrectly showing `success`)          | `SetRow.tsx`                                             | Style        | Trivial       |
| 5   | Hide compact row when expanded — fix exercise name duplication                         | `ExerciseAccordionItem.tsx`                              | Render logic | Medium        |
| 6   | Remove outer content padding for edge-to-edge exercise rows                            | `[index].tsx`                                            | Style        | Trivial       |
| 7   | Set dots + meta text hidden when expanded (part of fix 5)                              | `ExerciseAccordionItem.tsx`                              | Render logic | Included in 5 |
| 8   | Fix expanded content padding — remove double indentation                               | `ExerciseAccordionItem.tsx`                              | Style        | Low           |

### Design Spec Reference (from `ux-design-directions.html` CSS)

```css
/* Correct check button states */
.check-btn.done {
  background: var(--success);
  color: white;
}
.check-btn.ready {
  background: var(--primary);
  color: white;
}
.check-btn.empty {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--muted);
}

/* Correct completed row input styling */
.set-row.completed .set-input {
  background: var(--done-bg);
  border-color: transparent;
  color: var(--success);
}

/* Correct progress bar color */
.progress-row .fill {
  background: var(--success);
}
```

### Skip Removal Decision

Per-set skip (`onSkip` prop on SetRow) is removed entirely. Skip semantics are handled by:

- Navigating away from an exercise implicitly skips unfinished sets
- FR7: "End Workout" marks all remaining incomplete sets as skipped

### Risk Assessment

- **Risk:** Low
- **Effort:** Low (half-day dev work)
- **Timeline impact:** None
- **Test impact:** Behavioral tests should pass. Visual/style tests may need updates. Skip-related tests need removal.

---

## Section 4: Detailed Change Proposals

### Fix 1: Progress Bar Color

**File:** `components/workout/ExerciseAccordionItem.tsx`

OLD: `progressFill` uses `backgroundColor: theme.colors.primary`
NEW: `progressFill` uses `backgroundColor: theme.colors.success`

### Fix 2: Completed Check Button

**File:** `components/workout/SetRow.tsx`

OLD:

- `confirmCompleted`: `backgroundColor: theme.colors.phases.doneBg`
- `confirmIconCompleted`: `color: theme.colors.success`

NEW:

- `confirmCompleted`: `backgroundColor: theme.colors.success`
- `confirmIconCompleted`: `color: theme.colors.primaryTextOn` (white)

### Fix 3: Remove Skip

**Files:** `SetRow.tsx`, `ExerciseAccordionItem.tsx`, `[index].tsx`

- Remove `onSkip` prop from `SetRowProps`
- Remove skip label rendering (lines 96-105 in SetRow.tsx)
- Remove `skipText` style
- Remove `onSetSkip` prop from `ExerciseAccordionItemProps` and `ExpandedContentProps`
- Remove `onSetSkip` pass-through in ExerciseAccordionItem
- Remove `handleSetSkip` callback in session screen
- Remove `onSetSkip` prop from ExerciseAccordionItem usage in session screen

### Fix 4: Active Row Value Colors

**File:** `components/workout/SetRow.tsx`

OLD: Active row values may show in `success` color
NEW: Active/editing row values render in `theme.colors.text` (white). Only `completed` status uses `theme.colors.success`.

Verify the `valueColor` logic (lines 60-64) correctly maps:

- completed → `success`
- pending/skipped → `muted`
- active/editing → `text`

### Fix 5 + 7: Hide Compact Row When Expanded

**File:** `components/workout/ExerciseAccordionItem.tsx`

OLD: `compactContent` (name + meta + dots) always renders regardless of expansion state
NEW: When `isExpanded`, hide `compactContent` entirely. Only `ExpandedContent` is visible.

The `ExpandedContent` already renders the exercise name as `expandedTitle`. When collapsed, only the compact row (name + meta + dots) is visible.

### Fix 6: Remove Outer Content Padding

**File:** `app/programs/[id]/session/[index].tsx`

OLD: `content: { padding: theme.spacing.lg }`
NEW: Remove horizontal padding. Keep minimal vertical padding if needed for header/bottom clearance. Exercise rows should render edge-to-edge.

### Fix 8: Expanded Content Padding

**File:** `components/workout/ExerciseAccordionItem.tsx`

OLD: Row has `padding: theme.spacing.md` + expanded content has `padding: theme.spacing.lg` (double indentation)
NEW: When expanded, row padding should not stack with expanded content padding. Expanded content uses ~16px horizontal padding internally. The `surfaceElevated` background spans full row width.

---

## Section 5: Implementation Handoff

- **Scope classification:** Minor
- **Handoff to:** Development team (dev agent)
- **Files to modify:**
  - `components/workout/SetRow.tsx` (fixes 2, 3, 4)
  - `components/workout/ExerciseAccordionItem.tsx` (fixes 1, 3, 5, 7, 8)
  - `app/programs/[id]/session/[index].tsx` (fixes 3, 6)
- **Tests to update:**
  - `__tests__/components/workout/SetRow.test.tsx` — remove skip-related tests, update check button color assertions
  - `__tests__/components/workout/SetDot.test.tsx` — no changes expected
  - `__tests__/components/workout/ExerciseAccordionItem.test.tsx` — update for compact row hide behavior
- **Success criteria:**
  1. Rendered workout screen matches Direction A mockup in all set row states (completed, active, pending)
  2. No duplicate exercise name text when expanded
  3. Edge-to-edge exercise rows with no outer padding gaps
  4. Progress bar is green
  5. Completed check buttons are solid green with white icon
  6. No "Skip" label anywhere on set rows
  7. All existing behavioral tests pass (with skip tests removed)
  8. Visual comparison against `Screenshot 2026-03-18 at 12.28.10.png` confirms alignment
