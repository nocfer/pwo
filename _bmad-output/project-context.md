---
project_name: 'pwo'
user_name: 'Nocfer'
date: '2026-03-06'
sections_completed:
  [
    'technology_stack',
    'language_rules',
    'framework_rules',
    'testing_rules',
    'quality_rules',
    'workflow_rules'
  ]
status: 'complete'
rule_count: 120
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Core Framework & Runtime

- **React**: 19.2.0
- **React Native**: 0.83.2
- **Expo**: ~55.0.4 (major version bump from ~54.0.27)
- **Expo Router**: ~55.0.3 (updated with Expo)
- **TypeScript**: ~5.9.2 (strict mode enabled)

### Navigation & UI

- **React Navigation**: 7.1.8
- **React Navigation (Bottom Tabs)**: 7.4.0
- **Expo Symbols**: ~1.0.8
- **Victory Native**: 41.20.2 (charting library)

### State & Data

- **Firebase**: 12.10.0 (authentication AND backend API integration)
- **React Context API**: Primary state management (no Redux/Zustand)
- **API-Driven Architecture**: All data flows through Firebase backend API
- **Mappers**: `lib/mappers/` for transforming API responses to frontend types

### Development & Build

- **Vitest**: 2.1.0 (testing framework)
- **TypeScript ESLint**: 8.49.0
- **Prettier**: Via eslint-plugin-prettier (config in .prettierrc)
- **ESLint**: 9.25.0 with Expo config preset

### Graphics & Visualization

- **React Native SVG**: 15.12.1
- **Expo Linear Gradient**: ~15.0.8
- **React Native QRCode SVG**: 6.3.21
- **React Native Confetti Cannon**: 1.5.2
- **Expo Camera**: ~17.0.10

### Font System

- Google Fonts via @expo-google-fonts:
  - DM Sans, Inter, Manrope, Plus Jakarta Sans, Sora

### Platform Support

- iOS (via Expo), Android (via Expo), Web (Expo Web at ~0.21.0)

---

## Code Structure & Organization

### Directory Architecture

```
pwo/
├── app/                    # Expo Router file-based routes
│   ├── (auth)/            # Auth screens: sign-in, sign-up
│   ├── (tabs)/            # Bottom tab navigation (home, library, progress, profile)
│   ├── library/           # Data management: exercises, programs, import/scan
│   ├── programs/          # Program details & execution (with workout sessions)
│   ├── index.tsx          # Root redirect (auth state routing)
│   └── _layout.tsx        # Root layout with auth integration
├── components/            # Reusable React components (organized by feature)
│   ├── auth/             # Auth-specific: AuthHeader, AuthLayout, AuthErrorBanner
│   ├── common/           # Shared UI: Button, IconButton, ConfirmationModal, QRCodeScanner
│   ├── data/             # Data management: DataList, FilterControls, UnifiedDataManager
│   ├── data/forms/       # Forms: ExerciseForm, ProgramEditor, ProgramForm
│   ├── program/          # Program UI: WorkoutMatrix, WorkoutExecutionScreen, QRCodeShareModal
│   ├── progress/         # Progress visualizations: EnhancedExerciseProgressionChart
│   └── cards/            # Card components (legacy - challenge cards removed)
├── hooks/                # Custom React hooks (organized by feature)
│   ├── data/            # Data hooks: useAPIExercises, useAPIPrograms, useAsyncData
│   ├── session/         # Session hooks: useStepCompletion, useWorkoutTimer
│   └── index.ts         # Hook exports
├── context/             # React Context (app-wide state)
│   ├── AuthContext.tsx  # Firebase auth state management (NEW)
│   ├── DataContext.tsx  # API-driven data state management
│   └── index.ts         # Context exports
├── lib/                 # Utility functions & services
│   ├── api.ts          # Firebase-authenticated API client (NEW - replaces old storage)
│   ├── mappers/        # Data transformation: workout.ts, stats.ts (NEW)
│   ├── firebase.ts     # Firebase config & init
│   ├── validation.ts   # Enhanced validation with error codes
│   ├── dependencyChecker.ts  # Safe deletion checks
│   ├── auditLogger.ts  # Operation audit logging
│   ├── haptics.ts      # Haptic feedback
│   └── utils/          # Utility functions
├── theme/              # Theme configuration
├── types/              # TypeScript type definitions
│   ├── enhanced.ts    # Enhanced types: EnhancedExercise, EnhancedProgram
│   ├── program.ts
│   ├── exercise.ts
│   ├── session.ts
│   ├── progress.ts    # CHANGED: SessionProgress → WorkoutProgress (simplified)
│   └── index.ts
├── __tests__/          # Test files (mirror src structure)
└── scripts/            # Build and utility scripts
```

---

## Critical Implementation Rules

### TypeScript Configuration

- **Strict Mode**: ENABLED in tsconfig.json
- **Path Alias**: `@/*` maps to root directory
- **Target**: ES2020+ (via Expo TypeScript base)
- **Required**: All files must have proper type annotations; avoid `any` without justification
- **Imports**: Use ES6 module syntax; leverage path aliases with `@/` prefix

### Component Naming & Structure

- **Naming**: PascalCase for component files (e.g., `UserProfile.tsx`)
- **Organization**: Features organized in subdirectories by domain (not by type)
- **Auth Components**: New `components/auth/` subdirectory for auth-specific UI (headers, layouts, error banners)
- **Data Components**: New `components/data/` subdirectory for CRUD UI (lists, filters, managers)
- **Forms**: New `components/data/forms/` subdirectory for reusable form components (ExerciseForm, ProgramEditor)
- **QR Features**: Components for QR scanning and sharing (QRCodeScanner, QRCodeShareModal)
- **Exports**: Use named exports; default exports only for screen components in `app/`
- **Pattern**: Functional components with hooks exclusively
- **DELETED**: `components/challenge/` directory (challenge system removed entirely)

### React Hooks Usage

- **Hooks Library**: 30 custom hooks (expanded from 25 with new API integration hooks)
- **API Integration Hooks**: NEW - `useAPIExercises`, `useAPIPrograms` for backend data fetching
- **Foundation Pattern**: `useAsyncData<T>` - all async operations use this pattern
- **Auth Hooks**: NEW - `useAuthContext` for accessing auth state and methods
- **Data Hooks**: `usePrograms`, `useExercises`, `useProgramProgress`, `useSessionCompletion`
- **Session Hooks**: `useWorkoutSteps`, `useProgramSessionTimer`, `useStepCompletion`
- **UI Hooks**: `useDeleteConfirmation`, `useScreenIconAnimation`
- **Context**: React Context API for global state (not Redux)
- **Rule**: Always place hooks in dedicated `hooks/` directory with clear naming
- **Rule**: Custom hooks should handle data fetching and state management; components should stay presentational
- **DELETED**: Hooks related to challenges and old event system

### Code Style & Formatting

- **Prettier Config** (.prettierrc):
  - No semicolons (`semi: false`)
  - Single quotes (`singleQuote: true`)
  - No trailing commas (`trailingComma: none`)
  - Avoid arrow parens when possible (`arrowParens: avoid`)
- **Linting**: Run `npm run lint:fix` to auto-correct style violations
- **ESLint**: Uses Expo preset with React hooks plugin

### Testing Rules

- **Framework**: Vitest
- **Test Location**: `__tests__/` directory, mirroring source structure
- **Naming**: `*.test.ts` or `*.test.tsx`
- **Coverage**: Configured for `lib/**/*.ts`, `hooks/**/*.ts`, `context/**/*.tsx`
- **Environment**: Node.js test environment
- **Setup**: `vitest.setup.ts` for global test configuration

### File Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`, `WorkoutCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useExercises.ts`, `useProgramProgress.ts`)
- **Utilities**: camelCase (`formatDate.ts`, `calculateStats.ts`)
- **Routes (app/)**: kebab-case with brackets for dynamic segments (`[id].tsx`, `[index].tsx`)

### React Navigation & Routing

- **Navigation Style**: React Navigation 7.x with bottom tab navigation
- **File-Based Routing**: Expo Router (not manual screen registration)
- **Dynamic Routes**: Use bracket notation in filenames: `[id].tsx` becomes a parameterized route
- **Route Groups**: Use parentheses to group screens without affecting URL: `(auth)`, `(tabs)`
- **Pattern**: Each top-level screen in `app/` becomes a routable page

### State Management Patterns

- **Authentication**: Firebase auth via `AuthContext` with sign-in/sign-up flows
- **Global State**: React Context with custom hooks for data and session management
- **API-Driven Data**: All CRUD operations flow through `lib/api.ts` (Firebase backend)
- **Local State**: useState for component-specific state
- **Async State**: Custom hooks handle data fetching from API + caching
- **Pattern**: Use `AuthContext` for auth state; `DataContext` for exercises/programs/progress
- **Graceful Degradation**: App falls back to cached data if API unavailable (offline support)
- **Avoid**: Prop drilling beyond 2 levels; use context instead

### Error Handling

- **Error Boundaries**: Expected in app root (check for ErrorBoundary implementation)
- **UI Feedback**: `ErrorScreen` and `AuthErrorBanner` components exist
- **Validation**: Form validation in dedicated form components (FormBuilder pattern)
- **Firebase Errors**: Handle Firebase auth and database errors gracefully

### Performance Considerations

- **Memoization**: Components use memoization where needed (AnimatedCard suggests React.memo usage)
- **Virtualization**: Check LoadingStateList for virtualization patterns
- **Charts**: Victory Native for performance-optimized charts
- **Animations**: Expo Linear Gradient + Reanimated for smooth native-like animations

### Image Handling

- **Library**: Expo Image (~3.0.11)
- **QR Codes**: React Native QRCode SVG for generation/display
- **Image Viewer**: Custom `ImageViewer.tsx` component for image display
- **Asset Management**: Expo Asset for bundled assets

### Accessibility & UX

- **Components**: IconButton, Button, ScreenHeader indicate accessible UI patterns
- **Gestures**: React Native Gesture Handler for touch interactions
- **Safe Area**: React Native Safe Area Context for notch/safe zone handling
- **Haptics**: Expo Haptics for feedback (celebrate successes, confirm actions)

### Firebase Integration

- **Version**: 12.10.0
- **Use**: Authentication (sign-in, sign-up) AND backend API for all CRUD operations
- **Architecture**: Firebase becomes primary backend; all data flows through `lib/api.ts`
- **Auth Flow**: `AuthContext` manages Firebase auth state; screens redirect based on authentication
- **Error Handling**: Map Firebase error codes to user-friendly messages in `lib/api.ts`
- **Offline Support**: API client gracefully handles offline state with cached data fallback
- **Timestamps**: Convert Firebase timestamps immediately; never store raw timestamps in state
- **Security Rules**: Backend enforces security rules; frontend must respect authenticated user context

### Deployment

- **Web**: Via `npm run predeploy` (exports to Expo Web) + `npm run deploy` (gh-pages)
- **Mobile**: Standard Expo build process (requires EAS Build for production)
- **Platform Targets**: iOS, Android, Web from single codebase

---

## Language-Specific Rules (TypeScript/JavaScript)

### TypeScript Configuration & Type Safety

- **Strict Mode REQUIRED**: All tsconfig.json settings must be honored (strict: true)
- **Path Aliases**: Always use `@/` prefix for imports (e.g., `@/components/Button`, `@/lib/api`)
- **Type Exports**: Export types with `type` keyword when used in multiple files
- **Generic Types**: Use proper generic typing in hooks (e.g., `useAsyncData<T>()`)
- **Enhanced Types**: NEW - Use types from `@/types/enhanced.ts` for API-aligned data: `EnhancedExercise`, `EnhancedProgram`
- **Validation Types**: NEW - `ValidationResult`, `ValidationError` from `@/lib/validation` for error handling
- **Avoid `any`**: Never use `any` unless documented with specific reason

### Import/Export Patterns

- **Named Exports for Components**: Use named exports for component files; only default exports for route files in `app/` directory
- **Barrel Exports**: Many features use index.ts files as entry points (e.g., `hooks/index.ts`, `hooks/data/index.ts`)
- **Module Organization**: Always import from the most specific path (e.g., from `hooks/data` not just `hooks`)
- **Firebase Imports**: Import Firebase services from specific submodules (`firebase/auth`, `firebase/database`)
- **API Imports**: Import API functions from `@/lib/api` (createExercise, updateExercise, deleteExercise, etc.)
- **Mappers**: Use `@/lib/mappers/` for transforming API responses to frontend types

### API Client Usage (NEW - CRITICAL)

- **Pattern**: All backend operations go through `@/lib/api.ts`
- **Examples**:

  ```typescript
  // Exercise CRUD
  import {
    createExercise,
    updateExercise,
    deleteExercise,
    getExercises
  } from '@/lib/api'

  // Program/Workout CRUD
  import {
    createWorkout,
    updateWorkout,
    recordWorkoutProgress
  } from '@/lib/api'

  // Error handling
  const result = await createExercise(data).catch(err => {
    return { error: mapAPIError(err) }
  })
  ```

- **Error Mapping**: Firebase error codes are mapped in `lib/api.ts`; always check for error property in response
- **Authentication**: API client automatically includes Firebase auth token in headers
- **Offline Handling**: API falls back to cached data if network unavailable

### Error Handling Patterns

- **Firebase Errors**: Use helper function pattern to map Firebase error codes to user-friendly messages (see AuthContext)
- **API Errors**: Map error responses from `lib/api.ts` using error code validation
- **Type Guards**: Always check error type before accessing properties (e.g., check `'code' in error` before accessing)
- **Async/Await**: Use try/catch blocks for async operations; never use unhandled Promise rejections
- **Mounted State Tracking**: Use ref to track if component is mounted before setState calls in async operations (critical for memory leaks)
- **Race Condition Prevention**: Use fetch ID tracking in useAsyncData pattern to prevent race conditions from multiple calls

### React Hooks Best Practices

- **useCallback Dependencies**: Explicitly list all dependencies; use `// eslint-disable-next-line react-hooks/exhaustive-deps` only when necessary with code comment explaining why
- **Generic Hook Patterns**: The codebase has a well-established `useAsyncData<T>` pattern - replicate this for similar async patterns
- **API Hooks**: NEW - `useAPIExercises` and `useAPIPrograms` follow useAsyncData pattern internally
- **Hook Cleanup**: Always clean up in useEffect return function, especially for auth state listeners
- **Ref-Based State**: Use `useRef` for values that shouldn't trigger re-renders (mounting status, fetch IDs)

## Framework-Specific Rules (React, Expo & React Native)

### Component Architecture & Structure

- **Theme Integration**: ALL styled components must import and use `theme` from `@/theme/theme`
- **Variant Pattern**: Components use variant-based styling (primary/secondary/ghost for buttons, etc.)
- **Size Props**: Standard sizes are sm/md/lg; use StyleSheet.create() for style definitions
- **Press States**: Always handle Pressable press state with proper visual feedback (opacity/scale)
- **Disabled States**: Disabled props should reduce opacity to 0.5 and disable interactions
- **Auth Components**: NEW - Use `AuthHeader`, `AuthLayout`, `AuthErrorBanner` for consistent auth UI

### Custom Hooks Architecture

- **useAsyncData Pattern**: This is the foundational async hook pattern - use it for ANY async data fetching
  - Template: `useAsyncData<T>(fetcher, deps, { initialData?, skip? })`
  - Always returns: `{ data, loading, error, refetch }`
  - Handles race conditions via fetchIdRef and mounted tracking
- **API Hooks**: NEW - `useAPIExercises<T>()` and `useAPIPrograms<T>()` wrap API calls with useAsyncData internally
- **Data Hooks Organization**: Place data-fetching hooks in `hooks/data/` subdirectory
- **Session Hooks**: Workout-related hooks go in `hooks/session/` subdirectory
- **Hook Exports**: Always re-export from `hooks/index.ts` for barrel imports

### React Context Patterns

- **Authentication Context**: NEW - `AuthContext` manages Firebase auth state (user, isLoading, sign-in/sign-up methods)
- **Data Context**: `DataContext` for exercises, programs, and progress data (API-synced)
- **Context + Provider Pattern**: Use createContext with TypeScript context value typing
- **Helper Functions**: Place auth/error mapping functions INSIDE context file before provider
- **useContext Hook**: Always check for null context and throw error if not wrapped in provider
- **Callback Functions**: Use useCallback for all context methods to prevent unnecessary re-renders
- **Auth State**: Listen to Firebase auth state changes in useEffect with proper cleanup (return unsubscribe)

### Authentication Flow (NEW - CRITICAL)

- **Sign-In Screen**: Email/password authentication via Firebase (`app/(auth)/sign-in.tsx`)
- **Sign-Up Screen**: Account creation with Firebase (`app/(auth)/sign-up.tsx`)
- **Auth Context**: Manages Firebase auth state; provides sign-in/sign-up/sign-out methods
- **Root Redirect**: `app/index.tsx` redirects to auth screens if user not authenticated
- **Error Handling**: Map Firebase auth errors to user-friendly messages (invalid-email, weak-password, etc.)
- **Persistence**: Firebase automatically handles session persistence across app restarts

### Data Management Components (NEW)

- **UnifiedDataManager**: Central component for exercises/programs CRUD operations
- **DataList**: Reusable list component with filtering and sorting
- **FilterControls**: Filter UI for exercise/program data
- **SortControls**: Sort order selection
- **SearchableList**: Integrated search capability
- **Forms**: `ExerciseForm`, `ProgramEditor` for creating/editing data

### QR Code Features (NEW)

- **QRCodeScanner**: Component for scanning QR codes using Expo Camera
- **QRCodeShareModal**: Modal for sharing programs via generated QR codes
- **ProgramImportPreview**: Preview QR-imported programs before import
- **Flow**: Scan QR → Preview → Import into local data

### Haptics Integration

- **Import Pattern**: `import { haptics } from '@/lib/haptics'`
- **Usage**: Call `haptics.buttonTap()` on category changes, `haptics.success()` on form submission
- **Accessibility**: Haptics provide tactile feedback; use consistently across interactive elements

### Form Patterns

- **Form State**: Use useState for form data; structure as object with typed fields
- **Validation**: Separate validation logic to `lib/validation` with exported helper functions
- **Enhanced Validation**: NEW - Validation returns `ValidationResult` with error codes for precise error handling
- **Field Updates**: Use useCallback with generic typing for field update handlers
- **Modal Forms**: Wrap forms in Modal and KeyboardAvoidingView for better UX
- **Save Handlers**: Make onSave async; show loading state while saving; handle API errors gracefully

### Screen Components (in app/ directory)

- **File Naming**: Use kebab-case for route files with dynamic segments in brackets
- **Default Exports**: Route files use default exports (only place in project where this applies)
- **Layout Integration**: Most screens use \_layout.tsx files to define navigation structure
- **Route Parameters**: Access via useLocalSearchParams() hook from expo-router
- **Navigation**: Use navigation/linking helpers from expo-router for deep linking
- **New Auth Screens**: `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`
- **New Import Flows**: `app/library/scan.tsx`, `app/library/import/preview.tsx`
- **Removed Screens**: `app/(tabs)/challenges.tsx`, `app/(tabs)/about.tsx` (challenges feature deleted)

### Performance Patterns

- **React.memo**: Use for components that receive stable props to prevent unnecessary re-renders
- **useCallback**: Use for all callback props to maintain referential equality
- **useMemo**: Use sparingly; typically not needed with proper hook dependency management
- **Lazy Loading**: Consider expo-router dynamic imports for large screen components
- **Victory Charts**: Pre-configured for performance; don't transform data in render
- **List Virtualization**: Use `FlatList` with `getItemLayout` for large data lists

### State Management Anti-Patterns to AVOID

- **DON'T**: Prop drill more than 2 levels - use Context instead
- **DON'T**: Create new objects/arrays in render - use useMemo or move to constants
- **DON'T**: Call hooks conditionally - always call at top level in same order
- **DON'T**: Store Firebase timestamps directly - convert to readable format immediately
- **DON'T**: Create nested Contexts for simple state - flatten and use single context
- **DON'T**: Use old storage patterns - all data goes through API via `@/lib/api`
- **DON'T**: Emit events - use direct API calls + context updates instead

### Expo-Specific Considerations

- **Platform-Specific Code**: Use Platform.OS === 'web' for web-only features
- **Safe Area**: Always wrap root screens in SafeAreaView for notch/island handling
- **Keyboard Handling**: Use KeyboardAvoidingView with behavior="padding" on iOS, "height" on Android
- **Haptics**: Available on mobile; wrap calls in try/catch for web fallback
- **Linear Gradient**: Use for visual polish; always provide fallback backgroundColor

## Testing Rules (Vitest)

### Test Organization & Structure

- **Test File Location**: `__tests__/` directory mirrors source structure (e.g., `__tests__/context/AuthContext.test.tsx` for `context/AuthContext.tsx`)
- **Naming Convention**: Use `*.test.ts` for utility tests and `*.test.tsx` for component/context tests
- **Setup File**: `vitest.setup.ts` loaded for all tests; define global test helpers there
- **Test Environment**: Node.js environment (not jsdom) - React Native compatible
- **NOTE**: Old test files for deleted systems (challenge, events, storage) have been removed; new tests needed for API architecture

### Test Coverage Requirements

- **Coverage Target**: Configured for `lib/**/*.ts`, `hooks/**/*.ts`, `context/**/*.tsx`
- **Minimum**: Aim for 80%+ coverage on critical business logic
- **Core Areas**: Prioritize tests for:
  - API integration (`lib/api.ts` and mappers)
  - Custom hooks (all hooks in `hooks/` directory, especially new useAPIExercises/useAPIPrograms)
  - Validation functions in `lib/validation` with new error codes
  - Context providers and their methods (AuthContext, DataContext)
  - Async data fetching patterns
- **UI Components**: Less critical for coverage; focus on functionality over UI snapshot testing

### Test Patterns for Hooks

- **useAsyncData Tests**: Must test all states (loading, success, error, refetch)
  - Mock the async fetcher function
  - Test initial state, loading state, error state, success state
  - Verify race condition handling (multiple calls don't cause state updates)
  - Test refetch functionality
- **API Hooks Pattern**: NEW - Test `useAPIExercises` and `useAPIPrograms` with mocked API responses
  - Mock `lib/api` functions that fetch from backend
  - Verify data mappers transform responses correctly
  - Test error handling for API failures
  - Test loading states during API calls
- **Data Hooks Pattern**: Test with mock Firebase/context data
  - Verify correct data transformations (via mappers)
  - Test error handling
  - Test loading states
- **Session Hooks**: Test with mock session/timer state changes

### Test Patterns for Context

- **AuthContext Tests**: NEW - Test Firebase auth state management
  - Mock Firebase auth module
  - Test sign-in method with success/error cases
  - Test sign-up method
  - Test sign-out method
  - Test auth state listener initialization and cleanup
- **DataContext Tests**: Test data CRUD operations now going through API
  - Mock `lib/api` functions
  - Test context methods properly call API
  - Test error handling for API failures
  - Test state updates with API responses
- **Provider Tests**: Test context initialization and method availability
- **useContext Hook Tests**: Test error when context not provided

### Mock Usage Conventions (Updated for API Architecture)

- **Firebase Mocks**: Mock entire `firebase/auth` module; provide mock User and auth methods
- **API Mocks**: Mock `@/lib/api` module; mock all API functions (createExercise, getExercises, etc.)
- **Mapper Mocks**: NEW - Mock `@/lib/mappers` for API response transformations
- **Context Mocks**: When testing components using context, wrap in Provider with mock data
- **Async Mocks**: Use `vi.fn().mockResolvedValue()` and `vi.fn().mockRejectedValue()`
- **Cleanup**: Use `afterEach` to reset mocks and clear state between tests

### Testing Anti-Patterns to AVOID

- **DON'T**: Test implementation details; test observable behavior instead
- **DON'T**: Create snapshot tests for UI components; they're brittle and hard to maintain
- **DON'T**: Mock everything; only mock external dependencies (Firebase, API calls)
- **DON'T**: Write tests that depend on execution order; each test should be independent
- **DON'T**: Test Redux/state library mechanics; test your custom logic, not the library
- **DON'T**: Test old storage patterns - they're deleted; focus on API integration tests

### Integration Testing Guidelines

- **Unit Tests First**: Focus on unit tests for business logic
- **API Integration**: Test hooks + API client + mappers working together
- **Context Integration**: Test hooks consuming context together
- **Firebase Integration**: Mock Firebase; don't make real API calls in tests
- **No E2E in Vitest**: Keep to unit/integration; save E2E for e2e test framework
- **Data Flow**: Test complete data flow from API → mapper → hook → component if necessary

### Test Assertions

- **Vitest Syntax**: Use `expect()` assertions from Vitest
- **Async Tests**: Use `await vi.waitFor()` for async state updates
- **Custom Matchers**: Define in vitest.setup.ts if needed for project-specific assertions
- **Error Messages**: Include descriptive messages in assertions: `expect(result).toBe(true, 'User should be authenticated')`

### Running Tests

- **Unit Tests**: `npm test` (watch mode for development)
- **Full Run**: `npm run test:run` (CI mode, single run)
- **Coverage**: `npm run test:coverage` (generates coverage report)
- **Lint Fixes**: Always run `npm run lint:fix` before running tests to catch style issues first

## Code Quality & Style Rules

### Prettier Formatting Rules (Non-Negotiable)

- **No Semicolons**: Never use semicolons at end of statements (semi: false)
- **Single Quotes**: Use single quotes for strings, not double quotes
- **No Trailing Commas**: Arrays and objects should NOT end with trailing commas
- **Arrow Functions**: Omit parentheses on single parameters: `x => x + 1` not `(x) => x + 1`
- **Auto-Format**: Run `npm run lint:fix` before committing to ensure compliance
- **Editor Integration**: Configure IDE to format on save using Prettier

### ESLint Rules & Configuration

- **Preset**: Uses `eslint-config-expo` with React hooks plugin enabled
- **React Hooks**: ESLint enforces hook dependency arrays; exceptions require `// eslint-disable-next-line` comments
- **No Unused Variables**: All imported but unused variables trigger errors - remove if not needed
- **TypeScript ESLint**: Uses v8.49.0; strict type checking rules enabled
- **Web Compatibility**: ESLint configured for React Native + Web; check errors on both

### File Organization & Structure

- **One Component Per File**: Each component/screen should be in its own file
- **Index Files as Exports**: Use `index.ts` files to re-export multiple items (hooks, components)
- **Utility Functions**: Place non-component utilities in `lib/` directory
- **Constants**: Define constants at top of file or in separate `lib/constants` if shared
- **Type Definitions**: Export from separate `types` file or `lib/types` for project-wide types

### Naming Conventions - STRICT

- **Components**: PascalCase (Button.tsx, ExerciseForm.tsx, ProgressCard.tsx)
- **Hooks**: camelCase with `use` prefix (useAsyncData.ts, useProgramProgress.ts)
- **Utilities**: camelCase (formatDate.ts, calculateStats.ts, validateExercise.ts)
- **Constants**: UPPER_SNAKE_CASE (VALID_EXERCISE_CATEGORIES, MAX_DURATION_MINUTES)
- **Routes**: kebab-case with brackets (app/library/programs/[id]/edit.tsx)
- **Context**: PascalCase + "Context" suffix (AuthContext.tsx, DataContext.tsx)
- **Types**: PascalCase + "Type" or just PascalCase (UserType, ExerciseFormData)

### Comment & Documentation Rules

- **JSDoc for Exports**: Add JSDoc comments to exported functions/components (/\*_ ... _/)
- **File Headers**: Optional header comment at top explaining file purpose for complex modules
- **Inline Comments**: Keep minimal; code should be self-explanatory
- **TODO Comments**: Mark with `// TODO:` if temporarily incomplete; explain what's needed
- **Disable Linting**: Use `// eslint-disable-next-line RULE` with brief explanation of why
- **NO Obvious Comments**: Don't comment code that's clear (e.g., `// increment counter`)

### Import Organization

- **Order**: React/external → relative paths with @/ → local relative paths
- **Grouping**: Group related imports together
- **Named Imports**: Prefer named imports; use default only for routes and when appropriate
- **Unused Imports**: Remove immediately; ESLint will flag them
- **Barrel Imports**: Use `@/hooks` or `@/components/common` when importing multiple items

### Component Props & Types

- **Type Definition**: Define Props type before component function
- **Prop Typing**: Use `type Props = { ... }` not `interface Props`
- **Default Props**: Use destructuring with defaults in function signature, not defaultProps
- **Optional Props**: Mark with `?` and provide defaults where sensible
- **Variant Props**: Use union types for variants: `variant?: 'primary' | 'secondary' | 'ghost'`

### Error Prevention Rules

- **Use const**: Always use `const`; never use `let` or `var`
- **Prevent Mutations**: Don't mutate props or state directly
- **Object/Array Methods**: Use modern JS methods (map, filter, reduce, find)
- **Null Coalescing**: Use `??` for null/undefined checks, not `||`
- **Optional Chaining**: Use `?.` for safe property access on potentially null/undefined values

### Code Quality Patterns

- **Pure Functions**: Utility functions should be pure (same input = same output, no side effects)
- **Function Size**: Keep functions under 50 lines; break into smaller functions if longer
- **Complexity**: Avoid deeply nested code; use early returns to reduce nesting
- **DRY Principle**: Don't repeat code; extract to utilities or hooks
- **Single Responsibility**: Each function/component should do one thing well

### Performance Best Practices

- **Avoid Inline Objects**: Don't create new objects in render; use constants or useMemo
- **Avoid Inline Functions**: Don't create new functions in props; use useCallback
- **Avoid Array.map in JSX**: Extract to variable or component before returning JSX
- **Memoization**: Use React.memo for expensive components receiving stable props
- **List Keys**: Always provide stable key prop when rendering lists (not index)

### Code Review Checkpoints

Before committing, verify:

- ✅ `npm run compile` passes (TypeScript compilation)
- ✅ `npm run lint:fix` applied (code style)
- ✅ `npm test` passes (all tests passing)
- ✅ No console.log statements left behind
- ✅ No commented-out code blocks
- ✅ No unused variables or imports
- ✅ Types are properly exported and used

## Development Workflow Rules

### Git Branch Naming Conventions

- **Feature Branches**: `feature/description-of-feature` (e.g., feature/user-authentication)
- **Bug Fixes**: `fix/description-of-bug` (e.g., fix/incorrect-calorie-calculation)
- **Refactoring**: `refactor/description` (e.g., refactor/extract-useAsyncData-pattern)
- **Documentation**: `docs/description` (e.g., docs/api-reference)
- **Testing**: `test/description` (e.g., test/exercise-validation)
- **Main Branch**: Always `main` for production-ready code

### Commit Message Format

- **Standard Format**: `[type]: Brief description (keep under 50 chars)`
- **Types**:
  - `feat`: New feature or component
  - `fix`: Bug fix
  - `refactor`: Code refactoring (no behavior change)
  - `test`: Adding or updating tests
  - `docs`: Documentation changes
  - `style`: Code formatting/linting (no logic change)
  - `perf`: Performance improvements
  - `chore`: Build, dependencies, or CI updates
- **Examples**:
  - `feat: Add workout timer component`
  - `fix: Prevent race condition in useAsyncData`
  - `test: Add coverage for exercise validation`
  - `refactor: Extract theme color constants`
- **Body (Optional)**: If needed, add blank line then detailed explanation
- **No Period at End**: Don't end commit message with a period

### Pull Request Process

- **Before Opening PR**:
  1. Run `npm run compile` (TypeScript check)
  2. Run `npm run lint:fix` (auto-fix style issues)
  3. Run `npm test` (all tests must pass)
  4. Run `npm run test:coverage` (verify coverage is maintained)
  5. Squash or rebase commits into logical groupings
- **PR Title**: Follow commit message format
- **PR Description**:
  - What does this PR do? (1-2 sentences)
  - Why is this change needed? (context)
  - How does it work? (brief technical explanation)
  - Any testing notes or edge cases to verify?
- **Code Review**: Request review from team; address all feedback before merging

### Testing Before Push

- **Required Checklist**:
  - ✅ All tests pass: `npm run test:run`
  - ✅ No linting errors: `npm run lint`
  - ✅ TypeScript compiles: `npm run compile`
  - ✅ Coverage maintained: `npm run test:coverage`
  - ✅ No console.log statements in committed code
  - ✅ No unused variables or imports
- **Local Development**: Use `npm test` (watch mode) during development

### Deployment Workflow

- **Web Deployment**:
  1. Merge PR to `main`
  2. Run `npm run predeploy` (Expo export for web)
  3. Run `npm run deploy` (deploy to gh-pages)
  4. Verify deployment at GitHub Pages URL
- **Mobile Deployment**:
  1. Use EAS Build for iOS and Android
  2. Requires EAS account configuration
  3. Build process handles Expo setup automatically
- **Version Management**: Use semantic versioning in package.json (MAJOR.MINOR.PATCH)

### Code Review Guidelines

**What Reviewers Should Check:**

- ✅ Code follows all project conventions (naming, organization, etc.)
- ✅ Tests are comprehensive (>80% coverage for changed code)
- ✅ No console.log, debugger, or commented-out code
- ✅ Error handling is appropriate and user-friendly
- ✅ Performance considerations addressed (no unnecessary re-renders, etc.)
- ✅ TypeScript types are complete; no use of `any`
- ✅ Firebase/external calls properly error handled
- ✅ Constants used instead of magic numbers/strings

**What Reviewers Should NOT Require:**

- ❌ Snapshot tests (brittle and hard to maintain)
- ❌ 100% code coverage (80%+ on core logic is sufficient)
- ❌ Specific variable naming (as long as it's clear and follows conventions)
- ❌ Personal coding style preferences (enforce via lint config, not review)

### Collaboration Patterns

- **Code Discussion**: Use PR comments for technical discussion
- **Pair Programming**: Use screen sharing for complex features
- **Documentation**: Update relevant docs when changing APIs or patterns
- **Mentoring**: Use code review as teaching opportunity; explain 'why' not just 'what'

### Release Process

- **Version Bump**: Update version in package.json following semantic versioning
- **Tag Release**: `git tag v1.2.3` matching package.json version
- **Release Notes**: Document changes in release tag (GitHub releases)
- **Archive**: Old release branches preserved for historical reference

### Continuous Integration (if applicable)

- **Test Automation**: Tests run on every commit to PR
- **Lint Automation**: Code style checked on every commit
- **Deployment**: CD pipeline deploys merged PRs to web automatically
- **Monitoring**: Monitor deployment logs for errors

---

## Critical Don't-Miss Rules

### Architecture Changes - CRITICAL NEW PATTERNS

- **OLD Storage Pattern DELETED**: `import { storage } from '@/lib/storage'` - this no longer exists
- **NEW API Pattern**: All CRUD operations now go through `@/lib/api.ts`

  ```typescript
  // OLD (deleted):
  await storage.saveExercises(exercises)

  // NEW (required):
  import { createExercise } from '@/lib/api'
  await createExercise(exercise)
  ```

- **Event System DELETED**: `import { events } from '@/lib/events'` - use context + hooks instead
- **Authentication REQUIRED**: All users must authenticate via Firebase before accessing app
- **API-First Mindset**: Think "API backend" not "local storage"

### Data Model Breaking Changes - CRITICAL

- **SessionProgress → WorkoutProgress**: Old complex `SessionProgress` with runs replaced by simpler `WorkoutProgress`
- **Field Rename**: `sessionId` → `workoutId` in PersonalRecord and related types
- **Challenge System DELETED**: Any code using ChallengeProgress, useChallengeProgress, or challenge components will break
- **Migration Required**: Existing progress data must be migrated from old format to new format

### Common Implementation Mistakes to AVOID

- **DON'T use Redux/Zustand**: This project uses React Context API exclusively for state management
- **DON'T create snapshot tests**: Use behavioral/functional tests instead; snapshots are brittle
- **DON'T prop drill**: If passing props through more than 2 levels, use Context instead
- **DON'T forget API error mapping**: Map Firebase/API error codes to user-friendly messages
- **DON'T create new objects in render**: Define constants outside component or use useMemo
- **DON'T use `any` type**: Always provide proper TypeScript types; use `as never` if truly needed with comment
- **DON'T use old storage imports**: All data access goes through API now
- **DON'T emit events**: Old event system is deleted; use direct API calls + context updates
- **DON'T use deleted components**: Challenge components no longer exist; use new data management components instead

### Race Condition Prevention

- **useAsyncData Pattern**: The mounted ref + fetch ID pattern prevents stale state updates
- **Multiple Async Calls**: Always track fetch ID to prevent earlier calls from overwriting newer data
- **Auth State**: Use unsubscribe pattern in useEffect cleanup for Firebase listeners
- **Form Submissions**: Disable submit button during async operations to prevent duplicate submissions
- **API Calls**: Verify request was the most recent before updating state with response

### Firebase-Specific Rules (Updated for API Architecture)

- **Authentication**: Firebase auth is now REQUIRED (not optional)
- **API Tokens**: Firebase automatically handles auth tokens for API calls in `lib/api.ts`
- **Error Codes**: Map ALL Firebase error codes to user messages (auth/invalid-email, auth/weak-password, auth/user-not-found, etc.)
- **Auth State Listener**: Initialize in root layout + AuthContext; don't create multiple listeners
- **Timestamps**: Convert Firebase timestamps immediately; don't store raw timestamps in state
- **Offline Handling**: App uses API client with graceful fallback; handle offline state
- **Security Rules**: Backend enforces security rules; frontend must respect authenticated user context

### Performance Anti-Patterns

- **DON'T**: Create new functions on every render - use useCallback
- **DON'T**: Create new objects/arrays in JSX - use constants or useMemo
- **DON'T**: Render large lists without virtualization - use FlatList with keyExtractor
- **DON'T**: Load all data at once - implement pagination for large datasets
- **DON'T**: Re-render Victory charts with transformed data - transform outside render
- **DON'T**: Store API responses unfiltered in state - use mappers to extract only needed data

### Testing Anti-Patterns

- **DON'T test implementation details**: Test what users see, not internal state
- **DON'T mock too broadly**: Only mock external dependencies (Firebase, API calls)
- **DON'T skip async waiting**: Always use `vi.waitFor()` for state updates
- **DON'T test library code**: Test your custom hooks/logic, not Vitest mechanics
- **DON'T write flaky tests**: Avoid arbitrary timeouts; use waitFor with explicit conditions
- **DON'T test old patterns**: Event system and storage patterns are deleted

### Type Safety Anti-Patterns

- **DON'T**: Use generic `object` type - define specific shape instead
- **DON'T**: Use `null` when `undefined` is clearer - prefer `undefined` for optional values
- **DON'T**: Export bare `any` - at least use `any` locally with comment explaining
- **DON'T**: Skip TypeScript strict mode - it's enabled for a reason
- **DON'T**: Ignore type errors with `// @ts-ignore` - fix the actual issue instead
- **DON'T**: Use deleted types: ChallengeProgress, ChallengeSessions, old SessionProgress structure

### Mobile/Web Compatibility

- **Web Platform**: Haptics don't work - wrap in try/catch
- **Web Platform**: Some Expo modules unavailable - use Platform.OS checks
- **iOS/Android**: Always handle safe areas for notches
- **Keyboard**: Use KeyboardAvoidingView to prevent overlapping inputs
- **Navigation**: Ensure deep linking works across iOS, Android, and Web
- **QR Scanner**: Requires camera permissions; graceful degradation on web

---

## Usage Guidelines

### For AI Agents

Before implementing ANY code in this project:

1. **Read this entire file** - Understand the project context and patterns
2. **Follow ALL rules exactly** - These rules prevent implementation mistakes and ensure consistency
3. **When in doubt, prefer stricter enforcement** - Use `const` not `let`, strict types not `any`, explicit dependencies not disabled linting
4. **Check existing implementations** - Look at existing components, hooks, and patterns before implementing
5. **Ask clarifying questions** - If a rule is ambiguous, ask for clarification rather than guessing
6. **Run the pre-commit checklist** - Before submitting code:
   - ✅ `npm run compile` (TypeScript check)
   - ✅ `npm run lint:fix` (auto-fix style)
   - ✅ `npm test` (tests passing)
   - ✅ `npm run test:coverage` (coverage maintained)

### For Humans

Maintaining this file ensures consistent, high-quality code:

- **Keep this file lean**: Remove rules that have become obvious to all team members
- **Update when technologies change**: Add new versions, libraries, or patterns as they're introduced
- **Review quarterly**: Re-assess rules for relevance and clarity
- **Test rules before documenting**: Ensure new rules actually work before adding them
- **Provide context**: When adding new rules, explain WHY and link to issues if relevant
- **Version tag releases**: Use semantic versioning; document changes in release notes

---

## Quick Reference Checklist

Use this when starting new work:

- [ ] Read all sections relevant to the feature being built
- [ ] Check existing implementations of similar features
- [ ] Verify folder structure and naming conventions before creating files
- [ ] Setup component props types and validation patterns
- [ ] Create hook if data fetching needed (use useAsyncData pattern)
- [ ] Add Firebase integration if needed (handle error mapping)
- [ ] Write tests FIRST if possible (TDD pattern)
- [ ] Run `npm run compile` to check TypeScript
- [ ] Run `npm run lint:fix` to auto-format code
- [ ] Run `npm test` to verify tests pass
- [ ] Check coverage with `npm run test:coverage`
- [ ] Submit PR with description of changes and testing notes

---

**Last Updated**: 2026-03-06 (Updated for v1.1 Architecture - API-Driven + Authentication)
**Status**: ✅ Complete and Ready for AI Agent Integration
**Major Changes**:

- Storage → API-Driven Architecture (lib/api.ts)
- Firebase Authentication Required (AuthContext)
- Challenge System Removed
- SessionProgress → WorkoutProgress (Data Model Change)
- 22 New Components, 17 Deleted, 170+ Total Changes
- Test Coverage: 7 Old Tests Deleted, New Tests Required for API Architecture
