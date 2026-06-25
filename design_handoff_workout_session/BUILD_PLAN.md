# BUILD_PLAN — Workout Session redesign

Work through these phases **in order**. Each is independently shippable and ends with a gate: don't start the next phase until the current one's acceptance checks pass. Reference `README.md` for visual/behavior detail and the `Session Prototype (Flow).dc.html` script for logic. Run `npm run compile && npm run lint` after every phase; add/keep tests green.

---

## Phase 0 — App-wide re-theme (foundation)

**Goal:** the whole app adopts the new lime/cyan + Space Grotesk system, before any session work.

Tasks:

1. In `theme/theme.ts`, recolor the primary group to lime and **set `primaryTextOn: '#0A0B0E'`**; add `info`/`infoLight` (cyan); align `phases.working`→lime and `phases.break`→cyan (see README §"App-wide theming" for exact values). Keep amber `accent`.
2. Add `@expo-google-fonts/space-grotesk`; load its weights in the existing `useFonts(...)` bootstrap next to DM Sans. Add `fonts.display`/`fonts.displayMed` and point the numeric/heading typography presets at Space Grotesk.
3. **Contrast audit** (the gotcha): grep for primary-as-background + white text and fix to `primaryTextOn` (commands in README). Check Home hero, primary `Button`, Library FAB, tab bar tint.
4. Re-skin charts/heatmap intensity from indigo to a lime→green ramp.

**Acceptance:** app boots on iOS + web; every tab renders with the new accent; **no white-on-lime**; `compile` + `lint` clean; no new literal hex in components (all in `theme.ts`).

---

## Phase 1 — Reducer extensions (logic, no UI yet)

**Goal:** add the new state transitions with tests, so the UI phases can just call them.

Tasks:

1. Add to the `WorkoutAction` union in `types/workout.ts`: `ADD_SET`, `MOVE_EXERCISE`, `EXTEND_REST`, `UNLOG_SET`, `RESTORE_SET` (signatures in README §"NEW reducer cases").
2. Implement each `case` in `context/workoutReducer.ts` (port from the prototype script — it's exact and pure). Keep `reducerHelpers.ts` reused.
3. Decide & implement **natural completion**: dispatch `COMPLETE_WORKOUT` when `CONFIRM_SET` finds no next pending set (or wherever the screen decides completion) — align with current "Workout Complete!" behavior.
4. Unit tests in `__tests__/` mirroring the existing reducer test style: add-set appends pending; move-exercise guards (won't move active/started); extend-rest adds 15s; unlog/restore re-activate when nothing active; completion flips `isCompleted`.

**Acceptance:** `npm run test:run` green incl. new tests; `compile`/`lint` clean; no UI change yet.

---

## Phase 2 — Session shell + exercise list (the smart list)

**Goal:** the new screen scaffold and the 4 exercise-card states, logging via the existing reducer.

Tasks:

1. Rebuild `app/programs/[id]/session/[index].tsx` layout: header (`WorkoutHeader`), overall progress bar, scrollable exercise list, footer slot.
2. `WorkoutHeader` → program/session title + elapsed pill + End.
3. `ExerciseAccordionItem` → expanded card (NOW/DONE/UP NEXT badge, column header, set rows, per-exercise progress bar) + 3 collapsed variants (DONE / CURRENT / PENDING-with-reorder-chevrons). Reorder chevrons dispatch `MOVE_EXERCISE`; headers dispatch `EXPAND_EXERCISE`.
4. `SetRow`/`SetDot` → the 4 set-row variants (completed / skipped / active / pending) per README.
5. Footer **Log action bar** (rest-idle): one tap = `LOG_SET`→`CONFIRM_SET`(+`START_REST_TIMER`). Wire haptics + toast.
6. "+ Add set" → `ADD_SET`.

**Acceptance:** can complete a full workout by tapping Log/checks; sets advance; reorder + add-set work; matches README spacing/typography/tokens; `compile`/`lint` clean.

---

## Phase 3 — Inline stepper editor (replaces NumericKeypad)

**Goal:** adjust weight/reps without a full-screen keypad; edit logged & skipped sets.

Tasks:

1. Build the inline editor (scrim + bottom card): ± buttons (step 5 weight / 1 reps), big value, 4 quick chips around the prefill, secondary action, Done.
2. Tap a number → open editor; completed → `EDIT_SET` first, pending → `EXPAND_EXERCISE(setIndex)`; adjust via `LOG_SET`; Done on an editing set → `CONFIRM_SET`.
3. Secondary button by status: **Skip set** (`SKIP_SET`), **Unlog set** (`UNLOG_SET`), **Restore set** (`RESTORE_SET`).
4. Retire `NumericKeypad`/`KeypadOverlay` from the common path (keep or delete per team preference).

**Acceptance:** can edit any set (active, logged, skipped) and skip/unlog/restore; values persist via the reducer; `compile`/`lint` clean.

---

## Phase 4 — Rest sheet

**Goal:** the prominent rest experience replacing the thin `RestTimerBar`.

Tasks:

1. Replace `RestTimerBar` with the bottom **rest sheet**: cyan countdown ring (SVG/Reanimated — not CSS), "RESTING" + next-set preview, **+15s** (`EXTEND_REST`) and **Skip rest** (`DISMISS_REST_TIMER`).
2. Drive countdown from `useRestTimer`; auto-dismiss at 0; keep the list visible above the sheet.

**Acceptance:** rest sheet appears after logging, counts down smoothly, +15s/skip work, next-set preview correct; `compile`/`lint` clean.

---

## Phase 5 — Completion recap

**Goal:** the celebratory recap replacing the bare "Workout Complete!" screen.

Tasks:

1. Recap view on `isCompleted`: confetti (reuse `ConfettiCelebration`), stat row (time / sets / volume), skipped pill, per-exercise rows with PR badges, Share + Done.
2. PR detection from the real progress API / `PersonalRecordsCard` logic (the prototype's `bestById` is a stand-in).
3. End-workout confirmation (reuse `useEndWorkout` copy) → `COMPLETE_WORKOUT` → recap.

**Acceptance:** finishing (naturally or via End) shows the recap with correct stats, skipped reporting, and real PRs; Done navigates/persists as the app expects.

---

## Phase 6 — Motion, haptics, a11y polish

**Goal:** match the prototype's feel.

Tasks:

1. Reanimated: active-check glow pulse (~2.6s), rest-ring fill + glow (~3s), rest-sheet/editor slide-up (~.35s), toast in/out (~1.5s).
2. Haptics on log/confirm/complete (existing `lib/haptics`).
3. A11y parity: labels/roles on set rows, timers (`accessibilityRole="timer"` + live region), buttons; hit targets ≥ 44px; verify with a screen reader.

**Acceptance:** interactions feel like the prototype; reduced-motion respected where the app already does; `compile`/`lint`/`test:run` all green; full Definition of Done in `CLAUDE.md` met.
