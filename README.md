# Routing Data Layer Documentation

Documentation repository for the Routing Data Layer system - a comprehensive solution for managing IVR (Interactive Voice Response) routing data, message stores, and segment configurations.

## Overview

The Routing Data Layer provides a three-layer architecture for managing automated phone call experiences:

- **Routing Table**: Maps source IDs to routing IDs and manages flow initialization
- **Segment Store**: Defines the flow graph structure with segments and transitions (the "what happens next" logic)
- **Message Store**: Manages multilingual messages with atomic versioning (the audio content)

Together, these layers enable self-service configuration of IVR systems, allowing business analysts to design call flows without developer intervention while maintaining enterprise-grade safety through draft/publish workflows and comprehensive audit trails.

## Documentation Structure

### Design Documents

- **[Routing Table Design](./docs/ROUTING_TABLE_DESIGN.md)** - Architecture and design specification for the routing table module
- **[Segment Store Design](./docs/SEGMENT_STORE_DESIGN.md)** - Architecture and design specification for the segment store module
- **[Message Store Design](./docs/MESSAGE_STORE_DESIGN.md)** - Architecture and design specification for the message store module
- **[Global UI Design](./docs/GLOBAL_UI_DESIGN.md)** - User interface design guidelines and specifications

### Guides

- **[API Reference](./docs/API_REFERENCE.md)** - Complete API documentation
- **[Authentication Guide](./docs/AUTHENTICATION_GUIDE.md)** - Authentication and authorization documentation
- **[Backend Guide](./docs/BACKEND_GUIDE.md)** - Backend development and architecture guide
- **[Frontend Guide](./docs/FRONTEND_GUIDE.md)** - Frontend development and architecture guide
- **[Developer Guide](./docs/DEVELOPER_GUIDE.md)** - General development guidelines and best practices
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - Database schema documentation
- **[Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Deployment and infrastructure documentation
- **[Testing Guide](./docs/TESTING_GUIDE.md)** - Testing strategies and guidelines
- **[Contributing](./docs/CONTRIBUTING.md)** - Contribution guidelines

### Visual Documentation

- **[Routing Management UI](./docs/images/Routing.png)** - Screenshot of the routing management interface
- **[Segment Configuration UI](./docs/images/SegmentPage.png)** - Screenshot of the segment configuration interface
- **[Message Management UI](./docs/images/MessagePage.png)** - Screenshot of the message management interface

## Key Concepts

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

### Database Schema

Tables are organized by prefix:
- `cfg_*` - Configuration tables (dictionaries, company projects)
- `rt_*` - Routing table tables
- `seg_*` - Segment store tables
- `msg_*` - Message store tables
- `audit_*` - Audit log tables

## Features

- 🎨 **Visual Flow Designer**: Drag-and-drop interface for designing call flows
- 🔄 **Draft/Publish Workflow**: Safe deployment with ChangeSet-based versioning and rollback capabilities
- 🌍 **Multi-language Support**: Atomic versioning ensures all languages are included in each message version
- 🔐 **Role-Based Access Control**: Two-level security model with domain roles and customer scopes
- 📊 **Audit Trail**: Complete change tracking with user, action, timestamp, and detailed change logs
- 🏢 **Multi-tenant Architecture**: Isolated configuration for multiple customers on shared infrastructure
- 📦 **Export/Import**: JSON-based data migration across environments

## Contributing

When contributing to this documentation:

1. Follow the existing documentation structure and style
2. Ensure all links are valid and point to existing documents
3. Update the table of contents when adding new documents
4. Include visual examples where appropriate
5. Keep documentation clear, concise, and user-focused

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for detailed contribution guidelines.

## License

ISC
