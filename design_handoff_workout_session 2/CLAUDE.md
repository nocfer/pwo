# CLAUDE.md — Workout Session redesign

> Copy or merge this into your repo root as `CLAUDE.md` (Claude Code reads it automatically). It tells the agent how to work in THIS codebase. Pair it with `README.md` (the design spec) and `BUILD_PLAN.md` (the phased order) from the same handoff folder.

## What you're building
Recreate the redesigned **live Workout Session** screen described in `README.md` inside this existing app, and apply the **app-wide re-theme** (indigo → lime/cyan + Space Grotesk). The interactive reference is `Session Prototype (Flow).dc.html`; its `<script data-dc-script>` block is a faithful JS port of the app's own `buildInitialState` / `workoutReducer` / `reducerHelpers` plus the 5 proposed new reducer cases — use it as the logic spec.

## Project facts
- **Expo ~55 / React Native 0.81 / React 19 / TypeScript 5.9 (strict).**
- **Routing:** Expo Router (file-based, `app/`). **State:** React Context + a pure reducer (`context/WorkoutExecutionContext.tsx`, `context/workoutReducer.ts`). **Backend:** Firebase. **Charts:** Victory Native. **Animation:** Reanimated v4. **Icons:** `@expo/vector-icons` Ionicons. **Storage:** MMKV. **Haptics/Audio:** `expo-haptics`, `expo-audio`.
- **Fonts:** DM Sans (via `@expo-google-fonts/dm-sans`). You will ADD `@expo-google-fonts/space-grotesk`.
- **Path alias:** `@/` → repo root (e.g. `import { theme } from '@/theme/theme'`).

## Commands (run after every meaningful change)
```
npm install            # after adding the space-grotesk dependency
npm run compile        # tsc --noEmit — MUST stay clean (strict mode)
npm run lint           # eslint — MUST stay clean
npm run lint:fix       # autofix formatting
npm run test:run       # vitest once (CI mode) — add tests for new reducer cases
npm start              # Expo dev server (npm run ios / android / web)
```

## Conventions — match these exactly
- **No hardcoded colors, fonts, or magic spacing in components.** Everything goes through the `theme` object: `theme.colors.*`, `theme.fonts.*`, `theme.typography.*`, `theme.spacing.*`, `theme.radius.*`, `theme.shadows.*`. The hex values in `README.md` belong in `theme/theme.ts` as tokens, not inline. (The HTML prototype hardcodes hex only because it has no theme system — do not copy that habit.)
- **Styling = `StyleSheet.create`** at the bottom of each component, referencing theme tokens. Follow the patterns already in `components/workout/*` and `app/(tabs)/*`.
- **Keep the reducer pure.** New behavior = a new `WorkoutAction` in `types/workout.ts` + a `case` in `workoutReducer` + a unit test. Never mutate state; spread/return new objects (see existing cases and `reducerHelpers.ts`).
- **Reuse existing infrastructure** instead of re-inventing: `useElapsedTimer`, `useRestTimer`, `useEndWorkout`, `useKeypadState`→(now the stepper editor), `lib/haptics.ts`, `lib/toast.ts`, `ConfettiCelebration`, `components/common/*` (Button, ConfirmationModal, EmptyState, MaxWidthContainer).
- **Accessibility:** preserve the existing `accessibilityRole`/`accessibilityLabel`/`accessibilityLiveRegion` usage (the current session components are well-labeled — keep parity). Hit targets ≥ 44px.
- **Platform:** keep `Platform.OS` branches that already exist (web alert/confirm, iOS tab bar heights, haptics no-op on web).
- **No new dependencies** beyond `@expo-google-fonts/space-grotesk` without a clear reason.

## ⚠ Gotchas (read before coding)
1. **Lime is a LIGHT color.** Old `primaryTextOn` was white (good on indigo). After switching primary to lime `#C6F24E`, content sitting **on a primary fill must be dark `#0A0B0E`**. Set `primaryTextOn: '#0A0B0E'` and grep for white-on-primary (commands in README §"App-wide theming"). This is the #1 source of regressions.
2. **Rest ring:** the mock uses a CSS `conic-gradient` + `--ang`. In RN use `react-native-svg` `<Circle>` with `strokeDasharray`/`strokeDashoffset`, or extend the existing Reanimated rest component. Don't try to port the CSS.
3. **Don't hardcode the clock.** The prototype fakes time with a `now` tick; in-app drive elapsed + rest countdown from `useElapsedTimer` / `useRestTimer`.
4. **Natural completion:** today `CONFIRM_SET` on the last set leaves `isCompleted: false`. The redesign shows the recap on the last set — dispatch `COMPLETE_WORKOUT` when `findNextPendingSet` returns `null` (the prototype's `log()` does this). Confirm how the live screen currently reaches "Workout Complete!" and align.
5. **`EXPAND_EXERCISE` moves the active set** (free navigation) — that's existing, intended behavior, and the redesign relies on it. Tapping a collapsed exercise navigates into it.
6. **Stepper replaces the keypad.** `NumericKeypad`/`KeypadOverlay` go away for the common path; the inline editor (± / quick chips) is the new entry UI. Optionally keep a "tap value to type" affordance if the team wants arbitrary values (e.g. 142.5) — not in the mock.

## Definition of done (every phase)
- `npm run compile` and `npm run lint` clean; `npm run test:run` green.
- No literal hex / font strings / magic numbers in components — all via `theme`.
- No white-on-lime anywhere; every screen legible with the new accent.
- New reducer cases have unit tests (mirror the existing reducer test style in `__tests__/`).
- Behavior matches `README.md` and the `Session Prototype (Flow).dc.html` reference.

## Where to look
- Design spec + tokens + per-component detail: **`README.md`** (this folder).
- Phased build order with acceptance gates: **`BUILD_PLAN.md`** (this folder).
- Working logic to port: the `<script data-dc-script>` block inside **`Session Prototype (Flow).dc.html`**.
- Existing patterns to imitate: `app/programs/[id]/session/[index].tsx`, `components/workout/*`, `context/workoutReducer.ts`, `context/reducerHelpers.ts`, `theme/theme.ts`, `__tests__/`.
