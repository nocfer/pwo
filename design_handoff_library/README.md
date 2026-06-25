# Handoff: PWO Library redesign

## Overview
Redesign of the **Library** feature of the PWO (Progressive Workout) app in the new "electric" visual system (lime/cyan on near-black + Space Grotesk numerals). Covers the Library tab and its full create/import flow:

- **Library** (`app/(tabs)/library.tsx` + `components/data/UnifiedDataManager.tsx`) — Programs & Exercises tabs, search + filters, source badges, multi-select + bulk delete.
- **New / Edit Exercise** (`components/data/forms/ExerciseForm.tsx`) — name, category, icon (+ icon picker).
- **New / Edit Program** (`components/data/forms/ProgramForm.tsx`) — name, warmup & rest options, per-exercise reps/sets/rest with reorder & remove (+ exercise picker).
- **Scan QR** (`app/library/scan.tsx`) + **Import preview** (`app/library/import/preview.tsx`).

## About the design files
These are **design references created in HTML** — they show intended look + behavior, not code to paste. Recreate them in the existing React Native / Expo codebase using its patterns (`StyleSheet`, the `theme` object, Ionicons, `DataContext`).

> **Theme dependency:** this assumes the app-wide re-theme (indigo→lime/cyan + Space Grotesk) from the main redesign is in. If it isn't yet, do that first (it's a `theme/theme.ts` change) — see the [Design tokens](#design-tokens) below for the values these screens use. Lime is a *light* color: text/icons on a lime fill must be dark `#0A0B0E`.

### Files
- **`Library Redesign.dc.html`** — the Library tab: Programs view + Exercises view (filters + multi-select).
- **`Library Forms & Import Redesign.dc.html`** — New Exercise, Icon picker, New Program (builder), Scan QR, Import preview.
- **`New Program Builder v2.dc.html`** — the upgraded New Program builder (USE THIS for the program form): ±steppers, drag-to-reorder, a searchable multi-select add-exercises picker, and a per-exercise Advanced expand (per-set reps · timed · notes).
- `support.js` — runtime to open the `.dc.html` files in a browser.

## Fidelity
**High-fidelity.** Match colors, type, spacing, radii. Open the two `.dc.html` files in a browser to see the targets.

---

## Screens

### Library tab (`UnifiedDataManager`)
- **Header:** "Library" (`Space Grotesk 700 26px`) + two 42px circle buttons — Scan (surface) and Add (**lime**, dark glyph).
- **Segmented control** `[ Programs {n} | Exercises {n} ]` — active segment = lime fill + dark text, inactive = `#9A9DAB`. Replaces the current colored two-tab bar (drop the per-tab green/indigo).
- **Search row:** pill input (`#14161B`, border `#23262F`) + filter button; filter button active state = lime-tint bg + lime icon.
- **Programs list** — cards (`#14161B`, border `#23262F`, radius 18): icon tile, name, meta ("6 exercises · 3 sessions"), and a **source badge**:
  - Custom (user) → `#C6F24E` on `#1B1E14`
  - Coach (pt) → `#56E0F0` on `rgba(86,224,240,.1)`
  - Built-in → `#9A9DAB` on `#1c1e25`, with a small lock glyph
  - **Inline actions:** custom/editable programs show a **kebab** (⋯) → edit/delete; read-only (Built-in/Coach) show a chevron only. This mirrors the app's permission rules (built-ins can't be deleted).
- **Exercises** (`Library Redesign.dc.html`, right frame):
  - **Category filter chips** (All / Strength / Cardio / Mobility…) — active = lime; the filter panel maps to the existing `FilterControls` (category + source + sort).
  - Exercise rows: category-tinted icon tile, name, **category chip + source chip**. Category tints: Strength = lime, Cardio = cyan, Mobility/Flexibility = amber, Skill = green.
  - **Multi-select + bulk delete:** a "{n} selected · Clear" bar, lime check on selected rows, and a danger **Delete** toolbar (`#FB7185` on `#241317`). Keep the existing dependency-aware delete (built-ins blocked; in-use exercises blocked with the dependency modal).
- **Cleanup:** remove the dead `challenges` entry in `TAB_COLORS` (`app/(tabs)/library.tsx`) — Challenges were removed in v1.1.

### New / Edit Exercise (`ExerciseForm`)
- Header: close (X, surface circle) · "New Exercise" · **Save** (lime, dark text; disabled state when name empty).
- **NAME** — text field; focused = lime border + caret.
- **CATEGORY** — pills (Strength / Cardio / Flexibility / Skill); selected = lime fill + dark text.
- **ICON** — selector row (icon circle in lime tint + icon name + "Change"); opens the **Icon picker** bottom sheet: handle, "Choose icon", grid of icon tiles, selected tile = lime-tint bg + lime border. (Maps to `VALID_EXERCISE_ICONS`; render real Ionicons.)

### New / Edit Program (`ProgramForm`) — full builder
**Use `New Program Builder v2.dc.html` as the reference** (the version in `Library Forms & Import…` is the simpler first pass). Single-session. It must expose **every** option the current form has, with these UX upgrades:
- Header: close · "New Program" · **Save** (lime; disabled when name empty).
- **PROGRAM NAME** — text field (focused = lime border + caret).
- **OPTIONS** card (two iOS toggles, ON = lime track + dark knob): **Initial warmup** (amber icon, editable mm:ss pill → `initialWarmup.seconds`) and **Rest between exercises** (cyan icon, editable mm:ss → `defaultRestBetweenExercises`).
- **EXERCISES** header — live count + est. duration ("EXERCISES · 2 · ~28 MIN") and a "drag to reorder" hint.
- **Exercise blocks** — each card has: a **drag handle** (grip) for reorder, a **number badge**, the exercise name, a **delete** button, and a **±stepper row** for **Sets / Reps / Rest** (reuse the Session screen's stepper; Rest in mm:ss). Defaults: sets 3, rest 1:00.
- **Advanced** (collapsible per block) — reveals model features the old form hid:
  - **Type** segmented **Reps / Timed** (Timed → `durationSeconds` instead of reps).
  - **Per-set reps** toggle → one input box per set (e.g. 12 / 10 / 8 → `targetReps` as an array). When off, the single Reps stepper drives `targetReps` as a number.
  - **Note** field (→ `block.note`).
- **+ Add exercises** primary button → opens the **add-exercises picker** (next).
- **Add-exercises picker** (`New Program Builder v2.dc.html`, right frame): a full-screen sheet — **search** ("Search or create…"), **category filter chips**, **multi-select** rows with lime checks, a **Create new exercise** row (inline creation → routes to the Exercise form), and an **Add {n} exercises** confirm. Replaces the old "insert a blank row defaulting to the first exercise" flow.
- Keep the existing validation (sets ≥ 1, rest ≥ 0, warmup > 0 when enabled, ≥ 1 valid exercise) and haptics on add/remove/reorder/save. Reorder should be real drag-and-drop (e.g. a draggable FlatList); keep up/down as an a11y fallback if convenient.

### Scan QR (`scan.tsx` / `QRCodeScanner`)
- `ScreenHeader` "Scan QR code" + "Point at a program QR to import".
- Camera viewfinder (full-bleed `expo-camera`) with a centered framing box: **lime corner brackets** + an animated **lime scan line**.
- A secondary **"Import from file"** action and a "Camera access is required" hint. Keep the existing duplicate-scan debounce + decode→preview navigation.

### Import preview (`import/preview.tsx` / `ProgramImportPreview`)
- `ScreenHeader` "Import program" with back.
- **Program hero** card: name (`Space Grotesk 700 20px`) + source badge (Coach/etc.), description, and a stat row (exercises / sessions / ~min-per-session; the exercises count in lime).
- **INCLUDES** — a preview list of the program's exercises with `sets × reps` (e.g. "Barbell Bench Press  4 × 10") and a "+ N more" line.
- An **info note** (cyan-tint): "A copy is added to your library. Your data isn't shared back."
- Footer: **Cancel** (secondary) + **Add to library** (lime). Keep the existing `upsertProgram` import + error handling.

---

## Design tokens
**Colors** — surfaces: app bg `#0A0B0E`, panel `#14161B`, input/inset `#0E0F13`, hairline `#23262F`, active-card border `#2C3424`. Text: `#F2F3F5` / subtext `#9A9DAB` / muted `#6B6E7A` / faint `#5B5E6B`. Lime (primary) `#C6F24E`, on-lime `#0A0B0E`, lime tint `#1B1E14`, lime muted text `#9aa86a`. Cyan `#56E0F0` (+ `rgba(86,224,240,.1)`). Green `#34D399`. Amber `#FBBF24`. Danger `#FB7185` (tints `#241317` / `#1F1417`, border `#3a2226`).

**Type** — Space Grotesk (numerals, headings, big values); DM Sans (UI text, labels). Section labels: `DM Sans 600 10px, letter-spacing 1.4, uppercase, #5B5E6B`.

**Radius** — inputs/chips 10–14; cards 16–18; sheets 26; device 40. **Spacing** — screen padding 20; list gap 8–10.

## Assets
No image assets. Icons in the mocks are CSS shapes — in-app use **Ionicons** (already a dependency): `scan`, `add`, `close`, `chevron-down`/`up`/`forward`, `trash-outline`, `flame`, `timer`, `checkmark-circle`, plus the exercise glyphs in `VALID_EXERCISE_ICONS`.

## Target files
- `app/(tabs)/library.tsx` — header (lime Add), remove dead `challenges` color.
- `components/data/UnifiedDataManager.tsx` — segmented control, search/filter, selection + bulk toolbar, modals.
- `components/data/DataList.tsx` / `SearchableList.tsx` / item cards — program & exercise cards, source/category badges.
- `components/data/FilterControls.tsx` — category/source/sort chips in new tokens.
- `components/data/forms/ExerciseForm.tsx` — exercise form + icon picker.
- `components/data/forms/ProgramForm.tsx` — program builder + exercise picker (the detailed one).
- `app/library/scan.tsx` + `components/common/QRCodeScanner.tsx` — scanner framing.
- `app/library/import/preview.tsx` + `components/program/ProgramImportPreview.tsx` — import preview.
