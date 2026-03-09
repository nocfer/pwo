---
stepsCompleted:
  [
    'step-01-init',
    'step-02-discovery',
    'step-02b-vision',
    'step-02c-executive-summary',
    'step-03-success',
    'step-04-journeys',
    'step-05-domain',
    'step-06-innovation',
    'step-07-project-type',
    'step-08-scoping',
    'step-09-functional',
    'step-10-nonfunctional',
    'step-11-polish'
  ]
classification:
  projectType: mobile_app
  domain: fitness
  complexity: low
  projectContext: brownfield
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-pwo-2026-03-06.md
  - _bmad-output/project-context.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/data-models.md
  - docs/api-contracts.md
  - docs/development-guide.md
  - docs/source-tree-analysis.md
  - docs/breaking-changes.md
  - openapi.json
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 7
  uxDesign: 1
  projectContext: 1
  openapi: 1
workflowType: 'prd'
project_name: 'pwo'
user_name: 'Nocfer'
date: '2026-03-06'
---

# Product Requirements Document - pwo

**Author:** Nocfer
**Date:** 2026-03-06

## Executive Summary

PWO v1.2 overhauls the workout execution experience for a cross-platform fitness tracker serving gym-goers from beginners to experienced lifters. The release replaces a rigid, timer-driven 1256-line monolithic workout screen with a Hevy-inspired, user-paced matrix accordion interface where users log sets at their own pace -- pre-filled values from their last session, one-tap confirmation, under 5 seconds per set. Alongside the UX redesign, v1.2 introduces exercise media support: short looping video/GIF demonstrations accessible one tap away during active workouts, putting form guidance exactly where users need it. The monolithic codebase is decomposed into clean, composable components and hooks. No backend changes are required. The trainer-trainee coaching platform is explicitly deferred to future phases but informs architectural decisions.

### What Makes This Special

**In-context exercise media during active workouts.** No major competitor integrates form demonstrations into the workout execution flow. Hevy has best-in-class logging speed but no media. JEFIT has exercise animations but a cluttered UI. PWO combines frictionless logging with in-context media in a single cross-platform experience.

**The workout is a set of tasks, not a sequence.** The matrix accordion provides full workout visibility with inline expansion for focused logging. Users can complete sets in any order, jump between exercises freely, and revisit completed sets -- matching how gym-goers actually think about their workouts. This non-linear navigation model is unique among workout trackers.

**Pre-fill, don't ask.** First session uses program targets; subsequent sessions use last-logged values per exercise. For most sets, the user just taps the checkmark. The app already knows what they're lifting -- they just confirm.

## Project Classification

| Attribute                | Value                                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Project Type**         | Mobile App (cross-platform: iOS, Android, Web via React Native/Expo)                                                                         |
| **Domain**               | Fitness / Health & Wellness                                                                                                                  |
| **Domain Complexity**    | Low (no regulatory requirements, standard authentication)                                                                                    |
| **Technical Complexity** | Moderate (cross-platform parity, real-time state, offline persistence)                                                                       |
| **Project Context**      | Brownfield -- existing production app at v1.1 with 76 components, 30 hooks, API-driven Firebase backend, recent major architectural refactor |
| **Scope**                | v1.2 -- WorkoutExecutionScreen redesign, exercise media integration, code quality refactor                                                   |

## Success Criteria

### User Success

**Set logging speed.** A user can log a complete set (see pre-fill → tap checkmark) in under 5 seconds. The common case (values correct, just confirm) takes 1 tap and ~1 second. Adjusting values takes 3 taps and ~4 seconds. If logging feels slower than writing "225x6" in a notes app, the redesign has failed.

**Workout completion rate.** Users who start a workout session finish it. Low mid-session abandonment indicates the UX isn't creating friction. Early exit ("End Workout" with pending sets) is a valid path, not a failure -- but should be rare.

**Media engagement.** Users tap into the exercise instruction/demo screen when encountering unfamiliar exercises. The feature is discoverable for those who need it (Ana persona) and invisible for those who don't (Marco persona). Media access never interrupts the logging flow.

**Return usage.** Users come back for their next gym session and open PWO. Retention through the first 4 sessions signals the tool has become part of their routine.

**State trust.** Users never experience data loss or need to think about saving. Resume after phone lock, app background, or process termination is seamless. Zero "did my workout save?" anxiety.

### Business Success

**Free public launch.** No monetization in v1.2. The goal is to ship a polished product that earns organic adoption through quality. Revenue is deferred to the trainer platform phase (v1.4).

**Foundation for growth.** v1.2 establishes PWO as a credible, high-quality workout tracker that can attract a broader user base. The architecture supports the trainer-trainee platform evolution without requiring another rewrite.

### Technical Success

**Monolith decomposition.** The 1256-line WorkoutExecutionScreen is decomposed into clean, composable components. No single file exceeds ~300 lines. The component hierarchy matches the UX spec (SetDot, NumericInput, SetRow, ExerciseAccordionItem, RestTimerBar, WorkoutHeader, CompletionSummaryModal, ExerciseMediaModal).

**Cross-platform parity.** All new features work identically on iOS, Android, and Web. Touch and keyboard interactions both feel native on their respective platforms.

**No regressions.** Progress tracking, QR sharing, programs, authentication, and all existing features continue working without regression after the redesign.

**Zero backend changes.** v1.2 is a frontend-only release. The existing API endpoints, data models, and Firebase backend are sufficient. The `instructions` and `media` fields on Exercise already exist.

### Measurable Outcomes

_Performance targets (set logging speed, UI response times) are defined in the Non-Functional Requirements section._

| Outcome                       | Target                 | Measurement                                |
| ----------------------------- | ---------------------- | ------------------------------------------ |
| Max file size (any component) | < 300 lines            | Static analysis                            |
| WorkoutExecutionScreen role   | Thin orchestrator      | Code review -- no business logic in screen |
| Cross-platform feature parity | 100%                   | Manual test on iOS, Android, Web           |
| Existing test suite           | All passing            | `npm run test:run`                         |
| Exercise media rendering      | Works on all platforms | Media URL renders as looping video/GIF     |

## User Journeys

### Journey 1: Marco Logs Push Day (Speed Path)

Marco parks his gym bag on the bench and opens PWO. He tapped into his "Push A" program before leaving the house -- the workout is already loaded. The WorkoutMatrix shows five exercises: Barbell Bench Press, Incline DB Press, Cable Flyes, Lateral Raises, Tricep Pushdowns. Each exercise displays small set dots -- four circles each. Everything is pending.

Bench Press is auto-expanded. Set 1 shows pre-filled values: 225 lb x 6 -- his last-logged numbers from Thursday. Marco racks the bar, glances at his phone, and taps the checkmark. The set dot turns green with a checkmark icon, a medium haptic pulse fires, and the rest timer starts counting down in a compact bar at the top. Set 2 auto-focuses with the same 225 x 6 pre-fill. He taps the checkmark again. Two taps, two sets, maybe four seconds of screen time total.

On set 3, Marco bumps the weight up. He taps the weight field -- the custom NumericKeypad appears with large, gym-friendly buttons. He punches 235, then taps the checkmark. A subtle amber PR badge appears on the set dot -- new personal record. Marco grins.

He finishes bench and the accordion auto-collapses, expanding Incline DB Press with its pre-filled values. But Marco decides to superset Cable Flyes with Lateral Raises instead. He taps set 1 on Cable Flyes in the matrix -- Incline instantly collapses, Cable Flyes expands. No confirmation dialog. The rest timer from his last bench set keeps counting in the top bar. Marco logs the flye, taps over to Lateral Raises, logs that, comes back to Cable Flyes set 2. The matrix dots tell him exactly where he stands across all exercises.

On web during his commute later, Marco reviews the workout on his laptop. The execution screen renders the same phone-width container. He notes that Enter confirms a set, Tab jumps between input fields, and Escape dismisses the keypad -- keyboard shortcuts that make quick edits feel native on desktop.

Twenty-eight minutes later, all dots are green. The completion summary modal appears: total time, total volume, sets completed, and his bench press PR highlighted with a trophy icon. Confetti animation fires. Marco screenshots it and closes the app. Data syncs to the API silently in the background.

**This journey reveals:** Matrix accordion navigation, pre-fill from last session, one-tap confirmation, non-linear exercise navigation, NumericKeypad, PR detection, rest timer persistence across exercises, completion summary, haptic feedback, workout-level timer, web keyboard shortcuts for cross-platform parity.

### Journey 2: Ana Checks Form on Face Pulls (Media Path)

Ana is three weeks into her first structured program. Her trainer built her a "Pull Day" plan with exercises she's still learning. Today's workout opens with Lat Pulldowns -- familiar enough. She logs three sets quickly using the pre-filled values from last session, tapping the checkmark each time.

Then Face Pulls comes up. Ana knows the name but isn't confident about her form. She taps the exercise name in the expanded header. The ExerciseMediaModal slides up as an overlay -- a looping GIF of the movement plays immediately, silent, auto-repeating. Below it, the `instructions` text explains grip width, cable height, and the squeeze at the top. Ana watches two loops, reads the cues, and taps to dismiss. She's back exactly where she was -- same exercise expanded, same set focused, rest timer still ticking. Zero state loss.

She logs set 1 at the program's target weight: 30 lb x 12. Feels light. On set 2 she taps the weight field and bumps it to 35. Taps the checkmark -- set confirmed, dot turns green.

Then she realizes she entered 35 on set 1 by mistake -- she meant to log 30 for that first set. She taps the green set 1 dot. The set row reopens in editing mode: a pencil icon replaces the set number, and the values appear with a dashed primary border indicating they're editable. Ana taps the weight field, corrects it back to 30, and taps the re-confirm button. The values update, the set collapses back to its green completed state. No data loss, no anxiety -- just a clean correction.

She finishes the workout methodically, exercise by exercise. The completion summary shows her total volume and time. No PRs today, but the summary is still clean and encouraging. Ana closes the app feeling confident she did each movement correctly.

**This journey reveals:** Exercise media modal (video/GIF), instructions text display, media access without state loss, pre-fill from program targets (early sessions), editing a completed set (pencil icon, dashed primary border, re-confirm), NumericKeypad for value adjustment, progressive media discovery (only when needed).

### Journey 3: Marco's Phone Dies Mid-Workout (Interruption Path)

Marco is four exercises into a heavy leg day. He's been logging sets for twenty minutes -- squats done, Romanian deadlifts done, halfway through leg press. His phone battery has been dropping and it finally dies at 2% while he's resting between sets.

Marco borrows a charger, boots his phone back up two minutes later, and opens PWO. The app loads directly into his active workout. The WorkoutMatrix shows his exact state: squats and RDLs fully green, leg press with sets 1 and 2 green, set 3 pending. The rest timer shows elapsed time since his last set. Marco taps the checkmark on set 3 and keeps going as if nothing happened.

In a separate session the following week, Marco is mid-workout when his phone freezes. He force-quits PWO from the app switcher and relaunches. Same result -- the workout is right where he left it. State was persisted continuously to local storage, not just on graceful exit. The app doesn't distinguish between a battery death, an OS kill, or a user force-quit. All paths recover identically.

Marco finishes his workout. At no point did he see a "recovering workout..." spinner or a "your data may be incomplete" warning. The persistence layer is invisible. It just works.

**This journey reveals:** Continuous state persistence (local storage), seamless resume after battery death, seamless resume after OS force-quit, workout timer continuity, no recovery UI/spinners, auto-save on every state change, identical recovery path regardless of termination reason.

### Journey 4: Ana's First Workout Ever in PWO (Onboarding)

Ana just signed up. Her trainer shared a program via QR code and she scanned it. The "Beginner Full Body A" program appears in her Programs tab with three exercises: Goblet Squat (3x10), Dumbbell Row (3x10), Dumbbell Bench Press (3x8).

She taps "Start Workout." The WorkoutMatrix appears -- three exercises, set dots all pending. Goblet Squat is auto-expanded with set 1 showing the program's target values: 20 lb x 10. This is Ana's first session, so there are no last-logged values -- the program targets are the pre-fill source. The dark theme is clean and legible under harsh gym fluorescents; the warm off-white text on deep charcoal background reduces eye strain between sets.

Ana finishes set 1 at the target weight and taps the checkmark. Green dot, haptic pulse, rest timer starts. The pattern is immediately obvious -- she doesn't need a tutorial. By set 3, she's logging without thinking about it.

On Dumbbell Row, she taps the exercise name to check form. The ExerciseMediaModal opens, and the looping demonstration plays. But when she gets to a supplementary exercise her trainer added -- a Cable Face Pull variant that doesn't have media uploaded yet -- tapping the exercise name opens the modal showing only the text instructions, with a clean placeholder where the video would be. No broken image icon, no error state. The instructions alone are enough for Ana to proceed.

She completes all nine sets. The completion summary shows her first workout stats: total time, total volume, all sets completed. The confetti animation fires -- her first PWO celebration moment. The data syncs silently.

Next session, she opens the same program. This time, set 1 of Goblet Squat shows 20 lb x 10 -- her last-logged values, which happen to match the program targets. The pre-fill source has switched from program targets to personal history, but Ana doesn't notice or care. It just shows the right numbers.

**This journey reveals:** QR program import, program target pre-fill (first session), pre-fill source switching (program → last-logged), dark theme readability in gym lighting, first-time user discoverability (no tutorial needed), exercise media graceful placeholder (missing media/offline), completion celebration, silent background sync, workout initiation flow.

### Journey Requirements Summary

| Journey                | Primary Capabilities Revealed                                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 - Marco Speed Path   | Matrix accordion, pre-fill (last-logged), one-tap confirm, non-linear nav, PR detection, NumericKeypad, rest timer, completion summary, web keyboard shortcuts  |
| 2 - Ana Media Path     | Exercise media modal, instructions display, state preservation on modal dismiss, editing completed sets (pencil + dashed border + re-confirm), value adjustment |
| 3 - Marco Interruption | Continuous auto-save, resume after battery death, resume after OS force-quit, invisible persistence, identical recovery paths                                   |
| 4 - Ana Onboarding     | QR import, program target pre-fill, pre-fill source switching, first-use discoverability, media graceful placeholder (missing/offline), completion celebration  |

**Cross-journey prerequisites:** Dark-first theme (DM Sans, indigo-400 primary, color-based elevation) underpins all four journeys as a foundational design system requirement, not a feature of any single journey.

**Coverage check:**

- Primary user, success path: Journey 1 (Marco) + Journey 4 (Ana)
- Primary user, edge cases: Journey 2 (media + editing recovery) + Journey 3 (interruption + force-quit)
- Admin/trainer user: Deferred -- trainer platform is v1.4 scope
- API consumer: N/A for v1.2 (frontend-only release)

## Mobile App Specific Requirements

### Platform Requirements

| Platform | Target                                          | Framework                          |
| -------- | ----------------------------------------------- | ---------------------------------- |
| iOS      | iPhone SE+ (iOS 16+)                            | React Native 0.83.2 / Expo ~55.0.4 |
| Android  | Android 10+ (API 29+)                           | React Native 0.83.2 / Expo ~55.0.4 |
| Web      | Modern browsers (Chrome, Safari, Firefox, Edge) | React Native Web via Expo          |

Single codebase, cross-platform. The workout execution screen renders in a phone-width container (max 480pt) on all screen sizes. Web gets keyboard shortcuts as progressive enhancement (Enter = confirm set, Tab = next field, Escape = dismiss keypad). No platform-specific UI divergence -- one layout, consistent behavior.

### Device Permissions

| Permission          | Purpose                                            | Required?                                          |
| ------------------- | -------------------------------------------------- | -------------------------------------------------- |
| Haptic feedback     | Set confirmation, PR detection, workout completion | Optional (graceful no-op if unavailable)           |
| Local notifications | Rest timer completion when app is backgrounded     | Required for full experience                       |
| Camera (QR scanner) | Program sharing via QR code import                 | Required for QR feature                            |
| Network             | API sync, exercise media loading                   | Required for sync; workout execution works offline |

No GPS, Bluetooth, microphone, biometric, or health kit permissions required in v1.2.

### Offline Mode

**Local-first workout execution.** All set logging, navigation, timer state, and workout completion happen on-device with zero network dependency. State persists to local storage continuously (every state change). Background sync to the API occurs when connectivity is available.

**Media requires network.** Exercise video/GIF demos require an active connection. When offline or when media is unavailable, the ExerciseMediaModal displays text instructions with a clean placeholder where the video would be. No broken states, no error modals.

**Sync strategy:** Silent background sync. No "Saving..." spinners. "Sync pending" indicator on completion summary if offline at workout end. Auto-syncs when connectivity returns.

### Push / Local Notification Strategy

**v1.2 scope: Local notifications only.** No remote push notifications.

| Notification        | Trigger                                      | Content                                     | Platform            |
| ------------------- | -------------------------------------------- | ------------------------------------------- | ------------------- |
| Rest timer complete | Timer reaches zero while app is backgrounded | "Rest timer done -- time for your next set" | iOS + Android + Web |

No notification permission is requested until the user starts their first workout. The notification fires only when the app is backgrounded during an active rest timer. Web uses the Notifications API with the same permission flow.

**Deferred (post-v1.2):** Workout reminders, trainer messages, social notifications. These require remote push infrastructure.

### Store Compliance

**App Store (iOS):**

- No IAP or subscriptions in v1.2 (free app). No App Store payment requirement.
- No health data claims -- workout data is user-entered, not sensor-derived. No HealthKit integration.
- Firebase Auth handles account creation/deletion (Apple Sign-In compliance if offered).
- Standard privacy nutrition label: email, workout data, exercise preferences.

**Google Play (Android):**

- Data safety section: workout logs, exercise data, authentication credentials.
- No restricted content categories.
- Target SDK compliance per current Google Play requirements.

**Both platforms:**

- No user-generated content moderation needed in v1.2 (no social features).
- Exercise media is served from controlled URLs, not user uploads.
- Privacy policy required covering Firebase Auth data and workout data collection.

### Implementation Considerations

- **Expo managed workflow** preferred where possible. Haptics via `expo-haptics`, notifications via `expo-notifications`, camera/QR via `expo-camera` or `expo-barcode-scanner`.
- **Local storage** for workout state persistence: AsyncStorage or MMKV for key-value state. Must survive app termination and OS kills.
- **Media caching** deferred to post-v1.2. Exercise media fetched fresh each time in v1.2 (simplicity over optimization).
- **Background timer accuracy** varies by platform. Local notification scheduled at timer start ensures the user gets notified even if the OS suspends the app process.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP -- validating that PWO's specific execution model (matrix accordion, in-context media, sub-5-second logging) earns a place in gym-goers' routines. The market for workout trackers is proven; the hypothesis is that this UX approach is meaningfully better.

**Resource Requirements:** Solo developer (Nocfer). Frontend-only release -- no backend changes, no infrastructure provisioning. Expo managed workflow for cross-platform delivery from a single codebase.

**Scope governance:** After this PRD is finalized, additions to v1.2 scope require explicit justification that the feature is (a) necessary for the core thesis to land, and (b) low enough in implementation cost that it doesn't push other must-haves. All other ideas go to Phase 2+.

### MVP Feature Set (Phase 1 -- v1.2)

**Core User Journeys Supported:**

- Journey 1 (Marco Speed Path): Full matrix accordion logging flow
- Journey 2 (Ana Media Path): Exercise media access + set editing
- Journey 3 (Marco Interruption): State persistence and recovery
- Journey 4 (Ana Onboarding): First workout experience with program pre-fill

**Must-Have Capabilities:**

| #   | Capability                                         | Justification                                                               | Dependencies      |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------- | ----------------- |
| 1   | Dark theme redesign                                | Foundation -- all new UI builds on dark tokens. Ships first.                | None (foundation) |
| 2   | Code refactor (monolith decomposition)             | Foundation -- 1256-line screen is unmaintainable. Enables all feature work. | None (foundation) |
| 3   | Pre-fill engine (program targets → last-logged)    | Enables the "under 5 seconds per set" promise                               | #2                |
| 4   | WorkoutExecutionScreen redesign (matrix accordion) | Core product thesis -- without this, v1.2 has no reason to exist            | #1, #2, #3        |
| 5   | NumericKeypad                                      | Gym-usable input -- system keyboard fails the context                       | #1                |
| 6   | Non-linear exercise navigation                     | Matches how gym-goers actually think about workouts                         | #4                |
| 7   | Exercise media modal (video/GIF + instructions)    | Primary differentiator vs Hevy/Strong                                       | #1, #2            |
| 8   | Exercise library media rendering                   | Shared media component, extends media reach beyond active workouts          | #7                |
| 9   | Continuous state persistence                       | Zero data loss through any interruption -- trust is non-negotiable          | #4                |
| 10  | Rest timer with local notification                 | Core workout loop includes backgrounded rest periods                        | #4                |
| 11  | Completion summary with celebration                | Reward moment that closes the habit loop                                    | #4, #3            |
| 12  | PR detection                                       | Surprise-and-delight -- nearly free to implement alongside pre-fill engine  | #3                |

**Explicitly out of MVP scope:**

- Exercise search/add mid-workout (users start from programs in v1.2; ad-hoc exercise addition is a growth feature)
- Media upload (requires backend storage infrastructure)
- Workout templates (enhancement, not core)
- Advanced/compact view modes (power-user optimization)
- Trainer platform (v1.4, requires backend user model changes)
- Remote push notifications (local only in v1.2)
- Media caching (fetch fresh in v1.2, optimize later)

**Scope reduction order (if triage needed):** Drop from bottom up: (10) local notification → (8) library media → (11) celebration animation (keep summary, drop confetti) → (12) PR detection. Core thesis (matrix accordion + media modal + pre-fill + persistence) survives without these.

### Post-MVP Features

**Phase 2 -- Growth (v1.3):**

- **Media upload (priority)** -- users and trainers upload custom exercise demos. Requires backend upload endpoint + cloud storage. Ships first in Phase 2 because it unblocks trainer content workflows, a prerequisite for the v1.4 trainer platform.
- Advanced view modes -- compact/spreadsheet layouts for experienced lifters who want density over clarity.
- Exercise search/add mid-workout -- ability to add exercises not in the original program during an active session.
- Workout templates -- save and share custom configurations beyond program structure.
- Media caching -- cache exercise demos locally for offline access and faster loading.

**Phase 3 -- Expansion (v1.4+):**

- Trainer platform -- trainer accounts, trainee group management, workout assignment, feedback collection, shared progress. Backend user model already has `trainers` array seed.
- AI-powered form analysis -- video upload + ML-based form feedback.
- Social features -- feed, community, workout sharing beyond QR codes.
- Workout recommendations -- AI-driven program suggestions from progress data.
- Remote push notifications -- workout reminders, trainer messages, social notifications.

### Risk Mitigation Strategy

**Technical Risks:**

| Risk                                                       | Impact                                                          | Mitigation                                                                                                                                              |
| ---------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State persistence reliability across all termination paths | High -- data loss destroys trust                                | Test against battery death, OS kill, force-quit, app update. Use MMKV or AsyncStorage with write-on-every-change strategy.                              |
| Cross-platform media playback inconsistency                | Medium -- broken media undermines differentiator                | Early spike on video/GIF rendering across iOS, Android, Web. Establish supported formats upfront. Graceful placeholder fallback.                        |
| Expo notification permissions UX                           | Low-Medium -- permission denial removes rest timer notification | Request permission contextually (first workout start, not app launch). Degrade gracefully -- timer still works in-app, just no background notification. |
| Monolith decomposition introduces regressions              | Medium -- existing features must keep working                   | Decompose incrementally. Existing test suite (`npm run test:run`) must pass at every step. No big-bang rewrite.                                         |

**Market Risks:**

| Risk                                       | Impact                                                    | Mitigation                                                                                                            |
| ------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Users don't value media integration enough | Medium -- differentiator falls flat                       | Media is opt-in (one tap away, never forced). If unused, it costs nothing. The matrix accordion alone justifies v1.2. |
| Hevy ships similar matrix UI               | Low -- execution quality matters more than feature parity | Ship fast. PWO's combination of matrix + media + pre-fill is the moat, not any single feature.                        |

**Resource Risks:**

| Risk                     | Impact                                  | Mitigation                                                                                                |
| ------------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Solo developer bandwidth | High -- scope creep kills solo projects | The 12 must-haves are the hard boundary. No feature additions during v1.2. Growth features wait for v1.3. |
| Scope reduction needed   | Medium                                  | Follow the triage order above. Core thesis survives without the bottom four items.                        |

## Functional Requirements

_Note: These FRs cover v1.2 new and redesigned capabilities. Existing features (authentication, programs, progress tracking, QR sharing, exercise library) are preserved per the "no regressions" success criterion and are not re-listed here._

### Workout Execution

- **FR1:** User can start a workout session from a selected program
- **FR2:** User can view all exercises and their set completion status in a persistent compact overview
- **FR3:** User can expand any exercise to access its set logging controls
- **FR4:** User can navigate to any set in any exercise with a single action on the compact overview
- **FR5:** User can complete sets and exercises in any order (non-linear)
- **FR6:** System auto-expands the next pending exercise when all sets of the current exercise are completed
- **FR7:** User can end a workout early, with remaining incomplete sets marked as skipped
- **FR8:** User can view elapsed workout time throughout an active session
- **FR9:** User can skip individual sets without completing them _(derived from the UX spec's non-linear completion model -- out-of-order completion implies some sets may be intentionally skipped due to injury, time pressure, or equipment unavailability)_

### Set Logging & Input

- **FR10:** User can confirm a pre-filled set with a single action
- **FR11:** User can view pre-filled values for reps and weight before confirming a set
- **FR12:** User can modify reps and weight values before confirming a set
- **FR13:** User can edit a previously confirmed set's values and re-confirm
- **FR14:** System discards uncommitted edits if user navigates away from an editing set without re-confirming
- **FR15:** User can input numeric values using a large-button keypad optimized for gym conditions
- **FR16:** User can confirm sets, navigate inputs, and dismiss the keypad using keyboard shortcuts on web

### Exercise Media & Instructions

- **FR17:** User can access exercise media and instructions from the active workout without losing workout state
- **FR18:** User can view a looping video or GIF demonstration for an exercise
- **FR19:** User can view text-based exercise instructions alongside the media demonstration
- **FR20:** User can access exercise media from the exercise library browse view
- **FR21:** System displays a graceful placeholder when exercise media is unavailable or the device is offline

### Data Intelligence

- **FR22:** System pre-fills set values from the user's last-logged values for that exercise
- **FR23:** System pre-fills set values from program targets when no prior session history exists for that exercise
- **FR24:** System automatically uses last-logged values over program targets once the user has completed at least one session with that exercise
- **FR25:** System detects when a completed set exceeds the user's previous personal record for that exercise

_Architecture note: The source of last-logged values (API query on session start vs locally cached after each completed workout) is an architecture decision to be resolved downstream. The PRD specifies the capability, not the data retrieval strategy._

- **FR26:** System notifies the user of a new personal record immediately upon the record-breaking set completion

### State Persistence & Sync

- **FR27:** System persists the complete workout state to local storage on every state change
- **FR28:** User can resume an active workout after phone lock, app backgrounding, battery death, OS force-quit, or app restart with no data loss
- **FR29:** System resumes to the exact workout state without recovery dialogs, spinners, or re-navigation
- **FR30:** System syncs completed workout data to the backend API silently in the background
- **FR31:** System indicates sync status on the workout completion summary when the device is offline
- **FR32:** System automatically syncs pending workout data when connectivity is restored

### Workout Feedback & Celebration

- **FR33:** System provides haptic feedback on set confirmation, personal record detection, rest timer completion, and workout completion
- **FR34:** System starts a rest countdown timer automatically after each set confirmation
- **FR35:** Rest timer continues running when the user navigates between exercises
- **FR36:** User can dismiss or skip the rest timer at any time
- **FR37:** System sends a local notification when the rest timer completes while the app is backgrounded
- **FR38:** User can view a workout completion summary displaying total time, total volume, sets completed, sets skipped, and personal records achieved
- **FR39:** System plays a celebration animation upon workout completion

### Visual Design System

- **FR40:** All screens render using a dark-first color theme with design system tokens
- **FR41:** All new and existing screens receive updated visual styling through the design token system
- **FR42:** The application provides identical feature behavior and visual presentation on iOS, Android, and Web
- **FR43:** The workout execution screen renders in a phone-width container on larger screen sizes

## Non-Functional Requirements

### Performance

| Metric                                    | Target                                              | Context                                                                        |
| ----------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Set confirmation (pre-filled, single tap) | < 2 seconds end-to-end (tap → visual feedback)      | The most common interaction. Must feel instant.                                |
| Set confirmation (with value edit)        | < 5 seconds end-to-end (tap field → edit → confirm) | The "faster than a notes app" bar.                                             |
| Exercise navigation (tap matrix → expand) | < 200ms visual response                             | Accordion collapse/expand must feel instant. No perceived delay.               |
| Keypad appearance                         | < 100ms after field tap                             | Must feel like a native keyboard. Any lag breaks flow state.                   |
| Media modal open                          | < 500ms to show modal + begin loading indicator     | Media load time depends on network, but the modal itself must appear fast.     |
| Media playback start                      | < 3 seconds on typical gym WiFi/LTE                 | Looping video/GIF should begin playing quickly. Placeholder shown during load. |
| State persistence write                   | < 50ms per state change                             | Must not block the UI thread. Write-behind or async persistence.               |
| Workout resume (app reopen)               | < 1 second to restore full workout state            | User unlocks phone and sees their workout immediately.                         |
| Rest timer accuracy                       | ± 1 second drift over 5-minute timer                | Timer must be trustworthy. Users rely on it for rest periods.                  |

**Constraint:** All performance targets apply to mid-range devices (iPhone SE 3rd gen, Galaxy A54 equivalent). Flagship devices will exceed these targets.

### Reliability

| Requirement                          | Target                                                            | Validation                                                                 |
| ------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Workout data durability              | Zero data loss across all termination paths                       | Test: battery death, OS kill, force-quit, app update, crash during write   |
| State persistence coverage           | 100% of state changes persisted before next user action           | No state change exists only in memory. Every mutation hits storage.        |
| Resume fidelity                      | Exact state restoration (exercise, set, timer, values)            | Test: kill app at every possible state, verify identical restore           |
| Background sync reliability          | All completed workouts eventually sync to API                     | Test: complete workout offline, verify sync on reconnect                   |
| Sync idempotency                     | Duplicate sync attempts produce no duplicate data                 | Test: force retry during sync, verify no duplicates                        |
| Graceful degradation (media)         | App remains fully functional when media URLs are unreachable      | Test: block media domain, verify workout execution unaffected              |
| Graceful degradation (notifications) | App remains fully functional if notification permission is denied | Test: deny permission, verify rest timer works in-app without notification |
| Existing feature preservation        | All pre-v1.2 features pass their existing test suites             | `npm run test:run` passes 100% after every code change                     |

### Accessibility

| Requirement                                     | Target                                                        | Standard                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Color contrast (primary text on all surfaces)   | ≥ 4.5:1 ratio                                                 | WCAG AA                                                                                          |
| Color contrast (secondary text on all surfaces) | ≥ 4.5:1 ratio                                                 | WCAG AA                                                                                          |
| Touch target size                               | ≥ 48pt (set dots, buttons, checkmarks, keypad keys)           | WCAG 2.5.5 / Apple HIG                                                                           |
| Color independence                              | Every color-coded state has a redundant shape/icon indicator  | Color-blind safety: checkmark for done, dash for skipped, number for pending, filled vs outlined |
| Screen reader support                           | All interactive elements have accessible labels               | VoiceOver (iOS), TalkBack (Android)                                                              |
| Motion sensitivity                              | Celebration animation respects `prefers-reduced-motion`       | Users who disable animations see a static completion summary                                     |
| One-handed usability                            | All primary workout actions reachable in bottom 2/3 of screen | Gym context: phone held in one hand, often non-dominant                                          |

### Security

| Requirement        | Target                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Authentication     | Firebase Auth handles all authentication flows. No custom auth implementation.                     |
| Data in transit    | All API communication over HTTPS. No plain HTTP.                                                   |
| Local storage      | Workout state stored in app sandbox. No sensitive data (passwords, tokens) in local workout state. |
| Session management | Firebase Auth manages session tokens and refresh. App defers entirely to Firebase SDK.             |

**Not in scope for v1.2:** End-to-end encryption of workout data, biometric auth, data export/deletion tooling (GDPR right-to-erasure handled via Firebase Auth account deletion).
