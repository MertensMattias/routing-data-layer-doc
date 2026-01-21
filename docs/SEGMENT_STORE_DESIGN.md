# Segment Store - Design Doc

## What This Is

The Segment Store manages IVR call flow configurations. It functions as a blueprint for automated phone menus—it stores all the pieces (segments) and how they connect together.

When a call comes in, the IVR runtime reads this blueprint to know what to play, what menu options to offer, and where to route the caller based on their intent.

### Quick Visual: How It Works

```
   SEGMENT TYPE (Template)              SEGMENT (Instance)
   ────────────────────                ─────────────────

   ┌──────────────┐                    ┌──────────────┐
   │    menu      │ ─────defines──────→│  main_menu   │
   │              │                    │              │
   │ Config keys: │                    │ Config vals: │
   │ • messageKey │                    │ • MAIN_MENU  │
   │ • maxRetries │                    │ • 3          │
   │ • timeout    │                    │ • 5          │
   └──────────────┘                    └──────┬───────┘
                                              │
   One template,                              │ Transitions
   unlimited uses                             │
                                              ▼
                                       ┌──────────────┐
                                       │   "1" → billing
                                       │   "2" → support
                                       │   "3" → callback
                                       └──────────────┘
```

### Why This Exists

**Problem:** Call flows were hardcoded. Changing "Press 1 for billing" meant:
- Edit code in multiple places
- Deploy new version
- Restart servers
- Hope nothing breaks

**Solution:** Segment-based architecture:
- **Segment types** = Reusable templates (defined once)
- **Segments** = Instances with specific configs (use everywhere)
- **Transitions** = Dynamic routing based on results
- **Draft/publish** = Safe testing before going live

### Key Benefits

```
┌────────────────────────────────────────────────────────┐
│ Flexibility                                            │
├────────────────────────────────────────────────────────┤
│ • Create any segment type you want                     │
│ • Each type defines its own config structure           │
│ • Add new types without code changes                   │
│ • Reuse types across all customers                     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Standardization                                        │
├────────────────────────────────────────────────────────┤
│ • Each segment exits with a result/state               │
│ • Results map to next segments via transitions         │
│ • Uniform structure for all flows                      │
│ • Easy to understand, maintain, and debug              │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Reduces Duplication                                    │
├────────────────────────────────────────────────────────┤
│ • One segment type handles all similar logic           │
│ • No copying code for each flow                        │
│ • Update once, applies everywhere                      │
│ • Example: One "Intent_event" type for all AI intents │
└────────────────────────────────────────────────────────┘
```

### From Code to Config

**Before (hardcoded in each flow):**
- 2000+ lines of segment dics logic per flow
- Copied across 10+ flows
- Creating lots of versions and poits to maintain.


**After (segment-based):**
- SegmentTypes are defined in dictionaries
- flows use them to define their segment set.
- Change the type? All flows get the update
- Test in draft, publish when ready

---

## Why We Built This

### The Problem

Flows can be build DTMF based, so press a menu option, route to a related nextStep.
But also, intent based, meaning, based on a set of intents, or a answer given bij a agent. You can jump from one part to  anoher. Instead of a tree 'step' like structure, it's becoming more like a star.

That's where the transitons are coming in. Depending the state of a segment, the next step is determined. It's a fixed format, usable for logically routing and logging of logical segments in a flow.

Using this gives us the options to provision generic modules in a flow, pure on config and reuse it everywhere we want. Think of a component like callback, transfer,



We needed a way to provide configuration to components in the flow, that dynamically provide config for each customer/flow.

### Before vs After: Real Impact



### The Flexibility Advantage

**Old way (hardcoded):**
```javascript
// Each customer needs their own code
if (customer === 'ACME') {
  if (option === '1') return 'billing';
  if (option === '2') return 'support';
} else if (customer === 'GLOBEX') {
  if (option === '1') return 'sales';
  if (option === '2') return 'service';
  if (option === '3') return 'parts';
}
// ... 500 more lines ...
```

**New way (segment-based):**
```javascript
// ONE segment type handles ALL customers
const menuType = {
  name: 'menu',
  handler: (segment, input) => {
    // Generic logic for any menu
    return segment.transitions.find(t => t.result === input)?.nextSegment;
  }
};

// Each customer just configures their segments
// ACME: 2 options
// GLOBEX: 3 options
// No code changes needed!
```

### Who It Helped

**Content and business teams:**
- Design call flows in a visual editor without touching code
- Make changes safely in draft mode, publish when ready
- Roll back bad changes quickly

**Developers:**
- Stop wasting time on "change this menu option" tickets
- Flows are data, not code—easier to maintain and debug
- Clear separation between flow logic (Segment Store) and content (Message Store)

**Operations:**
- Version control with audit trails
- Multi-tenant setup—each customer gets isolated configuration
- Import/export for editing or importing in different environment

---

## How It Works

### What is a Segment?

Think of a segment as a **Lego brick** in your call flow. Each brick has:
- A **type** (what it does)
- A **configuration** (how it does it)
- **exits/transitions** (where to go next based on what happens)

```
┌─────────────────────────────────────┐
│         SEGMENT                     │
│  ┌───────────────────────────────┐  │
│  │  Type: menu                   │  │ ← What it does
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Config:                      │  │
│  │  - messageKey: MAIN_MENU      │  │ ← How it's configured
│  │  - maxRetries: 3              │  │
│  │  - timeout: 5s                │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Exits/Transitions:           │  │
│  │  - "1" → billing              │  │ ← Where it goes next
│  │  - "2" → support              │  │
│  │  - "timeout" → repeat         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Visual Example: Simple Flow

Here's how segments connect together in a real flow:

```
     ┌──────────────┐
     │   welcome    │
     │  (message)   │
     └──────┬───────┘
            │ success
            ▼
     ┌──────────────┐
     │  main_menu   │
     │   (menu)     │
     └──┬─────┬─────┘
        │     │
     1  │     │ 2
        │     │
        ▼     ▼
  ┌─────────┐ ┌─────────┐
  │ billing │ │ support │
  │(transfer)│(transfer)│
  └─────────┘ └─────────┘
```

### Segment Types: The Templates

Each segment type is like a **template** that defines what config options are available. You create segment types once in the dictionary, then create as many segments as you need based on those types.

**Example Segment Types:**

```
┌──────────────────────────────────────────────────────┐
│ Segment Type: menu                                   │
├──────────────────────────────────────────────────────┤
│ Purpose: Present options, collect DTMF input         │
│                                                       │
│ Required Config Keys:                                │
│  • messageKey (string) - Which message to play       │
│  • maxRetries (int) - How many attempts              │
│  • timeout (int) - Seconds to wait for input         │
│                                                       │
│ Optional Config Keys:                                │
│  • invalidInputMessage (string) - Error message      │
│  • noInputMessage (string) - Timeout message         │
│                                                       │
│ Expected Results/Exits:                              │
│  • "0" through "9" - User pressed a digit            │
│  • "timeout" - No input received                     │
│  • "invalid" - Invalid input                         │
│  • "max_retries" - Too many failed attempts          │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Segment Type: transfer                               │
├──────────────────────────────────────────────────────┤
│ Purpose: Transfer call to agent or phone number      │
│                                                       │
│ Required Config Keys:                                │
│  • destination (string) - Queue name or phone number │
│  • transferType (string) - blind/warm/attended       │
│                                                       │
│ Expected Results/Exits:                              │
│  • "connected" - Transfer successful                 │
│  • "failed" - Transfer failed                        │
│  • "busy" - Destination busy                         │
│  • "no_answer" - No answer                           │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Segment Type: message                                │
├──────────────────────────────────────────────────────┤
│ Purpose: Play a message to caller                    │
│                                                       │
│ Required Config Keys:                                │
│  • messageKey (string) - Which message to play       │
│                                                       │
│ Optional Config Keys:                                │
│  • continueOnComplete (bool) - Auto-continue         │
│  • barge_in (bool) - Allow DTMF interruption         │
│                                                       │
│ Expected Results/Exits:                              │
│  • "success" - Message played successfully           │
│  • "error" - Playback error                          │
└──────────────────────────────────────────────────────┘
```

### The Power of Segment Types

**Before (hardcoded):**
```javascript
// Every flow has this logic duplicated
if (segment.type === 'menu') {
  // Play message
  // Collect input
  // Validate input
  // Branch based on input
  // Handle retries
  // Handle timeouts
  // ... 50+ lines of logic per menu
}
```

**After (segment types):**
```javascript
// One segment type definition handles ALL menus
const menuType = {
  name: 'menu',
  configKeys: ['messageKey', 'maxRetries', 'timeout'],
  handler: executeMenuLogic  // Reusable handler
}

// Each menu segment just needs config
const mainMenu = {
  type: 'menu',
  config: { messageKey: 'MAIN_MENU', maxRetries: 3, timeout: 5 }
}

const languageMenu = {
  type: 'menu',
  config: { messageKey: 'LANG_SELECT', maxRetries: 2, timeout: 10 }
}
```

### Real-World Example: Customer Support Flow

Let's see how segments build a complete flow:

```
1. WELCOME (message)
   Config: { messageKey: "WELCOME_MSG" }
   Exit: success → 2

2. LANGUAGE_SELECTION (menu)
   Config: {
     messageKey: "LANG_MENU",
     maxRetries: 3,
     timeout: 10
   }
   Exits:
     - "1" → 3 (Dutch)
     - "2" → 3 (French)
     - "timeout" → 2 (retry)
     - "max_retries" → 7 (disconnect)

3. MAIN_MENU (menu)
   Config: {
     messageKey: "MAIN_MENU",
     maxRetries: 3,
     timeout: 5
   }
   Exits:
     - "1" → 4 (billing)
     - "2" → 5 (tech support)
     - "3" → 6 (callback)
     - "invalid" → 3 (retry)

4. BILLING_QUEUE (transfer)
   Config: {
     destination: "BILLING_QUEUE",
     transferType: "warm"
   }
   Exits:
     - "connected" → (call ends)
     - "failed" → 6 (callback)

5. TECH_SUPPORT_QUEUE (transfer)
   Config: {
     destination: "TECH_QUEUE",
     transferType: "warm"
   }
   Exits:
     - "connected" → (call ends)
     - "failed" → 6 (callback)

6. SCHEDULE_CALLBACK (scheduler)
   Config: {
     schedulerUrl: "https://api/scheduler",
     confirmMessage: "CALLBACK_CONFIRM"
   }
   Exit: success → 7

7. GOODBYE (disconnect)
   Config: {
     messageKey: "GOODBYE_MSG"
   }
   Exit: (call ends)
```

**Visualized:**

```
┌───────────┐
│  welcome  │ (message)
└─────┬─────┘
      │
      ▼
┌───────────┐
│ language  │ (menu: 1=NL, 2=FR)
└─────┬─────┘
      │
      ▼
┌───────────┐
│ main_menu │ (menu: 1=billing, 2=support, 3=callback)
└──┬──┬──┬──┘
   │  │  │
   1  2  3
   │  │  │
   ▼  ▼  ▼
┌────┐┌────┐┌────────┐
│bill││tech││callback│
│ing ││sup ││schedule│
└────┘└────┘└────┬───┘
                 │
                 ▼
              ┌────────┐
              │goodbye │ (disconnect)
              └────────┘
```

### Flexibility Through Types

The segment type system makes it incredibly flexible:

**Scenario 1: Add a new type of segment**
```
1. Add "intent_detection" to DicSegmentType
2. Define config keys:
   - aiModel: "gpt-4"
   - confidenceThreshold: 0.8
   - fallbackSegment: "main_menu"
3. Create segments of this type:
   - account_intent
   - billing_intent
   - support_intent
```

**Scenario 2: Reuse segments across flows**
```
Same segment type, different configs:

Flow A: ACME-BILLING
  - welcome_msg (message: ACME_WELCOME)
  - main_menu (menu: ACME_MENU)
  - billing (transfer: ACME_BILLING_QUEUE)

Flow B: ACME-SUPPORT
  - welcome_msg (message: ACME_WELCOME)  ← Same type, different flow
  - main_menu (menu: SUPPORT_MENU)       ← Different config
  - support (transfer: SUPPORT_QUEUE)
```

**Scenario 3: Custom segment types per customer**
```
Standard types:
  - message, menu, transfer, disconnect

Custom for Customer A:
  - crm_lookup (checks CRM before routing)
  - priority_check (VIP customers get special treatment)

Custom for Customer B:
  - fraud_detection (AI checks for fraud)
  - compliance_record (regulatory recording)
```

### Core Concepts

**Segments:**
- One step in a call flow
- Examples: Play message, show menu, transfer, collect input, end call

**Transitions:**
- Connect segments based on what happens
- Menu result "1" → go to "billing_segment"
- Menu result "2" → go to "support_segment"
- Invalid input → loop back to the same segment

**Flows:**
- Complete graph of segments from start to finish
- Starting from an initial segment (like "welcome")
- Ending at terminal segments (disconnect, transfer, callback)

### What It's Responsible For

The Segment Store handles:
1. **Segment management** - Create, read, update, delete segments
2. **Config validation** - Ensure configs have required fields and valid values
3. **Transition management** - Store and validate connections between segments
4. **Flow composition** - Assemble segments into complete call flows
5. **Draft/publish workflow** - Edit safely in draft, publish atomically
6. **Import/export** - Move flows between environments
7. **Access control** - Customer-scoped data isolation

### What It Doesn't Do

The Segment Store does **NOT**:
- Decide which flow to run for incoming calls (that's the `routing-table` module)
- Store message content or audio files (that's the `message-store` module)
- Execute call flows at runtime (the IVR runtime engine does that)
- Handle authentication (Okta + `auth` module)
- Schedule time-based flow changes (external scheduler does this)

---

## What Goes In and Out

### Inputs

| What | From Where | Format |
|------|-----------|--------|
| Segment definitions | Flow Designer UI | JSON with type, name, config |
| Transitions | Flow Designer | Source segment + result + target segment |
| Publish commands | Users with publish permissions | ChangeSet ID |
| Import files | Migration tools | JSON export files |

### Outputs

| What | To Where | Why |
|------|----------|-----|
| Flow structure | IVR runtime | Execute call logic |
| Segment CRUD responses | Flow Designer UI | Render visual graph |
| Validation reports | Flow Designer | Show errors/warnings |
| Export files | Migration tools | Move flows between environments |

### Dependencies

| Service/Module | What It Provides | How We Use It |
|----------------|------------------|---------------|
| `routing-table` | Routing entries with `routingId` | Validates routingId exists; uses `initSegment` for flow traversal |
| `message-store` | Message definitions | References `messageKey` in segment configs |
| `auth` | User identity and customer scope | Filters by customer; records audit trail |
| Dictionary tables | Segment types, config keys | Validates segment types exist; determines valid config keys |

### Consumers

| Who Uses This | What They Get | How They Use It |
|---------------|---------------|-----------------|
| Flow Designer UI | Complete flow structure | Renders visual graph; allows editing |
| IVR Runtime | Published flow config | Executes call logic during live calls |
| Migration Tools | Flow export JSON | Moves flows between dev → test → prod |
| Reporting Systems | Audit trail | Tracks config changes for compliance |

---

## Where It Fits

The Segment Store is the source of truth for call flow structure:

```
┌─────────────────┐
│  Routing Table  │ ← Entry point (sourceId → routingId)
└────────┬────────┘
         │ provides routingId
         ▼
┌─────────────────┐
│  Segment Store  │ ← Call flow structure (THIS SERVICE)
└────────┬────────┘
         │ references messageKeys
         ▼
┌─────────────────┐
│  Message Store  │ ← Message content
└─────────────────┘

Flow: Call arrives → Routing Table finds routingId → Segment Store provides flow structure → Message Store provides audio
```

**How it fits:**
- **Application tier** - Not runtime execution, just configuration
- **Repository pattern** - Stores data and enforces business rules
- **Stateless API** - Horizontal scaling is easy
- **Read-optimized** - Runtime engines read published flows frequently; writes are occasional

---

## Understanding Segment Configuration

### How Config Keys Work

Each segment type defines **which config keys** it needs. The segment itself stores the **values** for those keys.

```
┌────────────────────────────────────────────────────────────┐
│ DicSegmentType: "menu"                                     │
├────────────────────────────────────────────────────────────┤
│ Defines WHAT configs are allowed:                          │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ DicKey: messageKey                                   │  │
│ │  - Type: string                                      │  │
│ │  - Required: true                                    │  │
│ │  - Description: Message to play                      │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ DicKey: maxRetries                                   │  │
│ │  - Type: int                                         │  │
│ │  - Required: true                                    │  │
│ │  - Default: 3                                        │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ DicKey: timeout                                      │  │
│ │  - Type: int                                         │  │
│ │  - Required: false                                   │  │
│ │  - Default: 5                                        │  │
│ └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                             │
                             │ Used as template for...
                             ▼
┌────────────────────────────────────────────────────────────┐
│ Segment: "main_menu"                                       │
├────────────────────────────────────────────────────────────┤
│ Instance of type "menu" with actual VALUES:                │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Key: messageKey                                      │  │
│ │ Value: "MAIN_MENU_PROMPT"                            │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Key: maxRetries                                      │  │
│ │ Value: 3                                             │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Key: timeout                                         │  │
│ │ Value: 10                                            │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ Transitions:                                                │
│  - "1" → billing_segment                                   │
│  - "2" → support_segment                                   │
│  - "timeout" → main_menu (retry)                           │
└────────────────────────────────────────────────────────────┘
```

### Example: Creating a New Segment Type

Let's create a custom "intent_detection" segment type:

**Step 1: Define the segment type**
```sql
INSERT INTO DicSegmentType (segmentTypeName, isTerminal)
VALUES ('intent_detection', false)
```

**Step 2: Define config keys for this type**
```sql
-- Which AI model to use
INSERT INTO DicKey (dicSegmentTypeId, keyName, dicKeyTypeId, isRequired)
VALUES (
  <intent_detection_id>,
  'aiModel',
  <string_type_id>,
  true
)

-- Confidence threshold
INSERT INTO DicKey (dicSegmentTypeId, keyName, dicKeyTypeId, isRequired)
VALUES (
  <intent_detection_id>,
  'confidenceThreshold',
  <decimal_type_id>,
  true
)

-- Fallback segment if confidence too low
INSERT INTO DicKey (dicSegmentTypeId, keyName, dicKeyTypeId, isRequired)
VALUES (
  <intent_detection_id>,
  'fallbackSegment',
  <string_type_id>,
  false
)

-- API endpoint for the AI service
INSERT INTO DicKey (dicSegmentTypeId, keyName, dicKeyTypeId, isRequired)
VALUES (
  <intent_detection_id>,
  'apiEndpoint',
  <string_type_id>,
  true
)
```

**Step 3: Create segments using this type**
```javascript
// Segment 1: Detect billing intent
{
  "segmentName": "detect_billing_intent",
  "dicSegmentTypeId": <intent_detection_id>,
  "keys": [
    { "keyName": "aiModel", "value": "gpt-4" },
    { "keyName": "confidenceThreshold", "value": "0.85" },
    { "keyName": "apiEndpoint", "value": "https://api.ai/detect" },
    { "keyName": "fallbackSegment", "value": "main_menu" }
  ],
  "transitions": [
    { "resultName": "billing", "nextSegmentName": "billing_queue" },
    { "resultName": "support", "nextSegmentName": "support_queue" },
    { "resultName": "low_confidence", "nextSegmentName": "main_menu" }
  ]
}

// Segment 2: Detect language intent
{
  "segmentName": "detect_language",
  "dicSegmentTypeId": <intent_detection_id>,
  "keys": [
    { "keyName": "aiModel", "value": "whisper-1" },
    { "keyName": "confidenceThreshold", "value": "0.90" },
    { "keyName": "apiEndpoint", "value": "https://api.ai/language" }
  ],
  "transitions": [
    { "resultName": "dutch", "nextSegmentName": "welcome_nl" },
    { "resultName": "french", "nextSegmentName": "welcome_fr" },
    { "resultName": "english", "nextSegmentName": "welcome_en" },
    { "resultName": "unknown", "nextSegmentName": "language_menu" }
  ]
}
```

### Flexibility in Action

**Example 1: Same type, different purposes**
```
Segment Type: "scheduler"

Segment A: "schedule_callback"
  - schedulerType: "callback"
  - priority: "normal"
  - confirmMessage: "CALLBACK_CONFIRM"

Segment B: "schedule_maintenance"
  - schedulerType: "maintenance_window"
  - priority: "high"
  - confirmMessage: "MAINTENANCE_CONFIRM"

Segment C: "schedule_appointment"
  - schedulerType: "appointment"
  - priority: "normal"
  - confirmMessage: "APPOINTMENT_CONFIRM"
  - calendarIntegration: "outlook"
```

**Example 2: Complex segment with many options**
```
Segment Type: "advanced_menu"

Required Keys:
  - messageKey
  - maxRetries
  - timeout

Optional Keys:
  - enableSpeechRecognition (bool)
  - speechLanguage (string)
  - speechConfidenceThreshold (decimal)
  - enableBargeIn (bool)
  - invalidInputMessage (string)
  - noInputMessage (string)
  - maxNoInputRetries (int)
  - backgroundMusic (string)
  - recordChoice (bool)

This one type can handle:
  - Simple DTMF menus
  - Speech-enabled menus
  - Menus with background music
  - Menus that record choices for analytics
```

**Example 3: Reusable patterns**
```
Create once, use everywhere:

Segment Type: "authentication"
  Keys: method, maxAttempts, lockoutDuration, apiEndpoint

Use in Flow A: PIN authentication
Use in Flow B: Account number verification
Use in Flow C: Birthday verification
Use in Flow D: SSN last 4 digits

Same logic, different configs!
```

## Domain Model

### Core Entities

| Entity | Purpose | Key Characteristics |
|--------|---------|---------------------|
| **Segment** | One step in call flow | Has a type (menu, language, transfer), config (key/value pairs), transitions |
| **SegmentType** | Template for segments | Defines valid config keys (e.g., menu type needs `messageKey`, `maxRetries`) |
| **ConfigKey** | Configuration parameter | Key-value pair (e.g., `messageKey: "LANG_SELECT"`, `maxRetries: 3`) |
| **Transition** | Connection between segments | Maps result name (e.g., "BILLING") to next segment name |
| **ChangeSet** | Draft workspace | Groups changes together; status: draft → published |
| **Flow** | Complete call flow | Collection of segments + transitions from `initSegment` |

### Relationships

```
RoutingTable (1) ──────── (0..N) Segment
  - One routing has many segments
  - Segments belong to one routing (isolated by routingId)

SegmentType (1) ──────── (0..N) Segment
  - Segment type is a template (menu, language, scheduler)
  - Many segments share the same type

Segment (1) ──────── (0..N) ConfigKey
  - Each segment has config key-value pairs

Segment (1) ──────── (0..N) Transition (outgoing)
  - Segment has transitions to other segments

ChangeSet (1) ──────── (0..N) Segment
  - Draft segments belong to a ChangeSet
  - Published segments have changeSetId = null
```

### Lifecycle & Draft/Publish Workflow

Understanding how segments move from draft to published is crucial.

**Visual: Segment Lifecycle**

```
┌─────────────────────────────────────────────────────────────┐
│                    SEGMENT LIFECYCLE                         │
└─────────────────────────────────────────────────────────────┘

  CREATE               EDIT                 PUBLISH
    │                   │                      │
    ▼                   ▼                      ▼
┌─────────┐       ┌─────────┐           ┌─────────┐
│  DRAFT  │──────→│  DRAFT  │──────────→│PUBLISHED│
│         │       │(modified)│           │         │
│ csetId=│       │ csetId=  │           │csetId=  │
│ abc-123│       │ abc-123  │           │ NULL    │
└─────────┘       └─────────┘           └────┬────┘
                                              │
                                              │ DELETE
                                              ▼
                                        ┌──────────┐
                                        │ INACTIVE │
                                        │          │
                                        │isActive= │
                                        │  false   │
                                        └──────────┘
```

**Draft vs Published:**

```
┌──────────────────────────────────────────────────────────────┐
│ DRAFT WORKSPACE (ChangeSet: abc-123)                         │
├──────────────────────────────────────────────────────────────┤
│ Segments in this ChangeSet:                                  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ welcome (changeSetId = abc-123)                        │  │
│ │   config: messageKey = "NEW_WELCOME"                   │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ main_menu (changeSetId = abc-123)                      │  │
│ │   config: messageKey = "NEW_MENU"                      │  │
│ │   transitions: added option "3" for callback           │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ new_callback (changeSetId = abc-123)                   │  │
│ │   config: NEW segment!                                 │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ [Discard] [Validate] [Publish] ← Actions                     │
└──────────────────────────────────────────────────────────────┘

          Runtime doesn't see these! ↑

┌──────────────────────────────────────────────────────────────┐
│ PUBLISHED FLOW (changeSetId = NULL)                          │
├──────────────────────────────────────────────────────────────┤
│ What runtime currently sees:                                 │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ welcome (changeSetId = NULL)                           │  │
│ │   config: messageKey = "OLD_WELCOME"                   │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ main_menu (changeSetId = NULL)                         │  │
│ │   config: messageKey = "OLD_MENU"                      │  │
│ │   transitions: options "1" and "2" only                │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ Runtime uses this during live calls ↑                        │
└──────────────────────────────────────────────────────────────┘
```

**What happens when you publish:**

```
BEFORE PUBLISH:
┌─────────────────────────────────────────────────────────────┐
│ PUBLISHED (what runtime sees)                               │
├─────────────────────────────────────────────────────────────┤
│ welcome (csetId=NULL, isActive=true)                        │
│ main_menu (csetId=NULL, isActive=true)                      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ DRAFT (hidden from runtime)                                 │
├─────────────────────────────────────────────────────────────┤
│ welcome (csetId=abc-123, isActive=true) ← modified          │
│ main_menu (csetId=abc-123, isActive=true) ← modified        │
│ new_callback (csetId=abc-123, isActive=true) ← NEW!         │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   PUBLISH!   │
                    └──────────────┘
                           │
                           ▼

AFTER PUBLISH:
┌─────────────────────────────────────────────────────────────┐
│ NEW PUBLISHED (what runtime sees now)                       │
├─────────────────────────────────────────────────────────────┤
│ welcome (csetId=NULL, isActive=true) ← NEW copy from draft  │
│ main_menu (csetId=NULL, isActive=true) ← NEW copy from draft│
│ new_callback (csetId=NULL, isActive=true) ← NEW!            │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ OLD PUBLISHED (archived)                                    │
├─────────────────────────────────────────────────────────────┤
│ welcome (csetId=NULL, isActive=false) ← soft-deleted        │
│ main_menu (csetId=NULL, isActive=false) ← soft-deleted      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ DRAFT (preserved as history)                                │
├─────────────────────────────────────────────────────────────┤
│ welcome (csetId=abc-123, isActive=true) ← kept for audit    │
│ main_menu (csetId=abc-123, isActive=true) ← kept for audit  │
│ new_callback (csetId=abc-123, isActive=true) ← kept for audit│
└─────────────────────────────────────────────────────────────┘
```

**Segment States:**
1. **Draft** - Created in ChangeSet (`changeSetId = "abc-123"`), not visible to runtime
2. **Published** - `changeSetId = NULL`, visible to runtime during calls
3. **Inactive** - Soft-deleted (`isActive = false`), preserved for audit trail

**ChangeSet States:**
1. **draft** - Editable workspace, can be modified
2. **validated** - Passed validation checks, ready to publish
3. **published** - Changes copied to production (`changeSetId = NULL`)
4. **discarded** - Deleted without affecting production

**Why this design?**

```
Safety:
  ✓ Test changes in draft without affecting live calls
  ✓ Publish atomically (all segments or none)
  ✓ Old version soft-deleted, not destroyed

Auditability:
  ✓ Draft segments preserved after publish
  ✓ Can see exactly what changed
  ✓ Full history of all versions

Flexibility:
  ✓ Multiple people can work on different routings
  ✓ Can discard draft without harm
  ✓ Runtime keeps working during edits
```

---

## Data Model

```mermaid
erDiagram
    RoutingTable ||--o{ Segment : "has many"
    DicSegmentType ||--o{ Segment : "categorizes"
    Segment ||--o{ Key : "configured by"
    Segment ||--o{ SegmentTransition : "transitions to"
    DicKey ||--o{ Key : "defines"
    DicKeyType ||--o{ DicKey : "has type"
    ChangeSet ||--o{ Segment : "contains drafts"
    Segment ||--|| SegmentUIState : "has layout"

    RoutingTable {
        string routingTableId PK
        string routingId UK
        string sourceId UK
        string initSegment
        int companyProjectId FK
    }

    DicSegmentType {
        int dicSegmentTypeId PK
        string segmentTypeName UK
        bool isTerminal
        string hooksSchema
    }

    Segment {
        string segmentId PK
        string routingId FK
        string segmentName
        int dicSegmentTypeId FK
        string changeSetId FK "null=published"
        bool isActive
    }

    Key {
        int dicSegmentTypeId PK_FK
        int dicKeyId PK_FK
        string segmentId PK_FK
        string value
    }

    SegmentTransition {
        string segmentTransitionId PK
        string segmentId FK
        string nextSegmentName "name-based resolution"
        string resultName
        string contextKey "context-aware routing"
    }

    ChangeSet {
        string changeSetId PK
        string routingId
        string status "draft/published"
    }
```

### Key Design Choices

1. **Name-Based Resolution** - Transitions use `nextSegmentName` instead of `nextSegmentId` to avoid ID conflicts when copying between draft/published

2. **Composite Uniqueness** - `(routingId, segmentName, changeSetId)` ensures segments are unique within a routing/version scope

3. **Soft Delete** - `isActive` flag preserves audit trail instead of physical deletion

4. **Context-Aware Routing** - `contextKey` field lets transitions vary based on runtime context (e.g., customer type, region)

---

## Common Workflows

### 1. Create a New Flow (Draft-First)

**User:** Business analyst designing a flow

**Steps:**
1. Create or open draft ChangeSet for routingId `ACME-BILLING-MAIN`
2. Add segments via Flow Designer:
   - `welcome` (type: message)
   - `get_language` (type: language)
   - `main_menu` (type: menu)
   - `billing` (type: transfer)
3. Configure each segment (messageKey, maxRetries, etc.)
4. Connect segments with transitions:
   - `get_language` → result "EN" → `main_menu`
   - `main_menu` → result "1" → `billing`
5. System validates flow (no orphaned segments, no broken transitions)
6. Save draft (segments stored with changeSetId)
7. Publish draft → System copies segments to production (changeSetId = null)

**What the system validates:**
- Segment types exist
- routingId exists in routing table
- No duplicate segment names
- All transition targets exist
- Atomic transaction for publish (old version deactivated, new version activated)

---

### 2. Update Existing Flow (Draft-Publish Cycle)

**User:** Flow administrator

**Steps:**
1. Load published flow for `ACME-BILLING-MAIN`
2. System creates draft ChangeSet (copies published segments)
3. User modifies `main_menu` segment (adds option "3" for callback)
4. User adds new `schedule_callback` segment
5. User adds transition: `main_menu` → result "3" → `schedule_callback`
6. System validates changes
7. User publishes draft
8. System deactivates old published segments, activates new ones

**Safety features:**
- Published flow stays unchanged during editing
- Runtime keeps using old version while you edit
- Rollback by discarding draft

---

### 3. Import Flow from Another Environment

**User:** DevOps engineer

**Steps:**
1. Export flow from staging (JSON file)
2. Navigate to production
3. Upload flow JSON via import API
4. System validates:
   - routingId matches (prevent wrong-routing import)
   - All segment types exist in production
   - All referenced message keys exist
5. System creates draft ChangeSet with imported segments
6. Review draft in Flow Designer
7. Publish when ready

**Options:**
- `overwrite: false` → Import only new segments (merge)
- `overwrite: true` → Replace all segments
- `validateOnly: true` → Preview without saving (dry-run)

---

### 4. Context-Aware Routing (Runtime)

**User:** IVR Runtime Engine

**Scenario:** Route VIP customers differently

Context-aware routing lets you route based on **runtime variables** without creating duplicate flows.

**Visual Example:**

```
                ┌─────────────────┐
                │ account_check   │
                │ (crm_lookup)    │
                └────────┬────────┘
                         │
         Sets context: customerType = "PREMIUM"
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    [PREMIUM]       [STANDARD]      [DEFAULT]
         │               │               │
         ▼               ▼               ▼
  ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ premium  │   │ standard │   │ main     │
  │ menu     │   │ menu     │   │ menu     │
  └──────────┘   └──────────┘   └──────────┘
```

**How it works:**

```javascript
// Segment: account_check
{
  "segmentName": "account_check",
  "type": "crm_lookup",
  "config": {
    "apiEndpoint": "https://crm/lookup",
    "cacheTimeout": 300
  },
  "transitions": [
    {
      "resultName": "success",
      "contextKey": "customerType",
      "contextValue": "PREMIUM",
      "nextSegmentName": "premium_menu"  // ← VIP customers go here
    },
    {
      "resultName": "success",
      "contextKey": "customerType",
      "contextValue": "STANDARD",
      "nextSegmentName": "standard_menu"  // ← Regular customers go here
    },
    {
      "resultName": "success",
      "contextKey": null,                 // ← No context filter
      "nextSegmentName": "main_menu"      // ← Default/fallback
    },
    {
      "resultName": "error",
      "nextSegmentName": "error_handler"
    }
  ]
}
```

**Runtime execution:**

```
Step 1: Segment executes
  → Calls CRM API
  → Gets customer data
  → Sets runtime context: { customerType: "PREMIUM", accountBalance: 1500 }

Step 2: Evaluate transitions for result="success"
  → Check transition 1: result="success" + context customerType="PREMIUM"
    ✓ MATCH! Go to "premium_menu"

(If no match, would check transition 2, then transition 3 as fallback)
```

**Real-world example: Multi-factor routing**

```javascript
{
  "segmentName": "intelligent_router",
  "transitions": [
    // VIP customers during business hours → direct to agent
    {
      "resultName": "success",
      "contextKey": "customerType",
      "contextValue": "VIP",
      "contextKey2": "timeOfDay",        // Multiple context checks!
      "contextValue2": "business_hours",
      "nextSegmentName": "vip_agent_queue"
    },
    // VIP customers after hours → priority callback
    {
      "resultName": "success",
      "contextKey": "customerType",
      "contextValue": "VIP",
      "contextKey2": "timeOfDay",
      "contextValue2": "after_hours",
      "nextSegmentName": "vip_callback"
    },
    // High balance customers → special menu
    {
      "resultName": "success",
      "contextKey": "accountBalance",
      "contextComparison": "greaterThan",  // Not just equality!
      "contextValue": "1000",
      "nextSegmentName": "high_value_menu"
    },
    // Default fallback
    {
      "resultName": "success",
      "nextSegmentName": "standard_menu"
    }
  ]
}
```

**Why this is powerful:**

```
Without context-aware routing:
  - Need separate flow for VIP customers
  - Need separate flow for standard customers
  - Need separate flow for after-hours
  - Total: 6 flows (VIP business, VIP after, Standard business, Standard after, etc.)

With context-aware routing:
  - ONE flow handles all scenarios
  - Runtime decides path based on context
  - Much easier to maintain!
```

**Steps:**
1. Call arrives, runtime loads flow for `ACME-BILLING-MAIN`
2. Runtime starts at `initSegment` ("get_language")
3. Caller selects language → transitions to `account_type_check`
4. Segment executes, sets context: `customerType = "PREMIUM"`
5. Runtime evaluates transitions:
   - Result: "success"
   - Context key: "customerType"
   - Context value: "PREMIUM"
6. System finds matching transition:
   - `account_type_check` → result "success" + context "PREMIUM" → `premium_menu`
7. Runtime continues from `premium_menu`

**Fallback:**
- No context match? Use `default` transition (no contextKey)
- No default? Validation warns designer

---

## Technical Architecture

### Runtime Components

**API Layer** (NestJS):
- `SegmentStoreController` - HTTP endpoints (REST)
- `SegmentStoreService` - Business logic and validation
- `FlowService` - Flow-level operations (load, save, publish)
- `FlowExportService` - BFS traversal and export formatting
- `FlowImportService` - Import validation and transactions

**Data Layer** (Prisma ORM → SQL Server):
- Read-heavy workload (runtime reads frequently)
- Writes are transactional (atomic publish, rollback on error)
- Connection pooling for scalability

**Security Layer:**
- Okta JWT authentication
- Role-based access control (SEG_VIEWER, SEG_EDITOR, SEG_ADMIN)
- Customer scope filtering (users see only their customer's data)

### Persistence

**SQL Server Database:**
- **Schema:** `ivr` schema
- **Tables:** Segment, SegmentTransition, Key, DicSegmentType, DicKey, ChangeSet
- **Indexes:** routingId, changeSetId, segmentName
- **Transactions:** SERIALIZABLE isolation for publish workflow

**Soft Delete:**
- `isActive = false` instead of DELETE
- Preserves audit trail
- Allows recovery

### Integration

**Synchronous REST API:**
- Client → Controller → Service → Prisma → Database
- Response time: <500ms for typical queries

**Caching (External):**
- Runtime engines cache published flows
- TTL: 5-15 minutes
- Cache invalidation on publish (future)

---

## Key Design Decisions

### 1. Why Name-Based Transition Resolution

**Problem:** Initially used `nextSegmentId` (UUID). When copying segments from draft to published, UUIDs changed, requiring complex ID mapping.

**Decision:** Use `nextSegmentName` (string) instead.

**Why:**
- Segment names are stable and readable
- No ID mapping during draft → published copy
- Easier debugging
- JSON exports are more portable

**Tradeoff:**
- Renaming a segment requires updating all transitions that reference it
- Slightly more storage (strings vs UUIDs)
- Worth it for the simplicity

---

### 2. Why Draft-First Workflow (ChangeSet)

**Problem:** Need safe way to edit flows without affecting production.

**Decision:** All edits go into draft ChangeSet; published segments have `changeSetId = null`.

**Why:**
- Clear separation between draft and production
- Multiple users can work on different drafts
- Atomic publish (all-or-nothing)
- Easy rollback (discard draft)

**Tradeoff:**
- Adds complexity (track changeSetId)
- Storage for drafts
- Worth it for the safety

---

### 3. Why Context-Aware Routing

**Problem:** Customers want to route based on runtime variables (account type, region, time).

**Decision:** Add `contextKey` field to transitions; support nested context maps in JSON.

**Why:**
- Avoid duplicate flows for similar logic
- Runtime can evaluate context without hardcoded if/else
- Flow Designer can visualize context-based branching

**Tradeoff:**
- More complex validation (check context key uniqueness)
- Runtime must support context evaluation
- Worth it for the flexibility

---

### 4. Why BFS-Ordered Export

**Problem:** Export JSON should be readable and follow logical flow order.

**Decision:** Order segments by breadth-first search (BFS) from `initSegment`.

**Why:**
- Reflects call flow execution order
- Makes JSON diffs more meaningful
- Easier for humans to review

**Tradeoff:**
- Requires BFS algorithm
- May not match designer's preferred ordering (addressed with `segmentOrder` field for UI)

---

### 5. Why Customer Scope Isolation

**Problem:** Multi-tenant system; customers can't see each other's data.

**Decision:** Filter all queries by `oktaGroup` (customer-to-Okta mapping).

**Why:**
- Leverages existing Okta auth
- Database-level isolation (not just UI hiding)
- Works with existing RBAC

**Tradeoff:**
- Requires join to `DicCompanyProject` on every query
- Performance impact mitigated with indexes

---

## Configuration and Extensibility

### What You Can Configure (Dictionary Data)

| What | How | Scope | Example |
|------|-----|-------|---------|
| Segment Types | Rows in `DicSegmentType` | Global (shared) | `menu`, `language`, `transfer` |
| Config Keys | Rows in `DicKey` | Per segment type | Menu has `messageKey`, `maxRetries`, `timeout` |
| Data Types | Rows in `DicKeyType` | Global | `string`, `int`, `bool`, `json`, `decimal` |
| Hooks Schema | JSON Schema in `DicSegmentType.hooksSchema` | Per segment type | Validate custom event handlers |

### What's Static (Code)

| What | Why | Change Process |
|------|-----|----------------|
| Transition resolution | Core business rule | Code deployment |
| Validation rules | Flow integrity | Code deployment |
| BFS traversal | Export/import algorithm | Code deployment |
| RBAC roles | Security policy | Code + database migration |

### Extension Points

1. **New Segment Types** - Add row to `DicSegmentType`, define config keys
2. **New Config Keys** - Add row to `DicKey`, specify data type and validation
3. **Custom Hooks** - Provide JSON Schema in `hooksSchema`
4. **Context Keys** - No schema change needed; just add in transitions

---

## Running This Thing

### Observability

**Logging:**
- Structured logs (JSON format)
- Levels: INFO (flow publish), WARN (validation), ERROR (failures)
- Correlation IDs: `routingId`, `changeSetId`, `user.email`

**Metrics:**
- API latency (p50, p95, p99)
- Database query duration
- Flow validation errors (count, type)
- Draft publish success/failure rate

**Health Checks:**
- `/health` endpoint (database connectivity, auth service)
- Swagger API docs at `/api/docs`

### Failure Modes

| Failure | Detection | Recovery | Prevention |
|---------|-----------|----------|------------|
| Database connection lost | Health check fails | Retry with backoff; alert | Connection pooling, DB replicas |
| Invalid flow structure | Validation fails | Return 400 with details; draft preserved | Client-side validation in UI |
| Concurrent publish | Transaction error | Retry once; 409 Conflict if fails | Optimistic locking (future) |
| Missing segment type | 400 on create | User selects valid type | Fetch types from API first |
| Orphaned segments | Validation warnings | Unreachable segments; designer deletes | Pre-publish reachability check |

### Versioning and Migration

**Flow Schema Versioning:**
- Export JSON includes `version: "1.0.0"`
- Future versions can add fields (backward compatible)
- Import validates version compatibility

**Database Migrations:**
- Prisma migrations for schema changes
- Zero-downtime deployments (blue-green or rolling)
- Backward-compatible columns (nullable until backfilled)

### Security

**Authentication:** Okta JWT tokens (validated by NestJS AuthGuard)

**Authorization:**
- Role-based: SEG_VIEWER (read), SEG_EDITOR (write), SEG_ADMIN (delete, publish)
- Customer-scoped: Users with `okta-{customerId}-flow` group see only their data

**Data Protection:**
- No sensitive data stored (PII is in external systems)
- Audit trail tracks all mutations (createdBy, updatedBy, dateCreated, dateUpdated)

**Input Validation:**
- DTO validation (class-validator)
- SQL injection prevention (Prisma ORM parameterized queries)
- UUID format validation

---

## Limitations and Non-Goals

### Known Limitations

1. **No Real-Time Collaboration** - Multiple users editing same draft can overwrite each other (last write wins)
   - Future: Optimistic locking

2. **Single Active Draft per Routing** - Only one draft ChangeSet per routingId
   - Workaround: Create multiple routingIds for experimentation

3. **No Automatic Rollback** - Once published, must manually create new draft to revert
   - Workaround: Export before publish; re-import if needed

4. **Context Validation is Runtime-Only** - System validates syntax, not semantics (doesn't verify context values match upstream segments)
   - Mitigation: Documentation and designer best practices

5. **No Flow Templates** - Can't create reusable flow templates
   - Workaround: Export existing flow, modify JSON, re-import

### What We Don't Do

| What | Why Not | Alternative |
|------|---------|-------------|
| Execute IVR flows | Runtime is a separate concern | External IVR engine (Genesys, Avaya, etc.) |
| Store audio files | Audio is orthogonal to flow logic | Message Store handles TTS, recordings |
| Authenticate users | Centralized auth is better | Okta + Auth module |
| Schedule time-based flows | Complex scheduling elsewhere | External scheduler (referenced by `schedulerId`) |
| Generate reports | Reporting is cross-cutting | Separate analytics service queries audit tables |

---

## What's Next

### Logical Next Steps

1. **Multi-Draft Support** - Allow multiple drafts per routing (feature branches)
   - Why: Enable parallel experimentation
   - Complexity: Medium (requires draft naming/labeling)

2. **Flow Templates** - Create reusable flow patterns
   - Why: Speed up flow creation for common use cases
   - Complexity: Low (export/import with transformations)

3. **Real-Time Validation in Designer** - WebSocket-based validation as user edits
   - Why: Faster feedback, reduce publish failures
   - Complexity: Medium (requires WebSocket infrastructure)

4. **Automated Testing** - Simulate call paths, verify outcomes
   - Why: Catch errors before runtime
   - Complexity: High (requires test DSL and execution engine)

5. **Flow Versioning History** - Track all published versions with rollback UI
   - Why: Easier recovery from bad deploys
   - Complexity: Medium (store snapshots in `RoutingTableHistory`)

6. **Context Key Schema Validation** - Define expected context keys per routing
   - Why: Prevent typos and mismatched context usage
   - Complexity: Medium (requires context key dictionary)

7. **Performance Optimization** - Caching, read replicas, materialized views
   - Why: Support higher traffic and larger flows
   - Complexity: Medium (infrastructure changes)

### How Design Supports Growth

- **Stateless API** - Horizontal scaling is trivial (add more pods)
- **Name-based transitions** - Easy to refactor flows without breaking references
- **Dictionary-driven config** - New segment types without code changes
- **Draft/publish separation** - Safe experimentation
- **Export/import JSON** - Portable flows across environments

---

## Quick Reference

### Common Segment Types

```
┌───────────────────────────────────────────────────────────────┐
│ SEGMENT TYPE CHEAT SHEET                                      │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│ MESSAGE                                                        │
│  Purpose: Play a message to caller                            │
│  Config: messageKey                                            │
│  Exits: success, error                                         │
│  Example: Welcome greeting, instructions                       │
│                                                                │
│ MENU                                                           │
│  Purpose: Present options, collect DTMF input                  │
│  Config: messageKey, maxRetries, timeout                       │
│  Exits: 0-9, timeout, invalid, max_retries                     │
│  Example: Main menu, language selection                        │
│                                                                │
│ TRANSFER                                                       │
│  Purpose: Transfer to agent or phone number                    │
│  Config: destination, transferType (blind/warm/attended)       │
│  Exits: connected, failed, busy, no_answer                     │
│  Example: Route to billing queue, transfer to supervisor       │
│                                                                │
│ DISCONNECT                                                     │
│  Purpose: End the call                                         │
│  Config: messageKey (optional goodbye message)                 │
│  Exits: (none - terminal)                                      │
│  Example: Goodbye message before hangup                        │
│                                                                │
│ LANGUAGE                                                       │
│  Purpose: Set language for rest of call                        │
│  Config: availableLanguages, defaultLanguage                   │
│  Exits: language codes (nl-BE, fr-BE, en-US)                   │
│  Example: "Press 1 for Dutch, 2 for French"                   │
│                                                                │
│ SCHEDULER                                                      │
│  Purpose: Route based on time/business hours                   │
│  Config: scheduleId, businessHoursSegment, afterHoursSegment   │
│  Exits: business_hours, after_hours, holiday                   │
│  Example: Route differently outside office hours               │
│                                                                │
│ COLLECT_INPUT                                                  │
│  Purpose: Collect digits (account number, PIN, etc.)           │
│  Config: minDigits, maxDigits, timeout, terminatorKey          │
│  Exits: success, timeout, invalid                              │
│  Example: Get account number, collect PIN                      │
│                                                                │
│ INTENT_DETECTION                                               │
│  Purpose: AI-based intent recognition                          │
│  Config: aiModel, confidenceThreshold, apiEndpoint             │
│  Exits: intent names (billing, support, cancel, etc.)          │
│  Example: "Tell me what you need help with"                   │
│                                                                │
│ CRM_LOOKUP                                                     │
│  Purpose: Fetch customer data from CRM                         │
│  Config: apiEndpoint, lookupKey, cacheTimeout                  │
│  Exits: success, not_found, error                              │
│  Sets context: customerType, accountBalance, etc.              │
│                                                                │
│ CALLBACK                                                       │
│  Purpose: Schedule a callback for the customer                 │
│  Config: callbackUrl, confirmMessage, timeSlots                │
│  Exits: scheduled, declined, error                             │
│  Example: "We'll call you back in 30 minutes"                 │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

### Segment Structure at a Glance

```
Segment = {
  segmentId: UUID
  segmentName: "unique_name"
  routingId: "CUSTOMER-PROJECT-FLOW"
  dicSegmentTypeId: <type_id>

  config: [
    { key: "messageKey", value: "WELCOME_MSG" },
    { key: "maxRetries", value: "3" }
  ]

  transitions: [
    { result: "1", nextSegment: "billing" },
    { result: "2", nextSegment: "support" },
    { result: "timeout", nextSegment: "welcome" }
  ]

  changeSetId: NULL (published) | UUID (draft)
  isActive: true | false
}
```

### Key Terms

| Term | Definition |
|------|------------|
| **Segment** | Single step in a call flow (e.g., play message, collect input, transfer) |
| **Segment Type** | Template that defines what a segment can do (e.g., "menu" type) |
| **Config Keys** | Settings a segment needs (e.g., messageKey, maxRetries, timeout) |
| **Transition** | Connection from one segment to another based on result |
| **Result** | Outcome from a segment (e.g., "1", "timeout", "success", "error") |
| **Flow** | Complete call flow graph from init to terminal segments |
| **ChangeSet** | Draft workspace for flow edits; status: draft → published |
| **routingId** | Unique identifier for a call flow (e.g., ACME-BILLING-MAIN) |
| **segmentName** | Human-readable segment identifier (e.g., "welcome", "main_menu") |
| **Context-aware routing** | Transitions that vary based on runtime context (e.g., customer type) |
| **Terminal segment** | Segment that ends the call (disconnect, transfer, callback) |
| **BFS (Breadth-First Search)** | Algorithm for traversing flow graph level by level |

---

## Document Metadata

- **Created**: 2026-01-20
- **Service**: Segment Store (segment-store module)
- **Architecture**: Repository + Domain Service
- **Stack**: NestJS + Prisma ORM + SQL Server
- **Related Docs**:
  - `docs/design/segment-store/INDEX.md` - Technical module docs
  - `services/backend/src/modules/segment-store/` - Implementation
  - `services/backend/prisma/schema.prisma` - Database schema
