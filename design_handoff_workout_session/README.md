# Handoff: Workout Session redesign ("Flow" mode)

## Overview

This package redesigns the **live Workout Session screen** of the PWO (Progressive Workout) app — the screen at `app/programs/[id]/session/[index].tsx`. The goal was **reduce friction / fewer taps** when logging sets, with a fresh visual direction.

The redesign ("Flow" mode) keeps the whole session glanceable as a smart list and makes logging a set a **single tap** (values are pre-filled from last session). It also gives the rest timer real presence, and adds the small things a real session needs: edit a logged set, skip a set, add a set mid-workout, reorder upcoming exercises, and an end-workout confirmation.

## About the design files

The files in this bundle are **design references created in HTML** (Design Components) — they demonstrate the intended look and behavior. They are **not** code to paste into the app. Your job is to **recreate this design inside the existing PWO React Native / Expo codebase**, using its established patterns (`StyleSheet`, the `theme` object, Ionicons, Reanimated, the `WorkoutExecutionContext` reducer).

The good news: the prototype's logic was deliberately written **as a faithful port of the app's own state machine**, so most of the work is UI + a handful of new reducer cases (all listed below).

### Files

- **`CLAUDE.md`** — operating guide for Claude Code: project facts, commands, conventions, gotchas, definition of done. **Copy/merge this into your repo root** before starting.
- **`BUILD_PLAN.md`** — the recommended phased implementation order, each phase with acceptance criteria and verify commands. Work through it top to bottom.
- **`Session Prototype (Flow).dc.html`** — the primary reference. A fully interactive single-screen prototype of the redesigned session. Its `<script data-dc-script>` block contains a JS port of `buildInitialState`, `workoutReducer`, and `reducerHelpers`, plus the proposed new reducer cases. **Read this script — it is the implementation spec for the state logic.**
- **`Workout Session Redesign (two directions).dc.html`** — context: the original two-direction exploration (A "Focus" mode vs B "Flow" mode). Flow (B) is the chosen direction. Useful for seeing the alternative and the design system legend.
- `support.js` — runtime needed only to open the `.dc.html` files in a browser. Not relevant to the RN implementation.

To view a prototype: open the `.dc.html` file in a browser (it loads `support.js` from the same folder).

## Fidelity

**High-fidelity.** Colors, typography, spacing, radii, and interactions are final. Recreate the UI faithfully using the codebase's libraries. Exact tokens are in [Design Tokens](#design-tokens).

---

## Visual direction (IMPORTANT — this is an APP-WIDE re-theme)

The current app theme (`theme/theme.ts`) is **indigo `#818CF8` + amber on near-black**. This redesign replaces it **across the whole app** with a fresh "electric" system:

- **Lime `#C6F24E`** = the new **primary** (active set, primary buttons, progress, charts, tab tint, PR).
- **Cyan `#56E0F0`** = timers / informational (rest timer, the `break` phase).
- **Green `#34D399`** = success/completed.
- **Amber `#FBBF24`** stays as a small **tertiary accent** (streak/flame), now a supporting role.
- Near-black surfaces (unchanged), with a new type pairing: **Space Grotesk** for numerals/headings/metrics, **DM Sans** (already in the app) for UI text & labels.

This is done **once in `theme/theme.ts`** so every screen inherits it — do not hardcode hex in components; always go through `theme.colors.*` / `theme.fonts.*` / `theme.typography.*`. See the migration section below for the exact token edits and the one breaking gotcha (lime is a _light_ color).

## App-wide theming (migration) — do this FIRST (BUILD_PLAN Phase 0)

Everything funnels through `theme/theme.ts`, so the re-theme is mostly one file plus a contrast audit.

### 1. Recolor the primary token group in `theme/theme.ts`

```
primary:        '#C6F24E'   // was #818CF8
primaryDark:    '#AEDB37'   // was #6366F1 (a slightly deeper lime for pressed/gradients)
primaryLight:   'rgba(198, 242, 78, 0.12)'
primaryMuted:   'rgba(198, 242, 78, 0.25)'
primaryTextOn:  '#0A0B0E'   // ⚠ WAS #FFFFFF — see gotcha
```

Keep `accent`/`accentLight` (amber) as-is. Add a secondary/info token for cyan and align the phase palette:

```
info:        '#56E0F0'
infoLight:   'rgba(86, 224, 240, 0.12)'
phases.working:   '#C6F24E'   // was #818CF8 (match new primary)
phases.workingBg: '#1B1E14'
phases.break:     '#56E0F0'   // was #22D3EE (align to new cyan)
// warmup (amber) and done (green) stay
```

### 2. ⚠ THE ONE BREAKING GOTCHA — lime is a _light_ color

Indigo `#818CF8` is mid-dark, so `primaryTextOn` was **white**. Lime `#C6F24E` is **bright**, so text/icons sitting **on a primary-colored fill** must be **dark `#0A0B0E`**, not white. After flipping `primaryTextOn` to dark, **audit every place that renders content on a primary background** and make sure it uses `primaryTextOn` (not a literal white):

```
grep -rn "colors.primary\b" app components | grep -i "backgroundColor"   # primary as a fill
grep -rn "primaryTextOn" app components                                  # things on that fill
grep -rn "#FFFFFF\|#FFF\b\|'white'" app components                        # stray white that should be primaryTextOn
```

Known spots to verify: the Home **Quick Start hero** (`app/(tabs)/index.tsx` — `heroCard` uses `backgroundColor: primary` with `primaryTextOn` text/icon ✓ already correct, just confirm), any primary `Button` variant (`components/common/Button.tsx`), and the Library **add** FAB (`app/(tabs)/library.tsx` uses `primaryTextOn` ✓). Icons drawn _in_ primary on a dark surface (e.g. stat icons) stay lime and are fine.

### 3. Add Space Grotesk and wire the type system

- Add dep: `@expo-google-fonts/space-grotesk`. Load its weights in the **same font bootstrap** that currently loads DM Sans (search for `useFonts(` / `DMSans_400Regular`).
- Extend `theme.fonts` and use Space Grotesk for **numerals, metrics, big headings**; keep DM Sans for body/labels:

```
fonts.display     = 'SpaceGrotesk_700Bold'
fonts.displayMed  = 'SpaceGrotesk_600SemiBold'
// keep regular/medium/semiBold/bold = DM Sans
```

- Point the numeric/heading typography presets at it: `typography.display` and the large stat/number styles → `fontFamily: fonts.display`. Anywhere a big number is shown with `theme.typography.h1`/`display` (Home stats, Statistics stat cards, timers, PRs) will pick it up.

### 4. Screens that inherit the change for free (verify, don't rewrite)

These already read `theme.colors.primary` / `typography`, so they re-skin automatically — just eyeball contrast:

- **Home** `app/(tabs)/index.tsx` (hero, stat icons, browse).
- **Statistics** `app/(tabs)/progress.tsx` + `components/progress/*` and charts (`WeeklyChart`, `ConsistencyHeatmap`, `EnhancedExerciseProgressionChart`, `PersonalRecordsCard`, `WeeklySummaryCard`). For Victory charts and the heatmap intensity ramp, swap the indigo series/scale to a **lime→green** ramp (the heatmap currently keys off primary).
- **Library** `app/(tabs)/library.tsx` (`TAB_COLORS.exercises` uses primary → now lime).
- **Tab bar** `components/common/TabIconAnimator.tsx` / `app/(tabs)/_layout.tsx` — active tint follows `tabBarActiveTintColor`/primary → lime on `surface #14151A` (good contrast).
- **Profile, auth, empty states, cards** — inherit via tokens.

### 5. Acceptance for Phase 0

`npm run compile` + `npm run lint` clean; app boots; **no white-on-lime** anywhere; every screen renders with the new accent; no literal hex introduced (all via tokens).

---

## Screen: Workout Session (Flow)

One screen, two view states driven by `WorkoutState.isCompleted`: the **session** view and the **completion recap** view. Phone reference size in the mock: 356×788 content area.

### Layout (session view), top → bottom

1. **Status bar** — system; ignore (RN SafeAreaView handles it).
2. **Header** (`padding: 6px 22px 14px`, row, space-between):
   - Left: program name — `Space Grotesk 700, 22px, letter-spacing -0.4`, color `#F2F3F5`. Subtitle below — `DM Sans 500, 13px`, `#6b6e7a`: `"Session {n} · Exercise {k} of {total}"` where `k = expandedExerciseIndex + 1`.
   - Right: an **elapsed pill** (`DM Sans 600 13px`, `#9A9DAB`, bg `#15171D`, radius 12, padding `9×12`, tabular-nums) and an **End pill** (`#FB7185` on bg `#241317`, same shape).
3. **Overall progress bar** — full-width track `height 4`, bg `#16181E`, radius 2, margin `0 22`; fill bg `#C6F24E`, `width = completedSets / totalSets`, `transition: width .4s`.
4. **Exercise list** — scroll area, `padding 14px 16px 16px`, vertical `gap 10`. One card per exercise (see component states below).
5. **Footer slot** — either the **Log action bar** (when rest idle) or the **Rest sheet** (when resting). See below.
6. **Home indicator** — system.

### Component: Exercise card — 4 collapsed/expanded states

Exactly one exercise is **expanded** at a time (`expandedExerciseIndex`). The rest are collapsed. There are 4 visual variants:

**(a) Expanded card** (the exercise you're working on, or any you tapped into)

- Container: bg `#14161B`, border `1.5px #2c3424`, radius 20, padding `16px 15px 13px`.
- Header row (tappable → `EXPAND_EXERCISE` toggle): exercise name `DM Sans 600 16px #F2F3F5`; right-aligned status badge:
  - `NOW` — `#C6F24E` on `#1B1E14` (this exercise holds the active set)
  - `DONE` — `#34D399` on `#0E1411` (fully resolved, you navigated into it)
  - `UP NEXT` — `#9A9DAB` on `#181A20`
  - badge text: `DM Sans 600 10px, letter-spacing 1`, padding `4×9`, radius 8.
- Sub-line: `"Last · {prefillWeight} × {prefillReps}"` — `DM Sans 500 12px #6b6e7a` (from the prefill API).
- Column header grid `26px 1fr 1fr 34px`, `gap 6`: `#  WEIGHT  REPS  (blank)` — `DM Sans 600 9px, letter-spacing .8, #5B5E6B`.
- **Set rows** (same grid), 4 sub-variants by `SetStatus`:
  - `completed` → number `Space Grotesk 600 14px #6b6e7a`; weight/reps `DM Sans 500 15px #7c8a82` (tappable to edit); trailing **green check** box 24×24 radius 8 bg `#1c2a22`, check stroke `#34D399`.
  - `skipped` → row `opacity .7`; number `#4d505c`; weight/reps `#5b5e6b` **line-through** (tappable); trailing box bg `#16181E` with a muted **dash** `#4d505c`.
  - `active` → highlighted row: bg `#1B1E14`, radius 13, `margin 3px -4px`, padding `10px 8px`; number `Space Grotesk 700 14px #C6F24E`; weight/reps **`Space Grotesk 600 20px #F2F3F5` tabular-nums** (tappable to edit); trailing **lime check** 28×28 radius 9 bg `#C6F24E`, dark check, with a soft glow pulse (`box-shadow` keyframe, 2.6s).
  - `pending` → number `#6b6e7a`; weight/reps `DM Sans 500 15px #9A9DAB` (tappable); trailing **empty outline** box 24×24 radius 8 border `1.5px #2a2d36`.
- **"+ Add set"** row (only on the exercise that holds the active set): dashed border `1.5px #2f3a26`, radius 12, height 38, centered "＋ Add set" `#9aa86a`.
- **Per-exercise progress bar** at the bottom: track `height 3` bg `#16181E`; fill `#34D399`, width = `(completed + skipped) / total`.

**(b) Collapsed — DONE**: bg `#0E1411`, border `1px #18241d`, radius 16, padding `14×16`; green check circle 26×26 `#34D399` + name `DM Sans 600 15px #7c8a82`; right summary `"{done}/{total} · top {topW} lb"` `#5b6660`. Tappable → expand.

**(c) Collapsed — CURRENT** (the active exercise when you've expanded a different one): bg `#14161B`, border `1.5px #2c3424`, radius 16; a lime dot `9px #C6F24E` + name `#F2F3F5`; right summary `"Set {k} of {total}"` `#C6F24E 600 12px`. Tappable → expand.

**(d) Collapsed — PENDING**: bg `#101116`, border `1px #1c1e25`, radius 16; name `#9A9DAB` + summary `"0/{total} · {prefillWeight} lb"` `#5B5E6B`; **reorder chevrons** on the right — two 30×30 radius-9 buttons (`#181A20`) with up/down chevrons (`#8a8d99`). Name area tappable → expand; chevrons → reorder.

### Component: Footer — Log action bar (rest idle)

`padding 12px 16px 16px`, with a top fade `linear-gradient(0deg,#0A0B0E 72%,transparent)`. Inner bar: bg `#14161B`, border `1px #23262F`, radius 20, padding `10px 10px 10px 17px`, row:

- Left: label `"SET {k} · {EXERCISE NAME}"` (`DM Sans 600 9px, letter-spacing 1, uppercase, #5B5E6B`) and target `"{weight} lb × {reps}"` (`Space Grotesk 600 16px #F2F3F5`).
- Right: **Log** button — height 50, padding `0 28`, radius 15, bg `#C6F24E`, text `DM Sans 700 16px #0A0B0E`. Tap → log the active set.

### Component: Footer — Rest sheet (resting)

Replaces the action bar when `restTimer.isActive`. bg `#0C1416`, top border `1.5px #163038`, radius `26 26 0 0`, padding `16px 20px 18px`, shadow `0 -16px 36px rgba(0,0,0,.5)`, slide-up entrance.

- Left: **countdown ring** 72×72 — a cyan progress ring (`#56E0F0` over track `#1A1E24`, ~7px thick) with a soft radial glow behind it; center label `Space Grotesk 600 18px #56E0F0` tabular-nums showing `m:ss`. In the mock the ring is a `conic-gradient` masked to a ring with `--ang` animated via a 1s linear transition; in RN use `react-native-svg` `Circle` with `strokeDasharray`/`strokeDashoffset` (or reuse the existing Reanimated approach).
- Right: `"RESTING"` (`#56E0F0 600 10px letter-spacing 1.4`), `"Next · Set {k} · {exercise}"` (`#F2F3F5 600 15px`), target line (`#9A9DAB 500 13px`).
- Two buttons below (`gap 10`): **+15s** (`#56E0F0` text on `#11181C`, border `#1d2933`) and **Skip rest** (`#9A9DAB`). Each height 46 radius 14.

### Component: Inline editor (replaces the full-screen NumericKeypad)

Opens when you tap any set's weight/reps number. Scrim `rgba(5,6,8,.62)`; card pinned near bottom (`left/right 24, bottom 96`): bg `#1A1D24`, border `1px #2c303b`, radius 24, padding 20, big shadow, slide-up.

- Title `"SET {k} · WEIGHT|REPS"` (`DM Sans 600 10px letter-spacing 1.4 uppercase #5B5E6B`).
- Stepper row: a **−** button 54×54 radius 17 (`#23262F`), the big value `Space Grotesk 600 52px #C6F24E` tabular-nums with a unit caption (`lb`/`reps`), and a **＋** button 54×54 radius 17 (`#C6F24E`, dark glyph). Step = **5** for weight, **1** for reps.
- Quick chips (4): values around the prefill (`base-5, base, base+5, base+10` for weight; `base-1..base+2` for reps); selected chip = `#C6F24E` on dark text, others `#9A9DAB` on `#23262F`; radius 12.
- Bottom row: a destructive secondary (`#FB7185` on `#1F1417`) whose label depends on the set — **Skip set** (active/pending), **Unlog set** (a logged set being edited), **Restore set** (a skipped set) — and **Done** (`#2A2E38`, text `#F2F3F5`).

### Component: Toast

On log: a pill at top-center, bg `#1B2114`, border `#39431f`, radius 14; lime check dot + `"Set logged · +{volume} lb"` (`#C6F24E 600 13px`). Auto-dismiss ~1.5s.

### Component: End-workout confirmation

Tapping **End** opens a centered modal (scrim `rgba(5,6,8,.72)`): card bg `#1A1D24`, border `#2c303b`, radius 24, padding 24. Title `"End workout?"` (`Space Grotesk 700 19px`), body `"{n} sets remaining will be marked as skipped."` (`#9A9DAB`), and two buttons: **Keep going** (`#23262F`) and **End workout** (`#FB7185` on `#241317`). This mirrors the existing `useEndWorkout` confirmation copy.

### Completion recap view (`isCompleted === true`)

- Falling **confetti** (the app already has `ConfettiCelebration` / `react-native-confetti-cannon` — reuse it).
- Header: `"SESSION COMPLETE"` (`#56E0F0`), `"{program} · recap"` (`Space Grotesk 700 26px`).
- Stat row (3): **time** (`m:ss`), **sets** (completed count), **lb volume** (`Σ weight×reps` of completed) — numbers `Space Grotesk 600 24px`, volume in `#C6F24E`.
- If any skipped: a pill `"{n} sets skipped"` (`#9A9DAB` on `#16181E`).
- Per-exercise recap rows: name + `"{n} sets · top {w} lb"` (and `· {s} skipped` when relevant; or `"{s} sets skipped"` if none completed). A **PR** badge (`#C6F24E`) when that exercise beat its all-time best, else `—`. _(PR detection comes from the progress API / `PersonalRecordsCard` logic — see the prototype's `bestById` stand-in.)_
- Footer: **Share** (secondary) + **Done** (`#C6F24E`). Done resets the session in the prototype; in-app this should navigate back / persist as the real screen does.

---

## State management — wiring to `WorkoutExecutionContext`

The prototype runs the **real state shape and reducer**. Reuse what exists; add the cases below.

### Reuse as-is (already in the repo)

- `types/workout.ts` — `WorkoutState`, `ExerciseState`, `ExerciseSetState`, `SetStatus`.
- `lib/buildInitialState.ts` — unchanged.
- `context/workoutReducer.ts` + `context/reducerHelpers.ts` — `EXPAND_EXERCISE`, `LOG_SET`, `CONFIRM_SET`, `SKIP_SET`, `EDIT_SET`, `START_REST_TIMER`, `DISMISS_REST_TIMER`, `COMPLETE_WORKOUT`, and `findNextPendingSet`/`activateInExercise`/`revertEditingSets`.

### Interaction → action mapping (no logic change)

- **One-tap Log** = `LOG_SET` (current set's reps/weight) → `CONFIRM_SET`. Then, exactly like today's `handleSetConfirm`, if a next pending set exists and `restDurationMs > 0`, dispatch `START_REST_TIMER`.
- **Tap a logged number** = `EDIT_SET` (→ `editing`) → adjust via `LOG_SET` → on close `CONFIRM_SET` (re-commits with new values; `findNextPendingSet` returns you to where you were).
- **Skip** = `SKIP_SET`. **Expand any exercise** = `EXPAND_EXERCISE` (free navigation; it moves the active set, as the shipped reducer already does). **Skip rest** = `DISMISS_REST_TIMER`. **End** = `COMPLETE_WORKOUT`.

### One behavior to confirm/add: natural completion

In the current `CONFIRM_SET`, when `findNextPendingSet` returns `null` the last set is completed but `isCompleted` stays `false`. The redesign shows the recap on the **last set**, so dispatch `COMPLETE_WORKOUT` when there is no next pending set (the prototype does this in its `log()` handler). Verify how the live app currently transitions to the "Workout Complete!" view and align.

### NEW reducer cases to add (the redesign's extra affordances)

These are **not** in the shipped reducer. Add them to the `WorkoutAction` union in `types/workout.ts` and to `workoutReducer`. Exact, tested logic is in the prototype's `<script data-dc-script>` block — copy from there. Summary:

- **`ADD_SET { exerciseIndex }`** — append a `pending` set to that exercise, copying the last set's `reps`/`weight`. (Drives "+ Add set".)
- **`MOVE_EXERCISE { from, to }`** — swap two exercises. Guard: refuse if either is the currently expanded/active exercise or if either has any non-`pending` set (only reorder untouched, upcoming exercises). (Drives reorder chevrons.)
- **`EXTEND_REST`** — `restTimer.startedAt += 15000` (adds 15s of remaining time). (Drives **+15s**.)
- **`UNLOG_SET { exerciseIndex, setIndex }`** — set status → `pending`; if no `active` set remains, re-activate this one and point `expandedExerciseIndex`/`activeSetIndex` at it; clear rest. (Editor secondary on a logged set.)
- **`RESTORE_SET { exerciseIndex, setIndex }`** — same as `UNLOG_SET` for a previously `skipped` set. (Editor secondary on a skipped set.)

_(If the team prefers a smaller surface, `UNLOG_SET`/`RESTORE_SET` are optional — the core flow works with the shipped actions plus `ADD_SET`/`MOVE_EXERCISE`/`EXTEND_REST`.)_

### UI-only state (outside `WorkoutState`, like the screen does today)

- **Clock** — elapsed + rest countdown come from the existing `useElapsedTimer` / `useRestTimer` hooks (the prototype fakes this with a `now` tick; use the real hooks).
- **`editor`** `{ open, exerciseIndex, setIndex, field: 'weight'|'reps' }` — local component state.
- **`confirmEnd`** boolean — reuse `useEndWorkout`'s confirmation state.
- **`toast`** — local, auto-dismiss ~1500ms (or use `lib/toast.ts`).
- **Haptics** — fire `haptics.setConfirmed()` / `haptics.exerciseCompleted()` on log, like the current screen.

---

## Interactions & behavior summary

- **Log a set:** one tap on the lime check (or the Log bar). Set → completed (green), row collapses visually, active advances, rest sheet appears, toast shows.
- **Adjust before logging / fix a value:** tap any number → stepper (± and quick chips). No full-screen keypad. _(If users need arbitrary values like 142.5, optionally add a "tap value to type" mode — not in this mock.)_
- **Skip / Unlog / Restore:** editor secondary button.
- **Add set / Reorder upcoming / Expand any exercise:** as mapped above.
- **Rest:** counts down; **+15s** extends; **Skip** dismisses; auto-dismiss at 0; next-set preview shown.
- **End:** confirmation → recap. **Recap:** confetti, stats, skipped pill, per-exercise rows with PR badges.
- **Motion:** active-check glow pulse (~2.6s), rest-ring fill (smooth 1s steps) + glow (~3s), rest-sheet/editor slide-up (~.35s), toast in/out (~1.5s), confetti fall (~3–4s). Use Reanimated; keep durations close to these.

---

## Design tokens

**Colors**

- Surfaces: app bg `#0A0B0E`; outside/backdrop `#060708`; panel `#14161B`; elevated `#1A1D24`; hairline `#23262F`; active-card border `#2C3424`.
- Text: primary `#F2F3F5`; subtext `#9A9DAB`; muted `#6B6E7A`; faint `#5B5E6B`.
- Lime (primary/active): `#C6F24E`; on-lime `#0A0B0E`; lime tint bg `#1B1E14`; lime muted text `#9aa86a`.
- Cyan (rest): `#56E0F0`; cyan panel `#0C1416`; cyan border `#163038`; cyan control bg `#11181C` / border `#1d2933`.
- Green (completed): `#34D399`; tints `#0E1411` / `#1c2a22`; on-green `#06241A`.
- Danger: `#FB7185`; tints `#241317` / `#1F1417`; border `#3a2226`.
- Skipped: text `#5b5e6b`; number `#4d505c`.

**Typography** — `Space Grotesk` (400–700) for numerals/headings/metrics; `DM Sans` (400–700) for UI text/labels. Key sizes: display/program 22–26 / 700; section 19 / 700; metric 24 / 600; big set number 20 / 600; rest countdown 18 / 600; editor value 52 / 600; body 15–16; labels 9–13.

**Radius** — set check 8–9; chips/pills 11–15; cards 16–20; sheet 26; device 40.
**Spacing** — screen padding 16; list gap 10; card padding 14–16.
**Shadows** — rest sheet `0 -16px 36px rgba(0,0,0,.5)`; modal/editor `0 28px 60px rgba(0,0,0,.6)`.

## Assets

No image assets. Icons in the mock are CSS shapes (check, chevron, ±, dash) — in-app use **Ionicons** (already a dependency): `checkmark`, `chevron-up`/`down`/`forward`, `add`, `remove`. Confetti: reuse the existing `ConfettiCelebration` component. Fonts: **add Space Grotesk** (`@expo-google-fonts/space-grotesk`); DM Sans is already loaded.

## Target files to modify (PWO repo)

**Phase 0 (app-wide theme) — do first:**

- `theme/theme.ts` — recolor primary group to lime, set `primaryTextOn: '#0A0B0E'`, add `info` (cyan), align `phases`, add Space Grotesk to `fonts` + numeric typography presets.
- font bootstrap (search `useFonts(` / `DMSans_400Regular`) — load `@expo-google-fonts/space-grotesk`.
- contrast audit across `app/` + `components/` (grep commands in the migration section).

**Session screen:**

- `app/programs/[id]/session/[index].tsx` — screen composition (header, list, footer, editor, recap).
- `components/workout/ExerciseAccordionItem.tsx` → the expanded card + 3 collapsed variants.
- `components/workout/SetRow.tsx` + `SetDot.tsx` → the 4 set-row variants.
- `components/workout/NumericKeypad.tsx` + `KeypadOverlay.tsx` → replace with the stepper **inline editor**.
- `components/workout/RestTimerBar.tsx` → the **rest sheet** (countdown ring + +15s/skip + next preview).
- `components/workout/WorkoutHeader.tsx` → header (program/session + elapsed + End).
- The completion block in `[index].tsx` → the **recap** view.
- `context/workoutReducer.ts` + `types/workout.ts` → add the 5 new actions above.
