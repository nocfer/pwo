# Requirements Document

## Introduction

This feature integrates the frontend Program data model with the backend Workout API. The backend uses "workouts" terminology while the frontend uses "programs", and the data models differ in block structure, warmup representation, and metadata fields. The integration adds API CRUD functions for workouts, a bidirectional data mapping layer between the two models, and updates the DataContext to fetch and persist programs via the API, following the same patterns established by the existing exercise API integration.

The API response shape is based on the real `GET /api/v1/workouts?expand=blocks.exercise,createdBy` endpoint. No backward compatibility with old local storage data is needed — old data can be deleted.

## Glossary

- **Program**: The frontend representation of a workout plan, containing blocks, warmup configuration, and rest settings. Defined in `types/program.ts`.
- **Workout**: The backend API representation of a workout plan. Uses arrays for reps, rests, and durations per block, and a plain number for warmup seconds.
- **API_Block**: A workout block as represented by the backend API, with `exerciseId`, `reps: number[]`, `rests: number[]`, `durations: number[]`, optional `note`, and an optional expanded `exercise` object.
- **Program_Block**: A workout block as represented by the frontend, with `exerciseId`, `targetReps: number | number[]`, `sets`, `restBetweenSets`, optional `durationSeconds`, and optional `note`.
- **Mapper**: A pure function module responsible for converting between API_Block and Program_Block formats, and between Workout and Program formats.
- **API_SDK**: The existing authenticated API client in `lib/api.ts` that provides typed functions for making backend requests.
- **DataContext**: The global state management context using the Context + Reducer pattern that provides reactive data access throughout the app.
- **Expanded Exercise**: When using `?expand=blocks.exercise`, the API embeds the full exercise object inside each block. The mapper strips this field when converting to frontend ProgramBlock.

## Requirements

### Requirement 1: Workout API SDK Functions

**User Story:** As a developer, I want typed API functions for workout CRUD operations, so that the frontend can communicate with the backend workout endpoints.

#### Acceptance Criteria

1. THE API_SDK SHALL export a `fetchWorkouts` function that returns a list of workouts from `GET /api/v1/workouts`
2. THE API_SDK SHALL export a `fetchWorkout` function that returns a single workout by ID from `GET /api/v1/workouts/{id}`
3. THE API_SDK SHALL export a `createWorkout` function that sends a workout to `POST /api/v1/workouts` and returns the created workout
4. THE API_SDK SHALL export an `updateWorkout` function that sends updates to `PUT /api/v1/workouts/{id}` and returns the updated workout
5. THE API_SDK SHALL export a `deleteWorkout` function that sends a delete request to `DELETE /api/v1/workouts/{id}`
6. WHEN any workout API function is called, THE API_SDK SHALL use Firebase authentication tokens via the existing `request<T>()` helper
7. IF an API request fails, THEN THE API_SDK SHALL throw an `APIError` with an appropriate error code and message

### Requirement 2: Data Model Mapping

**User Story:** As a developer, I want bidirectional mapping between the API Workout model and the frontend Program model, so that data can flow correctly between the backend and the UI.

#### Acceptance Criteria

1. THE Mapper SHALL convert an API_Block `reps` array into a Program_Block `targetReps` value, where a single-element array becomes a number and a multi-element array stays as `number[]`
2. THE Mapper SHALL derive Program_Block `sets` from the length of the API_Block `reps` array, defaulting to 1 when the array is empty
3. THE Mapper SHALL derive Program_Block `restBetweenSets` from the first element of the API_Block `rests` array, defaulting to 60 when the array is empty
4. WHEN an API_Block `durations` array is present and contains at least one non-zero value, THE Mapper SHALL set Program_Block `durationSeconds` to the first non-zero element; WHEN all values are zero or the array is empty, THE Mapper SHALL set `durationSeconds` to undefined
5. THE Mapper SHALL convert a Workout `initialWarmup` number into a Program `initialWarmup` object with a `seconds` property
6. THE Mapper SHALL pass through `id`, `name`, `description`, `source`, `defaultRestBetweenExercises`, `createdAt`, and `updatedAt` fields without transformation
7. THE Mapper SHALL convert a Program_Block `targetReps` value into an API_Block `reps` array, where a single number is expanded to an array of length `sets` (defaulting to 1)
8. THE Mapper SHALL generate an API_Block `rests` array of length `max(0, sets - 1)` filled with `restBetweenSets` (defaulting to 60)
9. THE Mapper SHALL convert a Program `initialWarmup.seconds` value into a Workout `initialWarmup` number, defaulting to 0 when `initialWarmup` is undefined
10. THE Mapper SHALL strip the `createdBy`, `deletedAt`, and expanded `exercise` fields when converting from Workout/API_Block to Program/Program_Block
11. THE Mapper SHALL convert Program_Block `durationSeconds` into an API_Block `durations` array, expanding to match the number of sets; WHEN `durationSeconds` is undefined, THE Mapper SHALL send an empty `durations` array
12. THE Mapper SHALL always set `type` to `'exercise'` on the resulting Program_Block, since API blocks do not carry a `type` field
13. WHEN a Workout contains a `challengeConfig` field, THE Mapper SHALL pass it through to the Program; WHEN absent, THE Mapper SHALL leave `challengeConfig` as undefined (forward-compatible mapping for future backend support)

### Requirement 3: Mapping Round-Trip Integrity

**User Story:** As a developer, I want mapping conversions to preserve data integrity, so that programs are not corrupted when synced through the API.

#### Acceptance Criteria

1. FOR ALL valid Program objects, converting to a Workout and back to a Program SHALL produce an equivalent Program (round-trip property)
2. WHEN a Program_Block has `targetReps` as a single number with `sets` greater than 1, THE Mapper SHALL expand reps to an array of length `sets` and the round-trip SHALL preserve the expanded form
3. WHEN an API_Block has an empty `reps` array, THE Mapper SHALL produce a Program_Block with `targetReps` undefined and `sets` defaulting to 1

### Requirement 4: DataContext API Integration for Programs

**User Story:** As a user, I want my programs to be managed entirely through the backend API, so that my workout data is centrally persisted and available across devices.

#### Acceptance Criteria

1. WHEN the DataContext loads programs and the user is authenticated with API available, THE DataContext SHALL fetch programs from the API and merge them with local seed programs
2. WHEN the DataContext `upsertProgram` action is called and the user is authenticated with API available, THE DataContext SHALL save the program via the API using the Mapper to convert to Workout format
3. IF the API call fails during `upsertProgram`, THEN THE DataContext SHALL propagate the error to the caller
4. WHEN the DataContext `deleteProgram` action is called and the user is authenticated with API available, THE DataContext SHALL delete the program via the API
5. IF the API call fails during `deleteProgram`, THEN THE DataContext SHALL propagate the error to the caller
6. WHEN the DataContext `refreshAll` action is called and the user is authenticated, THE DataContext SHALL re-fetch programs from the API
7. WHEN programs are fetched from the API, THE DataContext SHALL use the Mapper to convert each Workout into a Program before merging into state
8. WHILE the user is not authenticated or the API is not available, THE DataContext SHALL only load seed programs (no user program CRUD operations)

### Requirement 5: API Programs Hook

**User Story:** As a developer, I want a dedicated hook for fetching programs from the API, so that components can access API program data with loading and error states following the established hook pattern.

#### Acceptance Criteria

1. THE `useAPIPrograms` hook SHALL return `data`, `loading`, `error`, and `isAPIAvailable` fields matching the `useAPIExercises` pattern
2. WHEN the hook mounts, THE hook SHALL fetch programs from the API using `fetchWorkouts` and convert them to Program format using the Mapper
3. IF the API is not available, THEN THE hook SHALL set an `APIError` with code `API_DISABLED`
4. WHEN the component unmounts before the fetch completes, THE hook SHALL not update state (mounted guard pattern)

### Requirement 6: Error Handling

**User Story:** As a user, I want clear feedback when API operations fail, so that I understand what happened and my data remains safe.

#### Acceptance Criteria

1. IF a network error occurs during a workout API call, THEN THE API_SDK SHALL throw an `APIError` with code `NETWORK_ERROR`
2. IF the API returns a 404 status for a workout, THEN THE API_SDK SHALL throw an `APIError` with code `HTTP_ERROR` and status code 404
3. IF the API request times out, THEN THE API_SDK SHALL throw an `APIError` with code `TIMEOUT`
4. WHEN an API operation fails in the DataContext, THE DataContext SHALL propagate the error to the caller so the UI can display appropriate feedback

### Requirement 7: Create/Update Input Shape

**User Story:** As a developer, I want the create/update payload to match what the backend accepts, so that API calls succeed without sending unsupported fields.

#### Acceptance Criteria

1. THE Mapper SHALL produce an `APIWorkoutCreateInput` that includes only `name`, `description`, `blocks`, `initialWarmup`, and `defaultRestBetweenExercises` fields
2. THE Mapper SHALL exclude `challengeConfig`, `source`, `createdBy`, `createdAt`, `updatedAt`, and `deletedAt` from the create/update input (the server manages these fields)
3. WHEN converting Program blocks for the create/update input, THE Mapper SHALL exclude the expanded `exercise` field from each block
