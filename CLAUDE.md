# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack TypeScript monorepo for managing IVR routing data, message stores, and segment configurations. The system uses a three-layer architecture:

- **Routing Table**: Maps source IDs to routing IDs and manages flow initialization
- **Segment Store**: Defines the flow graph structure with segments and transitions
- **Message Store**: Manages multilingual messages with atomic versioning

## Development Commands

### Initial Setup

```bash
# Install all dependencies
npm run install:all

# Set up database (starts Docker SQL Server + runs migrations)
npm run db:setup

# Start development environment (backend + frontend)
npm run dev
```

### Common Commands

```bash
# Development
npm run dev                    # Start both backend and frontend
npm run dev:backend           # Start backend only
npm run dev:frontend          # Start frontend only

# Building
npm run build:all             # Build backend and frontend
npm run build:backend         # Build backend only
npm run build:frontend        # Build frontend only

# Testing
npm run test:backend          # Run Jest tests (backend)
npm run test:frontend         # Run type-check (frontend uses Vitest)
npm run verify:all            # Lint + test + build (both)

# Database
npm run db:start              # Start SQL Server container
npm run db:stop               # Stop SQL Server container
npm run db:status             # Check database container status
npm run db:logs               # View database logs
npm run prisma:generate       # Generate Prisma client
npm run prisma:migrate        # Run migrations (dev)
npm run seeds                 # Run all seed files

# Cleanup
npm run clean:all             # Remove all node_modules and build artifacts
npm run rebuild               # Clean + install + prisma generate
```

### Backend-Specific Commands

```bash
cd services/backend

npm run dev                   # Start with hot reload
npm run build                 # Build for production
npm run lint                  # Run ESLint
npm run test                  # Run Jest tests
npm run test:watch            # Run tests in watch mode
npm run test:cov              # Run tests with coverage
npm run prisma:studio         # Open Prisma Studio
```

### Frontend-Specific Commands

```bash
cd frontend

npm run dev                   # Start Vite dev server (port 3000)
npm run build                 # Build for production
npm run preview               # Preview production build
npm run lint                  # Run ESLint
npm run type-check            # Run TypeScript compiler check
npm run test                  # Run Vitest tests
npm run test:ui               # Run Vitest with UI
npm run test:coverage         # Run tests with coverage
```

## Architecture

### Module Structure

The backend is organized into three main domain modules:

1. **Routing Table Module** (`services/backend/src/modules/routing-table/`)
   - Maps sourceId → routingId
   - Links to message stores
   - Manages routing table lifecycle

2. **Segment Store Module** (`services/backend/src/modules/segment-store/`)
   - Segments define flow nodes (routing, scheduler, intent_detection, etc.)
   - Segment keys hold configuration values
   - Transitions define edges between segments
   - Uses ChangeSet pattern for draft/publish workflow

3. **Message Store Module** (`services/backend/src/modules/message-store/`)
   - Message stores contain messages grouped by customerId/projectId
   - **v5.0.0 Atomic Versioning**: MessageKey → MessageKeyVersion → MessageLanguageContent
   - Each version contains ALL languages atomically (no partial language versions)
   - PublishedVersion tracks the active version
   - Voice configurations per language/store

### Supporting Modules

- **Auth Module** (`services/backend/src/auth/`)
  - Okta group-based authentication with two-level security:
    1. Domain roles (viewer, editor, ops, admin)
    2. Customer scopes (`okta-{customerId}-flow`)
  - Use `@Roles()` and `@RequireCustomerScope()` decorators on controllers
  - See [ROLES.md](services/backend/src/auth/ROLES.md) for complete documentation

- **Dictionaries Module** (`services/backend/src/modules/dictionaries/`)
  - Manages reference data (languages, environments, message types, segment types, etc.)
  - Provides impact analysis before deletion

- **Export/Import Module** (`services/backend/src/shared/export-import/`)
  - JSON-based export/import of routing tables, segments, and messages
  - Cross-environment data migration

- **Audit Module** (`services/backend/src/modules/audit/`)
  - Tracks all changes via AuditInterceptor
  - Logs user, action, timestamp, and changes

### Frontend Architecture

Built with **Vite + React + shadcn/ui**:

- **Pages**: Top-level route components in `frontend/src/app/pages/`
- **Features**: Domain-specific components organized by module
  - `features/configuration/` - Dictionary and segment type management
  - `features/flow-designer/` - Visual flow editor using @xyflow/react
- **Components**: Reusable UI components
  - `components/ui/` - shadcn/ui components
  - `components/common/` - Shared business components
- **Hooks**: Custom React hooks (`useAuth`, `useDomainPermissions`, `useExportImport`)
- **Context**: React Context providers (`CompanyProjectContext`, `ErrorContext`)
- **State Management**: Zustand for global state (see imports in components)
- **Styling**: Tailwind CSS v4 with shadcn/ui design system (see [GLOBAL_UI_DESIGN.md](docs/GLOBAL_UI_DESIGN.md))

### Shared Packages

- **`shared/`** (`@routing-data-layer/shared-types`): Core types and role definitions
- **`services/shared/`** (`@services/shared`): DTOs, errors, and service contracts

### Database Schema

- **SQL Server** with Prisma ORM
- Schema organized by prefix:
  - `cfg_*` - Configuration tables (dictionaries, company projects)
  - `rt_*` - Routing table tables
  - `seg_*` - Segment store tables
  - `msg_*` - Message store tables
  - `audit_*` - Audit log tables
- Local development: Docker container on port 14330
- Connection string in `services/backend/.env`

## ChangeSet Pattern

All three domain modules use the ChangeSet pattern for draft/publish workflow:

- **Draft Mode**: Changes are isolated in a ChangeSet (identified by ChangeSetId)
- **Publishing**: Atomically replaces active records with draft records
- **Rollback**: Can revert to previous versions
- **Isolation**: Draft changes don't affect production data until published

### Working with ChangeSets

- ChangeSetId is `NULL` for published/active records
- ChangeSetId is a GUID for draft records
- Publishing moves draft records to active (sets ChangeSetId to NULL, soft-deletes old active records)
- Rollback discards draft records

## Authentication & Authorization

Two-level security model:

1. **Domain Roles** (via Okta groups):
   - `routing-table-viewer/editor/ops/admin`
   - `message-store-viewer/editor/ops/admin`
   - `segment-store-viewer/editor/ops/admin`
   - `global-admin` (full access)
   - `global-dev` (read-only debugging)

2. **Customer Scopes** (via Okta groups):
   - Pattern: `okta-{customerId}-flow`
   - Example: `okta-digipolis-flow`
   - Restricts data access to specific customers

**Backend Usage:**
```typescript
@Get('messages/:customerId')
@Roles(AppRole.MSG_VIEWER)
@RequireCustomerScope({ paramName: 'customerId', strict: true })
async getMessages(@Param('customerId') customerId: string) {
  // User needs MSG_VIEWER role AND okta-{customerId}-flow group
}
```

**Frontend Usage:**
```typescript
const permissions = useDomainPermissions({
  roles: user?.roles,
  domain: Domain.MESSAGE_STORE,
});
// Check permissions.canView, canEdit, canPublish, canDelete
```

## Testing

### Backend Tests (Jest)

```bash
cd services/backend

npm run test                  # Run all tests
npm run test:watch            # Watch mode
npm run test:cov              # With coverage
npm run test:debug            # Debug mode

# Run specific test file
npm run test -- segment-store.service.spec.ts

# Run tests matching pattern
npm run test -- --testNamePattern="should create segment"
```

### Frontend Tests (Vitest)

```bash
cd frontend

npm run test                  # Run all tests
npm run test:ui               # Interactive UI
npm run test:coverage         # With coverage

# Run specific test file
npm run test -- src/features/flow-designer/FlowCanvas.test.tsx

# Run tests in watch mode
npm run test -- --watch
```

## Environment Configuration

### Backend (.env)

```
DATABASE_URL="sqlserver://localhost:14330;database=routing_data_layer;user=sa;password=YourStrong@Password123;encrypt=true;trustServerCertificate=true"
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```
VITE_API_URL=/api/v1
VITE_AUTH_MODE=dev
```

## Database Seeding

Seeds populate development data in dependency order:

```bash
npm run seeds                 # Run all seeds
npm run seed:wipe             # Wipe and reseed
```

Seed files (`seeds/`) are numbered by execution order:
- `001-009`: Dictionary prerequisites
- `010`: Routing tables
- `020-022`: Message stores
- `030-032`: Segment stores

See [seeds/README.md](seeds/README.md) for details.

## Message Store Versioning (v5.0.0)

**Critical**: MessageStore uses atomic versioning where each version contains ALL languages:

- **Structure**: MessageKey → MessageKeyVersion → MessageLanguageContent
- **Atomic Versions**: Each MessageKeyVersion contains all supported languages
- **PublishedVersion**: Tracks which version is active (1-indexed, not version ID)
- **Version Names**: Optional descriptive names for versions
- **No Partial Updates**: Cannot publish a version missing languages

**Example:**
```
MessageKey "welcome_message"
  ├─ Version 1 (Published)
  │   ├─ nl-BE: "Welkom"
  │   └─ fr-BE: "Bienvenue"
  └─ Version 2 (Draft)
      ├─ nl-BE: "Welkom bij ons systeem"
      └─ fr-BE: "Bienvenue à notre système"
```

When creating/editing messages, ensure ALL languages are provided for the version.

## Code Style & Patterns

### Backend (NestJS)

- Use dependency injection via constructors
- Implement services in `*.service.ts`, controllers in `*.controller.ts`
- Use DTOs with `class-validator` decorators for validation
- Use Prisma for database access (never raw SQL except in migrations)
- Apply guards with decorators: `@UseGuards(JwtAuthGuard, RoleGuard)`
- Use `@Roles()` and `@RequireCustomerScope()` for authorization
- Validate DTOs with `ValidationPipe` (enabled globally)

### Frontend (React + TypeScript)

- Use functional components with hooks
- Use shadcn/ui components for UI elements
- Use React Query (`@tanstack/react-query`) for API calls
- Use Zustand for state management when context is insufficient
- Follow Tailwind CSS utility-first approach
- Use TypeScript strictly (no `any` types)
- Implement error boundaries for error handling
- Use `react-hook-form` with Zod for form validation

### Shared Types

- Import from `@routing-data-layer/shared-types` or `@services/shared`
- Keep DTOs in sync between frontend and backend
- Export types from index files for clean imports

## Common Pitfalls

1. **Database Connection**: Ensure SQL Server is running (`npm run db:start`) before starting backend
2. **Prisma Client**: Run `npm run prisma:generate` after schema changes
3. **Port Conflicts**: Backend uses 3001, frontend uses 3000, database uses 14330
4. **ChangeSet Isolation**: Always check if you're working with draft (ChangeSetId != NULL) or published (ChangeSetId = NULL) data
5. **Customer Scope**: Always filter by customer scope on customer-specific endpoints
6. **Message Versions**: Never create partial language versions - always include all languages in a MessageKeyVersion
7. **Shared Packages**: After changing types in `shared/` or `services/shared/`, rebuild them before using in other packages

## Troubleshooting

### Database Issues

```bash
# Check if database is running
npm run db:status

# View database logs
npm run db:logs

# Restart database
npm run db:stop
npm run db:start
npm run db:wait

# Reset database (destructive)
npm run prisma:reset
```

### Build Issues

```bash
# Full rebuild
npm run clean:all
npm run install:all
npm run prisma:generate
npm run build:all
```

### Port Already in Use

```bash
# Stop services on ports
npm run stop:backend          # Kills process on port 3001
npm run stop:frontend         # Kills process on port 3000
```

## File Locations

- Backend source: `services/backend/src/`
- Frontend source: `frontend/src/`
- Prisma schema: `services/backend/prisma/schema.prisma`
- Database seeds: `seeds/`
- Shared types: `shared/types/` and `services/shared/src/`
- Documentation: `docs/`
- Infrastructure: `infrastructure/` (Docker Compose, Azure configs)
