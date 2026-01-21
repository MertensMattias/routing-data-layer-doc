# Admin & Configuration Pages - Review & Enhancement Plan

**Date**: 2026-01-20
**Reviewer**: UI Architect Agent
**Status**: Review Complete - Enhancement Plan Ready

---

## Executive Summary

Both AdminPage and ConfigurationPage are functional but **do not fully comply with GLOBAL_UI_DESIGN.md patterns**. The main issues are:

1. **❌ Not using TanStack Query** - All pages use manual `useState` + `useEffect` instead of TanStack Query
2. **❌ Missing permission checks** - No granular permission-based UI
3. **❌ Inconsistent component usage** - Using native `<select>` instead of shadcn/ui components
4. **❌ Missing common patterns** - No refresh buttons, last updated timestamps, proper error states
5. **⚠️ Form handling** - CompanyProjectsTab not using React Hook Form + Zod validation

**Compliance Score**: 
- AdminPage: **45%** (Basic structure OK, missing modern patterns)
- ConfigurationPage: **50%** (Better structure, but same issues)

---

## 1. AdminPage Review

### 1.1 Current Implementation Analysis

**Location**: `frontend/src/features/configuration/pages/AdminPage.tsx`

**Strengths:**
- ✅ Uses shadcn/ui components (Card, Tabs, Table, Button)
- ✅ Proper responsive design (sm:, lg: breakpoints)
- ✅ Good tab structure (Environment, Security, Audit Log)
- ✅ Export functionality implemented
- ✅ Basic error handling with toast notifications

**Critical Issues:**

1. **State Management (CRITICAL)**
   ```typescript
   // ❌ WRONG: Manual state management
   const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
   const [auditLoading, setAuditLoading] = useState(false);
   
   const loadAuditLogs = async (page: number = 0) => {
     setAuditLoading(true);
     // ... manual fetch
   };
   ```
   
   **Should be:**
   ```typescript
   // ✅ CORRECT: TanStack Query
   const { data: auditLogs, isLoading, refetch } = useQuery({
     queryKey: ['audit-logs', auditPage, auditFilters],
     queryFn: () => auditService.queryAuditLogs({...}),
   });
   ```

2. **Native HTML Select (CRITICAL)**
   ```typescript
   // ❌ WRONG: Native select
   <select
     className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
     value={auditFilters.entityType}
     onChange={(e) => {...}}
   >
   ```
   
   **Should be:**
   ```typescript
   // ✅ CORRECT: shadcn/ui Select
   <Select value={auditFilters.entityType} onValueChange={setEntityType}>
     <SelectTrigger>
       <SelectValue placeholder="All Types" />
     </SelectTrigger>
     <SelectContent>
       <SelectItem value="none">All Types</SelectItem>
       <SelectItem value="CompanyProject">Company Project</SelectItem>
     </SelectContent>
   </Select>
   ```

3. **Missing Permission Checks**
   - No permission checks for viewing audit logs
   - No permission checks for export functionality
   - Should check `GLOBAL_ADMIN` or `AUDIT_VIEWER` role

4. **Missing Common Components**
   - No `LoadingSpinner` or `LoadingSkeleton` from `@/components/common`
   - No `ErrorState` component for error display
   - No `EmptyState` for empty audit log
   - No refresh button with last updated timestamp

5. **Pagination Issues**
   - Manual pagination state management
   - No total count display
   - No page size selector
   - Should use TanStack Query's pagination patterns

### 1.2 Enhancement Plan for AdminPage

#### Phase 1: State Management Migration (HIGH PRIORITY)

**Tasks:**
1. Replace manual state with TanStack Query
   - Convert `loadAuditLogs` to `useQuery` hook
   - Use `queryKey` with filters and pagination
   - Implement `useMutation` for export (if needed)

2. Add query invalidation
   - Invalidate on filter changes
   - Auto-refresh on window focus (optional)

3. Add proper loading/error states
   - Use `LoadingSpinner` from `@/components/common`
   - Use `ErrorState` with retry button
   - Use `EmptyState` for no results

**Files to Modify:**
- `frontend/src/features/configuration/pages/AdminPage.tsx`

**Estimated Effort**: 2-3 hours

#### Phase 2: Component Standardization (MEDIUM PRIORITY)

**Tasks:**
1. Replace native `<select>` with shadcn/ui `Select`
   - Entity Type filter
   - Ensure proper styling matches design system

2. Add refresh button and timestamp
   - Add refresh button in Audit Log card header
   - Display `dataUpdatedAt` from TanStack Query
   - Match pattern from MessagesPage/RoutingPage

3. Improve pagination UI
   - Add total count display
   - Add page size selector (10, 20, 50, 100)
   - Better pagination controls

**Files to Modify:**
- `frontend/src/features/configuration/pages/AdminPage.tsx`

**Estimated Effort**: 1-2 hours

#### Phase 3: Permission & Accessibility (MEDIUM PRIORITY)

**Tasks:**
1. Add permission checks
   ```typescript
   const { hasPermission } = useAuth();
   const canViewAudit = hasPermission('GLOBAL_ADMIN') || hasPermission('AUDIT_VIEWER');
   const canExportAudit = hasPermission('GLOBAL_ADMIN');
   ```

2. Hide/disable actions based on permissions
   - Hide export button if no permission
   - Show access denied message if no view permission

3. Add ARIA labels and accessibility
   - Add `aria-label` to all icon buttons
   - Add `sr-only` text for screen readers
   - Ensure keyboard navigation works

**Files to Modify:**
- `frontend/src/features/configuration/pages/AdminPage.tsx`

**Estimated Effort**: 1 hour

#### Phase 4: Enhanced Features (LOW PRIORITY)

**Tasks:**
1. Add date range filter for audit logs
   - Date picker for start/end date
   - Default to last 30 days

2. Add advanced filters
   - Action type filter (CREATE, UPDATE, DELETE)
   - Status filter (success, error)
   - IP address search

3. Add audit log detail view
   - Expandable row to show full request/response
   - JSON viewer for complex data

**Files to Modify:**
- `frontend/src/features/configuration/pages/AdminPage.tsx`
- New: `frontend/src/features/configuration/components/AuditLogDetailDialog.tsx`

**Estimated Effort**: 3-4 hours

---

## 2. ConfigurationPage Review

### 2.1 Current Implementation Analysis

**Location**: `frontend/src/features/configuration/pages/ConfigurationPage.tsx`

**Strengths:**
- ✅ Proper permission check (GLOBAL_ADMIN only)
- ✅ Good tab structure (Languages, Voices, Projects)
- ✅ Access denied UI implemented
- ✅ Uses shadcn/ui components

**Critical Issues:**

1. **Tab Components Not Using TanStack Query**
   - `LanguageTab.tsx` - Manual state management
   - `VoiceTab.tsx` - Manual state management
   - `CompanyProjectsTab.tsx` - Manual state management
   
   All three tabs use:
   ```typescript
   // ❌ WRONG: Manual state
   const [languages, setLanguages] = useState<Language[]>([]);
   const [loading, setLoading] = useState(true);
   
   const loadLanguages = useCallback(async () => {
     setLoading(true);
     const data = await listLanguages(showInactive);
     setLanguages(data);
   }, [showInactive]);
   ```

2. **CompanyProjectsTab Form Issues**
   - Not using React Hook Form
   - Not using Zod validation
   - Manual form state management
   - No proper error handling

3. **Missing Common Patterns**
   - No refresh buttons
   - No last updated timestamps
   - Inconsistent error/loading states
   - Some tabs use Skeleton, others use simple text

4. **Permission Checks**
   - Page-level permission check is good
   - But individual actions (create/edit/delete) should also check permissions
   - Should check `GLOBAL_ADMIN` for all actions

### 2.2 Enhancement Plan for ConfigurationPage

#### Phase 1: Tab Components - State Management (HIGH PRIORITY)

**Tasks:**

1. **LanguageTab.tsx**
   - Convert to TanStack Query
   - Use `useQuery` for list
   - Use `useMutation` for create/update/delete
   - Add cache invalidation
   - Replace manual loading/error states with common components

2. **VoiceTab.tsx**
   - Same as LanguageTab
   - Convert filters to query keys
   - Use `useQuery` with filter dependencies

3. **CompanyProjectsTab.tsx**
   - Convert to TanStack Query
   - **CRITICAL**: Migrate to React Hook Form + Zod
   - Create form schema for validation
   - Use `useMutation` for all operations
   - Add proper error handling

**Files to Modify:**
- `frontend/src/features/configuration/components/dictionaries/LanguageTab.tsx`
- `frontend/src/features/configuration/components/dictionaries/VoiceTab.tsx`
- `frontend/src/features/configuration/components/company-projects/CompanyProjectsTab.tsx`

**Estimated Effort**: 4-5 hours

#### Phase 2: Standardize UI Patterns (MEDIUM PRIORITY)

**Tasks:**

1. Add refresh buttons to all tabs
   - Match pattern from MessagesPage
   - Add last updated timestamp
   - Use `dataUpdatedAt` from TanStack Query

2. Standardize loading states
   - Use `LoadingSkeleton` from `@/components/common` consistently
   - Remove custom skeleton implementations

3. Standardize error states
   - Use `ErrorState` component with retry button
   - Consistent error messaging

4. Standardize empty states
   - Use `EmptyState` component
   - Consistent messaging and actions

**Files to Modify:**
- All tab components
- `frontend/src/features/configuration/components/dictionaries/LanguageTab.tsx`
- `frontend/src/features/configuration/components/dictionaries/VoiceTab.tsx`
- `frontend/src/features/configuration/components/company-projects/CompanyProjectsTab.tsx`

**Estimated Effort**: 2-3 hours

#### Phase 3: Form Improvements (HIGH PRIORITY - CompanyProjectsTab)

**Tasks:**

1. Migrate CompanyProjectsTab to React Hook Form
   ```typescript
   // ✅ CORRECT: React Hook Form + Zod
   const formSchema = z.object({
     customerId: z.string().regex(/^[A-Z][A-Z0-9_]*$/, 'Must be UPPERCASE'),
     projectId: z.string().regex(/^[A-Z][A-Z0-9_]*$/, 'Must be UPPERCASE'),
     displayName: z.string().min(1, 'Required'),
     description: z.string().optional(),
     oktaGroup: z.string().optional(),
   });
   
   const form = useForm<FormData>({
     resolver: zodResolver(formSchema),
     defaultValues: {...}
   });
   ```

2. Add proper validation
   - Customer ID: UPPERCASE alphanumeric pattern
   - Project ID: UPPERCASE alphanumeric pattern
   - Display Name: Required, min length
   - Show validation errors below fields

3. Improve form UX
   - Disable submit button while submitting
   - Show loading state on submit
   - Clear form on success
   - Better error messages

**Files to Modify:**
- `frontend/src/features/configuration/components/company-projects/CompanyProjectsTab.tsx`
- New: `frontend/src/features/configuration/components/company-projects/CompanyProjectForm.tsx` (extract form to separate component)

**Estimated Effort**: 3-4 hours

#### Phase 4: Permission & Accessibility (MEDIUM PRIORITY)

**Tasks:**

1. Add granular permission checks
   - Check permissions for create/edit/delete actions
   - Hide buttons if no permission (don't just disable)
   - Show permission denied message if needed

2. Add accessibility improvements
   - ARIA labels on all icon buttons
   - Screen reader text for context
   - Keyboard navigation support
   - Focus management in dialogs

**Files to Modify:**
- All tab components
- All dialog components

**Estimated Effort**: 2 hours

---

## 3. Implementation Priority

### High Priority (Must Fix)
1. ✅ **AdminPage**: Migrate to TanStack Query
2. ✅ **ConfigurationPage Tabs**: Migrate to TanStack Query
3. ✅ **CompanyProjectsTab**: Migrate to React Hook Form + Zod
4. ✅ **Replace native selects**: Use shadcn/ui Select components

### Medium Priority (Should Fix)
5. ⚠️ **Add refresh buttons**: All pages need manual refresh + timestamp
6. ⚠️ **Standardize loading/error states**: Use common components
7. ⚠️ **Add permission checks**: Granular permission-based UI
8. ⚠️ **Improve pagination**: Better pagination UI for audit logs

### Low Priority (Nice to Have)
9. 🔵 **Advanced filters**: Date range, action type, status filters
10. 🔵 **Audit log detail view**: Expandable rows, JSON viewer
11. 🔵 **Bulk operations**: Bulk activate/deactivate for languages/voices

---

## 4. Code Examples

### Example 1: AdminPage with TanStack Query

```typescript
// frontend/src/features/configuration/pages/AdminPage.tsx
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/common';
import { RefreshCw } from 'lucide-react';

export function AdminPage() {
  const queryClient = useQueryClient();
  const [auditPage, setAuditPage] = useState(0);
  const [auditFilters, setAuditFilters] = useState({
    entityType: '',
    userId: '',
  });
  const AUDIT_PAGE_SIZE = 20;

  // ✅ CORRECT: TanStack Query
  const { 
    data: auditLogs = [], 
    isLoading, 
    error, 
    refetch,
    dataUpdatedAt 
  } = useQuery({
    queryKey: ['audit-logs', auditPage, auditFilters],
    queryFn: async () => {
      return await auditService.queryAuditLogs({
        limit: AUDIT_PAGE_SIZE,
        offset: auditPage * AUDIT_PAGE_SIZE,
        entityType: auditFilters.entityType || undefined,
        userId: auditFilters.userId || undefined,
      });
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const handleManualRefresh = () => {
    refetch();
    toast.info('Refreshing audit logs...');
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Audit Log</CardTitle>
          <div className="flex items-center gap-2">
            {dataUpdatedAt && (
              <span className="text-xs text-slate-500">
                Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="icon" onClick={handleManualRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {auditLogs.length === 0 ? (
          <EmptyState message="No audit logs found" />
        ) : (
          <Table>...</Table>
        )}
      </CardContent>
    </Card>
  );
}
```

### Example 2: LanguageTab with TanStack Query

```typescript
// frontend/src/features/configuration/components/dictionaries/LanguageTab.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/common';

export function LanguageTab() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // ✅ CORRECT: TanStack Query
  const { 
    data: languages = [], 
    isLoading, 
    error, 
    refetch,
    dataUpdatedAt 
  } = useQuery({
    queryKey: ['languages', showInactive],
    queryFn: () => listLanguages(showInactive),
    retry: 3,
  });

  // ✅ CORRECT: Mutation with cache invalidation
  const deleteMutation = useMutation({
    mutationFn: (code: string) => deleteLanguage(code))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success('Language deactivated successfully');
    },
  });

  // Filter client-side
  const filteredLanguages = useMemo(() => {
    if (!searchTerm.trim()) return languages;
    const term = searchTerm.toLowerCase();
    return languages.filter(
      (lang) =>
        lang.languageCode.toLowerCase().includes(term) ||
        lang.displayName.toLowerCase().includes(term)
    );
  }, [languages, searchTerm]);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Language Management</CardTitle>
          <div className="flex items-center gap-2">
            {dataUpdatedAt && (
              <span className="text-xs text-slate-500">
                Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLanguages.length === 0 ? (
          <EmptyState message="No languages found" />
        ) : (
          <Table>...</Table>
        )}
      </CardContent>
    </Card>
  );
}
```

### Example 3: CompanyProjectsTab with React Hook Form

```typescript
// frontend/src/features/configuration/components/company-projects/CompanyProjectsTab.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const projectFormSchema = z.object({
  customerId: z.string()
    .min(1, 'Customer ID is required')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Must be UPPERCASE alphanumeric'),
  projectId: z.string()
    .min(1, 'Project ID is required')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Must be UPPERCASE alphanumeric'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  oktaGroup: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

export function CompanyProjectsTab() {
  const queryClient = useQueryClient();
  
  // ✅ CORRECT: TanStack Query
  const { data: projects = [], isLoading, error, refetch } = useQuery({
    queryKey: ['company-projects'],
    queryFn: () => companyProjectService.listProjects(),
  });

  // ✅ CORRECT: React Hook Form
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      customerId: '',
      projectId: '',
      displayName: '',
      description: '',
      oktaGroup: '',
    },
  });

  // ✅ CORRECT: Mutation with cache invalidation
  const createMutation = useMutation({
    mutationFn: (data: ProjectFormData) => 
      companyProjectService.createProject({
        customerId: data.customerId.toUpperCase(),
        projectId: data.projectId.toUpperCase(),
        displayName: data.displayName,
        description: data.description || undefined,
        oktaGroup: data.oktaGroup || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-projects'] });
      toast.success('Project created successfully');
      form.reset();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to create project: ' + getApiErrorMessage(error));
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data);
  });

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer ID *</Label>
              <Input
                id="customerId"
                {...form.register('customerId')}
                className={form.formState.errors.customerId ? 'border-red-500' : ''}
              />
              {form.formState.errors.customerId && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.customerId.message}
                </p>
              )}
            </div>
            {/* More fields... */}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 5. Testing Checklist

After implementing enhancements, verify:

### AdminPage
- [ ] Audit logs load with TanStack Query
- [ ] Filters work correctly (entity type, user ID)
- [ ] Pagination works (previous/next buttons)
- [ ] Export functionality works
- [ ] Refresh button updates data
- [ ] Last updated timestamp displays
- [ ] Loading state shows during fetch
- [ ] Error state shows with retry button
- [ ] Empty state shows when no logs
- [ ] Native select replaced with shadcn/ui Select
- [ ] Permission checks work (if implemented)

### ConfigurationPage
- [ ] All tabs load data with TanStack Query
- [ ] Create/Edit/Delete operations work
- [ ] Cache invalidation triggers refresh
- [ ] Refresh buttons work on all tabs
- [ ] Last updated timestamps display
- [ ] Loading states use common components
- [ ] Error states use common components
- [ ] Empty states use common components
- [ ] CompanyProjectsTab uses React Hook Form
- [ ] Form validation works (customer ID, project ID patterns)
- [ ] Permission checks work (if implemented)

---

## 6. Estimated Total Effort

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| **Phase 1** | State Management Migration | 6-8 hours |
| **Phase 2** | Component Standardization | 3-5 hours |
| **Phase 3** | Form Improvements | 3-4 hours |
| **Phase 4** | Permission & Accessibility | 3 hours |
| **Total** | | **15-20 hours** |

---

## 7. Next Steps

1. **Review this plan** with the team
2. **Prioritize phases** based on business needs
3. **Start with Phase 1** (State Management Migration) - highest impact
4. **Test thoroughly** after each phase
5. **Update GLOBAL_UI_DESIGN.md** if new patterns are established

---

## 8. References

- **GLOBAL_UI_DESIGN.md**: `docs/design/ui-design/GLOBAL_UI_DESIGN.md`
- **UI Architect Guidelines**: `.claude/agents/ui-architect.md`
- **TanStack Query Docs**: https://tanstack.com/query/latest
- **React Hook Form Docs**: https://react-hook-form.com/
- **Zod Docs**: https://zod.dev/

---

**End of Plan**
