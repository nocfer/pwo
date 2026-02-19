# Implementation Plan: Program API Integration

## Overview

Incrementally integrate the frontend Program model with the backend Workout API by adding API types, a bidirectional mapper, API SDK functions, a hook, and DataContext updates. Each step builds on the previous and is wired in before moving on. The API is the sole source of truth for user-created programs — no local storage fallback or migrations needed.

## Tasks

- [ ] 1. Add API Workout types and mapper module
  - [x] 1.1 Create `lib/mappers/workout.ts` with `APIExercise`, `APIWorkoutBlock`, `APIWorkout`, and `APIWorkoutCreateInput` types, and implement `workoutBlockToProgram`, `workoutToProgram`, `programBlockToWorkout`, and `programToWorkoutInput` mapper functions
    - `APIWorkoutBlock.durations` is `number[]` (always present, e.g. `[0]`), with optional `exercise?: APIExercise` for expanded responses
    - `APIWorkout.challengeConfig` is optional `Record<string, unknown>` (forward-compatible, not yet supported by backend)
    - `APIWorkoutCreateInput` includes only `name`, `description`, `blocks`, `initialWarmup`, `defaultRestBetweenExercises` — excludes `id`, `source`, `challengeConfig`, `createdBy`, timestamps
    - Handle `durations: [0]` and `[0,0,0]` as no duration (map to `durationSeconds: undefined`); use first non-zero element otherwise
    - Always set `type: 'exercise'` on ProgramBlock output (API blocks have no type field)
    - Strip expanded `exercise` field when converting API block → ProgramBlock
    - Pass through `challengeConfig` from Workout → Program when present; leave undefined when absent
    - When `durationSeconds` is undefined, send `durations: []` (empty array) in the API block output
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 7.1, 7.2, 7.3_
  - [ ]\* 1.2 Write property tests for the mapper in `__tests__/lib/mappers/workout.property.test.ts`
    - **Property 1: Program round-trip consistency**
    - **Validates: Requirements 3.1, 2.5, 2.6, 2.9**
    - **Property 2: API block to Program block field correctness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.10, 2.12**
    - **Property 3: Program block to API block field correctness**
    - **Validates: Requirements 2.7, 2.8, 2.11, 7.3**
    - **Property 4: Create/update input excludes server-managed fields**
    - **Validates: Requirements 7.1, 7.2**
  - [ ]\* 1.3 Write unit tests for mapper edge cases in `__tests__/lib/mappers/workout.test.ts`
    - Empty reps array, single-element reps, targetReps expansion with sets > 1, warmup 0 → undefined
    - `durations: [0]` → undefined, `durations: [0,0,0]` → undefined, `durations: [0,30,0]` → 30
    - Expanded exercise field stripped from block output
    - challengeConfig passthrough when present, undefined when absent
    - _Requirements: 3.2, 3.3, 2.4, 2.10, 2.12, 2.13_

- [x] 2. Checkpoint - Ensure all mapper tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Add workout API SDK functions
  - [x] 3.1 Add `fetchWorkouts`, `fetchWorkout`, `createWorkout`, `updateWorkout`, `deleteWorkout` functions to `lib/api.ts`, using the existing `request<T>()` helper and the API types from the mapper module
    - Follow the same pattern as the existing exercise API functions
    - `fetchWorkouts` calls `GET /api/v1/workouts`
    - `createWorkout` accepts `APIWorkoutCreateInput` (no `id`, `source`, `challengeConfig`)
    - `updateWorkout` accepts `id` + `APIWorkoutCreateInput`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - [ ]\* 3.2 Write unit tests for workout API functions in `__tests__/lib/api.workout.test.ts`
    - Test correct HTTP method, endpoint, auth headers, and error handling for each function
    - _Requirements: 1.6, 1.7, 6.1, 6.2, 6.3_

- [ ] 4. Create useAPIPrograms hook
  - [x] 4.1 Create `hooks/data/useAPIPrograms.ts` following the `useAPIExercises` pattern, returning `{ data, loading, error, isAPIAvailable }`
    - Fetch workouts via `fetchWorkouts()`, convert to Programs via `workoutToProgram()`, handle mounted guard
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 4.2 Export `useAPIPrograms` from `hooks/data/index.ts` if an index file exists
    - _Requirements: 5.1_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Integrate API into DataContext for programs
  - [x] 6.1 Update program loading in `context/DataContext.tsx` to fetch from API when authenticated, merge with seed programs, and use the mapper for conversion
    - Mirror the exercise loading pattern with `onAuthStateChanged` subscription
    - _Requirements: 4.1, 4.7_
  - [x] 6.2 Update `upsertProgram` action to save via API (convert with `programToWorkoutInput`, call `createWorkout`/`updateWorkout`), propagating errors to the caller
    - _Requirements: 4.2, 4.3_
  - [x] 6.3 Update `deleteProgram` action to delete via API (`deleteWorkout`), propagating errors to the caller
    - _Requirements: 4.4, 4.5_
  - [x] 6.4 Update `refreshAll` action to re-fetch programs from API when authenticated
    - _Requirements: 4.6_
  - [x] 6.5 Ensure that when the user is not authenticated or API is unavailable, only seed programs are loaded (no user CRUD)
    - _Requirements: 4.8_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The mapper is the core correctness concern — property tests validate it thoroughly
- API SDK functions follow the existing exercise pattern exactly
- No local storage fallback for programs — the API is the sole source of truth for user-created programs
- Seed/builtin programs continue to load from the local JSON file
- No migrations needed — old local storage data can be deleted
- `challengeConfig` is forward-compatible: passed through from API if present, never sent in create/update
- `durations: [0]` from the API is treated as "no duration" (maps to `durationSeconds: undefined`)
