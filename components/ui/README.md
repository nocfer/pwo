# Component Kit (`components/ui`)

The shared UI primitives for the app's **electric** design system (lime/cyan on
near-black + Space Grotesk). Every value comes from [`theme/theme.ts`](../../theme/theme.ts)
— **no hardcoded hex, fonts, or magic numbers** in components. This kit is the
source of truth; feature screens and the older `components/common/*` wrappers
assemble from it.

```ts
import {
  Button, Chip, Badge, TextField, Stepper, Segmented, Toggle, Checkbox,
  Card, ListRow, StatTile,
  Ring, Sheet, Toast, UndoToast, Banner
} from '@/components/ui'
```

## Conventions

- **Accessibility first** — every interactive primitive sets an a11y role +
  state and keeps its touch target ≥ 44px (via `minHeight`/`hitSlop`).
- **Motion** — press/slide animations use `theme.motion.*` and are gated behind
  `useReducedMotion()` so they snap instead of animate when the user opts out.
- **Lime is light** — content on a lime fill is dark (`colors.primaryTextOn`).

---

## Primitives

### Button
Primary action. `minHeight` 48 at `md`; `sm` keeps a ≥44 target via `hitSlop`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `label` | `string` | — | required |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'secondary'` | primary = lime fill + dark text; secondary = panel + border; ghost = lime text, no fill; danger = danger tint + danger text/border |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | heights 36 / 48 / 56 |
| `icon` | `Ionicons` name | — | leading icon, tinted to the foreground |
| `loading` | `boolean` | `false` | swaps label for a spinner, blocks press |
| `disabled` | `boolean` | `false` | recessed `disabledBg` fill + muted text |
| `fullWidth` | `boolean` | `false` | stretches to container |
| `onPress` | `() => void` | — | |

Pressed = scale `theme.motion.pressScale` (ghost dims instead).

### Chip
Filter / category pill. Selected (any tone) = lime fill + dark text.

| Prop | Type | Default |
|---|---|---|
| `label` | `string` | — |
| `tone` | `'neutral' \| 'strength' \| 'cardio' \| 'mobility' \| 'skill'` | `'neutral'` |
| `selected` | `boolean` | `false` |
| `onPress` | `() => void` | — (omit → static) |
| `disabled` | `boolean` | `false` |

Unselected `neutral` = panel + border + subtext; category tones render as their
tint bg + matching text.

### Badge
Tiny uppercase, tracked provenance/status label. Non-interactive.

| Prop | Type | Default |
|---|---|---|
| `label` | `string` | — (uppercased automatically) |
| `tone` | `'custom' \| 'coach' \| 'builtin' \| 'pr' \| 'new'` | `'custom'` |

`builtin` renders a leading lock glyph. `pr`/`new` are dark-on-lime.

### TextField
Themed input. Focus = lime border + lime caret.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` / `onChangeText` | `string` / `(t) => void` | — | controlled |
| `variant` | `'default' \| 'number' \| 'time'` | `'default'` | `number`/`time` = compact, center-aligned, Space Grotesk numerals; pick sensible keyboards |
| `placeholder` | `string` | — | |
| `keyboardType` | `KeyboardTypeOptions` | per-variant | overrides the variant default |
| `editable` | `boolean` | `true` | |
| `maxLength` | `number` | — | |

### Stepper
`−` / value / `+`. A11y `adjustable` with increment/decrement actions.

| Prop | Type | Default |
|---|---|---|
| `value` / `onChange` | `number` / `(n) => void` | — |
| `step` | `number` | `1` |
| `min` / `max` | `number` | ±∞ |
| `format` | `(n) => string` | — (e.g. `mm:ss` for rest) |

Each button disables at its bound; clamps to `[min, max]`.

### Segmented
2–3 mutually-exclusive options. Active = lime fill + dark text. Generic over the
option value type.

| Prop | Type |
|---|---|
| `options` | `{ value: T; label: string }[]` |
| `value` / `onChange` | `T` / `(v: T) => void` |

### Toggle
The spec's 46×28 switch. ON = lime track + dark knob; OFF = hairline track +
muted knob. Knob springs (or snaps under reduced-motion).

| Prop | Type | Default |
|---|---|---|
| `value` / `onChange` | `boolean` / `(v) => void` | — |
| `disabled` | `boolean` | `false` |
| `accessibilityLabel` | `string` | — |

### Checkbox
Square box. Lime fill + dark check when on; hairline outline when off.
Presentational unless `onPress` is supplied.

| Prop | Type | Default |
|---|---|---|
| `checked` | `boolean` | — |
| `onPress` | `() => void` | — (omit → static) |
| `disabled` | `boolean` | `false` |

---

## Containers

### Card
Themed surface. Pass `onPress` to make the whole card pressable.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `tone` | `'panel' \| 'elevated' \| 'accent'` | `'panel'` | panel = surface + border; elevated = overlay surface + `shadows.lg`; accent = lime tint + lime-tinted border |
| `padding` | `number` | `spacing.lg` | |
| `onPress` | `() => void` | — (omit → static `View`) | |

### ListRow
Selectable row: optional leading icon tile, title + meta, trailing affordance.

| Prop | Type | Default |
|---|---|---|
| `title` | `string` | — |
| `meta` | `string` | — |
| `leadingIcon` | `Ionicons` name | — (renders a 40×40 lime-tint tile) |
| `trailing` | `'chevron' \| 'check' \| 'none'` | `'chevron'` |
| `selected` | `boolean` | `false` (→ lime-tint bg + lime border; `check` fills) |
| `onPress` / `disabled` | `() => void` / `boolean` | — / `false` |

### StatTile
One metric — big Space Grotesk numeral over a label. Put in a `flex: 1` row for
the two-up stat grids.

| Prop | Type | Default |
|---|---|---|
| `value` | `string \| number` | — (tabular numerals) |
| `label` | `string` | — |
| `tone` | `'panel' \| 'accent'` | `'panel'` (accent = lime value on lime tint) |

---

## Overlays

### Ring
Presentational SVG progress ring. Drive `progress` (0..1) each tick; wrap the
value yourself for an animated sweep (see `UndoToast`).

| Prop | Type | Default |
|---|---|---|
| `progress` | `number` | — (0..1, fraction filled) |
| `size` | `number` | — |
| `stroke` | `number` | `4` |
| `color` | `string` | `colors.info` (cyan) |
| `trackColor` | `string` | `colors.border` |
| `label` / `children` | `string` / `ReactNode` | — (centered; `children` wins) |

### Sheet
Bottom sheet: grab handle + optional title + content over a tappable scrim.
Top corners `radius.sheet` (26), slides up.

| Prop | Type |
|---|---|
| `visible` / `onClose` | `boolean` / `() => void` |
| `title` | `string` (optional) |
| `children` | `ReactNode` |

### Toast
Transient bottom message with an optional action; auto-dismisses.

| Prop | Type | Default |
|---|---|---|
| `visible` | `boolean` | — |
| `message` | `string` | — |
| `actionLabel` / `onAction` | `string` / `() => void` | — |
| `durationMs` | `number` | `4000` |
| `onDismiss` | `() => void` | — (fired after `durationMs`) |

### UndoToast
Reversible-delete variant: a lime countdown ring commits the delete on completion;
`Undo` restores. Reduced-motion → commits on a timer with no sweep.

| Prop | Type | Default |
|---|---|---|
| `visible` | `boolean` | — |
| `message` / `subMessage` | `string` / `string` | — |
| `durationMs` | `number` | `5000` |
| `onUndo` / `onComplete` | `() => void` | — |

### Banner
Slim full-width status strip. Presentational — wrap in an animated container to
slide it (see `OfflineBanner`).

| Prop | Type | Default |
|---|---|---|
| `message` | `string` | — |
| `tone` | `'offline' \| 'info' \| 'success'` | `'info'` |
| `icon` | `Ionicons` name | — |
| `showDot` | `boolean` | `false` |

---

## Migration from `components/common`

These now re-export / adapt the kit (existing imports keep working but are
`@deprecated` — prefer `@/components/ui`):

| `common` | kit |
|---|---|
| `Button` | `Button` |
| `SegmentedControl` | `Segmented` |
| `ToggleSwitch` (`onValueChange`) | `Toggle` (`onChange`) |
| `SelectionCheckbox` | `Checkbox` |
| `UndoToast` | `UndoToast` |
| `OfflineBanner` | wraps `Banner` (+ connectivity & slide) |
| `workout/CountdownRing` | wraps `Ring` (+ session-cyan defaults) |

Containers (Card / ListRow / StatTile), overlays (Sheet / Toast / Banner / Ring),
and the remaining screen migrations land in later steps.
