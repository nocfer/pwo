# Implementation Plan: Backend-Only Refactor

## Overview

Incrementally remove local storage and event system dependencies, replacing them with API-only data flows. Each task builds on the previous, ensuring the app compiles and functions at every step. Storage and event files are deleted last, after all references are removed.

## Tasks

- [x] 1. Create AccumulatedSet type and session-to-WorkoutLog builder
  - [x] 1.1 Define `AccumulatedSet` interface in `types/` and export it
    - Add `AccumulatedSet` type with fields: `exerciseId`, `reps`, `weight?`, `isBodyweight`, `timestamp`
    - _Requirements: 4.1_
  - [x] 1.2 Create `lib/utils/sessionBuilder.ts` with `buildWorkoutLog` function
    - Takes `slug`, `completedAt`, `timeSpentSeconds`, and `AccumulatedSet[]`
    - Groups sets by `exerciseId`, builds `WorkoutLogInput`
    - _Requirements: 4.1, 4.2_
  - [ ]\* 1.3 Write property test for `buildWorkoutLog`
    - **Property 5: Session accumulator to WorkoutLogInput transformation**
    - Generate random `AccumulatedSet[]`, verify grouping by exerciseId, all sets preserved, no duplicates
    - **Validates: Requirements 4.1, 4.2**

- [x] 2. Refactor DataContext to remove storage and events
  - [x] 2.1 Remove storage and event imports from DataContext
    - Remove `import { storage }` and `import { dataEvents }`
    - Remove seed data import (`assets/data/programs.json`)
    - Remove `loadSessionState`, `saveSessionState`, `recordEvent` actions
    - Remove `refreshHistory`, `refreshCompleted` (consolidate into `refreshProgress`)
    - Remove `bulkDeleteExercises`, `bulkDeletePrograms`, `duplicateProgram`, `importData` that use storage directly
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 7.1_
  - [x] 2.2 Rewrite exercise loading to be API-only
    - On auth state change: if authenticated, call `fetchExercises()` and dispatch; if not authenticated, dispatch empty array
    - Remove local storage merge logic
    - _Requirements: 1.1, 3.1, 3.6_
  - [x] 2.3 Rewrite program loading to be API-only
    - On auth state change: if authenticated, call `fetchWorkouts()`, map via `workoutToProgram`, dispatch; if not authenticated, dispatch empty array
    - Remove seed data loading and local storage merge logic
    - _Requirements: 1.2, 3.2, 7.1, 7.2, 7.3_
  - [x] 2.4 Rewrite `upsertExercise` to be API-only
    - Call API create/update, then re-fetch full list via `fetchExercises()`, dispatch to state
    - Remove local storage fallback
    - Throw error if user not authenticated or API unavailable
    - _Requirements: 3.3, 3.5, 8.2_
  - [x] 2.5 Rewrite `deleteExercise` to be API-only
    - Call API delete, then re-fetch full list via `fetchExercises()`, dispatch to state
    - Remove local storage calls
    - _Requirements: 3.4, 3.5_
  - [x] 2.6 Rewrite `completeSession` to use AccumulatedSet and API-only
    - Accept `accumulatedSets: AccumulatedSet[]` parameter instead of reading events from storage
    - Use `buildWorkoutLog` to construct `WorkoutLogInput`
    - POST via `recordWorkout`, dispatch new PRs and increment `progressVersion`
    - Remove all storage writes (events, history, streak, session state clearing)
    - Remove event emissions
    - _Requirements: 4.2, 4.3, 4.5_
  - [x] 2.7 Rewrite `refreshAll` to be API-only
    - Re-fetch exercises and programs from API, dispatch to state
    - Increment version counters
    - Remove storage reads and seed data loading
    - _Requirements: 3.7_
  - [x] 2.8 Remove event system subscription from DataContext
    - Remove the `useEffect` that subscribes to `dataEvents`
    - Version counter increments now happen directly in mutation actions
    - _Requirements: 2.1, 2.2_
  - [ ]\* 2.9 Write property tests for DataContext API-only behavior
    - **Property 3: Exercise mutations reflect API state**
    - **Property 4: API errors propagate without fallback**
    - Mock API SDK, generate random exercises, verify state matches API after mutations and errors propagate
    - **Validates: Requirements 2.1, 3.3, 3.4, 3.5, 8.2**

- [x] 3. Checkpoint - Ensure DataContext compiles and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Refactor storage-dependent data hooks
  - [x] 4.1 Rewrite `useWeeklyActivity` to use API
    - Fetch from `fetchWeeklyStats()` API endpoint
    - Map API response to day-of-week activity array
    - Remove `storage.loadAllStreaks()` call
    - _Requirements: 5.1_
  - [x] 4.2 Rewrite `useLiveProgress` to use API
    - Fetch from `fetchProgress()` API endpoint
    - Map API response to progress data shape
    - Remove `storage.loadStreak()` call
    - _Requirements: 5.2_
  - [x] 4.3 Rewrite `useLiveHistory` to use API
    - Fetch from `fetchProgress()` API endpoint, extract `recentActivity`
    - Remove `storage.loadHistory()` call
    - _Requirements: 5.3_
  - [x] 4.4 Rewrite `useProgramProgress` to use API with TODO
    - Fetch from `fetchProgress()` API endpoint
    - Add TODO comment: backend does not yet support per-program session tracking
    - Return partial metrics from available API data
    - Remove `storage.loadProgramProgress()` call
    - _Requirements: 5.4_
  - [x] 4.5 Rewrite `useSessionCompletion` to use API with TODO
    - Add TODO comment: backend does not yet support per-program completed session tracking
    - Return empty Set or derive from available API data
    - Remove `storage.loadCompletedSessions()` call
    - _Requirements: 5.5_
  - [x] 4.6 Rewrite `useChallengeProgress` to use API with TODO
    - Add TODO comment: backend has no challenge-specific progress tracking
    - Return placeholder metrics from available API data
    - Remove `storage.loadChallengeProgress()` call
    - _Requirements: 5.6_
  - [ ]\* 4.7 Write property tests for refactored hooks
    - **Property 6: Weekly activity hook maps API response correctly**
    - **Property 7: Live progress hook maps API response correctly**
    - **Property 8: Live history hook maps API response correctly**
    - **Property 9: API errors set hook error state**
    - Generate random API responses, verify hook transformations
    - **Validates: Requirements 5.1, 5.2, 5.3, 8.1, 8.4**

- [x] 5. Refactor components and screens
  - [x] 5.1 Refactor `ProgressCalendar` to use `useConsistencyData` hook
    - Replace direct `storage.getProgressHistory()` call with `useConsistencyData` hook
    - The hook already fetches from `fetchConsistency` API
    - _Requirements: 6.1_
  - [x] 5.2 Refactor profile screen to remove storage-based data management
    - Remove "Clear Progress Data" and "Clear All Data" buttons
    - Remove `storage` import
    - Keep "Log Out" button
    - _Requirements: 6.2_
  - [x] 5.3 Refactor `programPrioritization` to accept data as parameters
    - Change `getProgramUsageStats` to accept progress data as parameter instead of reading from storage
    - Or simplify to use `fetchProgress` API data
    - Remove `storage` import
    - _Requirements: 6.3_
  - [ ]\* 5.4 Write property test for program prioritization
    - **Property 11: Program prioritization produces correct ordering**
    - Generate random program lists with progress data, verify sort order
    - **Validates: Requirements 6.3**

- [x] 6. Checkpoint - Ensure all refactored code compiles and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Delete storage and event files, clean up dead code
  - [x] 7.1 Delete `lib/storage.ts`
    - Verify no remaining imports via grep
    - _Requirements: 1.4, 9.1, 9.2_
  - [x] 7.2 Delete `lib/events.ts`
    - Verify no remaining imports via grep
    - _Requirements: 2.3, 9.1, 9.3_
  - [x] 7.3 Remove dead types from `types/`
    - Remove or mark as deprecated: `EventRecord`, `HistoryFile`, `HistoryEntry`, `StreakEntry`, `SessionState`, `DataEvent`, `DataEventType`, `DataEventCallback`, `ProgressHistory`
    - Verify each type is not used elsewhere before removing
    - _Requirements: 9.4, 9.5_
  - [x] 7.4 Remove dead utility functions
    - Check if `normalizeStreak`, `getMondayBasedDayIndex` are only used by storage — if so, remove
    - Remove any storage-related test files
    - _Requirements: 9.4_
  - [x] 7.5 Update `hooks/data/index.ts` exports
    - Remove exports for hooks that were removed or renamed
    - Ensure all refactored hooks are properly exported
    - _Requirements: 9.2, 9.3_

- [ ] 8. Final checkpoint - Ensure build succeeds and all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify zero imports of `lib/storage` and `lib/events` via grep
  - Verify the app builds successfully

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Where the backend doesn't support a feature yet, TODO comments are added explaining what endpoint is needed
- The existing API SDK (`lib/api.ts`) and mappers (`lib/mappers/`) are preserved unchanged
- Firebase auth integration remains unchanged
