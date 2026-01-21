# Flow Designer Complete Removal Plan

**Version:** 1.0
**Date:** 2026-01-21
**Objective:** Remove all flow-designer code, features, DTOs, functions, API endpoints, database tables, dependencies, and documentation from the routing-data-layer-shared monorepo.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Backend Removal](#backend-removal)
3. [Frontend Removal](#frontend-removal)
4. [Database Schema Changes](#database-schema-changes)
5. [Shared Infrastructure Changes](#shared-infrastructure-changes)
6. [Documentation Cleanup](#documentation-cleanup)
7. [Package Dependencies](#package-dependencies)
8. [Verification Checklist](#verification-checklist)
9. [Rollback Plan](#rollback-plan)

---

## Executive Summary

The flow-designer is a visual flow editing feature that allows users to graphically design IVR flows. This plan ensures **complete removal** of all related code while preserving:
- Generic segment CRUD operations (create, read, update, delete segments)
- ChangeSet infrastructure (used by other modules)
- Message Store integration (used by other features)
- Export/Import base classes (may be used elsewhere)

**Impact Analysis:**
- **Backend:** 15 API endpoints, 5 service files, 3 DTO files, 1 database table
- **Frontend:** 60+ component/hook/utility files, 2 routes, 1 Zustand store
- **Database:** 1 table (`seg_SegmentUIState`) and 4 columns in existing tables
- **Dependencies:** 2 NPM packages (`@xyflow/react`, `dagre`)

---

## Backend Removal

### 1. Delete API Endpoints from Controller

**File:** `services/backend/src/modules/segment-store/segment-store.controller.ts`

Remove the following 15 endpoints (all tagged with `@ApiTags('flow-designer')`):

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/segments/flows/:routingId` | Get flow (published or draft) |
| POST | `/segments/flows/:routingId` | Create/Save flow |
| PUT | `/segments/flows/:routingId/drafts/:changeSetId` | Save flow draft |
| POST | `/segments/flows/:routingId/validate` | Validate flow |
| PUT | `/segments/flows/:routingId/segments/order` | Update segment order |
| POST | `/segments/flows/:routingId/auto-order` | Auto-order segments |
| POST | `/segments/flows/:routingId/drafts/:changeSetId/publish` | Publish draft |
| DELETE | `/segments/flows/:routingId/drafts/:changeSetId` | Discard draft |
| GET | `/segments/flows/:routingId/export` | Export flow |
| POST | `/segments/flows/:routingId/import` | Import flow |
| POST | `/segments/flows/:routingId/import/preview` | Preview import |
| PUT | `/segments/ui-state/:segmentId` | Update UI state |
| POST | `/segments/ui-state/batch` | Batch update UI state |
| GET | `/segments/ui-state/:segmentId` | Get UI state |
| DELETE | `/segments/ui-state/:segmentId` | Delete UI state |

**Action Steps:**
1. Open `services/backend/src/modules/segment-store/segment-store.controller.ts`
2. Search for all methods with `@ApiTags` containing `'flow-designer'`
3. Delete each endpoint method entirely (including decorators, parameters, and implementation)
4. Remove imports for:
   - `CompleteFlowDto`, `FlowValidationDto`, `FlowImportDto`, `FlowExportDto`, `FlowPublishResultDto`
   - `ExportFlowQueryDto`, `ImportFlowQueryDto`, `SegmentOrderQueryDto`
   - `UpdateSegmentUIStateDto`, `BatchUpdateUIStateDto`, `SegmentUIStateResponseDto`
   - `FlowService`, `FlowExportService`, `FlowImportService`

### 2. Delete Service Files

**Delete these files entirely:**

```
services/backend/src/modules/segment-store/flow.service.ts (1,127 lines)
services/backend/src/modules/segment-store/services/flow-export.service.ts (480 lines)
services/backend/src/modules/segment-store/services/flow-import.service.ts (150+ lines)
```

### 3. Delete DTO Files

**Delete these files entirely:**

```
services/backend/src/modules/segment-store/dto/flow.dto.ts (632 lines)
services/backend/src/modules/segment-store/dto/segment-ui-state.dto.ts (entire file)
```

**Modify this file:**

```
services/backend/src/modules/segment-store/dto/query.dto.ts
```

Remove these classes:
- `ExportFlowQueryDto`
- `ImportFlowQueryDto`
- `SegmentOrderQueryDto`

Keep other query DTOs if they exist for non-flow operations.

### 4. Remove Service Methods from SegmentStoreService

**File:** `services/backend/src/modules/segment-store/segment-store.service.ts`

Remove these methods (flow-designer UI state management):
- `upsertSegmentUIState(segmentId, routingId, changeSetId, uiState)`
- `batchUpdateUIState(routingId, changeSetId, states)`
- `getSegmentUIState(segmentId)`
- `deleteSegmentUIState(segmentId)`
- `deleteAllUIStatesForFlow(routingId, changeSetId)`

**Action Steps:**
1. Search for each method name in the file
2. Delete method implementation
3. Remove related imports for UI state DTOs

### 5. Update Module Providers

**File:** `services/backend/src/modules/segment-store/segment-store.module.ts`

Remove from `providers` array:
- `FlowService`
- `FlowExportService`
- `FlowImportService`

Remove corresponding imports at top of file.

### 6. Remove Shared Export/Import Infrastructure (If Unused)

**⚠️ IMPORTANT:** Only delete these if they are **not used by any other module** (e.g., routing-table, message-store).

**Files to investigate:**
```
services/backend/src/shared/export-import/base/base-export.service.ts
services/backend/src/shared/export-import/base/base-import.service.ts
services/backend/src/shared/export-import/interfaces/export-import.interface.ts
services/backend/src/shared/export-import/utils/message-key-extractor.ts
```

**Action Steps:**
1. Use `Grep` to search for imports of these classes across the codebase
2. If no other modules use them, delete the entire `services/backend/src/shared/export-import/` directory
3. If other modules use them, keep them intact

---

## Frontend Removal

### 1. Delete Feature Directory

**Delete entire directory:**

```
frontend/src/features/flow-designer/
```

This removes:
- 60+ TypeScript/TSX files
- ~8,000+ lines of code
- All components, hooks, stores, types, utilities

### 2. Remove Routes

**File:** `frontend/src/app/routes.tsx`

Remove these two routes:
```tsx
{
  path: '/designer/:routingId',
  element: <FlowDesignerPage />
}
{
  path: '/designer/:routingId/drafts/:changeSetId',
  element: <FlowDesignerPage />
}
```

Remove the import:
```tsx
import { FlowDesignerPage } from '@/features/flow-designer';
```

### 3. Delete API Services

**Delete these files:**

```
frontend/src/services/flows/flows.service.ts
frontend/src/services/flows/flows-draft.service.ts
frontend/src/services/flows/flows-validation.service.ts
frontend/src/services/flows/flows-export.service.ts
frontend/src/services/flows/index.ts
```

**Delete entire directory:**
```
frontend/src/services/flows/
```

### 4. Remove API Type Definitions

**File:** `frontend/src/api/types/flows.types.ts`

**Delete this file entirely** (contains frontend mirror of flow DTOs).

**File:** `frontend/src/api/types/index.ts`

Remove export:
```tsx
export * from './flows.types';
```

### 5. Remove Navigation Links

Search for any navigation links pointing to `/designer/` routes:

**Files to check:**
- `frontend/src/components/layout/Navigation.tsx`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/features/routing/components/RoutingTable.tsx` (may have "Open Designer" buttons)
- `frontend/src/features/segments/` (any "View Flow" links)

**Action Steps:**
1. Search for `'/designer'` across `frontend/src/`
2. Remove buttons/links that navigate to flow designer
3. Remove any "Open in Designer" or "View Flow" UI elements

---

## Database Schema Changes

### 1. Drop SegmentUIState Table

**File:** `services/backend/prisma/schema.prisma`

**Remove this entire model:**

```prisma
model SegmentUIState {
  segmentId   String   @id @map("SegmentId") @db.UniqueIdentifier
  routingId   String   @map("RoutingId") @db.VarChar(150)
  changeSetId String?  @map("ChangeSetId") @db.UniqueIdentifier
  positionX   Int?     @map("PositionX")
  positionY   Int?     @map("PositionY")
  collapsed   Boolean  @default(false) @map("Collapsed")
  uiSettings  String?  @map("UiSettings") @db.NVarChar(2000)
  dateUpdated DateTime @updatedAt @map("DateUpdated") @db.DateTime2

  segment Segment @relation(fields: [segmentId], references: [segmentId], onDelete: Cascade)

  @@index([routingId, changeSetId], name: "ix_ui_state_routing")
  @@schema("ivr")
  @@map("seg_SegmentUIState")
}
```

**Also remove the relation from Segment model:**

```prisma
model Segment {
  // ... existing fields ...
  uiState SegmentUIState? // ⬅️ DELETE THIS LINE
}
```

### 2. Remove segmentOrder Column from Segment Table

**File:** `services/backend/prisma/schema.prisma`

**In the `Segment` model, remove:**

```prisma
segmentOrder Int? @map("SegmentOrder") @db.Int
```

**Also remove the index:**

```prisma
@@index([routingId, segmentOrder], name: "ix_segment_order")
```

### 3. Remove configOrder Column from Key Table

**File:** `services/backend/prisma/schema.prisma`

**In the `Key` model, remove:**

```prisma
configOrder Int? @map("ConfigOrder") @db.Int
```

**Also remove the index:**

```prisma
@@index([segmentId, configOrder], name: "ix_key_order")
```

### 4. Remove transitionOrder Column from SegmentTransition Table

**File:** `services/backend/prisma/schema.prisma`

**In the `SegmentTransition` model, remove:**

```prisma
transitionOrder Int? @map("TransitionOrder") @db.Int
```

**Also remove the index:**

```prisma
@@index([segmentId, transitionOrder], name: "ix_transition_order")
```

### 5. Create Migration

**Action Steps:**

```bash
cd services/backend

# Generate Prisma Client with new schema
npm run prisma:generate

# Create migration
npx prisma migrate dev --name remove_flow_designer

# Migration will generate SQL like:
# DROP TABLE [ivr].[seg_SegmentUIState];
# ALTER TABLE [ivr].[seg_Segment] DROP COLUMN [SegmentOrder];
# ALTER TABLE [ivr].[seg_Key] DROP COLUMN [ConfigOrder];
# ALTER TABLE [ivr].[seg_SegmentTransition] DROP COLUMN [TransitionOrder];
# DROP INDEX [ix_segment_order] ON [ivr].[seg_Segment];
# DROP INDEX [ix_key_order] ON [ivr].[seg_Key];
# DROP INDEX [ix_transition_order] ON [ivr].[seg_SegmentTransition];
```

**⚠️ WARNING:** This migration will **permanently delete** UI state data. Backup database before running.

---

## Shared Infrastructure Changes

### 1. Check Export/Import Base Classes Usage

**Files to investigate:**
```
services/backend/src/shared/export-import/
```

**Action Steps:**
1. Search for imports of `BaseExportService` and `BaseImportService` across the codebase
2. Check if routing-table or message-store modules use them
3. If **only** flow-designer uses them: Delete the entire `export-import/` directory
4. If other modules use them: Keep them intact

**Search commands:**
```bash
# Check usage
grep -r "BaseExportService" services/backend/src/
grep -r "BaseImportService" services/backend/src/
grep -r "from.*export-import" services/backend/src/
```

### 2. Remove Message Key Extractor (If Unused)

**File:** `services/backend/src/shared/export-import/utils/message-key-extractor.ts`

This utility is used by flow-export to extract message keys from segments.

**Action Steps:**
1. Search for imports of `extractMessageKeysFromSegments`
2. If **only** used by flow-export: Delete the file
3. If used elsewhere: Keep it

---

## Documentation Cleanup

### 1. Delete Flow-Designer Documentation

**Delete these files:**

```
.claude/outputs/flow-designer-ui-improvements-qa-summary.md
docs/FLOW_JSON_FORMAT_ANALYSIS.md (if exclusively about flow JSON)
```

### 2. Update Main Documentation

**Files to modify:**

#### `CLAUDE.md`

Remove or update sections mentioning:
- Flow designer routes (`/designer/:routingId`)
- Flow designer pages
- `@xyflow/react` library
- Flow visualization features
- Flow export/import

**Sections to remove:**
- Any references to "Visual flow editor using @xyflow/react"
- Any references to "Flow designer" in architecture descriptions

#### `README.md`

Remove mentions of:
- Flow designer feature
- Visual IVR flow editing
- `@xyflow/react` dependency

#### `docs/FRONTEND_GUIDE.md`

Remove:
- Flow designer architecture
- Flow designer components
- Flow designer state management

#### `docs/DEVELOPER_GUIDE.md`

Remove:
- Flow designer API endpoints
- Flow designer usage instructions

#### `docs/SPEC-02-SEGMENT-STORE-SERVICE.md`

Remove:
- Flow service specifications
- Flow import/export specifications
- UI state management specifications

#### `docs/SEGMENT_STORE_DESIGN.md`

Remove:
- Flow designer architecture
- UI state persistence design
- Flow validation design

### 3. Clean Up Agent/Workflow Files

**Review and delete/update:**

```
.claude/workflows/transition-editor-drag-drop-implementation.md
.claude/workflows/config-editor-drag-drop-fix.md
.claude/workflows/data-migration-populate-order-columns.md
.claude/workflows/segment-controller-refactor-sprint*.md
.cursor/analysis/frontend-restructuring-plan.md
.cursor/analysis/frontend-refactor-plan.md
```

If these files are exclusively about flow-designer: **Delete them**
If they contain mixed content: **Remove flow-designer sections**

---

## Package Dependencies

### 1. Frontend Dependencies to Remove

**File:** `frontend/package.json`

Remove these dependencies:

```json
"@xyflow/react": "^12.10.0",
"dagre": "^0.8.5",
```

Remove devDependencies:

```json
"@types/dagre": "^0.7.53",
```

**Action Steps:**
```bash
cd frontend
npm uninstall @xyflow/react dagre @types/dagre
```

### 2. Backend Dependencies (Check Usage)

**File:** `services/backend/package.json`

The backend doesn't have flow-designer specific dependencies (uses `ajv` for hook validation, but that's general purpose).

No dependencies need removal.

---

## Verification Checklist

After completing all removal steps, verify:

### Backend Verification

- [ ] No imports of deleted services (`FlowService`, `FlowExportService`, `FlowImportService`)
- [ ] No imports of deleted DTOs (`CompleteFlowDto`, `FlowValidationDto`, etc.)
- [ ] No `@ApiTags('flow-designer')` in any controller
- [ ] `segment-store.module.ts` compiles without errors
- [ ] Run: `cd services/backend && npm run build`
- [ ] Run: `cd services/backend && npm run test`
- [ ] Prisma schema valid: `npx prisma validate`
- [ ] Database migration successful: `npx prisma migrate dev`

### Frontend Verification

- [ ] No imports from `@/features/flow-designer`
- [ ] No routes to `/designer/`
- [ ] No API calls to `/segments/flows/*` endpoints
- [ ] No "Open Designer" or "View Flow" buttons in UI
- [ ] Run: `cd frontend && npm run build`
- [ ] Run: `cd frontend && npm run type-check`
- [ ] No TypeScript errors referencing flow types

### Full System Verification

- [ ] Search for "flow-designer" across entire codebase: `grep -r "flow-designer" --include="*.ts" --include="*.tsx"`
- [ ] Search for "FlowService": `grep -r "FlowService" --include="*.ts"`
- [ ] Search for "@xyflow": `grep -r "@xyflow" --include="*.ts" --include="*.tsx" --include="*.json"`
- [ ] Search for "dagre": `grep -r "dagre" --include="*.ts" --include="*.tsx" --include="*.json"`
- [ ] Run full build: `npm run build:all` (from root)
- [ ] Run full tests: `npm run test:backend` (from root)
- [ ] Start dev environment: `npm run dev` (verify both backend and frontend start)
- [ ] Check Swagger UI: `http://localhost:3001/api-docs` (no flow-designer endpoints)

### Database Verification

- [ ] Connect to database and verify:
  - Table `seg_SegmentUIState` no longer exists
  - Column `seg_Segment.SegmentOrder` no longer exists
  - Column `seg_Key.ConfigOrder` no longer exists
  - Column `seg_SegmentTransition.TransitionOrder` no longer exists
- [ ] Run: `npx prisma studio` and verify schema matches expectations

---

## Rollback Plan

If removal causes unexpected issues:

### 1. Database Rollback

```bash
cd services/backend

# Rollback to previous migration
npx prisma migrate rollback

# Or restore from backup
# Restore SQL Server backup taken before migration
```

### 2. Code Rollback

```bash
# Using git
git checkout <commit-before-removal>

# Or revert specific commits
git revert <removal-commit-hash>
```

### 3. Dependency Rollback

```bash
cd frontend
npm install @xyflow/react@^12.10.0 dagre@^0.8.5
npm install --save-dev @types/dagre@^0.7.53
```

---

## Execution Order

**Recommended sequence:**

1. **Backup Database** (critical!)
2. **Create feature branch:** `git checkout -b feature/remove-flow-designer`
3. **Backend cleanup:**
   - Delete service files
   - Delete DTO files
   - Remove controller endpoints
   - Update module providers
   - Remove UI state methods from SegmentStoreService
4. **Database schema changes:**
   - Update Prisma schema
   - Generate Prisma client
   - Create migration (DO NOT apply yet)
5. **Frontend cleanup:**
   - Delete feature directory
   - Remove routes
   - Delete API services
   - Remove type definitions
   - Remove navigation links
   - Uninstall dependencies
6. **Documentation cleanup:**
   - Update CLAUDE.md
   - Update README.md
   - Delete/update workflow files
7. **Verification:**
   - Run all builds
   - Run all tests
   - Check for remaining references
8. **Database migration:**
   - Apply Prisma migration
   - Verify database schema
9. **Final verification:**
   - Full system test
   - Swagger UI check
   - Start dev environment
10. **Commit and push:**
    - `git add .`
    - `git commit -m "Remove flow-designer feature completely"`
    - `git push origin feature/remove-flow-designer`
11. **Create PR for review**

---

## Post-Removal Notes

### What Remains (Intentionally Kept)

- **ChangeSet infrastructure:** Used by all modules for draft/publish workflow
- **Segment CRUD operations:** Generic segment management endpoints
- **Message Store integration:** Message manifest and message retrieval
- **Export/Import base classes:** If used by other modules (routing-table, message-store)
- **Context-aware routing:** ContextKey support in transitions (Phase 2.5 feature)

### Alternative Ways to Edit Flows

After flow-designer removal, flows can still be edited via:
- Direct API calls to segment CRUD endpoints
- Import/export JSON (if generic export/import remains)
- Database direct editing (not recommended for production)
- Future alternative UI (table-based editor, form-based editor)

---

## Estimated Effort

- **Backend removal:** 2-3 hours
- **Frontend removal:** 1-2 hours
- **Database migration:** 1 hour
- **Documentation update:** 1-2 hours
- **Verification and testing:** 2-3 hours
- **Total:** 7-11 hours

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss (UI state) | High | Low | Data is only visual layout, can be regenerated |
| Breaking other features | Medium | High | Thorough testing of segment CRUD, export/import |
| Migration failure | Low | High | Database backup, rollback plan |
| Missed references | Medium | Medium | Comprehensive grep search, TypeScript compiler |
| Build failures | Low | Medium | Run builds after each major step |

---

## Conclusion

This plan provides **exhaustive** coverage of all flow-designer code, database schema, dependencies, and documentation. Following this plan will result in **zero traces** of the flow-designer feature remaining in the codebase.

**Key Success Metrics:**
- ✅ No flow-designer imports anywhere
- ✅ No flow-designer API endpoints
- ✅ No flow-designer routes in frontend
- ✅ No `@xyflow` or `dagre` dependencies
- ✅ No `seg_SegmentUIState` table
- ✅ All builds pass
- ✅ All tests pass
- ✅ Dev environment starts successfully

---

**Document Version History:**
- v1.0 (2026-01-21): Initial comprehensive removal plan
