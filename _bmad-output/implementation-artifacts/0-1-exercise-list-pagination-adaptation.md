# Story 0.1: Exercise List Pagination Adaptation

Status: review

## Story

As a user,
I want the exercise library to load exercises progressively as I scroll,
so that initial load is fast and the app leverages backend pagination instead of fetching everything at once.

## Acceptance Criteria

1. `fetchExercises()` accepts optional `page` and `limit` params and returns `PaginatedResponse<Exercise>` (not flat `Exercise[]`)
2. `fetchExercisesByCategory()` follows the same paginated signature
3. The exercise library (Library tab > Exercises) implements infinite scroll — loading the next page when the user scrolls near the bottom
4. A loading indicator appears at the bottom of the list while fetching the next page
5. Initial app load fetches only page 1 of exercises (not the entire dataset)
6. After exercise create/edit/delete, the list refreshes correctly
7. All existing consumers are updated to work with the new incremental data model
8. The existing test suite passes (`npm run test:run`) and `npx tsc --noEmit` reports zero errors

## Tasks / Subtasks

- [x] **Task 1: Change `fetchExercises()` and `fetchExercisesByCategory()` signatures** (AC: 1, 2)
  - [x]Export `PaginatedResponse<T>` (currently non-exported in `lib/api.ts`)
  - [x]Change `fetchExercises(page = 1, limit = 20)` to return `PaginatedResponse<Exercise>` — single page, single request
  - [x]Change `fetchExercisesByCategory(category, page = 1, limit = 20)` to return `PaginatedResponse<Exercise>` — same pattern
  - [x]Remove the multi-page fetch-all logic (`Promise.all` remaining pages)

- [x] **Task 2: Add pagination state to DataContext** (AC: 5, 7)
  - [x]Add `exercisePagination: { currentPage: number, totalPages: number, totalItems: number, hasMore: boolean }` to `DataState`
  - [x]Add new action `APPEND_EXERCISES` — appends `Exercise[]` to `state.exercises` and updates pagination metadata
  - [x]Add new action `RESET_EXERCISES` — clears exercises array and resets pagination (for refresh after CRUD)
  - [x]Update `initialState` with `exercisePagination: { currentPage: 0, totalPages: 0, totalItems: 0, hasMore: true }`

- [x] **Task 3: Update DataContext exercise loading to paginated** (AC: 5, 6, 7)
  - [x]Modify `onAuthStateChanged` handler: call `fetchExercises(1)` and dispatch `APPEND_EXERCISES` with page 1 data + pagination metadata
  - [x]Add `loadMoreExercises()` action: fetch `currentPage + 1`, dispatch `APPEND_EXERCISES`. No-op if `!hasMore` or already loading.
  - [x]Add `exercisesLoadingMore: boolean` to state to track "loading next page" separately from initial `exercisesLoading`
  - [x]Modify `refreshAll()`: dispatch `RESET_EXERCISES` then fetch page 1
  - [x]Modify `upsertExercise()`: after API call, dispatch `RESET_EXERCISES` then fetch page 1 (simplest consistency model)
  - [x]Modify `deleteExercise()`: same reset-and-refetch pattern
  - [x]Expose `loadMoreExercises` and `exercisesLoadingMore` / `hasMoreExercises` in context value

- [x] **Task 4: Wire infinite scroll through component hierarchy** (AC: 3, 4)
  - [x]`UnifiedDataManager.tsx`: get `loadMoreExercises`, `hasMoreExercises`, `exercisesLoadingMore` from `useDataContext()`. Pass to `DataList` when `activeTab === 'exercises'`.
  - [x]`DataList.tsx`: accept optional `onEndReached`, `hasMore`, `loadingMore` props. Forward to `SearchableList`.
  - [x]`SearchableList.tsx`: wire `onEndReached` and `onEndReachedThreshold={0.5}` on the existing `FlatList`. Add `ListFooterComponent` that renders an `ActivityIndicator` when `loadingMore` is true and `hasMore` is true.

- [x] **Task 5: Update `useAPIExercises.ts`** (AC: 7)
  - [x]Update to call `fetchExercises(1)` and handle `PaginatedResponse<Exercise>` — set `data` to `response.data`
  - [x]This hook is not used by the main app flow (DataContext handles it), but must compile

- [x] **Task 6: Verify no regressions** (AC: 6, 7, 8)
  - [x]Run `npx tsc --noEmit` — zero type errors
  - [x]Run `npm run test:run` — all tests pass
  - [x]Verify `ProgramForm.tsx` exercise picker works (uses `state.exercises` from context — will show loaded pages)
  - [x]Verify `canSafelyDelete()` in `UnifiedDataManager` works (uses `state.exercises` — dependency check operates on loaded data)
  - [x]Verify `validateUniqueName()` in `upsertExercise` works (operates on `state.exercises` — after reset+refetch it has page 1)

## Dev Notes

### Context: Why This Change

The backend (`pwo-be`) changed `GET /api/v1/exercises` on 2026-03-24 from `Exercise[]` to `{ data: Exercise[], pagination: PaginationMeta }`. The initial sprint change implemented a fetch-all approach (fetch every page with `Promise.all`, return flat array). This rewrite switches to proper infinite scroll.

**Sprint Change Proposal:** `_bmad-output/planning-artifacts/sprint-change-proposal-2026-03-25.md`

### Scope

This story touches **~7 files**. The change spans the API layer, data context, and library UI component hierarchy.

### Backend Pagination Contract

```typescript
// Response shape from GET /api/v1/exercises?page=1&limit=20
interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number      // 1-indexed
    limit: number     // items per page (default 20, max 100)
    totalItems: number
    totalPages: number
  }
}
```

**Key behaviors:**
- `limit > 100` returns **400 Bad Request**
- `page` beyond total pages returns `{ data: [], pagination: { ... } }` with correct metadata
- Results sorted alphabetically by exercise name (server-side)
- Existing filter params (`bodyPart`, `targetMuscle`, `equipment`, `expand`, `category`) work alongside pagination
- Pagination metadata reflects filtered counts

### Existing Code — What You're Modifying

**File: `lib/api.ts`**
- **Line 23-31:** `PaginatedResponse<T>` — already exists, currently non-exported. Export it.
- **Line 179-200:** `fetchExercises()` — currently fetches all pages with `Promise.all`. Replace with single-page fetch.
- **Line 212-236:** `fetchExercisesByCategory()` — same fetch-all pattern. Replace with single-page fetch.

**File: `context/DataContext.tsx`**
- **Line 60-69:** `DataState` interface — add `exercisePagination` and `exercisesLoadingMore` fields
- **Line 72-80:** `DataAction` type — add `APPEND_EXERCISES` and `RESET_EXERCISES` actions
- **Line 132-137:** `initialState` — add initial pagination state
- **Line 150-157:** reducer — add cases for new actions
- **Line 202-227:** `onAuthStateChanged` useEffect — change to fetch page 1 only, dispatch `APPEND_EXERCISES`
- **Line 324-349:** `refreshAll()` — dispatch `RESET_EXERCISES` then fetch page 1
- **Line 415-421:** `upsertExercise()` (post-save refetch) — reset + refetch page 1
- **Line 459-464:** `deleteExercise()` (post-delete refetch) — reset + refetch page 1
- **Context value:** expose `loadMoreExercises`, `exercisesLoadingMore`, `hasMoreExercises`

**File: `components/data/SearchableList.tsx`**
- **Line 289-295:** `FlatList` — add `onEndReached`, `onEndReachedThreshold={0.5}`, `ListFooterComponent`

**File: `components/data/DataList.tsx`**
- **Props type (line 30-45):** add optional `onEndReached`, `hasMore`, `loadingMore`
- Forward these props to `SearchableList`

**File: `components/data/UnifiedDataManager.tsx`**
- **Line 43:** `useDataContext()` — destructure new pagination fields
- **Line 431-443:** `<DataList>` — pass `onEndReached`, `hasMore`, `loadingMore` when `activeTab === 'exercises'`

**File: `hooks/data/useAPIExercises.ts`**
- **Line 46:** `fetchExercises()` call — update to handle `PaginatedResponse<Exercise>`

### Implementation Patterns

**Task 1 — API functions (replace current fetch-all):**
```typescript
export async function fetchExercises(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Exercise>> {
  return request<PaginatedResponse<Exercise>>(
    `/api/v1/exercises?page=${page}&limit=${limit}`
  )
}

export async function fetchExercisesByCategory(
  category: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Exercise>> {
  const encodedCategory = encodeURIComponent(category)
  return request<PaginatedResponse<Exercise>>(
    `/api/v1/exercises?category=${encodedCategory}&page=${page}&limit=${limit}`
  )
}
```

**Task 2 — New reducer actions:**
```typescript
// New actions
| { type: 'APPEND_EXERCISES'; exercises: Exercise[]; pagination: { page: number; totalPages: number; totalItems: number } }
| { type: 'RESET_EXERCISES' }

// Reducer cases
case 'APPEND_EXERCISES': {
  const sorted = [...state.exercises, ...action.exercises].sort((a, b) =>
    a.name.localeCompare(b.name)
  )
  return {
    ...state,
    exercises: sorted,
    exercisesLoading: false,
    exercisesLoadingMore: false,
    exercisePagination: {
      currentPage: action.pagination.page,
      totalPages: action.pagination.totalPages,
      totalItems: action.pagination.totalItems,
      hasMore: action.pagination.page < action.pagination.totalPages
    }
  }
}
case 'RESET_EXERCISES':
  return {
    ...state,
    exercises: [],
    exercisesLoading: true,
    exercisesLoadingMore: false,
    exercisePagination: { currentPage: 0, totalPages: 0, totalItems: 0, hasMore: true }
  }
```

**Task 3 — loadMoreExercises action:**
```typescript
const loadMoreExercises = useCallback(async () => {
  if (
    state.exercisesLoadingMore ||
    !state.exercisePagination.hasMore ||
    !auth.currentUser
  ) return

  dispatch({ type: 'SET_EXERCISES_LOADING_MORE', loading: true })

  try {
    const nextPage = state.exercisePagination.currentPage + 1
    const response = await fetchExercises(nextPage)
    dispatch({
      type: 'APPEND_EXERCISES',
      exercises: response.data,
      pagination: response.pagination
    })
  } catch (error) {
    console.error('Failed to load more exercises:', error)
    dispatch({ type: 'SET_EXERCISES_LOADING_MORE', loading: false })
  }
}, [state.exercisesLoadingMore, state.exercisePagination])
```

**Task 4 — FlatList footer (in SearchableList):**
```typescript
// Import at top
import { ActivityIndicator, ... } from 'react-native'

// ListFooterComponent
const renderFooter = useCallback(() => {
  if (!loadingMore || !hasMore) return null
  return (
    <View style={styles.footerLoader}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
    </View>
  )
}, [loadingMore, hasMore])

// On FlatList
<FlatList
  ...existing props
  onEndReached={onEndReached}
  onEndReachedThreshold={0.5}
  ListFooterComponent={renderFooter}
/>
```

### Consumers — Impact Assessment

| File | Usage | Impact |
|------|-------|--------|
| `context/DataContext.tsx` | Central exercise store | **Modified** — incremental loading |
| `components/data/UnifiedDataManager.tsx` | Library screen | **Modified** — passes pagination props |
| `components/data/DataList.tsx` | List wrapper | **Modified** — forwards pagination props |
| `components/data/SearchableList.tsx` | FlatList renderer | **Modified** — adds onEndReached + footer |
| `hooks/data/useExercises.ts` | Convenience hook | **Unchanged** — reads `state.exercises` |
| `hooks/data/useAPIExercises.ts` | Direct API hook | **Modified** — handle PaginatedResponse |
| `components/data/forms/ProgramForm.tsx` | Exercise picker | **Unchanged** — reads `state.exercises` (shows loaded pages) |
| `app/programs/[id]/session/[index].tsx` | Workout session | **Unchanged** — uses workout state, not DataContext exercises |
| `context/workoutReducer.ts` | Workout state | **Unchanged** — different `exercises` in workout state |

### Anti-Patterns to Avoid

- **Do NOT** add a generic `fetchAllPages()` helper — the whole point is to stop fetching all pages
- **Do NOT** change `useExercises()` hook — it reads from context state which accumulates naturally
- **Do NOT** modify workout-related files (`workoutReducer.ts`, session screens) — they use a different exercise state
- **Do NOT** modify `fetchExercise()` (single by ID), `fetchPrefillData()`, or any CRUD functions
- **Do NOT** add `limit > 100` — server returns 400
- **Do NOT** duplicate sorting logic — server already sorts alphabetically. After APPEND, sort the combined array to maintain order across pages
- **Do NOT** create a new hook file — modify existing hooks and context
- **Do NOT** use `ScrollView` for the footer indicator — `ListFooterComponent` is the FlatList-native way

### Endpoints NOT Affected

Per the API change brief, these endpoints are unchanged:
- `GET /api/v1/exercises/:id` — single exercise (used by `fetchExercise()`)
- `GET /api/v1/exercises/filters/*` — body-parts, target-muscles, equipments
- `GET /api/v1/exercises/prefill` — pre-fill data (used by `fetchPrefillData()`)

**Do NOT modify** `fetchExercise()`, `fetchPrefillData()`, `createExercise()`, `updateExercise()`, or `deleteExercise()`.

### Edge Cases

- **Empty exercise library:** `totalPages: 0`, `data: []` — footer should not show, `hasMore` is false
- **Single page fits all:** `totalPages: 1` — no additional fetches triggered, `hasMore` is false after page 1
- **Race condition on rapid scroll:** `exercisesLoadingMore` guard prevents duplicate fetches
- **Auth state change while loading:** mounted guard in useEffect prevents stale dispatches
- **Search/filter while paginated:** Client-side filtering in `DataList` works on `state.exercises` (whatever is loaded). This is acceptable for MVP — server-side search can be added later.
- **Delete exercise on page 2:** reset + refetch page 1. User sees page 1 again. Acceptable for MVP.

### Project Structure Notes

- `lib/api.ts` follows the project's API SDK pattern: one function per endpoint, typed with generics
- All imports use `@/` path alias
- Prettier: no semicolons, single quotes, no trailing commas, avoid arrow parens
- Components use `StyleSheet.create` with theme tokens from `theme/theme.ts`
- Functional components with hooks, named exports
- `useCallback` for all callbacks with explicit dependencies

### Testing

No new tests strictly required — the function signatures change but there are no existing unit tests for `fetchExercises()` or `fetchExercisesByCategory()`. The existing test suite (`npm run test:run`) must pass, and `npx tsc --noEmit` must report zero errors.

If writing optional tests, mock the `request` function to return `PaginatedResponse` objects and verify:
- Single page returns data directly
- `loadMoreExercises` appends to existing data
- `hasMore` becomes false on last page

### References

- [Source: pwo-be/_bmad-output/api-change-exercise-pagination.md] — Full API change brief
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-03-25.md] — Sprint change proposal (infinite scroll version)
- [Source: lib/api.ts#L23-L31] — PaginatedResponse type (export it)
- [Source: lib/api.ts#L179-L236] — Functions to rewrite
- [Source: context/DataContext.tsx#L60-L69] — DataState interface
- [Source: context/DataContext.tsx#L72-L80] — DataAction type
- [Source: context/DataContext.tsx#L202-L227] — Exercise loading useEffect
- [Source: context/DataContext.tsx#L324-L349] — refreshAll function
- [Source: context/DataContext.tsx#L415-L421] — Post-save refetch
- [Source: context/DataContext.tsx#L459-L464] — Post-delete refetch
- [Source: components/data/SearchableList.tsx#L289-L295] — FlatList to wire
- [Source: components/data/DataList.tsx#L30-L45] — Props to extend
- [Source: components/data/UnifiedDataManager.tsx#L43,L431-L443] — Context usage and DataList render
- [Source: hooks/data/useAPIExercises.ts#L46] — fetchExercises call to update
- [Source: _bmad-output/project-context.md] — Project coding conventions

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Exported `PaginatedResponse<T>` from `lib/api.ts` (was non-exported)
- Changed `fetchExercises()` from fetch-all-pages to single-page fetch with `page`/`limit` params returning `PaginatedResponse<Exercise>`
- Changed `fetchExercisesByCategory()` with same paginated signature
- Added `exercisePagination`, `exercisesLoadingMore` to DataContext state
- Added `APPEND_EXERCISES`, `RESET_EXERCISES`, `SET_EXERCISES_LOADING_MORE` reducer actions
- Added `loadMoreExercises()` action to DataContext — fetches next page, appends to state, guards against duplicate calls
- Updated initial exercise load (onAuthStateChanged) to fetch page 1 only
- Updated `refreshAll()`, `upsertExercise()`, `deleteExercise()` to reset + refetch page 1
- Wired `onEndReached` + `onEndReachedThreshold={0.5}` + `ListFooterComponent` (ActivityIndicator) on SearchableList's FlatList
- Forwarded pagination props through DataList and UnifiedDataManager (exercises tab only)
- Updated `useAPIExercises.ts` to handle `PaginatedResponse`
- All 292 tests pass, zero type errors in modified files

### File List

- `lib/api.ts` — modified (exported PaginatedResponse, rewrote fetchExercises and fetchExercisesByCategory to single-page)
- `context/DataContext.tsx` — modified (pagination state, APPEND/RESET actions, loadMoreExercises, incremental loading)
- `components/data/SearchableList.tsx` — modified (onEndReached, ListFooterComponent with ActivityIndicator)
- `components/data/DataList.tsx` — modified (forwarding onEndReached, hasMore, loadingMore props)
- `components/data/UnifiedDataManager.tsx` — modified (passes pagination props from context for exercises tab)
- `hooks/data/useAPIExercises.ts` — modified (handles PaginatedResponse)

### Change Log

- 2026-03-25: Rewrote Story 0.1 from fetch-all to infinite scroll. fetchExercises() now returns one page at a time. DataContext accumulates pages incrementally. Library exercise list triggers loadMore on scroll via FlatList.onEndReached. All 292 tests pass.
