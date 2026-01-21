# Routing Data Layer

A full-stack TypeScript monorepo for managing IVR (Interactive Voice Response) routing data, message stores, and segment configurations. This system enables business users to design complex call flows through a visual interface while maintaining data integrity, version control, and multi-tenant isolation.

## Overview

The Routing Data Layer provides a three-layer architecture for managing automated phone call experiences:

- **Routing Table**: Maps source IDs to routing IDs and manages flow initialization
- **Segment Store**: Defines the flow graph structure with segments and transitions (the "what happens next" logic)
- **Message Store**: Manages multilingual messages with atomic versioning (the audio content)

Together, these layers enable self-service configuration of IVR systems, allowing business analysts to design call flows without developer intervention while maintaining enterprise-grade safety through draft/publish workflows and comprehensive audit trails.

## User Interface

The IVR Routing Manager provides an intuitive web-based interface for managing routing configurations, segments, and messages.

### Routing Management

The Routing Management page allows you to search, view, and manage IVR routing configurations. You can filter by routing ID, source ID, language, message store, and initial segment.

![Routing Management](./docs/images/Routing.png)

**Specification**: [Routing Table Design](./docs/images/ROUTING_TABLE_DESIGN.md)

### Segment Configuration

The Segment Settings page provides detailed configuration for each segment in your call flows. You can edit segment properties, configure transitions, and manage segment types.

![Segment Configuration](./docs/images/SegmentPage.png)

**Specification**: [Segment Store Design](./docs/images/SEGMENT_STORE_DESIGN.md)

### Message Management

The Messages page enables you to manage multilingual audio messages with atomic versioning. Edit message content across languages, configure text-to-speech settings, and manage message versions.

![Message Management](./docs/images/MessagePage.png)

**Specification**: [Message Store Design](./docs/images/MESSAGE_STORE_DESIGN.md)

## Features

- 🎨 **Visual Flow Designer**: Drag-and-drop interface for designing call flows using [@xyflow/react](https://xyflow.com/)
- 🔄 **Draft/Publish Workflow**: Safe deployment with ChangeSet-based versioning and rollback capabilities
- 🌍 **Multi-language Support**: Atomic versioning ensures all languages are included in each message version
- 🔐 **Role-Based Access Control**: Two-level security model with domain roles and customer scopes
- 📊 **Audit Trail**: Complete change tracking with user, action, timestamp, and detailed change logs
- 🏢 **Multi-tenant Architecture**: Isolated configuration for multiple customers on shared infrastructure
- 📦 **Export/Import**: JSON-based data migration across environments
- 🧪 **Type-Safe**: Full TypeScript coverage with shared types across frontend and backend

## Tech Stack

### Backend
- **Framework**: NestJS
- **Database**: SQL Server with Prisma ORM
- **Authentication**: Okta (JWT-based)
- **Testing**: Jest

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui with Tailwind CSS v4
- **State Management**: Zustand
- **Data Fetching**: React Query (@tanstack/react-query)
- **Flow Designer**: @xyflow/react
- **Testing**: Vitest

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (for local SQL Server database)

### Initial Setup

```bash
# 1. Install all dependencies
npm run install:all

# 2. Set up database (starts Docker SQL Server + runs migrations)
npm run db:setup

# 3. Start development environment (backend + frontend)
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:14330

### Optional: Seed Development Data

```bash
# Populate database with sample data
npm run seeds
```

## Development

### Running Services

```bash
# Start both backend and frontend
npm run dev

# Start services individually
npm run dev:backend    # Backend only (port 3001)
npm run dev:frontend   # Frontend only (port 3000)
```

### Building

```bash
# Build everything
npm run build:all

# Build individually
npm run build:backend
npm run build:frontend
```

### Testing

```bash
# Run all tests
npm run test:backend   # Jest tests
npm run test:frontend  # Vitest tests

# Verify everything (lint + test + build)
npm run verify:all
```

### Database Management

```bash
# Start/stop database
npm run db:start
npm run db:stop
npm run db:status      # Check status
npm run db:logs        # View logs

# Database migrations
npm run prisma:migrate # Run migrations
npm run prisma:generate # Generate Prisma client

# Reset database (⚠️ destructive)
npm run prisma:reset
```

## Project Structure

```
routing-data-layer-shared/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── app/             # App configuration and routing
│   │   ├── features/        # Domain-specific features
│   │   │   ├── flow-designer/  # Visual flow editor
│   │   │   └── configuration/  # Dictionary management
│   │   ├── components/      # Reusable UI components
│   │   └── hooks/           # Custom React hooks
│   └── package.json
│
├── services/
│   ├── backend/             # NestJS backend API
│   │   ├── src/
│   │   │   ├── modules/     # Domain modules
│   │   │   │   ├── routing-table/
│   │   │   │   ├── segment-store/
│   │   │   │   ├── message-store/
│   │   │   │   ├── dictionaries/
│   │   │   │   └── audit/
│   │   │   ├── auth/        # Authentication & authorization
│   │   │   └── shared/      # Shared utilities
│   │   ├── prisma/          # Database schema and migrations
│   │   └── package.json
│   │
│   └── shared/              # Shared DTOs and service contracts
│       └── src/
│
├── shared/                  # Core types and role definitions
│   └── types/
│
├── seeds/                   # Database seed files
├── scripts/                 # Utility scripts
├── infrastructure/          # Docker Compose and Azure configs
└── docs/                    # Design documentation
    ├── ROUTING_TABLE_DESIGN.md
    ├── SEGMENT_STORE_DESIGN.md
    ├── MESSAGE_STORE_DESIGN_DOCUMENT.md
    └── GLOBAL_UI_DESIGN.md
```

## Architecture

### Three-Layer System

1. **Routing Table Module**
   - Maps `sourceId` → `routingId`
   - Links to message stores
   - Manages routing table lifecycle

2. **Segment Store Module**
   - Segments define flow nodes (routing, scheduler, intent_detection, etc.)
   - Segment keys hold configuration values
   - Transitions define edges between segments
   - Uses ChangeSet pattern for draft/publish workflow

3. **Message Store Module**
   - Message stores contain messages grouped by `customerId`/`projectId`
   - **Atomic Versioning**: Each version contains ALL languages
   - Structure: `MessageKey` → `MessageKeyVersion` → `MessageLanguageContent`
   - PublishedVersion tracks the active version

### ChangeSet Pattern

All domain modules use the ChangeSet pattern for safe deployment:

- **Draft Mode**: Changes are isolated in a ChangeSet (identified by ChangeSetId)
- **Publishing**: Atomically replaces active records with draft records
- **Rollback**: Can revert to previous versions
- **Isolation**: Draft changes don't affect production data until published

### Authentication & Authorization

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

## Environment Configuration

### Backend (`.env`)

```env
DATABASE_URL="sqlserver://localhost:14330;database=routing_data_layer;user=sa;password=YourStrong@Password123;encrypt=true;trustServerCertificate=true"
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env`)

```env
VITE_API_URL=/api/v1
VITE_AUTH_MODE=dev
```

## Key Concepts

### Message Store Versioning

**Critical**: MessageStore uses atomic versioning where each version contains ALL languages:

- Cannot publish a version missing languages
- Each `MessageKeyVersion` must include all supported languages
- `PublishedVersion` tracks the active version (1-indexed)

### Database Schema

Tables are organized by prefix:
- `cfg_*` - Configuration tables (dictionaries, company projects)
- `rt_*` - Routing table tables
- `seg_*` - Segment store tables
- `msg_*` - Message store tables
- `audit_*` - Audit log tables

## Troubleshooting

### Database Connection Issues

```bash
# Check if database is running
npm run db:status

# View database logs
npm run db:logs

# Restart database
npm run db:stop
npm run db:start
npm run db:wait
```

### Build Issues

```bash
# Full rebuild
npm run clean:all
npm run install:all
npm run prisma:generate
npm run build:all
```

### Port Conflicts

```bash
# Stop services on ports
npm run stop:backend   # Kills process on port 3001
npm run stop:frontend  # Kills process on port 3000
```

## Documentation

For detailed information, see:

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive development guide and reference
- **[Design Documents](./docs/)** - Architecture and design specifications
  - [Routing Table Design](./docs/ROUTING_TABLE_DESIGN.md)
  - [Segment Store Design](./docs/SEGMENT_STORE_DESIGN.md)
  - [Message Store Design](./docs/MESSAGE_STORE_DESIGN_DOCUMENT.md)
  - [Global UI Design](./docs/GLOBAL_UI_DESIGN.md)
- **[Seeds README](./seeds/README.md)** - Database seeding documentation
- **[Scripts README](./scripts/README.md)** - Utility scripts documentation

## Common Commands Reference

```bash
# Development
npm run dev                    # Start both services
npm run dev:backend           # Backend only
npm run dev:frontend          # Frontend only

# Building
npm run build:all             # Build everything
npm run build:backend         # Backend only
npm run build:frontend        # Frontend only

# Testing
npm run test:backend          # Jest tests
npm run test:frontend         # Vitest tests
npm run verify:all            # Lint + test + build

# Database
npm run db:setup              # Initial setup
npm run db:start              # Start container
npm run db:stop               # Stop container
npm run db:status             # Check status
npm run prisma:migrate        # Run migrations
npm run prisma:generate       # Generate client
npm run seeds                 # Run seed files

# Cleanup
npm run clean:all             # Remove node_modules and builds
npm run rebuild               # Clean + install + generate
```

## Contributing

When contributing to this project:

1. Follow the code style guidelines in [CLAUDE.md](./CLAUDE.md)
2. Ensure all tests pass: `npm run verify:all`
3. Update documentation as needed
4. Use TypeScript strictly (no `any` types)
5. Follow the existing patterns for services, controllers, and components

## License

ISC
