# Testing Guide

Comprehensive testing strategies for backend and frontend.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Backend Testing (Jest)](#backend-testing-jest)
- [Frontend Testing (Vitest)](#frontend-testing-vitest)
- [E2E Testing](#e2e-testing)
- [Test Data Management](#test-data-management)
- [Coverage Requirements](#coverage-requirements)

## Testing Philosophy

### Test Pyramid

```
        /\
       /E2E\          Few - Slow - Expensive
      /------\
     /  API  \        Some - Medium Speed
    /----------\
   / Unit Tests\      Many - Fast - Cheap
  /--------------\
```

**Strategy**:
- **Unit Tests** (70%): Test individual functions and components
- **Integration Tests** (20%): Test module interactions
- **E2E Tests** (10%): Test critical user flows

### What to Test

✅ **Do Test**:
- Business logic
- Data transformations
- Validation rules
- Error handling
- Edge cases
- Component rendering
- User interactions

❌ **Don't Test**:
- Third-party library internals
- Framework code
- Simple getters/setters
- Trivial code

## Backend Testing (Jest)

### Test Structure

```typescript
// my-feature.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
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
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MyFeatureService>(MyFeatureService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new feature', async () => {
      const dto = { name: 'Test Feature' };
      const expected = { id: 1, ...dto };

      jest.spyOn(prisma.myFeature, 'create').mockResolvedValue(expected);

      const result = await service.create(dto, 'user@example.com');

      expect(result).toEqual(expected);
      expect(prisma.myFeature.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          createdBy: 'user@example.com',
          createdAt: expect.any(Date),
        },
      });
    });

    it('should throw on validation error', async () => {
      const dto = { name: '' }; // Invalid

      await expect(service.create(dto, 'user@example.com')).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return feature when found', async () => {
      const mockFeature = { id: 1, name: 'Test' };

      jest.spyOn(prisma.myFeature, 'findUnique').mockResolvedValue(mockFeature);

      const result = await service.findById(1);

      expect(result).toEqual(mockFeature);
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

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyFeatureController],
      providers: [
        {
          provide: MyFeatureService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MyFeatureController>(MyFeatureController);
    service = module.get<MyFeatureService>(MyFeatureService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return feature', async () => {
      const dto = { name: 'Test' };
      const user = { email: 'test@example.com' };
      const expected = { id: 1, ...dto };

      mockService.create.mockResolvedValue(expected);

      const result = await controller.create(dto, user);

      expect(result).toEqual(expected);
      expect(service.create).toHaveBeenCalledWith(dto, user.email);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const pagination = { page: 1, limit: 50 };
      const expected = {
        data: [{ id: 1, name: 'Test' }],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
      };

      mockService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(pagination);

      expect(result).toEqual(expected);
      expect(service.findAll).toHaveBeenCalledWith(1, 50);
    });
  });
});
```

### Running Backend Tests

```bash
cd services/backend

# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# Specific test file
npm run test -- my-feature.service.spec.ts

# Test pattern
npm run test -- --testNamePattern="should create"

# Debug tests
npm run test:debug
```

### Test Coverage Report

```bash
npm run test:cov

# Output:
# --------------------|---------|----------|---------|---------|
# File                | % Stmts | % Branch | % Funcs | % Lines |
# --------------------|---------|----------|---------|---------|
# All files           |   85.23 |    78.45 |   90.12 |   86.78 |
# my-feature.service  |   92.50 |    88.00 |   95.00 |   93.00 |
# --------------------|---------|----------|---------|---------|
```

## Frontend Testing (Vitest)

### Component Tests

```tsx
// MessageKeyList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MessageKeyList } from './MessageKeyList';
import { apiClient } from '@/api/client';

// Mock API client
jest.mock('@/api/client');

describe('MessageKeyList', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders loading state', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MessageKeyList />
      </QueryClientProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders message keys when loaded', async () => {
    const mockMessages = [
      { messageKeyId: 1, messageKey: 'WELCOME_PROMPT', displayName: 'Welcome' },
      { messageKeyId: 2, messageKey: 'ERROR_MESSAGE', displayName: 'Error' },
    ];

    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockMessages });

    render(
      <QueryClientProvider client={queryClient}>
        <MessageKeyList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('WELCOME_PROMPT')).toBeInTheDocument();
      expect(screen.getByText('ERROR_MESSAGE')).toBeInTheDocument();
    });
  });

  it('renders error state on failure', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(
      <QueryClientProvider client={queryClient}>
        <MessageKeyList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
```

### Hook Tests

```tsx
// useMessageKey.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMessageKeyList } from './useMessageKey';
import { apiClient } from '@/api/client';

jest.mock('@/api/client');

describe('useMessageKeyList', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches message keys successfully', async () => {
    const mockData = [{ messageKeyId: 1, messageKey: 'TEST' }];

    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useMessageKeyList(12), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it('handles errors', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useMessageKeyList(12), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
```

### Running Frontend Tests

```bash
cd frontend

# Run tests
npm run test

# Watch mode
npm run test -- --watch

# UI mode
npm run test:ui

# Coverage
npm run test:coverage

# Specific test
npm run test -- MessageKeyList.test.tsx
```

## E2E Testing

### Test Critical User Flows

```typescript
// e2e/message-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Message Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create, edit, and publish message', async ({ page }) => {
    // Navigate to messages
    await page.click('text=Messages');
    await page.waitForURL('/messages');

    // Create new message
    await page.click('text=Create Message');
    await page.fill('[name="messageKey"]', 'TEST_MESSAGE');
    await page.fill('[name="displayName"]', 'Test Message');
    await page.selectOption('[name="messageTypeId"]', '1');
    await page.fill('[name="languages.0.content"]', 'Test content');
    await page.click('button:has-text("Create")');

    // Verify created
    await expect(page.locator('text=TEST_MESSAGE')).toBeVisible();

    // Edit message
    await page.click('text=TEST_MESSAGE');
    await page.click('text=Edit');
    await page.fill('[name="languages.0.content"]', 'Updated content');
    await page.click('button:has-text("Save")');

    // Publish
    await page.click('button:has-text("Publish")');
    await page.click('button:has-text("Confirm")');

    // Verify published
    await expect(page.locator('text=Published')).toBeVisible();
  });
});
```

## Test Data Management

### Test Fixtures

```typescript
// tests/fixtures/message.fixtures.ts
export const messageFixtures = {
  messageKey: {
    messageKeyId: 1,
    messageKey: 'WELCOME_PROMPT',
    displayName: 'Welcome Greeting',
    messageTypeId: 1,
    categoryId: 1,
    publishedVersion: 1,
  },

  messageVersion: {
    messageKeyVersionId: 'uuid-1',
    version: 1,
    versionName: 'Initial Version',
  },

  messageContent: {
    language: 'nl-BE',
    content: 'Welkom bij onze service',
    typeSettings: { voice: 'nl-BE-Wavenet-A' },
  },
};
```

### Database Seeding for Tests

```typescript
// tests/setup/seed-test-data.ts
import { PrismaClient } from '@prisma/client';

export async function seedTestData() {
  const prisma = new PrismaClient();

  await prisma.messageStore.create({
    data: {
      name: 'Test Store',
      companyProjectId: 1,
      allowedLanguages: JSON.stringify(['nl-BE', 'fr-BE']),
      defaultLanguage: 'nl-BE',
    },
  });

  await prisma.$disconnect();
}
```

## Coverage Requirements

### Minimum Coverage Targets

| Metric | Target | Critical Paths |
|--------|--------|----------------|
| Statements | 80% | 90% |
| Branches | 75% | 85% |
| Functions | 80% | 90% |
| Lines | 80% | 90% |

**Critical Paths**:
- Authentication & authorization
- Data validation
- Business logic
- API endpoints

### Coverage Report

```bash
# Backend
cd services/backend
npm run test:cov

# Frontend
cd frontend
npm run test:coverage

# View HTML report
open coverage/index.html
```

## Related Documentation

- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Development setup
- [BACKEND_GUIDE.md](BACKEND_GUIDE.md) - Backend patterns
- [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) - Frontend patterns
- [CONTRIBUTING.md](CONTRIBUTING.md) - Code standards
