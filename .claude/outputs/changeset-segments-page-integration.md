# ChangeSetId Usage in Segments Page

## Current Implementation Analysis

The Segments page (`frontend/src/app/pages/SegmentsPage.tsx`) currently:
- ✅ Lists segments by routingId
- ✅ Can create new segments
- ✅ Can edit existing segments
- ❌ Does NOT use changeSetId (always operates on published segments)
- ❌ No draft/publish workflow integration

## How ChangeSetId SHOULD Be Used

### Concept: Parallel Editing Workflows

```
┌────────────────────────────────────────────────────────────────┐
│                    Two Ways to Edit Segments                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Option 1: Flow Designer (Recommended)                        │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  1. Load flow (published or draft)                   │    │
│  │  2. Create draft → segments copied                   │    │
│  │  3. Visual editing with graph                        │    │
│  │  4. Save → segments updated with changeSetId         │    │
│  │  5. Publish → changeSetId set to NULL               │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  Option 2: Segments Page (Direct Editing)                     │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  1. Select routing                                   │    │
│  │  2. Select version: Published OR Draft              │    │
│  │  3. Create/edit segments in selected version        │    │
│  │  4. Segments saved with selected changeSetId        │    │
│  │  5. Must publish via Flow Designer or API           │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Integration Points

#### 1. Version Selector in Segments Page

**Add Version Dropdown:**
```typescript
// SegmentsPage.tsx - Add state
const [selectedChangeSetId, setSelectedChangeSetId] = useState<string | null>(null);

// Load available versions for selected routing
const { data: changesets = [] } = useQuery({
  queryKey: ['changeset-versions', selectedRoutingId],
  queryFn: () => selectedRoutingId ? listChangeSets(selectedRoutingId) : [],
  enabled: !!selectedRoutingId,
});

// Filter for published vs drafts
const publishedVersion = { changeSetId: null, label: 'Published' };
const draftVersions = changesets.filter(cs => cs.status === 'draft');
```

**UI Component:**
```tsx
{selectedRoutingId && (
  <div className="w-full sm:w-64">
    <Label>Version</Label>
    <Select
      value={selectedChangeSetId || 'published'}
      onValueChange={(value) => 
        setSelectedChangeSetId(value === 'published' ? null : value)
      }
    >
      <SelectTrigger>
        <SelectValue placeholder="Select version" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="published">
          📦 Published
        </SelectItem>
        {draftVersions.map((cs) => (
          <SelectItem key={cs.changeSetId} value={cs.changeSetId}>
            ✏️ Draft - {cs.versionName || new Date(cs.dateCreated).toLocaleDateString()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
```

#### 2. Update Segments Query

**Current (lines 90-114):**
```typescript
const { data: segments = [] } = useQuery({
  queryKey: ['segments', selectedRoutingId],
  queryFn: async () => {
    if (selectedRoutingId) {
      return listSegments(selectedRoutingId);  // ❌ No changeSetId
    } else {
      // ...
    }
  },
});
```

**Proposed:**
```typescript
const { data: segments = [] } = useQuery({
  queryKey: ['segments', selectedRoutingId, selectedChangeSetId],  // ← Added to key
  queryFn: async () => {
    if (selectedRoutingId) {
      return listSegments(selectedRoutingId, selectedChangeSetId || undefined);  // ✓ Pass changeSetId
    } else {
      const result = await searchSegments({ 
        routingId: undefined, 
        q: searchQuery || undefined 
      });
      return result.data || [];
    }
  },
  enabled: true,
});
```

#### 3. Update CreateSegmentDialog

**Current Issue:**
CreateSegmentDialog auto-creates a draft changeset (lines 161-200) but this logic is **wrong** for the integrated workflow.

**Two Scenarios:**

**Scenario A: User selects Published version**
- Creating a segment should auto-create a draft
- Segment is created in that draft
- User must publish the draft later

**Scenario B: User selects Draft version**
- Segment is created in the selected draft
- No new draft creation needed

**Proposed Logic:**
```typescript
// CreateSegmentDialog.tsx

interface CreateSegmentDialogProps {
  defaultRoutingId?: string | null;
  selectedChangeSetId?: string | null;  // NEW - pass from parent
}

export function CreateSegmentDialog({ 
  defaultRoutingId, 
  selectedChangeSetId  // Receive from SegmentsPage
}: CreateSegmentDialogProps) {
  // ...
  
  const onSubmit = async (data: SegmentFormData) => {
    if (!selectedSegmentType) {
      toast.error('Please select a segment type');
      return;
    }
    
    let changeSetIdToUse = selectedChangeSetId;
    
    // If no draft selected, create one
    if (!changeSetIdToUse) {
      const existingChangeSets = await listChangeSets(data.routingId);
      let draftChangeSet = existingChangeSets.find(
        cs => cs.status === ChangeSetStatus.DRAFT
      );
      
      if (!draftChangeSet) {
        // Create new draft
        const newDraft = await createChangeSet({
          routingId: data.routingId,
          customerId: '???',  // ← PROBLEM: Need from routing entry
          projectId: '???',   // ← PROBLEM: Need from routing entry
          versionName: 'Auto-created draft',
          createdBy: user?.email,
        });
        changeSetIdToUse = newDraft.changeSetId;
      } else {
        changeSetIdToUse = draftChangeSet.changeSetId;
      }
      
      toast.info(`Creating segment in draft: ${changeSetIdToUse}`);
    }
    
    // Create segment with changeSetId
    const segmentDto: CreateSegmentDto = {
      routingId: data.routingId,
      segmentName: data.segmentName,
      dicSegmentTypeId: selectedSegmentType.dicSegmentTypeId,
      displayName: data.displayName,
      changeSetId: changeSetIdToUse,  // ← Pass to backend
      configs: mappedConfigs,
      transitions: mappedTransitions,
      hooks: parsedHooks,
      createdBy: user?.email,
    };
    
    await createSegment(segmentDto);
    toast.success('Segment created successfully in draft');
  };
}
```

**PROBLEM IDENTIFIED:**
To create a draft, we need `customerId` and `projectId`, but CreateSegmentDialog doesn't have access to the routing entry!

#### 4. Solution: Pass Routing Metadata to Dialog

**Update SegmentsPage:**
```typescript
// SegmentsPage.tsx

// Find selected routing entry (has customerId/projectId)
const selectedRouting = routingEntries.find(
  r => r.routingId === selectedRoutingId
);

// Pass to dialog
<CreateSegmentDialog 
  defaultRoutingId={selectedRoutingId}
  selectedChangeSetId={selectedChangeSetId}
  routingMetadata={selectedRouting}  // NEW - includes customerId/projectId
/>
```

**Update Dialog Props:**
```typescript
interface CreateSegmentDialogProps {
  defaultRoutingId?: string | null;
  selectedChangeSetId?: string | null;
  routingMetadata?: {
    routingId: string;
    customerId: string;
    projectId: string;
    // ... other metadata
  };
}
```

**Now draft creation works:**
```typescript
const newDraft = await createChangeSet({
  routingId: data.routingId,
  customerId: routingMetadata!.customerId,  // ✓ From routing
  projectId: routingMetadata!.projectId,    // ✓ From routing
  versionName: 'Auto-created draft',
  createdBy: user?.email,
});
```

### Complete Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Segments Page UI                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Routing: ENGIE-ENERGYLINE-MAIN ▼]                           │
│  [Version: Published ▼]                                         │
│                         ↓                                       │
│  Shows segments where:                                          │
│    routingId = 'ENGIE-ENERGYLINE-MAIN'                         │
│    changeSetId = NULL                                           │
│                                                                 │
│  [+ Create Segment]  ← Creates in current version              │
│  [Edit] [Delete]     ← Operates on current version             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  User switches to: [Version: Draft - Q1 Update ▼]             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Shows segments where:                                          │
│    routingId = 'ENGIE-ENERGYLINE-MAIN'                         │
│    changeSetId = 'abc-123-def-456'                             │
│                                                                 │
│  [+ Create Segment]  ← Creates in draft                        │
│  [Edit] [Delete]     ← Operates on draft segments              │
│                                                                 │
│  ⚠️  Badge: "Editing Draft - Changes not published"            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Behavior

The backend ALREADY supports this! Looking at `segments.service.ts`:

```typescript
// List segments supports changeSetId
export const listSegments = async (
  routingId: string,
  changeSetId?: string  // ← Already supported!
): Promise<Segment[]>

// Create segment supports changeSetId
export interface CreateSegmentDto {
  routingId: string;
  segmentName: string;
  changeSetId?: string;  // ← Already supported!
  // ...
}

// Update segment supports changeSetId
export interface UpdateSegmentDto {
  changeSetId?: string;  // ← Already supported!
  // ...
}
```

### Segments Are Duplicated Automatically

When you create/update a segment with a `changeSetId`:
- Unique constraint: `(routingId, segmentName, changeSetId)`
- Published segment: `(ENGIE-MAIN, 'welcome', NULL)`
- Draft segment: `(ENGIE-MAIN, 'welcome', 'abc-123')`

**Both can exist simultaneously!**

### Publishing Process

User CANNOT publish from Segments page. They must:

**Option 1: Use Flow Designer**
1. Open flow in Flow Designer
2. Select draft version
3. Click "Publish" button

**Option 2: Use API directly** (advanced users)
```
POST /segments/flows/ENGIE-MAIN/drafts/abc-123/publish
```

This sets `changeSetId = NULL` for all segments in that draft.

## Implementation Checklist

### Phase 1: Add Version Selector
- [ ] Add `selectedChangeSetId` state to SegmentsPage
- [ ] Add query to fetch changesets for selected routing
- [ ] Add version selector dropdown UI
- [ ] Update segments query to include changeSetId

### Phase 2: Update Create/Edit Dialogs
- [ ] Pass `selectedChangeSetId` to CreateSegmentDialog
- [ ] Pass routing metadata (customerId/projectId) to dialogs
- [ ] Update dialog to auto-create draft if needed
- [ ] Add visual indicator when editing draft

### Phase 3: UI Polish
- [ ] Add badge showing "Editing Draft" when changeSetId selected
- [ ] Add warning before creating segment in published version
- [ ] Add button to "Open in Flow Designer" to publish
- [ ] Update delete confirmation to mention draft vs published

### Phase 4: Edge Cases
- [ ] Handle case where user deletes last segment in draft
- [ ] Handle case where draft is published while user is viewing it
- [ ] Add refresh logic when changesets change
- [ ] Add "Create New Draft" button

## Recommended UI Changes

### Draft Indicator Badge
```tsx
{selectedChangeSetId && (
  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
    <div className="flex items-center gap-2">
      <Badge variant="warning">✏️ Editing Draft</Badge>
      <span className="text-sm text-yellow-800">
        Changes are not published. Use Flow Designer to publish this draft.
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(`/flows/${selectedRoutingId}?changeSetId=${selectedChangeSetId}`)}
      >
        Open in Flow Designer
      </Button>
    </div>
  </div>
)}
```

### Warning Before Creating in Published
```tsx
const handleCreateSegment = () => {
  if (!selectedChangeSetId) {
    // Creating in published version
    if (!confirm(
      'You are about to create a segment in the Published version. ' +
      'This will automatically create a new draft. ' +
      'You will need to publish the draft later for changes to go live. ' +
      'Continue?'
    )) {
      return;
    }
  }
  
  setShowCreateDialog(true);
};
```

## Summary

### How ChangeSetId Is Used:

1. **Segments Page acts as a direct editor**
   - Can view published or draft versions
   - Can create/edit segments in either version
   - User selects which version to work on

2. **ChangeSetId is passed to all operations**
   - List: `listSegments(routingId, changeSetId)`
   - Create: `createSegment({ ..., changeSetId })`
   - Update: `updateSegment(id, { ..., changeSetId })`

3. **Draft auto-creation when needed**
   - If user edits published version
   - Dialog auto-creates draft
   - Requires routing metadata (customerId/projectId)

4. **Publishing is separate**
   - Must use Flow Designer
   - Or direct API call
   - Sets all draft segments' changeSetId to NULL

### Key Insight:
The Segments page becomes a **direct segment editor** that respects the draft/publish workflow. Users can work on drafts without using the visual Flow Designer, but they still must publish through it (or API).
