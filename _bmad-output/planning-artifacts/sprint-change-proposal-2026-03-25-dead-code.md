# Sprint Change Proposal — Dead Code Cleanup (~2,000 Lines)

**Date:** 2026-03-25
**Triggered by:** Architecture review revealed ~2,000 lines of dead enterprise scaffolding code never wired into the application
**Scope classification:** Minor
**Recommended approach:** Direct Adjustment (pure deletion, no functional changes)

---

## Section 1: Issue Summary

An architecture code audit identified ~2,000 lines of dead enterprise scaffolding across 5 files. This code was implemented speculatively (audit logging, advanced validation, search/export/stats utilities) but never connected to any consumer in the application. It adds maintenance burden, cognitive overhead, and false complexity signals for AI agents working in the codebase.

**Discovery context:** Architecture review during active sprint, before Epics 5-7 begin. Cleaning up now prevents dead code from confusing agents during upcoming story implementation.

**Evidence:** Verified via comprehensive grep analysis — every claimed dead function/type was confirmed to have zero external call sites in production code.

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Status | Impact |
|------|--------|--------|
| Epic 0: API Pagination Adaptation | in-progress | None |
| Epic 1: Dark Theme | done | None |
| Epic 2: Core Workout Logging | in-progress (2.9 in review) | None |
| Epic 3: State Persistence | done | None |
| Epic 4: Rest Timer & Haptics | done | None |
| Epic 5: PR Detection | backlog | None |
| Epic 6: Exercise Media | backlog | None |
| Epic 7: Completion & Sync | backlog | None |

**No epics are affected.** All removed code has zero call sites — no story's acceptance criteria references any of these functions.

### Story Impact

No stories need modification. The dead code is not part of any story's scope or acceptance criteria.

### Artifact Conflicts

| Artifact | Conflict | Resolution |
|----------|----------|------------|
| PRD | None — dead code not mentioned | No change needed |
| Architecture | None — no references to audit logging, searchData, exportData, or dead validation | No change needed |
| UX Design | None | No change needed |
| Epics & Stories | None | No change needed |

### Technical Impact

| File | Current Lines | Change | Estimated After |
|------|--------------|--------|-----------------|
| `lib/auditLogger.ts` | 517 | **Delete entirely** | 0 |
| `lib/validation.ts` | ~1,115 | Remove 11 dead exports (challenge validation, unused helpers) | ~350 |
| `lib/dependencyChecker.ts` | 475 | Remove 3 dead exports + dead class methods; keep `canSafelyDelete` + its internal dependencies | ~120 |
| `context/DataContext.tsx` | 971 | Remove 5 dead functions + 4 dead state fields + related refs/imports | ~740 |
| `types/enhanced.ts` | 332 | Remove 8 transitively-dead types + update interfaces | ~200 |
| `types/index.ts` | — | Remove re-exports of deleted types | Minor |

**Estimated net removal: ~1,800-2,000 lines**

---

## Section 3: Recommended Approach

**Selected: Direct Adjustment — Pure deletion of dead code**

### Rationale

- **Effort: Low** — Deletion is mechanical. No new logic, no behavior changes.
- **Risk: Low** — Every removed function has verified zero call sites. TypeScript compiler will catch any missed references.
- **Timeline impact: None** — Can be done in a single focused session.
- **No new dependencies, no backend changes, no UI changes.**

### Alternatives considered

- **Do nothing:** Viable but leaves ~2,000 lines of noise for agents working on Epics 5-7. The dead code in DataContext.tsx is particularly problematic — agents see `searchData`, `exportData`, `validateDependencies` in the context value and may assume they're part of the live API.
- **Defer to post-v1.2:** No benefit to waiting. The dead code will only get more confusing as the codebase evolves.

---

## Section 4: Detailed Change Proposals

### Change 1: Delete `lib/auditLogger.ts`

**Action:** Delete the entire file.

**Verified dead exports (17):** `AuditLogger` singleton class, `auditLogger` instance, `withAuditLogging` decorator, `detectChanges`, `createAuditMetadata`, `logEntry`, `logCreate`, `logUpdate`, `logDelete`, `logBulkDelete`, `logDuplicate`, `logImport`, `logExport`, `getLogEntries`, `getEntityHistory`, `getRecentEntries`, `getAuditStats`, `clearOldEntries`, `exportAuditLog`.

**Call sites found: 0**

### Change 2: Slim `lib/validation.ts`

**KEEP (6 exports with live consumers):**
- `validateExercise` — used by ExerciseForm.tsx, DataContext.tsx
- `validateProgram` — used by ProgramForm.tsx
- `validateModificationPermissions` — used by DataContext.tsx (deleteExercise, deleteProgram)
- `validateUniqueName` — used by DataContext.tsx (upsertExercise)
- `VALID_EXERCISE_CATEGORIES` — used by ExerciseForm.tsx
- `VALID_EXERCISE_ICONS` — used by ExerciseForm.tsx

**KEEP (internal helpers needed by live exports):**
- `createValidationError` — used internally by validateSchema
- `validateField` — used internally by validateSchema
- `validateSchema` — used by validateExercise, validateProgram
- `exerciseValidationSchema` — used by validateExercise
- `programValidationSchema` — used by validateProgram
- `validateProgramBlock` — used internally by programValidationSchema

**REMOVE (11 dead exports):**
- `VALID_DIFFICULTIES` — 0 external call sites
- `VALID_PROGRESSION_TYPES` — 0 external call sites
- `calculateSessionsToTarget` — 0 call sites
- `calculateMinimumDuration` — 0 call sites
- `calculateMaxTargetReps` — 0 call sites
- `validateChallengeInterdependencies` — 0 call sites
- `autoAdjustChallengeConfig` — 0 call sites
- `validateChallengeConfig` — 0 call sites (internal to validateChallenge)
- `validateChallenge` — 0 call sites
- `checkExerciseDependencies` — 0 call sites (replaced by DependencyChecker)
- `validateExerciseReferences` — 0 call sites

### Change 3: Slim `lib/dependencyChecker.ts`

**KEEP:**
- `canSafelyDelete` function (4 call sites: DataContext.tsx, exercises/[id]/edit.tsx, UnifiedDataManager.tsx x2)
- `DependencyChecker` class — but only `checkExerciseDependencies` and `checkProgramDependencies` methods (used internally by `canSafelyDelete`)
- Related types: `DependencyCheck`, `DataType`

**REMOVE:**
- `createDependencyChecker()` export — 0 call sites
- `validateReferentialIntegrity()` export — 0 call sites
- `canSafelyModify()` export — 0 call sites
- `DependencyChecker.validateProgramExerciseReferences()` method — 0 call sites
- `DependencyChecker.validateAllExerciseReferences()` method — 0 call sites
- `import { createValidationError }` — only used by dead methods above

### Change 4: Remove dead code from `context/DataContext.tsx`

**REMOVE functions (~229 lines):**
- `searchData` (~141 lines) — 0 consumers
- `exportData` (~30 lines) — 0 consumers
- `validateDependencies` (~29 lines) — 0 consumers
- `getUsageStats` (~16 lines) — 0 consumers
- `logAuditEntry` (~13 lines) — 0 consumers

**REMOVE state fields (+ their refs and initialization):**
- `searchCache` (Map) + `searchCacheRef`
- `validationErrors` (ValidationError[])
- `operationStatus` (OperationStatus)
- `auditLog` (AuditLogEntry[]) + `auditLogRef`

**REMOVE from context value object:**
- Remove the 5 dead functions from `actions`
- Remove the 4 dead state fields from provider value

**REMOVE dead imports:**
- Imports of dead types from `types/enhanced.ts` (AuditLogEntry, SearchQuery, SearchFacets, ExportData, UsageStats, OperationStatus)
- Import of auditLogger (if any)

### Change 5: Remove orphaned types from `types/enhanced.ts`

**REMOVE types (transitively dead — all consumers are in dead code being removed):**
- `AuditLogEntry` — only consumers: auditLogger.ts (deleted), DataContext.tsx logAuditEntry (deleted)
- `AuditAction` — only consumer: auditLogger.ts (deleted)
- `OperationStatus` — only consumer: DataContext.tsx dead state field (deleted)
- `SearchQuery` — only consumer: DataContext.tsx searchData (deleted)
- `SearchFacets` — only consumer: DataContext.tsx searchData (deleted)
- `ExportData` — only consumer: DataContext.tsx exportData (deleted)
- `UsageStats` — only consumer: DataContext.tsx getUsageStats (deleted)
- `ValidationWarningCode` — only consumer: ValidationWarning type (verify if ValidationWarning itself is still used)

**UPDATE interfaces:**
- Remove dead function signatures from `EnhancedDataActions` interface
- Remove dead state fields from `EnhancedDataState` interface

### Change 6: Clean up `types/index.ts`

**REMOVE re-exports** of the 8 deleted types from enhanced.ts.

---

## Section 5: Implementation Handoff

### Scope: Minor

This is pure dead code deletion. No functional changes, no behavior changes, no user-facing impact. The TypeScript compiler serves as the safety net — any missed reference will produce a compile error.

### Implementation order

1. Delete `lib/auditLogger.ts`
2. Remove dead exports from `lib/validation.ts`
3. Remove dead exports and methods from `lib/dependencyChecker.ts`
4. Remove dead functions, state fields, and imports from `context/DataContext.tsx`
5. Remove orphaned types from `types/enhanced.ts` and re-exports from `types/index.ts`
6. Run `npx tsc --noEmit` to verify no broken references
7. Run `npm run test:run` to verify no test regressions

### Handoff

| Recipient | Responsibility |
|-----------|---------------|
| Dev (Nocfer) | Execute all 6 changes, verify with TypeScript compiler and test suite |

### Success Criteria

- TypeScript compilation succeeds with zero errors (`npx tsc --noEmit`)
- All existing tests pass (`npm run test:run`)
- No functional changes — app behavior is identical before and after
- All 4 call sites of `canSafelyDelete` continue working
- All 4 call sites of `validateExercise`/`validateProgram`/`validateModificationPermissions`/`validateUniqueName` continue working
- Net line removal: ~1,800-2,000 lines
