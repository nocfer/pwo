# Sprint Change Proposal — Exercise List Infinite Scroll

**Date:** 2026-03-25
**Supersedes:** Sprint Change Proposal 2026-03-25 (fetch-all approach)
**Triggered by:** Strategic decision to leverage backend pagination with infinite scroll instead of fetching all exercises at once
**Scope classification:** Moderate
**Recommended approach:** Direct Adjustment (rewrite Story 0.1)

---

## Section 1: Issue Summary

Story 0.1 was implemented following the original sprint change proposal to adapt `fetchExercises()` to the backend's new paginated `GET /api/v1/exercises` endpoint. The implemented approach fetches all pages eagerly (limit=100, then `Promise.all` remaining pages) and returns a flat `Exercise[]` — zero consumer changes.

**The problem:** This approach defeats the purpose of server-side pagination. As the exercise library grows, fetching hundreds of exercises on every app load is wasteful. The backend provides `page`, `limit`, and `totalPages` specifically to support incremental loading.

**The change:** Rewrite Story 0.1 to implement **infinite scroll** — the exercise library loads one page at a time as the user scrolls, leveraging the paginated API properly.

**Discovery:** User decision during Story 0.1 review, before merging the fetch-all implementation.

---

## Section 2: Impact Analysis

### Epic Impact

Epic 0 scope **expands** from a 1-file API-only fix to a multi-file change spanning the API layer, data context, and library UI. No other epics are affected.

| Epic | Impact |
|------|--------|
| Epic 0: API Pagination Adaptation | **Expanded** — Story 0.1 rewritten with new scope |
| Epic 1: Dark Theme | None (done) |
| Epic 2: Core Workout Logging | None (done) — workout loads exercises via programs, not the list endpoint |
| Epic 3: State Persistence | None (done) |
| Epic 4: Rest Timer & Haptics | None (done) |
| Epic 5: PR Detection | None |
| Epic 6: Exercise Media | Indirect benefit — exercise library already has infinite scroll when Story 6.2 begins |
| Epic 7: Completion & Sync | None |

### Story Impact

**Story 0.1** is fully rewritten:

**OLD scope:** Adapt `fetchExercises()` to fetch all pages, return flat `Exercise[]`, zero consumer changes.

**NEW scope:** Implement infinite scroll for the exercise library. `fetchExercises()` returns one page at a time. DataContext accumulates pages. Library list triggers loading on scroll.

### Artifact Conflicts

| Artifact | Conflict | Resolution |
|----------|----------|------------|
| PRD | States "zero backend changes" | Update to "minimal backend dependency" (unchanged from previous proposal) |
| Architecture | Previous proposal described "fetch all pages" pattern | Update API & Communication Patterns to describe infinite scroll / incremental loading |
| UX Design | States "no layout changes" for exercise library | No conflict — infinite scroll is a loading behavior change, not a layout redesign |
| Epics & Stories | Story 0.1 scope fully changes | Rewrite story spec |

### Technical Impact

| File | Change Required |
|------|----------------|
| `lib/api.ts` — `fetchExercises()` | Accept optional `page`/`limit` params, return `PaginatedResponse<Exercise>` instead of `Exercise[]`. Export `PaginatedResponse` type. |
| `lib/api.ts` — `fetchExercisesByCategory()` | Same paginated signature change |
| `context/DataContext.tsx` | Initial load fetches page 1 only. New `loadMoreExercises()` action. Accumulate pages in state. After save/delete, refresh loaded pages. |
| `components/data/DataList.tsx` | Pass `onEndReached` and loading props through to `SearchableList` for exercises |
| `components/data/SearchableList.tsx` | Wire `onEndReached` + `ListFooterComponent` (loading spinner) on existing `FlatList` |
| `components/data/UnifiedDataManager.tsx` | Pass pagination callbacks from DataContext down to DataList |
| `hooks/data/useAPIExercises.ts` | Update to use paginated API or deprecate |
| Story spec `0-1-*.md` | Full rewrite |

**Unchanged files:**
- `PaginatedResponse<T>` interface (already in `lib/api.ts`, reusable)
- Workout state (`workoutReducer.ts`, session screens) — different exercise state, unaffected
- `fetchExercise()` (single by ID), `fetchPrefillData()`, all CRUD functions
- `ProgramForm.tsx` exercise picker — works with exercises loaded in context

---

## Section 3: Recommended Approach

**Selected: Direct Adjustment — Rewrite Story 0.1**

The existing fetch-all implementation in `lib/api.ts` is replaced with paginated access. New infinite scroll behavior is wired through the existing component hierarchy (`UnifiedDataManager` > `DataList` > `SearchableList` > `FlatList`).

**Implementation strategy:**

1. **`lib/api.ts`**: Change `fetchExercises()` to accept `page` (default 1) and `limit` (default 20) params. Return `PaginatedResponse<Exercise>` directly. Same for `fetchExercisesByCategory()`. Export `PaginatedResponse`.
2. **`context/DataContext.tsx`**: On auth, fetch page 1 only. Add `loadMoreExercises()` that fetches the next page and appends to `state.exercises`. Track `exercisePagination` metadata (currentPage, totalPages, hasMore).
3. **`SearchableList.tsx`**: Wire `onEndReached` on the existing `FlatList`. Show a footer spinner when loading more.
4. **`DataList.tsx` / `UnifiedDataManager.tsx`**: Thread `onEndReached`, `hasMore`, and `loadingMore` props from context down to the list.

**Rationale:**
- **Effort: Medium** — ~7 files touched, but each change is straightforward
- **Risk: Low** — `FlatList` natively supports `onEndReached`, backend pagination is deployed and tested, `SearchableList` already uses `FlatList`
- **Timeline impact: Low** — replaces Story 0.1 (which was already implemented in ~1 hour). New implementation is larger but follows standard patterns.
- No new dependencies required

**Alternatives considered:**
- **Fetch-all (previous approach):** Works but defeats the purpose of pagination. Rejected by product decision.
- **Rollback:** Not useful — we still need pagination handling, just differently.
- **MVP Review:** Not warranted — this is a loading strategy change within existing UI, not a scope change.

---

## Section 4: Detailed Change Proposals

### Change 1: Rewrite Story 0.1 scope

**OLD story:**
> As a user, I want the app to load all exercises from the updated backend API, so that the exercise library continues working after the backend pagination change.

**NEW story:**
> As a user, I want the exercise library to load exercises progressively as I scroll, so that initial load is fast and the app leverages backend pagination instead of fetching everything at once.

**NEW Acceptance Criteria:**
1. `fetchExercises()` accepts optional `page` and `limit` params, returns `PaginatedResponse<Exercise>`
2. The exercise library (Library tab > Exercises) implements infinite scroll — loading the next page when scrolling near the bottom
3. A loading indicator appears at the bottom of the list while fetching the next page
4. `fetchExercisesByCategory()` follows the same paginated signature
5. Consumers that relied on the full `Exercise[]` are updated to work with incremental data
6. Existing test suite passes

### Change 2: `lib/api.ts` — paginated function signatures

**OLD:**
```typescript
export async function fetchExercises(): Promise<Exercise[]> {
  // fetches all pages, returns flat array
}
```

**NEW:**
```typescript
export async function fetchExercises(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Exercise>> {
  return request<PaginatedResponse<Exercise>>(
    `/api/v1/exercises?page=${page}&limit=${limit}`
  )
}
```

Same pattern for `fetchExercisesByCategory()`. `PaginatedResponse<T>` is exported.

### Change 3: `context/DataContext.tsx` — incremental exercise loading

- `SET_EXERCISES` action replaced with `APPEND_EXERCISES` (appends page data) and `RESET_EXERCISES` (clears for refresh)
- New state fields: `exercisePagination: { currentPage, totalPages, hasMore }`
- New action: `loadMoreExercises()` — fetches next page, dispatches `APPEND_EXERCISES`
- Initial load on auth fetches page 1 only
- After save/delete: reset and re-fetch page 1 (simplest consistency model)

### Change 4: `SearchableList.tsx` / `DataList.tsx` / `UnifiedDataManager.tsx` — infinite scroll wiring

- `SearchableList.tsx`: Add `onEndReached`, `onEndReachedThreshold` (0.5), and `ListFooterComponent` (spinner) to existing `FlatList`
- `DataList.tsx`: Accept and forward `onEndReached`, `hasMore`, `loadingMore` props
- `UnifiedDataManager.tsx`: Get `loadMoreExercises`, `hasMore`, `loadingMore` from DataContext, pass to DataList when `activeTab === 'exercises'`

### Change 5: Architecture document update

**Section: API & Communication Patterns**

Update pagination handling description to:
> Frontend pagination handling: `fetchExercises()` supports paginated access with `page` and `limit` params, returning `{ data, pagination }`. The exercise library implements infinite scroll via `FlatList.onEndReached`. DataContext accumulates pages as the user scrolls.

### Change 6: PRD update

Change "Zero backend changes" to "Minimal backend dependency" with note about the pagination change date. (Unchanged from previous proposal.)

---

## Section 5: Implementation Handoff

### Scope: Moderate

This requires rewriting Story 0.1's spec and implementation. Multiple files are affected, but the pattern is standard and contained within the exercise library flow. No backlog reorganization beyond rewriting the single story.

### Handoff

| Recipient | Responsibility |
|-----------|---------------|
| SM (Nocfer) | Rewrite Story 0.1 spec with new AC, tasks, and dev notes |
| Dev (Nocfer) | Implement Changes 2-4 (API, DataContext, UI wiring) |
| Dev (Nocfer) | Update architecture doc (Change 5) and PRD (Change 6) |

### Success Criteria

- Exercise library loads page 1 on mount, not all exercises
- Scrolling near the bottom triggers loading the next page
- Loading spinner visible while fetching next page
- All pages eventually loadable through scrolling
- After exercise create/edit/delete, list refreshes correctly
- `fetchExercisesByCategory()` also supports paginated access
- Existing test suite passes (`npm run test:run`)
- No regressions in program forms, dependency checks, or workout features
