# Frontend Restructuring Plan

## Overview

This plan transforms the frontend from a mixed app-centric structure to a feature-based architecture following industry best practices.

**Current Score**: 6/10
**Target Score**: 9/10

**Prerequisites**:
- See `frontend-refactor-plan.md` for service layer details
- See `export-import-alignment-plan.md` for API type alignment

---

## Target Architecture

```
frontend/src/
├── api/                           # API layer (centralized)
│   ├── client.ts                  # Axios instance
│   ├── endpoints.ts               # All endpoint constants
│   ├── types/                     # All API types (single source of truth)
│   │   ├── index.ts
│   │   ├── routing.types.ts
│   │   ├── segments.types.ts
│   │   ├── flows.types.ts
│   │   ├── messages.types.ts
│   │   └── export.types.ts
│   └── index.ts
│
├── components/                    # Shared components only
│   ├── ui/                        # shadcn/ui primitives
│   ├── layout/                    # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── GlobalErrorHandler.tsx
│   │   └── index.ts
│   └── common/                    # Shared business components
│       ├── ChangeSetBadge.tsx
│       ├── DraftSwitcher.tsx
│       ├── CompanyProjectSelector.tsx
│       ├── CompanyProjectHeader.tsx
│       ├── AuditSidePanel.tsx
│       └── index.ts
│
├── features/                      # Feature modules
│   ├── flow-designer/             # ✅ Already exists (keep as-is)
│   ├── routing/                   # Extract from app/
│   │   ├── components/
│   │   ├── pages/
│   │   └── index.ts
│   ├── segments/                  # Extract from app/
│   │   ├── components/
│   │   ├── pages/
│   │   └── index.ts
│   ├── messages/                  # Extract from app/
│   │   ├── components/
│   │   ├── pages/
│   │   └── index.ts
│   └── configuration/             # Extract from app/
│       ├── components/
│       ├── pages/
│       └── index.ts
│
├── services/                      # API services (all in modules)
│   ├── flows/
│   ├── messages/
│   ├── segments/
│   ├── routing/
│   ├── configuration/
│   ├── changeset/
│   └── shared/
│
├── hooks/                         # Global hooks only
├── contexts/                      # React contexts
├── styles/                        # CSS files
├── utils/                         # Global utilities
├── test/                          # Test setup
│
└── App.tsx                        # Root component (move from app/)
```

---

## Phase 1: Cleanup and Quick Wins

**Goal**: Remove deprecated files and consolidate duplicates
**Effort**: 2-3 hours
**Risk**: Low

### 1.1 Delete Deprecated Files

| File | Reason |
|------|--------|
| `features/flow-designer/api/flow-api.ts` | Migrated to `services/flows/` (if exists) |
| `constants/api.constants.ts` | Merged into `api/endpoints.ts` |
| `lib/` folder | Empty, api-client moved |

**Commands**:
```bash
# Delete deprecated files (check if exists first)
rm frontend/src/features/flow-designer/api/flow-api.ts  # if exists
rm frontend/src/constants/api.constants.ts
rmdir frontend/src/lib  # if empty
rmdir frontend/src/constants  # if empty
```

### 1.2 Update Imports

Files importing from deleted locations:

| File | Old Import | New Import |
|------|-----------|------------|
| `features/flow-designer/stores/flow-store.ts` | `../api/flow-api` | `@/services/flows/flows.service` |
| Any file using `constants/api.constants` | `@/constants/api.constants` | `@/api/endpoints` |

### 1.3 Consolidate Types

**Current State**:
- `types/api-types.ts` - 595 lines
- `api/types.ts` - duplicate definitions
- `features/flow-designer/types/flow.types.ts` - duplicate `CompleteFlow`

**Action**:
1. Create `api/types/` folder structure
2. Move types from `types/api-types.ts` to domain-specific files
3. Update `features/flow-designer/types/flow.types.ts` to import from `@/api/types`
4. Delete `types/api-types.ts` and `api/types.ts`

**Target Structure**:
```
api/types/
├── index.ts                 # Re-exports all types
├── common.types.ts          # Shared types (pagination, etc.)
├── routing.types.ts         # Routing DTOs
├── segments.types.ts        # Segment DTOs
├── flows.types.ts           # Flow DTOs (CompleteFlow, etc.)
├── messages.types.ts        # Message DTOs
└── export.types.ts          # Export/Import DTOs
```

---

## Phase 2: Extract UI Components

**Goal**: Move shadcn/ui and layout components to root level
**Effort**: 1-2 hours
**Risk**: Low (path alias update)

### 2.1 Move UI Primitives

```bash
# Move ui folder to root components
mv frontend/src/app/components/ui frontend/src/components/ui
```

**Import Update**:
```typescript
// BEFORE
import { Button } from '@/app/components/ui/button';

// AFTER
import { Button } from '@/components/ui/button';
```

**Files to update**: ~150 files (use find-replace)

```bash
# Find all files importing from @/app/components/ui
grep -r "from '@/app/components/ui" frontend/src/
```

### 2.2 Create Layout Folder

```
components/layout/
├── AppLayout.tsx           # Move from app/components/
├── GlobalErrorHandler.tsx  # Move from app/components/layout/
└── index.ts
```

### 2.3 Create Common Folder

Move shared business components that are used across features:

```
components/common/
├── ChangeSetBadge.tsx       # Move from app/components/
├── ChangeSetFilter.tsx      # Move from app/components/
├── DraftSwitcher.tsx        # Move from app/components/
├── CompanyProjectSelector.tsx # Move from app/components/
├── CompanyProjectHeader.tsx # Move from app/components/
├── AuditSidePanel.tsx       # Move from app/components/
├── ExportDialog.tsx         # Move from app/components/ - Generic export dialog
├── ImportDialog.tsx         # Move from app/components/ - Generic import dialog
├── ImportPreview.tsx        # Move from app/components/ - Generic import preview
└── index.ts
```

### 2.4 Handle Figma Components

```
components/figma/
├── ImageWithFallback.tsx    # Move from app/components/figma/
└── index.ts
```

**Note**: The `figma/` folder contains UI prototyping components. Keep separate from `common/` as these may be temporary or demo-specific.

---

## Phase 3: Extract Routing Feature

**Goal**: Create `features/routing/` module
**Effort**: 2-3 hours
**Risk**: Medium

### 3.1 Create Feature Structure

```
features/routing/
├── components/
│   ├── CreateRoutingDialog.tsx    # Move from app/components/
│   ├── EditRoutingEntryDialog.tsx # Move from app/components/
│   └── index.ts
├── pages/
│   ├── RoutingPage.tsx            # Move from app/pages/
│   └── index.ts
├── hooks/
│   └── index.ts                   # Future: useRouting, etc.
└── index.ts
```

### 3.2 File Movements

| From | To |
|------|-----|
| `app/components/CreateRoutingDialog.tsx` | `features/routing/components/` |
| `app/components/EditRoutingEntryDialog.tsx` | `features/routing/components/` |
| `app/pages/RoutingPage.tsx` | `features/routing/pages/` |

### 3.3 Create Index Files

```typescript
// features/routing/index.ts
export * from './components';
export * from './pages';

// features/routing/components/index.ts
export { CreateRoutingDialog } from './CreateRoutingDialog';
export { EditRoutingEntryDialog } from './EditRoutingEntryDialog';

// features/routing/pages/index.ts
export { RoutingPage } from './RoutingPage';
```

---

## Phase 4: Extract Segments Feature

**Goal**: Create `features/segments/` module
**Effort**: 3-4 hours
**Risk**: Medium

### 4.1 Create Feature Structure

```
features/segments/
├── components/
│   ├── CreateSegmentDialog.tsx
│   ├── EditSegmentDialog.tsx
│   ├── ViewSegmentDialog.tsx
│   ├── SegmentFlowDialog.tsx
│   ├── SegmentFlowVisualization.tsx
│   ├── SegmentOrderPanel.tsx
│   ├── segment-form/              # Sub-group
│   │   ├── AddTransitionDialog.tsx
│   │   ├── DynamicConfigForm.tsx
│   │   ├── HooksEditor.tsx
│   │   ├── SegmentTypeList.tsx
│   │   ├── TransitionManager.tsx
│   │   └── index.ts
│   └── index.ts
├── pages/
│   ├── SegmentsPage.tsx
│   ├── SegmentSettingsPage.tsx
│   └── index.ts
├── hooks/
│   └── index.ts
└── index.ts
```

### 4.2 File Movements

| From | To |
|------|-----|
| `app/components/CreateSegmentDialog.tsx` | `features/segments/components/` |
| `app/components/EditSegmentDialog.tsx` | `features/segments/components/` |
| `app/components/ViewSegmentDialog.tsx` | `features/segments/components/` |
| `app/components/SegmentFlowDialog.tsx` | `features/segments/components/` |
| `app/components/SegmentFlowVisualization.tsx` | `features/segments/components/` |
| `app/components/SegmentOrderPanel.tsx` | `features/segments/components/` |
| `app/components/segment-form/*` | `features/segments/components/segment-form/` |
| `app/pages/SegmentsPage.tsx` | `features/segments/pages/` |
| `app/pages/SegmentSettingsPage.tsx` | `features/segments/pages/` |
| `app/components/__tests__/*Segment*.test.tsx` | `features/segments/components/__tests__/` |

---

## Phase 5: Extract Messages Feature

**Goal**: Create `features/messages/` module
**Effort**: 4-5 hours
**Risk**: Medium (largest feature)

### 5.1 Create Feature Structure

```
features/messages/
├── components/
│   ├── CreateMessageDialog.tsx
│   ├── EditMessageDialog.tsx
│   ├── MessageStoreDialog.tsx
│   ├── MessageStoreList.tsx
│   ├── MessageStoreSelector.tsx
│   ├── MessageVersionsDialog.tsx
│   ├── MessageVersionDetailsDialog.tsx
│   ├── MessageVersionSelector.tsx
│   ├── MultiLanguageEditDialog.tsx
│   ├── MessageExportDialog.tsx
│   ├── MessageImportPreview.tsx
│   ├── messages/                  # Sub-group
│   │   ├── TypeSettingsEditor.tsx
│   │   └── index.ts
│   └── index.ts
├── pages/
│   ├── MessagesPage.tsx
│   ├── MessageDetailPage.tsx
│   ├── MessageSettingsPage.tsx
│   └── index.ts
├── hooks/
│   └── index.ts
└── index.ts
```

### 5.2 File Movements

| From | To |
|------|-----|
| `app/components/CreateMessageDialog.tsx` | `features/messages/components/` |
| `app/components/EditMessageDialog.tsx` | `features/messages/components/` |
| `app/components/MessageStoreDialog.tsx` | `features/messages/components/` |
| `app/components/MessageStoreList.tsx` | `features/messages/components/` |
| `app/components/MessageStoreSelector.tsx` | `features/messages/components/` |
| `app/components/MessageVersionsDialog.tsx` | `features/messages/components/` |
| `app/components/MessageVersionDetailsDialog.tsx` | `features/messages/components/` |
| `app/components/MessageVersionSelector.tsx` | `features/messages/components/` |
| `app/components/MultiLanguageEditDialog.tsx` | `features/messages/components/` |
| `app/components/MessageExportDialog.tsx` | `features/messages/components/` |
| `app/components/MessageImportPreview.tsx` | `features/messages/components/` |
| `app/components/messages/*` | `features/messages/components/messages/` |
| `app/pages/MessagesPage.tsx` | `features/messages/pages/` |
| `app/pages/MessageDetailPage.tsx` | `features/messages/pages/` |
| `app/pages/MessageSettingsPage.tsx` | `features/messages/pages/` |

---

## Phase 6: Extract Configuration Feature

**Goal**: Create `features/configuration/` module
**Effort**: 3-4 hours
**Risk**: Medium

### 6.1 Create Feature Structure

```
features/configuration/
├── components/
│   ├── dictionaries/              # Dictionary editors
│   │   ├── LanguageTab.tsx
│   │   ├── LanguageDialog.tsx
│   │   ├── VoiceTab.tsx
│   │   ├── VoiceDialog.tsx
│   │   ├── VoiceImpactDialog.tsx
│   │   ├── KeyTypeTab.tsx
│   │   ├── KeyTypeDialog.tsx
│   │   ├── KeyTypeImpactDialog.tsx
│   │   ├── MessageTypeTab.tsx
│   │   ├── MessageTypeDialog.tsx
│   │   ├── MessageTypeImpactDialog.tsx
│   │   ├── MessageCategoryTab.tsx
│   │   ├── MessageCategoryDialog.tsx
│   │   ├── MessageCategoryImpactDialog.tsx
│   │   └── index.ts
│   ├── segment-types/             # Segment type management
│   │   ├── SegmentTypeTab.tsx
│   │   ├── SegmentTypeEditor.tsx
│   │   ├── SegmentTypeWizard.tsx
│   │   ├── SegmentTypeImpactDialog.tsx
│   │   ├── ImpactAnalysisDialog.tsx
│   │   ├── wizard/
│   │   │   ├── AddKeyDialog.tsx
│   │   │   ├── Step1BasicInfo.tsx
│   │   │   ├── Step2DefineKeys.tsx
│   │   │   ├── Step3Review.tsx
│   │   │   ├── Step4Success.tsx
│   │   │   └── index.ts
│   │   ├── editor/
│   │   │   ├── BasicInfoTab.tsx
│   │   │   ├── KeyManagementTab.tsx
│   │   │   ├── KeyImpactDialog.tsx
│   │   │   ├── UsageTab.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── company-projects/          # Company/project management
│   │   ├── CompanyProjectsTab.tsx
│   │   └── index.ts
│   └── index.ts
├── pages/
│   ├── ConfigurationPage.tsx
│   ├── AdminPage.tsx
│   └── index.ts
├── hooks/
│   └── index.ts
└── index.ts
```

### 6.2 File Movements

| From | To |
|------|-----|
| `app/components/config/*Tab.tsx` | `features/configuration/components/dictionaries/` |
| `app/components/config/*Dialog.tsx` | `features/configuration/components/dictionaries/` |
| `app/components/config/SegmentType*.tsx` | `features/configuration/components/segment-types/` |
| `app/components/config/wizard/*` | `features/configuration/components/segment-types/wizard/` |
| `app/components/config/editor/*` | `features/configuration/components/segment-types/editor/` |
| `app/components/config/CompanyProjectsTab.tsx` | `features/configuration/components/company-projects/` |
| `app/pages/ConfigurationPage.tsx` | `features/configuration/pages/` |
| `app/pages/AdminPage.tsx` | `features/configuration/pages/` |

---

## Phase 7: Consolidate Services

**Goal**: Move all services into module folders
**Effort**: 2-3 hours
**Risk**: Low

### 7.1 Current State

```
services/
├── flows/           # ✅ Module-based (missing index.ts)
│   ├── flows.service.ts
│   ├── flows.service.test.ts
│   ├── flows-draft.service.ts
│   ├── flows-export.service.ts
│   ├── flows-validation.service.ts
│   └── flows-utilities.service.test.ts
├── messages/        # ✅ Module-based (missing index.ts)
│   ├── messages.service.ts
│   ├── messages.service.test.ts
│   ├── message-stores.service.ts
│   ├── message-stores.service.test.ts
│   ├── messages-export.service.ts
│   ├── messages-export.service.test.ts
│   ├── messages-versions.service.ts
│   ├── messages-versions.service.test.ts
│   ├── messages-runtime.service.ts
│   ├── messages-runtime.service.test.ts
│   └── types.ts
├── segments/        # ✅ Module-based (missing index.ts)
│   ├── segments.service.ts
│   ├── segments.service.test.ts
│   ├── segments-draft.service.ts
│   ├── segments-export.service.ts
│   ├── segments-graph.service.ts
│   └── segments-utilities.service.test.ts
├── routing/         # ⚠️ Incomplete - only has index.ts, no service
│   └── index.ts     # Empty barrel export
├── audit.service.ts          # Flat
├── changeset.service.ts      # Flat
├── company-project.service.ts # Flat
├── configuration.service.ts  # Flat
├── export-import.service.ts  # Flat
├── file-handler.service.ts   # Flat
├── health.service.ts         # Flat
├── import-preview.service.ts # Flat
└── README_SERVICES.md        # Documentation
```

**Note**: `routing/index.ts` is currently empty (only barrel export stub). Either:
- Create actual `routing.service.ts` implementation
- Or delete the folder if routing is handled elsewhere

### 7.2 Target State

```
services/
├── flows/
│   ├── flows.service.ts
│   ├── flows-draft.service.ts
│   ├── flows-export.service.ts
│   ├── flows-validation.service.ts
│   └── index.ts
├── messages/
│   ├── message-stores.service.ts
│   ├── messages.service.ts
│   ├── messages-export.service.ts
│   ├── messages-versions.service.ts
│   ├── messages-runtime.service.ts
│   ├── types.ts
│   └── index.ts
├── segments/
│   ├── segments.service.ts
│   ├── segments-draft.service.ts
│   ├── segments-export.service.ts
│   ├── segments-graph.service.ts
│   └── index.ts
├── routing/
│   ├── routing.service.ts       # CREATE - currently missing
│   └── index.ts                 # EXISTS - update exports
├── configuration/
│   ├── configuration.service.ts
│   └── index.ts
├── changeset/
│   ├── changeset.service.ts
│   └── index.ts
├── shared/
│   ├── export-import.service.ts
│   ├── file-handler.service.ts
│   ├── import-preview.service.ts
│   └── index.ts
├── audit/
│   ├── audit.service.ts
│   └── index.ts
├── health/
│   ├── health.service.ts
│   └── index.ts
└── company-project/
    ├── company-project.service.ts
    └── index.ts
```

### 7.3 File Movements

| From | To |
|------|-----|
| `services/audit.service.ts` | `services/audit/` |
| `services/changeset.service.ts` | `services/changeset/` |
| `services/company-project.service.ts` | `services/company-project/` |
| `services/configuration.service.ts` | `services/configuration/` |
| `services/export-import.service.ts` | `services/shared/` |
| `services/file-handler.service.ts` | `services/shared/` |
| `services/health.service.ts` | `services/health/` |
| `services/import-preview.service.ts` | `services/shared/` |

### 7.4 Add Missing Index Files

Create barrel exports for existing module folders:

```typescript
// services/flows/index.ts
export * from './flows.service';
export * from './flows-draft.service';
export * from './flows-export.service';
export * from './flows-validation.service';

// services/messages/index.ts
export * from './messages.service';
export * from './message-stores.service';
export * from './messages-export.service';
export * from './messages-versions.service';
export * from './messages-runtime.service';
export * from './types';

// services/segments/index.ts
export * from './segments.service';
export * from './segments-draft.service';
export * from './segments-export.service';
export * from './segments-graph.service';
```

---

## Phase 8: Cleanup App Folder

**Goal**: Reduce app/ to just router configuration
**Effort**: 1-2 hours
**Risk**: Low

### 8.1 After All Extractions

```
app/                           # Minimal - just routing
├── App.tsx                    # Root component + router
├── routes.tsx                 # Route definitions (new)
└── hooks/                     # DELETE (move to global hooks/)
    └── useExportImport.ts     # Move to hooks/
```

### 8.2 Move Remaining Hook

```bash
mv frontend/src/app/hooks/useExportImport.ts frontend/src/hooks/
rmdir frontend/src/app/hooks
```

### 8.3 Create Routes File

```typescript
// app/routes.tsx
import { Routes, Route } from 'react-router-dom';

// Feature pages
import { RoutingPage } from '@/features/routing';
import { SegmentsPage, SegmentSettingsPage } from '@/features/segments';
import { MessagesPage, MessageDetailPage, MessageSettingsPage } from '@/features/messages';
import { ConfigurationPage, AdminPage } from '@/features/configuration';
import { FlowDesignerPage } from '@/features/flow-designer';

// Standalone pages (remain in app/pages/ as they don't belong to a specific feature)
import HomePage from './pages/HomePage';
import DemoPage from './pages/DemoPage';
import CustomNodesDemoPage from './pages/CustomNodesDemoPage';
import FlowExportPage from './pages/FlowExportPage';
import FlowImportPage from './pages/FlowImportPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/routing" element={<RoutingPage />} />
      <Route path="/segments" element={<SegmentsPage />} />
      <Route path="/segments/settings" element={<SegmentSettingsPage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/messages/:key" element={<MessageDetailPage />} />
      <Route path="/messages/settings" element={<MessageSettingsPage />} />
      <Route path="/flow-designer/:routingId" element={<FlowDesignerPage />} />
      <Route path="/configuration" element={<ConfigurationPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/demo/custom-nodes" element={<CustomNodesDemoPage />} />
      <Route path="/flow-export" element={<FlowExportPage />} />
      <Route path="/flow-import" element={<FlowImportPage />} />
    </Routes>
  );
}
```

**Note**: Standalone pages (HomePage, DemoPage, etc.) remain in `app/pages/` as they don't belong to a specific feature module. They are imported using relative paths from within the `app/` folder.

---

## Implementation Summary

### File Count by Phase

| Phase | Files to Move | Files to Delete | New Files | New Folders |
|-------|---------------|-----------------|-----------|-------------|
| 1. Cleanup | 0 | 2-3 | 0 | 1 |
| 2. UI Components | ~55 | 0 | 2 | 4 |
| 3. Routing Feature | 3 | 0 | 3 | 3 |
| 4. Segments Feature | 12 | 0 | 3 | 4 |
| 5. Messages Feature | 15 | 0 | 3 | 4 |
| 6. Configuration | 25 | 0 | 3 | 6 |
| 7. Services | 8 | 0 | 6 | 6 |
| 8. App Cleanup | 1 | 0 | 1 | 0 |
| **Total** | **~119** | **2-3** | **21** | **28** |

**Phase 1 deletions**: 2-3 deprecated files (if they exist)
**Phase 2 additions**: +10 files to common/ (including ExportDialog, ImportDialog, ImportPreview) + figma/ folder
**Phase 7 new files**: 6 barrel exports (`index.ts` for flows, messages, segments, routing, configuration, shared)

### Import Update Summary

After restructuring, imports follow this pattern:

```typescript
// API layer
import { apiClient } from '@/api';
import { FLOWS, SEGMENTS } from '@/api/endpoints';
import type { CompleteFlow, SegmentSnapshot } from '@/api/types';

// Services
import { getFlow, saveFlow } from '@/services/flows';
import { listSegments } from '@/services/segments';

// Features
import { RoutingPage } from '@/features/routing';
import { CreateSegmentDialog } from '@/features/segments';
import { MessageStoreSelector } from '@/features/messages';

// Shared components
import { Button, Dialog } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { ChangeSetBadge } from '@/components/common';

// Hooks and contexts
import { useAuth } from '@/hooks/useAuth';
import { useCompanyProject } from '@/contexts/CompanyProjectContext';
```

---

## Verification Checklist

### After Each Phase

- [ ] Run `npm run type-check` - No TypeScript errors
- [ ] Run `npm run lint` - No linting errors
- [ ] Run `npm run test` - All tests pass
- [ ] Manual test affected pages

### After Complete Migration

- [ ] All imports use new paths
- [ ] No circular dependencies
- [ ] All routes work
- [ ] Flow Designer fully functional
- [ ] Export/Import works
- [ ] All dialogs open correctly

### Git Workflow

```bash
# Create feature branch
git checkout -b refactor/frontend-restructure

# Commit after each phase
git add .
git commit -m "refactor(frontend): Phase N - description"

# Final cleanup
npm run lint:fix
npm run test
git add .
git commit -m "refactor(frontend): complete restructuring"
```

---

## Risk Mitigation

### High-Risk Areas

1. **Flow Designer** - Complex feature, don't touch internal structure
2. **UI Components** - Many files import, batch update carefully
3. **Router** - Central to app, test thoroughly

### Rollback Strategy

Each phase is independent. If issues arise:

1. `git stash` uncommitted changes
2. `git checkout <last-working-commit>`
3. Fix issues in isolation
4. `git stash pop` and continue

### Testing Strategy

1. **Unit tests** - Run after each file move
2. **Integration tests** - Run after each phase
3. **Manual testing** - Test each feature after extraction:
   - Routing: Create/Edit entries
   - Segments: CRUD operations, flow visualization
   - Messages: Store management, versioning
   - Configuration: Dictionary CRUD, segment type wizard

---

## Timeline

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| 1. Cleanup | 2-3 hours | None |
| 2. UI Components | 1-2 hours | None |
| 3. Routing Feature | 2-3 hours | Phase 2 |
| 4. Segments Feature | 3-4 hours | Phase 2 |
| 5. Messages Feature | 4-5 hours | Phase 2 |
| 6. Configuration | 3-4 hours | Phase 2 |
| 7. Services | 2-3 hours | None |
| 8. App Cleanup | 1-2 hours | Phases 3-6 |

**Total Estimated Effort**: 20-26 hours (3-4 days)

Phases 1, 2, and 7 can be done in parallel.
Phases 3-6 can be done in parallel after Phase 2.

---

## Success Criteria

After completing all phases:

1. **Zero files in `app/components/` root** (except App.tsx)
2. **All features in `features/`** folder
3. **All services in module folders**
4. **Single type source** in `api/types/`
5. **All tests passing**
6. **No TypeScript errors**
7. **Clear import patterns** following the standard

---

## References

- `frontend-folder-structure-analysis.md` - Current state analysis
- `frontend-refactor-plan.md` - Service layer details
- `export-import-alignment-plan.md` - API type alignment
- `.claude/workflows/backend-restructure-plan.md` - Backend restructure (aligned with this plan)

---

## Cross-Plan Alignment Notes

This frontend plan is aligned with the backend restructure plan:

| Frontend | Backend | Notes |
|----------|---------|-------|
| `features/routing/` | `modules/routing-table/` | "table" suffix is backend convention |
| `features/segments/` | `modules/segment-store/` | "store" suffix is backend convention |
| `features/messages/` | `modules/message-store/` | "store" suffix is backend convention |
| `features/configuration/` | `modules/dictionaries/` | Different names, same concept |
| `services/flows/` | Part of `segment-store/` | Flows are saved segment configurations |

Both plans should be executed together for consistency.
