# Authentication & Authorization Documentation

## Overview

This application uses **Okta groups** for authentication and authorization with a **two-level security model**:

1. **Domain Roles**: Control what actions users can perform (viewer, editor, ops, admin)
2. **Customer Scopes**: Control which customer data users can access

Both levels must pass for a user to access a resource.

## Okta Group Structure

### Domain Role Groups

Domain roles are assigned via Okta groups that map directly to application permissions:

```
global-admin                    # Full system access
global-dev                      # Development/debugging access

routing-table-viewer            # View routing tables
routing-table-editor            # Create/edit routing tables  
routing-table-ops               # Publish/rollback routing tables
routing-table-admin             # Full routing table management

message-store-viewer            # View messages
message-store-editor            # Create/edit messages
message-store-ops               # Publish/rollback messages
message-store-admin             # Full message management

segment-store-viewer            # View segments
segment-store-editor            # Create/edit segments
segment-store-ops               # Publish/rollback segments
segment-store-admin             # Full segment management
```

### Customer Scope Groups

Customer scopes restrict data visibility to specific customers using the pattern:

```
okta-{customerId}-flow

Examples:
- okta-digipolis-flow          # Access Digipolis customer data
- okta-acme-flow               # Access ACME customer data
- okta-contoso-flow            # Access Contoso customer data
```

A user can have multiple customer scope groups to access data for multiple customers.

## Role Hierarchy

### Permission Levels (from least to most permissive)

1. **VIEWER**: Read-only access
   - Can view data in their domain
   - Cannot make any changes

2. **EDITOR**: Content management
   - All VIEWER permissions
   - Can create new content
   - Can edit draft/unpublished content
   - Cannot publish or delete

3. **OPS**: Operational control
   - All VIEWER permissions
   - Can publish content to production
   - Can rollback published content
   - Cannot create/edit content (operational focus)

4. **ADMIN**: Full domain control
   - All VIEWER, EDITOR, and OPS permissions
   - Can delete content
   - Can manage schema changes
   - Full administrative access within domain

5. **GLOBAL_ADMIN**: Full system access
   - All permissions across all domains
   - Bypasses customer scope restrictions
   - Can access all customer data
   - Can manage system-wide configuration

6. **GLOBAL_DEV**: Development access
   - Read-only access across all domains
   - Access to debugging tools and dev endpoints
   - No write/modify permissions

## Permission Matrix

| Role | View | Create | Edit | Publish | Rollback | Delete | Schema | Roles | Audit | Debug |
|------|------|--------|------|---------|----------|--------|--------|-------|-------|-------|
| **Global** |
| GLOBAL_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GLOBAL_DEV | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Routing Table** |
| RT_VIEWER | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| RT_EDITOR | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| RT_OPS | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| RT_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Message Store** |
| MSG_VIEWER | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| MSG_EDITOR | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| MSG_OPS | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| MSG_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Segment Store** |
| SEG_VIEWER | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SEG_EDITOR | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SEG_OPS | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SEG_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

## Usage Examples

### Example 1: Content Editor

**Okta Groups:**
```
- message-store-editor
- okta-digipolis-flow
- okta-acme-flow
```

**Permissions:**
- Can view, create, and edit messages
- Can only access data for Digipolis and ACME customers
- Cannot publish messages (needs OPS role)
- Cannot access routing tables or segments (no role for those domains)

### Example 2: Operations Team Member

**Okta Groups:**
```
- routing-table-ops
- message-store-ops
- segment-store-ops
- okta-digipolis-flow
```

**Permissions:**
- Can view and publish routing tables, messages, and segments
- Can rollback published content
- Cannot create or edit content (needs EDITOR role)
- Can only access Digipolis customer data

### Example 3: Domain Administrator

**Okta Groups:**
```
- message-store-admin
- okta-digipolis-flow
- okta-acme-flow
- okta-contoso-flow
```

**Permissions:**
- Full control over message store (create, edit, publish, delete, schema changes)
- Can access data for three customers: Digipolis, ACME, Contoso
- No access to routing tables or segments (no role for those domains)

### Example 4: Global Administrator

**Okta Groups:**
```
- global-admin
```

**Permissions:**
- Full access to all domains (routing, messages, segments)
- Can access all customer data (bypasses customer scope checks)
- Can perform all actions (create, edit, publish, delete, schema changes)
- Can manage roles and system configuration

### Example 5: Developer

**Okta Groups:**
```
- global-dev
```

**Permissions:**
- Read-only access to all domains
- Can access debugging endpoints
- Cannot make any changes
- Can access all customer data (for debugging)

## Implementation Details

### Backend Authorization Flow

1. **JWT Token Validation** (`AzureAdStrategy`)
   - Validates JWT signature
   - Extracts user info and Okta groups from token

2. **Group Mapping** (`GroupMapperService`)
   - Maps Okta groups to AppRole enum values
   - Extracts customer scopes from group pattern
   - Identifies global admin/dev users

3. **Role Guard** (`RoleGuard`)
   - Checks if user has required domain role (via `@Roles()` decorator)
   - GLOBAL_ADMIN bypasses role checks

4. **Customer Scope Guard** (`RoleGuard` + `CustomerScopeService`)
   - Checks if user has access to requested customer data (via `@RequireCustomerScope()` decorator)
   - GLOBAL_ADMIN bypasses scope checks

### Using Decorators in Controllers

#### Require Domain Role

```typescript
@Get('messages')
@Roles(AppRole.MSG_VIEWER) // Any message store role can access
async listMessages() {
  // Implementation
}
```

#### Require Customer Scope

```typescript
@Get('messages/:customerId')
@Roles(AppRole.MSG_VIEWER)
@RequireCustomerScope({ paramName: 'customerId', strict: true })
async getCustomerMessages(@Param('customerId') customerId: string) {
  // User must have okta-{customerId}-flow group
}
```

#### Combining Role and Scope

```typescript
@Put('messages/:customerId/:messageId')
@Roles(AppRole.MSG_EDITOR)
@RequireCustomerScope({ paramName: 'customerId', strict: true })
async updateMessage(
  @Param('customerId') customerId: string,
  @Param('messageId') messageId: string,
  @Body() updateDto: UpdateMessageDto,
) {
  // User must have:
  // 1. message-store-editor (or higher) role
  // 2. okta-{customerId}-flow group
}
```

#### Multiple Roles (OR logic)

```typescript
@Post('messages/publish')
@Roles(AppRole.MSG_OPS, AppRole.MSG_ADMIN) // OPS OR ADMIN
async publishMessage(@Body() dto: PublishDto) {
  // Implementation
}
```

### Frontend Permission Checks

Use the `useDomainPermissions` hook:

```typescript
import { useDomainPermissions } from '@/hooks/useDomainPermissions';
import { Domain } from '@routing-data-layer/shared-types';

function MessagesPage() {
  const { user } = useAuth();
  const permissions = useDomainPermissions({
    roles: user?.roles,
    domain: Domain.MESSAGE_STORE,
  });

  return (
    <div>
      {permissions.canView && <ViewMessagesButton />}
      {permissions.canEdit && <EditMessageButton />}
      {permissions.canPublish && <PublishMessageButton />}
      {permissions.canDelete && <DeleteMessageButton />}
    </div>
  );
}
```

## Security Best Practices

### ✅ DO

- Always use both `@Roles()` and `@RequireCustomerScope()` decorators for customer-specific endpoints
- Use `strict: true` in `@RequireCustomerScope()` for endpoints that MUST have a scope parameter
- Filter data by customer scope using `CustomerScopeService.getScopeWhereClause()`
- Log authorization failures for security monitoring
- Use GLOBAL_ADMIN sparingly (only for true system administrators)

### ❌ DON'T

- Don't rely on frontend permission checks alone (always enforce on backend)
- Don't hardcode role checks in business logic (use decorators)
- Don't bypass customer scope filtering (except for GLOBAL_ADMIN)
- Don't use customer ID from JWT without validating against customer scope
- Don't use GLOBAL_ADMIN for regular users (even if they need wide access)

## Troubleshooting

### User Cannot Access Data

1. **Check Domain Role**: User must have appropriate role for the domain
   - View: requires VIEWER or higher
   - Edit: requires EDITOR, ADMIN, or OPS (for publish)
   - Delete: requires ADMIN

2. **Check Customer Scope**: User must have `okta-{customerId}-flow` group
   - Verify group exists in Okta
   - Verify correct customerId format (lowercase, no special chars except hyphens)

3. **Check Logs**: Authorization failures are logged
   - Search for user email in logs
   - Look for "Access denied" messages
   - Check what roles/scopes user has vs. what's required

### User Has Too Much Access

1. **Review Okta Groups**: Check all groups assigned to user
2. **Verify Not GLOBAL_ADMIN**: This bypasses all restrictions
3. **Check Customer Scopes**: User may have more customer scope groups than intended

### Configuration Issues

1. **JWT Secret Not Set**: Check `AZURE_AD_CLIENT_SECRET` or `JWT_SECRET` environment variable
2. **Mock Auth in Production**: Never set `USE_MOCK_AUTH=true` in production
3. **Missing Environment Variables**: See `main.ts` startup validation

## References

- **Permission Matrix Configuration**: `auth/config/permissions.config.ts`
- **Error Messages**: `auth/constants/error-messages.ts`
- **Role Definitions**: `auth/roles.enum.ts` (backend) or `shared/types/roles.ts` (shared)
- **Group Mapper**: `auth/group-mapper.service.ts`
- **Customer Scope Service**: `auth/customer-scope.service.ts`
- **Role Guard**: `auth/guards/role.guard.ts`
