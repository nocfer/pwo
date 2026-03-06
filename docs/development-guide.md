# Development Guide

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher (recommended: v20 LTS)
- **npm**: v8 or higher
- **Expo CLI**: Latest version
- **Git**: For version control
- **IDE**: VS Code recommended with Expo extension
- **Mobile Development** (optional):
  - **iOS**: XCode 14+ (macOS only)
  - **Android**: Android Studio + Android SDK 30+

### Installation

#### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd pwo

# Install dependencies
npm install
```

#### 2. Create Environment File

```bash
# Copy example
cp .env.example .env

# Edit .env and add Firebase config
nano .env
```

**Required Environment Variables**:
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Optional Variables**:
```bash
EXPO_PUBLIC_API_ENABLED=true
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
EXPO_PUBLIC_API_TIMEOUT=30000
```

#### 3. Verify Installation

```bash
npm run compile    # Check TypeScript
npm run lint       # Check code style
npm test           # Run test suite (should pass)
```

---

## Development Workflow

### Running the App

#### Web (Browser)

```bash
npm start

# In terminal, press 'w' or open http://localhost:8081
```

#### iOS Simulator

```bash
npm run ios

# Requires XCode and iOS simulator installed
# First run may take several minutes
```

#### Android Emulator

```bash
npm run android

# Requires Android Studio and emulator running
# Start emulator from Android Studio first
```

#### Mobile Device (via Expo Go)

```bash
npm start

# Scan QR code with Expo Go app
```

### Development Commands

| Command | Purpose | Notes |
|---------|---------|-------|
| `npm start` | Start dev server | Interactive menu (w/i/a) |
| `npm run web` | Web-only server | Faster for web dev |
| `npm run ios` | iOS simulator | Requires XCode |
| `npm run android` | Android emulator | Requires Android Studio |
| `npm run compile` | TypeScript check | No emit, type checking only |
| `npm run lint` | ESLint check | Show linting issues |
| `npm run lint:fix` | Auto-fix lint | Fix style automatically |
| `npm test` | Watch mode | Rerun on file changes |
| `npm run test:run` | Single run | For CI/CD |
| `npm run test:coverage` | Coverage report | Show coverage stats |

### Typical Development Session

```bash
# Terminal 1: Start dev server
npm start
> Press 'w' for web

# Terminal 2: Run tests in watch mode
npm test

# Terminal 3: Code editing
# Make changes to components/hooks/etc
# Web auto-reloads, tests rerun on save

# Check code quality
npm run lint:fix    # Auto-fix issues
npm run compile     # Verify TypeScript

# Before committing
npm run test:run        # Run all tests once
npm run test:coverage   # Check coverage
git commit -m "..."
```

---

## Code Style & Formatting

### Prettier Configuration

Code is formatted with Prettier (enforced via ESLint):

```json
{
  "semi": false,           // No semicolons
  "singleQuote": true,     // Single quotes
  "trailingComma": "none", // No trailing commas
  "arrowParens": "avoid"   // x => x (not (x) => x)
}
```

### Auto-Format on Save

**VS Code** - Install extensions:
- Prettier - Code formatter
- ESLint

**Settings (.vscode/settings.json)**:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Manual Formatting

```bash
# Auto-fix all style issues
npm run lint:fix

# Check (without fixing)
npm run lint
```

### Formatting Rules

- **No semicolons**: `const x = 1` not `const x = 1;`
- **Single quotes**: `'string'` not `"string"`
- **Import grouping**: External → @/ → relative
- **Line length**: No strict limit, but keep readable
- **Trailing commas**: `[1, 2, 3]` not `[1, 2, 3,]`

---

## Testing

### Test Structure

```
__tests__/
├── lib/              # Utility testing
├── context/          # State management
├── components/       # Component testing
└── integration/      # End-to-end flows
```

Test files mirror source structure:
- Source: `lib/validation.ts` → Test: `__tests__/lib/validation.test.ts`
- Source: `components/Button.tsx` → Test: `__tests__/components/Button.test.tsx`

### Running Tests

```bash
# Watch mode (during development)
npm test

# Single run (CI/CD)
npm run test:run

# With coverage
npm run test:coverage
```

### Writing Tests

#### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { validateExercise } from '@/lib/validation'

describe('validateExercise', () => {
  it('accepts valid exercise', () => {
    const result = validateExercise({
      name: 'Bench Press',
      category: 'strength',
      icon: 'barbell',
    })
    expect(result.isValid).toBe(true)
    expect(result.data.name).toBe('Bench Press')
  })

  it('rejects missing name', () => {
    const result = validateExercise({
      category: 'strength',
      icon: 'barbell',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Name required')
  })
})
```

#### Component Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '@/components/common/Button'

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" />)
    expect(screen.getByText('Click me')).toBeTruthy()
  })

  it('calls onPress when clicked', () => {
    const onPress = vi.fn()
    render(<Button label="Click" onPress={onPress} />)
    fireEvent.press(screen.getByText('Click'))
    expect(onPress).toHaveBeenCalled()
  })
})
```

#### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { completeWorkout } from '@/context/DataContext'

describe('Workout Completion Flow', () => {
  it('updates progress and records events', async () => {
    const progress = await completeWorkout({
      programId: 'test-program',
      sessionIndex: 0,
      exercises: [...],
    })
    
    expect(progress.completed).toBe(true)
    expect(progress.lifetimeWorkoutsCompleted).toBeGreaterThan(0)
  })
})
```

### Test Patterns

- **Unit tests**: Utilities, validation, pure functions
- **Component tests**: UI logic, props handling, events
- **Integration tests**: Complete workflows, data flow
- **Property-based tests**: Complex logic with fast-check

---

## Debugging

### Browser DevTools (Web)

```bash
npm run web

# Open: http://localhost:8081 → DevTools (F12 or Cmd+I)
# Tabs:
#   Console: Logs and errors
#   Network: API calls
#   Storage: localStorage debugging
#   Elements: DOM inspection
```

### React Native Debugger (Mobile)

Install: https://github.com/jhen0409/react-native-debugger

```bash
npm start
# Open React Native Debugger
# Scan QR code or select emulator
```

### VS Code Debugger

**Launch Configuration** (.vscode/launch.json):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "${workspaceFolder}/node_modules/expo/bin/expo.js",
      "args": ["start"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Console Logging

```typescript
// Debug information
console.log('Data:', data)

// Warnings
console.warn('Deprecated API used')

// Errors
console.error('Fatal error:', error)

// Grouped output
console.group('Workout Data')
console.log('Programs:', programs)
console.log('Progress:', progress)
console.groupEnd()
```

### Performance Profiling

```typescript
// Measure execution time
console.time('operation')
await performOperation()
console.timeEnd('operation')

// Profile render performance
import { unstable_trace } from 'react'
```

---

## Common Development Tasks

### Add a New Component

1. **Create file**: `components/feature/NewComponent.tsx`
2. **Define types**: At top of file or in `types/`
3. **Export from barrel**: `components/index.ts`
4. **Add tests**: `__tests__/components/feature/NewComponent.test.tsx`
5. **Use in screens/components**

**Template**:
```typescript
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '@/theme/theme'

type Props = {
  label: string
  onPress?: () => void
}

export function NewComponent({ label, onPress }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  label: {
    color: theme.colors.text,
  },
})
```

### Add a New Hook

1. **Create file**: `hooks/data/useNewData.ts` or `hooks/session/useNewLogic.ts`
2. **Implement logic**: Use `useAsyncData`, `useContext`, etc.
3. **Export from barrel**: `hooks/index.ts`
4. **Add tests**: `__tests__/hooks/useNewData.test.ts`

**Template**:
```typescript
import { useContext, useCallback } from 'react'
import { DataContext } from '@/context/DataContext'
import useAsyncData from './useAsyncData'

export function useNewData() {
  const { data, loading } = useContext(DataContext)
  
  const { data: result, loading: resultLoading, error } = useAsyncData(
    () => processData(data),
    [data]
  )
  
  return { result, loading: loading || resultLoading, error }
}
```

### Add a New Screen

1. **Create file**: `app/folder/screen-name.tsx`
2. **Add to routing**: Expo Router auto-detects
3. **Connect to data**: Use hooks, context
4. **Add navigation**: Link from other screens

**Template**:
```typescript
import { View, ScrollView, StyleSheet } from 'react-native'
import ScreenHeader from '@/components/common/ScreenHeader'
import { theme } from '@/theme/theme'

export default function NewScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Screen Title" />
      <ScrollView style={styles.content}>
        {/* Content here */}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
})
```

### Update Data Models

1. **Update type file**: `types/model.ts`
2. **Update validation**: `lib/validation.ts`
3. **Update storage**: `lib/storage.ts` operations
4. **Update context**: `context/DataContext.tsx` reducer
5. **Update tests**: New test cases
6. **Document**: Update `docs/data-models.md`

---

## Troubleshooting

### Issue: "Cannot find module '@/...'"

**Solution**: Check path alias in `tsconfig.json`
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue: Hot reload not working

**Solution**:
```bash
# Clear cache and restart
npm start -- --clear
# Press 'w' for web
```

### Issue: Tests failing after changes

**Solution**:
```bash
# Clear Vitest cache
npm test -- --clearCache
# Or restart test runner
```

### Issue: Firebase auth not working

**Solution**:
```bash
# Verify .env file
cat .env | grep EXPO_PUBLIC_FIREBASE

# Check Firebase config in lib/firebase.ts
npm run compile  # Verify no TypeScript errors
```

### Issue: Port 8081 already in use

**Solution**:
```bash
# Kill existing process
lsof -i :8081 | grep node | awk '{print $2}' | xargs kill -9

# Or start on different port
npm start -- --port 8082
```

### Issue: Android emulator not starting

**Solution**:
```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_6_API_31

# Then run
npm run android
```

---

## IDE Setup

### VS Code Extensions (Recommended)

- **Expo**: Official Expo integration
- **ES7+ React/Redux/React-Native snippets**: Quick snippets
- **Prettier - Code formatter**: Auto-formatting
- **ESLint**: Linting integration
- **Thunder Client** or **REST Client**: API testing
- **Git Graph**: Git visualization

### IntelliJ IDEA / WebStorm

- Built-in TypeScript support
- Built-in ESLint support
- Integrate Prettier (Settings → Languages & Frameworks → JavaScript)

---

## Performance Tips

### Optimize Build Size

```bash
# Analyze bundle size
npm run web -- --analyze

# Tree-shake unused code by removing unused imports
npm run lint:fix
```

### Optimize Render Performance

- Use `React.memo` for expensive components
- Use `useCallback` for event handlers
- Use `useMemo` for computed values
- Avoid creating objects in render

### Optimize Data Fetching

- Use `useAsyncData` hook for consistent caching
- Batch requests where possible
- Implement pagination for large lists

---

## Deployment

### Web Deployment

```bash
# Generate web build
npm run predeploy

# Deploy to GitHub Pages
npm run deploy

# Verify at https://<username>.github.io/<repo>
```

### Mobile Deployment

Use Expo Application Services (EAS):

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas build --platform ios

# Or for Android
eas build --platform android

# Build apk for testing
eas build --platform android --local
```

---

## Resources & Documentation

### Official Documentation
- [Expo Docs](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Hooks API](https://react.dev/reference/react)
- [Firebase Docs](https://firebase.google.com/docs)

### Project Documentation
- [Architecture](./architecture.md)
- [Data Models](./data-models.md)
- [API Contracts](./api-contracts.md)
- [Component Inventory](./component-inventory.md)

---

## Getting Help

1. **Check documentation**: Search this guide and linked docs
2. **Review code**: Look at similar patterns in codebase
3. **Search issues**: Check GitHub issues for similar problems
4. **Ask in chat**: Reach out to team with specific questions
5. **Debug**: Use browser DevTools or React Native Debugger

---

**Happy Coding! 🚀**

