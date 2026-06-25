# Handoff: Active-Workout Surface (global)

## Overview
A **cross-cutting feature**, not a single screen: keep an in-progress workout (and its rest timer) present across the whole app and the OS, so users can leave the session screen, rest, switch apps, and return in one tap without losing their place.

Three surfaces, all driven by the **same** live workout/rest state:
1. **Mini-bar** — docked above the tab bar on every in-app screen.
2. **iOS Live Activity** — lock-screen rest timer.
3. **Dynamic Island** — compact + expanded live countdown.

This assumes the app-wide "electric" theme (lime/cyan + Space Grotesk) is in. Lime is a *light* color → dark content on lime fills.

## About the design files
Design references in HTML — recreate in the existing Expo / React Native app. The countdown ring in the mocks is a CSS `conic-gradient`; in RN use `react-native-svg` or Reanimated.

### Files
- **`Active Workout Surface.dc.html`** — canvas with 4 frames: mini-bar (resting), mini-bar (in-progress), iOS Live Activity (lock screen), Dynamic Island (compact + expanded). The rest countdown is live.
- `support.js` — to open the `.dc.html` in a browser.

## Fidelity
High-fidelity. Tokens below.

---

## The shared source of truth
All three surfaces read the existing `WorkoutExecutionContext` / `WorkoutState` (`restTimer { isActive, startedAt, durationMs }`, the active set, `sessionName`, elapsed). Nothing new in the reducer — these are **presentation layers** on top of it.

- **Visibility rule:** show the surfaces whenever a workout is active (`WorkoutState` exists and `!isCompleted`) AND the user is **not** on the session screen itself.
- **State variants:** **Resting** (cyan, `restTimer.isActive` + remaining > 0 — ring counts down) vs **In progress / paused** (lime, no active rest — shows program + "Set k of N" + overall progress + Resume).
- **Tap target:** tapping the bar/activity/island routes to `/programs/[id]/session/[index]` for the active workout. `+15s` → an `EXTEND_REST`-style action; `Skip` → `DISMISS_REST_TIMER`.

## 1. Mini-bar (in-app)
A docked bar that sits **above the bottom tab bar** on every tab/screen while a workout is active. Implement once near the tab navigator (e.g., a component rendered by `app/(tabs)/_layout.tsx` above `<Tabs>`), reading the workout context — not per screen.

**Resting variant** (`#0C1416`, border `#163038`, radius 20, shadow, slide-up entrance):
- Left: 46px **cyan countdown ring** (`#56E0F0` over `#1A1E24`) with `m:ss` in the center + a soft glow.
- Middle: `RESTING` (cyan, 9px tracked) + "Next · Set {k} · {exercise}".
- A chevron-up affordance (tap → back to session).
- Row of two buttons: **+15s** (cyan) and **Skip** (muted), each `#11181C` / border `#1d2933`.

**In-progress variant** (`#14161B`, border `#2C3424`, radius 20):
- Left: 42px lime-tint tile with a play glyph.
- Middle: a lime dot + "IN PROGRESS · {elapsed}", "{program} · Set {k} of {N}", and a thin lime progress bar (completed/total).
- Right: a lime **Resume** button.

Keep it clear of the tab bar (it stacks directly above it). Animate in/out (slide-up ~0.4s); respect reduced-motion.

## 2. iOS Live Activity (lock screen)
Use ActivityKit (`expo-live-activity` / a custom native module). The card (`rgba(12,18,20,.82)`, blur, border `#1d2a30`, radius 24):
- Header: 22px app glyph + "PWO · {program}".
- Body: 64px cyan ring + `m:ss`; `RESTING` + "Next · Set {k}" + "{exercise} · {weight} lb × {reps}".
- Two actions: **+15s** (cyan tint) and **Skip** (light tint) — App Intents.
- The ring/countdown is driven by `restTimer.startedAt + durationMs` (ActivityKit `Text(timerInterval:)` so it ticks without pushes). Update/extend via Live Activity update on +15s; end when rest ends or workout completes.

## 3. Dynamic Island
- **Compact** (leading/trailing): a tiny cyan ring + `m:ss` `Space Grotesk` tabular-nums on the black pill.
- **Expanded** (long-press): 48px ring + `m:ss`, `RESTING` + "Set {k} · {exercise}", and a `+15` circular action. Long-press skip.
- Same ActivityKit activity as the lock screen (one activity, multiple presentations).

---

## Design tokens
- Rest/cyan: `#56E0F0`; ring track `#1A1E24`; cyan surfaces `#0C1416` / border `#163038`; cyan control `#11181C` / border `#1d2933`; cyan tint `rgba(86,224,240,.12)`.
- Primary/lime: `#C6F24E`, on-lime `#0A0B0E`, lime tint `#1B1E14` / border `#2C3424`.
- Surfaces: app bg `#0A0B0E`, panel `#14161B`, hairline `#23262F`; tab bar `#101216` / border `#1c1e25`. Text `#F2F3F5` / subtext `#9A9DAB` / muted `#6B6E7A` / faint `#5B5E6B`.
- Type: Space Grotesk (countdown/numerals), DM Sans (labels). Radius: bar/card 20–24, island pill 20–30.

## Assets / native notes
- In-app ring: `react-native-svg` `<Circle>` (`strokeDasharray`/`Dashoffset`) or Reanimated; don't port the CSS gradient.
- Live Activity + Dynamic Island require a **native iOS widget extension (ActivityKit + SwiftUI)** — not pure RN; plan a config plugin / custom dev client. Android equivalent: an **ongoing notification** with a chronometer + actions (and optionally a foreground service so the timer survives backgrounding).
- Icons via Ionicons (`chevron-up`, `play`, `add`).

## Target files
- `app/(tabs)/_layout.tsx` (or a root layout) — mount the **mini-bar** above the tab navigator; subscribe to `WorkoutExecutionContext`; route to the session on tap.
- `context/WorkoutExecutionContext.tsx` — expose a selector for "is there an active workout + rest state" for the surfaces; start/stop the Live Activity on workout start/end and rest start/skip.
- New `components/workout/ActiveWorkoutBar.tsx` — the mini-bar (resting + in-progress variants).
- New native module / config plugin — ActivityKit Live Activity + Dynamic Island (iOS); ongoing notification (Android).
- `lib/notifications.ts` — Android ongoing-notification timer.
