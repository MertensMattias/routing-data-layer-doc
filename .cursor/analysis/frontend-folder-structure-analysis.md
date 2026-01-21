# Frontend Folder Structure Analysis

## Current Structure Overview

```
frontend/src/
├── api/                    # ✅ NEW: Centralized API layer
│   ├── client.ts
│   ├── endpoints.ts
│   ├── types.ts
│   └── index.ts
├── app/                    # ⚠️ Mixed: Pages + Components + Hooks
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   ├── config/         # Configuration dialogs
│   │   ├── segment-form/   # Segment form components
│   │   └── *.tsx           # ~50 dialog/component files
│   ├── pages/              # Route pages
│   └── hooks/              # 1 hook (useExportImport)
├── constants/              # ⚠️ Partially redundant with api/
│   └── api.constants.ts
├── contexts/               # ✅ React contexts
│   ├── CompanyProjectContext.tsx
│   └── ErrorContext.tsx
├── features/               # ✅ Feature-based organization
│   └── flow-designer/      # Complete feature module
│       ├── api/            # ❌ DEPRECATED: flow-api.ts
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── stores/
│       ├── types/
│       └── utils/
├── hooks/                  # ✅ Global hooks
│   ├── useAuth.ts
│   ├── useDomainPermissions.ts
│   └── usePermissions.ts
├── lib/                    # ⚠️ EMPTY (api-client moved)
├── services/               # ⚠️ Mixed patterns
│   ├── flows/              # ✅ Module-based services
│   ├── messages/           # ✅ Module-based services
│   ├── segments/           # ✅ Module-based services
│   ├── routing/            # ⚠️ Incomplete (just index.ts)
│   └── *.service.ts        # ⚠️ Legacy flat services
├── styles/                 # ✅ CSS files
├── test/                   # ✅ Test setup
├── types/                  # ⚠️ Type duplication
│   ├── api-types.ts
│   ├── branded-types.ts
│   ├── company-project.types.ts
│   └── query-types.ts
└── utils/                  # ✅ Global utilities
```

---

## Analysis by Category

### 1. API Layer - GOOD with minor issues

**Current State**:
- `api/` folder with centralized endpoints ✅
- `api/client.ts` for Axios instance ✅
- `api/endpoints.ts` for all routes ✅

**Issues**:
- `constants/api.constants.ts` duplicates some endpoint logic
- `features/flow-designer/api/flow-api.ts` still exists (should be deleted)

**Best Practice**: Single `api/` folder for all API concerns.

**Score**: 8/10

---

### 2. Feature Organization - MIXED

**What's Good**:
- `features/flow-designer/` is well-structured with:
  - `components/` (organized by concern: canvas, toolbar, properties)
  - `hooks/` (feature-specific)
  - `pages/` (feature routes)
  - `stores/` (Zustand state)
  - `types/` (feature types)
  - `utils/` (feature utilities)

**Issues**:
- Only ONE feature module (`flow-designer`)
- Other features (messages, segments, routing, config) live in `app/components/` and `app/pages/`
- Inconsistent: flow-designer is feature-based, everything else is page-based

**Best Practice**: All major features should follow the same pattern.

**Score**: 6/10

---

### 3. App Folder - PROBLEMATIC

**Current State**:
```
app/
├── components/     # ~50+ component files (too many at one level)
│   ├── ui/         # shadcn/ui (good)
│   ├── config/     # config-related (good)
│   ├── segment-form/ # segment forms (good)
│   └── *.tsx       # ~40 random dialogs/components
├── pages/          # Route pages (good)
└── hooks/          # Only 1 hook (should be in global hooks/)
```

**Issues**:
1. **Flat component structure**: 40+ files at `components/` root
2. **Mixed concerns**: Dialogs, forms, displays all together
3. **Single hook in app/hooks**: Should be in global `hooks/`
4. **No domain organization**: Components for messages, segments, routing all mixed

**Best Practice**: Organize by domain or component type.

**Score**: 4/10

---

### 4. Services Layer - INCONSISTENT

**Current State**:
```
services/
├── flows/           # ✅ Module-based (5 files)
├── messages/        # ✅ Module-based (10 files)
├── segments/        # ✅ Module-based (6 files)
├── routing/         # ⚠️ Incomplete (just index.ts)
├── audit.service.ts      # Legacy flat
├── changeset.service.ts  # Legacy flat
├── company-project.service.ts  # Legacy flat
├── configuration.service.ts    # Legacy flat
├── export-import.service.ts    # Legacy flat
├── file-handler.service.ts     # Legacy flat
├── health.service.ts           # Legacy flat
└── import-preview.service.ts   # Legacy flat
```

**Issues**:
1. **Mixed patterns**: Module folders + flat files
2. **Incomplete migration**: routing/ folder exists but incomplete
3. **Orphan services**: export-import, file-handler, import-preview not in modules

**Best Practice**: All services in module folders.

**Score**: 6/10

---

### 5. Types - DUPLICATION ISSUES

**Current State**:
```
types/
├── api-types.ts          # Backend DTOs
├── branded-types.ts      # Type branding
├── company-project.types.ts
└── query-types.ts

features/flow-designer/types/
├── flow.types.ts         # ⚠️ Duplicates CompleteFlow from api-types
├── graph.types.ts
└── validation.types.ts

api/types.ts              # ⚠️ Another location for types
```

**Issues**:
1. **Duplicate definitions**: `CompleteFlow` defined in multiple places
2. **Inconsistent locations**: `api/types.ts` vs `types/api-types.ts`
3. **No clear ownership**: Which is source of truth?

**Best Practice**: Single source of truth for each type.

**Score**: 4/10

---

### 6. UI Components - GOOD

**Current State**:
- `app/components/ui/` contains all shadcn/ui components
- ~40 primitive components (button, input, dialog, etc.)

**Best Practice**: Keep UI primitives separate from business components. ✅

**Score**: 9/10

---

## Best Practices Comparison

| Aspect | Best Practice | Current State | Gap |
|--------|--------------|---------------|-----|
| **Feature modules** | All features in `features/` | Only flow-designer | HIGH |
| **API layer** | Single `api/` folder | api/ + constants/ + flow-api.ts | MEDIUM |
| **Services** | All in module folders | Mixed flat + module | MEDIUM |
| **Types** | Single source per domain | Duplicated across locations | HIGH |
| **UI primitives** | Separate from business | `ui/` folder exists | LOW |
| **Page organization** | By route or feature | Mixed in `app/pages/` | MEDIUM |
| **Hooks** | Global + feature-specific | Correct but misplaced | LOW |
| **State management** | Feature stores | Only flow-designer has store | MEDIUM |

---

## Recommended Target Structure

```
frontend/src/
├── api/                           # API layer (KEEP)
│   ├── client.ts
│   ├── endpoints.ts
│   ├── types/                     # Move all API types here
│   │   ├── routing.types.ts
│   │   ├── segments.types.ts
│   │   ├── flows.types.ts
│   │   ├── messages.types.ts
│   │   └── index.ts
│   └── index.ts
│
├── components/                    # Shared components only
│   ├── ui/                        # shadcn/ui primitives (MOVE from app/)
│   ├── layout/                    # Layout components
│   └── common/                    # Shared business components
│
├── features/                      # Feature modules (EXPAND)
│   ├── flow-designer/             # ✅ Already exists
│   ├── routing/                   # NEW: Extract from app/
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   ├── segments/                  # NEW: Extract from app/
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   ├── messages/                  # NEW: Extract from app/
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   └── configuration/             # NEW: Extract from app/
│       ├── components/
│       ├── pages/
│       └── hooks/
│
├── hooks/                         # Global hooks only
│   ├── useAuth.ts
│   └── usePermissions.ts
│
├── services/                      # API services (CLEAN UP)
│   ├── flows/                     # ✅ Keep
│   ├── messages/                  # ✅ Keep
│   ├── segments/                  # ✅ Keep
│   ├── routing/                   # Complete this
│   ├── configuration/             # Move configuration.service.ts here
│   ├── changeset/                 # Move changeset.service.ts here
│   └── shared/                    # export-import, file-handler
│
├── contexts/                      # ✅ Keep as-is
│
├── styles/                        # ✅ Keep as-is
│
├── types/                         # DELETE (move to api/types/)
│
├── utils/                         # ✅ Keep as-is
│
└── app/                           # SIMPLIFY: Only App.tsx + router
    └── App.tsx
```

---

## Priority Issues to Fix

### Priority 1: High Impact, Easy Fix

1. **Delete `features/flow-designer/api/flow-api.ts`**
   - Already migrated to `services/flows/`
   - Just update 3 import statements

2. **Delete `constants/api.constants.ts`**
   - Redundant with `api/endpoints.ts`
   - Update imports to use `api/endpoints`

3. **Consolidate types**
   - Move `types/api-types.ts` to `api/types/`
   - Remove duplicate `CompleteFlow` from `flow.types.ts`

### Priority 2: Medium Impact, Medium Effort

4. **Complete `services/routing/`**
   - Move `routing.service.ts` content into module folder

5. **Organize flat services**
   - `changeset.service.ts` → `services/changeset/`
   - `configuration.service.ts` → `services/configuration/`
   - `export-import.service.ts` + `file-handler.service.ts` → `services/shared/`

6. **Move `app/components/ui/` to `components/ui/`**
   - Shared UI should be at root level

### Priority 3: High Impact, High Effort

7. **Extract features from `app/`**
   - Create `features/routing/` (pages + components)
   - Create `features/segments/` (pages + components)
   - Create `features/messages/` (pages + components)
   - Create `features/configuration/` (pages + components)

8. **Organize `app/components/`**
   - Group remaining dialogs by domain
   - Move shared components to `components/common/`

---

## What's Already Good

1. **Feature module pattern** - flow-designer is well-structured
2. **API centralization** - `api/endpoints.ts` is clean
3. **Service module pattern** - flows/, messages/, segments/ are well-organized
4. **UI primitives** - shadcn/ui in dedicated folder
5. **Global hooks** - Proper separation
6. **Zustand store** - flow-store.ts is well-implemented
7. **Test colocation** - Tests next to implementation

---

## Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Feature modules | 1 | 5 | ⚠️ |
| Flat service files | 8 | 0 | ⚠️ |
| Duplicate type files | 3 | 0 | ⚠️ |
| Deprecated API files | 1 | 0 | ⚠️ |
| Components in app/components/ root | ~40 | ~10 | ⚠️ |

---

## Conclusion

**Overall Score: 6/10**

The codebase shows signs of organic growth with partial modernization:
- Good patterns exist (flow-designer, api/, service modules)
- But inconsistently applied across the codebase
- Main issues: mixed organization styles, type duplication, incomplete migrations

**Recommendation**: Complete the migrations already started:
1. Finish service module pattern for all services
2. Extract remaining features from `app/` to `features/`
3. Consolidate types to single location
4. Clean up deprecated files
