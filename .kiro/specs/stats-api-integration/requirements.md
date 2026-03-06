# Requirements Document

## Introduction

This feature integrates the frontend stats and progress tracking with the backend Stats API endpoints. The backend provides seven endpoints covering workout recording, personal records, aggregated progress, weekly stats, consistency heatmap data, and exercise progression. The integration replaces all local storage-based progress computation with API calls, since the backend now handles aggregation, PR detection, and statistical calculations server-side.

The frontend currently computes all progress data locally via `lib/storage.ts` functions and ~10 hooks in `hooks/data/`. This feature migrates those hooks to fetch from the API, updates the session completion flow to POST workout data to the backend (which returns detected PRs), and removes the old local storage progress logic. No backward compatibility is needed — the app is in development.

Key data model differences between API and frontend:

- The API `progress` endpoint returns `activeWorkouts` (a single number) while the frontend has separate `activePrograms` and `activeChallenges` — the frontend will map `activeWorkouts` to a single field.
- The API `recentActivity` returns `{ date, workoutId }` while the frontend has `{ date, type, id, sessionIndex }` — the frontend type will be simplified to match the API.
- The API `weekly` endpoint does not return `prsAchieved` — the frontend `WeeklyStats` type will drop this field.
- The API PR model includes `userId` and `isCurrent` fields not present in the frontend type — the mapper will handle this.

## Glossary

- **Stats_API**: The backend stats endpoints under `/api/v1/stats/` that provide workout recording, PR retrieval, progress aggregation, weekly stats, consistency data, and exercise progression.
- **API_SDK**: The existing authenticated API client in `lib/api.ts` that provides typed functions for making backend requests.
- **Workout_Log_Input**: The request body for `POST /api/v1/stats/workouts`, containing `workoutId`, `completedAt`, `timeSpentSeconds`, and `exercises` with per-set detail.
- **Workout_Log_Response**: The response from `POST /api/v1/stats/workouts`, containing `workoutLog` (the persisted log) and `newPRs` (any newly detected personal records).
- **API_PR**: A personal record as returned by the API, including `id`, `userId`, `exerciseId`, `type`, `value`, `achievedAt`, `workoutId`, `details`, and `isCurrent`.
- **API_Progress**: The aggregated progress overview from `GET /api/v1/stats/progress`, containing `totalWorkoutsCompleted`, `totalTimeSpentSeconds`, `totalRepsCompleted`, `activeWorkouts`, `currentStreak`, `recentActivity`, and `exercisesWithData`.
- **API_Weekly**: The weekly stats from `GET /api/v1/stats/weekly`, containing `weekStart`, `weekEnd`, `workoutsCompleted`, `workoutGoal`, `totalTimeSeconds`, `totalVolume`, `totalReps`, `exercisesPerformed`, and `currentStreak`.
- **Consistency_Entry**: A single entry from `GET /api/v1/stats/consistency`, containing `date` and `workoutCount`.
- **Progression_Point**: A single data point from `GET /api/v1/stats/exercises/{exerciseId}/progression`, containing `date`, `reps`, optional `maxWeight`, and optional `volume`.
- **Stats_Mapper**: A pure function module responsible for converting between API response shapes and frontend types.
- **DataContext**: The global state management context using the Context + Reducer pattern that provides reactive data access throughout the app.

## Requirements

### Requirement 1: Stats API SDK Functions

**User Story:** As a developer, I want typed API functions for all stats endpoints, so that the frontend can communicate with the backend stats API.

#### Acceptance Criteria

1. THE API_SDK SHALL export a `recordWorkout` function that sends a Workout_Log_Input to `POST /api/v1/stats/workouts` and returns a Workout_Log_Response
2. THE API_SDK SHALL export a `fetchPRs` function that accepts an optional `limit` parameter and returns a list of API_PR from `GET /api/v1/stats/prs`
3. THE API_SDK SHALL export a `fetchExercisePRs` function that accepts an `exerciseId` and optional `current` boolean and returns a list of API_PR from `GET /api/v1/stats/prs/{exerciseId}`
4. THE API_SDK SHALL export a `fetchProgress` function that returns an API_Progress from `GET /api/v1/stats/progress`
5. THE API_SDK SHALL export a `fetchWeeklyStats` function that accepts an optional `weekStart` date string and returns an API_Weekly from `GET /api/v1/stats/weekly`
6. THE API_SDK SHALL export a `fetchConsistency` function that accepts an optional `weeks` parameter (1-52, default 12) and returns a list of Consistency_Entry from `GET /api/v1/stats/consistency`
7. THE API_SDK SHALL export a `fetchExerciseProgression` function that accepts an `exerciseId` and optional `days` parameter (1-365, default 30) and returns a list of Progression_Point from `GET /api/v1/stats/exercises/{exerciseId}/progression`
8. WHEN any stats API function is called, THE API_SDK SHALL use Firebase authentication tokens via the existing `request<T>()` helper
9. IF an API request fails, THEN THE API_SDK SHALL throw an `APIError` with an appropriate error code and message

### Requirement 2: Stats Data Mapping

**User Story:** As a developer, I want mapping functions between API response shapes and frontend types, so that existing UI components continue to work with API data.

#### Acceptance Criteria

1. THE Stats_Mapper SHALL convert an API_PR to a frontend `PersonalRecord` by mapping `id`, `exerciseId`, `type`, `value`, `achievedAt`, `workoutId`, and `details`, and dropping `userId` and `isCurrent`
2. THE Stats_Mapper SHALL convert an API_Progress to a frontend `AggregatedProgress` by mapping `totalWorkoutsCompleted`, `totalTimeSpentSeconds`, `totalRepsCompleted`, `currentStreak`, and `exercisesWithData`, and mapping `activeWorkouts` to a single `activeWorkouts` field
3. THE Stats_Mapper SHALL convert API_Progress `recentActivity` entries (containing `date` and `workoutId`) to the frontend format (containing `date` and `workoutId`)
4. THE Stats_Mapper SHALL convert an API_Weekly to a frontend `WeeklyStats` by mapping all shared fields and omitting `prsAchieved` from the frontend type
5. THE Stats_Mapper SHALL convert a list of Consistency_Entry into a `Map<string, number>` keyed by date string for use by the consistency heatmap hook
6. THE Stats_Mapper SHALL pass through Progression_Point data without transformation, since the API and frontend shapes match (`date`, `reps`, optional `maxWeight`, optional `volume`)

### Requirement 3: Workout Recording via API

**User Story:** As a user, I want my completed workouts to be recorded on the backend, so that my progress is centrally persisted and PRs are automatically detected.

#### Acceptance Criteria

1. WHEN a workout session is completed, THE DataContext SHALL construct a Workout_Log_Input from the session events (exercise sets, reps, weights, timestamps, time spent) and send it to the API via `recordWorkout`
2. WHEN the API returns a Workout_Log_Response with `newPRs`, THE DataContext SHALL make the new PRs available to the UI for display
3. THE Workout_Log_Input SHALL include `workoutId` (the program/challenge ID), `completedAt` (ISO datetime), `timeSpentSeconds`, and an `exercises` array with per-exercise `exerciseId`, `sets` (array of `{ reps, weight?, isBodyweight, timestamp }`), and `lastCompletedAt`
4. IF the `recordWorkout` API call fails, THEN THE DataContext SHALL propagate the error to the caller so the UI can display appropriate feedback
5. WHEN a workout is recorded successfully, THE DataContext SHALL trigger a progress version increment so dependent hooks re-fetch their data

### Requirement 4: Hook Migration to API

**User Story:** As a developer, I want all progress-related hooks to fetch data from the API instead of local storage, so that the app uses the backend as the single source of truth.

#### Acceptance Criteria

1. WHEN the `useAllProgress` hook is called and the API is available, THE hook SHALL fetch aggregated progress from the `fetchProgress` API function and map the response to the `AggregatedProgress` type using the Stats_Mapper
2. WHEN the `usePRs` hook is called and the API is available, THE hook SHALL fetch personal records from the `fetchPRs` API function and map each API_PR to a frontend `PersonalRecord` using the Stats_Mapper
3. WHEN the `useExercisePRs` hook is called and the API is available, THE hook SHALL fetch exercise-specific PRs from the `fetchExercisePRs` API function and map each API_PR to a frontend `PersonalRecord`
4. WHEN the `useWeeklyStats` hook is called and the API is available, THE hook SHALL fetch weekly stats from the `fetchWeeklyStats` API function and map the response to the `WeeklyStats` type using the Stats_Mapper
5. WHEN the `useConsistencyData` hook is called and the API is available, THE hook SHALL fetch consistency data from the `fetchConsistency` API function and use the Stats_Mapper to build the heatmap data structure
6. WHEN the `useExerciseProgression` hook is called and the API is available, THE hook SHALL fetch exercise progression from the `fetchExerciseProgression` API function
7. WHEN the `useExercisesWithProgression` hook is called and the API is available, THE hook SHALL use the `exercisesWithData` field from the `fetchProgress` API response instead of scanning local storage
8. WHILE the API is not available, THE hooks SHALL return an error state with an `APIError` code of `API_DISABLED`

### Requirement 5: Frontend Type Updates

**User Story:** As a developer, I want the frontend types to align with the API response shapes, so that there are no mismatches or unused fields.

#### Acceptance Criteria

1. THE `AggregatedProgress` type SHALL replace `activePrograms` and `activeChallenges` with a single `activeWorkouts` field matching the API response
2. THE `AggregatedProgress` `recentActivity` type SHALL be simplified to `{ date: string; workoutId: string }` matching the API response
3. THE `WeeklyStats` type SHALL remove the `prsAchieved` field that the API does not return
4. THE `PersonalRecord` type SHALL remain unchanged since the Stats_Mapper handles the conversion from API_PR (dropping `userId` and `isCurrent`)
5. THE `AggregatedProgress` type SHALL include an `exercisesWithData` field (array of exercise ID strings) matching the API response

### Requirement 6: Local Storage Cleanup

**User Story:** As a developer, I want to remove the old local storage progress logic, so that the codebase has a single source of truth and no dead code.

#### Acceptance Criteria

1. WHEN the migration is complete, THE codebase SHALL remove local storage functions for progress tracking: `loadProgramProgress`, `saveProgramProgress`, `loadAllProgramProgress`, `loadChallengeProgress`, `saveChallengeProgress`, `loadAllChallengeProgress`, `loadAllPRs`, `savePR`, `detectAndSavePRs`, `getLatestPRs`, `loadPRsForExercise`, `getCurrentPRs`, `getWeeklyStats`, `calculateWeeklyStats`, `getConsistencyData`, and `getExerciseProgression`
2. WHEN the migration is complete, THE codebase SHALL remove local PR detection logic from the session completion flow since the backend handles PR detection
3. WHEN the migration is complete, THE codebase SHALL update all imports that referenced removed storage functions

### Requirement 7: Error Handling

**User Story:** As a user, I want clear feedback when stats API operations fail, so that I understand what happened.

#### Acceptance Criteria

1. IF a network error occurs during a stats API call, THEN THE API_SDK SHALL throw an `APIError` with code `NETWORK_ERROR`
2. IF the API returns a non-success HTTP status for a stats endpoint, THEN THE API_SDK SHALL throw an `APIError` with code `HTTP_ERROR` and the status code
3. IF the API request times out, THEN THE API_SDK SHALL throw an `APIError` with code `TIMEOUT`
4. WHEN a stats API operation fails in a hook, THE hook SHALL expose the error via its return value so the UI can display appropriate feedback
5. IF the `recordWorkout` call fails, THEN THE DataContext SHALL propagate the error to the caller without silently dropping the workout data
