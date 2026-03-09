# Story 1.3: Cross-Platform Visual Parity & Responsive Layout Utility

Status: ready-for-dev

## Story

As a user,
I want the app to look and behave identically whether I'm on my iPhone, Android phone, or laptop browser,
So that I have a consistent experience regardless of device.

## Acceptance Criteria

1. **Given** the dark theme is applied across the app **When** the app is rendered on iOS, Android, and Web **Then** all screens display identical colors, typography, spacing, and layout on all three platforms
2. A reusable `MaxWidthContainer` component (or equivalent layout wrapper) exists that constrains content to 480pt width and centers it on screens wider than 430pt
3. The `MaxWidthContainer` applies `spacing.xl` (24) outer padding on expanded breakpoints (> 430pt)
4. Phase background solid hex colors render identically across iOS, Android, and Web (no rgba rendering inconsistencies)
5. The compact breakpoint (< 375pt) reduces spacing scale by 1 step and font sizes by 1pt
6. The existing test suite passes (`npm run test:run`)

## Tasks / Subtasks

- [ ] Task 1: Create `hooks/useResponsiveLayout.ts` breakpoint hook (AC: #2, #3, #5)
  - [ ] 1.1 Create `hooks/useResponsiveLayout.ts` using `useWindowDimensions` from `react-native`
  - [ ] 1.2 Define breakpoint thresholds as constants: `COMPACT_MAX = 375`, `REGULAR_MAX = 430`
  - [ ] 1.3 Return breakpoint name (`'compact' | 'regular' | 'expanded'`), boolean helpers (`isCompact`, `isExpanded`)
  - [ ] 1.4 Return `containerStyle` object: `{ maxWidth: 480, alignSelf: 'center', width: '100%', paddingHorizontal: 24 }` for expanded, `{}` for regular/compact
  - [ ] 1.5 Return `compactAdjustments` for compact breakpoint: `{ spacingReduction: 1, fontSizeReduction: 1 }` — these are the step-down values components use to scale theme tokens
  - [ ] 1.6 Memoize return value with `useMemo` keyed on `width` to prevent re-renders when height changes
  - [ ] 1.7 Export barrel from `hooks/index.ts`
- [ ] Task 2: Create `components/common/MaxWidthContainer.tsx` (AC: #2, #3)
  - [ ] 2.1 Create `MaxWidthContainer` component accepting `children` and optional `style` prop
  - [ ] 2.2 Use `useResponsiveLayout` hook internally to get `containerStyle`
  - [ ] 2.3 On expanded breakpoint (> 430pt): apply `maxWidth: 480`, `alignSelf: 'center'`, `width: '100%'`, `paddingHorizontal: spacing.xl` (24)
  - [ ] 2.4 On regular and compact breakpoints: render children with no layout constraint (passthrough)
  - [ ] 2.5 Export from `components/common/` barrel if one exists, or use named export
  - [ ] 2.6 Props interface: `MaxWidthContainerProps = { children: React.ReactNode; style?: ViewStyle }`
  - [ ] 2.7 Component must be a simple `View` wrapper — no ScrollView, no SafeAreaView
- [ ] Task 3: Verify phase background cross-platform parity (AC: #4)
  - [ ] 3.1 Confirm `theme.colors.phases.*Bg` values are all solid hex (already verified: `warmupBg #1D1813`, `workingBg #1B1B28`, `breakBg #151D20`, `doneBg #161E1B`)
  - [ ] 3.2 Grep all `.tsx` files for any direct rgba usage applied as phase or workout-row backgrounds — flag any that bypass theme tokens
  - [ ] 3.3 If any rgba phase backgrounds found in components, replace with the corresponding solid hex from theme tokens
- [ ] Task 4: Verify cross-platform visual parity on existing screens (AC: #1)
  - [ ] 4.1 Verify `theme/theme.ts` contains no `Platform.OS` branching — all tokens are platform-agnostic (already confirmed)
  - [ ] 4.2 Verify shadow `boxShadow` property in `shadows.sm` is present for web rendering (already present: `'0 1px 3px rgba(0, 0, 0, 0.3)'`)
  - [ ] 4.3 Check `app/_layout.tsx` for any platform-conditional styling that could cause visual divergence
  - [ ] 4.4 Verify DM Sans fonts load on all three platforms (already done in Story 1.1 — `@expo-google-fonts/dm-sans` with 4 weights)
- [ ] Task 5: Write unit tests (AC: #6)
  - [ ] 5.1 Create `__tests__/hooks/useResponsiveLayout.test.ts` testing all 3 breakpoints
  - [ ] 5.2 Test compact breakpoint (width 360): returns `isCompact: true`, `compactAdjustments` with reduction values
  - [ ] 5.3 Test regular breakpoint (width 390): returns `isCompact: false`, `isExpanded: false`, empty containerStyle
  - [ ] 5.4 Test expanded breakpoint (width 768): returns `isExpanded: true`, containerStyle with maxWidth 480 and xl padding
  - [ ] 5.5 Test boundary values: 374, 375, 430, 431
  - [ ] 5.6 Create `__tests__/components/common/MaxWidthContainer.test.tsx` verifying the component renders children and applies container styles on expanded breakpoint
- [ ] Task 6: Run tests and verify compilation (AC: #6)
  - [ ] 6.1 Run `npm run compile` — zero NEW TS errors from this story's changes (pre-existing errors from Story 1.2 scope are expected)
  - [ ] 6.2 Run `npm run test:run` — new tests pass
  - [ ] 6.3 Run `npm run lint:fix` — all new files Prettier-compliant

## Dev Notes

### Architecture Constraints

- **Brownfield project:** PWO v1.1 is in production. This story adds new utility components and a responsive hook — no existing components are modified.
- **Static theme import pattern:** The project uses `import { theme } from '@/theme/theme'` as a static import, not a theme context. The responsive hook provides scaling adjustments that components apply on top of static theme tokens — it does NOT replace or wrap the theme.
- **No Platform.OS in business logic:** Cross-platform parity means identical behavior. The responsive system uses `useWindowDimensions` which is platform-agnostic. No `Platform.OS` branching.
- **MaxWidthContainer placement:** Per architecture, MaxWidthContainer is applied at route layout level, not deep inside components. It's created here and ready for use. Full integration into all screens happens as those screens are built/modified in later epics (specifically Epic 2's workout execution screen will use it).
- **Compact breakpoint is rare:** < 375pt applies to iPhone SE 1st gen and very small Android devices. The scaling should be minimal (1 spacing step, 1pt font size) to avoid a jarring difference.

### Responsive Breakpoint Reference

| Breakpoint | Width Range | Layout Behavior                                                     |
| ---------- | ----------- | ------------------------------------------------------------------- |
| `compact`  | < 375pt     | Reduce spacing scale by 1 step, font sizes by 1pt. Rare.            |
| `regular`  | 375-430pt   | Default design. All specs target this range. No layout constraints. |
| `expanded` | > 430pt     | Center content in 480pt container with xl outer padding.            |

Source: UX spec Responsive Design section + epics AC.

### MaxWidthContainer Spec

```typescript
type MaxWidthContainerProps = {
  children: React.ReactNode
  style?: ViewStyle
}
```

**Behavior:**

- expanded (> 430pt): `{ maxWidth: 480, alignSelf: 'center', width: '100%', paddingHorizontal: theme.spacing.xl }`
- regular/compact: passthrough (no layout constraints applied)

**Usage pattern (for later integration):**

```typescript
import { MaxWidthContainer } from '@/components/common/MaxWidthContainer'

// In a screen component:
<View style={presets.screenContainer}>
  <MaxWidthContainer>
    <ScrollView>
      {/* screen content */}
    </ScrollView>
  </MaxWidthContainer>
</View>
```

### Compact Breakpoint Scaling

The `useResponsiveLayout` hook returns `compactAdjustments` when width < 375pt. Components use these to scale theme tokens:

```typescript
const { isCompact, compactAdjustments } = useResponsiveLayout()

// Example: scaling spacing
const padding = isCompact
  ? theme.spacing.md // one step down from lg
  : theme.spacing.lg

// Example: scaling font size
const fontSize = isCompact
  ? theme.typography.body.fontSize - 1 // 15 instead of 16
  : theme.typography.body.fontSize
```

The hook provides the adjustment values; components apply them. This keeps the hook lightweight and the scaling logic visible at the call site.

### Phase Background Verification

Phase backgrounds in `theme/theme.ts` (lines 33-42) are already solid hex:

- `warmupBg: '#1D1813'` (orange 10% pre-computed on surface)
- `workingBg: '#1B1B28'` (indigo 10% pre-computed on surface)
- `breakBg: '#151D20'` (cyan 10% pre-computed on surface)
- `doneBg: '#161E1B'` (emerald 10% pre-computed on surface)

Non-phase rgba tokens (`primaryLight`, `accentLight`, `successLight`, etc.) are used as tint backgrounds on individual elements, not as phase backgrounds with overlapping views. These are safe for cross-platform use per the UX spec.

### Cross-Platform Parity Checklist

The following items are already satisfied by Stories 1.1 and 1.2:

- ✅ All theme tokens are platform-agnostic (no Platform.OS in theme.ts)
- ✅ Phase backgrounds are solid hex (not rgba)
- ✅ DM Sans fonts loaded with all 4 weights (400, 500, 600, 700) — cross-platform via @expo-google-fonts
- ✅ Shadow `boxShadow` property present in `shadows.sm` for web rendering
- ✅ StatusBar set to `"light"` for dark theme

Items this story adds:

- ⬜ MaxWidthContainer for expanded breakpoints (web/tablet)
- ⬜ Compact breakpoint scaling utilities
- ⬜ Responsive breakpoint hook for consistent responsive behavior

### Previous Story Learnings (Stories 1.1 & 1.2)

**What worked:**

- Token value replacement was mechanical and low-risk. Static theme import pattern is clean.
- Story 1.2's file-by-file task breakdown was very actionable for the dev agent.
- Pre-verified contrast ratios from UX spec saved manual checking.

**What went wrong:**

- Story 1.1 was marked complete while deprecated aliases still existed. **Do not mark tasks complete until actual file edits are done and verified.**
- Review #1 caught premature completion. **Run `npm run compile` after every batch of changes.**
- `npm run test:run` exits code 1 with "No test files found" — `__tests__/` directory is currently empty. This story creates the first test files. After this story, `npm run test:run` should exit 0 with passing tests.

**Pre-existing TS errors (not from this story):**

- `SharedValue` type error in `app/(tabs)/profile.tsx` — pre-existing
- `haptics.notifyWarning` in `components/common/ConfirmationModal.tsx` — pre-existing
- Removed token references (h3, captionBold, card, shadows.md, shadows.lg) across ~35 files — Story 1.2 scope

**Key verification:**

- `npm run compile` will show pre-existing errors. This story must not introduce NEW errors.
- `npm run test:run` should pass once test files are created.
- `npm run lint:fix` must be run on all new files.

### Prettier Rules (Project Enforced)

- No semicolons (`semi: false`)
- Single quotes (`singleQuote: true`)
- No trailing commas (`trailingComma: none`)
- Avoid arrow parens when possible (`arrowParens: avoid`)
- Run `npm run lint:fix` after all edits

### Imports & Conventions

- Path alias: `@/` for all imports
- Named exports for components and hooks (not default)
- `useWindowDimensions` from `react-native` (not Dimensions.get — hook is reactive)
- `useMemo` from `react` for memoizing derived values
- Test files: `*.test.ts` for hooks, `*.test.tsx` for components
- Test framework: Vitest with `vi.fn()` mocking

### Project Structure Notes

- `hooks/useResponsiveLayout.ts` — new file in existing `hooks/` directory (alongside existing hooks)
- `components/common/MaxWidthContainer.tsx` — new file in existing `components/common/` directory
- `__tests__/hooks/useResponsiveLayout.test.ts` — new test file (first test in `__tests__/hooks/`)
- `__tests__/components/common/MaxWidthContainer.test.tsx` — new test file
- No existing files are modified (except barrel export in `hooks/index.ts` if adding the re-export)
- Alignment with unified project structure: follows existing top-level separation (`hooks/`, `components/common/`, `__tests__/`)

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design] — Breakpoint strategy, MaxWidthContainer spec, platform priority
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation] — Touch targets, spacing, color palette
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] — FR43 MaxWidthContainer note
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Component props pattern, naming conventions
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — File organization
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3] — Acceptance criteria source
- [Source: _bmad-output/planning-artifacts/prd.md#Visual Design System] — FR42, FR43 requirements
- [Source: _bmad-output/planning-artifacts/prd.md#Mobile App Specific Requirements] — Platform targets, device permissions
- [Source: _bmad-output/project-context.md#Code Style & Formatting] — Prettier rules, import conventions
- [Source: _bmad-output/project-context.md#Testing Rules] — Vitest setup, test patterns, mock conventions
- [Source: _bmad-output/implementation-artifacts/1-1-replace-theme-tokens-with-dark-first-design-system.md] — Story 1.1 learnings, debug log, review findings
- [Source: _bmad-output/implementation-artifacts/1-2-hardcoded-color-audit-and-component-token-migration.md] — Story 1.2 token migration reference, previous story learnings

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
