# Handoff: State-kit + Undo (global)

## Overview
Two cross-cutting UX systems applied app-wide (not a single screen):

- **State-kit** — a consistent way every data-backed screen handles **Loading / Empty / Error / Offline**: skeletons over spinners, empties that point somewhere useful, an error state with retry + offline fallback, and a quiet offline/sync indicator (the app is offline-first).
- **Undo over confirm** — destructive actions (delete program / exercise / set) prefer a fast **"Deleted · Undo" toast** instead of a confirm dialog, keeping the dependency checks as guardrails.

Assumes the app-wide theme (lime/cyan + Space Grotesk) is in. Lime is a *light* color → dark content on lime fills.

### Files
- **`States & Undo.dc.html`** — canvas, 5 frames: Loading (skeletons), Empty, Error, Offline (banner + sync chip), Undo toast.
- `support.js` — to open it in a browser.

## Fidelity
High-fidelity. Tokens at the bottom.

---

## State-kit

### Loading — skeletons
Replace spinners with **shimmer skeletons** that mirror the real layout (card shape, avatar block, two text lines). The app already has `LoadingStateList` — extend that pattern so each list/screen ships a matching skeleton. Skeleton block `#1c1e25` on card `#14161B`; a moving `linear-gradient(90deg,transparent,rgba(255,255,255,.05),transparent)` sweep (~1.6s, staggered per row). Respect reduced-motion (static blocks).

### Empty — with a way forward
Centered: a soft icon tile (lime tint), a title, one helpful sentence, and **action(s)** that move the user forward (primary lime + optional secondary). Never a dead end. Standardize on the existing `EmptyState` component; require a contextual `actionLabel`/`onAction` per usage (e.g. Library → "Create a program" + "Scan a QR code"; Statistics → "Start your first workout").

### Error — retry + offline fallback
Centered: danger icon, title ("Couldn't load …"), one-line cause, a **Try again** button (lime), and — when cached data exists — a chip "Showing your last offline copy". Use the existing `ErrorScreen`, adding the retry callback + the offline-copy note. Distinguish *empty* (no data yet) from *error* (load failed).

### Offline — quiet banner + sync state
- A slim **offline banner** under the status bar (amber: `#1E1A10` / border `#3a3322`, `#FBBF24` text + dot) — "You're offline · changes are saved and will sync automatically". Slide in/out on connectivity change; mount globally (root layout) so it shows on any screen.
- A per-screen **sync chip** ("Synced 2h ago" muted; "Syncing…" when in flight) and a per-item **pending dot** (amber) on records edited offline and not yet synced. The app's offline-first layer + version counters already track stale data — surface it here.
- Optimistic writes: apply locally immediately, show the pending dot, reconcile on reconnect.

## Undo over confirm
For deletes (and other reversible destructive actions), **don't block with a confirm dialog**. Instead:
1. Remove the item from the list immediately (optimistic).
2. Show a bottom **toast**: a circular **5s countdown ring** (lime) + "Deleted "{name}"" + a sub line + an **Undo** button (lime tint). Auto-commit the delete when the ring completes; **Undo** restores the item in place.
3. Keep the **dependency guardrails**: if an item can't be safely deleted (e.g. an exercise used by programs), still show the existing `DependencyErrorModal` instead of the undo toast — that's a *blocked* action, not a reversible one.

This replaces the `ConfirmationModal` path in `UnifiedDataManager` for the common case. Bulk delete uses the same toast ("Deleted 3 programs · Undo"). Toast: `#1A1D24`, border `#2c303b`, radius 18, shadow; one toast at a time, dismiss on navigation (committing the pending delete first).

---

## Design tokens
- Surfaces: app bg `#0A0B0E`, panel `#14161B`, skeleton `#1c1e25`, hairline `#23262F`. Text `#F2F3F5` / subtext `#9A9DAB` / muted `#6B6E7A` / faint `#5B5E6B`.
- Lime `#C6F24E` (on-lime `#0A0B0E`, tint `rgba(198,242,78,.14)`). Danger `#FB7185` (tint `rgba(248,113,133,.1)`). Offline/amber `#FBBF24` (bg `#1E1A10`, border `#3a3322`).
- Type: Space Grotesk (titles/numerals), DM Sans (body/labels). Radius: cards 16, toast/banner 13–18.

## Assets / notes
- Skeleton shimmer: a Reanimated translateX sweep (or `react-content-loader`); don't ship the CSS keyframe.
- Undo countdown ring: `react-native-svg` `<Circle>` `strokeDashoffset` animated over 5s.
- Connectivity: `@react-native-community/netinfo` (or existing detection) to drive the offline banner.

## Target files
- `components/common/EmptyState.tsx` — enforce contextual action(s); use across Library / Statistics / Home empties.
- `components/common/ErrorScreen.tsx` — add retry + offline-copy note; split error vs empty.
- `components/data/LoadingStateList.tsx` (+ new per-screen skeletons) — skeleton system.
- New `components/common/OfflineBanner.tsx` + a sync-state selector in `context/DataContext.tsx`; mount the banner in the root layout.
- New `components/common/UndoToast.tsx` (or extend `lib/toast.ts`) — the countdown/undo toast.
- `components/data/UnifiedDataManager.tsx` — swap single + bulk delete from `ConfirmationModal` to the undo toast (keep `DependencyErrorModal` for blocked deletes).
