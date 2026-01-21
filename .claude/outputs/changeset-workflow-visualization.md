# ChangeSet Workflow Visualization
## Draft → Publish → ChangeSetId Flow

This document visualizes the correct usage of draft, publish, and changeSetId based on the backend implementation.

---

## 1. Data Model & State Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                         ChangeSet Entity                        │
├─────────────────────────────────────────────────────────────────┤
│ changeSetId: string (UUID)                                      │
│ routingId: string                                               │
│ customerId: string      ← From RoutingTable.companyProject      │
│ projectId: string       ← From RoutingTable.companyProject      │
│ status: 'draft' | 'validated' | 'published' | 'discarded'      │
│ versionName?: string                                            │
│ description?: string                                            │
│ createdBy?: string                                              │
│ dateCreated: DateTime                                           │
│ datePublished?: DateTime                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Segment Entity                          │
├─────────────────────────────────────────────────────────────────┤
│ segmentId: string (UUID)                                        │
│ routingId: string                                               │
│ segmentName: string                                             │
│ changeSetId?: string    ← NULL = published, UUID = draft       │
│ config: ConfigItem[]                                            │
│ transitions: Transition[]                                       │
│ ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

**Key Insight:**
- `changeSetId = NULL` → **Published/Active** segment
- `changeSetId = <UUID>` → **Draft** segment (part of changeset)

---

## 2. Complete Workflow: Load → Edit → Draft → Publish

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        STEP 1: Load Published Flow                       │
└──────────────────────────────────────────────────────────────────────────┘

User navigates to: /flows/ENGIE-ENERGYLINE-MAIN

┌─────────────┐
│   Browser   │  GET /segments/flows/ENGIE-ENERGYLINE-MAIN
│             │  (no changeSetId query param)
└──────┬──────┘
       │
       v
┌─────────────────────────────────────────────────────────────────┐
│                         Backend Response                        │
├─────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   routingId: "ENGIE-ENERGYLINE-MAIN",                          │
│   customerId: "ENGIE",          ← From RoutingTable relation   │
│   projectId: "ENERGYLINE",      ← From RoutingTable relation   │
│   companyProjectId: 42,                                         │
│   changeSetId: null,            ← NULL = published version     │
│   initSegment: "get_language",                                  │
│   segments: [                                                   │
│     {                                                           │
│       segmentName: "get_language",                              │
│       // All segments have changeSetId: null (published)       │
│     },                                                          │
│     ...                                                         │
│   ]                                                             │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘

State in FlowStore:
✓ flow.routingId = "ENGIE-ENERGYLINE-MAIN"
✓ flow.customerId = "ENGIE"
✓ flow.projectId = "ENERGYLINE"
✓ flow.changeSetId = null


┌──────────────────────────────────────────────────────────────────────────┐
│                   STEP 2: User Clicks "New Draft"                        │
└──────────────────────────────────────────────────────────────────────────┘

User clicks "New Draft" button in toolbar

┌─────────────┐
│ FlowToolbar │  Opens CreateDraftDialog with props:
│             │  • routingId: "ENGIE-ENERGYLINE-MAIN"
└──────┬──────┘  • customerId: "ENGIE"         ← from flow.customerId
       │         • projectId: "ENERGYLINE"      ← from flow.projectId
       │         • initSegment: "get_language"  ← from flow.initSegment
       v
┌─────────────────────────┐
│  CreateDraftDialog      │
│                         │
│  User enters:           │
│  - versionName: "Q1"    │  (optional)
│  - description: "..."   │  (optional)
│                         │
│  [Cancel] [Create Draft]│
└──────────┬──────────────┘
           │
           │  POST /routing/changesets
           v
┌─────────────────────────────────────────────────────────────────┐
│                      Request Body (DTO)                         │
├─────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   routingId: "ENGIE-ENERGYLINE-MAIN",  ✓ From flow             │
│   customerId: "ENGIE",                 ✓ From flow             │
│   projectId: "ENERGYLINE",             ✓ From flow             │
│   versionName: "Q1 Update",            ✓ User input (optional) │
│   description: "Updated menu",         ✓ User input (optional) │
│   createdBy: "user@engie.com"          ✓ From AuthContext      │
│ }                                                               │
│                                                                 │
│ ❌ WRONG (current implementation):                              │
│ {                                                               │
│   routingId: "ENGIE-ENERGYLINE-MAIN",                          │
│   initSegment: "start",           ← Wrong! Not in DTO          │
│   createdBy: "user@example.com"   ← Wrong! Hardcoded           │
│ }                                                               │
│ Missing: customerId, projectId                                  │
└─────────────────────────────────────────────────────────────────┘

Backend Processing (changeset.service.ts):
1. Looks up routingId in RoutingTable
2. Retrieves customerId/projectId from RoutingTable.companyProject
3. Validates DTO values match database values
4. Creates ChangeSet with status='draft'

┌─────────────────────────────────────────────────────────────────┐
│                      Backend Response                           │
├─────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   changeSetId: "abc-123-def-456",      ← NEW UUID              │
│   routingId: "ENGIE-ENERGYLINE-MAIN",                          │
│   customerId: "ENGIE",                                          │
│   projectId: "ENERGYLINE",                                      │
│   status: "draft",                                              │
│   versionName: "Q1 Update",                                     │
│   description: "Updated menu",                                  │
│   dateCreated: "2026-01-14T20:30:00Z",                          │
│   createdBy: "user@engie.com"                                   │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                  STEP 3: Load Draft Version                              │
└──────────────────────────────────────────────────────────────────────────┘

After draft creation, FlowToolbar loads the draft version:

GET /segments/flows/ENGIE-ENERGYLINE-MAIN?changeSetId=abc-123-def-456

┌─────────────────────────────────────────────────────────────────┐
│                      Backend Response                           │
├─────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   routingId: "ENGIE-ENERGYLINE-MAIN",                          │
│   customerId: "ENGIE",                                          │
│   projectId: "ENERGYLINE",                                      │
│   changeSetId: "abc-123-def-456",  ← Draft version             │
│   initSegment: "get_language",                                  │
│   segments: [                                                   │
│     // Initially, segments are COPIED from published           │
│     // All segments now have changeSetId: "abc-123-def-456"    │
│   ]                                                             │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘

State in FlowStore:
✓ flow.routingId = "ENGIE-ENERGYLINE-MAIN"
✓ flow.customerId = "ENGIE"
✓ flow.projectId = "ENERGYLINE"
✓ flow.changeSetId = "abc-123-def-456"  ← Now editing draft


┌──────────────────────────────────────────────────────────────────────────┐
│                  STEP 4: Edit & Save Draft                               │
└──────────────────────────────────────────────────────────────────────────┘

User edits segments in the flow designer:
- Add segments
- Update configurations
- Modify transitions

Each save:
POST /segments/flows/ENGIE-ENERGYLINE-MAIN
{
  routingId: "ENGIE-ENERGYLINE-MAIN",
  changeSetId: "abc-123-def-456",  ← Draft identifier
  segments: [ ... ]                 ← Updated segments
}

Backend:
- Updates segments with changeSetId: "abc-123-def-456"
- These segments are DRAFTS (not visible to production)


┌──────────────────────────────────────────────────────────────────────────┐
│              STEP 5: Version Selector (Switch Versions)                  │
└──────────────────────────────────────────────────────────────────────────┘

VersionSelector shows:
┌──────────────────────┐
│ 📦 Published Version │  ← changeSetId: null
│ ✏️ Draft - Q1 Update │  ← changeSetId: "abc-123-def-456"
└──────────────────────┘

User can switch between:
- Published: GET /segments/flows/ENGIE-ENERGYLINE-MAIN
- Draft: GET /segments/flows/ENGIE-ENERGYLINE-MAIN?changeSetId=abc-123-def-456


┌──────────────────────────────────────────────────────────────────────────┐
│                    STEP 6: Publish Draft                                 │
└──────────────────────────────────────────────────────────────────────────┘

User clicks "Publish" button

POST /segments/flows/ENGIE-ENERGYLINE-MAIN/drafts/abc-123-def-456/publish

Backend Process:
1. Sets ChangeSet.status = 'published'
2. For all segments with changeSetId: "abc-123-def-456":
   → Sets changeSetId = NULL (making them active/published)
3. Old published segments are archived or deleted
4. Creates version snapshot in version history

Result:
- Draft segments become published (changeSetId: null)
- ChangeSet record remains with status: 'published' (audit trail)
- Flow now has no active draft


┌──────────────────────────────────────────────────────────────────────────┐
│                 STEP 7: Discard Draft (Alternative)                      │
└──────────────────────────────────────────────────────────────────────────┘

If user clicks "Discard" instead:

DELETE /segments/flows/ENGIE-ENERGYLINE-MAIN/drafts/abc-123-def-456

Backend Process:
1. Sets ChangeSet.status = 'discarded'
2. Hard deletes all segments with changeSetId: "abc-123-def-456"
3. Published segments remain unchanged

Result:
- Draft changes are lost
- Published version remains active
```

---

## 3. State Diagram: ChangeSetId Values

```
                    ┌─────────────────────────────────────┐
                    │    PUBLISHED STATE                  │
                    │                                     │
                    │  Flow: { changeSetId: null }        │
                    │  Segments: [ changeSetId: null ]    │
                    │                                     │
                    │  ✓ Active in production             │
                    │  ✓ Visible to end users             │
                    └──────────┬──────────────────────────┘
                               │
                               │ User clicks "New Draft"
                               │ POST /routing/changesets
                               v
                    ┌─────────────────────────────────────┐
                    │    DRAFT CREATED                    │
                    │                                     │
                    │  ChangeSet created:                 │
                    │  { changeSetId: "abc-123",          │
                    │    status: "draft" }                │
                    │                                     │
                    │  Segments copied:                   │
                    │  [ changeSetId: "abc-123" ]         │
                    └──────────┬──────────────────────────┘
                               │
                               │ User loads draft
                               │ GET /flows/X?changeSetId=abc-123
                               v
                    ┌─────────────────────────────────────┐
                    │    DRAFT STATE                      │
                    │                                     │
                    │  Flow: { changeSetId: "abc-123" }   │
                    │  Segments: [ changeSetId: "abc-123"]│
                    │                                     │
                    │  ✓ Editable                         │
                    │  ✓ NOT visible in production        │
                    │  ✓ Can switch to published view     │
                    └──────┬───────────────────┬──────────┘
                           │                   │
                 Publish   │                   │  Discard
                           v                   v
           ┌──────────────────────┐   ┌─────────────────────┐
           │  PUBLISH PROCESS     │   │  DISCARD PROCESS    │
           │                      │   │                     │
           │  Set changeSetId     │   │  Delete segments    │
           │  = null on segments  │   │  with changeSetId   │
           │                      │   │                     │
           │  ChangeSet status    │   │  ChangeSet status   │
           │  = 'published'       │   │  = 'discarded'      │
           └──────────┬───────────┘   └─────────────────────┘
                      │
                      v
           ┌─────────────────────────────────────┐
           │    PUBLISHED STATE                  │
           │                                     │
           │  Flow: { changeSetId: null }        │
           │  Segments: [ changeSetId: null ]    │
           │                                     │
           │  ✓ Draft changes now active         │
           └─────────────────────────────────────┘
```

---

## 4. Frontend Component Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         FlowDesignerPage                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  URL: /flows/:routingId/:changeSetId?                          │
│                                                                 │
│  useFlowQuery({ flowId, version: changeSetId })                │
│       │                                                         │
│       └──> Loads flow into FlowStore                            │
│                                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────────┐
│                           FlowStore                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  flow: CompleteFlow = {                                         │
│    routingId: "ENGIE-ENERGYLINE-MAIN"    ← From backend        │
│    customerId: "ENGIE"                   ← From backend ✓      │
│    projectId: "ENERGYLINE"               ← From backend ✓      │
│    changeSetId: "abc-123" | null         ← From backend        │
│    initSegment: "get_language"           ← From backend        │
│    segments: [ ... ]                                            │
│  }                                                              │
│                                                                 │
│  Actions:                                                       │
│  • loadFlow(flow)         ← Set from API response              │
│  • saveFlow()             ← POST with current changeSetId      │
│  • publishFlow()          ← POST .../publish                   │
│  • discardDraft()         ← DELETE draft                       │
│                                                                 │
└────────┬───────────────────┬────────────────────┬──────────────┘
         │                   │                    │
         v                   v                    v
┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  FlowToolbar   │  │ VersionSelector  │  │ PropertiesPanel  │
├────────────────┤  ├──────────────────┤  ├──────────────────┤
│                │  │                  │  │                  │
│ Shows:         │  │ Lists versions:  │  │ Edit segment     │
│ • Draft badge  │  │ • Published      │  │ config           │
│ • Last saved   │  │ • Draft Q1       │  │                  │
│                │  │ • Draft Q2       │  │ Updates:         │
│ Buttons:       │  │                  │  │ store.update     │
│ • New Draft ───┼──┤ Switch version:  │  │ Segment()        │
│ • Save         │  │ loadFlow(new)    │  │                  │
│ • Publish      │  │                  │  │                  │
│ • Discard      │  │                  │  │                  │
│                │  │                  │  │                  │
└────────┬───────┘  └──────────────────┘  └──────────────────┘
         │
         v
┌─────────────────────────────────────────────────────────────────┐
│                      CreateDraftDialog                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Props (from FlowToolbar):                                      │
│  ✓ routingId: flow.routingId                                   │
│  ✓ customerId: flow.customerId    ← Must pass!                │
│  ✓ projectId: flow.projectId      ← Must pass!                │
│  ✓ initSegment: flow.initSegment  ← For reference             │
│                                                                 │
│  User Input:                                                    │
│  • versionName (optional)                                       │
│  • description (optional)                                       │
│                                                                 │
│  Auth Context:                                                  │
│  • createdBy: user.email          ← From useAuth()            │
│                                                                 │
│  Mutation:                                                      │
│  createChangeSet({                                              │
│    routingId,     ✓ From prop                                  │
│    customerId,    ✓ From prop (from flow)                      │
│    projectId,     ✓ From prop (from flow)                      │
│    versionName,   ✓ User input (optional)                      │
│    description,   ✓ User input (optional)                      │
│    createdBy      ✓ From auth context                          │
│  })                                                             │
│                                                                 │
│  ❌ Current (WRONG):                                            │
│  createChangeSet({                                              │
│    routingId,                                                   │
│    initSegment: "start",      ← Not in DTO!                    │
│    createdBy: "user@ex.com"   ← Hardcoded!                     │
│  })                            Missing: customerId, projectId  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Import/Export Flow with ChangeSetId

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          EXPORT FLOW                                     │
└──────────────────────────────────────────────────────────────────────────┘

Export Published:
GET /segments/flows/ENGIE-ENERGYLINE-MAIN/export

Export Draft:
GET /segments/flows/ENGIE-ENERGYLINE-MAIN/export?changeSetId=abc-123

Response JSON:
{
  routingId: "ENGIE-ENERGYLINE-MAIN",
  customerId: "ENGIE",            ← Included in export
  projectId: "ENERGYLINE",        ← Included in export
  changeSetId: null,              ← Always null in export (not imported)
  initSegment: "get_language",
  segments: [ ... ],
  messageManifest: [ ... ]
}


┌──────────────────────────────────────────────────────────────────────────┐
│                          IMPORT FLOW                                     │
└──────────────────────────────────────────────────────────────────────────┘

User uploads JSON file

ImportDialog validates:
✓ flowData.routingId exists
✓ flowData.customerId exists    ← Must validate!
✓ flowData.projectId exists     ← Must validate!
✓ flowData.routingId matches URL routingId

POST /segments/flows/ENGIE-ENERGYLINE-MAIN/import
{
  routingId: "ENGIE-ENERGYLINE-MAIN",
  flowData: {
    routingId: "ENGIE-ENERGYLINE-MAIN",
    customerId: "ENGIE",          ← From imported file
    projectId: "ENERGYLINE",      ← From imported file
    segments: [ ... ]
  }
}

Backend:
- Validates routingId exists in RoutingTable
- Validates customerId/projectId match routing entry
- Creates/updates segments
```

---

## 6. Summary: ChangeSetId Usage Rules

### When changeSetId is NULL
- Segment is **PUBLISHED** and **ACTIVE**
- Visible in production
- Used by call flow runtime
- Returned when querying without `?changeSetId=` param

### When changeSetId is a UUID
- Segment is **DRAFT** and **INACTIVE**
- NOT visible in production
- Being edited by user
- Returned when querying with `?changeSetId=<uuid>` param

### Creating a Draft (Frontend Requirements)
```typescript
// ✅ CORRECT
createChangeSet({
  routingId: flow.routingId,         // From loaded flow
  customerId: flow.customerId,       // From loaded flow ✓
  projectId: flow.projectId,         // From loaded flow ✓
  versionName: userInput,            // Optional, from form
  description: userInput,            // Optional, from form
  createdBy: authUser.email          // From auth context ✓
})

// ❌ WRONG (current)
createChangeSet({
  routingId: flow.routingId,
  initSegment: 'start',              // Not in DTO!
  createdBy: 'user@example.com'      // Hardcoded!
  // Missing: customerId, projectId
})
```

### Backend Validation
Backend **always validates** that customerId/projectId in DTO match the values in RoutingTable:
```typescript
// Backend retrieves from database
const routingEntry = await prisma.routingTable.findFirst({
  where: { routingId },
  include: { companyProject: true }
});

const dbCustomerId = routingEntry.companyProject.customerId;
const dbProjectId = routingEntry.companyProject.projectId;

// Validates DTO matches database
if (dto.customerId !== dbCustomerId) {
  throw BadRequestException('CustomerId mismatch');
}
```

This ensures data integrity - frontend MUST pass correct values from the loaded flow!
