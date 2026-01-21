# Backend Agent Context

This document provides essential context for AI agents working on the NestJS backend of the Routing Data Layer application.

## Technology Stack

- **Framework**: NestJS 10.3.0
- **Language**: TypeScript 5.3.3
- **ORM**: Prisma 5.22.0
- **Database**: SQL Server (via Docker)
- **Authentication**: Passport.js (Azure AD + JWT)
- **Validation**: class-validator + class-transformer
- **API Documentation**: Swagger/OpenAPI (NestJS Swagger)
- **Testing**: Jest
- **Security**: Helmet, CORS, Throttler

## Project Structure

```
services/backend/src/
├── main.ts                 # Application entry point
├── app.module.ts          # Root module
├── auth/                  # Authentication & authorization
│   ├── auth.module.ts
│   ├── strategies/        # Passport strategies (Azure AD, JWT)
│   ├── guards/            # Auth guards (RoleGuard)
│   ├── decorators/        # Custom decorators (@Roles, @User, etc.)
│   └── ROLES.md           # Role definitions and permissions
├── core/                  # Core infrastructure
│   ├── prisma/            # Prisma service and module
│   ├── health/            # Health check endpoints
│   └── common/            # Common services and utilities
│       ├── filters/       # Exception filters
│       ├── interceptors/  # Interceptors (AuditInterceptor)
│       └── services/      # Shared services (AuditService, DataIntegrityService)
├── modules/               # Feature modules
│   ├── routing-table/     # Routing table management
│   ├── segment-store/     # Segment configuration
│   ├── message-store/     # Message store management
│   ├── company-project/   # Company/project management
│   ├── audit/             # Audit logging
│   ├── admin/             # Admin operations
│   └── dictionaries/      # Dictionary/lookup data
├── shared/                # Shared utilities
│   ├── export-import/     # Export/import functionality
│   └── validation/        # Validation utilities
└── scripts/               # Utility scripts
```

## Architecture Patterns

### NestJS Module Structure

Each feature follows NestJS module pattern:

```
modules/routing-table/
├── routing-table.module.ts    # Module definition
├── routing-table.controller.ts # REST endpoints
├── routing-table.service.ts    # Business logic
├── dto/                        # Data Transfer Objects
│   ├── create-routing-table.dto.ts
│   ├── update-routing-table.dto.ts
│   └── query.dto.ts
└── entities/                      # TypeScript interfaces/types
    └── routing-table.entity.ts
```

### Module Responsibilities

- **Controller**: Handles HTTP requests, validation, response formatting
- **Service**: Contains business logic, database operations
- **DTOs**: Define request/response shapes, validation rules
- **Entities**: TypeScript types matching database schema

### Dependency Injection

NestJS uses dependency injection. Always inject dependencies through constructor:

```typescript
@Injectable()
export class RoutingTableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}
}
```

## Database & Prisma

### Prisma Setup

- **Schema**: `prisma/schema.prisma`
- **Client**: Generated via `npm run prisma:generate`
- **Migrations**: `prisma/migrations_archived_old/`
- **Service**: `core/prisma/prisma.service.ts`

### Database Access

**Always use PrismaService, never import PrismaClient directly:**

```typescript
import { PrismaService } from '@/core/prisma/prisma.service';

@Injectable()
export class MyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.routingTable.findMany({
      where: { companyId: '...', projectId: '...' },
    });
  }
}
```

### Query Patterns

**Multi-tenancy filtering:**
```typescript
// Always filter by companyId and projectId
const items = await this.prisma.item.findMany({
  where: {
    companyId,
    projectId,
    // ... other filters
  },
});
```

**Include relations:**
```typescript
const item = await this.prisma.item.findUnique({
  where: { id },
  include: {
    relatedItems: true,
    // ... other relations
  },
});
```

**Transactions:**
```typescript
await this.prisma.$transaction(async (tx) => {
  await tx.item.create({ data: ... });
  await tx.otherItem.update({ where: { id }, data: ... });
});
```

### Schema Conventions

- **Table names**: PascalCase (e.g., `RoutingTable`, `MessageStore`)
- **Column names**: camelCase (e.g., `companyId`, `createdAt`)
- **Relations**: Use Prisma relation syntax
- **Indexes**: Add indexes for frequently queried columns
- **Constraints**: Use Prisma constraints for data integrity

## API Design

### RESTful Conventions

- **GET** `/resource` - List resources
- **GET** `/resource/:id` - Get single resource
- **POST** `/resource` - Create resource
- **PATCH** `/resource/:id` - Update resource (partial)
- **PUT** `/resource/:id` - Replace resource (full)
- **DELETE** `/resource/:id` - Delete resource

### Route Organization

Routes are organized by resource:
- `/api/v1/routing-tables` - Routing table operations
- `/api/v1/segments` - Segment operations
- `/api/v1/messages/stores` - Message store operations
- `/api/v1/messages/stores/:storeId/message-keys` - Message key operations

**Important**: Route order matters! Specific routes must come before parameterized routes:
```typescript
@Get('export')        // Must come first
async export() { ... }

@Get(':id')           // Comes after specific routes
async findOne(@Param('id') id: string) { ... }
```

### DTOs (Data Transfer Objects)

**Always use DTOs for request/response validation:**

```typescript
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoutingTableDto {
  @ApiProperty({ description: 'Routing table name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
```

**Validation Rules:**
- Use `class-validator` decorators
- Add Swagger `@ApiProperty` for documentation
- Use `@IsOptional()` for optional fields
- Use `@Type()` for nested objects
- Use `@Transform()` for data transformation

### Response Formatting

**Success responses:**
- Return data directly (NestJS serializes automatically)
- Use HTTP status codes appropriately (200, 201, 204)

**Error responses:**
- Use `HttpException` or custom exceptions
- Global exception filter handles formatting
- Include error message and status code

```typescript
throw new NotFoundException('Resource not found');
throw new BadRequestException('Invalid input');
```

### Swagger Documentation

**Always document endpoints:**

```typescript
@ApiTags('routing-table')
@Controller('routing-tables')
export class RoutingTableController {
  @Get()
  @ApiOperation({ summary: 'List all routing tables' })
  @ApiResponse({ status: 200, description: 'Success' })
  async findAll() { ... }
}
```

- Use `@ApiTags()` for grouping
- Use `@ApiOperation()` for endpoint description
- Use `@ApiResponse()` for response documentation
- Use `@ApiProperty()` in DTOs

## Authentication & Authorization

### Authentication

- **Azure AD**: Primary authentication method (production)
- **JWT**: Fallback authentication (development/testing)
- **Mock Auth**: Available in development (`USE_MOCK_AUTH=true`)

### Guards

**Use guards to protect routes:**

```typescript
@UseGuards(AuthGuard('azure-ad'), RoleGuard)
@Controller('routing-tables')
export class RoutingTableController { ... }
```

- `AuthGuard('azure-ad')` - Requires authentication
- `RoleGuard` - Requires specific roles (use `@Roles()` decorator)

### Roles

**Role definitions in `auth/ROLES.md`:**

- `ADMIN` - Full system access
- `COMPANY_ADMIN` - Company-level admin
- `PROJECT_ADMIN` - Project-level admin
- `EDITOR` - Can edit resources
- `VIEWER` - Read-only access

**Use `@Roles()` decorator:**

```typescript
@Roles('ADMIN', 'COMPANY_ADMIN')
@Post()
async create(@Body() dto: CreateDto) { ... }
```

### User Context

**Access current user:**

```typescript
import { User } from '@/auth/decorators/user.decorator';

@Get()
async findAll(@User() user: UserPayload) {
  // user contains: id, email, roles, companyId, projectId
}
```

### Company/Project Scoping

**Always scope queries by company/project:**

```typescript
@Get()
async findAll(
  @User() user: UserPayload,
  @Query('companyId') companyId?: string,
  @Query('projectId') projectId?: string,
) {
  const finalCompanyId = companyId || user.companyId;
  const finalProjectId = projectId || user.projectId;
  
  return this.service.findAll(finalCompanyId, finalProjectId);
}
```

## Business Logic

### Service Layer

**Business logic belongs in services, not controllers:**

```typescript
@Injectable()
export class RoutingTableService {
  async create(dto: CreateRoutingTableDto, userId: string) {
    // Validation
    // Business rules
    // Database operations
    // Audit logging
    return this.prisma.routingTable.create({ ... });
  }
}
```

### Data Integrity

**Use DataIntegrityService for complex validations:**

```typescript
import { DataIntegrityService } from '@/core/common/services/data-integrity.service';

// Check for circular references, orphaned records, etc.
await this.dataIntegrityService.validateRoutingTable(data);
```

### Audit Logging

**All mutations are automatically logged via AuditInterceptor:**

- Interceptor captures: user, action, resource, timestamp
- Stored in audit log table
- No manual logging needed for standard CRUD

**For custom audit entries:**

```typescript
import { AuditService } from '@/core/common/services/audit.service';

await this.auditService.log({
  action: 'CUSTOM_ACTION',
  resourceType: 'RoutingTable',
  resourceId: id,
  userId: user.id,
  details: { ... },
});
```

## Error Handling

### Exception Filters

**Global exception filter handles all errors:**

- Transforms exceptions to consistent format
- Logs errors appropriately
- Returns proper HTTP status codes

### Custom Exceptions

**Create domain-specific exceptions:**

```typescript
export class RoutingTableNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Routing table with ID ${id} not found`);
  }
}
```

### Validation Errors

**ValidationPipe automatically validates DTOs:**

- Returns 400 Bad Request with validation errors
- Error format is consistent
- No manual validation needed

## Testing

### Unit Tests

**Test services and utilities:**

```typescript
describe('RoutingTableService', () => {
  let service: RoutingTableService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RoutingTableService, PrismaService],
    }).compile();

    service = module.get<RoutingTableService>(RoutingTableService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create routing table', async () => {
    // Test implementation
  });
});
```

### E2E Tests

**Test full request/response cycle:**

```typescript
describe('RoutingTableController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/routing-tables (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/routing-tables')
      .expect(200);
  });
});
```

## Development Workflow

### Running the Backend

```bash
# Development (watch mode)
npm run dev

# Production build
npm run build
npm run start:prod

# Database migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Open Prisma Studio
npm run prisma:studio
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Tests
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

## Common Patterns

### Pagination

```typescript
@Get()
async findAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10,
) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    this.prisma.item.findMany({ skip, take: limit }),
    this.prisma.item.count(),
  ]);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### Filtering & Sorting

```typescript
@Get()
async findAll(
  @Query('search') search?: string,
  @Query('sortBy') sortBy?: string,
  @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
) {
  const where = search ? { name: { contains: search } } : {};
  const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' };
  
  return this.prisma.item.findMany({ where, orderBy });
}
```

### Soft Deletes

```typescript
// Mark as deleted instead of actually deleting
await this.prisma.item.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// Filter out deleted items
const items = await this.prisma.item.findMany({
  where: { deletedAt: null },
});
```

## Security Best Practices

1. **Never trust user input** - Always validate with DTOs
2. **Use parameterized queries** - Prisma handles this automatically
3. **Check permissions** - Use guards and role checks
4. **Scope by company/project** - Never expose data across tenants
5. **Sanitize output** - Don't expose sensitive data in responses
6. **Rate limiting** - ThrottlerModule is configured
7. **Security headers** - Helmet is configured
8. **CORS** - Properly configured for frontend origin

## Performance Considerations

1. **Avoid N+1 queries** - Use `include` or `select` appropriately
2. **Use indexes** - Add database indexes for frequently queried columns
3. **Pagination** - Always paginate large datasets
4. **Caching** - Consider caching for frequently accessed data
5. **Transactions** - Use transactions for related operations
6. **Batch operations** - Use `createMany`, `updateMany` when possible

## Important Notes

1. **Always use DTOs** - Never accept raw request bodies
2. **Validate everything** - Use class-validator decorators
3. **Handle errors gracefully** - Use appropriate HTTP exceptions
4. **Document APIs** - Use Swagger decorators
5. **Test your code** - Write unit and E2E tests
6. **Follow NestJS patterns** - Use dependency injection, modules, guards
7. **Scope by tenant** - Always filter by company/project
8. **Log important actions** - Audit interceptor handles most, but add custom logs when needed

## Resources

- NestJS Docs: https://docs.nestjs.com/
- Prisma Docs: https://www.prisma.io/docs/
- class-validator: https://github.com/typestack/class-validator
- Swagger/OpenAPI: https://swagger.io/specification/
