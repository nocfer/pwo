# Project Structure

## Root Organization

```
progressive-workout/
├── app/                    # Expo Router pages (file-based routing)
├── components/             # Reusable UI components
├── context/               # React Context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries and helpers
├── types/                 # TypeScript type definitions
├── theme/                 # Design system and styling
├── assets/                # Static assets (images, fonts, data)
└── __tests__/             # Test files
```

## App Directory (Expo Router)

- `app/(tabs)/` - Tab-based navigation screens
- `app/library/` - Exercise and program management
- `app/programs/` - Program execution and sessions
- `app/onboarding/` - User onboarding flow
- File-based routing with typed routes enabled

## Components Architecture

```
components/
├── common/                # Shared UI components (Button, LoadingScreen, etc.)
├── cards/                 # Card-based components (FocusCard, StepCard)
├── challenge/             # Challenge-specific components
├── program/               # Program-related components
├── progress/              # Progress tracking and analytics
├── session/               # Workout session components
└── index.ts               # Barrel exports
```

## Data Layer

```
context/
└── DataContext.tsx        # Global state management with reducer pattern

hooks/
├── data/                  # Data fetching and management hooks
├── session/               # Session-specific hooks (timers, steps)
└── useAsyncData.ts        # Generic async data hook
```

## Type System

```
types/
├── index.ts               # Centralized type exports
├── exercise.ts            # Exercise-related types
├── program.ts             # Program and session types
├── progress.ts            # Progress tracking types
├── challenge.ts           # Challenge-specific types
├── storage.ts             # Storage and persistence types
└── events.ts              # Event system types
```

## Utilities & Libraries

```
lib/
├── storage.ts             # Data persistence layer
├── events.ts              # Event system for reactive updates
├── haptics.ts             # Tactile feedback utilities
└── utils/                 # Helper functions (date, format, colors, etc.)
```

## Assets Organization

```
assets/
├── data/                  # JSON seed data (exercises, programs)
├── fonts/                 # Custom font files (DM Sans variants)
├── images/                # App icons and graphics
└── sounds/                # Audio feedback files
```

## Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase with descriptive names
- **Hooks**: Prefix with `use` (usePrograms, useSessionTimer)
- **Types**: PascalCase interfaces and types
- **Constants**: UPPER_SNAKE_CASE for static values

## Import Patterns

- Use `@/` path alias for absolute imports from root
- Barrel exports in index.ts files for clean imports
- Group imports: React, third-party, local components, types
