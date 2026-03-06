# Breaking Changes & Migration Guide (v1.0 → v1.1)

## Overview

Version 1.1 introduces a **major architectural refactor** from local-storage-first to **API-driven architecture**. This is a breaking change requiring careful migration of existing data and code.

**Release Date**: March 2026  
**Migration Difficulty**: High  
**Data Loss Risk**: Low (with proper migration)

---

## Major Breaking Changes

### 1. Architecture: Storage → API (CRITICAL)

**Before (v1.0):**
```
App → Context → Storage (localStorage/FileSystem) → Local data only
```

**After (v1.1):**
```
App → Context → API Client → Firebase Backend
                    ↓
            Local Storage (Fallback only)
```

**Impact**: All data operations now require Firebase backend.

**Migration Step**:
```typescript
// Before: Direct storage access
const data = await StorageService.loadPrograms()

// After: API with fallback
const data = await DataContext.fetchPrograms()
// Internally:
//   1. Try API first
//   2. Fall back to local storage if offline
//   3. Sync when connection restored
```

---

### 2. Authentication: Optional → Required

**Before (v1.0):**
- App worked completely offline
- Firebase auth was optional
- No authentication required

**After (v1.1):**
- ✅ Firebase auth required
- Anonymous (guest) access supported
- Account linking for upgrade path

**Impact**: All users must authenticate before using app.

**Migration Steps**:

1. **Add Firebase Config to `.env`:**
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project
```

2. **Users Must Sign In:**
   - New Sign In screen for existing users
   - New Sign Up screen for new users
   - Guest option for immediate access

3. **Update Auth Flow in Components:**
```typescript
// Before
import { DataContext } from '@/context/DataContext'
const { programs } = useContext(DataContext)

// After
import { useAuth } from '@/context/AuthContext'
import { DataContext } from '@/context/DataContext'
const { user } = useAuth()  // NEW: Check authentication
const { programs } = useContext(DataContext)

if (!user) {
  return <SignInScreen />  // NEW: Require auth
}
```

---

### 3. Challenge System: Removed (CRITICAL)

**Before (v1.0):**
- Full challenge support
- `ChallengeProgress` type
- `ChallengeConfig` on Programs
- Challenge screens and UX

**After (v1.1):**
- ❌ Challenges completely removed
- Use regular Programs instead
- Use PersonalRecords for tracking
- Challenge screens deleted

**Impact**: All challenge data and code must be migrated or discarded.

**Migration Steps**:

1. **Export Challenge Data** (if needed):
```typescript
// Before deleting challenges, export them
const challenges = await StorageService.loadChallengeProgress()
// Save as JSON for archive
```

2. **Convert Challenge to Program**:
```typescript
// Challenge structure
{
  id: "50-pushups-challenge",
  challengeConfig: {
    exerciseId: "pushup-1",
    sets: 5,
    targetReps: 50,
    weeklyIncreasePercent: 10
  }
}

// Convert to Program
{
  id: "50-pushups-program",
  name: "50 Pushups Progressive",
  blocks: [
    {
      type: "exercise",
      exerciseId: "pushup-1",
      sets: 5,
      targetReps: 10  // Manual tracking instead of auto-progression
    }
  ]
}
```

3. **Update Components**:
```typescript
// Remove all imports from:
// - components/challenge/
// - hooks/challenge/
// - context/challengeContext

// Replace with Program-based logic:
// - Use usePrograms() hook
// - Use ProgramProgress tracking
// - Track reps with PersonalRecords
```

4. **Update Storage/State**:
```typescript
// Remove from storage keys
const removedKeys = [
  'pwo.challenge_progress',    // ❌ Remove
  'pwo.challenge_sessions'      // ❌ Remove
]

for (const key of removedKeys) {
  localStorage.removeItem(key)
}
```

---

### 4. Data Model: SessionProgress → WorkoutProgress (CRITICAL)

**Before (v1.0):**
```typescript
interface SessionProgress {
  sessionId: string
  programId: string
  sessions: ProgramRun[]        // Complex nested
  statusType: 'in_progress' | 'completed'
  // Many nested fields
}
```

**After (v1.1):**
```typescript
interface WorkoutProgress {
  workoutId: string             // Simple, flat
  programId: string
  completed: boolean
  completedAt?: string
  exercises: ExerciseProgress[]
  // Simplified structure
}
```

**Impact**: Existing progress data cannot be used directly; must be migrated.

**Migration Steps**:

1. **Extract Old Data**:
```typescript
const oldProgress = await StorageService.loadSessionProgress()

const newProgress = oldProgress.sessions.map((session, index) => ({
  workoutId: `${oldProgress.programId}_workout_${index}`,
  programId: oldProgress.programId,
  completed: session.completed,
  completedAt: session.completedAt,
  exercises: session.exercises,  // Should work as-is
  timeSpentSeconds: session.timeSpentSeconds
}))
```

2. **Update PersonalRecord References**:
```typescript
// Before: workoutId referenced SessionProgress
const pr = {
  exerciseId: "bench-press-1",
  type: "max_weight",
  value: 225,
  workoutId: "session-123"  // ❌ Old format
}

// After: workoutId follows new format
const pr = {
  exerciseId: "bench-press-1",
  type: "max_weight",
  value: 225,
  workoutId: "full-body-a_workout_0"  // ✅ New format
}
```

3. **Update Type References**:
```typescript
// Search for all references to SessionProgress
// Replace with WorkoutProgress
// Update workoutId generation:
const workoutId = `${programId}_workout_${sessionIndex}`
```

---

### 5. Event System: Removed (HIGH)

**Before (v1.0):**
- Custom EventEmitter system
- Pub-sub pattern for cross-component communication
- `WorkoutEvent` type
- Event logging and replay

**After (v1.1):**
- ❌ EventEmitter deleted
- ❌ WorkoutEvent type removed
- Direct API calls via `recordWorkout()`
- Context version counters for updates

**Impact**: Event-based logic must be rewritten.

**Migration Steps**:

1. **Remove Event Subscriptions**:
```typescript
// Before
import { sessionEvents } from '@/lib/events'

sessionEvents.subscribe(event => {
  if (event.type === 'SET_COMPLETED') {
    handleSetCompleted(event.data)
  }
})

// After: Use API directly
async function completeSet(data: SetRecord) {
  await recordWorkout({
    workoutId: data.workoutId,
    exercises: [{ exerciseId, sets: [data] }]
  })
  // DataContext automatically updates via version counter
}
```

2. **Replace Event Emissions**:
```typescript
// Before
sessionEvents.emit({
  type: 'SESSION_COMPLETED',
  data: { programId, progress }
})

// After
await DataContext.completeWorkout(workoutId, progress)
// Which internally calls API recordWorkout()
```

3. **Update Progress Tracking**:
```typescript
// Before: Listened to events
const [progress, setProgress] = useState(null)
sessionEvents.subscribe(event => {
  if (event.type === 'PROGRESS_UPDATED') {
    setProgress(event.data)
  }
})

// After: Use API hook
const { data: progress } = useProgramProgress(programId)
// Hook automatically subscribes to progressVersion changes
```

4. **Remove Event Files**:
```typescript
// Delete these files:
// - lib/events.ts
// - __tests__/lib/events.test.ts
// - types/events.ts (if separate)
```

---

### 6. Components: -17 Removed, +22 New

**Deleted Components** (17 total):

Challenge-related:
- ❌ `ChallengeCard.tsx`
- ❌ `ChallengeProgress.tsx`
- ❌ `ChallengeSelector.tsx`
- ❌ `ChallengeStats.tsx`
- ❌ `ChallengesTodayCard.tsx`
- ❌ `components/challenge/*` (all)

Legacy/Event-system:
- ❌ `EventFeed.tsx`
- ❌ `EventLog.tsx`
- ❌ `components/events/*`

Other:
- ❌ Old storage-based components

**New Components** (22 total):

Auth:
- ✅ `SignInScreen.tsx`
- ✅ `SignUpScreen.tsx`
- ✅ `AuthLayout.tsx`
- ✅ `GuestAccessOption.tsx`

Data Management:
- ✅ `DataList.tsx`
- ✅ `SearchableList.tsx`
- ✅ `FilterControls.tsx`
- ✅ `SortControls.tsx`

Forms:
- ✅ `ExerciseForm.tsx`
- ✅ `ProgramEditor.tsx`
- ✅ `forms/ProgramForm.tsx`

QR Features:
- ✅ `QRScanner.tsx`
- ✅ `QRGenerator.tsx`
- ✅ `QRModal.tsx`

Others:
- ✅ `LoadingStateList.tsx`
- ✅ `UnifiedDataManager.tsx`
- ✅ More...

**Migration Steps**:

1. **Remove Challenge Imports**:
```typescript
// Find all imports of deleted components
import { ChallengeCard } from '@/components/challenge'  // ❌ Delete

// Remove from component trees
function LibraryScreen() {
  return (
    <>
      <ExerciseList />
      {/* <ChallengeCard /> ❌ Remove this */}
    </>
  )
}
```

2. **Update Component Trees**:
```typescript
// Before: Challenge support in library
function LibraryScreen() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Exercises" component={ExerciseList} />
      <Tab.Screen name="Programs" component={ProgramList} />
      <Tab.Screen name="Challenges" component={ChallengueList} />
    </Tab.Navigator>
  )
}

// After: Challenges removed
function LibraryScreen() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Exercises" component={ExerciseList} />
      <Tab.Screen name="Programs" component={ProgramList} />
      <Tab.Screen name="QR Import" component={QRScanner} />  // NEW
    </Tab.Navigator>
  )
}
```

---

### 7. API Changes: Direct Access Required

**Before (v1.0):**
- Optional API integration
- Feature-flagged via `EXPO_PUBLIC_API_ENABLED`
- Fallback to local storage always worked

**After (v1.1):**
- API required for data operations
- Graceful fallback to local storage only when offline
- All CRUD operations go through API

**Migration Steps**:

1. **Setup Environment**:
```env
# Now required
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
EXPO_PUBLIC_API_ENABLED=true
EXPO_PUBLIC_API_TIMEOUT=30000
```

2. **Update DataContext**:
```typescript
// Before: Checked storage directly
async function loadExercises() {
  return StorageService.loadExercises()
}

// After: API first, fallback to storage
async function loadExercises() {
  try {
    return await fetchExercises()  // API call
  } catch (error) {
    if (error instanceof APIError) {
      return StorageService.loadExercises()  // Fallback
    }
    throw error
  }
}
```

3. **Update Hooks**:
```typescript
// Before: Storage-based hook
function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([])
  useEffect(() => {
    StorageService.loadPrograms().then(setPrograms)
  }, [])
  return { data: programs }
}

// After: API-based hook
function usePrograms() {
  const { user } = useAuth()
  const { progressVersion } = useContext(DataContext)
  
  return useAsyncData(
    () => {
      if (!user) return []
      return fetchPrograms()  // API call
    },
    [progressVersion, user?.uid]
  )
}
```

---

### 8. Hooks: +5 New (Authentication & API)

**New Hooks**:

```typescript
// Authentication (NEW)
useAuth()           // Get auth state
useSignIn()         // Sign in logic
useSignUp()         // Sign up logic

// API Integration (NEW)
useAPIExercises()   // Fetch exercises from API
useAPIPrograms()    // Fetch programs from API

// Existing Hooks (UNCHANGED)
useWorkoutTimer()
useAsyncData()
usePrograms()       // Now API-driven internally
```

**Migration Steps**:

1. **Replace Hook Calls**:
```typescript
// Before
const programs = usePrograms()

// After: Same interface, but API-driven
const programs = usePrograms()

// Or use new hooks directly:
const { data: programs } = useAPIPrograms()
```

2. **Add Auth Checks**:
```typescript
// Before: No auth check
function HomeScreen() {
  const { data: programs } = usePrograms()
  return <ProgramList programs={programs} />
}

// After: Require auth
function HomeScreen() {
  const { user } = useAuth()
  const { data: programs } = usePrograms()
  
  if (!user) {
    return <SignInPrompt />
  }
  
  return <ProgramList programs={programs} />
}
```

---

## Migration Checklist

### Phase 1: Setup (1-2 days)

- [ ] Backup existing data (local storage export)
- [ ] Configure Firebase project
- [ ] Add Firebase credentials to `.env`
- [ ] Set `EXPO_PUBLIC_API_ENABLED=true`
- [ ] Update dependencies
  ```bash
  npm install  # Expo ~55, React 19.2, Firebase 12.10
  ```

### Phase 2: Code Updates (2-3 days)

- [ ] Update TypeScript types
  - [ ] Replace `SessionProgress` with `WorkoutProgress`
  - [ ] Update `workoutId` references
  - [ ] Remove `ChallengeProgress`, `ChallengeConfig`
- [ ] Update components
  - [ ] Remove challenge component imports
  - [ ] Add auth checks to protected screens
  - [ ] Update navigation structure
- [ ] Update hooks
  - [ ] Replace `usePrograms()` call sites
  - [ ] Add auth checks
  - [ ] Update data fetching logic

### Phase 3: Context & Storage (2-3 days)

- [ ] Update `AuthContext` (should already exist)
- [ ] Update `DataContext`
  - [ ] Make all CRUD go through API
  - [ ] Add fallback logic
  - [ ] Remove direct storage calls
- [ ] Update storage layer
  - [ ] Keep for fallback only
  - [ ] Remove challenge storage keys
  - [ ] Remove event storage keys

### Phase 4: Data Migration (1-2 days)

- [ ] Export old local data
- [ ] Convert `SessionProgress` → `WorkoutProgress`
- [ ] Convert `PersonalRecord` references
- [ ] Remove challenge data
- [ ] Seed Firebase with migrated data (if needed)

### Phase 5: Testing (2-3 days)

- [ ] Run full test suite
  - [ ] Update/add API integration tests
  - [ ] Update/add auth tests
  - [ ] Remove challenge tests
- [ ] Manual testing
  - [ ] Sign in/Sign up flow
  - [ ] Workout execution
  - [ ] Progress tracking
  - [ ] Offline behavior

### Phase 6: Deployment (1 day)

- [ ] Build for all platforms
- [ ] Deploy to staging
- [ ] Production release
- [ ] Monitor for errors

---

## Data Migration Script

If you have significant user data to migrate:

```typescript
// Migration helper
async function migrateOldData() {
  try {
    // 1. Load old data
    const oldProgress = await StorageService.loadSessionProgress()
    const oldPRs = await StorageService.loadPersonalRecords()
    
    // 2. Transform
    const newProgress = transformSessionToWorkout(oldProgress)
    const newPRs = transformPRReferences(oldPRs)
    
    // 3. Upload to API
    for (const prog of newProgress) {
      await DataContext.recordWorkout(prog)
    }
    
    // 4. Clear old data
    await StorageService.clear()
    
    console.log('Migration complete!')
  } catch (error) {
    console.error('Migration failed:', error)
    // Preserve old data on error
  }
}

function transformSessionToWorkout(oldProgress: SessionProgress): WorkoutProgress[] {
  return oldProgress.sessions.map((session, index) => ({
    workoutId: `${oldProgress.programId}_workout_${index}`,
    programId: oldProgress.programId,
    completed: session.completed,
    completedAt: session.completedAt,
    timeSpentSeconds: session.timeSpentSeconds,
    exercises: session.exercises
  }))
}

function transformPRReferences(prs: PersonalRecord[]): PersonalRecord[] {
  return prs.map(pr => ({
    ...pr,
    workoutId: pr.workoutId 
      ? `${extractProgramId(pr.workoutId)}_workout_${extractSessionIndex(pr.workoutId)}`
      : undefined
  }))
}
```

---

## Rollback Plan

If migration fails:

1. **Preserve Old Data**
   - Old local storage data remains untouched
   - Backup located at: `localStorage.backup.json` (manual export)

2. **Revert Code**
   ```bash
   git checkout v1.0
   npm install
   npm start
   ```

3. **Contact Support** - For Firebase data cleanup

---

## FAQ

### Q: Can I keep using local storage?
**A**: No. v1.1 requires API-driven architecture. Local storage is fallback only.

### Q: What about my challenge data?
**A**: Export it before upgrading. Convert to Programs manually or archive.

### Q: Do I need to rewrite all my code?
**A**: Most component logic stays the same. Main changes:
- Add auth checks to screens
- Remove challenge imports
- Update data model references

### Q: Is authentication mandatory?
**A**: Yes, but guest/anonymous access is available.

### Q: How long is the migration?
**A**: ~2 weeks for full codebase + thorough testing

### Q: What if offline?
**A**: App will show "offline mode" and use local cache. Sync happens when online.

---

## Support

- Review [Architecture](./architecture.md) for design changes
- See [Data Models](./data-models.md) for type changes
- Check [API Contracts](./api-contracts.md) for new endpoints
- File issues for blockers: github.com/your-repo/issues

---

*For questions or issues during migration, refer to the full documentation or contact the team.*
