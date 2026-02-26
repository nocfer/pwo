---
inclusion: always
---

# Project Structure

## Root Directory Organization

```
progressive-workout/
├── app/                    # Expo Router pages and navigation
├── components/             # Reusable UI components
├── context/               # React Context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries and services
├── types/                 # TypeScript type definitions
├── assets/                # Static assets (images, sounds, data)
├── theme/                 # Design system and styling
├── __tests__/             # Test files mirroring source structure
└── .kiro/                 # Kiro AI assistant configuration
```

## App Directory (Expo Router)

File-based routing with Expo Router. Each file/folder becomes a route.

- `app/(tabs)/` - Tab-based navigation screens (index, library, progress, profile)
- `app/(auth)/` - Authentication screens (sign-in, sign-up)
- `app/library/` - CRUD screens for exercises and programs
  - `exercises/[id]/edit.tsx` - Edit individual exercises
  - `programs/[id]/edit.tsx` - Edit individual programs
  - `import/preview.tsx` - QR code import preview
  - `scan.tsx` - QR code scanner
- `app/programs/` - Program execution
  - `[id].tsx` - Program details and start
  - `[id]/session/[index].tsx` - Active workout session
- `app/index.tsx` - Root redirect to auth or tabs
- `app/_layout.tsx` - Root layout with navigation setup

## Components Organization

Organized by feature domain with shared utilities in `common/`.

- `components/common/` - Reusable UI primitives (Button, LoadingScreen, ScreenHeader, etc.)
- `components/auth/` - Authentication-specific components (AuthLayout, AuthHeader, AuthErrorBanner)
- `components/data/` - Data management and forms
  - `forms/` - ExerciseForm, ProgramForm, ProgramEditor
  - `DataList.tsx`, `SearchableList.tsx` - List rendering
  - `FilterControls.tsx`, `SortControls.tsx` - Data filtering
  - `UnifiedDataManager.tsx` - Centralized data CRUD interface
- `components/progress/` - Progress tracking and charts
  - `ConsistencyHeatmap.tsx`, `ProgressCalendar.tsx` - Calendar views
  - `EnhancedExerciseProgressionChart.tsx`, `LineChart.tsx` - Charts
  - `PersonalRecordsCard.tsx`, `PRItem.tsx` - PR display
  - `ProgramProgressView.tsx` - Program-level progress
- `components/program/` - Program execution and display
  - `ProgramView.tsx` - Program details
  - `ProgramSessionView.tsx` - Session overview
  - `WorkoutExecutionScreen.tsx` - Active workout UI
  - `WorkoutMatrix.tsx` - Exercise block matrix
  - `QRCodeShareModal.tsx` - QR code generation
  - `ProgramImportPreview.tsx` - Import preview
- `components/cards/` - Reusable card components (StepCard)

## Hooks Structure

Custom hooks for data and session management.

- `hooks/data/` - Data fetching and state management
  - `usePrograms.ts` - Program CRUD operations
  - `useExercises.ts` - Exercise CRUD operations
  - `useProgramProgress.ts` - Progress data fetching
  - `useWeeklyStats.ts` - Weekly statistics
  - `index.ts` - Re-exports all data hooks
- `hooks/session/` - Workout session management
  - `useWorkoutSteps.ts` - Step progression logic
  - `useWorkoutTimer.ts` - Timer state and controls
- Root level hooks - General utilities (useAsync, useDebounce, etc.)

## Library Organization

Core business logic and utilities.

- `lib/storage.ts` - AsyncStorage abstraction for data persistence
- `lib/events.ts` - Event emitter for cross-component communication
- `lib/validation.ts` - Data validation and business rules
- `lib/api.ts` - API client and network requests
- `lib/dependencyChecker.ts` - Dependency validation utilities
- `lib/utils/` - Utility functions
  - `date.ts` - Date formatting and calculations
  - `format.ts` - Number and text formatting
  - `colors.ts` - Color utilities
  - `sessionBuilder.ts` - Workout session construction

## Types Structure

Centralized TypeScript definitions.

- `types/index.ts` - Main export file with re-exports from domain files
- Domain-specific files:
  - `types/exercise.ts` - Exercise types
  - `types/program.ts` - Program and session types
  - `types/progress.ts` - Progress and PR types
  - `types/enhanced.ts` - Advanced feature types

## Testing Structure

Tests mirror source structure with property-based testing support.

- `__tests__/` - Test files organized by source directory
- `__tests__/integration/` - Integration tests for context and data flow
- Naming conventions:
  - Unit tests: `ComponentName.test.ts`
  - Property-based tests: `validation.property.test.ts`

## Key Conventions

### File Naming

- React components: PascalCase (e.g., `ExerciseForm.tsx`, `ProgramView.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `usePrograms.ts`, `useWorkoutTimer.ts`)
- Utilities and services: camelCase (e.g., `validation.ts`, `sessionBuilder.ts`)
- Types: camelCase with descriptive names (e.g., `exercise.ts`, `program.ts`)

### Import Patterns

- Always use `@/` path alias for internal imports (e.g., `@/components/common`, `@/hooks/data`)
- Group imports in order: external libraries → internal modules → types
- Export components and utilities from `index.ts` files for clean imports
- Example: `import { Button, LoadingScreen } from '@/components/common'`

### Component Structure

- Functional components with TypeScript interfaces for props
- Extract business logic into custom hooks
- Use local state for component-specific data
- Use Context for global state (DataContext)
- Props interfaces should be named `{ComponentName}Props`

### Data Flow Architecture

- **Global state**: DataContext with useReducer pattern for exercises, programs, progress
- **Event-driven updates**: Event emitter for cross-component communication (e.g., session completion)
- **Storage abstraction**: All persistence goes through `lib/storage.ts`
- **Validation layer**: Validate data before mutations using `lib/validation.ts`
- **Data hooks**: Custom hooks in `hooks/data/` handle fetching and state management
- **Session management**: Separate hooks in `hooks/session/` for workout-specific logic

### Code Organization Rules

- Keep components focused on UI rendering
- Move complex logic to custom hooks
- Use composition over inheritance
- Avoid prop drilling; use Context for deeply nested data
- Keep styles in StyleSheet at bottom of component files
- Use theme constants for all styling decisions
