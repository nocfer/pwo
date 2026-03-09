---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
inputDocuments:
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/data-models.md
  - docs/api-contracts.md
  - docs/development-guide.md
  - docs/source-tree-analysis.md
  - docs/breaking-changes.md
  - _bmad-output/project-context.md
  - openapi.json
date: 2026-03-06
author: Nocfer
---

# Product Brief: pwo

## Executive Summary

Progressive Workout (PWO) is a cross-platform fitness tracking application that makes logging gym sessions effortless while providing the depth serious lifters need. The v1.2 initiative focuses on two pillars: (1) overhauling the workout execution experience with a best-in-class, Hevy-inspired UX for frictionless set logging, and (2) introducing exercise media support with short looping video/GIF demonstrations accessible during workout execution. A comprehensive code refactor of the workout execution module accompanies the UX redesign. These improvements position PWO as a polished, media-rich workout tracker ready for broader adoption, with a future vision toward a trainer-trainee coaching platform.

---

## Core Vision

### Problem Statement

Gym-goers who want to track their workouts face a frustrating choice: apps that are powerful but cluttered and intimidating, or apps that are simple but lack the depth needed for progressive training. Even the best workout trackers fail to integrate exercise form guidance into the actual workout flow — demonstration videos are buried in exercise libraries, disconnected from the moment users need them most (mid-set, checking form on an unfamiliar exercise).

PWO already solves many of these problems with its feature set (programs, progress tracking, personal records, QR sharing), but its workout execution screen — the most-used part of the app — is visually underwhelming and built on a monolithic codebase that limits iteration speed.

### Problem Impact

- Users default to mental tracking or paper logs because existing apps create friction during workouts
- Poor exercise form leads to injuries and plateaus — the moment users need form guidance is during execution, not while browsing a library
- A visually uninspiring execution experience undermines user confidence and retention, even when the underlying features are strong
- A 1256-line monolithic workout screen makes it difficult to iterate on UX improvements

### Why Existing Solutions Fall Short

- **Hevy**: Best-in-class logging UX, but no integrated exercise media demos and no trainer platform. Mobile only.
- **Strong**: Clean interface but limited free tier, no video demonstrations, no web support
- **JEFIT**: Has exercise animations but dated, cluttered UI undermines the experience
- **FitNotes**: Minimal and functional but bare-bones, Android only, no media support
- None combine frictionless logging with in-context exercise media in a single, cross-platform experience

### Proposed Solution

**Phase: v1.2 — Workout Experience Overhaul**

1. **WorkoutExecutionScreen Redesign** — Shift from a timer-driven flow to a Hevy-inspired user-paced approach where users log sets at their own pace with optional rest timers. Clean, focused UI with one exercise at a time, easy set check-off, and minimal visual noise.

2. **Exercise Media Support** — Add short, looping video/GIF demonstration clips to exercises. Accessible via a dedicated instruction detail screen during workout execution, keeping the main logging screen clean while putting form guidance one tap away. Media sourced via URL from the backend (user upload support planned for a future phase).

3. **Code Quality Refactor** — Decompose the monolithic 1256-line WorkoutExecutionScreen into clean, composable components and hooks. Improve maintainability and enable faster UX iteration going forward.

**Future Vision: Trainer Platform**

A broader platform evolution introducing personal trainer accounts with elevated permissions: trainee group management, workout assignment to clients, feedback collection, and shared progress statistics. The existing backend user model (with its `trainers` array) provides the seed for this multi-role architecture. This is explicitly out of scope for v1.2 but informs architectural decisions.

### Key Differentiators

- **In-context exercise media**: Form demonstrations accessible during workout execution, not buried in a separate library — helping users when they actually need it
- **Hevy-caliber UX on cross-platform**: Best-in-class logging experience available on iOS, Android, and Web from a single codebase
- **Extensible architecture**: Separate backend repository with a clean API, designed to grow into a multi-role trainer-trainee platform
- **Progressive enhancement path**: From solo workout logger → media-rich trainer → coaching platform, each phase building on the last
- **QR code program sharing**: Instant program distribution already built and operational

## Target Users

### Primary Users

**"The Gym Regular" — Anyone who lifts and wants to track it**

PWO serves a single, broad user segment: anyone who goes to the gym and wants to log their workouts without friction. From beginners learning their first barbell movements to experienced lifters running structured programs.

**Persona: Marco, 28 — Consistent gym-goer**

- Goes to the gym 3-5 times per week
- Follows a structured push/pull/legs program
- Currently tracks workouts in his phone's notes app because other apps felt like too much work
- Wants to see his progress over time (especially PRs) but doesn't want to spend time fighting with an app between sets
- Would use exercise demo videos to double-check form on new movements

**Persona: Ana, 23 — Getting into lifting**

- Started going to the gym 6 months ago, 2-3 times per week
- Follows programs she finds online but isn't confident about form on many exercises
- Has tried two workout apps and abandoned both — one was too complex, the other too basic
- Would heavily rely on exercise media demos during workouts
- Shares programs with her gym partner via messaging (QR sharing is a natural fit)

**What unites them:**

- They want logging to be fast and invisible — not a task that interrupts their workout
- They value seeing their progression over time
- They range from beginner to advanced, but the interface should feel simple for all
- They'll discover PWO through public launch, word of mouth, and program sharing between gym partners

### Secondary Users

N/A for this phase. Future phases will introduce personal trainer accounts as a distinct user type with elevated permissions (trainee management, workout assignment, progress monitoring). This is explicitly out of scope for v1.2.

### User Journey

1. **Discovery** — User finds PWO through public launch channels, app store, or receives a shared program via QR code from a gym partner
2. **Onboarding** — Signs up (or tries as guest), browses the exercise library, creates or imports their first program
3. **First Workout** — Starts a session, immediately sees the clean Hevy-inspired logging screen. Taps into an exercise detail screen to watch a form demo on an unfamiliar movement. Logs sets by checking them off. Finishes and sees their summary
4. **Aha Moment** — After a few sessions, opens the progress tab and sees their personal records tracked automatically. Realizes the app has been doing the work for them
5. **Routine** — PWO becomes the default gym companion. They share programs with friends via QR. The media demos become a trusted form reference. Progress tracking keeps them motivated

## Success Metrics

### User Success Metrics

- **Logging speed**: A user can log a complete set (reps + weight + check off) in under 5 seconds. The new execution screen should feel faster than writing it in a notes app
- **Workout completion rate**: Users who start a workout session finish it — low abandonment rate mid-session indicates the UX isn't creating friction
- **Media engagement**: Users tap into the exercise instruction/demo screen when encountering unfamiliar exercises. The feature is discoverable and useful without being intrusive
- **Return usage**: Users come back for their next gym session and open PWO again. Retention through the first 4 sessions signals the tool has become part of their routine
- **Progress awareness**: Users visit the progress tab and engage with PRs, weekly stats, and consistency data. The app is doing the tracking work for them and they notice

### Business Objectives

- **Free public launch**: No monetization in v1.2. The goal is to ship a polished, usable product that earns organic adoption through quality
- **Revenue via future trainer platform**: Monetization deferred to the trainer platform phase (subscriptions for trainer accounts with elevated permissions)
- **Foundation for growth**: v1.2 establishes PWO as a credible, high-quality workout tracker that can attract a broader user base before the trainer features expand the market

### Key Performance Indicators

**v1.2 is a success if:**

1. **Exercise media & instruction screen shipped** — Users can tap into a dedicated screen during workout execution showing looping video/GIF demos and exercise instructions. Backend media URLs render correctly on all platforms
2. **WorkoutExecutionScreen significantly improved** — The redesigned screen follows a Hevy-inspired user-paced logging approach with clean UI, easy set check-off, and minimal visual noise. Measurably better than the current timer-driven monolithic screen
3. **Code quality improved** — The 1256-line monolith is decomposed into clean, composable components and hooks. No single file exceeds a reasonable size. Codebase is maintainable and ready for future iteration
4. **Cross-platform parity** — All new features work on iOS, Android, and Web

**Post-launch qualitative signals:**

- Users describe the logging experience as "fast" and "easy"
- Exercise media demos are used during workouts (not ignored)
- No regression in existing features (progress tracking, QR sharing, programs)

## MVP Scope

### Core Features (v1.2)

**1. WorkoutExecutionScreen Redesign**

- Shift from timer-driven flow to Hevy-inspired user-paced set logging
- One exercise at a time, clean focused UI
- Easy set check-off with reps + weight input
- Optional rest timer (user-initiated, not flow-driven)
- Workout summary on completion
- Full code refactor: decompose the 1256-line monolith into composable components and hooks

**2. Exercise Instruction & Media Screen**

- New dedicated screen accessible during workout execution (one tap from the logging screen)
- Displays exercise instructions/form cues from the `instructions` field
- Renders looping video/GIF demonstration from the `media` URL field
- Auto-looping playback for short form demos
- Media type inferred from URL (video vs GIF)

**3. Exercise Library Media Support**

- Render media (video/GIF) in the exercise library when browsing exercises outside of workouts
- Consistent media player component shared between library and instruction screen

### Out of Scope for v1.2

- **Trainer platform** — Multi-role accounts, trainee management, workout assignment (future phase)
- **Media upload** — Users cannot upload their own media yet; media sourced via URL only (backend stores URLs, upload endpoint deferred)
- **Backend changes** — Current API is sufficient; no new endpoints or schema changes required
- **Existing feature changes** — No modifications to progress tracking, QR sharing, programs, authentication, or any other existing functionality
- **Offline media caching** — Videos/GIFs require network connection; no local caching of media assets
- **Advanced view modes** — Power-user or compact views deferred to future iteration
- **Social features** — No feed, comments, likes, or community features
- **Monetization** — No payment integration, subscriptions, or premium tiers

### MVP Success Criteria

v1.2 ships successfully when:

1. A user can start a workout and log sets using the new Hevy-inspired execution screen on iOS, Android, and Web
2. A user can tap into an exercise instruction screen during a workout and see a looping video/GIF demo with form cues
3. Media renders in the exercise library when browsing exercises
4. The WorkoutExecutionScreen codebase is decomposed into clean, maintainable components (no single file > ~300 lines)
5. All existing features continue working without regression

### Future Vision

- **v1.3 — Media Upload**: Allow users to upload their own exercise media (requires backend upload endpoint + storage)
- **v1.4 — Trainer Platform**: Personal trainer accounts with trainee groups, workout assignment, shared progress monitoring, and feedback collection
- **v1.5+ — Advanced Features**: Advanced view modes for power users, social/community features, AI-powered form analysis from uploaded videos, workout recommendations based on progress data
