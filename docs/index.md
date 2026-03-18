# Progressive Workout (PWO) - Project Documentation Index

## Welcome to PWO Documentation

This is your comprehensive guide to the Progressive Workout application. Whether you're implementing new features, fixing bugs, or onboarding to the project, start here.

**Last Updated**: 2026-03-06 | **Scan Depth**: Exhaustive | **Documentation Version**: 1.0

---

## 🚀 Quick Start

### For New Developers

1. **[Project Overview](./project-overview.md)** (Start here!)
   - What is Progressive Workout?
   - Quick facts and features
   - Getting started steps

2. **[Development Guide](./development-guide.md)**
   - Installation instructions
   - Local development setup
   - Available npm commands

3. **[Architecture Overview](./architecture.md)** (Next)
   - High-level system design
   - Component organization
   - Data flow patterns

### For Feature Development

- **Feature involves UI?** → [Component Inventory](./component-inventory.md)
- **Feature involves data?** → [Data Models](./data-models.md)
- **Feature involves API?** → [API Contracts](./api-contracts.md)
- **Feature involves routing?** → [Architecture - Screens & Navigation](./architecture.md#screen--navigation-architecture)
- **Feature involves state?** → [Architecture - State Management](./architecture.md#state-management-architecture)

---

## 📚 Core Documentation

### [1. Project Overview](./project-overview.md)

**Quick introduction to the app**

- Features and capabilities
- Technology stack summary
- Repository structure
- Getting started checklist

### [2. Architecture](./architecture.md)

**Complete technical architecture**

- Layered architecture diagram
- Component organization
- State management patterns
- Data flow and hooks architecture
- Screen & navigation structure
- Storage architecture
- Firebase integration
- Performance optimizations
- Security considerations

### [3. Data Models](./data-models.md)

**Database schema and entity models**

- Exercise entity
- Program and blocks
- Progress tracking (ProgramProgress, ChallengeProgress)
- Personal Records (PRs)
- Event tracking
- Statistics models
- Data constraints and validation
- ER diagram

### [4. Component Inventory](./component-inventory.md)

**All 54 UI components documented**

- Common components (12)
- Auth components (3)
- Program components (7)
- Progress components (17)
- Data management components (12)
- Challenge components (1)
- Component API and usage examples

### [5. API Contracts](./api-contracts.md)

**Backend API endpoints and contracts**

- Firebase authentication endpoints
- Optional backend API (exercises CRUD)
- Request/response schemas
- Error handling
- Authentication strategy

### [6. Development Guide](./development-guide.md)

**Local development instructions**

- Prerequisites and installation
- Environment variables
- Running the app (web, iOS, Android)
- Available npm scripts
- Testing and debugging
- Troubleshooting

### [7. Source Tree Analysis](./source-tree-analysis.md)

**Annotated directory structure**

- Complete folder tree
- Critical directories explained
- Entry points documented
- File organization rationale

### [8. Integration Architecture](./integration-architecture.md)

**How components communicate**

- Firebase integration points
- Backend API integration
- Storage layer integration
- State management integration

---

## 🎯 Key Features Documentation

### Workout Execution

- **File**: `app/programs/[id]/session/[index].tsx`
- **Hook**: `hooks/session/useWorkoutTimer.ts`
- **Architecture Doc**: [Architecture - Workout Execution Flow](./architecture.md#workout-execution-flow)

### Progress Tracking

- **Components**: `components/progress/*` (17 files)
- **Hooks**: `hooks/data/useLiveProgress.ts`, `usePRs.ts`, etc.
- **Data**: [Data Models - Progress Tracking](./data-models.md#progress-tracking-models)

### Program & Exercise Management

- **Components**: `components/data/forms/*`
- **Context**: `context/DataContext.tsx` (CRUD actions)
- **Validation**: `lib/validation.ts`

### Challenges

- **Data Model**: [ChallengeConfig](./data-models.md#challenge-tracking)
- **Progress**: `ChallengeProgress` in [Data Models](./data-models.md)
- **Component**: `components/challenge/ChallengeView.tsx`

---

## 🔍 By File/Directory

### `/app` - Routing & Screens

See [Architecture - Screens & Navigation](./architecture.md#screen--navigation-architecture)

**Quick links to screen documentation:**

- Home: `app/(tabs)/index.tsx`
- Library: `app/(tabs)/library.tsx`
- Progress: `app/(tabs)/progress.tsx`
- Workout: `app/programs/[id]/session/[index].tsx` (1256 lines)

### `/components` - UI Components

See [Component Inventory](./component-inventory.md)

**By category:**

- **Common**: Button, Card, Input, Loading, Error, etc.
- **Auth**: AuthLayout, AuthHeader, AuthErrorBanner
- **Program**: ProgramView, WorkoutExecutionScreen, QRCodeShare
- **Progress**: ProgressView, Charts, Heatmap, PRCards
- **Data**: Forms, Lists, CRUD manager

### `/hooks` - Custom React Hooks

See [Architecture - Hooks Organization](./architecture.md#hooks-organization)

**Data hooks** (17): `usePrograms`, `useProgramProgress`, `usePRs`, `useWeeklyStats`, etc.
**Session hooks** (4): `useWorkoutTimer`, `useWorkoutSteps`, `useStepCompletion`

### `/context` - Global State

See [Architecture - State Management](./architecture.md#state-management-architecture)

- **AuthContext**: Firebase authentication
- **DataContext**: CRUD + progress tracking (1518 lines)

### `/lib` - Utilities & Services

See [Architecture - Validation & Utilities](./architecture.md#validation--utilities)

- **storage.ts**: Unified persistence layer
- **validation.ts**: Data validation schemas
- **api.ts**: Firebase-authenticated API client
- **events.ts**: Pub-sub event system
- **utils/**: Format, date, colors, validation helpers

### `/types` - Type Definitions

See [Data Models](./data-models.md) for comprehensive type documentation

---

## 🔧 Development Workflow

### Running Locally

1. `npm install` - Install dependencies
2. Create `.env` file with Firebase config
3. `npm start` - Start Expo dev server
4. Choose platform: `i` (iOS), `a` (Android), `w` (web)

### Code Changes

1. Edit files (components, hooks, logic)
2. Hot reload automatically
3. Check: `npm run lint` (code style)
4. Check: `npm run compile` (TypeScript)
5. Check: `npm run test` (unit tests)

### Before Committing

```bash
npm run lint:fix    # Auto-fix code style
npm run compile     # Verify TypeScript
npm run test:run    # Run all tests
npm run test:coverage  # Check coverage
```

### Testing

See [Development Guide - Testing](./development-guide.md#testing)

Test files in `__tests__/` mirror source structure

- Unit tests for utilities and validation
- Component tests for forms and data management
- Integration tests for complete workflows

---

## 🏗️ Architecture Patterns

### Component Pattern

```typescript
// Container (logic, hooks)
function FeatureContainer() {
  const { data } = useCustomHook()
  return <FeaturePresentation data={data} />
}

// Presentational (UI only)
function FeaturePresentation({ data }) {
  return <View>{/* render data */}</View>
}
```

### State Management Pattern

```typescript
// 1. Define context with values and actions
const MyContext = createContext()

// 2. Create provider with reducer
function MyProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <MyContext.Provider>{children}</MyContext.Provider>
}

// 3. Create custom hook to use context
function useMyContext() {
  const context = useContext(MyContext)
  if (!context) throw new Error('Hook used outside provider')
  return context
}

// 4. Use in components
function MyComponent() {
  const { data, action } = useMyContext()
}
```

### Data Fetching Pattern

```typescript
// Use generic useAsyncData hook
const { data, loading, error, refetch } = useAsyncData(
  () => fetchData(id), // Async function
  [id], // Dependencies
  { initialData: [] } // Options
)
```

### Validation Pattern

```typescript
// Separate validation logic
const result = validateExercise(data)
if (!result.isValid) {
  // Show error: result.errors
}
// Use result.data (validated)
```

---

## 🧪 Testing Guide

### Running Tests

```bash
npm test              # Watch mode (dev)
npm run test:run      # Single run (CI)
npm run test:coverage # With coverage report
```

### Test Structure

- **Unit Tests**: `__tests__/lib/`, `__tests__/context/`
- **Component Tests**: `__tests__/components/`
- **Integration Tests**: `__tests__/integration/`
- **Property-Based**: Using fast-check for complex logic

### Writing Tests

See [Development Guide - Testing](./development-guide.md#testing)

---

## 🚨 Common Tasks

### Add a New Feature

1. Plan: Decide components, hooks, data needed
2. Implement: Create types, components, hooks, logic
3. Test: Add tests covering main flows
4. Review: Check linting, TypeScript, coverage
5. Integrate: Update relevant sections in documentation

### Debug a Bug

1. Reproduce with specific steps
2. Check console for errors
3. Use browser DevTools or Xcode/Android Studio
4. Add breakpoints in hooks or components
5. Check storage: `npm run dev` → DevTools → Storage

### Improve Performance

1. Profile: Check which components re-render
2. Optimize: Memoize, extract hooks, cache data
3. Test: Verify improvement with FPS or load time
4. Document: Add note to Architecture doc

### Update Data Model

1. Define new entity types
2. Update validation schema
3. Update storage keys/operations
4. Create migration if needed
5. Update documentation (Data Models)

---

## 📋 Checklist for New Developers

- [ ] Read [Project Overview](./project-overview.md)
- [ ] Run local setup from [Development Guide](./development-guide.md)
- [ ] Review [Architecture](./architecture.md) high-level
- [ ] Explore component tree in [Component Inventory](./component-inventory.md)
- [ ] Understand data flow from [Data Models](./data-models.md)
- [ ] Run tests: `npm run test:run`
- [ ] Try changing a component and hot reload
- [ ] Review [Development Workflow](./development-guide.md#development-workflow)
- [ ] Set up IDE with Prettier and ESLint
- [ ] Ask questions in team chat!

---

## 🔗 External Resources

### Expo

- [Expo Documentation](https://docs.expo.dev)
- [Expo Router Guide](https://expo.github.io/router)
- [Expo API Reference](https://docs.expo.dev/versions/latest/)

### React Native

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Hooks API](https://react.dev/reference/react)

### Firebase

- [Firebase Docs](https://firebase.google.com/docs)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)

### Testing

- [Vitest Documentation](https://vitest.dev)
- [Fast-check Library](https://github.com/dubzzz/fast-check)

---

## 📝 Project Metadata

| Metadata                    | Value                           |
| --------------------------- | ------------------------------- |
| **Project Name**            | Progressive Workout (PWO)       |
| **Type**                    | React Native Mobile Application |
| **Repository**              | Monolith                        |
| **Platforms**               | iOS, Android, Web               |
| **Language**                | TypeScript 5.9.2                |
| **Framework**               | React 19.1.0 + Expo 54.0.27     |
| **State Management**        | React Context API               |
| **Backend**                 | Firebase + Optional API         |
| **Testing Framework**       | Vitest 2.1.0                    |
| **Documentation Generated** | 2026-03-06                      |
| **Scan Depth**              | Exhaustive (all source files)   |
| **Total Components**        | 54                              |
| **Total Hooks**             | 25                              |
| **Total Screens**           | 21                              |
| **Total Test Files**        | 23                              |

---

## 📞 Support & Questions

For questions or clarifications:

1. **Check documentation** first (try searching this index)
2. **Look at existing code** for similar patterns
3. **Check git history** for context on decisions
4. **Ask in team chat** with specific questions
5. **Review pull requests** for recent changes

---

**Happy coding! 🚀**

_This documentation is maintained as part of the project. Report issues or suggest improvements in team communications._
