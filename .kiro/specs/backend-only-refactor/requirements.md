# Requirements Document

## Introduction

This specification covers the refactoring of the Progressive Workout app from a hybrid local-storage/API architecture to a fully stateless, API-only architecture. All local persistence (`lib/storage.ts`), the event pub/sub system (`lib/events.ts`), and seed data loading (`assets/data/programs.json`) will be removed. The app will rely exclusively on the backend API for data, fail with clear error messages when the API is unavailable, and accumulate workout session data in memory rather than writing events to local storage.

## Glossary

- **API_SDK**: The authenticated HTTP client in `lib/api.ts` that communicates with the backend REST API using Firebase auth tokens.
- **DataContext**: The React Context provider in `context/DataContext.tsx` that manages global app state for exercises, programs, and session data.
- **Storage_Layer**: The local persistence module in `lib/storage.ts` that reads/writes data to `localStorage` (web) or `expo-file-system` (native).
- **Event_System**: The pub/sub module in `lib/events.ts` (`dataEvents`) used for reactive cross-component communication.
- **Seed_Data**: Built-in program definitions loaded from `assets/data/programs.json` at startup.
- **Data_Hook**: A React hook in `hooks/data/` that fetches and returns domain-specific data (exercises, programs, progress, stats).
- **Session_Accumulator**: In-memory state that collects workout set data (reps, weights, timestamps) during an active session.
- **Workout_Log**: The `WorkoutLogInput` payload POSTed to `POST /api/v1/stats/workouts` when a session completes.
- **Mapper**: A function in `lib/mappers/` that converts between API response shapes and frontend type shapes.

## Requirements

### Requirement 1: Remove Local Storage Layer

**User Story:** As a developer, I want to remove the entire local storage layer, so that the app has a single source of truth (the backend API) and no stale local data.

#### Acceptance Criteria

1. WHEN the app starts, THE DataContext SHALL fetch exercises exclusively from the API_SDK `fetchExercises` endpoint without reading from the Storage_Layer.
2. WHEN the app starts, THE DataContext SHALL fetch programs exclusively from the API_SDK `fetchWorkouts` endpoint without reading from the Storage_Layer.
3. WHEN any component attempts a data operation, THE App SHALL not import or reference the Storage_Layer module `lib/storage.ts`.
4. THE Build SHALL succeed with the `lib/storage.ts` file deleted from the project.

### Requirement 2: Remove Event System

**User Story:** As a developer, I want to remove the event pub/sub system, so that data reactivity is handled through direct state updates and API re-fetching instead of a custom event bus.

#### Acceptance Criteria

1. WHEN a data mutation occurs (create, update, delete), THE DataContext SHALL trigger a re-fetch from the API or update React state directly instead of emitting events through the Event_System.
2. WHEN any component needs to react to data changes, THE component SHALL use React state, context, or version counters from the DataContext instead of subscribing to the Event_System.
3. THE Build SHALL succeed with the `lib/events.ts` file deleted from the project.

### Requirement 3: Refactor DataContext to API-Only

**User Story:** As a developer, I want the DataContext to operate exclusively through the API, so that all data flows through a single, consistent path.

#### Acceptance Criteria

1. WHEN loading exercises on mount, THE DataContext SHALL call `fetchExercises` from the API_SDK and dispatch the result to state without merging with local storage data.
2. WHEN loading programs on mount, THE DataContext SHALL call `fetchWorkouts` from the API_SDK, map results through `workoutToProgram`, and dispatch to state without loading Seed_Data.
3. WHEN upserting an exercise, THE DataContext SHALL call the API_SDK create or update endpoint, then re-fetch the full exercise list from the API and dispatch to state.
4. WHEN deleting an exercise, THE DataContext SHALL call the API_SDK delete endpoint, then re-fetch the full exercise list from the API and dispatch to state.
5. IF the API_SDK returns an error during an exercise CRUD operation, THEN THE DataContext SHALL propagate the error to the caller without falling back to local storage.
6. WHEN a user is not authenticated, THE DataContext SHALL set exercises and programs to empty arrays and set loading to false.
7. WHEN `refreshAll` is called, THE DataContext SHALL re-fetch both exercises and programs from the API_SDK and increment version counters.

### Requirement 4: In-Memory Session Accumulation

**User Story:** As a user, I want my workout session data to be collected in memory during the session and sent to the API when I finish, so that I do not need local storage for session tracking.

#### Acceptance Criteria

1. WHEN a set is completed during a workout session, THE Session_Accumulator SHALL store the exercise ID, reps, weight, bodyweight flag, and timestamp in React state.
2. WHEN a session is completed, THE DataContext SHALL build a Workout_Log from the Session_Accumulator data and POST it to the API_SDK `recordWorkout` endpoint.
3. WHEN a session is completed, THE DataContext SHALL increment `progressVersion` so that dependent Data_Hooks re-fetch from the API.
4. IF the app closes mid-workout, THEN THE Session_Accumulator data SHALL be lost and the user starts a new session on next launch.
5. WHEN a session is completed, THE DataContext SHALL not write events, history, or streak data to the Storage_Layer.

### Requirement 5: Refactor Storage-Dependent Data Hooks

**User Story:** As a developer, I want all data hooks to fetch from the API, so that the app displays consistent, server-authoritative data.

#### Acceptance Criteria

1. WHEN `useWeeklyActivity` is called, THE Data_Hook SHALL fetch weekly stats from the API_SDK `fetchWeeklyStats` endpoint instead of reading streaks from the Storage_Layer.
2. WHEN `useLiveProgress` is called, THE Data_Hook SHALL fetch progress from the API_SDK `fetchProgress` endpoint instead of reading streaks from the Storage_Layer.
3. WHEN `useLiveHistory` is called, THE Data_Hook SHALL fetch recent activity from the API_SDK `fetchProgress` endpoint instead of reading history from the Storage_Layer.
4. WHEN `useProgramProgress` is called, THE Data_Hook SHALL fetch progress from the API_SDK `fetchProgress` endpoint and include a TODO comment noting that the backend does not yet support per-program session tracking.
5. WHEN `useSessionCompletion` is called, THE Data_Hook SHALL fetch completed session data from the API_SDK and include a TODO comment noting that the backend does not yet support per-program completed session tracking.
6. WHEN `useChallengeProgress` is called, THE Data_Hook SHALL include a TODO comment noting that the backend has no challenge-specific progress tracking and return placeholder data from available API endpoints.

### Requirement 6: Refactor Components and Screens

**User Story:** As a developer, I want all components and screens to use API data instead of local storage, so that the UI is consistent with the backend state.

#### Acceptance Criteria

1. WHEN the `ProgressCalendar` component loads, THE component SHALL fetch consistency data from the API_SDK `fetchConsistency` endpoint instead of reading from the Storage_Layer.
2. WHEN the profile screen displays data management options, THE profile screen SHALL remove the "Clear Progress Data" and "Clear All Data" buttons that call Storage_Layer methods, or replace them with account-level actions.
3. WHEN `programPrioritization` calculates priority scores, THE utility SHALL use data available from the API (e.g., progress data from `fetchProgress`) instead of reading from the Storage_Layer.

### Requirement 7: Remove Seed Data

**User Story:** As a developer, I want to remove seed program loading, so that the backend API is the sole source of programs.

#### Acceptance Criteria

1. WHEN the DataContext loads programs, THE DataContext SHALL not import or load `assets/data/programs.json`.
2. WHEN a user is authenticated but the API returns zero programs, THE App SHALL display an empty state for the programs list.
3. WHEN a user is not authenticated, THE App SHALL display an empty state or redirect to login instead of showing seed programs.

### Requirement 8: Error Handling for API Unavailability

**User Story:** As a user, I want to see clear error messages when the API is unavailable, so that I understand why data is not loading.

#### Acceptance Criteria

1. IF the API_SDK returns a network error during data fetching, THEN THE Data_Hook SHALL set an error state with a descriptive message.
2. IF the API_SDK returns a network error during a CRUD operation, THEN THE DataContext SHALL propagate the error to the caller so the UI can display an error popup.
3. IF the API_SDK is disabled or not configured, THEN THE Data_Hook SHALL set an error state indicating the API is not available.
4. WHEN an error occurs, THE App SHALL not silently fall back to local data or empty results without indicating the error to the user.

### Requirement 9: Cleanup Dead Code

**User Story:** As a developer, I want to remove all dead code related to local storage and events, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. THE Build SHALL succeed after deleting `lib/storage.ts` and `lib/events.ts`.
2. WHEN the refactor is complete, THE codebase SHALL contain zero imports of `lib/storage` or `@/lib/storage`.
3. WHEN the refactor is complete, THE codebase SHALL contain zero imports of `lib/events` or `@/lib/events`.
4. WHEN the refactor is complete, THE codebase SHALL not reference types used exclusively by the Storage_Layer (e.g., `HistoryFile`, `StreakEntry`) unless those types are repurposed for API data.
5. WHEN the refactor is complete, THE codebase SHALL not reference the `dataEvents` object or any Event_System subscription/emission functions.
