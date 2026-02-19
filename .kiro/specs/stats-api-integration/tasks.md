# Implementation Plan: Stats API Integration

## Overview

Migrate all progress/stats tracking from local storage to the backend Stats API. Implementation follows the same layered approach as the program-api-integration: API types + SDK functions → mapper → hooks → DataContext → cleanup.

## Tasks

- [x] 1. Add Stats API types and SDK functions to lib/api.ts
  - [x] 1.1 Add Stats API types (WorkoutLogInput, WorkoutLogResponse, APIPR, APIProgress, APIWeeklyStats, ConsistencyEntry, ProgressionPoint, and related sub-types)
    - Add all type definitions from the design document to `lib/api.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - [x] 1.2 Add Stats API SDK functions (recordWorkout, fetchPRs, fetchExercisePRs, fetchProgress, fetchWeeklyStats, fetchConsistency, fetchExerciseProgression)
    - Add all 7 functions using the existing `request<T>()` helper
    - `recordWorkout` → POST `/api/v1/stats/workouts`
    - `fetchPRs(limit?)` → GET `/api/v1/stats/prs?limit=N`
    - `fetchExercisePRs(exerciseId, current?)` → GET `/api/v1/stats/prs/{exerciseId}?current=true`
    - `fetchProgress()` → GET `/api/v1/stats/progress`
    - `fetchWeeklyStats(weekStart?)` → GET `/api/v1/stats/weekly?weekStart=YYYY-MM-DD`
    - `fetchConsistency(weeks?)` → GET `/api/v1/stats/consistency?weeks=N`
    - `fetchExerciseProgression(exerciseId, days?)` → GET `/api/v1/stats/exercises/{exerciseId}/progression?days=N`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [x] 2. Create Stats Mapper (lib/mappers/stats.ts)
  - [x] 2.1 Implement mapPR, mapProgress, mapWeeklyStats, and mapConsistencyEntries functions
    - `mapPR(apiPR)` → PersonalRecord (drop userId, isCurrent)
    - `mapProgress(apiProgress)` → AggregatedProgress (map activeWorkouts, recentActivity, exercisesWithData)
    - `mapWeeklyStats(apiWeekly)` → WeeklyStats (all shared fields, no prsAchieved)
    - `mapConsistencyEntries(entries)` → Map<string, number>
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [ ]\* 2.2 Write property tests for Stats Mapper
    - **Property 1: PR mapping preserves required fields and drops server-only fields**
    - **Validates: Requirements 2.1**
    - **Property 2: Progress mapping preserves all fields and maps activeWorkouts**
    - **Validates: Requirements 2.2, 2.3**
    - **Property 3: Weekly stats mapping preserves all shared fields**
    - **Validates: Requirements 2.4**
    - **Property 4: Consistency entry mapping round-trip**
    - **Validates: Requirements 2.5**
    - Test file: `__tests__/lib/mappers/stats.property.test.ts`
    - Use fast-check with minimum 100 iterations per property
  - [ ]\* 2.3 Write unit tests for Stats Mapper edge cases
    - mapPR with missing optional fields
    - mapProgress with empty arrays
    - mapWeeklyStats with zero values
    - mapConsistencyEntries with empty input
    - Test file: `__tests__/lib/mappers/stats.test.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Update frontend types
  - [x] 3.1 Update AggregatedProgress type in useAllProgress.ts
    - Replace `activePrograms` and `activeChallenges` with single `activeWorkouts` field
    - Simplify `recentActivity` to `{ date: string; workoutId: string }`
    - Add `exercisesWithData: string[]` field
    - _Requirements: 5.1, 5.2, 5.5_
  - [x] 3.2 Update WeeklyStats type in types/progress.ts
    - Remove `prsAchieved` field
    - _Requirements: 5.3_
  - [x] 3.3 Fix all TypeScript compilation errors from type changes
    - Update all components and hooks that reference the changed fields
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Migrate progress hooks to API
  - [x] 5.1 Update useAllProgress to fetch from API
    - Replace `storage.loadAllProgramProgress()` / `storage.loadAllChallengeProgress()` with `fetchProgress()`
    - Map response via `mapProgress()`
    - Return `APIError` with `API_DISABLED` when API unavailable
    - _Requirements: 4.1, 4.8_
  - [x] 5.2 Update usePRs to fetch from API
    - Replace `storage.getLatestPRs()` / `storage.loadAllPRs()` with `fetchPRs(limit)`
    - Map each result via `mapPR()`
    - Build `prsByExercise` and `bestPRs` maps from mapped results
    - _Requirements: 4.2_
  - [x] 5.3 Update useExercisePRs to fetch from API
    - Replace `storage.loadPRsForExercise()` / `storage.getCurrentPRs()` with `fetchExercisePRs(exerciseId, true)`
    - Map each result via `mapPR()`
    - Build `bestPRs` map from current PRs
    - _Requirements: 4.3_
  - [x] 5.4 Update useWeeklyStats to fetch from API
    - Replace `storage.getWeeklyStats()` with `fetchWeeklyStats(weekStart)`
    - Map response via `mapWeeklyStats()`
    - _Requirements: 4.4_
  - [x] 5.5 Update useConsistencyData to fetch from API
    - Replace `storage.getConsistencyData()` with `fetchConsistency(weeks)`
    - Map response via `mapConsistencyEntries()` to get the date→count Map
    - Keep existing grid-building logic (WeekData[] generation) using the Map
    - _Requirements: 4.5_
  - [x] 5.6 Update useExerciseProgression to fetch from API
    - Replace `storage.getExerciseProgression()` with `fetchExerciseProgression(exerciseId, days)`
    - Use response directly as ProgressionDataPoint[] (shapes match)
    - Keep local `calculateTrend()` logic
    - _Requirements: 4.6_
  - [x] 5.7 Update useExercisesWithProgression to fetch from API
    - Replace local storage scanning with `fetchProgress()` and use `exercisesWithData` field
    - _Requirements: 4.7_

- [x] 6. Update DataContext session completion flow
  - [x] 6.1 Update completeSession to POST workout data to API
    - Construct WorkoutLogInput from session events (exerciseId, sets with reps/weight/isBodyweight/timestamp, lastCompletedAt)
    - Call `recordWorkout(input)` via API SDK
    - Store `newPRs` from response in state (add `lastNewPRs` to DataState)
    - Increment `progressVersion` on success
    - Propagate errors to caller
    - Remove local PR detection (`storage.detectAndSavePRs`)
    - Remove local progress saving (`storage.saveProgramProgress`, `storage.saveChallengeProgress`)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ]\* 6.2 Write property test for WorkoutLogInput construction
    - **Property 5: WorkoutLogInput construction includes all required fields**
    - **Validates: Requirements 3.3**
    - Test file: `__tests__/context/DataContext.stats.property.test.ts`
  - [ ]\* 6.3 Write unit tests for session completion API integration
    - Test completeSession constructs correct WorkoutLogInput
    - Test newPRs are stored from response
    - Test progressVersion increments on success
    - Test error propagation on API failure
    - Test file: `__tests__/context/DataContext.stats.test.ts`
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Clean up local storage progress functions
  - [x] 8.1 Remove progress-related storage functions from lib/storage.ts
    - Remove: `loadProgramProgress`, `saveProgramProgress`, `loadAllProgramProgress`, `loadChallengeProgress`, `saveChallengeProgress`, `loadAllChallengeProgress`, `loadAllPRs`, `savePR`, `detectAndSavePRs`, `getLatestPRs`, `loadPRsForExercise`, `getCurrentPRs`, `getWeeklyStats`, `calculateWeeklyStats`, `getConsistencyData`, `getExerciseProgression`
    - Update all imports that referenced removed functions
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties of the mapper layer
- Unit tests validate specific examples, edge cases, and integration points
- The implementation follows the same layered pattern as the program-api-integration spec
