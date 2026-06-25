# Phase 0 — App-wide re-theme (execution plan)

> Scope: indigo → lime/cyan + Space Grotesk, app-wide, funneled through `theme/theme.ts`.
> Do Phase 0 **only**, then stop at the gate. No session-screen work, no reducer changes.

## Pre-flight findings (spec vs. real code)

- **Theme is the single funnel.** The only indigo hex anywhere lives in `theme/theme.ts`
  (`#818CF8`, `#6366F1`, the `rgba(129,140,248,...)` pair, `phases.working`). No component
  hardcodes indigo.
- **Contrast audit already passes.** `grep` for `#FFFFFF`/`#FFF`/`'white'` across `app/` +
  `components/` returns **nothing**. Every `backgroundColor: colors.primary` fill already pairs
  its text/icon with `colors.primaryTextOn` (Home hero, `Button`, Library FAB, `IconButton`,
  forms, `SetRow`/`SetDot`, etc.). Flipping `primaryTextOn` to dark fixes them all at once.
- **`react-native-svg@15.15.3` already installed** (needed later for the Phase 4 rest ring).
- **Font bootstrap** lives in `app/_layout.tsx` (`useFonts({ DMSans_400Regular, ... })`).

### Drift flagged (README assumptions that differ from reality)

1. **Heatmap is already green, not indigo.** `ConsistencyHeatmap.tsx` ramps
   `background → successLight → success` (emerald); its only `primary` ref is the selected-cell
   border (re-skins for free). → **No heatmap edit needed.**
2. **Charts read from theme** — no hardcoded indigo series in Victory components. → re-skin for free.
3. **Global background is `#0B0C10`, not `#0A0B0E`.** The README's `#0A0B0E` is the session-screen
   token (Phase 2). The migration section only recolors primary/phases/info, not the background.
   → leave `background` unchanged; use `#0A0B0E` only for `primaryTextOn` as specified.
4. **`session/[index].tsx` doneButton** uses `color: colors.background` (dark) on a primary fill,
   not `primaryTextOn`. Not a white-on-lime regression (dark-on-lime is correct), and that screen
   is rebuilt in Phase 2. → leave it.

## Changes

### 1. `theme/theme.ts` — colors

- `primary: '#C6F24E'`
- `primaryDark: '#AEDB37'`
- `primaryLight: 'rgba(198, 242, 78, 0.12)'`
- `primaryMuted: 'rgba(198, 242, 78, 0.25)'`
- `primaryTextOn: '#0A0B0E'` ⚠ was `#FFFFFF` (the breaking gotcha)
- add `info: '#56E0F0'`, `infoLight: 'rgba(86, 224, 240, 0.12)'`
- `phases.working: '#C6F24E'`, `phases.workingBg: '#1B1E14'`
- `phases.break: '#56E0F0'`
- Keep amber `accent`/`warning`, green `success`, `danger`, and global `background`/`surface` as-is.
- Update the stale `// Brand — indigo-400` comment.

### 2. `theme/theme.ts` — fonts + typography

- `fonts.display = 'SpaceGrotesk_700Bold'`
- `fonts.displayMed = 'SpaceGrotesk_600SemiBold'`
- `typography.display.fontFamily → fonts.display`
- `typography.h1.fontFamily → fonts.displayMed`
- Leave `h2`/`body`/`bodyBold`/`caption`/`small` on DM Sans (body/labels stay DM Sans).

### 3. Add dependency + font bootstrap

- `npm install @expo-google-fonts/space-grotesk` (only new dep allowed).
- In `app/_layout.tsx`, load `SpaceGrotesk_600SemiBold` + `SpaceGrotesk_700Bold` inside the
  existing `useFonts({...})` call, next to DM Sans.

### 4. Contrast audit (verify, expect clean)

Re-run after edits:

```
grep -rn "colors.primary\b" app components | grep -i "backgroundColor"
grep -rn "primaryTextOn" app components
grep -rn "#FFFFFF\|#FFF\b\|'white'" app components
```

Eyeball: Home hero, primary `Button`, Library FAB, tab-bar tint, heatmap/charts.

## Gate (Phase 0 definition of done)

- `npm run compile` clean (tsc strict).
- `npm run lint` clean.
- No white-on-lime anywhere; no new literal hex in components (all in `theme.ts`).
- Report results + concise diff summary + decisions, then **wait for approval** before Phase 1.

## Decisions (unless overridden)

- Keep global `background` (`#0B0C10`) unchanged.
- Only `typography.display` + `h1` switch to Space Grotesk; `h2` stays DM Sans.
- No heatmap/chart code edits (already green / theme-driven).
