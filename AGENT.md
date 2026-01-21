# Routing Data Layer - Agent Context

This document provides essential context for AI agents working on this project. It covers the overall architecture, conventions, and key concepts that agents need to understand.

## Project Overview

**Routing Data Layer** is a full-stack TypeScript monorepo for managing Interactive Voice Response (IVR) routing systems. It provides a comprehensive web application for configuring call flows, segments, messages, and routing tables used in telephony systems.

### Core Purpose

The system manages three main data domains:
1. **Routing Tables** - Define how calls are routed based on phone numbers, contexts, and business rules
2. **Segment Store** - Configure reusable call flow segments (Menu, Say, Scheduler, Recognize, Queue, Collect)
3. **Message Store** - Centralized content management for multi-language IVR messages with versioning

## Architecture

### Technology Stack

- **Frontend**: React 18.3.1 + TypeScript + Vite 6.3.5
- **Backend**: NestJS 10.3.0 + TypeScript + Prisma 5.22.0
- **Database**: SQL Server (via Docker)
- **Authentication**: Azure AD (Passport.js) with JWT fallback
- **API**: RESTful with Swagger documentation
- **State Management**: Zustand (frontend), React Query for server state
- **UI Libraries**: Radix UI (shadcn/ui), Material-UI, Tailwind CSS 4.1.12

### Project Structure

```
routing-data-layer-shared/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── app/          # App-level components and routing
│   │   ├── components/   # Reusable UI components
│   │   ├── features/     # Feature modules (routing, segments, messages, etc.)
│   │   ├── api/          # API client and type definitions
│   │   ├── services/     # Business logic services
│   │   ├── contexts/     # React contexts
│   │   └── hooks/        # Custom React hooks
│   └── package.json
├── services/
│   ├── backend/          # NestJS backend API
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules (routing-table, segment-store, message-store)
│   │   │   ├── core/     # Core services (prisma, health, common)
│   │   │   ├── auth/     # Authentication and authorization
│   │   │   └── shared/   # Shared utilities (export-import, validation)
│   │   └── prisma/       # Database schema and migrations
│   └── shared/           # Shared TypeScript types and DTOs
├── shared/               # Additional shared types
├── infrastructure/       # Docker compose and Azure deployment configs
├── scripts/              # Utility scripts (seeds, migrations)
├── seeds/                # Database seed files
├── migrations/           # Database migration files
└── docs/                 # Design documents and specifications
```

### Monorepo Structure

This is a **monorepo** with multiple packages:
- Root `package.json` orchestrates development workflows
- Each package (`frontend`, `services/backend`, `services/shared`) has its own `package.json`
- Shared types live in `services/shared` and `shared/` directories
- Use root-level scripts for common operations (see `package.json` scripts)

## Key Concepts

### Multi-Tenancy

The system is **multi-tenant** with two levels of isolation:
1. **Company** - Top-level organization (e.g., "ENGIE")
2. **Project** - Sub-organization within a company (e.g., "EnergyLine", "Customer Service")

All data is scoped to a company-project combination. Users select their active company/project context, and all API calls are automatically filtered to that scope.

### Versioning & Drafts

- **Routing Tables** and **Segments** support draft changesets
- Changes are made in draft mode, then published to production
- Draft changesets allow testing before going live
- Message Store uses versioning (up to 10 versions per message)

### Message Store Architecture

- Messages are referenced by **key** (e.g., `WELCOME_PROMPT`) rather than embedded text
- Supports **multi-language** with atomic versioning (all languages version together)
- Up to 10 versions per message with rollback capability
- Separates content management from call flow logic

### Segment Types

The system supports multiple segment types:
- **Menu** - DTMF menu selection
- **Say** - Play message/prompt
- **Scheduler** - Time-based routing
- **Recognize** - Speech recognition
- **Queue** - Queue management
- **Collect** - Collect user input

## Development Workflow

### Getting Started

1. **Initialize the project** (if runtime copy):
   ```powershell
   .\initialize-runtime.ps1
   ```

2. **Install dependencies**:
   ```bash
   npm run install:all
   ```

3. **Start database**:
   ```bash
   npm run db:start
   npm run db:wait
   ```

4. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```

5. **Start development servers**:
   ```bash
   npm run dev  # Starts both frontend and backend
   # Or separately:
   npm run dev:frontend
   npm run dev:backend
   ```

### Common Commands

- `npm run dev` - Start both frontend and backend
- `npm run build:all` - Build both frontend and backend
- `npm run lint:backend` / `npm run lint:frontend` - Lint code
- `npm run test:backend` / `npm run test:frontend` - Run tests
- `npm run seeds` - Run database seeds
- `npm run prisma:generate` - Regenerate Prisma client
- `npm run prisma:migrate` - Run database migrations

### Database Management

- Database runs in Docker (SQL Server)
- Prisma is used as the ORM
- Schema is defined in `services/backend/prisma/schema.prisma`
- Migrations are in `services/backend/prisma/migrations_archived_old/`
- Seeds are in `seeds/` directory (SQL files)

## Code Conventions

### File Naming

- **Components**: PascalCase (e.g., `AppLayout.tsx`)
- **Pages**: PascalCase with "Page" suffix (e.g., `HomePage.tsx`)
- **Services**: camelCase with "Service" suffix (e.g., `message-store.service.ts`)
- **Types**: camelCase with "types" suffix (e.g., `routing.types.ts`)
- **Hooks**: camelCase with "use" prefix (e.g., `useAuth.ts`)

### TypeScript

- **Strict mode enabled** - All code must be properly typed
- **No `any` types** - Use proper types or `unknown`
- **Shared types** - Use types from `services/shared` or `shared/` when possible
- **Path aliases** - Frontend uses `@/` for `src/` directory

### Code Style

- **Indentation**: 2 spaces (TypeScript, JSON, Markdown)
- **Line length**: 120 characters max
- **End of line**: LF (Unix-style) for all files except PowerShell scripts
- See `.editorconfig` for detailed formatting rules

### Import Organization

1. External dependencies (React, libraries)
2. Internal absolute imports (`@/components`, `@/api`)
3. Relative imports (`./Component`, `../utils`)
4. Type imports (use `import type` when possible)

## API Design

### Base URL

- **Backend**: `http://localhost:3001/api/v1`
- **Swagger Docs**: `http://localhost:3001/api/docs`

### Authentication

- Uses Azure AD authentication (Passport.js)
- JWT tokens for API requests
- Mock authentication available in development (`USE_MOCK_AUTH=true`)
- Role-based access control (see `services/backend/src/auth/ROLES.md`)

### API Patterns

- **RESTful conventions** - Use standard HTTP methods and status codes
- **DTOs** - All requests/responses use Data Transfer Objects
- **Validation** - Uses `class-validator` decorators
- **Error handling** - Consistent error response format
- **Audit logging** - All mutations are automatically logged

## Testing

### Backend

- Uses **Jest** for unit and integration tests
- E2E tests in `test/` directory
- Test files: `*.spec.ts`

### Frontend

- Uses **Vitest** for unit tests
- React Testing Library for component tests
- Test files: `*.test.tsx` or `*.spec.tsx`

## Documentation

### Design Documents

- `docs/MESSAGE_STORE_DESIGN_DOCUMENT.md` - Message Store architecture
- `docs/ROUTING_TABLE_DESIGN.md` - Routing Table design
- `docs/SEGMENT_STORE_DESIGN.md` - Segment Store design
- `docs/GLOBAL_UI_DESIGN.md` - UI/UX design specifications

### Code Documentation

- Use JSDoc comments for public APIs
- Swagger/OpenAPI annotations for backend endpoints
- Inline comments for complex business logic

## Important Notes for Agents

### When Working on Frontend

- See `frontend/AGENT.md` for frontend-specific context
- Use React Query for all server state
- Follow feature-based folder structure
- Use Zustand for client-side state management
- All API calls go through `src/api/client.ts`

### When Working on Backend

- See `services/backend/AGENT.md` for backend-specific context
- Follow NestJS module structure
- Use Prisma for database access
- All modules should be properly typed with DTOs
- Use dependency injection (NestJS providers)

### When Working Across Both

- Keep shared types in sync between frontend and backend
- Use `services/shared` package for common DTOs
- Ensure API contracts match between client and server
- Test integration between frontend and backend

### Security Considerations

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user input
- Respect role-based permissions
- Audit all data mutations

### Performance Considerations

- Frontend: Use React Query caching effectively
- Backend: Optimize Prisma queries (avoid N+1)
- Database: Use indexes appropriately
- API: Implement pagination for large datasets

## Environment Variables

### Backend (`.env`)

- `DATABASE_URL` - SQL Server connection string
- `JWT_SECRET` - JWT signing secret
- `AZURE_AD_CLIENT_ID` - Azure AD app ID
- `AZURE_AD_TENANT_ID` - Azure AD tenant ID
- `AZURE_AD_CLIENT_SECRET` - Azure AD client secret
- `USE_MOCK_AUTH` - Enable mock auth (dev only)
- `NODE_ENV` - Environment (development/production)

### Frontend (`.env`)

- `VITE_API_URL` - Backend API URL (default: `http://localhost:3001/api/v1`)
- `VITE_AUTH_ENABLED` - Enable authentication

## Troubleshooting

### Common Issues

1. **Database connection errors**: Ensure Docker container is running (`npm run db:status`)
2. **Port conflicts**: Frontend (3000), Backend (3001) - use `npm run stop` to kill processes
3. **Prisma client errors**: Run `npm run prisma:generate`
4. **Type errors**: Ensure all packages are installed (`npm run install:all`)

### Getting Help

- Check design documents in `docs/` for architecture details
- Review existing code for patterns and conventions
- Check Swagger docs at `/api/docs` for API reference
- Review test files for usage examples
