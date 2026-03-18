# Story 4.3: Wire V2 Session Screen & V1 Cleanup

Status: review

## Story

As a user,
I want the redesigned workout session screen to be the default when I start or resume a workout,
so that I get the full experience (accordion UI, rest timer, haptics, persistence, keypad) built across Epics 2–4.

## Acceptance Criteria

1. Starting a workout from `ProgramView` opens the V2 session screen (WorkoutExecutionProvider-based)
2. Resuming an active workout via `useActiveWorkoutRedirect` opens the same V2 session screen at the same route
3. Both entry points navigate to `/programs/[id]/session/[index]` — no `-v2` suffix in the URL
4. All V1-only files are deleted — no dead code remains in the repository
5. `lib/utils/colors.ts` is cleaned up or removed if fully unused after V1 removal
6. All existing V2 tests pass without modification (no behavior change)
7. Expo Router type generation reflects only the single `[index]` route (no `[index]-v2`)

## Tasks / Subtasks

- [x] **Task 1: Replace V1 route with V2** (AC: 1, 2, 3)
  - [x] Delete `app/programs/[id]/session/[index].tsx` (V1)
  - [x] Rename `app/programs/[id]/session/[index]-v2.tsx` → `app/programs/[id]/session/[index].tsx`
  - [x] Update `hooks/workout/useActiveWorkoutRedirect.ts` line 22: remove `-v2` suffix from the redirect path — change `` `/programs/${activeWorkout.programSlug}/session/${activeWorkout.sessionIndex}-v2` `` → `` `/programs/${activeWorkout.programSlug}/session/${activeWorkout.sessionIndex}` ``
  - [x] Verify `components/program/ProgramView.tsx` line 96 already routes to `/programs/[id]/session/[index]` — no change needed

- [x] **Task 2: Delete V1-only hooks** (AC: 4)
  - [x] Delete `hooks/session/useWorkoutSteps.ts`
  - [x] Delete `hooks/session/useWorkoutTimer.ts`
  - [x] Delete `hooks/session/useStepCompletion.ts`
  - [x] Delete `hooks/session/useProgramSessionTimer.ts`
  - [x] Delete `hooks/session/index.ts` (barrel export)
  - [x] Delete `hooks/session/` directory entirely

- [x] **Task 3: Delete V1-only components** (AC: 4)
  - [x] Delete `components/program/ProgramSessionView.tsx`
  - [x] Delete `components/program/WorkoutExecutionScreen.tsx`
  - [x] Delete `components/program/WorkoutMatrix.tsx`

- [x] **Task 4: Clean up orphaned utilities** (AC: 5)
  - [x] Check `lib/utils/colors.ts` — it imports `WorkoutStep` from `hooks/session` and exports `getPhaseInfo` and `getPhaseColors` which have zero consumers. Delete the file if fully unused, or remove only the dead functions/imports if other exports exist.
  - [x] Search for any remaining imports of deleted modules (`@/hooks/session`, `ProgramSessionView`, `WorkoutExecutionScreen`, `WorkoutMatrix`, `WorkoutStep` type from session hooks) — fix or remove

- [x] **Task 5: Delete V1-only test files** (AC: 4)
  - [x] Search `__tests__/` for any test files covering deleted V1 hooks/components and remove them
  - [x] Do NOT delete tests under `__tests__/components/workout/` or `__tests__/hooks/workout/` — those are V2

- [x] **Task 6: Regenerate Expo Router types and verify** (AC: 6, 7)
  - [x] Run `npx expo customize tsconfig.json` or the project's type generation command to update `.expo/types/router.d.ts`
  - [x] Verify the generated types no longer include `[index]-v2` route
  - [x] Run `npx tsc --noEmit` to confirm zero type errors
  - [x] Run `npx vitest run` to confirm all tests pass

## Dev Notes

### Route Swap Strategy

The architecture doc specifies a **clean-room rebuild strategy**: "Build at temporary route (`[index]-v2.tsx`), swap path when ready." This story executes that swap. The V2 screen is the complete implementation — it is NOT a partial prototype.

**`ProgramView.tsx` already navigates to `/programs/[id]/session/[index]`** (line 96), so the rename alone wires up the start-workout flow. The only code change needed is in `useActiveWorkoutRedirect.ts` to drop the `-v2` suffix from the resume path.

### Files to DELETE (11 files)

| File                                            | Reason                                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `app/programs/[id]/session/[index].tsx`         | Replaced by renamed V2                                                                                           |
| `hooks/session/useWorkoutSteps.ts`              | V1 step-based model, replaced by `WorkoutExecutionContext`                                                       |
| `hooks/session/useWorkoutTimer.ts`              | V1 timer, replaced by `useElapsedTimer` + `useRestTimer`                                                         |
| `hooks/session/useStepCompletion.ts`            | V1 step tracking, replaced by set-level state in reducer                                                         |
| `hooks/session/useProgramSessionTimer.ts`       | V1 elapsed timer, replaced by `useElapsedTimer`                                                                  |
| `hooks/session/index.ts`                        | Barrel for deleted hooks                                                                                         |
| `components/program/ProgramSessionView.tsx`     | V1 wrapper, V2 renders inline                                                                                    |
| `components/program/WorkoutExecutionScreen.tsx` | V1 execution UI, replaced by accordion                                                                           |
| `components/program/WorkoutMatrix.tsx`          | V1 step matrix, replaced by `ExerciseAccordionItem`                                                              |
| `lib/utils/colors.ts`                           | Only consumer was V1 components (`getPhaseColors`, `getPhaseInfo`) — verify zero other consumers before deleting |

### Files to MODIFY (1 file)

| File                                        | Change                                   |
| ------------------------------------------- | ---------------------------------------- |
| `hooks/workout/useActiveWorkoutRedirect.ts` | Line 22: remove `-v2` from redirect path |

### Files to RENAME (1 file)

| From                                       | To                                      |
| ------------------------------------------ | --------------------------------------- |
| `app/programs/[id]/session/[index]-v2.tsx` | `app/programs/[id]/session/[index].tsx` |

### Anti-Patterns to Avoid

- **Do NOT modify V2 screen logic** — this is a wiring/cleanup story, not a feature story
- **Do NOT create compatibility shims** or re-export deleted types — clean break
- **Do NOT rename deleted files** to `*.bak` or `*.old` — git history preserves everything
- **Do NOT touch `components/program/ProgramView.tsx`** — its route path already matches the target
- **Do NOT touch any `hooks/workout/` files** except `useActiveWorkoutRedirect.ts`

### Previous Story Intelligence

From Story 4.2 (Semantic Haptic Feedback):

- `[index]-v2.tsx` is ~390 lines — over the 300-line guideline but acceptable as composition root
- Haptic calls are fire-and-forget (not awaited) in event handlers
- Exercise completion detection uses pre-dispatch count check
- All side effects (haptics, notifications) are in UI layer, never in reducer

From Story 4.1 (Rest Timer Bar):

- `theme.colors.phases.break` is the correct token path (not `theme.colors.break`)
- Test JSX requires explicit `import React from 'react'`

### Verification Checklist

After all deletions and the rename:

1. `npx tsc --noEmit` — zero type errors
2. `npx vitest run` — all tests pass
3. Manual: start a workout from program view → lands on V2 screen
4. Manual: kill app during workout, reopen → resumes on V2 screen at same route
5. `grep -r "hooks/session" src/ app/ components/ lib/` — zero results
6. `grep -r "v2" app/programs/` — zero results
7. `grep -r "WorkoutMatrix\|WorkoutExecutionScreen\|ProgramSessionView" app/ components/ hooks/` — zero results (except git history)

### Project Structure Notes

- Deletion of `hooks/session/` directory aligns with architecture v1.2 which moved all workout logic to `hooks/workout/`
- `components/program/` retains `ProgramView.tsx`, `ProgramImportPreview.tsx`, `QRCodeShareModal.tsx` — only V1-specific components are removed
- No new files created — this is purely a swap + cleanup

### References

- [Source: _bmad-output/planning-artifacts/architecture.md — Clean-Room Rebuild Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md — v1.2 Directory Organization]
- [Source: _bmad-output/implementation-artifacts/4-2-semantic-haptic-feedback-system.md — Dev Notes]
- [Source: _bmad-output/implementation-artifacts/4-1-rest-timer-bar-with-background-notification.md — Dev Notes]
- [Source: components/program/ProgramView.tsx:96 — Current navigation path]
- [Source: hooks/workout/useActiveWorkoutRedirect.ts:22 — V2 redirect path]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered. Clean execution of all tasks.

### Completion Notes List

- Task 1: Deleted V1 route file, renamed V2 → V1 path, removed `-v2` suffix from `useActiveWorkoutRedirect.ts` redirect. Verified `ProgramView.tsx` already targets correct route.
- Task 2: Deleted entire `hooks/session/` directory (5 files: useWorkoutSteps, useWorkoutTimer, useStepCompletion, useProgramSessionTimer, index barrel).
- Task 3: Deleted 3 V1-only components: ProgramSessionView, WorkoutExecutionScreen, WorkoutMatrix.
- Task 4: Deleted `lib/utils/colors.ts` (zero consumers after V1 removal). Grep confirmed zero remaining imports of any deleted modules.
- Task 5: No V1-specific test files found in `__tests__/` — all existing tests are V2. No deletions needed.
- Task 6: Regenerated Expo Router types — `[index]-v2` route no longer present. Pre-existing type errors in haptics.test.ts, notifications.test.ts, profile.tsx, ConfirmationModal.tsx unrelated to this story. All 300 tests pass (23 test files).

### Change Log

- 2026-03-18: Wired V2 session screen as default route, deleted 10 V1-only files, cleaned up orphaned utilities, regenerated Expo Router types.

### File List

**Deleted:**

- `app/programs/[id]/session/[index].tsx` (V1 route — replaced by renamed V2)
- `hooks/session/useWorkoutSteps.ts`
- `hooks/session/useWorkoutTimer.ts`
- `hooks/session/useStepCompletion.ts`
- `hooks/session/useProgramSessionTimer.ts`
- `hooks/session/index.ts`
- `components/program/ProgramSessionView.tsx`
- `components/program/WorkoutExecutionScreen.tsx`
- `components/program/WorkoutMatrix.tsx`
- `lib/utils/colors.ts`

**Renamed:**

- `app/programs/[id]/session/[index]-v2.tsx` → `app/programs/[id]/session/[index].tsx`

**Modified:**

- `hooks/workout/useActiveWorkoutRedirect.ts` (removed `-v2` suffix from redirect path)
- `.expo/types/router.d.ts` (regenerated — no longer includes `[index]-v2` route)
