# Contributing Guide

Guidelines for contributing to the IVR Routing Data Layer project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Code Style](#code-style)
- [Git Workflow](#git-workflow)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Code Review](#code-review)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and professional
- Provide constructive feedback
- Focus on what is best for the project
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks
- Publishing private information
- Unprofessional conduct

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (for database)
- Git

### Setup Development Environment

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/routing-data-layer-shared.git
cd routing-data-layer-shared

# 2. Install dependencies
npm run install:all

# 3. Set up database
npm run db:setup

# 4. Run tests
npm run verify:all

# 5. Start development
npm run dev
```

## Code Style

### TypeScript

**General Rules**:
- Use TypeScript strict mode
- No `any` types (use `unknown` if needed)
- Prefer `interface` over `type` for object shapes
- Use `const` for immutable values, `let` for mutable

**Naming Conventions**:
- **Variables/Functions**: camelCase (`messageKey`, `findById`)
- **Classes/Interfaces**: PascalCase (`MessageKeyService`, `CreateMessageDto`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- **Files**: kebab-case (`message-key.service.ts`)
- **Private members**: Prefix with underscore (`_privateMethod`)

**Examples**:

```typescript
// ✅ Good
interface MessageKey {
  messageKeyId: number;
  messageKey: string;
}

const MAX_VERSION_COUNT = 10;

class MessageKeyService {
  private readonly _maxRetries = 3;

  async findById(id: number): Promise<MessageKey> {
    // Implementation
  }
}

// ❌ Bad
interface messagekey { // Should be PascalCase
  id: number;
  key: string;
}

const maxVersionCount = 10; // Should be UPPER_SNAKE_CASE for constants

class messagekeyservice { // Should be PascalCase
  async findbyid(id: number): Promise<any> { // Should be camelCase, avoid 'any'
    // Implementation
  }
}
```

### Backend (NestJS)

**File Organization**:

```
modules/my-feature/
├── my-feature.module.ts
├── my-feature.controller.ts
├── my-feature.service.ts
├── my-feature.service.spec.ts
├── dto/
│   ├── create-my-feature.dto.ts
│   └── update-my-feature.dto.ts
└── entities/
    └── my-feature.entity.ts
```

**DTOs with Validation**:

```typescript
import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageKeyDto {
  @ApiProperty({ example: 'WELCOME_PROMPT', maxLength: 64 })
  @IsString()
  @Matches(/^[A-Z_]+$/, { message: 'Must be UPPER_SNAKE_CASE' })
  messageKey: string;

  @ApiProperty({ example: 'Welcome Greeting' })
  @IsString()
  displayName: string;

  @ApiProperty({ minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  messageTypeId: number;
}
```

**Service Pattern**:

```typescript
@Injectable()
export class MyFeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDto, userId: string) {
    // 1. Validate business rules
    // 2. Transform data if needed
    // 3. Database operation
    // 4. Return result
  }

  async findById(id: number) {
    const item = await this.prisma.myFeature.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Item ${id} not found`);
    }
    return item;
  }
}
```

### Frontend (React)

**Component Organization**:

```tsx
// MessageKeyList.tsx
import { useMessageKeyList } from './hooks/useMessageKey';
import { MessageKeyCard } from './MessageKeyCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/ui/alert';

interface MessageKeyListProps {
  storeId: number;
}

export function MessageKeyList({ storeId }: MessageKeyListProps) {
  const { data, isLoading, error } = useMessageKeyList(storeId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <Alert variant="destructive">{error.message}</Alert>;

  return (
    <div className="grid gap-4">
      {data?.map((message) => (
        <MessageKeyCard key={message.messageKeyId} message={message} />
      ))}
    </div>
  );
}
```

**Custom Hooks**:

```typescript
// useMessageKey.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export function useMessageKeyList(storeId: number) {
  return useQuery({
    queryKey: ['messages', 'stores', storeId, 'message-keys'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/messages/stores/${storeId}/message-keys`);
      return data;
    },
  });
}
```

### Linting

**ESLint Configuration** - Auto-fix on save:

```bash
# Run linter
npm run lint:backend
npm run lint:frontend

# Auto-fix
npm run lint:backend -- --fix
npm run lint:frontend -- --fix
```

## Git Workflow

### Branch Naming

```
feature/<short-description>    # New features
bugfix/<issue-number>          # Bug fixes
hotfix/<critical-issue>        # Production hotfixes
docs/<documentation-update>    # Documentation only
refactor/<refactoring-task>    # Code refactoring
```

**Examples**:
- `feature/message-version-rollback`
- `bugfix/1234-fix-segment-validation`
- `hotfix/auth-token-expiry`
- `docs/update-api-reference`

### Commit Messages

Follow **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, no logic change)
- `refactor`: Code restructuring (no feature/bug change)
- `test`: Adding or updating tests
- `chore`: Build, dependencies, tooling

**Examples**:

```bash
# Feature
git commit -m "feat(messages): add version rollback functionality"

# Bug fix
git commit -m "fix(auth): resolve JWT token expiry issue

- Update token refresh logic
- Add retry mechanism
- Closes #1234"

# Documentation
git commit -m "docs: update API reference for message endpoints"
```

### Pull Request Process

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make Changes and Commit**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push to Remote**:
   ```bash
   git push origin feature/my-new-feature
   ```

4. **Create Pull Request**:
   - Title: Clear, concise description
   - Description: Explain what, why, how
   - Link related issues
   - Add screenshots if UI changes

5. **PR Template**:

   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-reviewed code
   - [ ] Commented complex code
   - [ ] Updated documentation
   - [ ] No new warnings
   - [ ] Added tests
   ```

6. **Address Review Comments**:
   - Respond to all feedback
   - Make requested changes
   - Push updates

7. **Merge**:
   - Squash and merge (preferred)
   - Delete branch after merge

## Testing Requirements

### Required Tests

- **New Features**: Unit tests + integration tests
- **Bug Fixes**: Regression test
- **Refactoring**: Maintain existing test coverage

### Coverage Standards

- Minimum 80% coverage for new code
- Critical paths: 90% coverage
- All tests must pass before merge

### Running Tests

```bash
# Before committing
npm run verify:all

# Backend tests
cd services/backend
npm run test

# Frontend tests
cd frontend
npm run test
```

## Documentation

### When to Update Docs

✅ **Update documentation when**:
- Adding new features
- Changing APIs
- Modifying configuration
- Updating dependencies
- Fixing bugs that affect usage

### Documentation Standards

- Use clear, concise language
- Include code examples
- Update related docs (API reference, guides)
- Keep CLAUDE.md in sync with changes
- Add Mermaid diagrams for complex flows

### Documentation Files

- [README.md](../README.md) - Quick start
- [CLAUDE.md](../CLAUDE.md) - AI assistant guide
- [docs/](.) - Comprehensive guides
- Code comments - Complex logic only

## Code Review

### Reviewer Checklist

- ✅ Code follows style guidelines
- ✅ Tests included and passing
- ✅ Documentation updated
- ✅ No unnecessary complexity
- ✅ Security considerations addressed
- ✅ Performance implications considered
- ✅ Error handling appropriate
- ✅ No hardcoded secrets or credentials

### Review Etiquette

**For Reviewers**:
- Be respectful and constructive
- Explain "why" when requesting changes
- Acknowledge good work
- Suggest alternatives, don't just criticize

**For Authors**:
- Don't take feedback personally
- Ask for clarification if needed
- Thank reviewers for their time
- Address all comments

### Approval Process

- Requires at least 1 approval
- All comments resolved
- All tests passing
- No merge conflicts

## Related Documentation

- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Architecture and setup
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing strategies
- [BACKEND_GUIDE.md](BACKEND_GUIDE.md) - Backend patterns
- [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) - Frontend patterns
