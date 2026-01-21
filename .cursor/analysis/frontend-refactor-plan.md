# Frontend Architecture Refactoring Plan

## Executive Summary

This plan aligns the frontend architecture with the backend's CRUD-based structure while eliminating duplication and maintaining the flow-designer's complex state management needs.

**Core Principle**: Services = Pure API wrappers (1:1 with backend). Orchestration lives in stores/hooks.

---

## Current State Analysis

### Backend API Structure (Source of Truth)

| Module | Controller | CRUD Endpoints | Special Endpoints |
|--------|------------|----------------|-------------------|
| **Routing** | `RoutingTableController` | `/routing/entries` CRUD | `/routing/lookup`, `/routing/history` |
| **Segments** | `SegmentStoreController` | `/segments` CRUD | `/segments/search`, `/segments/graph/:routingId` |
| **Flows** | `SegmentStoreController` | N/A (uses segments) | `/segments/flows/:routingId/*` |
| **Messages** | `MessageStoreController` | `/messages/stores` CRUD | `/messages/stores/:storeId/messages/*`, `/messages/fetch` |
| **ChangeSets** | `ChangeSetController` | `/changesets` CRUD | `/changesets/:id/publish` |

### Frontend Current State

```
frontend/src/
├── services/                    # Mixed: CRUD + orchestration
│   ├── routing.service.ts       ✅ Clean CRUD (148 lines)
│   ├── segments.service.ts      ✅ Clean CRUD (232 lines)
│   ├── flow.service.ts          ⚠️ Duplicates flow-api.ts
│   ├── messages.service.ts      ⚠️ Monolithic (510+ lines)
│   ├── changeset.service.ts     ✅ Clean CRUD
│   ├── configuration.service.ts ✅ Clean CRUD
│   ├── export-import.service.ts ⚠️ Separate, class-based
│   └── ...
├── features/flow-designer/
│   ├── api/
│   │   └── flow-api.ts          ⚠️ Duplicates flow.service.ts
│   └── stores/
│       └── flow-store.ts        ✅ Proper Zustand store
```

### Duplication Identified

| Function | flow-api.ts | flow.service.ts | Status |
|----------|-------------|-----------------|--------|
| getFlow/loadFlow | ✓ | ✓ | DUPLICATE |
| saveFlow | ✓ | ✓ | DUPLICATE |
| publishFlow | ✓ | ✓ | DUPLICATE |
| discardDraft | ✓ | ✓ | DUPLICATE |
| validateFlow | ✓ | ✓ | DUPLICATE |
| exportFlow | ✓ | ✓ | DUPLICATE |
| importFlow | ✓ | ✓ | DUPLICATE |
| previewImport/previewFlowImport | ✓ | ✓ | DUPLICATE |

---

## Target Architecture

### Design Principles

1. **Services = API Layer Only**
   - Pure HTTP wrappers matching backend endpoints 1:1
   - No business logic, no state
   - Type-safe with shared DTOs

2. **Stores = State + Orchestration**
   - Zustand stores for complex UI state (flow-designer)
   - Call services for API operations
   - Handle optimistic updates, caching

3. **Hooks = Data Fetching**
   - TanStack Query for simple CRUD pages
   - Wraps services for caching/invalidation

4. **Types = Shared**
   - Single source of truth for DTOs
   - Match backend types exactly

### Target Structure

```
frontend/src/
├── api/                           # NEW: Unified API layer
│   ├── client.ts                  # Axios instance (move from lib/)
│   ├── endpoints.ts               # All endpoint constants (merge existing)
│   └── types/                     # API response types
│       ├── routing.types.ts
│       ├── segments.types.ts
│       ├── flows.types.ts
│       ├── messages.types.ts
│       └── index.ts
│
├── services/                      # REFACTORED: Pure CRUD wrappers
│   ├── routing.service.ts         # ✅ Keep (already clean)
│   ├── segments.service.ts        # ✅ Keep (already clean)
│   ├── flows.service.ts           # MERGE flow-api.ts + flow.service.ts
│   ├── messages.service.ts        # SPLIT into smaller files
│   ├── message-stores.service.ts  # NEW: Store CRUD only
│   ├── changeset.service.ts       # ✅ Keep (already clean)
│   ├── configuration.service.ts   # ✅ Keep (already clean)
│   └── index.ts                   # Re-exports
│
├── features/flow-designer/
│   ├── api/                       # DELETE this folder entirely
│   └── stores/
│       └── flow-store.ts          # UPDATE: import from services/
│
└── hooks/                         # TanStack Query hooks (optional)
    ├── useRouting.ts
    ├── useSegments.ts
    ├── useFlows.ts
    └── useMessages.ts
```

---

## Detailed Refactoring Steps

### Phase 1: Consolidate Flow Services (Day 1)

**Goal**: Eliminate flow-api.ts ↔ flow.service.ts duplication

#### Step 1.1: Merge into `services/flows.service.ts`

Keep the cleaner implementation patterns. The result:

```typescript
// services/flows.service.ts

import apiClient from '@/lib/api-client';
import type { CompleteFlow, FlowValidation, ImportPreview } from '@/api/types/flows.types';

// ====================================================================
// FLOW CRUD OPERATIONS
// ====================================================================

/**
 * Load flow by routing ID
 * @param routingId - Routing identifier
 * @param changeSetId - Optional draft ID (omit for published)
 */
export async function getFlow(
  routingId: string,
  changeSetId?: string
): Promise<CompleteFlow> {
  const params = changeSetId ? { changeSetId } : {};
  const response = await apiClient.get<CompleteFlow>(
    `/segments/flows/${routingId}`,
    { params }
  );
  return response.data;
}

/**
 * Save flow (creates draft if none exists)
 */
export async function saveFlow(
  routingId: string,
  flow: CompleteFlow
): Promise<CompleteFlow> {
  const response = await apiClient.post<CompleteFlow>(
    `/segments/flows/${routingId}`,
    flow
  );
  return response.data;
}

/**
 * Save to specific draft changeset
 */
export async function saveToDraft(
  routingId: string,
  changeSetId: string,
  flow: CompleteFlow
): Promise<{ changeSetId: string; validation: FlowValidation }> {
  const response = await apiClient.put(
    `/segments/flows/${routingId}/drafts/${changeSetId}`,
    flow
  );
  return response.data;
}

/**
 * Validate flow without saving
 */
export async function validateFlow(
  routingId: string,
  flow: CompleteFlow
): Promise<FlowValidation> {
  const response = await apiClient.post<FlowValidation>(
    `/segments/flows/${routingId}/validate`,
    flow
  );
  return response.data;
}

// ====================================================================
// FLOW LIFECYCLE
// ====================================================================

/**
 * Publish draft to production
 */
export async function publishFlow(
  routingId: string,
  changeSetId: string
): Promise<void> {
  await apiClient.post(
    `/segments/flows/${routingId}/drafts/${changeSetId}/publish`
  );
}

/**
 * Discard draft changeset
 */
export async function discardDraft(
  routingId: string,
  changeSetId: string
): Promise<void> {
  await apiClient.delete(
    `/segments/flows/${routingId}/drafts/${changeSetId}`
  );
}

// ====================================================================
// FLOW IMPORT/EXPORT
// ====================================================================

export interface ExportOptions {
  changeSetId?: string;
  includeMessages?: boolean;
}

/**
 * Export flow as JSON
 */
export async function exportFlow(
  routingId: string,
  options?: ExportOptions
): Promise<CompleteFlow> {
  const response = await apiClient.get<CompleteFlow>(
    `/segments/flows/${routingId}/export`,
    { params: options }
  );
  return response.data;
}

export interface ImportOptions {
  overwrite?: boolean;
  validateOnly?: boolean;
}

/**
 * Import flow from JSON
 */
export async function importFlow(
  routingId: string,
  flowData: CompleteFlow,
  options?: ImportOptions
): Promise<void> {
  await apiClient.post(
    `/segments/flows/${routingId}/import`,
    { routingId, flowData },
    { params: options }
  );
}

/**
 * Preview import without executing
 */
export async function previewImport(
  routingId: string,
  flowData: CompleteFlow
): Promise<ImportPreview> {
  const response = await apiClient.post<ImportPreview>(
    `/segments/flows/${routingId}/import/preview`,
    { routingId, flowData }
  );
  return response.data;
}

// ====================================================================
// SEGMENT ORDERING
// ====================================================================

export interface SegmentOrder {
  segmentName: string;
  segmentOrder: number;
}

/**
 * Update segment order manually
 */
export async function updateSegmentOrder(
  routingId: string,
  segments: SegmentOrder[],
  changeSetId?: string
): Promise<{ updated: number }> {
  const response = await apiClient.put<{ updated: number }>(
    `/segments/flows/${routingId}/segments/order`,
    { segments },
    { params: changeSetId ? { changeSetId } : {} }
  );
  return response.data;
}

/**
 * Auto-compute order using BFS
 */
export async function autoOrderSegments(
  routingId: string,
  changeSetId?: string
): Promise<{ updated: number }> {
  const response = await apiClient.post<{ updated: number }>(
    `/segments/flows/${routingId}/auto-order`,
    {},
    { params: changeSetId ? { changeSetId } : {} }
  );
  return response.data;
}
```

#### Step 1.2: Update flow-store.ts imports

```typescript
// BEFORE
import flowApi from '../api/flow-api';

// AFTER
import * as flowsService from '@/services/flows.service';
```

#### Step 1.3: Update flow-store.ts usage

```typescript
// BEFORE
await flowApi.publishFlow({
  flowId: flow.routingId,
  version: flow.changeSetId,
});

// AFTER
await flowsService.publishFlow(flow.routingId, flow.changeSetId);
```

#### Step 1.4: Delete flow-api.ts

Remove `features/flow-designer/api/flow-api.ts` entirely.

---

### Phase 2: Split Messages Service (Day 2)

**Goal**: Break monolithic messages.service.ts into logical parts

#### Current: 510+ lines with everything mixed

```typescript
// messages.service.ts - BEFORE (510+ lines)
- Message store CRUD
- Message CRUD
- Version management
- Import/export
- Dictionaries (types, categories, voices)
- Runtime fetch
```

#### Target: 4 focused files

```typescript
// message-stores.service.ts (~100 lines)
export async function listMessageStores(...)
export async function getMessageStore(...)
export async function createMessageStore(...)
export async function updateMessageStore(...)
export async function deleteMessageStore(...)
export async function reactivateMessageStore(...)

// messages.service.ts (~150 lines)
export async function listMessages(...)
export async function getMessage(...)
export async function createMessage(...)
export async function updateMessage(...)
// Versioning
export async function listVersions(...)
export async function getVersion(...)
export async function publishMessage(...)
export async function rollbackMessage(...)
// Audit
export async function getAuditHistory(...)

// message-dictionaries.service.ts (~80 lines)
export async function listMessageCategories(...)
export async function listMessageTypes(...)
export async function listVoices(...)

// message-export.service.ts (~50 lines)
export async function exportMessages(...)
export async function importMessages(...)
export async function previewImport(...)

// messages-runtime.service.ts (~20 lines)
export async function fetchMessage(...) // Performance critical
```

---

### Phase 3: Centralize Endpoints (Day 2-3)

**Goal**: Single source of truth for all API endpoints

```typescript
// api/endpoints.ts

export const API_VERSION = '/api/v1';

// ====================================================================
// ROUTING
// ====================================================================
export const ROUTING = {
  LIST: '/routing',
  ENTRIES: '/routing/entries', 333
  ENTRY: (id: string) => `/routing/entries/${id}`,
  LOOKUP: '/routing/lookup',
  HISTORY: '/routing/history',
  HISTORY_VERSION: (versionId: string) => `/routing/history/${versionId}`,
  ROLLBACK: (versionId: string) => `/routing/rollback/${versionId}`,
} as const;

// ====================================================================
// SEGMENTS
// ====================================================================
export const SEGMENTS = {
  BASE: '/segments',
  BY_ID: (id: string) => `/segments/${id}`,
  SEARCH: '/segments/search',
  IMPORT: '/segments/import',
  EXPORT: (routingId: string) => `/segments/export/${routingId}`,
  GRAPH: (routingId: string) => `/segments/graph/${routingId}`,
  TYPES: '/segments/types/all',
  TYPE_KEYS: (typeName: string) => `/segments/types/${typeName}/keys`,
} as const;

// ====================================================================
// FLOWS (under segments controller)
// ====================================================================
export const FLOWS = {
  BASE: (routingId: string) => `/segments/flows/${routingId}`,
  DRAFT: (routingId: string, changeSetId: string) =>
    `/segments/flows/${routingId}/drafts/${changeSetId}`,
  PUBLISH: (routingId: string, changeSetId: string) =>
    `/segments/flows/${routingId}/drafts/${changeSetId}/publish`,
  VALIDATE: (routingId: string) => `/segments/flows/${routingId}/validate`,
  EXPORT: (routingId: string) => `/segments/flows/${routingId}/export`,
  IMPORT: (routingId: string) => `/segments/flows/${routingId}/import`,
  IMPORT_PREVIEW: (routingId: string) => `/segments/flows/${routingId}/import/preview`,
  ORDER: (routingId: string) => `/segments/flows/${routingId}/segments/order`,
  AUTO_ORDER: (routingId: string) => `/segments/flows/${routingId}/auto-order`,
} as const;

// ====================================================================
// MESSAGES
// ====================================================================
export const MESSAGES = {
  // Stores
  STORES: '/messages/stores',
  STORE: (storeId: number) => `/messages/stores/${storeId}`,
  STORE_EXPORT: '/messages/stores/export',
  STORE_IMPORT: '/messages/stores/import',
  STORE_IMPORT_PREVIEW: '/messages/stores/import/preview',

  // Messages within store
  MESSAGES: (storeId: number) => `/messages/stores/${storeId}/messages`,
  MESSAGE: (storeId: number, messageKey: string) =>
    `/messages/stores/${storeId}/messages/${encodeURIComponent(messageKey)}`,
  VERSIONS: (storeId: number, messageKey: string) =>
    `/messages/stores/${storeId}/messages/${encodeURIComponent(messageKey)}/versions`,
  VERSION: (storeId: number, messageKey: string, versionId: string) =>
    `/messages/stores/${storeId}/messages/${encodeURIComponent(messageKey)}/versions/${versionId}`,
  PUBLISH: (storeId: number, messageKey: string) =>
    `/messages/stores/${storeId}/messages/${encodeURIComponent(messageKey)}/publish`,
  ROLLBACK: (storeId: number, messageKey: string) =>
    `/messages/stores/${storeId}/messages/${encodeURIComponent(messageKey)}/rollback`,
  AUDIT: (storeId: number, messageKey: string) =>
    `/messages/stores/${storeId}/messages/${encodeURIComponent(messageKey)}/audit`,

  // Dictionaries
  CATEGORIES: '/messages/categories',
  TYPES: '/messages/types',
  VOICES: '/messages/voices',

  // Runtime
  FETCH: '/messages/fetch',
} as const;

// ====================================================================
// CHANGESETS
// ====================================================================
export const CHANGESETS = {
  BASE: '/changesets',
  BY_ID: (id: string) => `/changesets/${id}`,
  PUBLISH: (id: string) => `/changesets/${id}/publish`,
} as const;

// ====================================================================
// CONFIGURATION (dictionaries)
// ====================================================================
export const CONFIG = {
  LANGUAGES: '/languages',
  LANGUAGE: (code: string) => `/languages/${code}`,
  VOICES: '/voices',
  VOICE: (code: string) => `/voices/${code}`,
  KEY_TYPES: '/key-types',
  KEY_TYPE: (name: string) => `/key-types/${name}`,
  SEGMENT_TYPES: '/segment-types',
  SEGMENT_TYPE: (name: string) => `/segment-types/${name}`,
} as const;
```

---

### Phase 4: Align Export/Import Structures (Day 3)

**Goal**: Align frontend types with the new backend export/import structure

**See**: `.cursor/analysis/export-import-alignment-plan.md` for full details

**Key Changes**:

1. **Flow Export/Import** = Routing Header + Segments + Messages (full package)
2. **Segment Export/Import** = Segments + Messages only (no routing)

Both share the same `SegmentContent` structure:

```typescript
// api/types/export.types.ts

/**
 * Shared export metadata
 */
interface ExportMetadata {
  exportVersion: string;
  exportedAt: string;
  exportedBy?: string;
  sourceEnvironment?: string;
}

/**
 * Segment content - shared by Flow and Segment exports
 */
interface SegmentContent {
  segments: SegmentSnapshotDto[];
  messageManifest?: MessageManifestEntryDto[];
  messages?: MessageContentDto[];
}

/**
 * Routing header - only in Flow exports
 */
interface RoutingHeader {
  sourceId: string;
  routingId: string;
  companyProjectId: number;
  customerId?: string;
  projectId?: string;
  oktaGroup?: string;
  languageCode?: string;
  messageStoreId?: number;
  schedulerId?: number;
  initSegment: string;
  featureFlags?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

/**
 * Flow export - includes routing header
 */
interface FlowExportDto extends ExportMetadata {
  routing: RoutingHeader;
  content: SegmentContent;
  validation?: FlowValidationDto;
}

/**
 * Segment export - no routing header
 */
interface SegmentExportDto extends ExportMetadata {
  routingId: string;
  changeSetId?: string;
  content: SegmentContent;
  validation?: FlowValidationDto;
}
```

**Service Updates**:

```typescript
// services/flows.service.ts

export async function exportFlow(
  sourceId?: string,
  routingId?: string,
  options?: { includeMessages?: boolean }
): Promise<FlowExportDto> {
  const params = { sourceId, routingId, ...options };
  const response = await apiClient.get<FlowExportDto>('/flows/export', { params });
  return response.data;
}

export async function importFlow(dto: FlowImportDto): Promise<ImportResult> {
  const response = await apiClient.post<ImportResult>('/flows/import', dto);
  return response.data;
}

// services/segments.service.ts

export async function exportSegments(
  routingId: string,
  options?: { changeSetId?: string; includeMessages?: boolean }
): Promise<SegmentExportDto> {
  const response = await apiClient.get<SegmentExportDto>(
    `/segments/export/${routingId}`,
    { params: options }
  );
  return response.data;
}

export async function importSegments(dto: SegmentImportDto): Promise<ImportResult> {
  const response = await apiClient.post<ImportResult>('/segments/import', dto);
  return response.data;
}
```

---

### Phase 5: Update All Consumers (Day 4)

#### 5.1 Flow Designer

```typescript
// flow-store.ts
import * as flowsService from '@/services/flows.service';

// Update all method calls to use new service
saveFlow: async () => {
  const { flow } = get();
  if (!flow) throw new Error('No flow loaded');

  const result = await flowsService.saveFlow(flow.routingId, get().getFlowForSave());
  // ...
}
```

#### 5.2 Flow Query Hook

```typescript
// hooks/useFlowQuery.ts
import { getFlow, exportFlow } from '@/services/flows.service';

export function useFlowQuery(routingId: string, changeSetId?: string) {
  return useQuery({
    queryKey: ['flow', routingId, changeSetId],
    queryFn: () => getFlow(routingId, changeSetId),
  });
}
```

#### 5.3 Components using flow-api directly

Search for any direct imports:
```bash
# Find all files importing from flow-api
grep -r "from.*flow-api" frontend/src/
```

Update each to use `@/services/flows.service`.

---

## File Changes Summary

### Files to CREATE

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `api/endpoints.ts` | Centralized endpoints | ~150 |
| `api/types/flows.types.ts` | Flow DTOs | ~100 |
| `services/flows.service.ts` | Merged flow service | ~150 |
| `services/message-stores.service.ts` | Store CRUD only | ~100 |
| `services/message-dictionaries.service.ts` | Dictionaries | ~80 |
| `services/message-export.service.ts` | Import/export | ~50 |

### Files to DELETE

| File | Reason |
|------|--------|
| `features/flow-designer/api/flow-api.ts` | Merged into flows.service.ts |
| `services/flow.service.ts` | Merged into flows.service.ts |

### Files to MODIFY

| File | Changes |
|------|---------|
| `services/messages.service.ts` | Split, reduce to core message CRUD |
| `services/export-import.service.ts` | Use centralized endpoints |
| `features/flow-designer/stores/flow-store.ts` | Update imports |
| `features/flow-designer/hooks/useFlowQuery.ts` | Update imports |
| `constants/api.constants.ts` | Merge into api/endpoints.ts |

---

## Migration Checklist

### Pre-Migration

- [ ] Run all tests, ensure baseline passes
- [ ] Create git branch `refactor/frontend-architecture`
- [ ] Document current test coverage

### Phase 1: Flow Services

- [ ] Create `services/flows.service.ts`
- [ ] Update `flow-store.ts` imports
- [ ] Update `useFlowQuery.ts` imports
- [ ] Delete `features/flow-designer/api/flow-api.ts`
- [ ] Delete `services/flow.service.ts`
- [ ] Run tests
- [ ] Manual test flow-designer

### Phase 2: Messages

- [ ] Create `services/message-stores.service.ts`
- [ ] Create `services/message-dictionaries.service.ts`
- [ ] Create `services/message-export.service.ts`
- [ ] Update `services/messages.service.ts`
- [ ] Update all consumers
- [ ] Run tests

### Phase 3: Endpoints

- [ ] Create `api/endpoints.ts`
- [ ] Update all services to use endpoints
- [ ] Delete/merge `constants/api.constants.ts`
- [ ] Run tests

### Phase 4: Cleanup

- [ ] Remove dead imports
- [ ] Run linter
- [ ] Run type-check
- [ ] Run all tests
- [ ] Manual E2E testing

### Post-Migration

- [ ] Update documentation
- [ ] PR review
- [ ] Merge

---

## Why This Approach (95%+ Confidence)

### 1. Aligns with Backend

Backend has clear REST structure:
- `/routing/entries` → CRUD
- `/segments/flows/:routingId` → Flow operations
- `/messages/stores` → Store CRUD

Frontend services mirror this exactly.

### 2. Eliminates All Duplication

- flow-api.ts + flow.service.ts → flows.service.ts (7 functions consolidated)
- No more confusion about which to use

### 3. Maintains Type Safety

All services use typed DTOs that match backend response types exactly.

### 4. Preserves Flow Designer Complexity

The Zustand store (`flow-store.ts`) continues to handle:
- Complex state management
- Optimistic updates
- Graph transformations

Services remain simple API wrappers.

### 5. Minimal Risk

- No API changes (backend unchanged)
- Incremental migration possible
- Tests catch regressions
- Easy rollback (git revert)

### 6. Future-Proof

- Easy to add TanStack Query hooks later
- Easy to add new modules following same pattern
- Clear separation of concerns

---

## Not Recommended (and Why)

### Option A: Generic Service Factory

```typescript
// Too abstract, loses type safety
const routingService = createCrudService<RoutingEntry>('/routing/entries');
```

**Why not**: Loses IDE autocomplete, harder to debug, over-engineered for our needs.

### Option B: Class-Based Services

```typescript
class FlowService {
  async getFlow(...) {}
}
export default new FlowService();
```

**Why not**: Adds unnecessary complexity. Functions are simpler and tree-shake better.

### Option C: Keep Both flow-api.ts and flow.service.ts

**Why not**: Maintenance nightmare, bugs need to be fixed in two places, confusing for developers.

---

## Conclusion

This plan:

1. **Eliminates 7 duplicate functions** (flow-api.ts ↔ flow.service.ts)
2. **Splits 510-line monolith** (messages.service.ts) into 4 focused files
3. **Centralizes endpoints** in single source of truth
4. **Aligns frontend with backend** REST structure
5. **Preserves flow-designer** state management complexity
6. **Maintains type safety** throughout
7. **Can be done incrementally** with low risk

Estimated effort: 3-4 days for complete migration.
