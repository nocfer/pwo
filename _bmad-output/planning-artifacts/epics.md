---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics']
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# pwo - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for pwo, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can start a workout session from a selected program
FR2: User can view all exercises and their set completion status in a persistent compact overview
FR3: User can expand any exercise to access its set logging controls
FR4: User can navigate to any set in any exercise with a single action on the compact overview
FR5: User can complete sets and exercises in any order (non-linear)
FR6: System auto-expands the next pending exercise when all sets of the current exercise are completed
FR7: User can end a workout early, with remaining incomplete sets marked as skipped
FR8: User can view elapsed workout time throughout an active session
FR9: User can skip individual sets without completing them
FR10: User can confirm a pre-filled set with a single action
FR11: User can view pre-filled values for reps and weight before confirming a set
FR12: User can modify reps and weight values before confirming a set
FR13: User can edit a previously confirmed set's values and re-confirm
FR14: System discards uncommitted edits if user navigates away from an editing set without re-confirming
FR15: User can input numeric values using a large-button keypad optimized for gym conditions
FR16: User can confirm sets, navigate inputs, and dismiss the keypad using keyboard shortcuts on web
FR17: User can access exercise media and instructions from the active workout without losing workout state
FR18: User can view a looping video or GIF demonstration for an exercise
FR19: User can view text-based exercise instructions alongside the media demonstration
FR20: User can access exercise media from the exercise library browse view
FR21: System displays a graceful placeholder when exercise media is unavailable or the device is offline
FR22: System pre-fills set values from the user's last-logged values for that exercise
FR23: System pre-fills set values from program targets when no prior session history exists for that exercise
FR24: System automatically uses last-logged values over program targets once the user has completed at least one session with that exercise
FR25: System detects when a completed set exceeds the user's previous personal record for that exercise
FR26: System notifies the user of a new personal record immediately upon the record-breaking set completion
FR27: System persists the complete workout state to local storage on every state change
FR28: User can resume an active workout after phone lock, app backgrounding, battery death, OS force-quit, or app restart with no data loss
FR29: System resumes to the exact workout state without recovery dialogs, spinners, or re-navigation
FR30: System syncs completed workout data to the backend API silently in the background
FR31: System indicates sync status on the workout completion summary when the device is offline
FR32: System automatically syncs pending workout data when connectivity is restored
FR33: System provides haptic feedback on set confirmation, personal record detection, rest timer completion, and workout completion
FR34: System starts a rest countdown timer automatically after each set confirmation
FR35: Rest timer continues running when the user navigates between exercises
FR36: User can dismiss or skip the rest timer at any time
FR37: System sends a local notification when the rest timer completes while the app is backgrounded
FR38: User can view a workout completion summary displaying total time, total volume, sets completed, sets skipped, and personal records achieved
FR39: System plays a celebration animation upon workout completion
FR40: All screens render using a dark-first color theme with design system tokens
FR41: All new and existing screens receive updated visual styling through the design token system
FR42: The application provides identical feature behavior and visual presentation on iOS, Android, and Web
FR43: The workout execution screen renders in a phone-width container on larger screen sizes

### NonFunctional Requirements

NFR1: Set confirmation (pre-filled, single tap) completes in < 2 seconds end-to-end (tap to visual feedback)
NFR2: Set confirmation (with value edit) completes in < 5 seconds end-to-end (tap field to edit to confirm)
NFR3: Exercise navigation (tap matrix to expand) responds in < 200ms visual response
NFR4: Keypad appearance occurs in < 100ms after field tap
NFR5: Media modal opens in < 500ms to show modal and begin loading indicator
NFR6: Media playback starts in < 3 seconds on typical gym WiFi/LTE
NFR7: State persistence write completes in < 50ms per state change, non-blocking UI thread
NFR8: Workout resume (app reopen) restores full workout state in < 1 second
NFR9: Rest timer maintains +/- 1 second accuracy over a 5-minute period
NFR10: Zero workout data loss across all termination paths (battery death, OS kill, force-quit, app update, crash during write)
NFR11: 100% of state changes persisted before next user action
NFR12: Exact state restoration (exercise, set, timer, values) on resume from any termination
NFR13: All completed workouts eventually sync to API when connectivity is available
NFR14: Duplicate sync attempts produce no duplicate data (idempotency)
NFR15: App remains fully functional when media URLs are unreachable (graceful media degradation)
NFR16: App remains fully functional if notification permission is denied (graceful notification degradation)
NFR17: All pre-v1.2 features pass their existing test suites after every code change (zero regressions)
NFR18: Color contrast for primary text on all surfaces >= 4.5:1 ratio (WCAG AA)
NFR19: Color contrast for secondary text on all surfaces >= 4.5:1 ratio (WCAG AA)
NFR20: Touch target size >= 48pt for all interactive elements (WCAG 2.5.5 / Apple HIG)
NFR21: Every color-coded state has a redundant shape/icon indicator (color independence for color-blind safety)
NFR22: All interactive elements have accessible labels for screen readers (VoiceOver, TalkBack)
NFR23: Celebration animation respects prefers-reduced-motion system setting
NFR24: All primary workout actions reachable in bottom 2/3 of screen (one-handed gym usability)
NFR25: Firebase Auth handles all authentication flows with no custom auth implementation
NFR26: All API communication over HTTPS with no plain HTTP
NFR27: No sensitive data (passwords, tokens) stored in local workout state
NFR28: Firebase Auth manages session tokens and refresh exclusively

### Additional Requirements

**From Architecture:**

- No project initialization needed — brownfield project with existing production app at v1.1
- New dependency: `expo-video` for exercise media playback (looping video in ExerciseMediaModal, native AVPlayer/ExoPlayer)
- New dependency: `react-native-mmkv` for continuous workout state persistence (synchronous writes ~30x faster than AsyncStorage, <50ms NFR)
- New dependency: `expo-notifications` for rest timer background local notification (FR37)
- New backend endpoint: `GET /api/v1/exercises/prefill` returns last-logged weight/reps per exercise for authenticated user
- Backend modification: `POST /api/v1/stats/workouts` must support idempotency key for duplicate-safe sync from retry queue
- Workout state machine: `WorkoutExecutionContext` with `useReducer`, typed `WorkoutAction` union and `WorkoutState` interface as first deliverable
- State persistence shape: Single flat JSON object in MMKV (~5KB typical payload, sub-millisecond write), entire workout state serialized as one key
- Offline sync strategy: Silent retry queue via `SyncQueue` class, MMKV-backed, exponential backoff (2s, 4s, 8s), max 5 retries per cycle, retry on next foreground
- Decomposition strategy: Clean-room rebuild via temporary route (`[index]-v2.tsx`) alongside existing screen; old screen untouched during development
- Error boundary strategy: Per-feature React error boundaries around ExerciseMediaModal, WorkoutExecution provider tree, and CompletionSummary with state-aware recovery UI
- Exercise media strategy: Network-only fetch on demand, "Tap to retry" placeholder when offline (not static dead-end)
- MMKV requires custom dev client via EAS (already satisfied by existing `expo-camera` dependency)
- Timer architecture: Absolute timestamps (`Date.now()`) for rest timer and elapsed timer, not interval-based countdown
- Code quality: No file exceeds ~300 lines after decomposition
- State management: React Context API only (no Redux/Zustand — project rule)
- Implementation patterns: SCREAMING_SNAKE_CASE reducer actions, `pwo:` prefixed MMKV keys in centralized constants, semantic haptic functions via `lib/haptics.ts`
- Route swap plan: Delete monolith `WorkoutExecutionScreen.tsx`, rename `-v2` route to production path, remove legacy `hooks/session/` files

**From UX Design:**

- Dark-first design system: Complete `theme.ts` replacement with new color palette (deep charcoal backgrounds, indigo-400 primary, emerald/amber status), DM Sans typography, updated spacing/radius
- Hardcoded color audit: Grep all `.tsx` files for hardcoded hex values before theme swap — every hardcoded color becomes a contrast violation on dark backgrounds
- Font loading update: DM Sans weights (400 Regular, 500 Medium, 600 SemiBold, 700 Bold) replacing Inter in `app/_layout.tsx`
- Touch targets: 48pt minimum tappable area for all interactive elements; visual elements can be smaller inside 48pt touch target using hitSlop/padding
- SetDot component: 28pt visual, 48pt touch via hitSlop, 4 states (pending/active/completed/skipped) with shape+icon differentiation for color-blind safety
- NumericInput behavior: First digit typed replaces entire pre-filled value (not append) — matches common case of replacing a value
- NumericKeypad: Digits 0-9, backspace, Done only. No decimal points. Minimal build (~80 lines).
- SetRow: Fully controlled component with no local state. 4 states (pending/active/completed/editing). All values flow down from parent context.
- Editing completed sets: Pencil icon replaces set number, dashed primary border, uncommitted edits discarded on navigate away
- ExerciseAccordionItem: compact/expanded/completed/compact-active states, `react-native-reanimated` `withTiming` height animation
- RestTimerBar: Persistent between header and matrix, non-blocking, break-colored (cyan), workout-level (not exercise-specific)
- Only "End Workout" action gets confirmation modal — all other navigation is instant and reversible
- Back navigation (hardware back / swipe back) triggers "End Workout" confirmation to prevent accidental exit
- Responsive layout: Phone-width container (max 480pt) centered on larger screens, no layout changes between breakpoints
- Web keyboard shortcuts as progressive enhancement: Enter = confirm set, Tab = next field, Escape = dismiss keypad
- ScrollView with guard: ScrollView for <20 exercises, FlatList with `overrideItemLayout` fallback for >20
- Number inputs: `tabularNums` font feature or fixed-width container for layout stability when values change
- Ship theme migration as standalone PR before building new features on top
- Elevation via surface color steps (not shadows): background → surface → surfaceElevated
- Three overlay types only: NumericKeypad (bottom ~40%), ExerciseMediaModal (full ~85%), ConfirmationModal (centered dialog for End Workout only)
- Haptic feedback scale: Selection (light) for navigation, Medium impact for set confirm, Heavy impact for PR, Success notification for workout completion

### FR Coverage Map

FR1: Epic 2 - Start workout session from program
FR2: Epic 2 - View exercises and set completion in persistent compact overview
FR3: Epic 2 - Expand any exercise to access set logging controls
FR4: Epic 2 - Navigate to any set with a single action on compact overview
FR5: Epic 2 - Complete sets and exercises in any order (non-linear)
FR6: Epic 2 - Auto-expand next pending exercise on exercise completion
FR7: Epic 2 - End workout early with remaining sets marked skipped
FR8: Epic 2 - View elapsed workout time throughout session
FR9: Epic 2 - Skip individual sets without completing them
FR10: Epic 2 - Confirm pre-filled set with single action
FR11: Epic 2 - View pre-filled values before confirming
FR12: Epic 2 - Modify reps and weight before confirming
FR13: Epic 2 - Edit previously confirmed set and re-confirm
FR14: Epic 2 - Discard uncommitted edits on navigate away
FR15: Epic 2 - Large-button numeric keypad for gym conditions
FR16: Epic 2 - Keyboard shortcuts on web
FR17: Epic 6 - Access exercise media from active workout without state loss
FR18: Epic 6 - View looping video or GIF demonstration
FR19: Epic 6 - View text instructions alongside media
FR20: Epic 6 - Access exercise media from exercise library
FR21: Epic 6 - Graceful placeholder when media unavailable or offline
FR22: Epic 2 - Pre-fill from last-logged values
FR23: Epic 2 - Pre-fill from program targets (first session)
FR24: Epic 2 - Automatic pre-fill source switching
FR25: Epic 5 - Detect personal record on set completion
FR26: Epic 5 - Notify user of new PR immediately
FR27: Epic 3 - Persist complete workout state on every state change
FR28: Epic 3 - Resume after any termination with no data loss
FR29: Epic 3 - Resume to exact state without recovery dialogs
FR30: Epic 7 - Sync completed workout data to backend silently
FR31: Epic 7 - Indicate sync status on completion summary when offline
FR32: Epic 7 - Auto-sync pending data when connectivity restored
FR33: Epic 4 - Haptic feedback on key actions
FR34: Epic 4 - Auto-start rest timer after set confirmation
FR35: Epic 4 - Rest timer persists across exercise navigation
FR36: Epic 4 - Dismiss or skip rest timer at any time
FR37: Epic 4 - Local notification when rest timer completes while backgrounded
FR38: Epic 7 - Workout completion summary with stats
FR39: Epic 7 - Celebration animation upon workout completion
FR40: Epic 1 - Dark-first color theme with design tokens
FR41: Epic 1 - Updated visual styling through design token system
FR42: Epic 1 - Identical feature behavior across iOS, Android, Web
FR43: Epic 1 - Phone-width container on larger screens

## Epic List

### Epic 1: Dark Theme & Design System Foundation

The entire app displays a modern, dark-first theme optimized for gym environments with consistent cross-platform appearance. Every screen is readable under harsh gym fluorescents. Ships as a standalone PR before all other v1.2 work.
**FRs covered:** FR40, FR41, FR42, FR43

### Epic 2: Core Workout Logging Experience

Users can start a workout from a program, see all exercises in the matrix accordion, log sets in under 5 seconds with smart pre-filled values, navigate freely between exercises in any order, edit completed sets, use a gym-optimized numeric keypad, and complete or end workouts at their own pace. This is the core v1.2 thesis.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR22, FR23, FR24

### Epic 3: Workout State Persistence & Recovery

Users never lose workout data. State persists through phone lock, battery death, OS force-quit, and app restart. Resume is seamless — exact same exercise, same set, same values, no recovery dialogs or spinners.
**FRs covered:** FR27, FR28, FR29

### Epic 4: Rest Timer & Haptic Feedback

Users receive satisfying tactile feedback on set confirmations and other key actions. A non-blocking rest timer starts automatically after each set, persists across exercise navigation, and sends a local notification when the app is backgrounded.
**FRs covered:** FR33, FR34, FR35, FR36, FR37

### Epic 5: PR Detection & Achievement Notifications

Users are instantly notified when they break a personal record during their workout — amber badge on the set dot, heavy haptic pulse, and visual celebration. Surprise-and-delight that reinforces the habit loop.
**FRs covered:** FR25, FR26

### Epic 6: Exercise Media & Instructions

Users can tap an exercise name mid-workout to view a looping video/GIF demonstration and text instructions in a modal overlay, then return to exactly where they were with zero state loss. Media is also accessible from the exercise library. Graceful placeholder when offline or media unavailable.
**FRs covered:** FR17, FR18, FR19, FR20, FR21

### Epic 7: Workout Completion & Background Sync

Users see a celebration summary upon finishing their workout — total time, volume, sets completed vs. skipped, personal records highlighted — with confetti animation. Completed workout data syncs silently to the backend with reliable retry when offline.
**FRs covered:** FR30, FR31, FR32, FR38, FR39

## Epic 1: Dark Theme & Design System Foundation

The entire app displays a modern, dark-first theme optimized for gym environments with consistent cross-platform appearance. Every screen is readable under harsh gym fluorescents. Ships as a standalone PR before all other v1.2 work.

### Story 1.1: Replace Theme Tokens with Dark-First Design System

As a user,
I want the app to display a modern dark color theme with updated typography,
So that the interface is easy to read in gym lighting and feels polished and professional.

**Acceptance Criteria:**

**Given** the existing `theme/theme.ts` file with light theme tokens
**When** the theme file is replaced with the dark-first design system
**Then** all color tokens use the new dark palette (background #0B0C10, surface #14151A, surfaceElevated #1C1D24, primary #818CF8, etc.)
**And** new tokens `surfaceElevated`, `textInverse`, and `overlayGlass` are defined
**And** phase background tokens use solid hex values (not rgba) for cross-platform rendering consistency
**And** typography tokens reference DM Sans with all four weights (400, 500, 600, 700) and updated scale (display 32, h1 24, h2 18, body 16, bodyBold 16, caption 13, small 11)
**And** `app/_layout.tsx` loads DM Sans weights from `@expo-google-fonts/dm-sans` instead of Inter
**And** spacing `xxl` is updated from 32 to 40
**And** border radius values are updated to the sharper set (xs 4, sm 8, md 12, lg 16, xl 20, full 9999)
**And** shadow strategy is reduced to a single `sm` shadow for rare floating elements, with color-based elevation as primary depth strategy
**And** all preset objects (buttonPrimary, card, input, etc.) are rebuilt with dark values
**And** fonts load correctly on iOS, Android, and Web
**And** the existing test suite passes (`npm run test:run`)

### Story 1.2: Hardcoded Color Audit & Component Token Migration

As a user,
I want all screens to use the dark theme consistently without visual glitches from leftover light colors,
So that every part of the app feels cohesive and readable on the new dark background.

**Acceptance Criteria:**

**Given** the new dark theme tokens from Story 1.1 are in place
**When** all `.tsx` component files are audited for hardcoded hex color values
**Then** every hardcoded color is replaced with the corresponding theme token
**And** all primary text on all surfaces meets >= 4.5:1 contrast ratio (WCAG AA)
**And** all secondary text on all surfaces meets >= 4.5:1 contrast ratio (WCAG AA)
**And** no component imports color values directly — all colors come through `theme` tokens
**And** every existing screen (Home, Program Detail, Program Editor, Exercise Library, Progress) renders correctly with the dark theme
**And** the existing test suite passes (`npm run test:run`)

### Story 1.3: Cross-Platform Visual Parity & Responsive Layout Utility

As a user,
I want the app to look and behave identically whether I'm on my iPhone, Android phone, or laptop browser,
So that I have a consistent experience regardless of device.

**Acceptance Criteria:**

**Given** the dark theme is applied across the app
**When** the app is rendered on iOS, Android, and Web
**Then** all screens display identical colors, typography, spacing, and layout on all three platforms
**And** a reusable `MaxWidthContainer` component (or equivalent layout wrapper) exists that constrains content to 480pt width and centers it on screens wider than 430pt
**And** the `MaxWidthContainer` applies `spacing.xl` outer padding on expanded breakpoints (> 430pt)
**And** phase background solid hex colors render identically across iOS, Android, and Web (no rgba rendering inconsistencies)
**And** the compact breakpoint (< 375pt) reduces spacing scale by 1 step and font sizes by 1pt
**And** the existing test suite passes (`npm run test:run`)

## Epic 2: Core Workout Logging Experience

Users can start a workout from a program, see all exercises in the matrix accordion, log sets in under 5 seconds with smart pre-filled values, navigate freely between exercises in any order, edit completed sets, use a gym-optimized numeric keypad, and complete or end workouts at their own pace. This is the core v1.2 thesis.

### Story 2.1: Workout State Machine & Type Contracts

As a developer,
I want the workout state machine types and reducer to be defined and tested,
So that all components have a stable, reviewable contract to build against.

**Acceptance Criteria:**

**Given** no workout state management exists yet
**When** the workout types and reducer are implemented
**Then** `types/workout.ts` defines the `WorkoutState` interface, `WorkoutAction` union type (EXPAND_EXERCISE, LOG_SET, CONFIRM_SET, SKIP_SET, START_REST_TIMER, DISMISS_REST_TIMER, COMPLETE_WORKOUT, RESTORE_STATE), and `SetStatus` type (pending, active, completed, skipped, editing)
**And** `context/WorkoutExecutionContext.tsx` implements the `useReducer`-based provider with typed state and dispatch
**And** `hooks/workout/useWorkoutExecution.ts` provides the consumer hook that exposes state and action dispatchers (never raw dispatch)
**And** the reducer is a pure function with comprehensive unit tests in `__tests__/context/WorkoutExecutionContext.test.tsx` covering all action types
**And** EXPAND_EXERCISE collapses the previously expanded exercise and expands the new one
**And** CONFIRM_SET marks the set as completed and auto-expands the next pending set (same exercise first, then next exercise via forward scan with wrap-around)
**And** SKIP_SET marks the set as skipped without completing it
**And** COMPLETE_WORKOUT transitions the workout to a completed state
**And** the temporary route file `app/programs/[id]/session/[index]-v2.tsx` exists and mounts the `WorkoutExecutionContext.Provider`
**And** no file exceeds ~300 lines

### Story 2.2: Workout Header & Elapsed Timer

As a user,
I want to see my workout duration and program name at the top of the screen with a way to end the workout,
So that I always know how long I've been working out and can finish when ready.

**Acceptance Criteria:**

**Given** an active workout session started from a program
**When** the WorkoutHeader component renders
**Then** the elapsed time displays in `display` typography (32pt Bold) and counts up from 0:00 using absolute timestamps (`Date.now()` at workout start)
**And** the program name displays in the header
**And** an "End" button is visible with `danger` styling (dangerLight background, danger text, caption size)
**And** tapping "End" shows a confirmation modal ("End workout? X sets remaining") using the existing `ConfirmationModal` component
**And** confirming ends the workout with remaining pending sets marked as skipped (FR7)
**And** canceling dismisses the modal and returns to the workout
**And** hardware back / swipe back triggers the same "End Workout" confirmation (FR7)
**And** the timer continues counting accurately after phone lock and resume (absolute timestamps, not intervals)
**And** the header renders within the `MaxWidthContainer` on larger screens

### Story 2.3: SetDot Compact Indicators & ExerciseAccordion Structure

As a user,
I want to see all my exercises with their set completion status at a glance,
So that I always know where I stand in my workout without expanding every exercise.

**Acceptance Criteria:**

**Given** a workout is active with multiple exercises
**When** the workout matrix renders
**Then** each exercise displays as a compact row showing exercise name, set count meta ("2/4 · 70 lbs"), and a row of `SetDot` indicators
**And** `SetDot` renders at 28pt visual size with 48pt touch target (via hitSlop)
**And** `SetDot` correctly displays all 4 states: pending (outlined + number), active (primary fill + white number), completed (done-bg + checkmark icon), skipped (dashed border + dash icon)
**And** each state has both color AND shape/icon differentiation for color-blind accessibility
**And** tapping a `SetDot` on any exercise dispatches EXPAND_EXERCISE for that exercise and scrolls to it (FR4)
**And** only one exercise is expanded at a time — expanding one collapses the other
**And** the `ExerciseAccordion` uses `react-native-reanimated` `withTiming` for smooth height transitions between compact and expanded states
**And** completed exercises show in compact view with green exercise name and all dots checked
**And** all interactive elements have accessibility labels ("Set 1, completed", "Bench Press, 2 of 4 sets complete, tap to expand")

### Story 2.4: SetRow & NumericKeypad for Set Logging

As a user,
I want to log my sets using large, gym-friendly inputs that show my expected reps and weight,
So that I can quickly confirm or adjust values between sets without fumbling with tiny inputs.

**Acceptance Criteria:**

**Given** an exercise is expanded in the accordion
**When** the set rows render for that exercise
**Then** each `SetRow` displays: set number, reps `NumericInput`, weight `NumericInput`, and confirm checkmark button in a single horizontal line
**And** `SetRow` is a fully controlled component with no local state — all values flow from the workout context
**And** `SetRow` displays 4 states: pending (muted text, outlined checkmark), active (primary set number, ready checkmark), completed (green values, green checkmark with icon), editing (pencil icon, dashed primary border, re-confirm button)
**And** tapping a reps or weight field opens the `NumericKeypad` overlay from the bottom (~40% of screen)
**And** `NumericKeypad` displays digits 0-9, backspace, and Done in a grid layout with 48pt minimum button height and 8pt gaps
**And** the first digit typed replaces the entire pre-filled value (not appends)
**And** backspace deletes the last digit; if all digits deleted, shows "0"
**And** "Done" dismisses the keypad and moves focus to the next input (reps → weight → ready for confirm)
**And** tapping a different field moves focus without dismissing the keypad
**And** tapping outside inputs dismisses the keypad
**And** number inputs use `tabularNums` or fixed-width container for layout stability
**And** the confirm checkmark has a 44x44pt touch target with filled primary background and white icon
**And** all inputs and buttons meet the 48pt minimum touch target requirement

### Story 2.5: Set Confirmation & Non-Linear Navigation

As a user,
I want to confirm sets with a single tap and navigate freely between exercises,
So that I can log my workout at my own pace in whatever order suits my gym session.

**Acceptance Criteria:**

**Given** a set row is active with pre-filled values
**When** the user taps the checkmark button
**Then** the set is confirmed via CONFIRM_SET dispatch (FR10)
**And** the set dot turns green with a checkmark icon
**And** the next pending set in the same exercise becomes active with pre-filled values
**And** if all sets for the current exercise are completed, the exercise collapses and the next pending exercise auto-expands via forward scan with wrap-around (FR6)
**And** the user can tap any exercise row to expand it instantly with no confirmation dialog (FR5)
**And** the user can tap any set dot on any compact exercise to jump directly to that set (FR4)
**And** navigation between exercises is instant (< 200ms visual response)
**And** the user can complete sets in any order across any exercises (FR5)
**And** sets can be skipped individually without completing them via a skip action (FR9)
**And** "End Workout" marks all remaining pending sets as skipped (FR7)
**And** the scroll position auto-adjusts to center the expanded exercise (300ms animated scroll)

### Story 2.6: Edit Completed Sets

As a user,
I want to tap a completed set to correct a mistake in my logged values,
So that my workout data is accurate even if I entered something wrong.

**Acceptance Criteria:**

**Given** a set has been confirmed and shows as completed (green)
**When** the user taps the completed set dot or set row
**Then** the exercise expands (if not already) and the set row enters editing state
**And** in editing state, a pencil icon replaces the set number and the border changes to dashed primary
**And** the logged reps and weight values are displayed and editable via the NumericKeypad
**And** the user can modify values and tap the re-confirm button to save changes (FR13)
**And** re-confirming updates the stored values and returns the set to completed state
**And** if the user navigates away from an editing set without re-confirming, edits are discarded and original logged values are preserved (FR14)
**And** no data corruption occurs from abandoned edits

### Story 2.7: Pre-Fill Engine (Last-Logged & Program Targets)

As a user,
I want my sets to show the weight and reps I used last time (or the program's targets if it's my first time),
So that I can confirm most sets with a single tap instead of typing everything from scratch.

**Acceptance Criteria:**

**Given** a user starts a workout from a program
**When** the workout loads
**Then** the system calls `GET /api/v1/exercises/prefill` (or equivalent) to fetch last-logged values per exercise for the authenticated user (FR22)
**And** `hooks/workout/usePrefill.ts` implements the API call following the existing `useAsyncData<T>` pattern
**And** if last-logged values exist for an exercise, those values pre-fill all set rows for that exercise (FR22)
**And** if no last-logged values exist (first session), program target reps and weight are used as pre-fill (FR23)
**And** once the user has completed at least one session with an exercise, all subsequent sessions use last-logged values over program targets (FR24)
**And** pre-fill values are per-exercise (same values for all sets regardless of set number or completion order)
**And** if the pre-fill API call fails, program targets are used as fallback
**And** a loading skeleton displays while pre-fill data is being fetched
**And** pre-filled values display in the set row inputs before user interaction (FR11)
**And** the user can modify pre-filled values before confirming (FR12)

### Story 2.8: Web Keyboard Shortcuts

As a user on web,
I want to use keyboard shortcuts to log sets efficiently,
So that the desktop experience feels native and productive for reviewing or logging workouts.

**Acceptance Criteria:**

**Given** the workout execution screen is active on web
**When** the user presses keyboard shortcuts
**Then** Enter confirms the active set (equivalent to tapping the checkmark) (FR16)
**And** Tab moves focus to the next input field (reps → weight → next set) (FR16)
**And** Escape dismisses the NumericKeypad or active input (FR16)
**And** arrow keys are not required but can optionally navigate between exercises
**And** keyboard shortcuts are progressive enhancement — they do not appear on mobile
**And** all keyboard interactions produce the same state changes as their touch equivalents
**And** keyboard shortcuts do not interfere with system keyboard shortcuts or browser navigation

### Story 2.9: Visual Alignment with Approved Mockup

As a user,
I want the workout execution screen to match the approved dark-first design mockup,
So that the interface feels cohesive, flat, and minimalist as originally designed.

**Acceptance Criteria:**

**Given** the approved HTML mockup (`_bmad-output/planning-artifacts/ux-design-directions.html`, Direction A: Matrix Accordion) as visual baseline
**When** the workout components are rendered
**Then** `SetDot` uses `borderRadius: theme.radius.xs` (4px, rounded square) instead of `theme.radius.full`
**And** the confirm button in `SetRow` uses `borderRadius: theme.radius.sm` (8px, rounded rectangle) instead of `theme.radius.full`
**And** `ExerciseAccordionItem` compact rows render full-width with `borderBottom` dividers and no `borderRadius` or `marginBottom` gaps
**And** the expanded exercise area fills the full row width with `surfaceElevated` background (not a nested card)
**And** the expanded exercise title displays in `theme.colors.primary` (indigo) color
**And** input fields in `SetRow` use `borderRadius: theme.radius.sm` (8px)
**And** a thin progress bar appears at the bottom of the expanded exercise area showing set completion fraction
**And** all existing behavioral tests continue to pass
**And** the visual result matches the Direction A phone mockup in the HTML design directions file

## Epic 3: Workout State Persistence & Recovery

Users never lose workout data. State persists through phone lock, battery death, OS force-quit, and app restart. Resume is seamless — exact same exercise, same set, same values, no recovery dialogs or spinners.

### Story 3.1: MMKV Persistence Layer & Continuous State Saving

As a user,
I want my workout progress to be saved automatically after every action I take,
So that I never have to think about saving and never lose data.

**Acceptance Criteria:**

**Given** `react-native-mmkv` is installed as a project dependency
**When** the persistence layer is implemented
**Then** `lib/mmkv.ts` initializes the MMKV storage instance
**And** `lib/storage-keys.ts` defines all MMKV key constants with `pwo:` prefix (`WORKOUT_ACTIVE_STATE`, `WORKOUT_SYNC_QUEUE`, `WORKOUT_SESSION_ID`)
**And** `hooks/workout/useWorkoutPersistence.ts` subscribes to workout state changes from `WorkoutExecutionContext`
**And** every state change (set confirmation, exercise navigation, timer start, skip, edit) triggers an MMKV write
**And** the complete workout state (sets, values, expanded index, timer anchors, workout start timestamp) is serialized as a single JSON key
**And** MMKV writes complete in < 50ms and do not block the UI thread (NFR7)
**And** a unique workout session ID is generated at workout start and stored in MMKV
**And** unit tests in `__tests__/hooks/workout/useWorkoutPersistence.test.ts` verify write-on-every-change behavior
**And** no hardcoded storage key strings exist in any file — all keys imported from `lib/storage-keys.ts`

### Story 3.2: Seamless Workout Resume & State Restoration

As a user,
I want to reopen the app after my phone dies or I force-quit and see my workout exactly where I left it,
So that I can trust the app completely and never worry about losing my progress.

**Acceptance Criteria:**

**Given** a workout state has been persisted to MMKV
**When** the app launches or the workout screen mounts
**Then** `useWorkoutPersistence` checks for an active workout state in MMKV on mount
**And** if an active state exists, it dispatches RESTORE_STATE to load the complete persisted state into the reducer
**And** the workout resumes showing the exact exercise, set, input values, and expanded state from the persisted data (FR29)
**And** the elapsed workout timer recalculates from the persisted start timestamp using `Date.now()` (accurate after any pause duration)
**And** state restoration completes in < 1 second (NFR8)
**And** no recovery dialog, spinner, or "Resuming workout..." message is shown for normal backgrounding/lock scenarios (FR29)
**And** resume works identically for: phone lock, app backgrounding, battery death, OS force-quit, and app restart (FR28)
**And** if the persisted state is corrupted or unparseable, it is cleared and the user starts fresh (no crash)
**And** when a workout is completed, the persisted active state is cleared from MMKV
**And** integration tests in `__tests__/integration/workout-persistence.test.ts` verify the full persist → terminate → restore cycle

## Epic 4: Rest Timer & Haptic Feedback

Users receive satisfying tactile feedback on set confirmations and other key actions. A non-blocking rest timer starts automatically after each set, persists across exercise navigation, and sends a local notification when the app is backgrounded.

### Story 4.1: Rest Timer Bar with Background Notification

As a user,
I want a rest timer to start automatically after I complete a set and notify me when rest is done, even if I lock my phone,
So that I can rest the right amount between sets without watching the clock.

**Acceptance Criteria:**

**Given** a set has been confirmed
**When** the rest timer activates
**Then** the `RestTimerBar` component appears between the workout header and the exercise matrix (FR34)
**And** the timer counts down from the program's `restBetweenSets` value using absolute timestamps (`startTimestamp + durationMs - Date.now()`)
**And** the countdown displays in `body` typography (16pt) with break-colored (cyan) styling
**And** the timer bar shows: "Rest" label, countdown time, and a "Skip" button
**And** the timer maintains +/- 1 second accuracy over a 5-minute period (NFR9)
**And** the timer continues running when the user navigates between exercises — it is workout-level, not exercise-specific (FR35)
**And** the user can dismiss or skip the timer at any time with a single tap on "Skip" (FR36)
**And** when the timer finishes, the bar pulses briefly then auto-hides
**And** `hooks/workout/useRestTimer.ts` implements timer logic using absolute timestamps, with an injectable `now()` function for testing
**And** `expo-notifications` schedules a local notification at timer start that fires when the timer would complete ("Rest timer done — time for your next set") (FR37)
**And** the notification fires only when the app is backgrounded
**And** if notification permission is denied, the timer still works fully in-app — no error, no prompt (NFR16)
**And** notification permission is requested contextually on first workout start, not on app launch
**And** the timer bar has zero height when no timer is active (no empty space)

### Story 4.2: Semantic Haptic Feedback System

As a user,
I want to feel satisfying tactile feedback when I complete sets, hit PRs, and finish workouts,
So that each action feels confirmed and rewarding.

**Acceptance Criteria:**

**Given** the existing `lib/haptics.ts` abstraction
**When** semantic haptic functions are added
**Then** `haptics.setConfirmed()` fires medium impact haptic on set confirmation (FR33)
**And** `haptics.exerciseCompleted()` fires success notification haptic when all sets of an exercise are done
**And** `haptics.prDetected()` fires heavy impact haptic on personal record detection (FR33)
**And** `haptics.restTimerFinished()` fires light impact haptic when rest timer reaches zero (FR33)
**And** `haptics.workoutCompleted()` fires success notification haptic on workout completion (FR33)
**And** `haptics.navigationTap()` fires selection (light) haptic on exercise/set navigation
**And** all haptic calls go through `lib/haptics.ts` — no component directly imports `expo-haptics`
**And** all haptic functions gracefully no-op on web (no errors, no warnings)
**And** haptic functions are called from the correct trigger points: `SetRow` on confirm, `ExerciseAccordion` on all-sets-complete, `RestTimerBar` on timer finish, `CompletionSummary` on workout done
**And** unit tests in `__tests__/lib/haptics.test.ts` verify all semantic functions exist and call the correct haptic types

## Epic 5: PR Detection & Achievement Notifications

Users are instantly notified when they break a personal record during their workout — amber badge on the set dot, heavy haptic pulse, and visual celebration. Surprise-and-delight that reinforces the habit loop.

### Story 5.1: Per-Set PR Detection & Inline Notification

As a user,
I want to know immediately when I break a personal record on a set,
So that I feel a moment of achievement and can see my progress in real time.

**Acceptance Criteria:**

**Given** the user has historical workout data with previous best values per exercise
**When** a set is confirmed with weight or reps exceeding the user's previous personal record for that exercise
**Then** the system detects the new PR immediately on CONFIRM_SET (FR25)
**And** `hooks/workout/usePRComparison.ts` fetches the user's existing PR data on workout start (from the existing `POST /api/v1/stats/workouts` response `newPRs` pattern or a dedicated query)
**And** PR comparison happens locally after each set confirmation — no network call per set
**And** when a PR is detected, an amber badge with a star/trophy icon appears on the completed set dot (FR26)
**And** the PR badge persists on the set dot for the remainder of the workout
**And** `haptics.prDetected()` fires a heavy impact haptic immediately on PR detection (FR26)
**And** the PR badge uses `accent` color (#FBBF24) with `accentLight` background
**And** PR detection compares weight × reps (volume) or max weight, consistent with the existing backend PR logic
**And** PR data is surfaced to the completion summary for Epic 7 to display
**And** if PR data cannot be fetched (offline, API error), PR detection is silently skipped — workout logging is unaffected
**And** accessibility label on PR set dot: "Set 3, completed, new personal record"

## Epic 6: Exercise Media & Instructions

Users can tap an exercise name mid-workout to view a looping video/GIF demonstration and text instructions in a modal overlay, then return to exactly where they were with zero state loss. Media is also accessible from the exercise library. Graceful placeholder when offline or media unavailable.

### Story 6.1: Exercise Media Modal for Active Workouts

As a user,
I want to tap an exercise name during my workout to see a video demo of proper form,
So that I can check my technique between sets without losing my place.

**Acceptance Criteria:**

**Given** an exercise is expanded in the workout matrix
**When** the user taps the exercise name or demo button in the expanded header
**Then** the `ExerciseMediaModal` slides up as an overlay covering ~85% of the screen with a dark backdrop at 60% opacity (FR17)
**And** if the exercise has a `media` URL, a looping video or GIF plays immediately and silently using `expo-video` (FR18)
**And** the exercise `instructions` text displays below the media player (FR19)
**And** the modal is dismissed by swiping down or tapping the X button
**And** dismissing returns the user to the exact same workout state — same exercise expanded, same set focused, same input values (FR17)
**And** the rest timer continues counting behind the modal (no pause, no reset)
**And** no workout state changes occur while the media modal is open
**And** the modal renders on `surfaceElevated` background with proper dark theme tokens
**And** the `ExerciseMediaModal` component is built as a shared component importable from both workout execution and exercise library screens
**And** the modal wraps in its own `ErrorBoundary` — a media crash never takes down the workout

### Story 6.2: Exercise Library Media & Offline Placeholder

As a user,
I want to view exercise demos from the exercise library and see a clean placeholder when demos aren't available,
So that I can learn exercises outside of workouts and never see broken content.

**Acceptance Criteria:**

**Given** the `ExerciseMediaModal` component exists from Story 6.1
**When** the user accesses an exercise from the exercise library browse view
**Then** tapping the exercise opens the same `ExerciseMediaModal` with video/GIF and instructions (FR20)
**And** the modal behaves identically to the workout context (looping, silent, dismissible)
**And** when the exercise has no `media` URL (field is null or empty), the modal displays a clean placeholder where the video would be with only the text instructions visible (FR21)
**And** when the device is offline and the media URL cannot be loaded, the modal shows the placeholder with a "Tap to retry" action button (not a static dead-end) (FR21)
**And** tapping "Tap to retry" attempts to reload the media
**And** no broken image icon, error modal, or crash occurs when media is unavailable
**And** the instructions text alone is sufficient for a usable experience when media is missing
**And** media playback starts in < 3 seconds on typical gym WiFi/LTE (NFR6)
**And** the modal itself appears in < 500ms regardless of media load time (NFR5) — media loading indicator shown while video buffers

## Epic 7: Workout Completion & Background Sync

Users see a celebration summary upon finishing their workout — total time, volume, sets completed vs. skipped, personal records highlighted — with confetti animation. Completed workout data syncs silently to the backend with reliable retry when offline.

### Story 7.1: Completion Summary Modal with Celebration

As a user,
I want to see a summary of my workout when I finish — how long it took, how much I lifted, and any records I broke,
So that I feel a sense of accomplishment and can track my progress.

**Acceptance Criteria:**

**Given** a workout is completed (all sets confirmed or skipped, or user taps "End Workout" and confirms)
**When** the completion triggers
**Then** a confetti celebration animation plays using the existing `ConfettiCelebration.tsx` component (FR39)
**And** `haptics.workoutCompleted()` fires a success notification haptic
**And** the `CompletionSummary` modal displays: total workout time, total volume (sum of weight × reps across all completed sets), sets completed count, sets skipped count (FR38)
**And** if personal records were achieved during the workout (from Epic 5 PR data), they are displayed in a highlighted section with exercise names, values, and amber star/trophy icons (FR38)
**And** if no PRs were achieved, the PR section is omitted — the summary remains clean and encouraging
**And** a "Done" button navigates back to the program detail or home screen
**And** the celebration animation respects `prefers-reduced-motion` — users who disable animations see a static completion summary (NFR23)
**And** if all sets were skipped (early exit with no work done), no confetti plays — just a clean summary
**And** the `CompletionSummary` wraps in its own `ErrorBoundary` — a summary crash never loses workout data
**And** the modal renders on `surfaceElevated` with proper dark theme tokens

### Story 7.2: Background Sync Queue & Offline Reliability

As a user,
I want my completed workout to sync to the cloud automatically without me having to do anything,
So that my data is safe and accessible from any device.

**Acceptance Criteria:**

**Given** a workout has been completed
**When** the completion summary is shown
**Then** the system enqueues the completed workout data for sync via the `SyncQueue` class (FR30)
**And** `lib/sync-queue.ts` implements `SyncQueue` with `enqueue()`, `peek()`, and `dequeue()` methods, backed by MMKV storage
**And** `SyncQueue` sends `POST /api/v1/stats/workouts` with the workout session ID as an idempotency key
**And** the POST is dequeued only after receiving a 2xx response — if the app crashes mid-retry, the queue survives in MMKV
**And** retry policy uses exponential backoff (2s, 4s, 8s) with max 5 retries per attempt cycle
**And** retry cycles restart on next app foreground
**And** `hooks/workout/useSyncQueue.ts` provides a hook wrapper around `SyncQueue` for React integration
**And** a subtle `SyncIndicator` component shows sync status: hidden when synced, subtle dot when pending
**And** the completion summary displays a "Sync pending" indicator if the device is offline at workout end (FR31)
**And** when connectivity is restored, pending workouts sync automatically without user action (FR32)
**And** duplicate sync attempts produce no duplicate data on the backend — the idempotency key prevents duplicates (NFR14)
**And** sync happens silently in the background — no "Saving..." spinner, no blocking modal (FR30)
**And** unit tests in `__tests__/lib/sync-queue.test.ts` verify enqueue, dequeue, retry, and idempotency behavior
