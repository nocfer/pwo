---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-06'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-pwo-2026-03-06.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/project-context.md
  - openapi.json
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/data-models.md
  - docs/api-contracts.md
  - docs/development-guide.md
  - docs/source-tree-analysis.md
  - docs/breaking-changes.md
workflowType: 'architecture'
project_name: 'pwo'
user_name: 'Nocfer'
date: '2026-03-06'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (43 FRs across 7 categories):**

| Category                           | FRs                                                                                                       | Architectural Implication                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Workout Execution (FR1-FR9)        | Matrix accordion, non-linear navigation, auto-expand, early exit, skip sets                               | Single expanded exercise at a time, ScrollView with scroll-to management, workout state machine               |
| Set Logging & Input (FR10-FR16)    | Pre-fill, one-tap confirm, edit completed sets, NumericKeypad, web keyboard shortcuts                     | Fully controlled SetRow (no local state), custom keypad overlay, platform-specific input handling             |
| Exercise Media (FR17-FR21)         | Modal overlay, looping video/GIF, text instructions, graceful offline placeholder                         | Modal renders above workout without unmounting it, media component shared between workout and library         |
| Data Intelligence (FR22-FR26)      | Pre-fill from last-logged or program targets, automatic source switching, PR detection                    | Pre-fill engine as a pure function/hook, PR comparison against existing records from API                      |
| State Persistence (FR27-FR32)      | Persist on every state change, resume through any termination, silent background sync                     | Write-behind persistence layer, absolute timestamps for timers, sync queue for completed workouts             |
| Feedback & Celebration (FR33-FR39) | Haptics, auto-start rest timer, timer persists across navigation, local notifications, completion summary | Workout-level timer (not exercise-specific), notification scheduling at timer start, haptic abstraction layer |
| Visual Design (FR40-FR43)          | Dark theme tokens, cross-platform parity, phone-width container on larger screens                         | Complete theme.ts replacement, max-width container wrapper, no platform-specific UI divergence                |

**Non-Functional Requirements (Architecture-Shaping):**

| NFR                     | Target                     | Architecture Impact                                                                            |
| ----------------------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| Set confirm response    | < 2s end-to-end            | Optimistic UI updates, async persistence behind visual feedback                                |
| Exercise navigation     | < 200ms visual response    | LayoutAnimation or Reanimated for accordion, no network calls on navigation                    |
| State persistence write | < 50ms, non-blocking       | Async storage writes, never block the UI thread                                                |
| Workout resume          | < 1s to full state restore | Single storage key for complete workout state, deserialize on mount                            |
| Rest timer accuracy     | ±1 second over 5 minutes   | Absolute timestamps (Date.now()), not interval-based countdown                                 |
| Zero data loss          | All termination paths      | Write on every state change, not on graceful exit only                                         |
| Cross-platform parity   | 100% feature parity        | No Platform.OS branching in business logic, keyboard shortcuts as progressive enhancement only |
| Touch targets           | >= 48pt                    | hitSlop on SetDot (28pt visual → 48pt touch), full-height input fields                         |
| WCAG AA contrast        | >= 4.5:1                   | Pre-computed in UX spec, validated against all three surface levels                            |

**Scale & Complexity:**

- Primary domain: Cross-platform mobile app (React Native / Expo)
- Complexity level: Medium
- Estimated new architectural components: ~12 (10 components + 2-3 hooks + 1 context provider)
- Estimated refactored components: ~3 (WorkoutExecutionScreen, WorkoutMatrix, theme.ts)
- Backend changes: Minimal (new pre-fill endpoint + idempotency guard)

### Technical Constraints & Dependencies

**Hard Constraints:**

- Minimal backend changes — new pre-fill endpoint + idempotency guard on workout completion POST; all other v1.2 work is frontend-only
- Existing test suite (`npm run test:run`) must pass at every decomposition step
- No new npm dependencies without justification (Expo managed workflow preferred)
- No file exceeds ~300 lines after decomposition
- React Context API for state management (no Redux/Zustand — project rule)
- Prettier: no semicolons, single quotes, no trailing commas, avoid arrow parens

**Existing Infrastructure to Leverage:**

- `POST /api/v1/stats/workouts` already returns `newPRs` array — PR detection is server-side on workout completion
- Exercise entity already has `instructions` (string) and `media` (string URL) fields
- `GET /api/v1/workouts/:id?expand=blocks.exercise` returns exercise details including media URLs
- Existing `ConfettiCelebration.tsx`, `ConfirmationModal.tsx`, `Button.tsx`, `Skeleton.tsx` — restyle, don't rebuild
- Existing `useAsyncData<T>` pattern for all async hooks
- Existing `lib/haptics.ts` abstraction

**Unresolved Architecture Decision (from PRD):**

- Pre-fill data source: API query on session start vs. locally cached after each completed workout. The PRD defers this to architecture. We need to decide.

### Cross-Cutting Concerns Identified

1. **State Persistence** — Every component that modifies workout state must trigger a persistence write. The `WorkoutPersistenceProvider` wraps the entire execution screen and subscribes to state changes. This is the single most critical reliability concern.

2. **Dark Theme Migration** — Replacing `theme.ts` affects every component in the app (76+ components). The UX spec recommends shipping this as a separate PR before building new features. Token structure stays the same shape, so migration is mechanical.

3. **Haptic Feedback** — 6 distinct haptic trigger points (set confirm, exercise complete, rest timer finish, PR detected, workout complete, navigation). Centralized through existing `lib/haptics.ts`. Must gracefully no-op on web.

4. **Cross-Platform Input** — NumericKeypad is custom (not system keyboard) to guarantee identical behavior across iOS, Android, Web. Web adds keyboard shortcuts (Enter/Tab/Escape) as progressive enhancement.

5. **Animation Consistency** — Accordion expand/collapse, set completion, rest timer pulse, confetti. All use `react-native-reanimated` (already installed). Must respect `prefers-reduced-motion`.

6. **Accessibility** — Color-blind safety (every color state has a redundant shape/icon), 48pt touch targets, screen reader labels on all interactive elements. These requirements are embedded in every component, not a separate concern.

## Starter Template Evaluation

### Primary Technology Domain

Cross-platform mobile app (React Native / Expo) — **brownfield project, no initialization needed.**

### Existing Foundation Audit

PWO v1.1 is a production application with an established technology stack. v1.2 is a frontend-only release built on this existing foundation. No new project initialization, CLI scaffolding, or starter template is required.

**Established Stack (confirmed from project-context.md):**

| Layer        | Technology              | Version         | Status for v1.2                             |
| ------------ | ----------------------- | --------------- | ------------------------------------------- |
| Runtime      | React Native            | 0.83.2          | Sufficient                                  |
| Platform     | Expo (managed)          | ~55.0.4         | Sufficient                                  |
| Language     | TypeScript              | ~5.9.2 (strict) | Sufficient                                  |
| UI Framework | React                   | 19.2.0          | Sufficient                                  |
| Routing      | Expo Router             | ~55.0.3         | Sufficient                                  |
| State        | React Context API       | Built-in        | Sufficient — add WorkoutPersistenceProvider |
| Animation    | React Native Reanimated | ~4.1.1          | Sufficient — accordion expand/collapse      |
| Backend      | Firebase                | 12.10.0         | Sufficient — zero backend changes           |
| Testing      | Vitest                  | 2.1.0           | Sufficient                                  |
| Haptics      | expo-haptics            | ~15.0.8         | Sufficient                                  |
| Fonts        | @expo-google-fonts      | Installed       | DM Sans already in dependencies             |
| Camera/QR    | expo-camera             | ~17.0.10        | Existing (not needed for v1.2 new features) |

### New Dependencies for v1.2

| Dependency           | Purpose                                                       | Rationale                                                                                                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expo-video`         | Exercise media playback (looping video in ExerciseMediaModal) | Modern `useVideoPlayer` hook API, native AVPlayer (iOS) / ExoPlayer (Android), cross-platform including Web. GIFs render via `Image` component — no dep needed. Short exercise demos (< 10s) avoid known long-session looping bugs.                                                                   |
| `react-native-mmkv`  | Continuous workout state persistence (FR27)                   | Synchronous writes (~30x faster than AsyncStorage), critical for <50ms NFR on every state change. No async/await, no race conditions. **Requires custom dev client via EAS** — not compatible with Expo Go. Project already uses native modules (expo-camera) so likely already on custom dev builds. |
| `expo-notifications` | Rest timer background notification (FR37)                     | Standard Expo package for local notifications. Schedule at timer start, cancel on skip/dismiss. Permission requested on first workout start, not app launch.                                                                                                                                          |

### Architectural Decisions Already Established by Existing Codebase

- **Code organization:** Feature-based directory structure (components/program/, hooks/session/, etc.)
- **Component pattern:** Functional components with hooks, PascalCase files, named exports
- **State pattern:** React Context with custom hooks, `useAsyncData<T>` for async operations
- **Styling:** `StyleSheet.create` with theme tokens from `theme/theme.ts`, no CSS-in-JS library
- **API pattern:** All CRUD through `lib/api.ts` with Firebase auth tokens
- **Import convention:** Path alias `@/` for all imports
- **Testing:** `__tests__/` mirrors source structure, Vitest with `vi.fn()` mocking

### Timer Architecture Pattern

Rest timer and workout elapsed timer both use **absolute timestamps** (`Date.now()`), not interval-based countdown. On resume after backgrounding, remaining time is recalculated as `startTimestamp + durationMs - Date.now()`. This guarantees ±1 second accuracy regardless of how long the app was suspended.

**Note:** No project initialization story is needed. The first implementation work is the dark theme migration (`theme.ts` replacement), recommended as a standalone PR before building new features.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

1. Pre-fill data source → API query (new backend endpoint)
2. Workout state machine → `WorkoutExecutionContext` with `useReducer`
3. Workout state persistence shape → Single flat MMKV object
4. Component decomposition → Clean-room rebuild via temporary route

**Important Decisions (Shape Architecture):** 5. Accordion behavior → Context-owned (`expandedExerciseIndex` in reducer) 6. Offline workout sync → Silent retry queue with `SyncQueue` class 7. Error boundary strategy → Per-feature boundaries with state-aware recovery 8. Exercise media caching → Network-only with tap-to-retry fallback

**Deferred Decisions (Post-MVP):**

- Cross-device workout resume (would require backend active-state endpoint)
- Persistent media cache (revisit if users report slow media loading)
- Offline-first workout start (currently requires network for pre-fill API)

### Data Architecture

| Decision             | Choice                          | Rationale                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pre-fill data source | API query at workout start      | New backend endpoint returns last-logged weight/reps per exercise. Always fresh, multi-device consistent. Fallback to program target values on failure.                                                                                                                                                                         |
| Workout state shape  | Single flat JSON object in MMKV | Entire workout state (sets, values, expanded index, timer anchors) serialized as one key. ~5KB typical payload, sub-millisecond MMKV write. Simple restore on resume. **Define `WorkoutState` TypeScript interface and reducer action union type as the first deliverable** — this is the contract all components code against. |
| Exercise media       | Network-only, on demand         | Fetch from URL when user opens ExerciseMediaModal. Offline shows placeholder **with "Tap to retry" action** (not a static dead-end). No pre-fetch, no local cache. Short exercise demos don't justify cache complexity.                                                                                                         |

### Authentication & Security

No changes for v1.2. Existing Firebase ID Token authentication and API client configuration remain as-is. **Backend workout completion endpoint must support idempotency** (idempotency key sent with each POST) to handle retry queue duplicate submissions safely.

### API & Communication Patterns

| Decision                            | Choice                                                 | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Offline sync                        | Silent retry queue via `SyncQueue` class               | Failed `POST /api/v1/stats/workouts` queued in MMKV. `SyncQueue` exposes `enqueue()`, `peek()`, `dequeue()`. **Dequeue only after 2xx response** — if app crashes mid-retry, queue survives in MMKV. Retry policy: exponential backoff (2s, 4s, 8s), max 5 retries per attempt cycle, retry cycle restarts on next foreground. User sees success immediately (data safe locally). Subtle sync indicator until confirmed. |
| New endpoint: pre-fill              | `GET /api/v1/exercises/prefill` (or similar)           | Returns last-logged weight/reps per exercise for the authenticated user. Created by backend team. Frontend calls on workout start.                                                                                                                                                                                                                                                                                       |
| New endpoint: idempotent completion | `POST /api/v1/stats/workouts` with idempotency key     | Existing endpoint, but backend adds idempotency guard. Frontend generates a unique workout session ID at workout start, sends it with every completion POST. Backend ignores duplicates.                                                                                                                                                                                                                                 |
| Error handling                      | Per-feature error boundaries with state-aware recovery | Separate React error boundaries around ExerciseMediaModal, WorkoutExecution provider tree, and CompletionSummary. **Workout boundary recovery shows last known state summary** (e.g., "Bench Press, Set 3 of 4") so user trusts their data is safe before tapping "Resume."                                                                                                                                              |

### Frontend Architecture

| Decision               | Choice                                   | Rationale                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State machine          | `WorkoutExecutionContext` + `useReducer` | Typed reducer with explicit actions (EXPAND_EXERCISE, LOG_SET, START_TIMER, COMPLETE_WORKOUT, etc.). **Action union type and `WorkoutState` interface defined as standalone types file before any component work** — this is the reviewable contract. Pure function reducer → fully unit-testable (`workoutReducer.test.ts` covers 80% of business logic with zero mocking). |
| Accordion ownership    | Context-controlled                       | `expandedExerciseIndex` in reducer state. Persisted via MMKV (resume to exact position). Auto-expand next incomplete exercise handled as reducer state transition on SET_COMPLETED.                                                                                                                                                                                          |
| Decomposition strategy | Clean-room rebuild via temporary route   | Build new component tree at **temporary route** (`app/(tabs)/workout-v2.tsx` or similar) alongside existing screen. Develop and test in isolation. **Rename/swap route path when ready** — old screen stays functional throughout development, zero risk of breaking production flow during build phase.                                                                     |

### Infrastructure & Deployment

No changes for v1.2. Existing EAS build pipeline, environment configuration, and deployment workflow remain as-is. The addition of `react-native-mmkv` requires custom dev client (already in place due to `expo-camera`).

### Decision Impact Analysis

**Implementation Sequence:**

1. Dark theme migration (`theme.ts` replacement) — standalone PR, unblocks all new component work
2. `WorkoutState` interface + reducer action types — the contract, reviewable before any implementation
3. `WorkoutExecutionContext` + reducer implementation + `workoutReducer.test.ts`
4. MMKV persistence layer — subscribes to context, must exist before components rely on resume
5. `SyncQueue` class — MMKV-backed retry queue with `enqueue()`/`peek()`/`dequeue()`
6. Component tree build at temporary route (ExerciseAccordion → SetRow → NumericKeypad → RestTimer → etc.)
7. ExerciseMediaModal with tap-to-retry placeholder — independent, can parallelize with component tree
8. CompletionSummary + sync queue integration — post-workout flow
9. Error boundaries with state-aware recovery — wrap completed feature areas
10. Route swap — rename temporary route to production path, remove old screen

**Cross-Component Dependencies:**

- All workout components depend on `WorkoutExecutionContext` (decision #2)
- Persistence layer depends on state shape (decision #3) and context (decision #2)
- Accordion auto-expand depends on reducer having `expandedExerciseIndex` (decision #5 → #2)
- `SyncQueue` depends on MMKV being available (decision #6 → already installed for #3)
- Error boundaries are applied last, wrapping completed features (decision #7)
- Backend idempotency guard must be in place before retry queue goes live

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**6 critical conflict areas identified** where AI agents could make incompatible choices. These rules supplement the existing conventions in `project-context.md` — they apply specifically to v1.2 workout execution features.

### Naming Patterns

**Reducer Action Naming:**

- Format: `SCREAMING_SNAKE_CASE` with flat properties (no payload wrapper)
- All actions defined in the `WorkoutAction` union type in `types/workout.ts`
- Components dispatch actions via `useWorkoutExecution()` hook, never access dispatch directly

```typescript
type WorkoutAction =
  | { type: 'EXPAND_EXERCISE'; exerciseIndex: number }
  | {
      type: 'LOG_SET'
      exerciseIndex: number
      setIndex: number
      weight: number
      reps: number
    }
  | { type: 'CONFIRM_SET'; exerciseIndex: number; setIndex: number }
  | { type: 'START_REST_TIMER'; durationMs: number; startedAt: number }
  | { type: 'SKIP_SET'; exerciseIndex: number; setIndex: number }
  | { type: 'DISMISS_REST_TIMER' }
  | { type: 'COMPLETE_WORKOUT' }
  | { type: 'RESTORE_STATE'; state: WorkoutState }
```

**MMKV Key Naming:**

- Format: `pwo:` prefix with colon-delimited segments
- All keys defined as constants in a single file (`lib/storage-keys.ts`)

```typescript
export const STORAGE_KEYS = {
  WORKOUT_ACTIVE_STATE: 'pwo:workout:active-state',
  WORKOUT_SYNC_QUEUE: 'pwo:workout:sync-queue',
  WORKOUT_SESSION_ID: 'pwo:workout:session-id'
} as const
```

**Component Props & Callbacks:**

- Interface: `{ComponentName}Props` — exported, one per component file
- Callback props: `on{Event}` prefix (present tense for ongoing, past tense for completed)
- Internal handlers: `handle{Event}` prefix — never exposed as prop names
- No `I` prefix on interfaces

### Structure Patterns

**New v1.2 Directory Organization:**

```
hooks/workout/useWorkoutExecution.ts
hooks/workout/useRestTimer.ts
hooks/workout/usePrefill.ts
hooks/workout/usePRComparison.ts
components/workout/ExerciseAccordion.tsx
components/workout/SetRow.tsx
components/workout/NumericKeypad.tsx
components/workout/RestTimerBar.tsx
components/workout/ExerciseMediaModal.tsx
components/workout/CompletionSummary.tsx
components/workout/SyncIndicator.tsx
context/WorkoutExecutionContext.tsx
types/workout.ts
lib/storage-keys.ts
lib/sync-queue.ts
```

- Follows existing top-level separation (`hooks/`, `components/`, `context/`, `types/`, `lib/`)
- New `workout/` subdirectories use v1.2 terminology (not legacy "session")
- Each file stays under ~300 lines
- Tests mirror at `__tests__/hooks/workout/`, `__tests__/components/workout/`, etc.

### Process Patterns

**Loading, Empty, and Error States:**

| Phase                   | Pattern                           | UI                                                     |
| ----------------------- | --------------------------------- | ------------------------------------------------------ |
| Pre-workout loading     | `isLoading` boolean from hook     | Full-screen `Skeleton` (existing component)            |
| In-workout error        | `error` string from hook/boundary | Inline within affected component, never blocks workout |
| Media unavailable       | Network fetch fail                | Placeholder with "Tap to retry" action                 |
| Post-workout submission | Optimistic success                | Subtle `SyncIndicator` dot until 2xx confirmed         |

- State variable naming: always `isLoading` (boolean), `error` (string | null)
- Never use `loading`, `isFetching`, `hasError`, `isError`

**Accessibility Labels:**

- Format: Sentence-case, context-rich, action-oriented
- Every interactive element requires `accessibilityLabel`, `accessibilityHint`, and `accessibilityRole`

```typescript
accessibilityLabel={`Set ${setIndex + 1} of ${totalSets}, ${status}`}
accessibilityHint="Double tap to confirm set"
accessibilityRole="button"
```

**Haptic Feedback:**

- Always through `lib/haptics.ts` — never import `expo-haptics` in components
- Semantic function names describe _why_, not _how_
- Haptic intensity decisions are centralized, not per-component

```typescript
haptics.setConfirmed()
haptics.exerciseCompleted()
haptics.prDetected()
haptics.restTimerFinished()
haptics.workoutCompleted()
haptics.navigationTap()
```

### Enforcement Guidelines

**All AI Agents MUST:**

1. Import types from `types/workout.ts` — never re-define `WorkoutState`, `WorkoutAction`, or `SetStatus` locally
2. Use MMKV keys from `lib/storage-keys.ts` — never hardcode storage key strings
3. Dispatch actions through `useWorkoutExecution()` — never access the raw `dispatch` or context directly
4. Route haptic calls through `lib/haptics.ts` — never import `expo-haptics`
5. Follow the `isLoading`/`error` naming convention — linter will not catch this, code review must

**Anti-Patterns:**

```typescript
// BAD: Local state that duplicates reducer state
const [expanded, setExpanded] = useState(0)

// GOOD: Read from context
const { expandedExerciseIndex } = useWorkoutExecution()

// BAD: Hardcoded MMKV key
storage.set('workoutState', JSON.stringify(state))

// GOOD: Centralized key constant
storage.set(STORAGE_KEYS.WORKOUT_ACTIVE_STATE, JSON.stringify(state))

// BAD: Direct haptic call in component
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

// GOOD: Semantic haptic function
haptics.setConfirmed()
```

## Project Structure & Boundaries

### Complete v1.2 Directory Changes

New and modified files marked. Everything else unchanged from v1.1.

```
pwo/
├── app/
│   └── programs/
│       └── [id]/
│           └── session/
│               ├── [index].tsx                   # EXISTING: keep until swap (1256 lines)
│               └── [index]-v2.tsx                # NEW: temporary route for clean-room rebuild
│
├── components/
│   ├── common/
│   │   └── ErrorBoundary.tsx                     # NEW: reusable error boundary wrapper
│   │
│   ├── program/
│   │   └── WorkoutExecutionScreen.tsx            # EXISTING: untouched until route swap
│   │
│   └── workout/                                  # NEW DIRECTORY (v1.2)
│       ├── WorkoutExecutionView.tsx              # NEW: root component inside context provider
│       ├── ExerciseAccordion.tsx                 # NEW: single exercise expand/collapse
│       ├── ExerciseHeader.tsx                    # NEW: exercise name + progress dots
│       ├── SetRow.tsx                            # NEW: weight/reps input row + confirm
│       ├── SetDot.tsx                            # NEW: compact set status indicator
│       ├── NumericKeypad.tsx                     # NEW: custom input overlay
│       ├── RestTimerBar.tsx                      # NEW: persistent timer bar at bottom
│       ├── ExerciseMediaModal.tsx                # NEW: video/GIF overlay modal (shared with library)
│       ├── CompletionSummary.tsx                 # NEW: post-workout stats + PRs
│       ├── SyncIndicator.tsx                     # NEW: subtle sync status dot
│       └── WorkoutErrorRecovery.tsx              # NEW: state-aware error boundary UI
│
├── hooks/
│   ├── session/                                  # EXISTING: keep, not modified
│   │
│   └── workout/                                  # NEW DIRECTORY (v1.2)
│       ├── useWorkoutExecution.ts                # NEW: context consumer hook
│       ├── useRestTimer.ts                       # NEW: timer logic (absolute timestamps)
│       ├── usePrefill.ts                         # NEW: API call for pre-fill values
│       ├── useWorkoutPersistence.ts              # NEW: MMKV subscribe + write
│       ├── usePRComparison.ts                    # NEW: fetch existing PRs, compare per-set
│       ├── useSyncQueue.ts                       # NEW: hook wrapper around SyncQueue
│       └── index.ts                              # NEW: barrel export
│
├── context/
│   ├── AuthContext.tsx                            # EXISTING: unchanged
│   ├── DataContext.tsx                            # EXISTING: unchanged
│   └── WorkoutExecutionContext.tsx                # NEW: reducer + provider
│
├── types/
│   ├── workout.ts                                # NEW: WorkoutState, WorkoutAction, SetStatus
│   └── ... (existing unchanged)
│
├── lib/
│   ├── storage-keys.ts                           # NEW: MMKV key constants
│   ├── sync-queue.ts                             # NEW: SyncQueue class
│   ├── mmkv.ts                                   # NEW: MMKV instance initialization
│   ├── haptics.ts                                # MODIFY: add semantic functions
│   ├── api.ts                                    # MODIFY: add prefill endpoint call
│   └── ... (existing unchanged)
│
├── theme/
│   └── theme.ts                                  # MODIFY: dark theme token replacement (PR #1)
│
├── __tests__/
│   ├── context/
│   │   └── WorkoutExecutionContext.test.tsx       # NEW: reducer unit tests
│   ├── components/
│   │   └── workout/                              # NEW DIRECTORY
│   │       ├── ExerciseAccordion.test.tsx         # NEW
│   │       ├── SetRow.test.tsx                    # NEW
│   │       ├── NumericKeypad.test.tsx             # NEW
│   │       └── RestTimerBar.test.tsx              # NEW
│   ├── hooks/
│   │   └── workout/                              # NEW DIRECTORY
│   │       ├── useWorkoutExecution.test.ts        # NEW
│   │       ├── useRestTimer.test.ts               # NEW
│   │       └── useWorkoutPersistence.test.ts      # NEW
│   ├── lib/
│   │   ├── sync-queue.test.ts                    # NEW
│   │   └── haptics.test.ts                       # MODIFY: add semantic function tests
│   └── integration/
│       ├── workout-execution-flow.test.ts         # NEW: full workout flow
│       └── workout-persistence.test.ts            # NEW: persist + restore cycle
│
└── ... (config files unchanged)
```

### Architectural Boundaries

**Context Boundaries:**

```
┌─────────────────────────────────────────────────────────┐
│ app/programs/[id]/session/[index]-v2.tsx                 │
│ (route entry point — mounts providers, nothing else)     │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ WorkoutExecutionContext.Provider                     │ │
│  │ (reducer + state, wraps everything below)            │ │
│  │                                                      │ │
│  │  ┌───────────────────────────────────────────────┐   │ │
│  │  │ useWorkoutPersistence                          │   │ │
│  │  │ (subscribes to state, writes MMKV on change)   │   │ │
│  │  └───────────────────────────────────────────────┘   │ │
│  │                                                      │ │
│  │  ┌───────────────────────────────────────────────┐   │ │
│  │  │ ErrorBoundary (workout)                        │   │ │
│  │  │  └── WorkoutExecutionView                      │   │ │
│  │  │       ├── ExerciseAccordion (per exercise)     │   │ │
│  │  │       │    ├── ExerciseHeader + SetDots        │   │ │
│  │  │       │    └── SetRow (per set)                │   │ │
│  │  │       ├── NumericKeypad (overlay)              │   │ │
│  │  │       └── RestTimerBar (fixed bottom)          │   │ │
│  │  └───────────────────────────────────────────────┘   │ │
│  │                                                      │ │
│  │  ┌───────────────────────────────────────────────┐   │ │
│  │  │ ErrorBoundary (media)                          │   │ │
│  │  │  └── ExerciseMediaModal                        │   │ │
│  │  └───────────────────────────────────────────────┘   │ │
│  │                                                      │ │
│  │  ┌───────────────────────────────────────────────┐   │ │
│  │  │ ErrorBoundary (completion)                     │   │ │
│  │  │  └── CompletionSummary                         │   │ │
│  │  └───────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Data Flow Boundary:**

```
User Input (tap/type)
    ↓
Component (SetRow, NumericKeypad)
    ↓ dispatch(action)
WorkoutExecutionContext reducer
    ↓ new state
useWorkoutPersistence → MMKV (sync, <1ms)
    ↓ on workout complete
useSyncQueue → POST /api/v1/stats/workouts
    ↓ if fails
SyncQueue (MMKV) → retry on foreground
```

**API Boundaries (v1.2 additions only):**

| Endpoint                                        | Direction | Owner            | Consumer                        |
| ----------------------------------------------- | --------- | ---------------- | ------------------------------- |
| `GET /api/v1/exercises/prefill`                 | BE → FE   | Backend (new)    | `usePrefill.ts`                 |
| `POST /api/v1/stats/workouts` + idempotency key | FE → BE   | Backend (modify) | `SyncQueue` / `useSyncQueue.ts` |

### Requirements to Structure Mapping

| FR Category                        | Primary Files                                                                    | Supporting Files                                           |
| ---------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Workout Execution (FR1-FR9)        | `WorkoutExecutionView.tsx`, `ExerciseAccordion.tsx`, `ExerciseHeader.tsx`        | `WorkoutExecutionContext.tsx`, `useWorkoutExecution.ts`    |
| Set Logging & Input (FR10-FR16)    | `SetRow.tsx`, `NumericKeypad.tsx`, `SetDot.tsx`                                  | `types/workout.ts` (SetStatus)                             |
| Exercise Media (FR17-FR21)         | `ExerciseMediaModal.tsx`                                                         | `expo-video` dependency                                    |
| Data Intelligence (FR22-FR26)      | `usePrefill.ts`, `usePRComparison.ts`                                            | `lib/api.ts` (new endpoint call), existing `usePRs` hook   |
| State Persistence (FR27-FR32)      | `useWorkoutPersistence.ts`, `lib/mmkv.ts`, `lib/storage-keys.ts`                 | `WorkoutExecutionContext.tsx`                              |
| Feedback & Celebration (FR33-FR39) | `RestTimerBar.tsx`, `useRestTimer.ts`, `CompletionSummary.tsx`, `lib/haptics.ts` | `expo-notifications`, `ConfettiCelebration.tsx` (existing) |
| Visual Design (FR40-FR43)          | `theme/theme.ts`                                                                 | All components (token consumption)                         |

### Cross-Cutting Concerns Mapping

| Concern           | Files Affected                                                                     | Pattern                                                 |
| ----------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------- |
| State persistence | `WorkoutExecutionContext.tsx` → `useWorkoutPersistence.ts` → `lib/mmkv.ts`         | Context `useEffect` subscribes to state, writes to MMKV |
| Haptic feedback   | `SetRow.tsx`, `ExerciseAccordion.tsx`, `RestTimerBar.tsx`, `CompletionSummary.tsx` | All call `lib/haptics.ts` semantic functions            |
| Accessibility     | Every `components/workout/*.tsx`                                                   | Labels, hints, roles per enforcement guidelines         |
| Error recovery    | `WorkoutErrorRecovery.tsx`, `ErrorBoundary.tsx`                                    | Per-feature boundaries, state-aware recovery            |
| Dark theme        | `theme/theme.ts` → all components                                                  | Token replacement PR ships first                        |

### Route Swap Plan

When the clean-room rebuild is complete and tested:

1. Delete `components/program/WorkoutExecutionScreen.tsx` (the 1256-line monolith)
2. Rename `app/programs/[id]/session/[index]-v2.tsx` → `app/programs/[id]/session/[index].tsx`
3. Remove legacy `hooks/session/` files that are fully replaced
4. Update barrel exports in `hooks/index.ts` and `components/index.ts`

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility: PASS** — All technology choices (MMKV, expo-video, expo-notifications, useReducer) work together within Expo ~55 managed workflow. No contradictory decisions. MMKV custom dev client requirement is already satisfied by existing expo-camera dependency.

**Pattern Consistency: PASS** — Reducer actions (SCREAMING_SNAKE), storage keys (pwo: prefix), props ({ComponentName}Props), callbacks (on/handle) — all internally consistent and aligned with existing codebase conventions.

**Structure Alignment: PASS** — New workout/ directories follow existing top-level separation. Test mirroring follows **tests**/ convention. No structural conflicts with existing code.

### Requirements Coverage Validation

**43/43 Functional Requirements covered** (4 gaps identified and resolved during validation):

| Gap                                                      | Resolution Applied                                                                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR9: Missing `SKIP_SET` action                           | Added to `WorkoutAction` union type                                                                                                                     |
| FR20: ExerciseMediaModal not shared with library         | Annotated as shared component, importable from library screen                                                                                           |
| FR25/FR26: Per-set PR detection (not just at completion) | Added `usePRComparison.ts` hook — fetches existing PRs on workout start, compares locally after each CONFIRM_SET, surfaces inline notification + haptic |
| FR43: Phone-width container on web                       | Implementation note: `MaxWidthContainer` wrapper with `maxWidth: 428`, `alignSelf: 'center'` applied in route layout                                    |

**All 9 NFR performance targets addressed:**

| NFR                   | Architecture Support              |
| --------------------- | --------------------------------- |
| Set confirm < 2s      | Optimistic UI + async MMKV        |
| Navigation < 200ms    | Reanimated accordion, no network  |
| Keypad < 100ms        | Local component render            |
| State write < 50ms    | MMKV synchronous (~0.5ms)         |
| Resume < 1s           | Single MMKV key deserialize       |
| Timer ±1s             | Absolute timestamps               |
| Zero data loss        | Write every state change          |
| Cross-platform parity | No Platform.OS branching in logic |
| Sync idempotency      | Idempotency key on POST           |

**All 8 reliability + 7 accessibility requirements covered** by existing patterns (error boundaries, MMKV persistence, tap-to-retry, haptics abstraction, accessibility label convention, touch target hitSlop).

### Implementation Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High**

**Key Strengths:**

- Single source of truth (reducer) with clear action contract
- Persistence automatically handled at provider level — components don't think about it
- Pure function reducer is 80% of business logic, fully unit-testable with zero mocking
- Clean-room rebuild eliminates risk of breaking production during development
- Enforcement guidelines with anti-patterns prevent agent divergence

**Areas for Future Enhancement (Post-MVP):**

- Cross-device workout resume (requires backend active-state endpoint)
- Persistent media cache (revisit if gym WiFi proves unreliable for users)
- Offline-first workout start (currently requires network for pre-fill API call)
- Advanced/compact view modes for power users

### Architecture Completeness Checklist

- [x] Project context analyzed (43 FRs, 9+ NFRs, 6 cross-cutting concerns)
- [x] Foundation audit complete (12 existing technologies verified)
- [x] 3 new dependencies justified with rationale
- [x] 8 critical/important architectural decisions documented
- [x] 10-step implementation sequence with dependency order
- [x] 6 implementation pattern categories with enforcement rules
- [x] Complete directory tree (30+ new/modified files)
- [x] Context boundary and data flow diagrams
- [x] Requirements-to-file mapping for all 7 FR categories
- [x] Route swap plan for clean-room rebuild completion
- [x] All validation gaps identified and resolved

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Import types from `types/workout.ts`, keys from `lib/storage-keys.ts`
- Dispatch through `useWorkoutExecution()`, haptics through `lib/haptics.ts`
- Refer to this document for all architectural questions

**First Implementation Priority:**

1. Dark theme migration (`theme/theme.ts` replacement) — standalone PR, unblocks everything
2. `types/workout.ts` — WorkoutState interface + WorkoutAction union type (the contract)
3. `context/WorkoutExecutionContext.tsx` + reducer + `workoutReducer.test.ts`
