# Export/Import Structure Alignment Plan

## Executive Summary

Define coherent, symmetric export/import structures where:
- **Flow Export/Import** = Routing Header + Segments + Messages (full deployment package)
- **Segment Export/Import** = Segments + Messages only (content without routing)

Both share the same content structure, differing only in whether routing metadata is included.

---

## Core Concept

```
┌─────────────────────────────────────────────────────────────┐
│                     FLOW EXPORT                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ROUTING HEADER (from rt_RoutingTable)                │  │
│  │  sourceId, routingId, companyProjectId, languageCode, │  │
│  │  messageStoreId, schedulerId, initSegment,            │  │
│  │  featureFlags, config                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  SEGMENT CONTENT (shared with Segment Export)         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  segments: SegmentSnapshotDto[]                 │  │  │
│  │  │  messageManifest?: MessageManifestEntryDto[]    │  │  │
│  │  │  messages?: MessageContentDto[]                 │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SEGMENT EXPORT                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  SEGMENT CONTENT ONLY (no routing header)             │  │
│  │  routingId (reference only, not full routing object)  │  │
│  │  segments: SegmentSnapshotDto[]                       │  │
│  │  messageManifest?: MessageManifestEntryDto[]          │  │
│  │  messages?: MessageContentDto[]                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Structures

### 1. Base Export Metadata (shared)

```typescript
/**
 * Standard export metadata for all export types
 */
interface ExportMetadata {
  exportVersion: string;      // Schema version "3.0.0"
  exportedAt: string;         // ISO 8601 timestamp
  exportedBy?: string;        // User who exported
  sourceEnvironment?: string; // "dev" | "acc" | "prd"
}
```

### 2. Segment Content (shared between Flow and Segment exports)

```typescript
/**
 * Segment content - shared by both Flow and Segment exports
 */
interface SegmentContent {
  // Segments
  segments: SegmentSnapshotDto[];

  // Messages (Solution 3 Hybrid)
  messageManifest?: MessageManifestEntryDto[];  // Keys + metadata (always if messageStoreId linked)
  messages?: MessageContentDto[];               // Full content (only if includeMessages=true)
}
```

### 3. Routing Header (Flow export only)

```typescript
/**
 * Routing header - from rt_RoutingTable
 * Only included in Flow exports, not Segment exports
 */
interface RoutingHeader {
  // Primary identifiers
  sourceId: string;           // Phone number or logical identifier (unique)
  routingId: string;          // Routing identifier

  // Company/Project
  companyProjectId: number;
  customerId?: string;        // Derived from DicCompanyProject
  projectId?: string;         // Derived from DicCompanyProject
  oktaGroup?: string;         // Derived from DicCompanyProject

  // Configuration
  languageCode?: string;      // Default language (BCP47)
  messageStoreId?: number;    // Linked message store
  schedulerId?: number;       // External scheduler ID
  initSegment: string;        // Entry point segment name

  // Feature config
  featureFlags?: Record<string, unknown>;
  config?: Record<string, unknown>;
}
```

### 4. Flow Export DTO (Full Package)

```typescript
/**
 * Complete flow export - includes routing header + segment content
 * Use case: Export entire flow for deployment to another environment
 */
interface FlowExportDto extends ExportMetadata {
  // Routing header (from rt_RoutingTable)
  routing: RoutingHeader;

  // Segment content
  content: SegmentContent;

  // Validation result
  validation?: FlowValidationDto;
}
```

### 5. Segment Export DTO (Content Only)

```typescript
/**
 * Segment-only export - no routing header
 * Use case: Export segments for backup/copy within same routing
 */
interface SegmentExportDto extends ExportMetadata {
  // Reference only (routing must already exist)
  routingId: string;
  changeSetId?: string;

  // Segment content (same structure as Flow export)
  content: SegmentContent;

  // Validation result
  validation?: FlowValidationDto;
}
```

---

## API Endpoints

### Flow Export/Import

| Operation | Endpoint | Input | Output |
|-----------|----------|-------|--------|
| Export by sourceId | `GET /flows/export?sourceId=xxx` | sourceId | FlowExportDto |
| Export by routingId | `GET /flows/export?routingId=xxx` | routingId | FlowExportDto |
| Import | `POST /flows/import` | FlowImportDto | ImportResult |
| Preview Import | `POST /flows/import/preview` | FlowImportDto | ImportPreview |

### Segment Export/Import

| Operation | Endpoint | Input | Output |
|-----------|----------|-------|--------|
| Export | `GET /segments/export/:routingId` | routingId, changeSetId? | SegmentExportDto |
| Import | `POST /segments/import` | SegmentImportDto | ImportResult |
| Preview Import | `POST /segments/import/preview` | SegmentImportDto | ImportPreview |

---

## Detailed DTOs

### Flow Import DTO

```typescript
/**
 * Flow import request - creates/updates routing + segments + messages
 */
interface FlowImportDto {
  // Import options
  overwrite?: boolean;        // Replace existing if sourceId/routingId exists
  validateOnly?: boolean;     // Dry-run, don't persist
  createMissing?: boolean;    // Create routing if doesn't exist (default: true)

  // The exported data (same structure as export)
  data: FlowExportDto;

  // Audit
  importedBy?: string;
}
```

### Segment Import DTO

```typescript
/**
 * Segment import request - routing must already exist
 */
interface SegmentImportDto {
  // Target routing (must exist)
  routingId: string;
  changeSetId?: string;       // Import as draft

  // Import options
  overwrite?: boolean;        // Replace existing segments
  validateOnly?: boolean;     // Dry-run

  // The exported data (same structure as export)
  data: SegmentExportDto;

  // Audit
  importedBy?: string;
}
```

---

## Export Process

### Flow Export (by sourceId)

```
1. Resolve sourceId → RoutingTable entry
2. Build RoutingHeader from RoutingTable + DicCompanyProject
3. Get segments for routingId (+ changeSetId if specified)
4. Get messageManifest from MessageStore (if messageStoreId linked)
5. Get messages content (if includeMessages=true)
6. Validate flow structure
7. Return FlowExportDto
```

```typescript
// Pseudo-code
async function exportFlowBySourceId(sourceId: string, options: ExportOptions): Promise<FlowExportDto> {
  // 1. Resolve routing
  const routing = await prisma.routingTable.findUnique({
    where: { sourceId },
    include: { companyProject: true, messageStore: true }
  });

  // 2. Build routing header
  const routingHeader: RoutingHeader = {
    sourceId: routing.sourceId,
    routingId: routing.routingId,
    companyProjectId: routing.companyProjectId,
    customerId: routing.companyProject.customerId,
    projectId: routing.companyProject.projectId,
    oktaGroup: routing.companyProject.oktaGroup,
    languageCode: routing.languageCode,
    messageStoreId: routing.messageStoreId,
    schedulerId: routing.schedulerId,
    initSegment: routing.initSegment,
    featureFlags: JSON.parse(routing.featureFlags || '{}'),
    config: JSON.parse(routing.config || '{}'),
  };

  // 3. Get segments
  const segments = await getSegmentsForRouting(routing.routingId, options.changeSetId);

  // 4. Get message manifest
  const messageManifest = routing.messageStoreId
    ? await getMessageManifest(routing.messageStoreId, segments)
    : undefined;

  // 5. Get message content (optional)
  const messages = options.includeMessages && routing.messageStoreId
    ? await getMessageContent(routing.messageStoreId, messageManifest)
    : undefined;

  // 6. Validate
  const validation = await validateFlow(routingHeader, segments);

  // 7. Build export
  return {
    exportVersion: '3.0.0',
    exportedAt: new Date().toISOString(),
    exportedBy: options.exportedBy,
    sourceEnvironment: 'dev',
    routing: routingHeader,
    content: { segments, messageManifest, messages },
    validation,
  };
}
```

### Flow Export (by routingId)

Same as above, but lookup by routingId instead of sourceId:

```typescript
async function exportFlowByRoutingId(routingId: string, options: ExportOptions): Promise<FlowExportDto> {
  // Lookup by routingId (may have multiple entries, use first)
  const routing = await prisma.routingTable.findFirst({
    where: { routingId, isActive: true },
    include: { companyProject: true, messageStore: true }
  });

  // Rest is same as exportFlowBySourceId...
}
```

### Segment Export (by routingId)

```typescript
async function exportSegments(routingId: string, options: ExportOptions): Promise<SegmentExportDto> {
  // 1. Verify routing exists (but don't include full header)
  const routing = await prisma.routingTable.findFirst({
    where: { routingId, isActive: true },
    select: { messageStoreId: true }
  });

  if (!routing) throw new NotFoundException(`Routing ${routingId} not found`);

  // 2. Get segments
  const segments = await getSegmentsForRouting(routingId, options.changeSetId);

  // 3. Get message manifest
  const messageManifest = routing.messageStoreId
    ? await getMessageManifest(routing.messageStoreId, segments)
    : undefined;

  // 4. Get message content (optional)
  const messages = options.includeMessages && routing.messageStoreId
    ? await getMessageContent(routing.messageStoreId, messageManifest)
    : undefined;

  // 5. Validate
  const validation = await validateSegments(routingId, segments);

  // 6. Build export
  return {
    exportVersion: '3.0.0',
    exportedAt: new Date().toISOString(),
    exportedBy: options.exportedBy,
    sourceEnvironment: 'dev',
    routingId,
    changeSetId: options.changeSetId,
    content: { segments, messageManifest, messages },
    validation,
  };
}
```

---

## Import Process

### Flow Import

```
1. Validate import data structure
2. Check if sourceId/routingId exists
   - If exists and overwrite=false: error
   - If exists and overwrite=true: update routing, replace segments
   - If not exists and createMissing=true: create routing + segments
3. Create/Update RoutingTable entry
4. Create/Update segments in draft (changeSetId)
5. Create/Update messages (if included)
6. Validate imported flow
7. Return ImportResult
```

```typescript
async function importFlow(dto: FlowImportDto): Promise<ImportResult> {
  const { data, overwrite, validateOnly, createMissing, importedBy } = dto;

  // 1. Validate structure
  const validation = await validateFlowExportData(data);
  if (!validation.isValid) {
    throw new BadRequestException(validation.errors);
  }

  // 2. Check existence
  const existing = await prisma.routingTable.findUnique({
    where: { sourceId: data.routing.sourceId }
  });

  if (existing && !overwrite) {
    throw new ConflictException(`Routing with sourceId ${data.routing.sourceId} already exists`);
  }

  if (!existing && !createMissing) {
    throw new BadRequestException(`Routing not found and createMissing=false`);
  }

  if (validateOnly) {
    return { validated: true, wouldCreate: !existing, wouldUpdate: !!existing };
  }

  // 3. Transaction: create/update routing + segments + messages
  return prisma.$transaction(async (tx) => {
    // Create or update routing
    const routing = await tx.routingTable.upsert({
      where: { sourceId: data.routing.sourceId },
      create: { ...data.routing, createdBy: importedBy },
      update: { ...data.routing, updatedBy: importedBy },
    });

    // Create draft changeset
    const changeSet = await tx.changeSet.create({
      data: { routingId: routing.routingId, status: 'DRAFT', createdBy: importedBy }
    });

    // Import segments
    const segmentResult = await importSegmentsToChangeSet(
      tx,
      routing.routingId,
      changeSet.changeSetId,
      data.content.segments,
      overwrite
    );

    // Import messages (if included)
    const messageResult = data.content.messages
      ? await importMessages(tx, data.routing.messageStoreId, data.content.messages)
      : undefined;

    return {
      success: true,
      routingId: routing.routingId,
      changeSetId: changeSet.changeSetId,
      segmentsCreated: segmentResult.created,
      segmentsUpdated: segmentResult.updated,
      messagesImported: messageResult?.count || 0,
    };
  });
}
```

### Segment Import

```typescript
async function importSegments(dto: SegmentImportDto): Promise<ImportResult> {
  const { routingId, changeSetId, data, overwrite, validateOnly, importedBy } = dto;

  // 1. Verify routing exists
  const routing = await prisma.routingTable.findFirst({
    where: { routingId, isActive: true }
  });

  if (!routing) {
    throw new NotFoundException(`Routing ${routingId} not found`);
  }

  // 2. Validate structure
  const validation = await validateSegmentExportData(data);
  if (!validation.isValid) {
    throw new BadRequestException(validation.errors);
  }

  if (validateOnly) {
    return { validated: true };
  }

  // 3. Transaction: import segments + messages
  return prisma.$transaction(async (tx) => {
    // Use existing or create new changeset
    const targetChangeSetId = changeSetId || await createDraftChangeSet(tx, routingId, importedBy);

    // Import segments
    const segmentResult = await importSegmentsToChangeSet(
      tx,
      routingId,
      targetChangeSetId,
      data.content.segments,
      overwrite
    );

    // Import messages (if included)
    const messageResult = data.content.messages && routing.messageStoreId
      ? await importMessages(tx, routing.messageStoreId, data.content.messages)
      : undefined;

    return {
      success: true,
      routingId,
      changeSetId: targetChangeSetId,
      segmentsCreated: segmentResult.created,
      segmentsUpdated: segmentResult.updated,
      messagesImported: messageResult?.count || 0,
    };
  });
}
```

---

## Example Export Files

### Flow Export (full)

```json
{
  "exportVersion": "3.0.0",
  "exportedAt": "2026-01-15T10:30:00Z",
  "exportedBy": "admin@example.com",
  "sourceEnvironment": "dev",

  "routing": {
    "sourceId": "+3212345678",
    "routingId": "EEBL-ENERGYLINE-MAIN",
    "companyProjectId": 1,
    "customerId": "EEBL",
    "projectId": "ENERGYLINE",
    "oktaGroup": "okta-eebl-flow",
    "languageCode": "nl-BE",
    "messageStoreId": 5,
    "schedulerId": 159,
    "initSegment": "get_language",
    "featureFlags": { "enableRecording": true },
    "config": { "timeout": 30 }
  },

  "content": {
    "segments": [
      {
        "segmentName": "get_language",
        "segmentType": "language",
        "displayName": "Language Selection",
        "config": [
          { "key": "messageKey", "value": "LANG_SELECT_PROMPT" },
          { "key": "maxAttempts", "value": 3 }
        ],
        "transitions": [
          { "resultName": "nl-BE", "outcome": { "nextSegment": "main_menu" } },
          { "resultName": "fr-BE", "outcome": { "nextSegment": "main_menu" } },
          { "resultName": "default", "isDefault": true, "outcome": { "nextSegment": "disconnect" } }
        ],
        "hooks": {},
        "segmentOrder": 1
      },
      {
        "segmentName": "main_menu",
        "segmentType": "menu",
        "displayName": "Main Menu",
        "config": [
          { "key": "messageKey", "value": "MAIN_MENU_PROMPT" }
        ],
        "transitions": [
          { "resultName": "1", "outcome": { "nextSegment": "billing" } },
          { "resultName": "2", "outcome": { "nextSegment": "support" } }
        ],
        "hooks": {},
        "segmentOrder": 2
      }
    ],

    "messageManifest": [
      {
        "messageKey": "LANG_SELECT_PROMPT",
        "displayName": "Language Selection",
        "typeCode": "tts",
        "languages": ["nl-BE", "fr-BE"],
        "isReferenced": true
      },
      {
        "messageKey": "MAIN_MENU_PROMPT",
        "displayName": "Main Menu",
        "typeCode": "tts",
        "languages": ["nl-BE", "fr-BE"],
        "isReferenced": true
      }
    ],

    "messages": [
      {
        "messageKey": "LANG_SELECT_PROMPT",
        "typeCode": "tts",
        "languages": {
          "nl-BE": { "content": "Selecteer uw taal. Druk 1 voor Nederlands.", "typeSettings": {} },
          "fr-BE": { "content": "Sélectionnez votre langue. Appuyez 1 pour le français.", "typeSettings": {} }
        }
      }
    ]
  },

  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": []
  }
}
```

### Segment Export (content only)

```json
{
  "exportVersion": "3.0.0",
  "exportedAt": "2026-01-15T10:30:00Z",
  "exportedBy": "admin@example.com",
  "sourceEnvironment": "dev",

  "routingId": "EEBL-ENERGYLINE-MAIN",
  "changeSetId": null,

  "content": {
    "segments": [
      {
        "segmentName": "get_language",
        "segmentType": "language",
        "displayName": "Language Selection",
        "config": [
          { "key": "messageKey", "value": "LANG_SELECT_PROMPT" }
        ],
        "transitions": [
          { "resultName": "nl-BE", "outcome": { "nextSegment": "main_menu" } }
        ],
        "hooks": {},
        "segmentOrder": 1
      }
    ],

    "messageManifest": [
      {
        "messageKey": "LANG_SELECT_PROMPT",
        "displayName": "Language Selection",
        "typeCode": "tts",
        "languages": ["nl-BE", "fr-BE"],
        "isReferenced": true
      }
    ]
  },

  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": []
  }
}
```

---

## Comparison: Flow vs Segment Export

| Aspect | Flow Export | Segment Export |
|--------|-------------|----------------|
| **Includes routing header** | YES | NO |
| **Lookup by** | sourceId OR routingId | routingId only |
| **Can create new routing** | YES (on import) | NO (routing must exist) |
| **Segment content** | Same | Same |
| **Message manifest** | Same | Same |
| **Message content** | Same (optional) | Same (optional) |
| **Use case** | Deploy to new environment | Backup/copy segments |

---

## Migration from Current State

### Backend Changes

1. **Create new DTOs**:
   - `FlowExportDto` (with routing header)
   - `SegmentExportDto` (without routing header)
   - `SegmentContent` (shared)
   - `RoutingHeader`

2. **Update FlowExportService**:
   - Include full routing header
   - Restructure to use `routing` + `content` pattern

3. **Create SegmentExportService** (or update existing):
   - Use same `SegmentContent` structure as flows
   - Add export metadata wrapper

4. **Update controllers**:
   - `GET /flows/export` - returns FlowExportDto
   - `GET /segments/export/:routingId` - returns SegmentExportDto

### Frontend Changes

1. **Update types**:
   - Match backend DTOs exactly
   - Remove duplicates between `flow.types.ts` and `api-types.ts`

2. **Update services**:
   - `flows.service.ts` - use new export/import DTOs
   - `segments.service.ts` - use new export/import DTOs

3. **Update flow-designer**:
   - ExportDialog - use new FlowExportDto
   - ImportDialog - use new FlowImportDto

---

## File Changes Summary

### Backend Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `shared/export-import/dto/export-base.dto.ts` | CREATE | ExportMetadata, SegmentContent |
| `segment-store/dto/flow-export.dto.ts` | MODIFY | FlowExportDto with routing header |
| `segment-store/dto/segment-export.dto.ts` | CREATE | SegmentExportDto without routing |
| `segment-store/services/flow-export.service.ts` | MODIFY | Include routing header |
| `segment-store/services/segment-export.service.ts` | CREATE | New service for segment-only export |
| `segment-store/segment-store.controller.ts` | MODIFY | Update export endpoints |

### Frontend Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `api/types/export.types.ts` | CREATE | Shared export types |
| `types/api-types.ts` | MODIFY | Remove duplicates, align with backend |
| `features/flow-designer/types/flow.types.ts` | MODIFY | Align with backend |
| `services/flows.service.ts` | MODIFY | Use new export/import DTOs |
| `services/segments.service.ts` | MODIFY | Use new export/import DTOs |

---

## Implementation Order

### Phase 1: Backend DTOs (Day 1)
1. Create `ExportMetadata`, `SegmentContent`, `RoutingHeader` base types
2. Create `FlowExportDto` extending base with routing
3. Create `SegmentExportDto` extending base without routing
4. Create corresponding import DTOs

### Phase 2: Backend Services (Day 2)
1. Update `FlowExportService` to include routing header
2. Create `SegmentExportService` for segment-only export
3. Update import services for new structure

### Phase 3: Backend Controllers (Day 2)
1. Update export endpoints to return new DTOs
2. Update import endpoints to accept new DTOs
3. Add `sourceId` parameter to flow export

### Phase 4: Frontend Types (Day 3)
1. Create shared export types matching backend
2. Remove duplicate types
3. Update existing type references

### Phase 5: Frontend Services (Day 3)
1. Update flows.service.ts for new export/import
2. Update segments.service.ts for new export/import

### Phase 6: Frontend Components (Day 4)
1. Update ExportDialog for new structure
2. Update ImportDialog for new structure
3. Test end-to-end

---

## Success Criteria

1. **Symmetric structures**: Export file can be imported without modification
2. **Flow export includes routing**: Full deployment package
3. **Segment export excludes routing**: Content-only backup
4. **Shared content structure**: Same `SegmentContent` used by both
5. **Type safety**: Frontend types match backend DTOs exactly
6. **Backward compatibility**: Old exports can still be imported (with migration)
