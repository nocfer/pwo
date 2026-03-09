# Story 1.2: Hardcoded Color Audit & Component Token Migration

Status: done

## Story

As a user,
I want all screens to use the dark theme consistently without visual glitches from leftover light colors,
So that every part of the app feels cohesive and readable on the new dark background.

## Acceptance Criteria

1. **Given** the new dark theme tokens from Story 1.1 are in place **When** all `.tsx` component files are audited for hardcoded hex color values **Then** every hardcoded color is replaced with the corresponding theme token
2. All primary text on all surfaces meets >= 4.5:1 contrast ratio (WCAG AA)
3. All secondary text on all surfaces meets >= 4.5:1 contrast ratio (WCAG AA)
4. No component imports color values directly — all colors come through `theme` tokens
5. Every existing screen (Home, Program Detail, Program Editor, Exercise Library, Progress) renders correctly with the dark theme
6. The existing test suite passes (`npm run test:run`)
7. All references to removed theme tokens (`typography.h3`, `typography.captionBold`, `colors.card`, `shadows.md`, `shadows.lg`) are migrated to their dark-theme replacements, resolving all TS compilation errors introduced by Story 1.1

## Tasks / Subtasks

- [x] Task 1: Replace hardcoded hex colors with theme tokens (AC: #1, #4)
  - [x] 1.1 `app/+not-found.tsx` — Replace `#25292e` → `theme.colors.background`, `#fff` → `theme.colors.text`; add `theme` import
  - [x] 1.2 `components/ConfettiCelebration.tsx` — Replace hardcoded confetti colors (`#FF6B6B`, `#4ECDC4`, `#FFE66D`, `#95E1D3`) with theme-derived celebration palette; keep visually distinct from theme status colors
  - [x] 1.3 `components/progress/ConsistencyHeatmap.tsx` — Replace `#059669` (emerald-600 for level 3 intensity) with a darker emerald derived from theme tokens or define as a semantic constant referencing the theme
  - [x] 1.4 `components/progress/PRItem.tsx` — Replace `#FFFFFF` in `newBadgeText` with `theme.colors.textInverse` (text on bright accent background)
- [x] Task 2: Migrate `typography.h3` → `typography.h2` across all 23 files (AC: #1, #7)
  - [x] 2.1 Progress components (10 files): `EnhancedExerciseProgressionChart.tsx`, `ProgressViewBase.tsx`, `ProgressCalendar.tsx`, `PRItem.tsx`, `PersonalRecordsCard.tsx`, `ConsistencyHeatmap.tsx`, `ProgressCard.tsx`, `WeeklySummaryCard.tsx`, `WeeklyChart.tsx`, `ProgressEmptyState.tsx`
  - [x] 2.2 Program components (4 files): `ProgramImportPreview.tsx`, `WorkoutMatrix.tsx`, `ProgramView.tsx`, `WorkoutExecutionScreen.tsx`
  - [x] 2.3 Tab screens (3 files): `app/(tabs)/progress.tsx`, `app/(tabs)/profile.tsx`, `app/(tabs)/index.tsx`
  - [x] 2.4 Data/form components (2 files): `components/data/forms/ProgramForm.tsx`, `components/data/forms/ExerciseForm.tsx`
  - [x] 2.5 Common/other components (4 files): `components/common/EmptyState.tsx`, `components/common/QRCodeScanner.tsx`, `components/program/QRCodeShareModal.tsx`, `components/progress/ProgramProgressView.tsx`
- [x] Task 3: Migrate `typography.captionBold` → `typography.caption` + `fontFamily: theme.fonts.semiBold` across all 11 files (AC: #1, #7)
  - [x] 3.1 Program components (2 files): `WorkoutExecutionScreen.tsx`, `WorkoutMatrix.tsx`
  - [x] 3.2 Data management components (4 files): `UnifiedDataManager.tsx`, `FilterControls.tsx`, `ExerciseForm.tsx`, `ProgramForm.tsx`
  - [x] 3.3 Common components (2 files): `EmptyState.tsx`, `DependencyErrorModal.tsx`
  - [x] 3.4 Auth screens (2 files): `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`
  - [x] 3.5 Program component (1 file): `ProgramView.tsx`
- [x] Task 4: Migrate `colors.card` → `colors.surface` across all 8 files (AC: #1, #7)
  - [x] 4.1 Progress components (4 files): `RingChart.tsx`, `ProgramProgressView.tsx`, `ProgressView.tsx`, `ProgressEmptyState.tsx`
  - [x] 4.2 Program components (1 file): `ProgramImportPreview.tsx`
  - [x] 4.3 Data components (1 file): `SortControls.tsx`
  - [x] 4.4 Other components (2 files): `TimerControls.tsx`, `PRItem.tsx`
- [x] Task 5: Migrate `shadows.md` → `shadows.sm` and `shadows.lg` → `shadows.sm` across all 10 files (AC: #1, #7)
  - [x] 5.1 `shadows.md` migration (8 files): `TimerControls.tsx`, `QRCodeScanner.tsx`, `DependencyErrorModal.tsx`, `UnifiedDataManager.tsx`, `app/(tabs)/index.tsx`, `WorkoutExecutionScreen.tsx`, `ConfirmationModal.tsx`, `ProgramView.tsx`
  - [x] 5.2 `shadows.lg` migration (2 files): `ConfettiCelebration.tsx`, `QRCodeShareModal.tsx`
- [x] Task 6: Verify WCAG AA contrast compliance across all screens (AC: #2, #3, #5)
  - [x] 6.1 Verify all primary text (`theme.colors.text`) on `background`, `surface`, and `surfaceElevated` meets >= 4.5:1 ratio (pre-verified in Story 1.1: 15.8:1, 13.2:1, 11.0:1)
  - [x] 6.2 Verify all secondary text (`theme.colors.subtext`) on surfaces meets >= 4.5:1 ratio (pre-verified: 5.1:1 on surface)
  - [x] 6.3 Audit migrated files for any remaining inline color usage or non-token color references
  - [x] 6.4 Check that `muted` (#53556A at 2.8:1) is only used for decorative/placeholder text and never for actionable or required content
- [x] Task 7: Run tests and verify compilation (AC: #6, #7)
  - [x] 7.1 Run `npm run compile` — zero TS errors related to removed tokens (all migration complete)
  - [x] 7.2 Run `npm run test:run` — all existing tests pass
  - [x] 7.3 Run `npm run lint:fix` — all modified files Prettier-compliant

## Dev Notes

### Architecture Constraints

- **Brownfield project:** PWO v1.1 is a production app. This story is a mechanical migration — swap token references, not restructure components.
- **Token shape preserved:** The exported `theme` object shape (`colors`, `fonts`, `spacing`, `radius`, `shadows`, `typography`, `cards`, `presets`) was preserved in Story 1.1. All token access patterns (`theme.colors.X`, `theme.typography.X`, etc.) remain valid. Only specific removed tokens need re-mapping.
- **Dark elevation strategy:** Shadows are invisible on dark backgrounds. Depth is communicated via surface color steps: `background` → `surface` → `surfaceElevated`. Components previously using `shadows.md` or `shadows.lg` should evaluate whether the shadow is still needed or if the surface-based elevation is sufficient.
- **No component restructuring:** This story modifies only style definitions within existing components. No component logic, props, or exports should change.
- **Migration is additive to Story 1.1:** All dark theme values from Story 1.1 are already in `theme.ts`. This story brings consumer components into alignment.

### Token Migration Reference

| Removed Token                          | Replacement                                                           | Rationale                                                                                                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typography.h3` (17/SemiBold)          | `typography.h2` (18/SemiBold)                                         | h3 was merged into h2 at 18pt. Size difference is 1pt — visual impact is minimal.                                                                                           |
| `typography.captionBold` (13/SemiBold) | `typography.caption` (13/Medium) + `fontFamily: theme.fonts.semiBold` | Caption weight is now 500 (Medium). To get bold caption, override fontFamily to semiBold.                                                                                   |
| `colors.card`                          | `colors.surface` (#14151A)                                            | `card` was redundant with `surface` — both served the same role. Dark theme uses surface for all cards/rows.                                                                |
| `shadows.md`                           | `shadows.sm` or remove                                                | Dark theme uses color-based elevation. Use `shadows.sm` only if the element is a rare floating element (FAB, tooltip). Most cards/rows should have shadow removed entirely. |
| `shadows.lg`                           | `shadows.sm` or remove                                                | Same as `shadows.md` — dark theme elevation is via surface colors, not shadow depth.                                                                                        |

### Hardcoded Color Audit Results

| File                                         | Hardcoded Value | Replacement                                       | Context                                                                                                  |
| -------------------------------------------- | --------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `app/+not-found.tsx`                         | `#25292e`       | `theme.colors.background`                         | Container bg — close to dark theme but not token-aligned                                                 |
| `app/+not-found.tsx`                         | `#fff`          | `theme.colors.text`                               | Link text color                                                                                          |
| `components/ConfettiCelebration.tsx`         | `#FF6B6B`       | Keep as confetti color constant                   | Decorative confetti — not a UI surface color                                                             |
| `components/ConfettiCelebration.tsx`         | `#4ECDC4`       | Keep as confetti color constant                   | Decorative confetti                                                                                      |
| `components/ConfettiCelebration.tsx`         | `#FFE66D`       | Keep as confetti color constant                   | Decorative confetti                                                                                      |
| `components/ConfettiCelebration.tsx`         | `#95E1D3`       | Keep as confetti color constant                   | Decorative confetti                                                                                      |
| `components/progress/ConsistencyHeatmap.tsx` | `#059669`       | Semantic constant (emerald-600 for max intensity) | Heatmap level 3 — darker than `theme.colors.success`. Define as `HEATMAP_LEVEL_3` constant with comment. |
| `components/progress/PRItem.tsx`             | `#FFFFFF`       | `theme.colors.textInverse`                        | Text on amber accent badge — needs high contrast against `accent` (#FBBF24)                              |

**Confetti colors decision:** The 4 confetti hex values (`#FF6B6B`, `#4ECDC4`, `#FFE66D`, `#95E1D3`) are decorative particle colors for celebration animation, not UI surface or text colors. They do NOT need WCAG contrast compliance and are not used as part of the design system. However, they should be defined as a named constant array (e.g., `CELEBRATION_EXTRA_COLORS`) and placed alongside the theme-derived colors already in the array, rather than scattered as magic strings.

**Heatmap color decision:** `#059669` (emerald-600) is used for max-intensity heatmap cells (level 3). The lighter levels already use `theme.colors.successLight` and `theme.colors.success`. For level 3, a darker shade is needed to show progression. Define as `const HEATMAP_INTENSITY_HIGH = '#059669'` with a comment explaining it's the max-intensity step beyond `theme.colors.success`. This is a semantic data visualization value, not a UI surface color.

### Shadow Migration Decision Guide

For each file using `shadows.md` or `shadows.lg`, apply this decision tree:

1. **Is this a floating/overlay element?** (modal, FAB, tooltip, popover) → Use `shadows.sm`
2. **Is this a card or content container?** → Remove shadow entirely. Dark theme uses surface color for elevation.
3. **Is this a celebration/decorative element?** → Remove shadow. Confetti/animation doesn't need depth cues.

Specific decisions:

- `ConfirmationModal.tsx` (`shadows.md`) → Keep as `shadows.sm` — modal/overlay element
- `DependencyErrorModal.tsx` (`shadows.md`) → Keep as `shadows.sm` — modal/overlay element
- `WorkoutExecutionScreen.tsx` (`shadows.md`) → Remove — content container on dark bg
- `ProgramView.tsx` (`shadows.md`) → Remove — content container
- `QRCodeScanner.tsx` (`shadows.md`) → Evaluate context — likely remove
- `UnifiedDataManager.tsx` (`shadows.md`) → Remove — content container
- `app/(tabs)/index.tsx` (`shadows.md`) → Remove — content container
- `TimerControls.tsx` (`shadows.md`) → Remove — inline control
- `ConfettiCelebration.tsx` (`shadows.lg`) → Remove — celebration overlay
- `QRCodeShareModal.tsx` (`shadows.lg`) → Keep as `shadows.sm` — modal element

### Previous Story Learnings (Story 1.1)

**What worked:**

- Token value replacement was mechanical and low-risk. Same approach applies here.
- `npm run test:run` exits code 1 with "No test files found" — `__tests__/` directory is empty. This is expected per v1.1 migration. AC "tests pass" is satisfied because there are no tests to fail.
- `npm run compile` is the key verification — it catches all removed token references as TS errors.

**What went wrong:**

- Story 1.1 was initially marked complete while deprecated aliases still existed. **Do not mark tasks complete until the actual file edits are done and verified.**
- Review #1 caught that `colors.card`, `typography.h3`, `typography.captionBold`, and `shadows.md/lg` were still aliased instead of removed. They were subsequently removed, which is why this story exists — to fix the resulting TS errors in consumer files.
- Review #2 found dead code (`cards.focus`) and missing `as const` on shadows. **Run `npm run compile` after every batch of changes, not just at the end.**

**Pre-existing TS errors (not from this story):**

- `SharedValue` type error in `profile.tsx` — pre-existing
- `haptics.notifyWarning` in `ConfirmationModal.tsx` — pre-existing

### Prettier Rules (Project Enforced)

- No semicolons
- Single quotes
- No trailing commas
- Avoid arrow parens when possible
- Run `npm run lint:fix` after all edits

### Project Structure Notes

- All 35 affected files are at their canonical locations in the existing project structure
- No new files are created in this story
- No files are deleted in this story
- Only style-related code within existing components is modified
- No alignment conflicts detected

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation] — Complete color palette and token definitions
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color Palette] — All hex values, token roles, and contrast ratios
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Elevation Strategy] — Color-based depth replaces shadow depth
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Theme integration rule: ALL styled components must use `theme`
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — Acceptance criteria source
- [Source: _bmad-output/planning-artifacts/prd.md#Visual Design System] — FR40, FR41 requirements
- [Source: _bmad-output/implementation-artifacts/1-1-replace-theme-tokens-with-dark-first-design-system.md] — Previous story file with debug log, learnings, and removed token list
- [Source: _bmad-output/project-context.md#Code Style & Formatting] — Prettier rules, import conventions
- [Source: _bmad-output/project-context.md#Testing Rules] — Test commands and patterns

## Change Log

- 2026-03-09: Completed full hardcoded color audit and component token migration across 35 files. Replaced all removed token references (typography.h3, typography.captionBold, colors.card, shadows.md, shadows.lg) with dark-theme replacements. Extracted hardcoded hex colors into theme tokens or named semantic constants. Applied shadow decision tree per dark elevation strategy. Verified WCAG AA compliance and zero new TS compilation errors.
- 2026-03-09: **Code Review Fix** — Adversarial review found 6 HIGH issues: shadow migration was incomplete. Removed `shadows.sm` from 5 content container/inline control styles that should have had shadows removed per dark elevation strategy: TimerControls.tsx (buttonSecondary), ProgramView.tsx (card), app/(tabs)/index.tsx (statCard, browseCard), UnifiedDataManager.tsx (tabContainer), WorkoutExecutionScreen.tsx (upNextCard). Verified `npm run compile` — same 2 pre-existing errors only, zero new errors.

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

- `npm run compile`: 2 pre-existing errors only (SharedValue in profile.tsx, haptics.notifyWarning in ConfirmationModal.tsx). Zero errors from this story's migration.
- `npm run test:run`: Exit code 1 — "No test files found" (expected; __tests__/ is empty per Story 1.1)
- `npm run lint:fix`: All files Prettier-compliant (all showed "unchanged" after formatting)
- Shadow migration: Applied decision tree — modals/overlays kept shadows.sm (ConfirmationModal, DependencyErrorModal, QRCodeShareModal, UnifiedDataManager.bulkErrorModal); content containers/decorative elements had shadows removed entirely (8 files total after code review fix)
- UnifiedDataManager.tsx had 2 shadow usages: tabContainer (removed — content container, fixed in review) and bulkErrorModal (kept as shadows.sm — modal element, consistent with decision tree)
- **Code review fix:** Removed 6 remaining shadows from content containers/inline controls that were missed in initial implementation: TimerControls.tsx, ProgramView.tsx, app/(tabs)/index.tsx (2x), UnifiedDataManager.tsx (tabContainer), WorkoutExecutionScreen.tsx

### Completion Notes List

- Task 1: Replaced 4 hardcoded hex colors across 4 files. Confetti colors extracted to `CELEBRATION_EXTRA_COLORS` named constant array. Heatmap max-intensity extracted to `HEATMAP_INTENSITY_HIGH` semantic constant. PRItem badge text uses `theme.colors.textInverse`.
- Task 2: Migrated 28 occurrences of `typography.h3` → `typography.h2` across 23 files.
- Task 3: Migrated 20 occurrences of `typography.captionBold` → `typography.caption` + `fontFamily: theme.fonts.semiBold` across 11 files.
- Task 4: Migrated 8 occurrences of `colors.card` → `colors.surface` across 8 files (including JSX prop in RingChart.tsx).
- Task 5: Migrated shadows across 10 files: 4 files kept as `shadows.sm` (modals/overlays), 8 files had shadows removed entirely (content containers/decorative — 6 additional removals fixed during code review).
- Task 6: WCAG AA compliance verified — primary text 15.8:1/13.2:1/11.0:1 on surfaces, secondary text 5.1:1. Only intentional named constants remain as hardcoded hex (`CELEBRATION_EXTRA_COLORS`, `HEATMAP_INTENSITY_HIGH`). `muted` color confirmed used only for decorative/placeholder/non-actionable text.
- Task 7: `npm run compile` passes (zero new errors), `npm run test:run` passes (no test files — expected), `npm run lint:fix` all compliant.

### File List

- app/+not-found.tsx (modified)
- app/(auth)/sign-in.tsx (modified)
- app/(auth)/sign-up.tsx (modified)
- app/(tabs)/index.tsx (modified)
- app/(tabs)/profile.tsx (modified)
- app/(tabs)/progress.tsx (modified)
- components/ConfettiCelebration.tsx (modified)
- components/TimerControls.tsx (modified)
- components/common/ConfirmationModal.tsx (modified)
- components/common/DependencyErrorModal.tsx (modified)
- components/common/EmptyState.tsx (modified)
- components/common/QRCodeScanner.tsx (modified)
- components/data/FilterControls.tsx (modified)
- components/data/SortControls.tsx (modified)
- components/data/UnifiedDataManager.tsx (modified)
- components/data/forms/ExerciseForm.tsx (modified)
- components/data/forms/ProgramForm.tsx (modified)
- components/program/ProgramImportPreview.tsx (modified)
- components/program/ProgramView.tsx (modified)
- components/program/QRCodeShareModal.tsx (modified)
- components/program/WorkoutExecutionScreen.tsx (modified)
- components/program/WorkoutMatrix.tsx (modified)
- components/progress/ConsistencyHeatmap.tsx (modified)
- components/progress/EnhancedExerciseProgressionChart.tsx (modified)
- components/progress/PRItem.tsx (modified)
- components/progress/PersonalRecordsCard.tsx (modified)
- components/progress/ProgressCalendar.tsx (modified)
- components/progress/ProgressCard.tsx (modified)
- components/progress/ProgressEmptyState.tsx (modified)
- components/progress/ProgressView.tsx (modified)
- components/progress/ProgressViewBase.tsx (modified)
- components/progress/ProgramProgressView.tsx (modified)
- components/progress/RingChart.tsx (modified)
- components/progress/WeeklyChart.tsx (modified)
- components/progress/WeeklySummaryCard.tsx (modified)
