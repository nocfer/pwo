# Source Tree Analysis & Architecture

## Directory Structure Overview

```
pwo/
├── 📱 app/                           # Expo Router file-based navigation (21 screens)
│   ├── _layout.tsx                   # ROOT LAYOUT: Provider setup, fonts, auth
│   ├── index.tsx                     # ROOT INDEX: Route unauthenticated/authenticated
│   ├── +not-found.tsx                # 404 error handling
│   ├── (tabs)/                       # Tab navigation container (group)
│   │   ├── _layout.tsx               # TAB CONFIG: 4-tab bottom navigation
│   │   ├── index.tsx                 # HOME: Program selector, quick start
│   │   ├── library.tsx               # LIBRARY: Browse exercises & programs
│   │   ├── progress.tsx              # STATISTICS: Progress dashboard
│   │   └── profile.tsx               # PROFILE: Settings & account
│   ├── (auth)/                       # Authentication stack (group)
│   │   ├── _layout.tsx               # AUTH LAYOUT: Unauthenticated stack
│   │   ├── sign-in.tsx               # SIGN IN: Email/password + guest access
│   │   └── sign-up.tsx               # SIGN UP: Account creation
│   ├── programs/                     # Program execution
│   │   ├── [id].tsx                  # PROGRAM DETAIL: Stats, start button
│   │   └── [id]/session/[index].tsx  # ⭐ WORKOUT EXECUTION: Main timer (1256 lines)
│   └── library/                      # Content management
│       ├── exercises/
│       │   ├── new.tsx               # CREATE EXERCISE
│       │   └── [id]/edit.tsx         # EDIT EXERCISE
│       ├── programs/
│       │   ├── new.tsx               # CREATE PROGRAM
│       │   └── [id]/edit.tsx         # EDIT PROGRAM
│       ├── challenges/
│       │   ├── new.tsx               # CREATE CHALLENGE
│       │   └── [id]/edit.tsx         # EDIT CHALLENGE
│       ├── scan.tsx                  # QR CODE SCANNER
│       └── import/preview.tsx        # IMPORT PREVIEW
│
├── 🧩 components/                    # 54 Reusable UI components
│   ├── common/                       # Atomic design system (12 components)
│   │   ├── AnimatedCard.tsx          # Entrance animation wrapper
│   │   ├── Button.tsx                # Primary CTA with variants
│   │   ├── EmptyState.tsx            # Empty state placeholder
│   │   ├── ErrorScreen.tsx           # Full-screen error display
│   │   ├── IconButton.tsx            # Icon-only button
│   │   ├── ImageViewer.tsx           # Image display with fallback
│   │   ├── LoadingScreen.tsx         # Full-screen loading indicator
│   │   ├── QRCodeScanner.tsx         # Camera QR scanning
│   │   ├── ScreenHeader.tsx          # Consistent screen header
│   │   ├── SearchInput.tsx           # Text input with search icon
│   │   ├── SessionListItem.tsx       # Workout session list item
│   │   └── Skeleton.tsx              # Animated skeleton loader
│   ├── auth/                         # Authentication (3 components)
│   │   ├── AuthLayout.tsx            # Auth screen wrapper
│   │   ├── AuthHeader.tsx            # Header text styling
│   │   └── AuthErrorBanner.tsx       # Error message display
│   ├── program/                      # Program execution (7 components)
│   │   ├── ProgramView.tsx           # Program card + stats
│   │   ├── ProgramSessionView.tsx    # Session details
│   │   ├── WorkoutExecutionScreen.tsx # ⭐ MAIN TIMER (1256 lines)
│   │   ├── WorkoutMatrix.tsx         # Exercise grid layout
│   │   ├── TimerControls.tsx         # Timer UI controls
│   │   ├── QRCodeShareModal.tsx      # QR generation for share
│   │   └── ProgramImportPreview.tsx  # QR import preview
│   ├── progress/                     # Progress visualization (17 components)
│   │   ├── ProgressView.tsx          # Streak visualization
│   │   ├── ProgressCard.tsx          # Progress summary card
│   │   ├── ProgressStats.tsx         # Statistics display
│   │   ├── ProgressViewBase.tsx      # Base component
│   │   ├── ProgressEmptyState.tsx    # No progress state
│   │   ├── ChallengeProgressView.tsx # Challenge tracking
│   │   ├── ProgramProgressView.tsx   # Program tracking
│   │   ├── TargetView.tsx            # Target/goal display
│   │   ├── PersonalRecordsCard.tsx   # PRs summary
│   │   ├── PRItem.tsx                # Individual PR display
│   │   ├── WeeklyChart.tsx           # Weekly activity chart
│   │   ├── WeeklySummaryCard.tsx     # Weekly summary card
│   │   ├── LineChart.tsx             # Custom line chart
│   │   ├── RingChart.tsx             # Ring/donut chart
│   │   ├── EnhancedExerciseProgressionChart.tsx # Advanced progression
│   │   ├── ProgressCalendar.tsx      # Calendar heatmap
│   │   └── ConsistencyHeatmap.tsx    # Consistency visualization
│   ├── data/                         # Data management (12 components)
│   │   ├── DataList.tsx              # Virtualized list with filtering
│   │   ├── LoadingStateList.tsx      # Loading state for lists
│   │   ├── SearchableList.tsx        # Full-text search + list
│   │   ├── SortControls.tsx          # Sort UI controls
│   │   ├── FilterControls.tsx        # Filter UI controls
│   │   ├── ProgramListItem.tsx       # Program list item
│   │   ├── UnifiedDataManager.tsx    # Data CRUD manager UI
│   │   └── forms/
│   │       ├── ExerciseForm.tsx      # Exercise create/edit
│   │       ├── ExerciseEditor.tsx    # Advanced editor
│   │       ├── ProgramForm.tsx       # Program builder
│   │       ├── ProgramEditor.tsx     # Advanced editor
│   │       ├── ChallengeForm.tsx     # Challenge config
│   │       └── ChallengeEditor.tsx   # Advanced editor
│   ├── challenge/                    # Challenge UI (1 component)
│   │   └── ChallengeView.tsx         # Challenge details
│   └── ConfettiCelebration.tsx       # Celebration animation
│
├── 🪝 hooks/                         # 25 Custom React hooks
│   ├── index.ts                      # Barrel export
│   ├── useDeleteConfirmation.ts      # Delete confirmation dialog
│   ├── useAsyncData.ts               # Generic async data fetcher
│   ├── data/                         # Data fetching hooks (17 hooks)
│   │   ├── usePrograms.ts            # Load all programs
│   │   ├── useExercises.ts           # Load exercise library
│   │   ├── useLiveProgress.ts        # 7-day streak tracking
│   │   ├── useSessionCompletion.ts   # Sessions completed status
│   │   ├── useProgramProgress.ts     # Program progress stats
│   │   ├── useChallengeProgress.ts   # Challenge progress tracking
│   │   ├── usePRs.ts                 # Personal records
│   │   ├── useWeeklyStats.ts         # Weekly stats aggregation
│   │   ├── useWeeklyActivity.ts      # Weekly activity data
│   │   ├── useLiveHistory.ts         # Workout history entries
│   │   ├── useAllProgress.ts         # App-wide progress
│   │   ├── useConsistencyData.ts     # Consistency metrics
│   │   ├── useExerciseProgression.ts # Exercise improvement tracking
│   │   ├── useLastCompletedSlug.ts   # Last workout program
│   │   ├── useAPIExercises.ts        # API exercise sync
│   │   └── useChallengeSessions.ts   # Challenge session generation
│   ├── session/                      # Workout execution hooks (4 hooks)
│   │   ├── useWorkoutTimer.ts        # ⭐ COMPLEX: Timer logic (637 lines)
│   │   ├── useProgramSessionTimer.ts # Program session timer
│   │   ├── useWorkoutSteps.ts        # Convert blocks to steps
│   │   └── useStepCompletion.ts      # Step navigation state
│   └── index.ts                      # Barrel export
│
├── 🌍 context/                       # Global state management (2 files)
│   ├── AuthContext.tsx               # Firebase authentication (239 lines)
│   │   ├── createContext()
│   │   ├── Provider component
│   │   └── useAuth() custom hook
│   └── DataContext.tsx               # ⭐ MAIN STATE (1518 lines)
│       ├── Exercise/Program CRUD
│       ├── Progress tracking
│       ├── Session persistence
│       ├── Event logging
│       └── Reducer-based state
│
├── 📚 lib/                           # Utilities and services
│   ├── firebase.ts                   # Firebase initialization
│   ├── api.ts                        # Firebase-authenticated API client (228 lines)
│   ├── storage.ts                    # ⭐ Unified storage layer (950+ lines)
│   │   ├── Web: localStorage
│   │   └── Native: Expo FileSystem
│   ├── validation.ts                 # ⭐ Data validation (1070+ lines)
│   │   ├── Exercise validation
│   │   ├── Program validation
│   │   └── Challenge config validation
│   ├── events.ts                     # Pub-sub event emitter
│   ├── haptics.ts                    # Haptic feedback patterns
│   ├── auditLogger.ts                # Audit trail logging
│   ├── dependencyChecker.ts          # Safe deletion checking
│   └── utils/
│       ├── format.ts                 # Number/time formatting
│       ├── progress.ts               # Streak & completion calculations
│       ├── date.ts                   # Date utilities
│       ├── colors.ts                 # Phase color mapping
│       ├── alerts.ts                 # Alert dialog helpers
│       ├── programShare.ts           # QR code generation
│       └── programPrioritization.ts  # Smart program ordering
│
├── 🎨 theme/                         # Design system (1 file)
│   └── theme.ts                      # ⭐ DESIGN TOKENS (442 lines)
│       ├── Colors (30+ tokens)
│       ├── Typography (4 font weights)
│       ├── Spacing (6 steps)
│       ├── Radius (6 sizes)
│       └── Shadows (5 levels)
│
├── 📝 types/                         # TypeScript type definitions (9 files)
│   ├── index.ts                      # Centralized exports
│   ├── exercise.ts                   # Exercise entity
│   ├── program.ts                    # Program + ChallengeConfig
│   ├── progress.ts                   # Progress tracking types
│   ├── storage.ts                    # Storage operation types
│   ├── session.ts                    # Session state types
│   ├── events.ts                     # Event types
│   ├── challenge.ts                  # Challenge-specific types
│   └── enhanced.ts                   # Extended type utilities
│
├── 🧪 __tests__/                     # Test suite (23 files)
│   ├── lib/
│   │   ├── validation.test.ts
│   │   ├── storage.test.ts
│   │   ├── events.test.ts
│   │   ├── haptics.property.test.ts
│   │   ├── utils/
│   │   │   ├── format.test.ts
│   │   │   ├── date.test.ts
│   │   │   └── programShare.test.ts
│   │   └── storageLibrary.test.ts
│   ├── context/
│   │   ├── DataContext.test.tsx
│   │   ├── dataReducer.test.ts
│   │   └── DataContextCRUD.test.ts
│   ├── components/
│   │   ├── data/
│   │   │   ├── SearchableList.test.ts
│   │   │   ├── UnifiedDataManager.test.ts
│   │   │   └── forms/
│   │   │       ├── ExerciseForm.property.test.ts
│   │   │       ├── ProgramForm.property.test.ts
│   │   │       └── ChallengeForm.property.test.ts
│   │   └── progress/
│   │       ├── ProgressDataOrganization.property.test.ts
│   │       └── ExerciseProgressionVisualization.property.test.ts
│   └── integration/
│       ├── data-context-integration.test.ts
│       ├── program-execution-initialization.test.ts
│       ├── program-execution-verification.test.ts
│       ├── program-navigation-flow.test.ts
│       └── final-integration-verification.test.ts
│
├── 📦 assets/                        # Static assets
│   ├── data/
│   │   ├── programs.json             # Seed programs
│   │   └── targets.json              # Default targets
│   └── sounds/
│       ├── tick.mp3                  # Timer tick sound
│       ├── skip.mp3                  # Skip sound
│       └── completed.mp3             # Completion sound
│
├── ⚙️  Configuration Files
│   ├── package.json                  # Dependencies & scripts
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── vitest.config.ts              # Test framework config
│   ├── vitest.setup.ts               # Test setup
│   ├── .eslintrc                     # ESLint rules
│   ├── .prettierrc                   # Prettier formatting
│   ├── expo.json (implicit)          # Expo configuration
│   ├── .gitignore                    # Git exclusions
│   └── README.md                     # Project readme
│
├── 📚 docs/                          # Project documentation
│   ├── index.md                      # Documentation index (this file)
│   ├── project-overview.md           # Project introduction
│   ├── architecture.md               # Technical architecture
│   ├── data-models.md                # Database schema
│   ├── api-contracts.md              # API documentation
│   ├── development-guide.md          # Development instructions
│   ├── component-inventory.md        # Components reference
│   ├── integration-architecture.md   # Integration points
│   └── source-tree-analysis.md      # This file
│
└── dist/                             # Web export output
    └── [generated web build]
```

---

## Critical Files Explained

### Core Application Entry Points

| File | Lines | Purpose |
|------|-------|---------|
| `app/_layout.tsx` | ~100 | Root layout: Providers, font loading |
| `app/index.tsx` | ~50 | Auth routing decision |
| `context/DataContext.tsx` | 1518 | **Main state management** |
| `context/AuthContext.tsx` | 239 | Authentication state |
| `lib/storage.ts` | 950+ | **Persistence layer** |
| `lib/validation.ts` | 1070+ | **Data validation** |

### UI Components

| Component | Lines | Purpose |
|-----------|-------|---------|
| `WorkoutExecutionScreen.tsx` | 1256 | **Main workout timer UI** |
| `useWorkoutTimer.ts` | 637+ | **Workout timer logic** |
| Form Components | ~400 each | Exercise/Program/Challenge creation |
| Progress Components | 100-500 each | Charts, heatmaps, statistics |

### Configuration & Utilities

| File | Lines | Purpose |
|------|-------|---------|
| `theme/theme.ts` | 442 | Design tokens and styling |
| `vitest.config.ts` | ~20 | Test configuration |
| `tsconfig.json` | ~10 | TypeScript configuration |
| `package.json` | ~80 | Dependencies and scripts |

---

## Data Flow Architecture

```
┌──────────────────────────────────────────────────┐
│ Screens (app/*.tsx)                              │
│ ├─ Home: Browse programs                         │
│ ├─ Library: Manage exercises/programs            │
│ ├─ Progress: View statistics                     │
│ └─ Workout: Execute timer                        │
└──────────────────────────────────────────────────┘
                    ↓ (consume)
┌──────────────────────────────────────────────────┐
│ Components (components/*)                        │
│ ├─ Common: Reusable UI elements                  │
│ ├─ Progress: Charts and visualizations           │
│ ├─ Data: Forms and lists                         │
│ └─ Program: Workout execution UI                 │
└──────────────────────────────────────────────────┘
                    ↓ (use hooks)
┌──────────────────────────────────────────────────┐
│ Hooks (hooks/)                                   │
│ ├─ Data Hooks: usePrograms, usePRs, etc.        │
│ ├─ Session Hooks: useWorkoutTimer, etc.         │
│ └─ Async: useAsyncData for fetching             │
└──────────────────────────────────────────────────┘
                    ↓ (read/write)
┌──────────────────────────────────────────────────┐
│ Context (context/)                               │
│ ├─ AuthContext: User authentication             │
│ └─ DataContext: CRUD + progress tracking        │
└──────────────────────────────────────────────────┘
                    ↓ (persist)
┌──────────────────────────────────────────────────┐
│ Storage Layer (lib/storage.ts)                   │
│ ├─ Unified API for web/native                   │
│ └─ Data transformation/serialization            │
└──────────────────────────────────────────────────┘
                    ↓ (backend)
┌──────────────────────────────────────────────────┐
│ Persistence Backends                             │
│ ├─ Web: localStorage                            │
│ ├─ Native: Expo FileSystem (DocumentDirectory)  │
│ └─ Remote: Firebase (optional)                  │
└──────────────────────────────────────────────────┘
```

---

## Key Statistics

| Metric | Count |
|--------|-------|
| **Total Files** | 140+ |
| **Components** | 54 |
| **Hooks** | 25 |
| **Screens** | 21 |
| **Test Files** | 23 |
| **Type Files** | 9 |
| **Total Lines (Core)** | ~6,500 |
| **Lines (DataContext)** | 1,518 |
| **Lines (Storage)** | 950+ |
| **Lines (Validation)** | 1,070+ |
| **Theme Tokens** | 30+ |
| **API Endpoints** | 6 |
| **Storage Keys** | 11 |

---

## Performance Considerations

### Code Splitting
- **Expo Router**: Automatic per-screen splitting
- **Lazy Routes**: Load on demand

### Caching
- **Firebase Tokens**: Cached by SDK, auto-refresh on expiry
- **Async Data**: Cached with `useAsyncData` hook
- **Search Results**: Cached in Map data structure

### Rendering
- **Skeleton Screens**: For loading states
- **Victory Native**: Optimized charts
- **Platform-Specific**: iOS/Android optimizations

---

## Project Characteristics

### Architecture Pattern
- **Layered**: Screens → Components → Hooks → Context → Storage
- **Feature-Based**: Components organized by domain, not type
- **Context-Driven**: Centralized state with custom hooks

### Code Organization
- **Single Responsibility**: Each file has one purpose
- **Barrel Exports**: index.ts files aggregate exports
- **Type Safety**: TypeScript strict mode enabled
- **Path Aliases**: @/ prefix for clean imports

### State Management
- **React Context API**: No Redux/Zustand
- **Custom Hooks**: Encapsulate data fetching
- **Version Counters**: Loose coupling between components
- **Reducer Pattern**: Complex state mutations

### Data Persistence
- **Offline-First**: All features work locally
- **Unified Storage**: Single API for web/native
- **Optional Firebase**: Cloud sync when authenticated
- **Optional API**: Feature-flagged backend integration

---

## Conclusion

The source tree is organized for:
- **Developer Experience**: Clear structure, easy to find files
- **Maintainability**: Changes isolated to relevant areas
- **Scalability**: New features add to existing patterns
- **Performance**: Lazy loading, code splitting, caching
- **Type Safety**: Comprehensive TypeScript coverage

**Navigation Tips**:
1. **New feature?** → Check similar component/hook
2. **Add component?** → Put in `components/domain/`
3. **Add logic?** → Put in `hooks/` or `lib/`
4. **Add types?** → Put in `types/`
5. **Need test?** → Mirror structure in `__tests__/`

