# Backend Development Guide

Complete guide for backend development with NestJS and Prisma.

## Table of Contents

- [NestJS Architecture](#nestjs-architecture)
- [Module Structure](#module-structure)
- [Service Layer Patterns](#service-layer-patterns)
- [Controller Best Practices](#controller-best-practices)
- [Prisma Usage](#prisma-usage)
- [Testing](#testing)

## NestJS Architecture

### Core Concepts

- **Modules**: Organize application into cohesive blocks
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and data access
- **Providers**: Dependency injection
- **Guards**: Authentication and authorization
- **Interceptors**: Transform responses, logging
- **Pipes**: Validation and transformation

### Application Bootstrap

[services/backend/src/main.ts](../services/backend/src/main.ts):

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  // Validate security config
  validateSecurityConfig();

  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['api/docs', 'api/docs-json', 'api/docs-yaml'],
  });

  // Swagger documentation
  // ... (see main.ts for full setup)

  await app.listen(process.env.PORT || 3001);
}

bootstrap();
```

### Root Module

[services/backend/src/app.module.ts](../services/backend/src/app.module.ts):

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RoutingTableModule } from './modules/routing-table/routing-table.module';
import { SegmentStoreModule } from './modules/segment-store/segment-store.module';
import { MessageStoreModule } from './modules/message-store/message-store.module';
import { DictionariesModule } from './modules/dictionaries/dictionaries.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    RoutingTableModule,
    SegmentStoreModule,
    MessageStoreModule,
    DictionariesModule,
    AuditModule,
  ],
})
export class AppModule {}
```

## Module Structure

### Standard Module Pattern

```typescript
// my-feature.module.ts
import { Module } from '@nestjs/common';
import { MyFeatureController } from './my-feature.controller';
import { MyFeatureService } from './my-feature.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MyFeatureController],
  providers: [MyFeatureService],
  exports: [MyFeatureService], // Export if used by other modules
})
export class MyFeatureModule {}
```

### Directory Structure

```
modules/my-feature/
├── my-feature.module.ts        # Module definition
├── my-feature.controller.ts    # HTTP endpoints
├── my-feature.service.ts       # Business logic
├── my-feature.service.spec.ts  # Service tests
├── dto/                        # Data Transfer Objects
│   ├── create-my-feature.dto.ts
│   ├── update-my-feature.dto.ts
│   └── my-feature-response.dto.ts
└── entities/                   # Domain entities (optional)
    └── my-feature.entity.ts
```

## Service Layer Patterns

### Basic CRUD Service

```typescript
// my-feature.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateMyFeatureDto } from './dto/create-my-feature.dto';
import { UpdateMyFeatureDto } from './dto/update-my-feature.dto';

@Injectable()
export class MyFeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMyFeatureDto, userId: string) {
    return this.prisma.myFeature.create({
      data: {
        ...dto,
        createdBy: userId,
        createdAt: new Date(),
      },
    });
  }

  async findAll(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.myFeature.findMany({
        where: { isActive: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.myFeature.count({ where: { isActive: true } }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const item = await this.prisma.myFeature.findUnique({
      where: { id },
      include: {
        relatedEntity: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`MyFeature with ID ${id} not found`);
    }

    return item;
  }

  async update(id: number, dto: UpdateMyFeatureDto, userId: string) {
    // Check existence
    await this.findById(id);

    return this.prisma.myFeature.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: number) {
    // Check existence
    await this.findById(id);

    // Soft delete
    return this.prisma.myFeature.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
```

### Transaction Handling

```typescript
async createWithRelations(dto: CreateWithRelationsDto, userId: string) {
  return this.prisma.$transaction(async (tx) => {
    // Create main entity
    const mainEntity = await tx.myFeature.create({
      data: {
        name: dto.name,
        createdBy: userId,
      },
    });

    // Create related entities
    await tx.relatedEntity.createMany({
      data: dto.relatedItems.map((item) => ({
        myFeatureId: mainEntity.id,
        ...item,
      })),
    });

    // Create audit record
    await tx.auditLog.create({
      data: {
        action: 'created',
        entityType: 'MyFeature',
        entityId: mainEntity.id,
        actionBy: userId,
      },
    });

    return mainEntity;
  });
}
```

## Controller Best Practices

### REST Controller Pattern

```typescript
// my-feature.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RequireCustomerScope } from '../../auth/decorators/require-customer-scope.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AppRole } from '@routing-data-layer/shared-types';
import { MyFeatureService } from './my-feature.service';
import { CreateMyFeatureDto } from './dto/create-my-feature.dto';
import { UpdateMyFeatureDto } from './dto/update-my-feature.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';

@ApiTags('my-feature')
@Controller('my-feature')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class MyFeatureController {
  constructor(private readonly service: MyFeatureService) {}

  @Post()
  @Roles(AppRole.GLOBAL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new feature' })
  @ApiResponse({ status: 201, description: 'Feature created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Body() dto: CreateMyFeatureDto,
    @CurrentUser() user: any,
  ) {
    return this.service.create(dto, user.email);
  }

  @Get()
  @Roles(AppRole.GLOBAL_DEV, AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'List all features' })
  @ApiResponse({ status: 200, description: 'Features retrieved successfully' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination.page, pagination.limit);
  }

  @Get(':id')
  @Roles(AppRole.GLOBAL_DEV, AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Get feature by ID' })
  @ApiResponse({ status: 200, description: 'Feature found' })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async findById(@Param('id') id: string) {
    return this.service.findById(parseInt(id, 10));
  }

  @Put(':id')
  @Roles(AppRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Update feature' })
  @ApiResponse({ status: 200, description: 'Feature updated' })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMyFeatureDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(parseInt(id, 10), dto, user.email);
  }

  @Delete(':id')
  @Roles(AppRole.GLOBAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete feature' })
  @ApiResponse({ status: 204, description: 'Feature deleted' })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async delete(@Param('id') id: string) {
    await this.service.delete(parseInt(id, 10));
  }
}
```

### Customer-Scoped Controller

```typescript
@Get('customers/:customerId/features')
@Roles(AppRole.GLOBAL_DEV, AppRole.GLOBAL_ADMIN)
@RequireCustomerScope({ paramName: 'customerId', strict: true })
@ApiOperation({ summary: 'Get features for customer' })
async findByCustomer(@Param('customerId') customerId: string) {
  return this.service.findByCustomer(customerId);
}
```

## Prisma Usage

### Prisma Service

[services/backend/src/core/prisma/prisma.service.ts](../services/backend/src/core/prisma/prisma.service.ts):

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Common Query Patterns

**Find with Relations**:

```typescript
const message = await this.prisma.messageKey.findUnique({
  where: { messageKeyId: id },
  include: {
    messageStore: true,
    messageType: true,
    category: true,
    versions: {
      where: { isActive: true },
      include: {
        languages: true,
      },
    },
  },
});
```

**Pagination**:

```typescript
const [data, total] = await Promise.all([
  this.prisma.myEntity.findMany({
    skip: (page - 1) * limit,
    take: limit,
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  }),
  this.prisma.myEntity.count({ where: { isActive: true } }),
]);
```

**Upsert**:

```typescript
await this.prisma.myEntity.upsert({
  where: { uniqueField: value },
  update: { ...updateData },
  create: { ...createData },
});
```

**Batch Operations**:

```typescript
await this.prisma.myEntity.createMany({
  data: items.map((item) => ({
    ...item,
    createdBy: userId,
  })),
  skipDuplicates: true,
});
```

## Testing

### Service Unit Tests

```typescript
// my-feature.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MyFeatureService } from './my-feature.service';
import { PrismaService } from '../../core/prisma/prisma.service';

describe('MyFeatureService', () => {
  let service: MyFeatureService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyFeatureService,
        {
          provide: PrismaService,
          useValue: {
            myFeature: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MyFeatureService>(MyFeatureService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a feature when found', async () => {
      const mockFeature = { id: 1, name: 'Test' };
      jest.spyOn(prisma.myFeature, 'findUnique').mockResolvedValue(mockFeature);

      const result = await service.findById(1);

      expect(result).toEqual(mockFeature);
      expect(prisma.myFeature.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when not found', async () => {
      jest.spyOn(prisma.myFeature, 'findUnique').mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Controller Tests

```typescript
// my-feature.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MyFeatureController } from './my-feature.controller';
import { MyFeatureService } from './my-feature.service';

describe('MyFeatureController', () => {
  let controller: MyFeatureController;
  let service: MyFeatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyFeatureController],
      providers: [
        {
          provide: MyFeatureService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MyFeatureController>(MyFeatureController);
    service = module.get<MyFeatureService>(MyFeatureService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const mockResult = {
        data: [{ id: 1, name: 'Test' }],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.findAll({ page: 1, limit: 50 });

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(1, 50);
    });
  });
});
```

## Related Documentation

- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Overall architecture
- [API_REFERENCE.md](API_REFERENCE.md) - API endpoints
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Prisma schema
- [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md) - Auth implementation
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing strategies
