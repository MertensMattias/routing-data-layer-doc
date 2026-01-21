# IVR Management Dashboard - UI Design Document

**Version**: 3.5.0
**Status**: Active Development
**Created**: 2026-01-02
**Last Updated**: 2026-01-20
**Note**: Message Store v5.0.0 migration complete - see Changelog section 16 for details
**Application**: frontend (Vite + React + TypeScript)
**Purpose**: Comprehensive UI design guide for the IVR Management Dashboard

---

## Table of Contents

1. [What This Doc Is](#1-what-this-doc-is)
2. [Design System Foundation](#2-design-system-foundation)
3. [Technology Stack](#3-technology-stack)
4. [Architecture & Structure](#4-architecture--structure)
5. [Authentication & Authorization UI](#5-authentication--authorization-ui)
6. [Core Application Layout](#6-core-application-layout)
7. [Navigation Patterns](#7-navigation-patterns)
8. [Page Layouts & Components](#8-page-layouts--components)
9. [Component Library](#9-component-library)
10. [Forms & Data Entry](#10-forms--data-entry)
11. [Data Display & Tables](#11-data-display--tables)
12. [User Feedback & State Management](#12-user-feedback--state-management)
13. [Responsive Design](#13-responsive-design)
14. [Accessibility](#14-accessibility)
15. [Flow Editor Components (Phases 1-4)](#15-flow-editor-components-phases-1-4)
    - [Phase 1: Viewer Components](#phase-1-viewer-components)
    - [Phase 2: Editing Components](#phase-2-editing-components)
    - [Phase 3/4: Export/Import Components](#flow-editor-export-import-components-phase-34)
16. [Future Enhancements](#16-future-enhancements)
17. [Changelog](#17-changelog)

---

## 1. What This Doc Is

### 1.1 Purpose

This document defines the complete UI/UX design system for the IVR Management Dashboard (frontend). It's the guide for:
- AI agents implementing new features
- Developers extending functionality
- Designers maintaining visual consistency
- Product managers understanding UI capabilities

### 1.2 Current State (v3.5.0)

**Completed Features:**
- ✅ Authentication flow (dev mode + Azure AD)
- ✅ Authorization with permission-based UI (centralized, role-based access control)
- ✅ Shared types package for type consistency across frontend and backend
- ✅ Application layout with sidebar navigation
- ✅ HomePage with health monitoring
- ✅ AdminPage with streamlined tabs (Environment, Security, Audit Log)
- ✅ ConfigurationPage with global settings (Languages, Voices, Projects)
- ✅ MessageSettingsPage with nested settings (Categories, Types)
- ✅ SegmentSettingsPage with nested settings (Segment Types, Key Types)
- ✅ Hierarchical navigation with settings subpages
- ✅ shadcn/ui component library integration
- ✅ API client with interceptors
- ✅ TypeScript type definitions
- ✅ Toast notifications (Sonner)
- ✅ **Flow Editor Phase 1: Viewer Components** (CustomSegmentNode, FlowCanvas, ValidationPanel)
- ✅ **Flow Editor Phase 2: Editing Components** (PropertiesPanel, ConfigEditor, TransitionEditor, SegmentOrderPanel, MessageReferencePanel)
- ✅ **Flow Editor Phase 3/4: Validation & Export/Import** (AdvancedValidationPanel, ExportDialog, MultiModuleImportDialog, ImportPreviewPanel)
- ✅ **Company Project Context Filter** (CompanyProjectHeader, CompanyProjectSelector, context-based data filtering)
- ✅ **Message Store v5.0.0** (Atomic versioning, MessageKey-level management, version history, publish/rollback)
- ✅ **MessagesPage** (Full CRUD, grouped message keys, export/import, multi-language editing)
- ✅ **MessageDetailPage** (Version selector, language tabs, audit history, edit dialogs)

**Integration Status: ~75% Complete**

**Recently Integrated:**
- ✅ Company Project Context Provider (global state management) (v3.3.0)
- ✅ CompanyProjectHeader component (selector + statistics display) (v3.3.0)
- ✅ CompanyProjectSelector component (dropdown with localStorage persistence) (v3.3.0)
- ✅ MessagesPage backend connection with project filtering (v3.3.0)
- ✅ RoutingPage backend connection with project filtering (v3.3.0)
- ✅ Real-time statistics dashboard (v3.3.0)
- ✅ Customer scope-based project filtering (v3.3.0)
- ✅ Centralized authentication with shared types package (v3.4.0)
- ✅ Permission-based UI with domain-specific role checks (v3.4.0)
- ✅ Consistent role handling across frontend and backend (v3.4.0)
- ✅ Message Store v5.0.0 migration (atomic versioning, integer versions 1-10) (v3.5.0)
- ✅ MessageDetailPage with version management (v3.5.0)
- ✅ Complete message CRUD dialogs (Create, Edit, MultiLanguage, Unified) (v3.5.0)
- ✅ Message export/import functionality (v3.5.0)

**Pending Integration:**
- 🟡 SegmentsPage backend connection with project filtering
- 🟡 Flow Editor API integration (currently using mock data)
- 🟡 Search and filtering functionality
- 🟡 Advanced error handling
- 🟡 Testing suite
- 🟡 Mobile optimization

### 1.3 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Permission-First** | Every UI element respects role-based access control |
| **Consistency** | Uniform patterns across all modules |
| **User Feedback** | Loading states, errors, and success confirmations everywhere |
| **Performance** | Optimistic updates, lazy loading, minimal re-renders |
| **Accessibility** | Keyboard navigation, ARIA labels, focus management |
| **Modern UX** | Clean, intuitive interface following Material Design principles |

---

## 2. Design System Foundation

### 2.1 Visual Language

**Design Philosophy:**
- Clean, minimalist interface
- High contrast for readability
- Consistent spacing and typography
- Status-driven color coding
- Subtle animations for state transitions

### 2.2 Color Palette

#### Primary Colors

Use indigo for primary actions and interactive emphasis. Use slate for neutrals and text.

```css
/* Base Colors */
--color-white: #FFFFFF;
--color-black: #000000;

/* Slate Neutral Scale */
--slate-50: #F8FAFC;   /* Backgrounds */
--slate-100: #F1F5F9;  /* Disabled state */
--slate-200: #E2E8F0;  /* Borders */
--slate-400: #94A3B8;  /* Icons */
--slate-500: #64748B;  /* Help text */
--slate-600: #475569;  /* Muted text */
--slate-700: #334155;  /* Secondary text */
--slate-900: #0F172A;  /* Primary text */

/* Indigo Primary */
--indigo-50: #EEF2FF;  /* Hover bg */
--indigo-100: #E0E7FF; /* Badge bg */
--indigo-600: #4F46E5; /* Primary button */
--indigo-700: #4338CA; /* Primary button hover */
--indigo-800: #3730A3; /* Active/pressed */
```

#### Semantic Colors

```css
/* Success */
--emerald-50: #ECFDF5;
--emerald-100: #D1FAE5;
--emerald-600: #059669;
--emerald-700: #047857;

/* Warning */
--amber-50: #FFFBEB;
--amber-100: #FEF3C7;
--amber-600: #D97706;
--amber-700: #B45309;

/* Error/Danger */
--red-50: #FEF2F2;
--red-100: #FEE2E2;
--red-600: #DC2626;
--red-700: #B91C1C;

/* Info */
--indigo-50: #EEF2FF;
--indigo-600: #4F46E5;
```

#### Color Usage Rules

- Use slate instead of gray for all neutrals.
- Use indigo for primary actions, active states, and links.
- Use opacity modifiers for soft backgrounds (e.g., `bg-slate-50/30`, `border-slate-200/60`).
- Use amber for warning states and avoid yellow.
- Always define hover states and focus states for interactive elements.

#### Status Color Mapping

| Status | Background | Text | Border | Usage |
|--------|------------|------|--------|-------|
| **Active** | `bg-emerald-50/50` | `text-emerald-700` | `border-emerald-200` | Active routing entries |
| **Draft** | `bg-indigo-50/70` | `text-indigo-700` | `border-indigo-200` | Draft changeset |
| **Published** | `bg-emerald-50/50` | `text-emerald-700` | `border-emerald-200` | Published flow |
| **Inactive** | `bg-slate-100` | `text-slate-600` | `border-slate-200` | Disabled entries |
| **Error** | `bg-red-50` | `text-red-700` | `border-red-200` | Validation errors |
| **Warning** | `bg-amber-50` | `text-amber-700` | `border-amber-200` | Warnings |
| **Scheduled** | `bg-indigo-50/70` | `text-indigo-700` | `border-indigo-200` | Scheduled changes |

### 2.3 Typography

**Font Stack:**
```css
font-family:
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  "Helvetica Neue",
  Arial,
  sans-serif;
```

**Type Scale:**

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **H1** | `text-3xl` (30px) | `font-bold` | 1.2 | Page titles |
| **H2** | `text-2xl` (24px) | `font-bold` | 1.3 | Section headers |
| **H3** | `text-xl` (20px) | `font-semibold` | 1.4 | Card titles |
| **H4** | `text-lg` (18px) | `font-semibold` | 1.4 | Subsections |
| **Body** | `text-base` (16px) | `font-normal` | 1.5 | Body text |
| **Small** | `text-sm` (14px) | `font-normal` | 1.5 | Helper text |
| **XSmall** | `text-xs` (12px) | `font-normal` | 1.4 | Labels, badges |
| **Code** | `text-sm` | `font-mono` | 1.5 | IDs, technical values |

**Text Color Hierarchy:**
- Primary text: `text-slate-900`
- Secondary text: `text-slate-700`
- Tertiary text: `text-slate-600`
- Disabled text: `text-slate-400`

### 2.4 Spacing System

**Base Unit: 4px**

```css
/* Tailwind Spacing */
p-2   = 8px    /* Tight padding */
p-4   = 16px   /* Standard padding */
p-6   = 24px   /* Card padding */
p-8   = 32px   /* Page padding */

gap-2 = 8px    /* Tight gaps */
gap-4 = 16px   /* Standard gaps */
gap-6 = 24px   /* Section gaps */

mb-2  = 8px    /* Tight spacing */
mb-4  = 16px   /* Standard spacing */
mb-6  = 24px   /* Section spacing */
mb-8  = 32px   /* Large spacing */
```

**Spacing Guidelines:**
- Page container padding: `p-8`
- Card padding: `p-6`
- Form field spacing: `space-y-4`
- Label/input spacing: `space-y-2`
- Button groups: `gap-2` with `flex-wrap` on mobile
- Grid gaps: `gap-6`
- Section margins: `mb-8`
- Dialog content padding: `p-6` with `pr-2` for scroll clearance

### 2.5 Elevation (Shadows)

```css
/* Card shadow */
.shadow-sm {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* Hover shadow */
.shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Dialog/Modal shadow */
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Dropdown shadow */
.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### 2.6 Border Radius

```css
rounded-none = 0px      /* No rounding */
rounded-sm   = 2px      /* Subtle */
rounded      = 4px      /* Standard (buttons, inputs) */
rounded-md   = 6px      /* Cards */
rounded-lg   = 8px      /* Dialogs */
rounded-full = 9999px   /* Pills, badges */
```

### 2.7 Transitions

```css
/* Standard transition */
transition-colors duration-200

/* Interactive elements */
transition-all duration-200

/* Hover states */
hover:bg-indigo-700 hover:shadow-md

/* Focus states */
focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-2
```

---

### 2.8 Routing Data Layer UI Style Guidelines (Segment Dialogs and Forms)

These guidelines refine the base design system for the routing application. They align with existing dialog-heavy workflows and the segment editor patterns used in the frontend.

#### Button Standards

- Minimum height: `min-h-[44px]` for all clickable actions.
- Primary actions use indigo backgrounds; secondary actions use outline styling with slate borders.
- Icon sizes: `h-4 w-4` with `mr-2` for inline button icons.
- Always define hover states and rely on the `disabled` prop for inactive states.

```tsx
<Button className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px]">
  <Save className="h-4 w-4 mr-2" />
  Save
</Button>

<Button
  variant="outline"
  className="border-slate-300 hover:bg-slate-50 min-h-[44px]"
>
  Cancel
</Button>

<Button
  variant="outline"
  className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 min-h-[44px]"
>
  Save as Draft
</Button>

<Button
  variant="ghost"
  className="text-red-600 hover:text-red-700 hover:bg-red-50"
>
  Delete
</Button>
```

#### Form Inputs

- Default borders use slate; focus uses indigo with subtle ring opacity.
- Error states use red borders and red focus rings.
- Disabled inputs use slate backgrounds and muted text.

```tsx
<Input
  className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
  placeholder="Enter value"
/>

<Input className="border-red-500 focus:ring-red-500/20" />

<Input
  disabled
  className="bg-slate-50/50 border-slate-200 text-slate-600"
/>

<Textarea
  rows={3}
  className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
/>

<SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
  <SelectValue placeholder="Select option" />
</SelectTrigger>
```

#### Typography for Forms

```tsx
<h3 className="text-sm font-semibold text-slate-900">Section Title</h3>
<Label className="text-slate-700 font-medium">Field Label</Label>
<p className="text-xs text-slate-500">Helper text.</p>
<p className="text-xs text-red-600">Error message.</p>
```

#### Dialog and Section Layout

- Dialog sizing: `max-w-[95vw] sm:max-w-[700px] lg:max-w-[800px]` with `max-h-[90vh]`.
- Spacing system:
  - Between sections: `space-y-6`
  - Within sections: `space-y-4`
  - Label/input pairs: `space-y-2`
- Scrollable content: use `pr-2 pb-4` to avoid scrollbar overlap.

```tsx
<DialogContent className="max-w-[95vw] sm:max-w-[700px] lg:max-w-[800px] max-h-[90vh] flex flex-col">
  <div className="space-y-6">
    <section className="space-y-4">
      <div className="space-y-2">{/* Field */}</div>
    </section>
  </div>
</DialogContent>
```

#### Cards and Accordions

```tsx
<Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
  <CardContent className="p-0">{/* Content */}</CardContent>
</Card>

<Accordion type="multiple" className="border-0">
  <AccordionItem value="section-id" className="border-slate-200/60 px-6">
    <AccordionTrigger className="hover:text-indigo-600 transition-colors py-5">
      <span className="font-semibold text-slate-900">Section Name</span>
    </AccordionTrigger>
    <AccordionContent className="bg-slate-50/30 px-1 pb-6">
      {/* Content */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

#### Tooltips and Inline Help

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <HelpCircle className="h-4 w-4 text-slate-400 cursor-help" />
  </TooltipTrigger>
  <TooltipContent className="max-w-xs">Helpful explanation.</TooltipContent>
</Tooltip>
```

#### Validation and Feedback

```tsx
{errors.fieldName && <p className="text-xs text-red-600">{errors.fieldName}</p>}

<div className="rounded-md bg-red-50 p-3 border border-red-200">
  <div className="flex">
    <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
    <div className="ml-3">
      <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
      <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
        <li>Provide a valid value.</li>
      </ul>
    </div>
  </div>
</div>
```

#### Empty States

```tsx
<div className="text-center rounded-lg border-2 border-dashed py-6 bg-slate-50 border-slate-200">
  <p className="text-sm text-slate-500">
    No items found. Click "Add" to create one.
  </p>
</div>

<div className="text-center rounded-lg border-2 border-dashed py-6 bg-indigo-50/50 border-indigo-200">
  <p className="text-sm text-slate-500">
    Click "Add" to create your first item.
  </p>
</div>
```

#### Drag and Drop Feedback

```tsx
<div className={isOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200/60'}>
  <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200 rounded">
    <GripVertical className="h-4 w-4 text-slate-400" />
  </div>
</div>
```

## 3. Technology Stack

### 3.1 Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | 6.3.5 | Build tool & dev server |
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.7.3 | Type safety |
| **React Router** | 7.1.3 | SPA routing |
| **Tailwind CSS** | 4.0.7 | Utility-first styling |

### 3.2 UI Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **shadcn/ui** | Latest | Component primitives (Radix UI) |
| **Lucide React** | 0.469.0 | Icon library |
| **Sonner** | 2.0.0 | Toast notifications |
| **Recharts** | 2.15.1 | Data visualization |

### 3.3 State & Data

| Tool | Version | Purpose |
|------|---------|---------|
| **Axios** | 1.7.9 | HTTP client |
| **Zustand** | 5.0.2 | Flow designer state |
| **React Hook Form** | 7.55.0 | Form management |

### 3.4 Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **TypeScript** | Type checking |
| **Vite HMR** | Hot module reload |

---

## 4. Architecture & Structure

### 4.1 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/        # React components
│   │   │   ├── ui/            # shadcn/ui primitives (DO NOT MODIFY)
│   │   │   ├── AppLayout.tsx
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── CompanyProjectHeader.tsx          # NEW (v3.3.0)
│   │   │   ├── CompanyProjectSelector.tsx        # NEW (v3.3.0)
│   │   │   └── ...
│   │   ├── pages/             # Standalone page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── AdminPage.tsx
│   │   │   ├── ConfigurationPage.tsx
│   │   │   └── ...
│   │   ├── features/          # Feature-based modules (v3.5.0)
│   │   │   ├── messages/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── MessagesPage.tsx          # UPDATED (v5.0.0)
│   │   │   │   │   ├── MessageDetailPage.tsx     # NEW (v5.0.0)
│   │   │   │   │   └── MessageSettingsPage.tsx
│   │   │   │   ├── components/
│   │   │   │   │   ├── CreateMessageDialog.tsx
│   │   │   │   │   ├── EditMessageDialog.tsx
│   │   │   │   │   ├── MultiLanguageEditDialog.tsx
│   │   │   │   │   ├── UnifiedEditDialog.tsx
│   │   │   │   │   ├── MessageVersionSelector.tsx
│   │   │   │   │   ├── MessageKeyRow.tsx
│   │   │   │   │   └── ...
│   │   │   │   └── ...
│   │   │   ├── routing/
│   │   │   │   └── pages/
│   │   │   │       └── RoutingPage.tsx           # UPDATED (v3.3.0)
│   │   │   └── segments/
│   │   │       └── pages/
│   │   │       │       ├── SegmentsPage.tsx
│   │   │       │       └── SegmentSettingsPage.tsx
│   │   ├── routes.tsx         # React Router config
│   │   └── App.tsx            # Root component (UPDATED v3.3.0)
│   │
│   ├── contexts/              # React Context providers
│   │   └── CompanyProjectContext.tsx             # NEW (v3.3.0)
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── useAuth.ts
│   │   └── usePermissions.ts                    # UPDATED (v3.4.0) - Uses shared types
│   │
│   ├── lib/                   # Utilities
│   │   ├── api-client.ts      # Axios instance
│   │   └── utils.ts
│   │
│   ├── services/              # API service layers
│   │   ├── company-project.service.ts            # UPDATED (v3.3.0)
│   │   ├── routing.service.ts                    # NEW (v3.3.0)
│   │   ├── flow.service.ts
│   │   ├── health.service.ts
│   │   ├── segments.service.ts
│   │   └── messages.service.ts                   # UPDATED (v3.3.0)
│   │
│   ├── stores/                # Zustand stores
│   │   ├── flow-store.ts
│   │   ├── flow-types.ts
│   │   └── flow-utils.ts
│   │
│   ├── types/                 # TypeScript types
│   │   ├── api-types.ts       # Backend DTO types
│   │   └── company-project.types.ts              # NEW (v3.3.0)
│   │
│   ├── ../../shared/types/    # Shared types package (v3.4.0)
│   │   └── index.ts           # Shared types (AppRole, Permission, etc.)
│   │
│   └── styles/                # Global styles
│       └── index.css          # Tailwind imports
│
├── public/                    # Static assets
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json              # TypeScript config
└── package.json               # Dependencies
```

### 4.2 Component Organization

#### Component Categories

| Category | Location | Examples | Modification |
|----------|----------|----------|--------------|
| **Primitives** | `src/app/components/ui/` | Button, Input, Dialog | ❌ DO NOT MODIFY |
| **Layout** | `src/app/components/` | AppLayout, AuthProvider | ✅ Modify as needed |
| **Pages** | `src/app/pages/` | HomePage, AdminPage | ✅ Modify as needed |
| **Custom** | Create in `src/app/components/` | Custom dialogs, cards | ✅ Create as needed |

### 4.3 File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase.tsx | `AdminPage.tsx`, `CreateRoutingDialog.tsx` |
| **Hooks** | camelCase.ts with `use` prefix | `useAuth.ts`, `usePermissions.ts` |
| **Services** | kebab-case.service.ts | `company-project.service.ts` |
| **Types** | kebab-case.ts | `api-types.ts`, `flow-types.ts` |
| **Utils** | kebab-case.ts | `api-client.ts`, `utils.ts` |

### 4.4 Import Paths

```typescript
// Path aliases configured in vite.config.ts
import { Button } from '@/app/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import * as projectService from '@/services/company-project.service';
import type { CompanyProject } from '@/types/api-types';

// Shared types from monorepo package (v3.4.0)
import { AppRole, Permission } from '../../shared/types';
```

### 4.5 Shared Types Package (v3.4.0)

**Purpose**: Ensures type consistency between frontend and backend for authentication and authorization.

**Location**: `shared/types/` (monorepo root)

**Key Types:**

```typescript
// shared/types/index.ts

/**
 * Application roles aligned with Okta groups
 */
export enum AppRole {
  // Domain-specific roles
  RT_VIEWER = 'rt-viewer',
  RT_EDITOR = 'rt-editor',
  RT_OPS = 'rt-ops',
  RT_ADMIN = 'rt-admin',
  
  MSG_VIEWER = 'msg-viewer',
  MSG_EDITOR = 'msg-editor',
  MSG_OPS = 'msg-ops',
  MSG_ADMIN = 'msg-admin',
  
  SEG_VIEWER = 'seg-viewer',
  SEG_EDITOR = 'seg-editor',
  SEG_OPS = 'seg-ops',
  SEG_ADMIN = 'seg-admin',
  
  // Global role
  GLOBAL_ADMIN = 'global-admin',
}

/**
 * Permission flags for authorization
 */
export enum Permission {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  PUBLISH = 'publish',
  DELETE = 'delete',
  ADMIN = 'admin',
  GLOBAL_ADMIN = 'global-admin',
}
```

**Usage in Frontend:**

```typescript
// Example: AppLayout.tsx
import { AppRole } from '../../shared/types';

const hasGlobalAdmin = user?.roles?.includes(AppRole.GLOBAL_ADMIN);

// Example: usePermissions.ts
import { AppRole, Permission } from '../../shared/types';

const hasRoutingAdmin = user?.roles?.some((role: string) =>
  [AppRole.RT_ADMIN, AppRole.GLOBAL_ADMIN].includes(role as AppRole)
);
```

**Benefits:**
- ✅ Type safety across frontend and backend
- ✅ Single source of truth for role definitions
- ✅ Compile-time checks for role usage
- ✅ Prevents typos in role strings
- ✅ Easy refactoring and IDE autocomplete

---

## 5. Authentication & Authorization UI

### 5.1 Authentication Flow

#### Login Screen

**When**: User has no valid token in localStorage
**Location**: Rendered by `AuthProvider` component
**Design**: Centered card with logo and sign-in button

```typescript
// Visual Structure
┌────────────────────────────────────────┐
│                                        │
│           [App Logo/Icon]              │
│                                        │
│      IVR Management Dashboard          │
│                                        │
│    ┌────────────────────────────┐     │
│    │   [Sign In with Okta]      │     │
│    │   (or "Sign In" in dev)    │     │
│    └────────────────────────────┘     │
│                                        │
│    Environment: development            │
│    Version: 1.0.0                      │
│                                        │
└────────────────────────────────────────┘
```

**Implementation:**

```typescript
// src/app/components/AuthProvider.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Card className="w-96 text-center p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              IVR Management Dashboard
            </h1>
            <p className="text-gray-600">Configuration & Management</p>
          </div>
          <Button onClick={login} className="w-full">
            Sign In
          </Button>
          <p className="text-xs text-gray-500 mt-4">
            Environment: {import.meta.env.MODE}
          </p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
```

### 5.2 User Profile Display

**Location**: Bottom of sidebar in `AppLayout`
**Components**: User icon, name, email, roles, logout button

```typescript
// Visual Structure (Sidebar Footer)
┌──────────────────────────────┐
│  [👤] John Doe               │
│       john.doe@company.com   │
│                              │
│  [admin] [editor]            │
│                              │
│  [Logout] 🚪                 │
│                              │
│  Environment: development    │
│  v1.0.0                      │
└──────────────────────────────┘
```

**Implementation:**

```typescript
// src/app/components/AppLayout.tsx (footer section)
<div className="p-4 border-t border-gray-200">
  <div className="mb-3">
    <div className="flex items-center gap-2 mb-2">
      <User className="w-4 h-4 text-gray-600" />
      <div className="text-sm">
        <p className="font-medium text-gray-900">{user?.name}</p>
        <p className="text-xs text-gray-500">{user?.email}</p>
      </div>
    </div>
    {user?.roles && user.roles.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-2">
        {user.roles.map((role) => (
          <span
            key={role}
            className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"
          >
            {role}
          </span>
        ))}
      </div>
    )}
  </div>
  <button
    onClick={logout}
    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
  >
    <LogOut className="w-4 h-4" />
    <span>Logout</span>
  </button>
  <div className="mt-3 text-xs text-gray-500">
    <p>Environment: {import.meta.env.MODE}</p>
    <p className="mt-1">v1.0.0</p>
  </div>
</div>
```

### 5.3 Permission-Based UI (Updated v3.4.0)

#### Permission Flags

**Implementation**: Uses `usePermissions` hook with shared `AppRole` types from `shared/types` package.

|| Permission | Roles | Usage |
||------------|-------|-------|
|| `canView` | viewer, editor, ops, admin, global-admin | View data, export |
|| `canCreate` | editor, ops, admin, global-admin | Create new entries |
|| `canEdit` | editor, ops, admin, global-admin | Edit existing entries |
|| `canPublish` | ops, admin, global-admin | Publish changesets |
|| `canDelete` | admin, global-admin | Delete entries |
|| `isAdmin` | admin, global-admin | Access admin page |
|| `isGlobalAdmin` | global-admin | Access configuration page, manage system-wide settings |

**Role Hierarchy**: Domain-specific roles are checked per module (routing, messages, segments). Global admin has all permissions across all modules.

**Hook Implementation:**

```typescript
// src/hooks/usePermissions.ts
import { useAuth } from './useAuth';
import { AppRole } from '../../shared/types';

export const usePermissions = () => {
  const { user } = useAuth();
  const userRoles = user?.roles || [];

  // Check domain-specific roles for each module
  const hasRoutingAdmin = userRoles.some((role: string) =>
    [AppRole.RT_ADMIN, AppRole.GLOBAL_ADMIN].includes(role as AppRole)
  );
  
  const hasMessageAdmin = userRoles.some((role: string) =>
    [AppRole.MSG_ADMIN, AppRole.GLOBAL_ADMIN].includes(role as AppRole)
  );
  
  const hasSegmentAdmin = userRoles.some((role: string) =>
    [AppRole.SEG_ADMIN, AppRole.GLOBAL_ADMIN].includes(role as AppRole)
  );

  return {
    canView: userRoles.length > 0,
    canCreate: hasRoutingAdmin || hasMessageAdmin || hasSegmentAdmin,
    canEdit: hasRoutingAdmin || hasMessageAdmin || hasSegmentAdmin,
    canPublish: hasRoutingAdmin || hasMessageAdmin || hasSegmentAdmin,
    canDelete: hasRoutingAdmin || hasMessageAdmin || hasSegmentAdmin,
    isAdmin: hasRoutingAdmin || hasMessageAdmin || hasSegmentAdmin,
    isGlobalAdmin: userRoles.includes(AppRole.GLOBAL_ADMIN),
  };
};
```

#### UI Patterns

**Pattern 1: Hide elements without permission**

```typescript
{permissions.canCreate && (
  <Button onClick={handleCreate}>
    <Plus className="w-4 h-4 mr-2" />
    Create New
  </Button>
)}
```

**Pattern 2: Disable elements without permission**

```typescript
<Button
  onClick={handleDelete}
  disabled={!permissions.canDelete}
  variant={permissions.canDelete ? "default" : "outline"}
>
  Delete
</Button>
```

**Pattern 3: Show access denied message**

```typescript
{!permissions.isAdmin && (
  <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
    <h2 className="font-bold">Access Denied</h2>
    <p>You don't have permission to access this page.</p>
    <p className="text-sm mt-2">Required role: Admin</p>
  </div>
)}
```

**Pattern 4: Navigation filtering (using AppRole enum)**

```typescript
import { AppRole } from '../../shared/types';

const navItems = [
  { path: '/home', label: 'Home', icon: Home, show: true },
  { path: '/routing', label: 'Routing', icon: Workflow, show: permissions.canView },
  { path: '/segments', label: 'Segments', icon: Box, show: permissions.canView },
  { path: '/messages', label: 'Messages', icon: MessageSquare, show: permissions.canView },
  { path: '/config', label: 'Configuration', icon: Wrench, show: permissions.isGlobalAdmin },
  { path: '/admin', label: 'Admin', icon: Settings, show: permissions.isAdmin },
];

// Render only visible items
{navItems.filter(item => item.show).map(item => (
  <Link key={item.path} to={item.path}>
    {item.label}
  </Link>
))}

// Direct role checking (when needed)
const isGlobalAdmin = user?.roles?.includes(AppRole.GLOBAL_ADMIN);
```

---

## 6. Core Application Layout

### 6.1 Application Shell

**Layout Structure:**

```
┌─────────────────────────────────────────────────────────┐
│ Sidebar (264px)        │ Main Content Area              │
│                        │                                │
│ [Logo/Title]           │ ┌─────────────────────────────┤
│                        │ │ Company Project Header      │
│ Navigation Links       │ │ - Project Selector          │
│  • Home                │ │ - Statistics (if selected)   │
│  • Routing             │ │ - Resource Counts           │
│  • Segments            │ │ - Refresh Button            │
│  • Messages            │ └─────────────────────────────┤
│  • Configuration       │                                │
│    (if global-admin)   │ [Page Content]                 │
│  • Admin (if admin)    │                                │
│                        │ - Page Header                  │
│                        │ - Action Buttons               │
│                        │ - Content                      │
│                        │ - Tables/Cards                 │
│ [User Profile]         │                                │
│ [Logout]               │                                │
│ [Version Info]         │                                │
└─────────────────────────────────────────────────────────┘
```

**New Header Component**: `CompanyProjectHeader` provides multi-project filtering and context awareness across all pages.

### 6.2 Sidebar Component

**Fixed Width**: 264px (w-64)
**Background**: White (bg-white)
**Border**: Right border (border-r border-gray-200)

```typescript
// src/app/components/AppLayout.tsx
<aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
  {/* Header */}
  <div className="p-6 border-b border-gray-200">
    <h1 className="text-xl text-gray-900">IVR Routing Manager</h1>
    <p className="text-sm text-gray-500 mt-1">Configuration & Management</p>
  </div>

  {/* Navigation */}
  <nav className="flex-1 p-4">
    <ul className="space-y-2">
      {navItems
        .filter((item) => item.show)
        .map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
    </ul>
  </nav>

  {/* User Profile Footer */}
  {/* See section 5.2 */}
</aside>
```

**Navigation Items:**

|| Icon | Label | Path | Permission | Description |
||------|-------|------|------------|-------------|
|| 🏠 | Home | `/home` | All | Dashboard overview |
|| 🔀 | Routing | `/routing` | canView | Routing configurations |
|| 📦 | Segments | `/segments` | canView | Segment library |
|| 💬 | Messages | `/messages` | canView | Message store |
|| 🔧 | Configuration | `/config` | isGlobalAdmin | System configuration |
|| ⚙️ | Admin | `/admin` | isAdmin | Admin settings |

**Active State:**
- Background: `bg-blue-50`
- Text: `text-blue-700`
- Bold font weight

**Hover State:**
- Background: `hover:bg-gray-100`
- Transition: `transition-colors`

### 6.3 Main Content Area

**Layout**: Flexible width, scrollable
**Background**: Gray-50 (bg-gray-50)
**Overflow**: Auto scroll

```typescript
<main className="flex-1 overflow-auto">
  <Outlet /> {/* React Router outlet */}
</main>
```

### 6.4 Company Project Header Component

**New Component**: `CompanyProjectHeader` (v3.3.0+)

**Purpose**: Enables multi-project filtering across the entire application

**Location**: Integrated into `AppLayout`, displays above page content

**Features:**
- Project selector dropdown with "All Projects" option
- Real-time statistics display (message stores, routing tables, segments)
- Project details display (customer ID, project ID, description)
- Refresh button for statistics
- Error state handling
- Loading states

**Implementation:**

```typescript
<CompanyProjectHeader
  showStats={true}  // Show statistics (default: true)
/>
```

**Data Flow:**
1. User selects project from dropdown
2. `CompanyProjectContext` updates `selectedCompanyProjectId`
3. Selection persists to localStorage
4. Page components detect context change
5. API calls filtered by selected project
6. Statistics updated automatically

**Statistics Display:**

```
┌──────────────────────────────────────────────────┐
│ Projects                                         │
│ View data for selected project / all projects   │
├──────────────────────────────────────────────────┤
│ [Select Project ▼]                              │
├──────────────────────────────────────────────────┤
│ Acme Main Flow (acme)                            │
│ ACME Corporation's main IVR configuration        │
│                                                   │
│ [Messages] [Routing] [Segments]                  │
│    10        15         25                        │
└──────────────────────────────────────────────────┘
```

### 6.5 Company Project Selector Component

**New Component**: `CompanyProjectSelector` (v3.3.0+)

**Purpose**: Dropdown selector for switching between projects

**Location**: Used within `CompanyProjectHeader`

**Features:**
- All available projects (filtered by user's Okta groups)
- "All Projects" option for cross-project viewing
- Customer ID display for clarity
- Loading state with spinner
- Disabled state during API calls
- Optional size prop (sm / default)

**Usage:**

```typescript
<CompanyProjectSelector
  size="default"
  className="w-full"
/>
```

**Values:**
- `"all"` → `null` (view all projects)
- `"<id>"` → Selected project ID
- Persists to localStorage

### 6.6 Page Container Pattern

**Standard page wrapper:**

```typescript
<div className="p-8">
  {/* Page Header */}
  <div className="mb-8">
    <h1 className="text-3xl text-gray-900 mb-2">Page Title</h1>
    <p className="text-gray-600">Page description or breadcrumb</p>
  </div>

  {/* Page Content */}
  {/* Cards, tables, forms, etc. */}
</div>
```

**Note**: Pages are now wrapped with `CompanyProjectHeader`, so header section is handled automatically.

---

## 7. Navigation Patterns

### 7.1 Route Structure

```
/
├── /home                  # Dashboard
├── /routing               # Routing list
│   ├── /create            # (Future) Create routing
│   └── /:id               # (Future) Routing details
├── /segments              # Segments list
│   ├── /create            # (Future) Create segment
│   ├── /settings          # Segment Settings (Segment Types, Key Types)
│   └── /:id               # (Future) Segment details
├── /messages              # Messages list
│   ├── /settings          # Message Settings (Categories, Types)
│   └── /stores/:storeId/messages/:messageKey  # Message details (v5.0.0)
├── /config                # System Configuration (global-admin only)
│   └── tabs: languages, voices, projects
├── /flows                 # (Future) Flow designer
│   └── /:routingId        # (Future) Flow editor
└── /admin                 # Admin settings (admin only)
    └── tabs: environment, security, audit
```

### 7.2 Breadcrumb Pattern (Future)

```typescript
// Future breadcrumb component
<nav className="mb-4">
  <ol className="flex items-center gap-2 text-sm text-gray-600">
    <li><a href="/home" className="hover:text-blue-600">Home</a></li>
    <li>/</li>
    <li><a href="/routing" className="hover:text-blue-600">Routing</a></li>
    <li>/</li>
    <li className="text-gray-900 font-medium">RT-001</li>
  </ol>
</nav>
```

### 7.3 Back Navigation

```typescript
// Standard back button
<Button
  variant="ghost"
  onClick={() => navigate(-1)}
  className="mb-4"
>
  <ArrowLeft className="w-4 h-4 mr-2" />
  Back
</Button>
```

---

## 8. Page Layouts & Components

### 8.1 HomePage (Dashboard)

**Current Implementation**: Health monitoring + mock analytics
**Layout**: Stats grid + charts + health status

```
┌──────────────────────────────────────────────────────────┐
│ Dashboard                                                │
│ Real-time overview of your IVR system                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │
│ │ Active │  │ Queue  │  │ System │  │  Avg   │         │
│ │ Calls  │  │ Load   │  │ Errors │  │  Wait  │         │
│ │  142   │  │   40   │  │    7   │  │ 2m 15s │         │
│ └────────┘  └────────┘  └────────┘  └────────┘         │
│                                                          │
│ ┌─────────────────────────┐ ┌───────────────────────┐  │
│ │ Call Volume & Errors    │ │ Queue Status          │  │
│ │ [Line Chart]            │ │ [List of queues]      │  │
│ │                         │ │                       │  │
│ └─────────────────────────┘ └───────────────────────┘  │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ System Health                                     │   │
│ │ Backend API: ✅ Healthy                           │   │
│ │ Database: ✅ Healthy                              │   │
│ │ Last updated: 16:45:32 • Refreshes every 30s     │   │
│ └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Components Used:**
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- Recharts `AreaChart` for visualization
- Health check status badges
- Auto-refresh logic (30s interval)

**Key Features:**
- ✅ Real-time health monitoring (connected to backend)
- 🟡 Mock analytics data (to be connected)
- ✅ Auto-refresh on health status
- ✅ Color-coded status indicators

### 8.2 AdminPage

**Current Implementation**: Streamlined admin features
**Layout**: Tabs with Environment, Security, and Audit Log

```
┌──────────────────────────────────────────────────────────┐
│ Administration                                           │
│ System configuration and audit management                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [Environment] [Security] [Audit Log]                     │
│ ───────────────────────────────────────────────────     │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 💾 System Information                            │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ Version: 1.0.0        Environment: development   │   │
│ │ API URL: /api/v1      Auth Mode: development     │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Components Used:**
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` (for Audit Log)
- `Button` with icons
- Toast notifications for feedback

**Key Features:**
- ✅ Environment info display
- ✅ Security settings (audit logging status)
- ✅ Fully integrated Audit Log with filters, pagination, CSV export
- ✅ Permission checks (admin only)
- **Note**: Company Projects moved to ConfigurationPage

### 8.3 ConfigurationPage

**Current Implementation**: System-wide configuration
**Layout**: Tabs with Languages, Voices, and Projects

```
┌──────────────────────────────────────────────────────────┐
│ System Configuration                                     │
│ Manage system-wide configuration                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [Languages] [Voices] [Projects]                          │
│ ───────────────────────────────────────────────────     │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 🏢 Company Projects           [+ New Project]    │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ Customer │ Project │ Display Name    │ Actions   │   │
│ │ ──────────────────────────────────────────────   │   │
│ │ EEBL     │ ENERGY  │ EEBL Energy     │ [✏️] [🗑️] │   │
│ │ ACME     │ MAIN    │ ACME Main Flow  │ [✏️] [🗑️] │   │
│ └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Components Used:**
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- Reusable tab components: `LanguageTab`, `VoiceTab`, `CompanyProjectsTab`
- Full CRUD functionality in each tab

**Key Features:**
- ✅ Languages management (system-wide)
- ✅ Voices configuration (TTS settings)
- ✅ Company Projects CRUD (moved from AdminPage)
- ✅ Permission checks (global-admin only)

### 8.4 RoutingPage

**Current Status**: ✅ Backend integrated (v3.3.0+)
**Layout**: Search bar + table + stats
**Data Source**: `/api/v1/routing` endpoint with company project filtering

```
┌──────────────────────────────────────────────────────────┐
│ Routing Management                                       │
│ Search and manage IVR routing configurations             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Search Routing Configuration                     │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ 🔍 [Search by routing ID, source ID...]          │   │
│ │ [Advanced Filters] [Export] [+ Create Routing]   │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Routing Configurations (5)                       │   │
│ ├──────────────────────────────────────────────────┤   │
│ │                                                   │   │
│ │ Routing ID│ Source │ Routing │ Initial Seg│Status │   │
│ │ ──────────────────────────────────────────────   │   │
│ │ RT-001    │ 555-..│ sales_rt│ welcome   │Active │   │
│ │ RT-002    │ 555-..│ support │ main_menu │Active │   │
│ │                                                   │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────┐  ┌────────┐  ┌────────┐                      │
│ │   5    │  │   4    │  │   3    │                      │
│ │ Total  │  │ Active │  │With    │                      │
│ │Entries │  │ Routes │  │Messages │                      │
│ └────────┘  └────────┘  └────────┘                      │
└──────────────────────────────────────────────────────────┘
```

**Integration Status (v3.3.0):**
- ✅ Connect to `/api/v1/routing` endpoint
- ✅ Company project filtering via context
- ✅ Dynamic data loading with loading/error states
- ✅ Search by routing table ID, source ID, routing ID
- ✅ Real-time stats calculation
- ✅ Status display (Active/Inactive)

**Pending Integration:**
- 🟡 Implement create/edit routing dialogs
- 🟡 Add ChangeSet workflow UI
- 🟡 Link to flow designer
- 🟡 Add pagination
- 🟡 Add advanced filtering

### 8.5 SegmentsPage

**Current Status**: Mock data, needs backend integration
**Layout**: Type filters + table + stats + settings navigation

```
┌──────────────────────────────────────────────────────────┐
│ Segments        [⚙️ Settings] [+ Create Segment]         │
│ Manage IVR segments, types, and configurations           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 🔍 [Search segments...]                          │   │
│ │ [All] [Menu] [Say] [Scheduler] [Queue] [Collect]│   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Segment Configurations (8)                       │   │
│ ├──────────────────────────────────────────────────┤   │
│ │                                                   │   │
│ │ ID     │ Name    │ Type   │ Status │ Actions    │   │
│ │ ──────────────────────────────────────────────   │   │
│ │ SEG-001│ Main    │ Menu   │ Active │ [👁️][✏️][🗑️]│   │
│ │ SEG-002│ Sales   │ Say    │ Active │ [👁️][✏️][🗑️]│   │
│ │                                                   │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │
│ │   8    │  │   2    │  │   6    │  │   1    │         │
│ │ Total  │  │ Menu   │  │ Active │  │ Draft  │         │
│ │Segments│  │Segments│  │Segments│  │Segments│         │
│ └────────┘  └────────┘  └────────┘  └────────┘         │
└──────────────────────────────────────────────────────────┘
```

**Pending Integration:**
- 🟡 Connect to `/api/v1/segments` endpoint
- 🟡 Implement create/edit/delete dialogs
- 🟡 Add segment configuration panels
- 🟡 Add transition management
- 🟡 Add segment type filtering
- 🟡 Add routing ID selector

### 8.7 MessagesPage (v5.0.0)

**Current Status**: ✅ Fully integrated (v5.0.0)
**Layout**: Message store selector + search + grouped message keys table + stats + settings navigation
**Data Source**: `/messages/stores/{storeId}/message-keys` endpoint (v5.0.0 API) with company project filtering
**File Location**: `frontend/src/features/messages/pages/MessagesPage.tsx`

```
┌──────────────────────────────────────────────────────────┐
│ Messages  [⚙️ Settings] [Export] [Import] [+ Create]     │
│ Manage audio files and text-to-speech messages           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Message Store: [Select Store ▼] [+ New Store]    │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 🔍 [Search messages by key...] [🔄 Refresh]      │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Message Library (6 messages, 18 translations)    │   │
│ ├──────────────────────────────────────────────────┤   │
│ │                                                   │   │
│ │ [▼] │ Key     │ Type │ Languages      │ Status  │   │
│ │ ──────────────────────────────────────────────   │   │
│ │ [▶] │ WELCOME │ TTS  │ [nl-BE][fr-BE] │ v2      │   │
│ │     │ MENU    │ TTS  │ [nl-BE][en-GB]  │ Draft   │   │
│ │                                                   │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────┐  ┌────────┐  ┌────────┐                      │
│ │   6    │  │   18   │  │   4    │                      │
│ │Message │  │ Total  │  │Published                      │
│ │ Keys   │  │Transl. │  │                               │
│ └────────┘  └────────┘  └────────┘                      │
└──────────────────────────────────────────────────────────┘
```

**Key Features (v5.0.0):**
- ✅ **MessageKey-level grouping**: Messages grouped by key (not per-language)
- ✅ **Atomic versioning**: All languages versioned together (v5.0.0 model)
- ✅ **Integer versions**: Published version shown as integer (1-10) or "Draft"
- ✅ **Multi-language display**: All languages shown as badges in grouped rows
- ✅ **Expandable rows**: Click to expand/collapse language details

**Integration Status (v5.0.0):**
- ✅ Connect to `/api/v1/messages/stores/{storeId}/message-keys` endpoint (v5.0.0)
- ✅ Company project filtering via context
- ✅ Dynamic message store loading
- ✅ Message listing per store (grouped by key)
- ✅ Search by message key (client-side filtering)
- ✅ Status display (Published version number or "Draft")
- ✅ Project switching resets store selection
- ✅ **Create message dialog** (`CreateMessageDialog`)
- ✅ **Edit dialogs** (`EditMessageDialog`, `UnifiedEditDialog`, `MultiLanguageEditDialog`)
- ✅ **Version history viewer** (`MessageVersionSelector`)
- ✅ **Publish/rollback buttons** (in `MessageVersionSelector`)
- ✅ **Language selector** (in edit dialogs)
- ✅ **Export/Import functionality** (`MessageExportDialog`, `MessageImportPreview`)
- ✅ **Message store management** (`MessageStoreSelector`, `MessageStoreList`)

**Components Used:**
- `MessageStoreSelector` - Store dropdown selector with localStorage persistence
- `MessageStoreList` - Store list dialog with create/edit/delete/reactivate
- `MessageStoreDialog` - Create/edit message store dialog
- `MessageKeyRow` - Grouped message key row with expandable language details
- `CreateMessageDialog` - Create new message key with multi-language support
- `EditMessageDialog` - Single-language edit dialog (creates new atomic version)
- `UnifiedEditDialog` - Quick single-language edit from list page
- `MultiLanguageEditDialog` - Atomic multi-language edit (all languages together)
- `MessageVersionSelector` - Version dropdown with publish/rollback controls
- `MessageVersionsDialog` - Full version history dialog
- `MessageVersionDetailsDialog` - Version details viewer dialog
- `MessageAuditViewer` - Audit history viewer with filtering
- `MessageExportDialog` - Export messages to JSON with filtering options
- `MessageImportPreview` - Preview import before applying changes
- `TypeSettingsEditor` - Dynamic form editor for message type-specific settings
- `ImportDialog` - Generic import dialog wrapper (shared component)

**Statistics Cards:**
- **Message Keys**: Total number of unique message keys
- **Total Translations**: Sum of all language translations across all keys
- **Published**: Number of message keys with published versions

**Navigation:**
- ✅ Settings button (gear icon) links to `/messages/settings`
- ✅ Click message key row navigates to `/messages/stores/{storeId}/messages/{messageKey}`
- ✅ Export/Import buttons in header

**Pending Features:**
- 🟡 Audio player for playback (not yet implemented)

### 8.8 MessageDetailPage (v5.0.0)

**Current Status**: ✅ Fully implemented (v5.0.0)
**Layout**: Message metadata + version selector + language tabs + edit dialogs + audit panel
**Route**: `/messages/stores/:storeId/messages/:messageKey`
**File Location**: `frontend/src/features/messages/pages/MessageDetailPage.tsx`

```
┌──────────────────────────────────────────────────────────┐
│ [← Back]  Message: WELCOME                    [📋 Audit] │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Message Key: WELCOME                             │   │
│ │ Type: TTS | Category: Welcome                    │   │
│ │ Published: v2 | Latest: v3 (Draft)               │   │
│ │ Created: 2026-01-15 | Updated: 2026-01-20        │   │
│ │ [✏️ Edit All Languages] [✏️ Edit nl-BE]          │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Version: [v3 ▼] [📤 Publish] [↩️ Rollback]       │   │
│ │ v1 (2026-01-15) | v2 (Published) | v3 (Draft)    │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ [nl-BE] [fr-BE] [en-GB]                          │   │
│ │ ──────────────────────────────────────────────   │   │
│ │                                                   │   │
│ │ Content (nl-BE):                                  │   │
│ │ Welkom bij onze klantenservice...                │   │
│ │                                                   │   │
│ │ Type Settings: { "voice": "nl-BE-Wavenet-A" }    │   │
│ │                                                   │   │
│ └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Key Features (v5.0.0):**
- ✅ **Message metadata display**: Key, type, category, description, created/updated dates
- ✅ **Version selector**: View/select/publish versions (integer 1-10)
- ✅ **Language tabs**: Switch between languages in current version
- ✅ **Edit dialogs**: Single-language (`EditMessageDialog`) and multi-language (`MultiLanguageEditDialog`)
- ✅ **Audit history panel**: Side panel with complete audit trail
- ✅ **Publish/Rollback**: Version management controls
- ✅ **Published version indicator**: Shows integer version number or "Draft"

**Components Used:**
- `MessageVersionSelector` - Version dropdown with publish/rollback buttons
- `EditMessageDialog` - Single-language edit (creates new atomic version)
- `MultiLanguageEditDialog` - Edit all languages atomically
- `AuditSidePanel` - Audit history viewer (reusable component)
- `Tabs` (shadcn/ui) - Language switching tabs

**Integration Status:**
- ✅ Load message key via `/messages/stores/{storeId}/message-keys/{messageKey}` (v5.0.0 API)
- ✅ Load versions via `/messages/stores/{storeId}/message-keys/{messageKey}/versions`
- ✅ Load audit history via `/messages/stores/{storeId}/message-keys/{messageKey}/audit`
- ✅ Publish version via `/messages/stores/{storeId}/message-keys/{messageKey}/publish`
- ✅ Rollback version via `/messages/stores/{storeId}/message-keys/{messageKey}/rollback`
- ✅ Create new version via `/messages/stores/{storeId}/message-keys/{messageKey}/versions`

**Navigation:**
- ✅ Back button navigates to `/messages`
- ✅ URL supports `?lang=nl-BE` parameter for default language
- ✅ Auto-selects store default language if no lang param provided

**Atomic Versioning Behavior:**
- Editing any language creates a new version with ALL languages
- Previous version's languages are preserved (unchanged languages copied)
- Only modified language content is updated
- New version remains draft until published
- Publishing sets `MessageKey.publishedVersion` to integer (1-10)

### 8.9 MessageSettingsPage

**Current Implementation**: Message-related configuration
**Layout**: Back navigation + tabs for Message Categories and Message Types

```
┌──────────────────────────────────────────────────────────┐
│ [← Back to Messages]                                     │
│ Message Settings                                         │
│ Manage message categories and types                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [Message Categories] [Message Types]                     │
│ ───────────────────────────────────────────────────     │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 📁 Message Categories         [+ New Category]    │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ Category ID │ Display Name    │ Actions          │   │
│ │ ────────────────────────────────────────────     │   │
│ │ GREETING    │ Greeting Msgs   │ [✏️] [🗑️]        │   │
│ │ MENU        │ Menu Messages   │ [✏️] [🗑️]        │   │
│ │ ERROR       │ Error Messages  │ [✏️] [🗑️]        │   │
│ └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Components Used:**
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Button` with ArrowLeft icon for back navigation
- Reusable tab components: `MessageCategoryTab`, `MessageTypeTab`
- Full CRUD functionality

**Key Features:**
- ✅ Message Categories CRUD (fully connected)
- ✅ Message Types CRUD (fully connected)
- ✅ Back navigation to MessagesPage
- ✅ Permission checks (global-admin only)

---

## 9. Component Library

### 9.1 shadcn/ui Components

**Location**: `src/app/components/ui/`
**Rule**: ❌ **DO NOT MODIFY** these components

**Available Components:**

| Component | File | Usage |
|-----------|------|-------|
| **Button** | `button.tsx` | Primary actions, secondary actions, links |
| **Input** | `input.tsx` | Text fields, numbers, email |
| **Label** | `label.tsx` | Form field labels |
| **Select** | `select.tsx` | Dropdown selectors |
| **Dialog** | `dialog.tsx` | Modal dialogs, confirmations |
| **Card** | `card.tsx` | Content containers |
| **Table** | `table.tsx` | Data tables |
| **Tabs** | `tabs.tsx` | Tab navigation |
| **Badge** | `badge.tsx` | Status indicators, tags |
| **Switch** | `switch.tsx` | Toggle switches |
| **Tooltip** | `tooltip.tsx` | Hover information |

### 9.2 Button Component

**Variants:**

```typescript
// Primary button (default)
<Button>Click Me</Button>

// Secondary/outline button
<Button variant="outline">Cancel</Button>

// Ghost button (minimal)
<Button variant="ghost">Close</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Link button
<Button variant="link">Learn More</Button>
```

**Sizes:**

```typescript
// Small
<Button size="sm">Small</Button>

// Default
<Button>Default</Button>

// Large
<Button size="lg">Large</Button>

// Icon only
<Button size="icon"><Plus className="w-4 h-4" /></Button>
```

**With Icons:**

```typescript
<Button>
  <Plus className="w-4 h-4 mr-2" />
  Create New
</Button>

<Button>
  Save
  <Check className="w-4 h-4 ml-2" />
</Button>
```

**States:**

```typescript
// Loading state
<Button disabled>
  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  Loading...
</Button>

// Disabled
<Button disabled>Disabled</Button>
```

### 9.3 Input Component

**Basic Input:**

```typescript
<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input
    id="name"
    type="text"
    placeholder="Enter name"
  />
</div>
```

**Input Types:**

```typescript
// Text
<Input type="text" />

// Email
<Input type="email" />

// Number
<Input type="number" />

// Password
<Input type="password" />

// Search
<Input type="search" />
```

**With Error:**

```typescript
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    className="border-red-500"
  />
  <p className="text-sm text-red-600">Invalid email address</p>
</div>
```

### 9.4 Dialog Component

**Basic Dialog:**

```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description text here.
      </DialogDescription>
    </DialogHeader>

    {/* Dialog content */}
    <div className="space-y-4 py-4">
      {/* Form fields, etc. */}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Confirmation Dialog Pattern:**

```typescript
<Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete this item? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setDeleteConfirm(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 9.5 Card Component

**Basic Card:**

```typescript
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

**Stats Card Pattern:**

```typescript
<Card>
  <CardContent className="pt-6">
    <div className="text-2xl text-gray-900">142</div>
    <p className="text-sm text-gray-600 mt-1">Active Calls</p>
  </CardContent>
</Card>
```

**Interactive Card:**

```typescript
<Card className="cursor-pointer hover:shadow-md transition-shadow">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm">Card Title</CardTitle>
    <Activity className="h-4 w-4 text-blue-600" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl">Value</div>
    <p className="text-xs text-gray-500 mt-1">Subtitle</p>
  </CardContent>
</Card>
```

### 9.6 Table Component

**Standard Table:**

```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.value}</TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">Edit</Button>
            <Button variant="ghost" size="sm">Delete</Button>
          </div>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Empty State:**

```typescript
{data.length === 0 && (
  <TableBody>
    <TableRow>
      <TableCell colSpan={3} className="text-center py-8 text-gray-500">
        No items found. Create one to get started.
      </TableCell>
    </TableRow>
  </TableBody>
)}
```

### 9.7 Toast Notifications (Sonner)

**Location**: Configured in `App.tsx` with `<Toaster />`

**Usage:**

```typescript
import { toast } from 'sonner';

// Success
toast.success('Item created successfully');

// Error
toast.error('Failed to save: ' + errorMessage);

// Info
toast.info('Processing your request...');

// Warning
toast.warning('This action cannot be undone');

// Loading with dismiss
const toastId = toast.loading('Saving changes...');
// Later...
toast.dismiss(toastId);
toast.success('Saved!');
```

**Best Practices:**
- ✅ Show success after create/update/delete
- ✅ Show specific error messages
- ✅ Use loading toast for operations >2 seconds
- ❌ Don't show toast for every read operation
- ❌ Don't show generic "Error occurred"

---

## 10. Forms & Data Entry

### 10.1 Form Structure Pattern

**Standard Form Layout:**

```typescript
<form onSubmit={handleSubmit} className="space-y-4">
  {/* Form Fields */}
  <div className="space-y-2">
    <Label htmlFor="field1">Field Label *</Label>
    <Input
      id="field1"
      value={formData.field1}
      onChange={(e) => setFormData({ ...formData, field1: e.target.value })}
      placeholder="Enter value"
    />
    <p className="text-xs text-gray-500">Helper text</p>
    {errors.field1 && (
      <p className="text-sm text-red-600">{errors.field1}</p>
    )}
  </div>

  {/* Submit Buttons */}
  <div className="flex gap-2 justify-end">
    <Button type="button" variant="outline" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit">
      Save
    </Button>
  </div>
</form>
```

### 10.2 React Hook Form Integration

**Basic Usage:**

```typescript
import { useForm } from 'react-hook-form';

interface FormData {
  name: string;
  email: string;
}

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      await apiService.create(data);
      toast.success('Saved successfully');
    } catch (error) {
      toast.error('Failed to save: ' + getApiErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register('name', { required: 'Name is required' })}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### 10.3 Validation Patterns

**Backend Validation Rules:**

| Field Type | Pattern | Example |
|------------|---------|---------|
| **Customer ID** | `^[A-Z][A-Z0-9_]*$` | EEBL, ACME |
| **Project ID** | `^[A-Z][A-Z0-9_]*$` | ENERGYLINE, MAIN |
| **Segment Name** | `^[a-z][a-z0-9_]*$` | main_menu, billing_queue |
| **Message Key** | `^[A-Z][A-Z0-9_]*$` | WELCOME_MSG, MENU_PROMPT |
| **Email** | Standard email regex | user@company.com |

**Frontend Validation:**

```typescript
// Required field
{...register('field', { required: 'Field is required' })}

// Pattern validation
{...register('customerId', {
  required: 'Customer ID is required',
  pattern: {
    value: /^[A-Z][A-Z0-9_]*$/,
    message: 'Must be UPPERCASE alphanumeric'
  }
})}

// Min/Max length
{...register('name', {
  required: 'Name is required',
  minLength: { value: 3, message: 'Minimum 3 characters' },
  maxLength: { value: 50, message: 'Maximum 50 characters' }
})}

// Custom validation
{...register('email', {
  validate: async (value) => {
    const exists = await checkEmailExists(value);
    return !exists || 'Email already in use';
  }
})}
```

### 10.4 Company Project Context Usage

**New Pattern (v3.3.0)**: Global project filtering

**Access Context in Components:**

```typescript
import { useCompanyProjectContext } from '@/contexts/CompanyProjectContext';

function MyComponent() {
  const {
    selectedCompanyProjectId,           // number | null
    availableProjects,                  // CompanyProject[]
    stats,                              // CompanyProjectStats[]
    isLoading,
    isLoadingStats,
    error,
    setSelectedCompanyProjectId,        // (id: number | null) => void
    refreshProjects,                    // () => Promise<void>
    refreshStats,                       // () => Promise<void>
    getCurrentProject,                  // () => CompanyProject | null
  } = useCompanyProjectContext();

  // Use in useEffect to reload data when project changes
  useEffect(() => {
    loadData(); // Your data loading function
  }, [selectedCompanyProjectId]);
}
```

**Common Usage Patterns:**

**Pattern 1: Pass Project ID to API Calls**

```typescript
const loadData = async () => {
  const data = await listMessageStores(
    undefined,
    selectedCompanyProjectId ?? undefined  // null = all projects
  );
  setData(data);
};
```

**Pattern 2: Display Selected Project Info**

```typescript
const project = getCurrentProject();
if (project) {
  return (
    <div>
      <h2>{project.displayName}</h2>
      <p>{project.description}</p>
    </div>
  );
}
```

**Pattern 3: Reset Selection on Project Change**

```typescript
useEffect(() => {
  // When project changes, reset selected sub-item
  setSelectedStoreId(null);
  setMessages([]);
  loadMessageStores();
}, [selectedCompanyProjectId]);
```

**Pattern 4: Display Project Statistics**

```typescript
const currentStats = selectedCompanyProjectId
  ? stats.find((s) => s.companyProjectId === selectedCompanyProjectId)
  : null;

return (
  <div className="grid grid-cols-3 gap-4">
    <StatCard label="Messages" value={currentStats?.messageStoreCount} />
    <StatCard label="Routing" value={currentStats?.routingTableCount} />
    <StatCard label="Segments" value={currentStats?.segmentCount} />
  </div>
);
```

### 10.5 Form Field Types

#### Text Input

```typescript
<div className="space-y-2">
  <Label htmlFor="name">Name *</Label>
  <Input
    id="name"
    type="text"
    placeholder="Enter name"
    value={value}
    onChange={(e) => setValue(e.target.value)}
  />
  <p className="text-xs text-gray-500">Helper text</p>
</div>
```

#### Select Dropdown

```typescript
<div className="space-y-2">
  <Label htmlFor="type">Type *</Label>
  <Select value={type} onValueChange={setType}>
    <SelectTrigger>
      <SelectValue placeholder="Select type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="menu">Menu</SelectItem>
      <SelectItem value="say">Say</SelectItem>
      <SelectItem value="queue">Queue</SelectItem>
    </SelectContent>
  </Select>
</div>
```

#### Checkbox/Switch

```typescript
<div className="flex items-center justify-between">
  <Label htmlFor="active">Active</Label>
  <Switch
    id="active"
    checked={isActive}
    onCheckedChange={setIsActive}
  />
</div>
```

#### Textarea

```typescript
<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <textarea
    id="description"
    rows={4}
    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
  />
</div>
```

---

## 11. Data Display & Tables

### 11.1 Standard Table Pattern

**Full Implementation:**

```typescript
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Items ({data.length})</CardTitle>
      {permissions.canCreate && (
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New
        </Button>
      )}
    </div>
  </CardHeader>
  <CardContent>
    {loading && (
      <div className="text-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    )}

    {!loading && data.length === 0 && (
      <div className="text-center py-12 text-gray-500">
        No items found. Create one to get started.
      </div>
    )}

    {!loading && data.length > 0 && (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column 1</TableHead>
            <TableHead>Column 2</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 text-xs rounded ${
                  item.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  {permissions.canEdit && (
                    <Button variant="ghost" size="sm">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  {permissions.canDelete && (
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </CardContent>
</Card>
```

### 11.2 Status Badges

```typescript
// Active status
<span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
  Active
</span>

// Draft status
<span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
  Draft
</span>

// Error status
<span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
  Error
</span>

// Inactive status
<span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
  Inactive
</span>
```

### 11.3 Data Grid (Stats Cards)

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <Card>
    <CardContent className="pt-6">
      <div className="text-2xl text-gray-900">142</div>
      <p className="text-sm text-gray-600 mt-1">Active Calls</p>
    </CardContent>
  </Card>

  <Card>
    <CardContent className="pt-6">
      <div className="text-2xl text-gray-900">40</div>
      <p className="text-sm text-gray-600 mt-1">Queue Load</p>
    </CardContent>
  </Card>

  {/* More cards... */}
</div>
```

### 11.4 List with Details

```typescript
<div className="space-y-4">
  {items.map((item) => (
    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="text-sm text-gray-900 font-medium">{item.name}</p>
        <p className="text-xs text-gray-500">Additional info</p>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-900">{item.value}</div>
        <div className="text-xs text-gray-600">{item.status}</div>
      </div>
    </div>
  ))}
</div>
```

---

## 12. User Feedback & State Management

### 12.1 Loading States

**Full Page Loading:**

```typescript
{loading && (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
)}
```

**Section Loading:**

```typescript
{loading && (
  <div className="text-center py-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
    <p className="mt-4 text-gray-600">Loading data...</p>
  </div>
)}
```

**Button Loading:**

```typescript
<Button disabled={loading}>
  {loading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : (
    <>
      <Save className="w-4 h-4 mr-2" />
      Save
    </>
  )}
</Button>
```

**Skeleton Loaders (Future):**

```typescript
<div className="space-y-4">
  {[...Array(5)].map((_, i) => (
    <div key={i} className="flex items-center space-x-4">
      <div className="h-12 w-12 bg-gray-200 rounded animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </div>
  ))}
</div>
```

### 12.2 Error States

**Full Page Error:**

```typescript
{error && (
  <div className="p-8">
    <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
      <h2 className="font-bold text-lg mb-2">Error Loading Data</h2>
      <p>{error}</p>
      <Button onClick={retry} variant="outline" className="mt-4">
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </Button>
    </div>
  </div>
)}
```

**Inline Error:**

```typescript
{error && (
  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded">
    <p className="text-sm">{error}</p>
  </div>
)}
```

**Field Error:**

```typescript
{errors.field && (
  <p className="text-sm text-red-600 mt-1">{errors.field.message}</p>
)}
```

### 12.3 Empty States

**Standard Empty State:**

```typescript
{data.length === 0 && (
  <div className="text-center py-12">
    <p className="text-gray-500 mb-4">No items found</p>
    {permissions.canCreate && (
      <Button onClick={handleCreate}>
        <Plus className="w-4 h-4 mr-2" />
        Create First Item
      </Button>
    )}
  </div>
)}
```

**Search Empty State:**

```typescript
{filteredData.length === 0 && (
  <div className="text-center py-12">
    <p className="text-gray-500 mb-2">No results found for "{searchQuery}"</p>
    <Button variant="outline" onClick={() => setSearchQuery('')}>
      Clear Search
    </Button>
  </div>
)}
```

### 12.4 Success States

**Success Message:**

```typescript
{success && (
  <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded">
    <p className="text-sm">✓ Item created successfully</p>
  </div>
)}
```

**Toast Notification (Preferred):**

```typescript
toast.success('Item created successfully');
```

---

## 13. Responsive Design

### 13.1 Breakpoints

```css
/* Tailwind CSS Breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### 13.2 Responsive Grid

```typescript
// Single column on mobile, 2 on tablet, 4 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Grid items */}
</div>

// Single column on mobile, 3 on desktop
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>
```

### 13.3 Responsive Layout

**Current State**: Optimized for desktop (1024px+)
**Future**: Mobile optimization needed (Task #15)

**Desktop-first approach:**
- Fixed sidebar (264px)
- Flexible main content
- Multi-column grids
- Full-size tables

**Mobile considerations (future):**
- Collapsible sidebar
- Single-column layouts
- Horizontal scrolling tables
- Touch-friendly buttons (min 44px)

---

## 14. Accessibility

### 14.1 Keyboard Navigation

**Requirements:**
- ✅ All interactive elements focusable
- ✅ Logical tab order
- ✅ Visible focus indicators
- ✅ Escape key closes dialogs
- ✅ Enter key submits forms

**Focus Styles:**

```css
/* Standard focus ring */
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2

/* Focus within */
focus-within:ring-2 focus-within:ring-blue-500
```

### 14.2 ARIA Labels

**Best Practices:**

```typescript
// Button with icon only
<Button aria-label="Delete item">
  <Trash2 className="w-4 h-4" />
</Button>

// Form field
<Label htmlFor="name">Name</Label>
<Input id="name" aria-describedby="name-hint" />
<p id="name-hint" className="text-xs text-gray-500">Enter your full name</p>

// Dialog
<Dialog aria-labelledby="dialog-title" aria-describedby="dialog-description">
  <DialogTitle id="dialog-title">Title</DialogTitle>
  <DialogDescription id="dialog-description">Description</DialogDescription>
</Dialog>
```

### 14.3 Screen Reader Support

**Current Status**: Basic support via shadcn/ui primitives
**Future**: Enhanced ARIA labels, live regions, status announcements

---

## 15. Future Enhancements

### 15.1 Completed: Flow Editor (Phase 3/4) ✅

#### Export/Import Components (Now Available)
- ✅ ExportDialog with Solution 3 Hybrid approach
- ✅ MultiModuleImportDialog with preview and conflicts
- ✅ AdvancedValidationPanel with drill-down
- ✅ ImportPreviewPanel showing changes
- ✅ Validation error formatting with suggestions
- ✅ Multi-module import (flows + messages + routing)

### 15.2 High Priority (Next Phase)

#### Search & Filtering
- Debounced search inputs
- Advanced filter panels
- Date range pickers
- Status filters
- Pagination controls
- URL query param persistence

#### Error Handling
- Retry logic with exponential backoff
- Error boundary components
- Network error detection
- 401/403 specific handling
- API error mapping

### 15.3 Medium Priority

#### React Query Integration
- Replace useState-based fetching
- Automatic caching
- Background refetching
- Optimistic updates
- Query devtools

#### Bulk Operations
- Checkbox selection
- Select all functionality
- Bulk action toolbar
- Progress indicators
- Success/failure summaries

#### Advanced Forms
- Zod schema validation
- Field-level async validation
- Dirty state tracking
- Unsaved changes warning

### 15.4 Nice to Have

#### Dark Mode
- Theme toggle in sidebar
- Dark color palette
- System preference detection
- localStorage persistence

#### Keyboard Shortcuts
- Command palette (Cmd/Ctrl+K)
- Quick navigation (Cmd/Ctrl+1-9)
- Quick create (Cmd/Ctrl+N)
- Quick save (Cmd/Ctrl+S)
- Help dialog (?)

#### Advanced Visualizations
- Interactive charts
- Segment flow simulation
- Call volume analytics
- Error rate trends
- Heatmaps

#### Mobile Optimization
- Responsive sidebar (collapsible)
- Touch-friendly interactions
- Horizontal scroll tables
- Mobile-optimized forms
- Swipe gestures

---

## 16. Changelog

### Version 3.5.0 (2026-01-20) - Message Store v5.0.0 Migration Complete

**Major Changes:**
- Complete migration to Message Store v5.0.0 atomic versioning model
- All 15+ message store components fully implemented and documented
- Design system compliance fixes (slate/indigo color palette)
- Performance optimizations with TanStack Query

**Message Store v5.0.0 Architecture:**
- **Atomic Versioning**: All languages versioned together (not per-language)
- **MessageKey-level versioning**: One `MessageKey` per key (not per language)
- **Integer version numbers**: Published version is integer (1-10), not UUID pointer
- **Version limit**: Increased from 5 to 10 versions per message key
- **API path**: Endpoints use `/message-keys` instead of `/messages`

**New Components (15 total):**
- `MessageStoreSelector` - Store dropdown with localStorage persistence
- `MessageStoreList` - Store management dialog with CRUD operations
- `MessageStoreDialog` - Create/edit message store dialog
- `MessageKeyRow` - Grouped message key row with expandable language details
- `CreateMessageDialog` - Create new message key with multi-language support
- `EditMessageDialog` - Single-language edit (creates new atomic version)
- `UnifiedEditDialog` - Quick single-language edit from list page
- `MultiLanguageEditDialog` - Atomic multi-language edit (all languages together)
- `MessageVersionSelector` - Version dropdown with publish/rollback controls
- `MessageVersionsDialog` - Full version history dialog
- `MessageVersionDetailsDialog` - Version details viewer dialog
- `MessageAuditViewer` - Audit history viewer with filtering and pagination
- `MessageExportDialog` - Export messages to JSON with advanced filtering
- `MessageImportPreview` - Preview import before applying changes
- `TypeSettingsEditor` - Dynamic form editor for message type-specific settings

**Updated Pages:**
- `MessagesPage` - Full v5.0.0 integration with grouped message keys
- `MessageDetailPage` - Complete version management and audit history

**Route Structure:**
- Updated route: `/messages/stores/:storeId/messages/:messageKey` (fully implemented)
- Deep linking support with URL parameters

**Design System Compliance:**
- Fixed all color violations (gray-* → slate-*, blue-* → indigo-*)
- All components use approved color palette
- Consistent spacing and typography

**Performance Improvements:**
- TanStack Query integration for all server data
- Memoization optimizations for expensive computations
- Optimized query keys and cache invalidation

**Documentation Updates:**
- Complete component list added to Section 8.7
- v5.0.0 migration notes documented
- Route structure updated to reflect implementation
- API endpoint references updated to v5.0.0

**Integration Status:**
- ✅ Message Store v5.0.0 fully integrated
- ✅ All CRUD operations functional
- ✅ Version management complete
- ✅ Export/Import working
- ✅ Audit history implemented
- 🟡 Audio player for playback (future enhancement)

---

### Version 3.4.0 (2026-01-06) - Authentication & Authorization Structural Improvements

**Major Changes:**
- Centralized authentication with shared types package
- Consistent role-based access control across frontend and backend
- Permission-based UI with domain-specific role checks
- Type-safe role handling using TypeScript enums

**New Package:**
- `shared/types/` - Shared types package for cross-service type consistency
  - `AppRole` enum - Application roles aligned with Okta groups
  - `Permission` enum - Permission flags for authorization
  - Ensures single source of truth for role definitions

**Updated Components:**
- `usePermissions.ts` - Updated to use shared AppRole types from shared package
- `AppLayout.tsx` - Uses AppRole.GLOBAL_ADMIN enum instead of string literals
- `ConfigurationPage.tsx` - Uses AppRole.GLOBAL_ADMIN enum
- `MessageSettingsPage.tsx` - Uses AppRole.GLOBAL_ADMIN enum
- `SegmentSettingsPage.tsx` - Uses AppRole.GLOBAL_ADMIN enum

**Backend Fixes:**
- Added @Public() decorator to health endpoints
- Updated permission matrix extraction and centralization
- Centralized error messages for auth module

**Security Improvements:**
- All 16 controllers verified with proper auth guards
- Role-based permissions validated across all endpoints
- Customer scope properly applied to all customer-data endpoints
- Frontend correctly uses shared AppRole types

**Benefits:**
- ✅ Type safety across frontend and backend
- ✅ Single source of truth for role definitions
- ✅ Compile-time checks for role usage
- ✅ Prevents typos in role strings
- ✅ Easy refactoring and IDE autocomplete
- ✅ Consistent auth implementation (100% verification score)

**Test Results:**
- All 435 backend tests passing (including 72 auth tests)
- Zero TypeScript compilation errors
- 98% overall consistency score improved to 100%

---

### Version 3.3.0 (2026-01-06) - Company Project Context Filter

**Major Additions:**
- Global company project filtering across all pages
- CompanyProjectHeader component with selector and statistics
- CompanyProjectContext for state management
- Backend integration for RoutingPage and MessagesPage
- Real-time statistics dashboard with resource counts
- localStorage persistence for project selection

**New Components:**
- `CompanyProjectHeader` - Multi-project selector with stats display
- `CompanyProjectSelector` - Dropdown with project filtering
- `CompanyProjectContext` - Global state management for project selection

**Updated Components:**
- `App.tsx` - Wrapped with CompanyProjectContextProvider
- `AppLayout.tsx` - Integrated CompanyProjectHeader
- `MessagesPage.tsx` - Backend integration with project filtering
- `RoutingPage.tsx` - Backend integration with real API data

**New Services:**
- `routing.service.ts` - Complete routing API client

**Updated Services:**
- `company-project.service.ts` - Added getProjectStats() function
- `messages.service.ts` - Added companyProjectId parameter support

**Integration Status:**
- ✅ Backend infrastructure complete
- ✅ Frontend components created
- ✅ Context-based state management
- ✅ MessagesPage and RoutingPage integrated
- 🟡 SegmentsPage integration pending
- 🟡 Mobile optimization pending

---

### Version 3.2.0 (2026-01-05) - Flow Editor Export/Import

**Major Additions:**
- Complete Flow Editor export/import component documentation
- Solution 3 Hybrid export approach (manifest-only default + optional content)
- Multi-module import system (flows + messages + routing together)
- Advanced validation panel with drill-down and error suggestions
- Import preview with conflict detection

**New Components Documented:**
- `ExportDialog` - Solution 3 Hybrid export with flexible options
- `MultiModuleImportDialog` - Multi-step import workflow
- `ImportPreviewPanel` - Import preview with changes and conflicts
- `AdvancedValidationPanel` - Validation with drill-down by segment

**Documentation Updates:**
- Added section 15: Flow Editor Export/Import Components
- Updated Future Enhancements to mark flow editor as complete
- Added data type definitions for validation and import
- Added integration examples for flow editor page layout
- Added Solution 3 Hybrid export format specifications

**Status**: Flow Editor implementation complete (Phases 1-4)
- ✅ Phase 1: Read-only viewer with metadata
- ✅ Phase 2: Draft editing with reordering and messages
- ✅ Phase 3: Advanced validation with suggestions
- ✅ Phase 4: Solution 3 Hybrid export/import

### Version 3.1.0 (2026-01-03)

**Major Changes:**
- Reorganized navigation structure with hierarchical settings pages
- Moved configuration tabs to domain-specific settings pages
- Split AdminPage and ConfigurationPage for better separation of concerns

**New Pages:**
- `ConfigurationPage`: System-wide configuration (Languages, Voices, Projects)
- `MessageSettingsPage`: Message-related settings with Categories and Types tabs
- `SegmentSettingsPage`: Segment-related settings with Segment Types and Key Types tabs

**Page Updates:**
- `AdminPage`: Streamlined to Environment, Security, and Audit Log tabs only
- `MessagesPage`: Added Settings button (gear icon) linking to `/messages/settings`
- `SegmentsPage`: Added Settings button (gear icon) linking to `/segments/settings`

**Navigation Changes:**
- Added `/config` route for system configuration (global-admin only)
- Added `/messages/settings` nested route for message settings
- Added `/segments/settings` nested route for segment settings
- Projects moved from AdminPage to ConfigurationPage

**Component Changes:**
- Created `CompanyProjectsTab` as reusable component
- All settings pages include back navigation with ArrowLeft icon
- Consistent tab structure across all configuration pages

**Documentation:**
- Updated route structure diagram
- Updated page count from 5 to 8 pages
- Updated integration status from ~30% to ~40%
- Added documentation for new pages (sections 8.3, 8.6, 8.8)

### Version 3.0.0 (2026-01-02)
- Initial comprehensive UI design documentation
- Full authentication and authorization flow
- HomePage with health monitoring
- AdminPage with Company Projects CRUD
- shadcn/ui component library integration

---

## 15. Flow Editor Components (Phases 1-4)

### Overview

The Flow Editor is built progressively across 4 phases with integrated export/import (Solution 3 Hybrid). All components work together to provide a complete flow visualization and editing experience.

**Phase Architecture:**
- **Phase 1:** Read-only viewer with routing metadata and message manifest
- **Phase 2:** Draft editing with segment reordering and message management
- **Phase 3:** Advanced validation with error suggestions
- **Phase 4:** Solution 3 Hybrid export/import with multi-module support

### Phase 1: Viewer Components

#### CustomSegmentNode Component

**File**: `frontend/src/components/flow/CustomSegmentNode.tsx`
**Library**: React Flow (@xyflow/react)

**Purpose**: Render individual segment nodes in the flow canvas with visual status indicators

**Visual Features:**
- Type-specific background colors
- Order badge (displays segment position: 1, 2, 3...)
- Validation indicator (error/warning icon + count)
- Terminal badge for terminal segments
- Transition count footer
- Blue border highlight when selected
- Red border on errors, yellow on warnings

**Segment Type Color Scheme:**

| Type | Background | Border |
|------|-----------|--------|
| language | #f3e8ff | #7c3aed |
| menu | #dbeafe | #2563eb |
| scheduler | #fef3c7 | #d97706 |
| transfer | #d1fae5 | #059669 |
| disconnect | #fee2e2 | #dc2626 |
| hangup | #fee2e2 | #dc2626 |
| callback | #dbeafe | #2563eb |

#### FlowCanvas Component

**File**: `frontend/src/components/flow/FlowCanvas.tsx`
**Library**: React Flow (@xyflow/react) with Dagre layout

**Purpose**: Display the complete flow graph with nodes, edges, and interactive controls

**Features:**
- ✅ Zoom in/out buttons
- ✅ Pan (mouse drag)
- ✅ Fit to view button
- ✅ Minimap overview
- ✅ Grid background
- ✅ Deterministic Dagre layout using `segmentOrder`
- ✅ Read-only or editable mode

**Layout Details:**
- Uses Dagre algorithm with TB (top-to-bottom) direction
- Y-axis positioning based on `segmentOrder` field
- 120px vertical spacing between segments
- 80px horizontal spacing for parallel branches
- Fallback to alphabetical order if `segmentOrder` is null

#### ValidationPanel Component

**File**: `frontend/src/components/flow/ValidationPanel.tsx`
**Location**: Below flow canvas in viewer

**Purpose**: Display flow validation results organized by severity

**Features:**
- Error list (red, blocking issues)
- Warning list (yellow, non-blocking)
- Group by segment name
- Empty state when valid (✅ checkmark)
- Count badges

### Phase 2: Editing Components

#### PropertiesPanel Component

**File**: `frontend/src/components/flow/PropertiesPanel.tsx`
**Location**: Right sidebar in editor mode
**Tabs**: Config | Transitions | Order | Messages

**Purpose**: Unified segment property editor with 4 functional tabs

**Tab 1: Config**
- Dynamic form fields based on segment type
- Message key autocomplete (fields containing "message")
- Type-safe validation
- Real-time validation feedback

**Tab 2: Transitions**
- List of outgoing transitions
- Dropdown to select target segments
- Add/remove transition outcomes
- Terminal segment warning (cannot have transitions)
- Default transition support

**Tab 3: Order**
- SegmentOrderPanel for drag-and-drop reordering
- Up/down arrow buttons
- Order number updates
- Visual position indicator

**Tab 4: Messages**
- MessageReferencePanel for selecting message key
- Message details (type, category, languages)
- Message content preview (if available)
- Missing message warning
- List of available messages

#### ConfigEditor Component

**File**: `frontend/src/components/flow/ConfigEditor.tsx`
**Embedded**: PropertiesPanel > Config tab

**Purpose**: Edit segment-specific configuration fields

**Field Type Detection:**
- `messageKey` fields → Autocomplete dropdown
- Fields containing "Message" → Autocomplete dropdown
- Other fields → Input/Select based on data type

**Features:**
- Dynamic form generation by segment type
- Message key validation against manifest
- Type-safe field updates
- Helper text for each field

#### TransitionEditor Component

**File**: `frontend/src/components/flow/TransitionEditor.tsx`
**Embedded**: PropertiesPanel > Transitions tab

**Purpose**: Manage all outgoing transitions from a segment

**Transition Structure:**
```typescript
transitions: {
  on: {              // Conditional outcomes
    "1": { nextSegment: "menu" },
    "2": { nextSegment: "queue" }
  },
  default: {         // Fallback
    nextSegment: "disconnect"
  }
}
```

**Features:**
- Add new outcome conditions
- Remove conditions with confirmation
- Select target segment from dropdown
- Terminal segment enforcement (red warning)
- Disable "Add" button for terminal types

#### SegmentOrderPanel Component

**File**: `frontend/src/components/flow/SegmentOrderPanel.tsx`
**Embedded**: PropertiesPanel > Order tab

**Purpose**: Reorder segments for visual layout presentation

**Features:**
- Sorted list of all segments
- Up/down arrow buttons to move
- Order numbers (1-indexed)
- Automatically disables at boundaries
- Updates `segmentOrder` field on change
- Visual position badge (blue circle with number)

#### MessageReferencePanel Component

**File**: `frontend/src/components/flow/MessageReferencePanel.tsx`
**Embedded**: PropertiesPanel > Messages tab

**Purpose**: Select and manage message key references for segments

**Features:**
- Dropdown selector for message keys
- Display selected message details
  - Type code (AUDIO, TTS, etc.)
  - Category code
  - Supported languages (badges)
- Message content preview (if included in export)
- Complete list of available messages
- Missing message warning (red alert)
- Search/filter message list

#### Zustand Flow Store

**File**: `frontend/src/stores/flow-store.ts`

**Purpose**: Centralized state management for flow editing with optimistic updates

**Key State:**
```typescript
currentFlow: CompleteFlowDto | null       // Active flow
originalFlow: CompleteFlowDto | null      // For comparison
selectedSegment: string | null            // Currently selected segment
```

**Key Actions:**
- `setFlow(flow)` - Load complete flow
- `updateSegment(name, updates)` - Update segment properties
- `reorderSegments(reordered)` - Update segment order
- `hasUnsavedChanges()` - Boolean check
- `getReferencedMessageKeys()` - Extract all message keys used

**Optimistic Updates:**
- Updates applied immediately to UI
- Rollback if API save fails
- Cache invalidation on success

#### Flow Editor Page

**File**: `frontend/src/app/flows/[routingId]/editor/page.tsx`

**Layout**: Responsive 3-column grid (60% canvas, 40% sidebar)

```
┌─────────────────────────────────────┐
│ Flow Name        [Export] [Import]  │
├───────────────────┬─────────────────┤
│                   │ Validation      │
│  React Flow       │ Panel           │
│  Canvas           │                 │
│  (Editable)       │ Properties      │
│  (60% width)      │ Panel           │
│                   │                 │
│                   │ (40% width)     │
│ [Save][Publish]   │                 │
└───────────────────┴─────────────────┘
```

**Components Integrated:**
- Header: Flow metadata + Export/Import buttons
- Canvas: FlowCanvas (editable)
- Sidebar: AdvancedValidationPanel + PropertiesPanel
- Footer: Save Draft + Publish buttons

---

## Flow Editor: Export/Import Components (Phase 3/4)

### Overview

The Flow Editor integrates Solution 3 Hybrid export/import functionality with the visual editor. These components support multi-module import (flows + messages + routing) and flexible export options.

### ExportDialog Component

**File**: `frontend/src/components/flow/ExportDialog.tsx`
**Location in Editor**: Header action button

**Purpose**: Export flow with Solution 3 Hybrid approach (manifest-only by default, optional content)

**Features**:
- ✅ Export format selector (JSON only)
- ✅ Message content toggle (optional)
- ✅ Metadata inclusion toggle
- ✅ File size estimate
- ✅ Download button
- ✅ Copy to clipboard

**UI Pattern**:

```
┌────────────────────────────────┐
│ Export Flow                    │
├────────────────────────────────┤
│ Format: JSON                   │
│                                │
│ ☐ Include Message Content      │
│   Default: manifest only       │
│   ~50KB → 150KB with content   │
│                                │
│ ☐ Include Metadata             │
│                                │
│ Segments: 15                   │
│ Messages: 8 (manifest)         │
│ Est. size: ~50KB               │
│                                │
│ [Download] [Copy to Clipboard] │
└────────────────────────────────┘
```

**Usage**:

```typescript
import { ExportDialog } from '@/components/flow/ExportDialog';
import { CompleteFlowDto } from '@/types/api-types';

interface ExportDialogProps {
  flow: CompleteFlowDto;
  isLoading?: boolean;
  onExport?: (data: unknown, format: string) => Promise<void>;
}

<ExportDialog
  flow={currentFlow}
  onExport={handleExport}
/>
```

### MultiModuleImportDialog Component

**File**: `frontend/src/components/flow/MultiModuleImportDialog.tsx`
**Location in Editor**: Header action button

**Purpose**: Import flows with segments, messages, and routing rules as a unified operation

**Features**:
- ✅ File upload with drag-drop
- ✅ Multi-step workflow (Upload → Preview → Confirm)
- ✅ JSON validation before preview
- ✅ Import preview showing changes
- ✅ Conflict detection and display
- ✅ Error handling with specific messages
- ✅ Success confirmation

**UI Pattern**:

```
Tab 1: Upload
┌────────────────────────────────┐
│ Drop file or click to select   │
│ JSON files only                │
│ 📄 flow-export.json (25KB)     │
└────────────────────────────────┘

Tab 2: Preview
┌────────────────────────────────┐
│ Import Preview                 │
├────────────────────────────────┤
│ Segments: 15                   │
│ Messages:  8                   │
│ Routing:   1                   │
│                                │
│ ⚠️  1 conflict detected         │
│ [Details]                      │
│                                │
│ Validation: ✓ Valid            │
└────────────────────────────────┘

Tab 3: Confirm
┌────────────────────────────────┐
│ ✅ Import successful!          │
│ New draft created              │
│                                │
│ • 15 segments imported         │
│ • 8 messages imported          │
│ • 1 routing entry imported     │
└────────────────────────────────┘
```

**Usage**:

```typescript
import { MultiModuleImportDialog } from '@/components/flow/MultiModuleImportDialog';

interface MultiModuleImportDialogProps {
  routingId?: string;
  onImportSuccess?: (result: {
    flowId: string;
    segmentCount: number
  }) => void;
}

<MultiModuleImportDialog
  routingId={params.routingId}
  onImportSuccess={handleImportSuccess}
/>
```

### ImportPreviewPanel Component

**File**: `frontend/src/components/flow/ImportPreviewPanel.tsx`
**Usage**: Displayed in MultiModuleImportDialog preview tab

**Purpose**: Show import preview with changes, conflicts, and validation status

**Features**:
- ✅ Summary stats (segments, messages, routing)
- ✅ Conflict detection display
- ✅ Validation error list
- ✅ Detailed changes breakdown
- ✅ Loading state

**UI Pattern**:

```
┌────────────────────────────────┐
│ Import Preview                 │
├────────────────────────────────┤
│ Segments │ Messages │ Routing  │
│    15    │    8     │    1     │
│                                │
│ ⚠️  Conflicts Detected          │
│ • Flow RT-001 already exists   │
│   → Will create as new draft   │
│                                │
│ ✓ Validation Passed            │
│ No validation errors           │
│                                │
│ 🔗 Segments to Import:         │
│   • main_menu                  │
│   • billing_queue              │
│   • [+ 13 more]                │
└────────────────────────────────┘
```

**Usage**:

```typescript
import { ImportPreviewPanel } from '@/components/flow/ImportPreviewPanel';
import { ImportPreviewDto } from '@/types/api-types';

interface ImportPreviewPanelProps {
  preview: ImportPreviewDto;
  isLoading: boolean;
  error?: string;
}

<ImportPreviewPanel
  preview={importPreview}
  isLoading={isValidating}
  error={validationError}
/>
```

### AdvancedValidationPanel Component

**File**: `frontend/src/components/flow/AdvancedValidationPanel.tsx`
**Location**: Right sidebar in Flow Editor

**Purpose**: Display flow validation with drill-down by segment and error suggestions

**Features**:
- ✅ Error and warning counts
- ✅ Group by segment
- ✅ Expandable/collapsible sections
- ✅ Error codes and suggestions
- ✅ Click to select segment
- ✅ Success state display

**UI Pattern**:

```
┌──────────────────────────────┐
│ ❌ 3 errors, 2 warnings      │
├──────────────────────────────┤
│ ERRORS                       │
│ ┌────────────────────────┐   │
│ │ ▶ main_menu (2)        │   │
│ │   MISSING_TARGET       │   │
│ │   No transition for #2 │   │
│ │   💡 Add transition    │   │
│ │   ────────────────────  │   │
│ │   UNREACHABLE_OUTCOME  │   │
│ │   Outcome has no dest  │   │
│ └────────────────────────┘   │
│                              │
│ WARNINGS                     │
│ ┌────────────────────────┐   │
│ │ ▶ queue_segment (2)    │   │
│ │   CYCLE_DETECTED       │   │
│ └────────────────────────┘   │
└──────────────────────────────┘
```

**Usage**:

```typescript
import { AdvancedValidationPanel } from '@/components/flow/AdvancedValidationPanel';
import { FlowValidation } from '@/types/validation-types';

interface AdvancedValidationPanelProps {
  validation: FlowValidation;
  onSelectSegment: (segmentName: string) => void;
  onSelectError: (error: ValidationError) => void;
}

<AdvancedValidationPanel
  validation={formattedValidation}
  onSelectSegment={setSelectedSegment}
  onSelectError={handleErrorSelect}
/>
```

### Integration in Flow Editor

**Export/Import in Page Header**:

```typescript
// frontend/src/app/flows/[routingId]/editor/page.tsx
<div className="flex items-center justify-between">
  <div>
    <h1>{flow.name}</h1>
    <p>{flow.segments.length} segments</p>
  </div>
  <div className="flex gap-2">
    <ExportDialog flow={flow} />
    <MultiModuleImportDialog
      routingId={routingId}
      onImportSuccess={handleReload}
    />
  </div>
</div>
```

**Right Sidebar Layout**:

```typescript
<div className="col-span-1.5 space-y-4 overflow-y-auto">
  {/* Validation Panel */}
  <div>
    <h2 className="text-lg font-semibold mb-2">Validation</h2>
    <AdvancedValidationPanel
      validation={formattedValidation}
      onSelectSegment={setSelectedSegment}
      onSelectError={handleError}
    />
  </div>

  {/* Properties Panel */}
  {selectedSegment && (
    <div>
      <h2 className="text-lg font-semibold mb-2">Properties</h2>
      <PropertiesPanel {...props} />
    </div>
  )}
</div>
```

### Data Types

**Import Preview DTO**:

```typescript
interface ImportPreviewDto {
  isValid: boolean;
  segmentCount?: number;
  messageCount?: number;
  routingTableCount?: number;

  segments?: string[];        // Segment names
  messages?: string[];        // Message keys

  conflicts?: Array<{
    type: string;
    description: string;
  }>;

  validationErrors?: Array<{
    code: string;
    message: string;
    segment?: string;
  }>;
}
```

**Validation Error Type**:

```typescript
interface ValidationError {
  code: string;               // MISSING_TARGET, UNREACHABLE, etc.
  severity: 'error' | 'warning';
  segment?: string;           // Affected segment
  field?: string;             // Affected field
  message: string;            // Human-readable message
  suggestion?: string;        // How to fix it
}
```

**Flow Validation Type**:

```typescript
interface FlowValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  bySegment: Record<string, {
    segment: string;
    errors: ValidationError[];
    warnings: ValidationError[];
    isValid: boolean;
  }>;
}
```

### Solution 3 Hybrid Export Format

**Default Export (Manifest-Only)**:
- Size: ~50KB for typical flow
- Includes: All routing metadata, segments, message manifest (keys only)
- Excludes: Full message content (audio files, TTS data)
- Use case: Lightweight backup, transfer between environments

**Full Export (With Content)**:
- Size: ~150KB-500KB depending on messages
- Includes: Everything + full message content
- Use case: Self-contained archive for offline use

**Export Metadata Wrapper**:

```json
{
  "routingId": "ENGIE_MAIN",
  "name": "Engie Main Flow",
  "version": "1.0.0",
  "initSegment": "get_language",

  "segments": [...],
  "messageManifest": [...],
  "messages": [...]  // Optional (null if manifest-only)
}
```

---

## Appendix A: Component Quick Reference

### Buttons

```typescript
<Button>Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Danger</Button>
<Button size="sm">Small</Button>
<Button size="icon"><Icon /></Button>
```

### Form Fields

```typescript
<Input type="text" placeholder="Text" />
<Select><SelectTrigger /><SelectContent /></Select>
<Switch checked={value} onCheckedChange={setValue} />
<textarea className="w-full p-2 border rounded" />
```

### Layout

```typescript
<Card><CardHeader /><CardContent /></Card>
<Dialog><DialogContent><DialogHeader /><DialogFooter /></Dialog>
<Tabs><TabsList /><TabsContent /></Tabs>
```

### Feedback

```typescript
toast.success('Success message');
toast.error('Error message');
<Loader2 className="animate-spin" />
```

---

## Appendix B: Color Reference

```typescript
// Status Colors
bg-emerald-50/50 text-emerald-700  // Success/Active
bg-indigo-50/70 text-indigo-700    // Info/Draft
bg-red-50 text-red-700             // Error/Danger
bg-amber-50 text-amber-700          // Warning
bg-slate-100 text-slate-600         // Inactive/Disabled

// Text Colors
text-slate-900  // Primary text
text-slate-700  // Secondary text
text-slate-600  // Tertiary text

// Background Colors
bg-white       // Card background
bg-slate-50    // Page background
bg-indigo-50   // Hover state
```

---

## Appendix C: Spacing Reference

```typescript
// Padding
p-2   = 8px
p-4   = 16px
p-6   = 24px
p-8   = 32px

// Margin
mb-2  = 8px
mb-4  = 16px
mb-6  = 24px
mb-8  = 32px

// Gap
gap-2 = 8px
gap-4 = 16px
gap-6 = 24px
```

---

**Document Version**: 3.5.0
**Last Updated**: 2026-01-20
**Maintained By**: Development Team
**Related Documents**:
- [AGENTS.md](./AGENTS.md)
- [TASK_LIST.md](../TASK_LIST.md)
- [README.md](./README.md)
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Complete flow editor roadmap
- [Phase 1: Viewer Adapted](./segment_flow_design/PHASE_1_VIEWER_ADAPTED.md)
- [Phase 2: Editing Adapted](./segment_flow_design/PHASE_2_EDITING_ADAPTED.md)
- [Phase 3/4: Validation & Export/Import](./segment_flow_design/PHASE_3_4_POLISH_ADAPTED.md)
- [Solution 3 Hybrid Plan](./../.cursor/plans/solution3_hybrid_export_import_implementation_plan.md)
