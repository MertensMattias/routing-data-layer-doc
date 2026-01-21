# Frontend Agent Context

This document provides essential context for AI agents working on the frontend of the Routing Data Layer application.

## Technology Stack

- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Routing**: React Router DOM v7.12.0 (data router)
- **State Management**: 
  - **Server State**: TanStack React Query v5.90.16
  - **Client State**: Zustand v5.0.9
- **UI Components**: 
  - Radix UI (shadcn/ui components)
  - Material-UI v7.3.5
- **Styling**: Tailwind CSS v4.1.12
- **Forms**: React Hook Form v7.55.0 with Zod validation
- **Flow Diagrams**: @xyflow/react v12.10.0
- **Charts**: Recharts v2.15.2
- **Notifications**: Sonner v2.0.3
- **HTTP Client**: Axios v1.6.2

## Project Structure

```
frontend/src/
├── app/                    # App-level configuration
│   ├── App.tsx            # Root component with providers
│   ├── routes.tsx         # Route definitions
│   └── pages/             # App-level pages (Home, Demo, etc.)
├── components/            # Reusable components
│   ├── ui/                # shadcn/ui component library
│   ├── common/            # Common app components
│   └── layout/            # Layout components (AppLayout, etc.)
├── features/              # Feature modules (feature-based architecture)
│   ├── routing/           # Routing table management
│   ├── segments/          # Segment configuration
│   ├── messages/          # Message store management
│   ├── flow-designer/     # Visual flow editor
│   └── configuration/     # Admin/configuration pages
├── api/                   # API integration
│   ├── client.ts          # Axios client configuration
│   ├── endpoints.ts       # API endpoint definitions
│   └── types/             # API type definitions
├── services/              # Business logic services
│   ├── routing/           # Routing business logic
│   ├── segments/          # Segment business logic
│   ├── messages/          # Message business logic
│   ├── flows/             # Flow management logic
│   └── shared/            # Shared services (export/import)
├── contexts/              # React contexts
│   ├── CompanyProjectContext.tsx  # Company/project selection
│   └── ErrorContext.tsx           # Global error handling
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts         # Authentication hook
│   ├── usePermissions.ts  # Permission checking
│   └── useExportImport.ts # Export/import utilities
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── styles/                # Global styles and Tailwind config
```

## Architecture Patterns

### Feature-Based Structure

The frontend uses a **feature-based architecture** where each feature is self-contained:

```
features/routing/
├── components/        # Routing-specific components
├── pages/            # RoutingPage, etc.
├── hooks/            # Feature-specific hooks
├── services/         # Feature-specific services (if needed)
└── types.ts          # Feature-specific types
```

Each feature module exports its main page component and any public APIs.

### State Management Strategy

#### Server State (React Query)

**Always use React Query for server state:**
- All API calls should use React Query hooks
- Query keys follow a consistent pattern: `['resource', id, 'sub-resource']`
- Mutations use `useMutation` hook
- Queries use `useQuery` hook

**Example:**
```typescript
// Query
const { data, isLoading } = useQuery({
  queryKey: ['routing-tables', companyId, projectId],
  queryFn: () => routingService.getAll(companyId, projectId),
});

// Mutation
const mutation = useMutation({
  mutationFn: (data) => routingService.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['routing-tables'] });
  },
});
```

**React Query Configuration:**
- Default stale time: 2 minutes
- Default cache time: 10 minutes
- Retry: 2 attempts
- Refetch on window focus: disabled (for performance)

#### Client State (Zustand)

**Use Zustand for:**
- UI state (modals, sidebars, filters)
- Form state (complex forms with multiple steps)
- Flow designer state (draft changes, selections)
- Any state that doesn't come from the server

**Example:**
```typescript
import { create } from 'zustand';

interface FlowStore {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

export const useFlowStore = create<FlowStore>((set) => ({
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
}));
```

### API Integration

#### API Client

All API calls go through `src/api/client.ts`:
- Configured Axios instance with interceptors
- Automatic authentication token injection
- Error handling and transformation
- Base URL configuration

#### API Services

Business logic for API calls lives in `src/services/`:
- Each domain has its own service (routing, segments, messages, etc.)
- Services use the API client
- Services return typed responses
- Services handle request/response transformation

**Example:**
```typescript
// services/routing/routing.service.ts
import { apiClient } from '@/api/client';
import type { RoutingTable } from '@/api/types';

export const routingService = {
  getAll: async (companyId: string, projectId: string): Promise<RoutingTable[]> => {
    const response = await apiClient.get('/routing-tables', {
      params: { companyId, projectId },
    });
    return response.data;
  },
  
  create: async (data: CreateRoutingTableDto): Promise<RoutingTable> => {
    const response = await apiClient.post('/routing-tables', data);
    return response.data;
  },
};
```

#### API Types

Type definitions for API requests/responses are in `src/api/types/`:
- Organized by domain (routing.types.ts, segments.types.ts, etc.)
- Types should match backend DTOs
- Use branded types for IDs when appropriate

### Routing

The app uses **React Router v7 data router**:

- Routes defined in `src/app/routes.tsx`
- Nested routes for feature organization
- Route protection handled by layout components
- Navigation uses `useNavigate()` hook

**Route Structure:**
```
/                    → Redirects to /home
/home                → Dashboard
/routing             → Routing table management
/segments            → Segment list
/segments/settings   → Segment settings
/messages            → Message list
/messages/stores/:storeId/messages/:messageKey → Message detail
/flows/:routingId    → Flow editor (legacy)
/designer/:routingId → Flow designer
/admin               → Admin panel
/config              → Configuration
```

### Component Patterns

#### UI Components (shadcn/ui)

- Located in `src/components/ui/`
- Built on Radix UI primitives
- Styled with Tailwind CSS
- Follow shadcn/ui patterns and conventions
- Use `cn()` utility for conditional classes

#### Feature Components

- Located in `src/features/[feature]/components/`
- Feature-specific, not reusable across features
- Can use UI components and common components
- Should be co-located with the feature

#### Common Components

- Located in `src/components/common/`
- Reusable across multiple features
- Examples: `CompanyProjectSelector`, `ErrorBoundary`, `LoadingSpinner`

### Forms

**Always use React Hook Form with Zod validation:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = (data: FormData) => {
    // Handle submission
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

### Context Usage

#### CompanyProjectContext

**Always use for company/project scoping:**
- Provides current `companyId` and `projectId`
- All API calls should use these values
- Automatically updates when user changes selection
- Available via `useCompanyProject()` hook

#### ErrorContext

- Global error handling
- Displays error toasts/notifications
- Handles API errors consistently

#### AuthProvider

- Manages authentication state
- Provides `useAuth()` hook
- Handles token refresh
- Protects routes

### Styling

#### Tailwind CSS

- Primary styling approach
- Use utility classes
- Custom theme in `tailwind.config.js`
- Dark mode support via `next-themes`

#### Component Styling

- Prefer Tailwind utilities over CSS modules
- Use `cn()` utility for conditional classes
- For complex animations, use `motion` library
- Material-UI components can be used but prefer shadcn/ui

### TypeScript Patterns

#### Type Definitions

- Use `interface` for object shapes
- Use `type` for unions, intersections, and computed types
- Export types from feature modules
- Use branded types for IDs when needed

#### Path Aliases

- `@/` → `src/`
- Configured in `tsconfig.json` and `vite.config.ts`
- Always use absolute imports: `@/components/ui/button`

### Performance Optimization

#### React Query

- Use `staleTime` to prevent unnecessary refetches
- Use `select` to transform data and prevent re-renders
- Use `keepPreviousData` for pagination
- Invalidate queries strategically

#### React Optimization

- Use `React.memo()` for expensive components
- Use `useMemo()` and `useCallback()` appropriately
- Avoid creating objects/functions in render
- Lazy load heavy components

#### Code Splitting

- Use React.lazy() for route-based code splitting
- Vite handles automatic code splitting
- Consider lazy loading heavy libraries

### Testing

- **Unit Tests**: Vitest
- **Component Tests**: React Testing Library
- **Test Files**: `*.test.tsx` or `*.spec.tsx`
- **Test Location**: Co-located with components or in `__tests__/` folders

### Development Workflow

#### Running the App

```bash
# Development server (port 3000)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Tests
npm run test
npm run test:ui      # Vitest UI
npm run test:coverage
```

#### Adding New Features

1. Create feature folder in `src/features/[feature-name]/`
2. Add route in `src/app/routes.tsx`
3. Create API service in `src/services/[feature]/`
4. Add API types in `src/api/types/[feature].types.ts`
5. Create components in feature folder
6. Use React Query for data fetching
7. Add tests

### Common Patterns

#### Loading States

```typescript
const { data, isLoading, error } = useQuery(...);

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorState error={error} />;
if (!data) return <EmptyState />;

return <DataDisplay data={data} />;
```

#### Error Handling

```typescript
const mutation = useMutation({
  mutationFn: apiCall,
  onError: (error) => {
    toast.error(error.message || 'An error occurred');
  },
  onSuccess: () => {
    toast.success('Operation completed');
  },
});
```

#### Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: updateItem,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['items'] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['items']);
    
    // Optimistically update
    queryClient.setQueryData(['items'], (old) => 
      old.map(item => item.id === newData.id ? newData : item)
    );
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['items'], context.previous);
  },
});
```

### Important Notes

1. **Never use `any` type** - Always use proper TypeScript types
2. **Always handle loading and error states** - Don't assume data exists
3. **Use React Query for all server state** - Don't use useState for API data
4. **Follow feature-based structure** - Keep related code together
5. **Use path aliases** - Always use `@/` instead of relative paths
6. **Validate forms with Zod** - Don't skip validation
7. **Handle company/project context** - All API calls need scoping
8. **Test user interactions** - Not just rendering

### Debugging

- **React Query DevTools**: Available in development
- **React DevTools**: Use for component inspection
- **Browser DevTools**: Network tab for API calls
- **Console**: Check for React Query query keys and cache state

### Resources

- React Query Docs: https://tanstack.com/query/latest
- React Router Docs: https://reactrouter.com/
- shadcn/ui Docs: https://ui.shadcn.com/
- Tailwind CSS Docs: https://tailwindcss.com/
- Zustand Docs: https://zustand-demo.pmnd.rs/
