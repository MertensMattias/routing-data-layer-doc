# Developer Guide

Complete developer onboarding and reference guide for the IVR Routing Data Layer monorepo.

## Table of Contents

- [Getting Started](#getting-started)
- [Architecture Overview](#architecture-overview)
- [Development Workflows](#development-workflows)
- [Code Organization](#code-organization)
- [Key Concepts](#key-concepts)
- [Testing](#testing)
- [Debugging](#debugging)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** (for local SQL Server database)
- **Git**
- **Visual Studio Code** (recommended) with extensions:
  - Prisma
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

### First-Time Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd routing-data-layer-shared

# 2. Install all dependencies
npm run install:all

# 3. Set up database (starts Docker SQL Server + runs migrations)
npm run db:setup

# 4. Seed development data (optional but recommended)
npm run seeds

# 5. Start development environment (backend + frontend)
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api/docs
- **Database**: localhost:14330 (SQL Server)

### Environment Configuration

#### Backend `.env` ([services/backend/.env](../services/backend/.env))

```env
# Database
DATABASE_URL="sqlserver://localhost:14330;database=routing_data_layer;user=sa;password=YourStrong@Password123;encrypt=true;trustServerCertificate=true"

# Application
NODE_ENV=development
PORT=3001

# Authentication (Development)
USE_MOCK_AUTH=true
JWT_SECRET=change-this-to-a-secure-random-string-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Azure AD (Production)
# AZURE_AD_CLIENT_ID=your-client-id
# AZURE_AD_TENANT_ID=your-tenant-id
# AZURE_AD_CLIENT_SECRET=your-client-secret
```

#### Frontend `.env` ([frontend/.env](../frontend/.env))

```env
VITE_API_URL=/api/v1
VITE_AUTH_MODE=dev
```

## Architecture Overview

### System Architecture

```mermaid
graph TB
    User[User/Business Analyst]
    Frontend[React Frontend<br/>Vite + shadcn/ui]
    Backend[NestJS Backend<br/>REST API]
    Database[(SQL Server<br/>Prisma ORM)]
    Auth[Okta/Azure AD<br/>Authentication]
    IVR[IVR Runtime<br/>Call Engine]

    User -->|Manages Flows| Frontend
    Frontend -->|HTTP/JSON| Backend
    Backend -->|Prisma Queries| Database
    Backend -->|JWT Validation| Auth
    Auth -->|Groups & Roles| Backend
    IVR -->|Fetch Messages| Backend
    IVR -->|Read Flow Config| Backend

    style Frontend fill:#61DAFB
    style Backend fill:#E0234E
    style Database fill:#CC2927
    style Auth fill:#007FFF
    style IVR fill:#48B

9D6E
```

### Three-Layer Architecture

The system is built around three core domain layers that work together to manage IVR call flows:

```mermaid
graph LR
    RT[Routing Table<br/>Entry Points]
    SS[Segment Store<br/>Flow Graph]
    MS[Message Store<br/>Multilingual Content]

    RT -->|Links to| SS
    RT -->|Links to| MS
    SS -->|References| MS

    style RT fill:#90EE90
    style SS fill:#87CEEB
    style MS fill:#FFB6C1
```

#### 1. Routing Table Module

**Purpose**: Maps inbound identifiers (phone numbers, source IDs) to routing configurations.

**Location**: [services/backend/src/modules/routing-table/](../services/backend/src/modules/routing-table/)

**Key Responsibilities**:
- Map `sourceId` → `routingId` (entry point resolution)
- Link to message stores and segment stores
- Define initial segment for call flow
- Store feature flags and configuration
- Track version history for rollback

**Example**:
```json
{
  "sourceId": "1800SUPPORT",
  "routingId": "support_workflow_v3",
  "companyProjectId": 5,
  "messageStoreId": 12,
  "languageCode": "nl-BE",
  "initSegment": "init",
  "config": { "timeout": 30000 },
  "featureFlags": { "enableAI": true }
}
```

#### 2. Segment Store Module

**Purpose**: Defines the flow graph structure with segments (nodes) and transitions (edges).

**Location**: [services/backend/src/modules/segment-store/](../services/backend/src/modules/segment-store/)

**Key Responsibilities**:
- Define flow segments with types (routing, scheduler, menu, etc.)
- Configure segment-specific settings via key-value pairs
- Create transitions between segments (result → next segment)
- Validate flow graph integrity
- Support draft/publish workflow via ChangeSet

**Flow Graph Example**:
```mermaid
graph TD
    init[init<br/>entry_point]
    menu[menu<br/>interactive_voice]
    billing[billing_dept<br/>transfer]
    support[support_dept<br/>transfer]
    error[error_handler<br/>terminal]

    init -->|success| menu
    init -->|error| error
    menu -->|option_1| billing
    menu -->|option_2| support
    menu -->|timeout| error

    style init fill:#90EE90
    style menu fill:#87CEEB
    style billing fill:#FFD700
    style support fill:#FFD700
    style error fill:#FF6B6B
```

#### 3. Message Store Module (v5.0.0)

**Purpose**: Centralized multilingual content management with atomic versioning.

**Location**: [services/backend/src/modules/message-store/](../services/backend/src/modules/message-store/)

**Key Responsibilities**:
- Store multilingual messages by key (e.g., `WELCOME_PROMPT`)
- Atomic versioning: all languages move together in each version
- Support up to 10 versions per message with full rollback
- Fast runtime fetch (<30ms) for IVR calls
- Support multiple message types (TTS, audio URL, LLM prompts)

**Atomic Versioning Structure**:
```mermaid
graph TD
    MK[MessageKey: WELCOME_PROMPT<br/>publishedVersion: 2]
    V1[Version 1]
    V2[Version 2<br/>PUBLISHED]
    V1_NL[nl-BE: Welkom...]
    V1_FR[fr-BE: Bienvenue...]
    V2_NL[nl-BE: Welkom bij ons systeem...]
    V2_FR[fr-BE: Bienvenue à notre système...]

    MK --> V1
    MK --> V2
    V1 --> V1_NL
    V1 --> V1_FR
    V2 --> V2_NL
    V2 --> V2_FR

    style V2 fill:#90EE90
    style V2_NL fill:#D0F0D0
    style V2_FR fill:#D0F0D0
```

### ChangeSet Draft/Publish Pattern

All three domain modules use the **ChangeSet pattern** for safe deployment:

```mermaid
stateDiagram-v2
    [*] --> Draft: Create ChangeSet
    Draft --> Validating: Request Validation
    Validating --> Validated: Validation Success
    Validating --> Draft: Validation Failed
    Validated --> Publishing: Publish
    Publishing --> Published: Success
    Published --> [*]
    Draft --> Discarded: Discard
    Discarded --> [*]
```

**How it works**:
- **Draft Mode**: Changes isolated in a ChangeSet (UUID identifier)
- **ChangeSetId = NULL**: Published/active records (visible to runtime)
- **ChangeSetId = UUID**: Draft records (isolated, not visible to runtime)
- **Publishing**: Atomically replaces active records with draft records
- **Rollback**: Previous versions preserved for rollback

### Supporting Modules

#### Dictionaries Module

**Location**: [services/backend/src/modules/dictionaries/](../services/backend/src/modules/dictionaries/)

**Purpose**: Reference data management (languages, voices, segment types, message types, etc.)

**Key Tables**:
- `DicEnvironment` - Environment configurations (dvp/acc/prd)
- `DicCompanyProject` - Customer/project with Okta group mapping
- `DicLanguage` - Supported languages (BCP47 format)
- `DicSegmentType` - Segment type definitions with category and terminal flags
- `DicKey` - Configuration keys per segment type
- `DicMessageType` - Message types (tts, audio_url, llm_message, etc.)
- `DicVoice` - TTS voices per engine and language

#### Auth Module

**Location**: [services/backend/src/auth/](../services/backend/src/auth/)

**Purpose**: Two-level authentication and authorization

See [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md) for complete details.

#### Audit Module

**Location**: [services/backend/src/modules/audit/](../services/backend/src/modules/audit/)

**Purpose**: Track all changes with user, action, timestamp, and detailed change data.

## Development Workflows

### Daily Development Commands

```bash
# Start both services (recommended)
npm run dev

# Start services individually
npm run dev:backend           # Backend only (port 3001)
npm run dev:frontend          # Frontend only (port 3000)

# Building
npm run build:all             # Build everything
npm run build:backend         # Build backend only
npm run build:frontend        # Build frontend only

# Testing
npm run test:backend          # Jest tests (backend)
npm run test:frontend         # Vitest + type-check (frontend)
npm run verify:all            # Lint + test + build (both)

# Database operations
npm run db:start              # Start SQL Server container
npm run db:stop               # Stop SQL Server container
npm run db:status             # Check database status
npm run db:logs               # View database logs
npm run prisma:generate       # Generate Prisma client
npm run prisma:migrate        # Run migrations
npm run seeds                 # Run seed files

# Cleanup
npm run clean:all             # Remove all node_modules and builds
npm run rebuild               # Clean + install + generate
```

### Creating a New Feature

#### 1. Backend Feature (NestJS)

**Example: Adding a new configuration endpoint**

```bash
# 1. Create module structure
cd services/backend/src/modules
mkdir my-feature
cd my-feature

# 2. Create files
# - my-feature.module.ts
# - my-feature.controller.ts
# - my-feature.service.ts
# - dto/create-my-feature.dto.ts
# - dto/update-my-feature.dto.ts
```

**Service Example** ([services/backend/src/modules/my-feature/my-feature.service.ts](../services/backend/src/modules/my-feature/my-feature.service.ts)):

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateMyFeatureDto } from './dto/create-my-feature.dto';

@Injectable()
export class MyFeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMyFeatureDto) {
    return this.prisma.myFeature.create({
      data: {
        ...dto,
        createdBy: 'system',
        createdAt: new Date(),
      },
    });
  }

  async findAll() {
    return this.prisma.myFeature.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    const item = await this.prisma.myFeature.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`MyFeature with ID ${id} not found`);
    }

    return item;
  }
}
```

**Controller Example** ([services/backend/src/modules/my-feature/my-feature.controller.ts](../services/backend/src/modules/my-feature/my-feature.controller.ts)):

```typescript
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AppRole } from '@routing-data-layer/shared-types';
import { MyFeatureService } from './my-feature.service';
import { CreateMyFeatureDto } from './dto/create-my-feature.dto';

@ApiTags('my-feature')
@Controller('my-feature')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class MyFeatureController {
  constructor(private readonly service: MyFeatureService) {}

  @Post()
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Create new feature' })
  async create(@Body() dto: CreateMyFeatureDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(AppRole.GLOBAL_DEV, AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'List all features' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(AppRole.GLOBAL_DEV, AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Get feature by ID' })
  async findById(@Param('id') id: string) {
    return this.service.findById(parseInt(id, 10));
  }
}
```

#### 2. Frontend Feature (React)

**Example: Adding a new configuration page**

```bash
# 1. Create feature structure
cd frontend/src/features
mkdir my-feature
cd my-feature

# 2. Create files
# - MyFeaturePage.tsx (page component)
# - MyFeatureList.tsx (list component)
# - MyFeatureForm.tsx (form component)
# - hooks/useMyFeature.ts (data fetching)
# - types.ts (TypeScript types)
```

**Custom Hook Example** ([frontend/src/features/my-feature/hooks/useMyFeature.ts](../frontend/src/features/my-feature/hooks/useMyFeature.ts)):

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

interface MyFeature {
  id: number;
  name: string;
  isActive: boolean;
}

export function useMyFeatureList() {
  return useQuery({
    queryKey: ['my-feature', 'list'],
    queryFn: async () => {
      const { data } = await apiClient.get<MyFeature[]>('/my-feature');
      return data;
    },
  });
}

export function useCreateMyFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newFeature: Omit<MyFeature, 'id'>) => {
      const { data } = await apiClient.post('/my-feature', newFeature);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-feature'] });
    },
  });
}
```

**Component Example** ([frontend/src/features/my-feature/MyFeatureList.tsx](../frontend/src/features/my-feature/MyFeatureList.tsx)):

```tsx
import { useMyFeatureList } from './hooks/useMyFeature';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function MyFeatureList() {
  const { data, isLoading, error } = useMyFeatureList();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load features: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My Features</h2>
      <div className="grid gap-4">
        {data?.map((feature) => (
          <div key={feature.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{feature.name}</h3>
            <p className="text-sm text-gray-600">
              Status: {feature.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Database Workflows

#### Adding a New Table

1. **Update Prisma Schema** ([services/backend/prisma/schema.prisma](../services/backend/prisma/schema.prisma)):

```prisma
model MyNewTable {
  id          Int      @id @default(autoincrement())
  name        String   @db.NVarChar(100)
  description String?  @db.NVarChar(500)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  createdBy   String   @db.VarChar(100)
  updatedAt   DateTime @updatedAt
  updatedBy   String?  @db.VarChar(100)

  @@map("cfg_MyNewTable")
  @@schema("dbo")
}
```

2. **Create Migration**:

```bash
cd services/backend
npx prisma migrate dev --name add_my_new_table
```

3. **Generate Prisma Client**:

```bash
npm run prisma:generate
```

4. **Update Seed Files** (if needed):

Create [seeds/040-my-new-table.sql](../seeds/040-my-new-table.sql):

```sql
USE routing_data_layer;
GO

-- Insert reference data
INSERT INTO dbo.cfg_MyNewTable (name, description, isActive, createdBy)
VALUES
  ('Example 1', 'First example', 1, 'seed'),
  ('Example 2', 'Second example', 1, 'seed');
GO
```

## Code Organization

### Backend Structure

```
services/backend/src/
├── main.ts                      # Application bootstrap
├── app.module.ts                # Root module
├── auth/                        # Authentication & authorization
│   ├── decorators/              # @Roles, @RequireCustomerScope
│   ├── guards/                  # JwtAuthGuard, RoleGuard
│   ├── strategies/              # Azure AD strategy
│   └── ROLES.md                 # Role documentation
├── core/                        # Core infrastructure
│   ├── prisma/                  # Prisma service
│   ├── health/                  # Health check endpoints
│   └── common/                  # Filters, interceptors, pipes
├── modules/                     # Domain modules
│   ├── routing-table/
│   │   ├── routing-table.module.ts
│   │   ├── routing-table.controller.ts
│   │   ├── routing-table.service.ts
│   │   └── dto/
│   ├── segment-store/
│   ├── message-store/
│   ├── dictionaries/
│   ├── audit/
│   └── export-import/
└── shared/                      # Shared utilities
```

### Frontend Structure

```
frontend/src/
├── main.tsx                     # Application entry point
├── App.tsx                      # Root component
├── app/                         # App configuration
│   ├── router.tsx               # React Router setup
│   └── pages/                   # Top-level route components
├── api/                         # API client
│   ├── client.ts                # Axios instance
│   └── endpoints.ts             # Centralized endpoints
├── features/                    # Domain-specific features
│   ├── configuration/           # Dictionary management
│   ├── flow-designer/           # Visual flow editor
│   ├── messages/                # Message management
│   ├── routing/                 # Routing table management
│   └── segments/                # Segment management
├── components/                  # Reusable UI components
│   ├── ui/                      # shadcn/ui components
│   ├── common/                  # Shared business components
│   └── layout/                  # Layout components
├── contexts/                    # React Context providers
├── hooks/                       # Custom hooks
├── stores/                      # Zustand stores
└── styles/                      # Tailwind CSS configuration
```

## Key Concepts

### Routing Table: Entry Point Resolution

**Purpose**: Map inbound identifiers to flow configurations.

**Key Fields**:
- `sourceId`: Unique identifier (phone number, reference)
- `routingId`: Flow identifier
- `companyProjectId`: Customer/project link
- `messageStoreId`: Message library reference
- `initSegment`: Entry segment name

**Lifecycle**:
1. Create routing entry
2. Link to message store and company project
3. Define initial segment
4. Configure feature flags and settings
5. Publish to make active

### Segment Store: Flow Graph

**Purpose**: Define call flow logic with segments and transitions.

**Segment Types**:
- `entry_point`: Flow entry (must be first)
- `interactive_voice`: Menu with DTMF options
- `routing`: Conditional routing logic
- `scheduler`: Time-based routing
- `transfer`: Transfer to external number
- `intent_detection`: AI-powered intent recognition
- `terminal`: End call (must be last)

**Transitions**: Define `result → nextSegment` edges

**ChangeSet Workflow**:
1. Create ChangeSet (draft mode)
2. Add/edit segments and transitions
3. Validate flow graph
4. Publish ChangeSet (atomic replacement)

### Message Store: Atomic Versioning

**Purpose**: Centralized multilingual content management.

**Structure**:
- `MessageStore` → `MessageKey` → `MessageKeyVersion` → `MessageLanguageContent`

**Atomic Constraint**: Each version contains ALL languages (no partial versions).

**Workflow**:
1. Create message key with version 1 (all languages)
2. Create version 2 with updated content (all languages)
3. Publish version 2 (`publishedVersion = 2`)
4. Rollback if needed (set `publishedVersion = 1`)

**Runtime Query**:
```
MessageKey.messageKey = "WELCOME_PROMPT"
→ MessageKey.publishedVersion = 2
→ MessageKeyVersion.version = 2
→ MessageLanguageContent.language = "nl-BE"
→ Return content
```

## Testing

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing documentation.

### Backend Testing (Jest)

```bash
cd services/backend

# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# Specific test file
npm run test -- routing-table.service.spec.ts
```

### Frontend Testing (Vitest)

```bash
cd frontend

# Run tests
npm run test

# UI mode
npm run test:ui

# Coverage
npm run test:coverage
```

## Debugging

### Backend Debugging (VS Code)

Create [.vscode/launch.json](.vscode/launch.json):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:backend"],
      "cwd": "${workspaceFolder}/services/backend",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Frontend Debugging (Browser)

Use React DevTools browser extension and browser debugger with source maps.

### Database Debugging

```bash
# Open Prisma Studio (GUI)
cd services/backend
npx prisma studio

# View SQL queries (enable in Prisma)
# Add to services/backend/src/core/prisma/prisma.service.ts:
# log: ['query', 'info', 'warn', 'error']
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if database is running
npm run db:status

# View database logs
npm run db:logs

# Restart database
npm run db:stop && npm run db:start && npm run db:wait

# Reset database (destructive!)
cd services/backend
npx prisma migrate reset
```

### Port Already in Use

```bash
# Kill process on port 3001 (backend)
npm run stop:backend

# Kill process on port 3000 (frontend)
npm run stop:frontend
```

### Build Issues

```bash
# Full rebuild
npm run clean:all
npm run install:all
npm run prisma:generate
npm run build:all
```

### Prisma Client Out of Sync

```bash
cd services/backend
npx prisma generate
```

### Module Not Found Errors

```bash
# Rebuild shared packages
cd shared
npm run build

cd ../services/shared
npm run build

# Re-install
npm run install:all
```

## Related Documentation

- [README.md](../README.md) - Quick start and overview
- [CLAUDE.md](../CLAUDE.md) - AI assistant development guide
- [API_REFERENCE.md](API_REFERENCE.md) - Complete API documentation
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Database architecture
- [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md) - Auth and authorization
- [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) - Frontend development
- [BACKEND_GUIDE.md](BACKEND_GUIDE.md) - Backend development
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Production deployment
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing strategies
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
