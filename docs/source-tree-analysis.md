# Source Tree Analysis & Architecture (Updated for v1.1)

## Directory Structure Overview (API-Driven)

```
pwo/
├── 📱 app/                           # Expo Router file-based navigation (24 screens)
│   ├── _layout.tsx                   # ROOT LAYOUT: Provider setup, fonts, auth
│   ├── index.tsx                     # ROOT INDEX: Route unauthenticated/authenticated
│   ├── +not-found.tsx                # 404 error handling
│   ├── (auth)/                       # Authentication stack (NEW: group)
│   │   ├── _layout.tsx               # AUTH LAYOUT: Unauthenticated stack
│   │   ├── sign-in.tsx               # SIGN IN: Email/password + guest access (NEW)
│   │   └── sign-up.tsx               # SIGN UP: Account creation (NEW)
│   ├── (tabs)/                       # Tab navigation container (group)
│   │   ├── _layout.tsx               # TAB CONFIG: 4-tab bottom navigation
│   │   ├── index.tsx                 # HOME: Program selector, quick start
│   │   ├── library.tsx               # LIBRARY: Browse exercises & programs
│   │   ├── progress.tsx              # STATISTICS: Progress dashboard
│   │   └── profile.tsx               # PROFILE: Settings & account
│   ├── programs/                     # Program execution
│   │   ├── [id].tsx                  # PROGRAM DETAIL: Stats, start button
│   │   └── [id]/session/[index].tsx  # ⭐ WORKOUT EXECUTION: Main timer (1256 lines)
│   └── library/                      # Content management
│       ├── exercises/
│       │   ├── new.tsx               # CREATE EXERCISE (API-driven)
│       │   └── [id]/edit.tsx         # EDIT EXERCISE (API-driven)
│       ├── programs/
│       │   ├── new.tsx               # CREATE PROGRAM (API-driven)
│       │   └── [id]/edit.tsx         # EDIT PROGRAM (API-driven)
│       ├── scan.tsx                  # QR CODE SCANNER (NEW)
│       └── import/
│           └── preview.tsx           # IMPORT PREVIEW (NEW)
│
├── 🧩 components/                    # 76 Reusable UI components (+22 NEW)
│   ├── common/                       # Atomic design system (12 components)
│   │   ├── AnimatedCard.tsx          # Entrance animation wrapper
│   │   ├── Button.tsx                # Primary CTA with variants
│   │   ├── EmptyState.tsx            # Empty state placeholder
│   │   ├── ErrorScreen.tsx           # Full-screen error display
│   │   ├── IconButton.tsx            # Icon-only button
│   │   ├── ImageViewer.tsx           # Image display with fallback
│   │   ├── LoadingScreen.tsx         # Full-screen loading indicator
│   │   ├── QRCodeScanner.tsx         # Camera QR scanning (ENHANCED)
│   │   ├── ScreenHeader.tsx          # Consistent screen header
│   │   ├── SearchInput.tsx           # Text input with search icon
│   │   ├── SessionListItem.tsx       # Workout session list item
│   │   └── Skeleton.tsx              # Animated skeleton loader
│   │
│   ├── auth/                         # Authentication (NEW: 8 components)
│   │   ├── AuthLayout.tsx            # Auth screen wrapper
│   │   ├── AuthHeader.tsx            # Header text styling
│   │   ├── AuthErrorBanner.tsx       # Error message display
│   │   ├── SignInForm.tsx            # Sign-in form (NEW)
│   │   ├── SignUpForm.tsx            # Sign-up form (NEW)
│   │   ├── GuestAccessOption.tsx     # Guest option UI (NEW)
│   │   ├── PasswordInput.tsx         # Password input with reveal (NEW)
│   │   └── AuthLoadingState.tsx      # Loading state (NEW)
│   │
│   ├── program/                      # Program execution (15 components)
│   │   ├── ProgramView.tsx           # Program card + stats
│   │   ├── ProgramSessionView.tsx    # Session details
│   │   ├── WorkoutExecutionScreen.tsx # ⭐ MAIN TIMER (1256 lines)
│   │   ├── WorkoutMatrix.tsx         # Exercise grid layout
│   │   ├── TimerControls.tsx         # Timer UI controls
│   │   ├── QRCodeShareModal.tsx      # QR generation for share (ENHANCED)
│   │   ├── ProgramImportPreview.tsx  # QR import preview
│   │   ├── WorkoutCompletionModal.tsx # Completion screen (NEW)
│   │   ├── WorkoutSummary.tsx        # Workout summary stats (NEW)
│   │   ├── ExerciseDetail.tsx        # Exercise details (NEW)
│   │   ├── SetTracker.tsx            # Set tracking UI (NEW)
│   │   ├── TimerDisplay.tsx          # Timer render (NEW)
│   │   ├── StepIndicator.tsx         # Step progress (NEW)
│   │   ├── WorkoutPhaseView.tsx      # Phase wrapper (NEW)
│   │   └── RecoveryTimer.tsx         # Rest period timer (NEW)
│   │
│   ├── progress/                     # Progress visualization (12 components)
│   │   ├── ProgressView.tsx          # Streak visualization
│   │   ├── ProgressCard.tsx          # Progress summary card
│   │   ├── ProgressStats.tsx         # Statistics display
│   │   ├── ProgressViewBase.tsx      # Base component
│   │   ├── PersonalRecordsCard.tsx   # PRs summary
│   │   ├── PRItem.tsx                # Individual PR display
│   │   ├── WeeklyChart.tsx           # Weekly activity chart
│   │   ├── WeeklySummaryCard.tsx     # Weekly summary card
│   │   ├── LineChart.tsx             # Custom line chart
│   │   ├── RingChart.tsx             # Ring/donut chart
│   │   ├── ProgressCalendar.tsx      # Calendar heatmap
│   │   └── ConsistencyHeatmap.tsx    # Consistency visualization
│   │
│   ├── data/                         # Data management (NEW: 12 components)
│   │   ├── DataList.tsx              # Virtualized list with filtering
│   │   ├── LoadingStateList.tsx      # Loading state for lists
│   │   ├── SearchableList.tsx        # Full-text search + list
│   │   ├── SortControls.tsx          # Sort UI controls
│   │   ├── FilterControls.tsx        # Filter UI controls
│   │   ├── ProgramListItem.tsx       # Program list item
│   │   ├── ExerciseListItem.tsx      # Exercise list item (NEW)
│   │   ├── UnifiedDataManager.tsx    # Data CRUD manager UI
│   │   ├── EmptyDataState.tsx        # Empty state (NEW)
│   │   ├── DataLoadingError.tsx      # Error state (NEW)
│   │   ├── ConfirmDeleteModal.tsx    # Delete confirmation (NEW)
│   │   └── forms/
│   │       ├── ExerciseForm.tsx      # Exercise create/edit (API-driven)
│   │       ├── ExerciseEditor.tsx    # Advanced editor (API-driven)
│   │       ├── ProgramForm.tsx       # Program builder (API-driven)
│   │       ├── ProgramEditor.tsx     # Advanced editor (API-driven)
│   │       ├── FormInput.tsx         # Reusable input (NEW)
│   │       ├── FormSelect.tsx        # Reusable select (NEW)
│   │       ├── FormValidation.tsx    # Validation display (NEW)
│   │       └── index.ts              # Form exports
│   │
│   ├── qr/                           # QR features (NEW: 5 components)
│   │   ├── QRScanner.tsx             # QR scanner component
│   │   ├── QRGenerator.tsx           # QR code generator
│   │   ├── QRModal.tsx               # QR display modal
│   │   ├── ScanResult.tsx            # Scan result display
│   │   └── index.ts                  # QR exports
│   │
│   └── ConfettiCelebration.tsx       # Celebration animation
│
├── 🪝 hooks/                         # 30 Custom React hooks (+5 NEW)
│   ├── index.ts                      # Barrel export
│   ├── useDeleteConfirmation.ts      # Delete confirmation dialog
│   ├── useAsyncData.ts               # Generic async data fetcher
│   │
│   ├── data/                         # Data fetching hooks (17 hooks)
│   │   ├── useAPIExercises.ts        # Fetch exercises from API (NEW)
│   │   ├── useAPIPrograms.ts         # Fetch programs from API (NEW)
│   │   ├── useAPIWorkouts.ts         # Fetch workouts from API (NEW)
│   │   ├── usePrograms.ts            # Load all programs (API-driven)
│   │   ├── useExercises.ts           # Load exercise library (API-driven)
│   │   ├── useLiveProgress.ts        # 7-day streak tracking (API-driven)
│   │   ├── useSessionCompletion.ts   # Sessions completed status (API-driven)
│   │   ├── useProgramProgress.ts     # Program progress stats (API-driven)
│   │   ├── usePRs.ts                 # Personal records (API-driven)
│   │   ├── useWeeklyStats.ts         # Weekly stats aggregation (API-driven)
│   │   ├── useWeeklyActivity.ts      # Weekly activity data
│   │   ├── useLiveHistory.ts         # Workout history entries
│   │   ├── useAllProgress.ts         # App-wide progress
│   │   ├── useConsistencyData.ts     # Consistency metrics
│   │   ├── useExerciseProgression.ts # Exercise improvement tracking
│   │   ├── useLastCompletedSlug.ts   # Last workout program
│   │   └── index.ts                  # Data hooks barrel export
│   │
│   ├── auth/                         # Authentication hooks (NEW: 3 hooks)
│   │   ├── useSignIn.ts              # Sign-in logic
│   │   ├── useSignUp.ts              # Sign-up logic
│   │   └── index.ts                  # Auth hooks barrel export
│   │
│   ├── ui/                           # UI/UX hooks (NEW: 5 hooks)
│   │   ├── useFormValidation.ts      # Form validation state
│   │   ├── useSearchState.ts         # Search & filter state
│   │   ├── useKeyboardHeight.ts      # Keyboard height tracking
│   │   ├── useDebounce.ts            # Debounced values
│   │   └── index.ts                  # UI hooks barrel export
│   │
│   ├── session/                      # Workout execution hooks (4 hooks)
│   │   ├── useWorkoutTimer.ts        # ⭐ COMPLEX: Timer logic (637 lines)
│   │   ├── useProgramSessionTimer.ts # Program session timer
│   │   ├── useWorkoutSteps.ts        # Convert blocks to steps
│   │   ├── useStepCompletion.ts      # Step navigation state
│   │   └── index.ts                  # Session hooks barrel export
│   │
│   └── index.ts                      # Main barrel export
│
├── 🌍 context/                       # Global state management (2 files)
│   ├── AuthContext.tsx               # Firebase authentication (NEW: 239 lines)
│   │   ├── createContext()
│   │   ├── Provider component
│   │   └── useAuth() custom hook
│   └── DataContext.tsx               # ⭐ REFACTORED STATE (API-driven)
│       ├── Exercise/Program CRUD (API-first)
│       ├── Progress tracking (API-driven)
│       ├── Session persistence
│       ├── Reducer-based state
│       └── Offline fallback logic
│
├── 📚 lib/                           # Utilities and services
│   ├── firebase.ts                   # Firebase initialization
│   ├── api.ts                        # Firebase-authenticated API client (NEW: 467 lines)
│   │   ├── getAuthToken()
│   │   ├── request() generic handler
│   │   ├── Exercise endpoints
│   │   ├── Workout endpoints
│   │   └── Stats endpoints
│   │
│   ├── mappers/                      # Data transformation (NEW: directory)
│   │   ├── workout.ts                # APIWorkout ↔ Program conversion
│   │   ├── stats.ts                  # Stats API → frontend types
│   │   └── index.ts                  # Mapper exports
│   │
│   ├── storage.ts                    # Unified storage layer (Fallback only now)
│   │   ├── Web: localStorage
│   │   └── Native: Expo FileSystem
│   │
│   ├── validation.ts                 # Enhanced data validation
│   │   ├── Exercise validation
│   │   ├── Program validation
│   │   ├── Error codes
│   │   └── Error messages
│   │
│   ├── auditLogger.ts                # Audit trail logging (NEW)
│   ├── dependencyChecker.ts          # Safe deletion checking (NEW)
│   ├── haptics.ts                    # Haptic feedback patterns
│   ├── firebase.ts                   # Firebase config
│   │
│   └── utils/
│       ├── format.ts                 # Number/time formatting
│       ├── progress.ts               # Streak & completion calculations
│       ├── date.ts                   # Date utilities
│       ├── colors.ts                 # Phase color mapping
│       ├── alerts.ts                 # Alert dialog helpers
│       ├── programShare.ts           # QR code generation (ENHANCED)
│       ├── programPrioritization.ts  # Smart program ordering
│       └── errorHandler.ts           # Error handling utilities (NEW)
│
├── 🎨 theme/                         # Design system (1 file)
│   └── theme.ts                      # Design tokens (442 lines)
│       ├── Colors (30+ tokens)
│       ├── Typography (4 font weights)
│       ├── Spacing (6 steps)
│       ├── Radius (6 sizes)
│       └── Shadows (5 levels)
│
├── 📝 types/                         # TypeScript type definitions (7 files)
│   ├── index.ts                      # Centralized exports
│   ├── exercise.ts                   # Exercise entity
│   ├── program.ts                    # Program entity
│   ├── progress.ts                   # Progress tracking types (REFACTORED)
│   ├── storage.ts                    # Storage operation types
│   ├── session.ts                    # Session state types
│   └── enhanced.ts                   # Extended types (NEW)
│       ├── ValidationResult
│       ├── EnhancedExercise
│       ├── EnhancedProgram
│       ├── AuditLogEntry
│       └── More...
│
├── 🧪 __tests__/                     # Test suite (25+ files)
│   ├── lib/
│   │   ├── api.test.ts               # API client tests (NEW)
│   │   ├── validation.test.ts
│   │   ├── storage.test.ts
│   │   ├── mappers/
│   │   │   ├── workout.test.ts       # Mapper tests (NEW)
│   │   │   └── stats.test.ts         # Stats mapper tests (NEW)
│   │   ├── haptics.property.test.ts
│   │   └── utils/
│   │       ├── format.test.ts
│   │       ├── date.test.ts
│   │       └── programShare.test.ts
│   ├── context/
│   │   ├── AuthContext.test.tsx      # Auth context tests (NEW)
│   │   ├── DataContext.test.tsx      # UPDATED: API-driven
│   │   └── dataReducer.test.ts
│   ├── components/
│   │   ├── auth/                     # Auth component tests (NEW)
│   │   │   └── SignInForm.test.tsx
│   │   ├── data/
│   │   │   ├── SearchableList.test.ts
│   │   │   ├── UnifiedDataManager.test.ts
│   │   │   └── forms/
│   │   │       ├── ExerciseForm.property.test.ts
│   │   │       └── ProgramForm.property.test.ts
│   │   └── progress/
│   │       ├── ProgressDataOrganization.property.test.ts
│   │       └── ExerciseProgressionVisualization.property.test.ts
│   └── integration/
│       ├── auth-flow.test.ts         # Auth integration (NEW)
│       ├── api-sync.test.ts          # API sync integration (NEW)
│       ├── data-context-integration.test.ts # UPDATED
│       ├── program-execution-initialization.test.ts
│       ├── program-execution-verification.test.ts
│       └── program-navigation-flow.test.ts
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
│   ├── package.json                  # Dependencies & scripts (UPDATED)
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── vitest.config.ts              # Test framework config
│   ├── vitest.setup.ts               # Test setup
│   ├── .eslintrc                     # ESLint rules
│   ├── .prettierrc                   # Prettier formatting
│   ├── .env.example                  # Environment template (UPDATED)
│   ├── .gitignore                    # Git exclusions
│   └── README.md                     # Project readme (UPDATED)
│
├── 📚 docs/                          # Project documentation (NEW: 4 files)
│   ├── project-overview.md           # Project introduction (UPDATED)
│   ├── architecture.md               # Technical architecture (UPDATED)
│   ├── data-models.md                # Database schema (UPDATED)
│   ├── api-contracts.md              # API documentation (NEW)
│   ├── breaking-changes.md           # Migration guide (NEW)
│   ├── development-guide.md          # Development instructions
│   ├── source-tree-analysis.md       # This file (UPDATED)
│   └── index.md                      # Docs index
│
└── dist/                             # Web export output
    └── [generated web build]
```

---

## Critical Files Explained

### Core Application Entry Points

| File                      | Lines | Purpose                              |
| ------------------------- | ----- | ------------------------------------ |
| `app/_layout.tsx`         | ~100  | Root layout: Providers, font loading |
| `app/index.tsx`           | ~50   | Auth routing decision                |
| `context/DataContext.tsx` | 1518  | **Main state management**            |
| `context/AuthContext.tsx` | 239   | Authentication state                 |
| `lib/storage.ts`          | 950+  | **Persistence layer**                |
| `lib/validation.ts`       | 1070+ | **Data validation**                  |

### UI Components

| Component                    | Lines        | Purpose                             |
| ---------------------------- | ------------ | ----------------------------------- |
| `WorkoutExecutionScreen.tsx` | 1256         | **Main workout timer UI**           |
| `useWorkoutTimer.ts`         | 637+         | **Workout timer logic**             |
| Form Components              | ~400 each    | Exercise/Program/Challenge creation |
| Progress Components          | 100-500 each | Charts, heatmaps, statistics        |

### Configuration & Utilities

| File               | Lines | Purpose                   |
| ------------------ | ----- | ------------------------- |
| `theme/theme.ts`   | 442   | Design tokens and styling |
| `vitest.config.ts` | ~20   | Test configuration        |
| `tsconfig.json`    | ~10   | TypeScript configuration  |
| `package.json`     | ~80   | Dependencies and scripts  |

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

| Metric                  | Count  |
| ----------------------- | ------ |
| **Total Files**         | 140+   |
| **Components**          | 54     |
| **Hooks**               | 25     |
| **Screens**             | 21     |
| **Test Files**          | 23     |
| **Type Files**          | 9      |
| **Total Lines (Core)**  | ~6,500 |
| **Lines (DataContext)** | 1,518  |
| **Lines (Storage)**     | 950+   |
| **Lines (Validation)**  | 1,070+ |
| **Theme Tokens**        | 30+    |
| **API Endpoints**       | 6      |
| **Storage Keys**        | 11     |

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
