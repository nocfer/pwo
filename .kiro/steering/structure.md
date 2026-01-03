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
- `app/(tabs)/` - Tab-based navigation screens (index, challenges, progress, etc.)
- `app/library/` - CRUD screens for exercises, programs, and challenges
- `app/programs/` - Program execution and session screens
- `app/onboarding/` - User onboarding flow

## Components Organization
- `components/common/` - Shared UI components (Button, LoadingScreen, etc.)
- `components/data/` - Data management components (forms, lists, search)
- `components/progress/` - Progress tracking and visualization
- `components/program/` - Program-specific components
- `components/challenge/` - Challenge-specific components

## Hooks Structure
- `hooks/data/` - Data fetching and state management hooks
- `hooks/session/` - Workout session management hooks
- Root level hooks for general utilities

## Library Organization
- `lib/storage.ts` - Data persistence abstraction
- `lib/events.ts` - Event system for cross-component communication
- `lib/validation.ts` - Data validation and business rules
- `lib/utils/` - Utility functions (date, format, colors, etc.)

## Types Structure
- Centralized in `types/index.ts` with re-exports
- Domain-specific files: `exercise.ts`, `program.ts`, `progress.ts`, etc.
- Enhanced types for advanced features in `enhanced.ts`

## Testing Structure
- `__tests__/` mirrors the source directory structure
- Property-based tests use `.property.test.ts` suffix
- Integration tests in `__tests__/integration/`

## Key Conventions

### File Naming
- React components use PascalCase: `ExerciseForm.tsx`
- Utilities and hooks use camelCase: `useExercises.ts`
- Types use camelCase with descriptive names: `exercise.ts`

### Import Patterns
- Use `@/` path alias for all internal imports
- Group imports: external libraries, then internal modules
- Export components from index files for clean imports

### Component Structure
- Functional components with TypeScript interfaces
- Custom hooks for business logic separation
- Context for global state, local state for component-specific data

### Data Flow
- Global state via DataContext with reducer pattern
- Event-driven updates for cross-component communication
- Storage abstraction for all data persistence
- Validation layer before any data mutations