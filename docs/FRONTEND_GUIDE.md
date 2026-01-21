# Frontend Development Guide

Complete guide for frontend development with React, Vite, and shadcn/ui.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Component Patterns](#component-patterns)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Styling Guide](#styling-guide)
- [Testing](#testing)

## Tech Stack

### Core Framework

- **React** 18.3.1 - UI library
- **TypeScript** 5.9.3 - Type safety
- **Vite** 6.3.5 - Build tool and dev server
- **React Router** 7.12.0 - Client-side routing

### UI Components

- **shadcn/ui** - Component library (Radix UI + Tailwind)
- **Tailwind CSS** v4 - Utility-first CSS
- **Lucide React** - Icon library
- **@xyflow/react** 12.10.0 - Flow diagram editor

### State & Data

- **Zustand** 5.0.9 - Global state management
- **React Query** (@tanstack/react-query) 5.90.16 - Server state
- **Axios** 1.6.2 - HTTP client
- **react-hook-form** 7.55.0 - Form handling
- **Zod** 4.3.5 - Schema validation

### Testing

- **Vitest** 4.0.16 - Test runner
- **@testing-library/react** 16.3.1 - Component testing
- **jsdom** 27.4.0 - DOM environment

## Project Structure

```
frontend/src/
├── main.tsx                 # Application entry point
├── App.tsx                  # Root component with providers
├── app/                     # Application configuration
│   ├── router.tsx           # React Router setup
│   └── pages/               # Top-level route components
│       ├── HomePage.tsx
│       ├── FlowDesignerPage.tsx
│       └── ConfigurationPage.tsx
├── api/                     # API client configuration
│   ├── client.ts            # Axios instance with interceptors
│   └── endpoints.ts         # Centralized API routes
├── features/                # Domain-specific features
│   ├── configuration/       # Dictionary management
│   │   ├── LanguageList.tsx
│   │   ├── VoiceConfig.tsx
│   │   └── hooks/
│   ├── flow-designer/       # Visual flow editor
│   │   ├── FlowCanvas.tsx
│   │   ├── SegmentNode.tsx
│   │   ├── TransitionEdge.tsx
│   │   └── hooks/
│   ├── messages/            # Message management
│   │   ├── MessageKeyList.tsx
│   │   ├── MessageEditor.tsx
│   │   └── VersionHistory.tsx
│   ├── routing/             # Routing table management
│   └── segments/            # Segment management
├── components/              # Reusable UI components
│   ├── ui/                  # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── common/              # Shared business components
│   │   ├── DataTable.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── LoadingSpinner.tsx
│   └── layout/              # Layout components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── MainLayout.tsx
├── contexts/                # React Context providers
│   ├── AuthContext.tsx
│   ├── CompanyProjectContext.tsx
│   └── ErrorContext.tsx
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts
│   ├── useDomainPermissions.ts
│   ├── useDebounce.ts
│   └── useExportImport.ts
├── stores/                  # Zustand stores
│   ├── flowDesignerStore.ts
│   └── uiStore.ts
└── styles/                  # Tailwind configuration
    └── globals.css
```

## Development Setup

### Start Development Server

```bash
cd frontend
npm run dev
```

Server runs on http://localhost:3000

### Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=/api/v1
VITE_AUTH_MODE=dev
```

### VS Code Extensions

Recommended:
- ESLint
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

## Component Patterns

### Feature-Based Organization

Organize components by feature/domain:

```tsx
// features/messages/MessageKeyList.tsx
import { useMessageKeyList } from './hooks/useMessageKey';
import { MessageKeyCard } from './MessageKeyCard';

export function MessageKeyList() {
  const { data, isLoading } = useMessageKeyList();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="grid gap-4">
      {data?.map((message) => (
        <MessageKeyCard key={message.messageKeyId} message={message} />
      ))}
    </div>
  );
}
```

### shadcn/ui Components

Use shadcn/ui components for consistent UI:

```tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';

export function CreateMessageDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Message</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <FormField
            name="messageKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message Key</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="WELCOME_PROMPT" />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit">Create</Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Form Handling with react-hook-form + Zod

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const messageSchema = z.object({
  messageKey: z.string().min(1).max(64).regex(/^[A-Z_]+$/),
  displayName: z.string().min(1).max(200),
  messageTypeId: z.number(),
  languages: z.array(z.object({
    language: z.string(),
    content: z.string().min(1),
  })),
});

type MessageFormData = z.infer<typeof messageSchema>;

export function MessageForm() {
  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      messageKey: '',
      displayName: '',
      languages: [],
    },
  });

  const onSubmit = (data: MessageFormData) => {
    console.log(data);
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

### Error Boundaries

```tsx
// components/common/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-500 rounded">
          <h2 className="text-red-600 font-bold">Something went wrong</h2>
          <p className="text-sm">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## State Management

### Zustand for Global State

```tsx
// stores/flowDesignerStore.ts
import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';

interface FlowDesignerState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  selectNode: (id: string | null) => void;
}

export const useFlowDesignerStore = create<FlowDesignerState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  selectNode: (id) => set({ selectedNodeId: id }),
}));
```

**Usage**:

```tsx
function FlowCanvas() {
  const { nodes, edges, setNodes } = useFlowDesignerStore();

  return <ReactFlow nodes={nodes} edges={edges} onNodesChange={setNodes} />;
}
```

### React Query for Server State

```tsx
// features/messages/hooks/useMessageKey.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { MESSAGES } from '@/api/endpoints';

export function useMessageKeyList(storeId: number) {
  return useQuery({
    queryKey: ['messages', 'stores', storeId, 'message-keys'],
    queryFn: async () => {
      const { data } = await apiClient.get(MESSAGES.STORES.MESSAGE_KEYS.LIST(storeId));
      return data;
    },
  });
}

export function useCreateMessageKey(storeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newMessage: CreateMessageDto) => {
      const { data } = await apiClient.post(
        MESSAGES.STORES.MESSAGE_KEYS.CREATE(storeId),
        newMessage
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'stores', storeId] });
    },
  });
}
```

## API Integration

### Axios Client Setup

[frontend/src/api/client.ts](../frontend/src/api/client.ts):

```tsx
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add JWT token)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors, retry logic)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Centralized Endpoints

[frontend/src/api/endpoints.ts](../frontend/src/api/endpoints.ts):

```tsx
export const MESSAGES = {
  STORES: {
    LIST: '/messages/stores',
    BY_ID: (storeId: number) => `/messages/stores/${storeId}`,
    MESSAGE_KEYS: {
      LIST: (storeId: number) => `/messages/stores/${storeId}/message-keys`,
      BY_KEY: (storeId: number, messageKey: string) =>
        `/messages/stores/${storeId}/message-keys/${messageKey}`,
      CREATE: (storeId: number) => `/messages/stores/${storeId}/message-keys`,
      PUBLISH: (storeId: number, messageKey: string) =>
        `/messages/stores/${storeId}/message-keys/${messageKey}/publish`,
    },
  },
};
```

## Styling Guide

### Tailwind CSS v4

**Configuration** ([frontend/tailwind.config.js](../frontend/tailwind.config.js)):

```js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
      },
    },
  },
  plugins: [],
};
```

### Design System (shadcn/ui)

See [GLOBAL_UI_DESIGN.md](GLOBAL_UI_DESIGN.md) for complete design system.

**Color Palette**:
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)

**Spacing**: 4px base unit (space-1 = 4px)

**Typography**:
- Font family: Inter (system fallback)
- Heading: font-bold
- Body: font-normal

### Responsive Design

Use Tailwind breakpoints:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid: 1 col mobile, 2 tablet, 3 desktop */}
</div>
```

## Testing

### Component Tests (Vitest + Testing Library)

```tsx
// features/messages/MessageKeyList.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MessageKeyList } from './MessageKeyList';

describe('MessageKeyList', () => {
  it('renders message keys', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MessageKeyList />
      </QueryClientProvider>
    );

    expect(await screen.findByText('WELCOME_PROMPT')).toBeInTheDocument();
  });
});
```

### Run Tests

```bash
npm run test              # Run tests
npm run test:ui           # Interactive UI
npm run test:coverage     # With coverage
```

## Related Documentation

- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Overall architecture
- [API_REFERENCE.md](API_REFERENCE.md) - API endpoints
- [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md) - Auth integration
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing strategies
- [CONTRIBUTING.md](CONTRIBUTING.md) - Code style
