# Database Schema Documentation

Complete database architecture and schema reference for the IVR Routing Data Layer.

## Table of Contents

- [Database Overview](#database-overview)
- [Schema Organization](#schema-organization)
- [Entity Relationship Diagrams](#entity-relationship-diagrams)
- [Table Reference](#table-reference)
- [Data Patterns](#data-patterns)
- [Indexes and Performance](#indexes-and-performance)
- [Migrations](#migrations)

## Database Overview

### Technology Stack

- **Database**: SQL Server 2022
- **ORM**: Prisma 5.22.0
- **Schema Management**: Prisma Migrations
- **Connection**: Local development via Docker, Azure SQL in production

### Local Development

```bash
# Database connection
Host: localhost
Port: 14330 (mapped from container port 1433)
Database: routing_data_layer
User: sa
Password: YourStrong@Password123

# Connection string
DATABASE_URL="sqlserver://localhost:14330;database=routing_data_layer;user=sa;password=YourStrong@Password123;encrypt=true;trustServerCertificate=true"
```

### Schemas

The database uses two schemas:

- **`dbo`**: Shared configuration and system tables
- **`ivr`**: Domain-specific IVR tables

## Schema Organization

### Table Naming Convention

Tables are organized by prefix:

| Prefix | Schema | Purpose | Examples |
|--------|--------|---------|----------|
| `cfg_*` | dbo | Configuration and dictionaries | `cfg_Dic_Language`, `cfg_Dic_CompanyProject` |
| `rt_*` | ivr | Routing table domain | `rt_RoutingTable`, `rt_RoutingTableHistory` |
| `seg_*` | ivr | Segment store domain | `seg_Segment`, `seg_SegmentTransition` |
| `msg_*` | ivr | Message store domain | `msg_MessageStore`, `msg_MessageKey` |
| `sys_*` | dbo | System and audit | `sys_AuditLog` |

## Entity Relationship Diagrams

### Configuration Schema (dbo)

```mermaid
erDiagram
    cfg_Dic_CompanyProject ||--o{ rt_RoutingTable : "has"
    cfg_Dic_CompanyProject ||--o{ msg_MessageStore : "has"
    cfg_Dic_Environment ||--o{ cfg_Dic_CompanyProject : "belongs to"
    cfg_Dic_Language ||--o{ msg_MessageLanguageContent : "used in"
    cfg_Dic_Language ||--o{ rt_RoutingTable : "default language"
    cfg_Dic_Voice ||--o{ msg_MessageStoreVoiceConfig : "assigned to"
    cfg_Dic_Voice }o--|| cfg_Dic_Language : "supports"

    cfg_Dic_CompanyProject {
        int CompanyProjectId PK
        int EnvironmentId FK
        varchar CustomerId
        varchar ProjectId
        nvarchar DisplayName
        varchar OktaGroup
        bit IsActive
    }

    cfg_Dic_Environment {
        int EnvironmentId PK
        varchar Code "UK: dvp/acc/prd"
        nvarchar DisplayName
        bit IsActive
    }

    cfg_Dic_Language {
        varchar LanguageCode PK "BCP47 format"
        nvarchar DisplayName
        bit IsActive
    }

    cfg_Dic_Voice {
        int VoiceId PK
        varchar Code UK
        varchar Engine "google/azure/amazon/elevenlabs"
        varchar Language FK
        varchar Gender "male/female/neutral"
        nvarchar DisplayName
        bit IsActive
    }
```

### Routing Table Schema (ivr)

```mermaid
erDiagram
    rt_RoutingTable }o--|| cfg_Dic_CompanyProject : "belongs to"
    rt_RoutingTable }o--|| msg_MessageStore : "uses"
    rt_RoutingTable }o--|| cfg_Dic_Language : "default language"
    rt_RoutingTable ||--o{ rt_RoutingTableHistory : "has history"

    rt_RoutingTable {
        int RoutingTableId PK
        varchar SourceId "UK: unique entry point"
        varchar RoutingId
        int CompanyProjectId FK
        int MessageStoreId FK "nullable"
        varchar LanguageCode FK
        varchar InitSegment "entry segment name"
        nvarchar Config "JSON configuration"
        nvarchar FeatureFlags "JSON flags"
        bit IsActive
        datetime CreatedAt
        varchar CreatedBy
        datetime UpdatedAt
        varchar UpdatedBy
    }

    rt_RoutingTableHistory {
        int HistoryId PK
        int RoutingTableId FK
        int VersionNumber
        nvarchar SnapshotData "JSON snapshot"
        varchar ActionType "created/updated/published"
        varchar ActionBy
        datetime ActionAt
    }
```

### Segment Store Schema (ivr)

```mermaid
erDiagram
    seg_Segment }o--|| cfg_Dic_SegmentType : "has type"
    seg_Segment ||--o{ seg_Key : "has keys"
    seg_Segment ||--o{ seg_SegmentTransition : "source of"
    seg_Segment ||--o| seg_SegmentUIState : "has UI state"
    seg_Key }o--|| cfg_Dic_Key : "references"

    seg_Segment {
        int SegmentId PK
        varchar RoutingId
        varchar SegmentName
        uniqueidentifier ChangeSetId "NULL = published"
        int DicSegmentTypeId FK
        int SegmentOrder "nullable"
        bit IsActive
        datetime CreatedAt
        varchar CreatedBy
        datetime UpdatedAt
        varchar UpdatedBy
    }

    seg_Key {
        int SegmentId PK_FK
        int DicSegmentTypeId PK_FK
        int DicKeyId PK_FK
        nvarchar Value
        varchar CreatedBy
        datetime CreatedAt
        varchar UpdatedBy
        datetime UpdatedAt
    }

    seg_SegmentTransition {
        int TransitionId PK
        int SourceSegmentId FK
        varchar SourceSegmentName
        varchar ResultName
        varchar NextSegmentName
        varchar ContextKey "nullable"
        varchar RoutingId
        uniqueidentifier ChangeSetId
        bit IsActive
        varchar CreatedBy
        datetime CreatedAt
    }

    seg_SegmentUIState {
        int SegmentId PK_FK
        float PositionX
        float PositionY
        bit IsCollapsed
        nvarchar CustomStyle "JSON"
        varchar UpdatedBy
        datetime UpdatedAt
    }
```

### Message Store Schema (ivr) - v5.0.0

```mermaid
erDiagram
    msg_MessageStore }o--|| cfg_Dic_CompanyProject : "belongs to"
    msg_MessageStore }o--|| cfg_Dic_Language : "default language"
    msg_MessageStore ||--o{ msg_MessageKey : "contains"
    msg_MessageStore ||--o{ msg_MessageStoreVoiceConfig : "has voice config"
    msg_MessageKey }o--|| msg_Dic_MessageType : "has type"
    msg_MessageKey }o--|| msg_Dic_MessageCategory : "in category"
    msg_MessageKey ||--o{ msg_MessageKeyVersion : "has versions"
    msg_MessageKey ||--o| msg_MessageKeyVersion : "publishes (1-10)"
    msg_MessageKeyVersion ||--o{ msg_MessageLanguageContent : "contains languages"
    msg_MessageLanguageContent }o--|| cfg_Dic_Language : "for language"
    msg_MessageStoreVoiceConfig }o--|| cfg_Dic_Voice : "uses voice"

    msg_MessageStore {
        int MessageStoreId PK
        nvarchar Name
        int CompanyProjectId FK
        nvarchar AllowedLanguages "JSON array"
        varchar DefaultLanguage FK
        bit IsActive
        datetime CreatedAt
        varchar CreatedBy
        datetime UpdatedAt
        varchar UpdatedBy
    }

    msg_MessageKey {
        int MessageKeyId PK
        int MessageStoreId FK
        varchar MessageKey
        int MessageTypeId FK
        int CategoryId FK
        int PublishedVersion "1-10 or NULL"
        nvarchar DisplayName
        bit IsActive
        datetime CreatedAt
        varchar CreatedBy
        datetime UpdatedAt
        varchar UpdatedBy
    }

    msg_MessageKeyVersion {
        uniqueidentifier MessageKeyVersionId PK
        int MessageKeyId FK
        int Version "1-10"
        nvarchar VersionName "nullable"
        bit IsActive
        datetime CreatedAt
        varchar CreatedBy
    }

    msg_MessageLanguageContent {
        int MessageLanguageContentId PK
        uniqueidentifier MessageKeyVersionId FK
        varchar Language FK
        nvarchar Content "NVARCHAR(MAX)"
        nvarchar TypeSettings "JSON"
        datetime CreatedAt
        varchar CreatedBy
        datetime UpdatedAt
        varchar UpdatedBy
    }

    msg_MessageStoreVoiceConfig {
        int ConfigId PK
        int MessageStoreId FK
        varchar Language FK
        int VoiceId FK
        bit IsDefault
        datetime CreatedAt
        varchar CreatedBy
    }

    msg_MessageKeyAudit {
        uniqueidentifier AuditId PK
        int MessageKeyId "no FK - audit retention"
        uniqueidentifier MessageKeyVersionId "no FK"
        varchar Action "created/edited/published/rollback/deleted"
        varchar ActionBy
        datetime ActionAt
        nvarchar AuditData "JSON"
    }
```

### Dictionary Tables

```mermaid
erDiagram
    cfg_Dic_SegmentType ||--o{ cfg_Dic_Key : "has keys"
    cfg_Dic_Key }o--|| cfg_Dic_KeyType : "has type"

    cfg_Dic_SegmentType {
        int DicSegmentTypeId PK
        varchar Code UK
        nvarchar DisplayName
        varchar Category
        bit IsTerminal
        bit IsActive
    }

    cfg_Dic_Key {
        int DicKeyId PK
        int DicSegmentTypeId FK
        varchar KeyName
        int DicKeyTypeId FK
        bit IsRequired
        nvarchar DefaultValue
        nvarchar ValidationSchema "JSON schema"
        bit IsActive
    }

    cfg_Dic_KeyType {
        int DicKeyTypeId PK
        varchar Code "UK: string/integer/boolean/json"
        nvarchar DisplayName
        bit IsActive
    }

    msg_Dic_MessageType {
        int MessageTypeId PK
        varchar Code "UK: tts/audio_url/llm_message/llm_prompt"
        nvarchar DisplayName
        nvarchar SettingsSchema "JSON schema"
        nvarchar DefaultSettings "JSON"
        bit IsActive
    }

    msg_Dic_MessageCategory {
        int CategoryId PK
        varchar Code "UK: welcome/menu/error/etc"
        nvarchar DisplayName
        varchar Icon
        varchar Color
        bit IsActive
    }
```

## Table Reference

### Configuration Tables

#### cfg_Dic_CompanyProject

Customer and project combinations with Okta group mapping.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| CompanyProjectId | INT | PK, IDENTITY | Primary key |
| EnvironmentId | INT | FK, NOT NULL | Environment reference |
| CustomerId | VARCHAR(100) | NOT NULL | Customer identifier (lowercase) |
| ProjectId | VARCHAR(100) | NOT NULL | Project identifier |
| DisplayName | NVARCHAR(200) | NOT NULL | Human-readable name |
| OktaGroup | VARCHAR(200) | NULL | Okta group pattern |
| IsActive | BIT | DEFAULT 1 | Active flag |
| CreatedAt | DATETIME | DEFAULT GETDATE() | Creation timestamp |
| CreatedBy | VARCHAR(100) | NOT NULL | Creator |
| UpdatedAt | DATETIME | NULL | Update timestamp |
| UpdatedBy | VARCHAR(100) | NULL | Updater |

**Unique Constraint**: (EnvironmentId, CustomerId, ProjectId)

**Usage**: Multi-tenant organization, customer scoping

#### cfg_Dic_Language

Supported languages in BCP47 format.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| LanguageCode | VARCHAR(10) | PK | BCP47 language code (e.g., nl-BE) |
| DisplayName | NVARCHAR(100) | NOT NULL | Human-readable name |
| IsActive | BIT | DEFAULT 1 | Active flag |

**Examples**: `nl-BE` (Dutch Belgium), `fr-BE` (French Belgium), `en-US` (English US)

#### cfg_Dic_Voice

TTS voice definitions across multiple engines.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| VoiceId | INT | PK, IDENTITY | Primary key |
| Code | VARCHAR(100) | UK | Unique voice code |
| Engine | VARCHAR(50) | NOT NULL | TTS engine (google/azure/amazon/elevenlabs) |
| Language | VARCHAR(10) | FK | Supported language |
| Gender | VARCHAR(20) | NULL | Voice gender (male/female/neutral) |
| DisplayName | NVARCHAR(200) | NOT NULL | Human-readable name |
| IsActive | BIT | DEFAULT 1 | Active flag |

### Routing Table Tables

#### rt_RoutingTable

Entry point resolution mapping sourceId to flow configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| RoutingTableId | INT | PK, IDENTITY | Primary key |
| SourceId | VARCHAR(100) | UK | Unique inbound identifier |
| RoutingId | VARCHAR(100) | NOT NULL | Flow identifier |
| CompanyProjectId | INT | FK | Customer/project reference |
| MessageStoreId | INT | FK, NULL | Message library reference |
| LanguageCode | VARCHAR(10) | FK | Default language |
| InitSegment | VARCHAR(100) | NOT NULL | Entry segment name |
| Config | NVARCHAR(MAX) | NULL | JSON configuration |
| FeatureFlags | NVARCHAR(MAX) | NULL | JSON feature flags |
| IsActive | BIT | DEFAULT 1 | Active flag (soft delete) |
| CreatedAt | DATETIME | DEFAULT GETDATE() | Creation timestamp |
| CreatedBy | VARCHAR(100) | NOT NULL | Creator |
| UpdatedAt | DATETIME | NULL | Update timestamp |
| UpdatedBy | VARCHAR(100) | NULL | Updater |

**Indexes**:
- `IX_RoutingTable_SourceId` (UK, NONCLUSTERED)
- `IX_RoutingTable_CompanyProjectId` (NONCLUSTERED)
- `IX_RoutingTable_RoutingId` (NONCLUSTERED)

### Segment Store Tables

#### seg_Segment

Flow nodes with type and configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| SegmentId | INT | PK, IDENTITY | Primary key |
| RoutingId | VARCHAR(100) | NOT NULL | Flow identifier |
| SegmentName | VARCHAR(100) | NOT NULL | Segment identifier |
| ChangeSetId | UNIQUEIDENTIFIER | NULL | Draft UUID (NULL = published) |
| DicSegmentTypeId | INT | FK | Segment type reference |
| SegmentOrder | INT | NULL | Optional UI ordering |
| IsActive | BIT | DEFAULT 1 | Active flag |
| CreatedAt | DATETIME | DEFAULT GETDATE() | Creation timestamp |
| CreatedBy | VARCHAR(100) | NOT NULL | Creator |
| UpdatedAt | DATETIME | NULL | Update timestamp |
| UpdatedBy | VARCHAR(100) | NULL | Updater |

**Unique Constraint**: (RoutingId, SegmentName, ChangeSetId)

**Cascade Delete**: Keys and Transitions cascade delete with segment

#### seg_Key

Configuration key-value pairs for segments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| SegmentId | INT | PK, FK | Segment reference |
| DicSegmentTypeId | INT | PK, FK | Segment type reference |
| DicKeyId | INT | PK, FK | Configuration key reference |
| Value | NVARCHAR(MAX) | NULL | Configuration value |
| CreatedBy | VARCHAR(100) | NOT NULL | Creator |
| CreatedAt | DATETIME | DEFAULT GETDATE() | Creation timestamp |
| UpdatedBy | VARCHAR(100) | NULL | Updater |
| UpdatedAt | DATETIME | NULL | Update timestamp |

**Composite Primary Key**: (SegmentId, DicSegmentTypeId, DicKeyId)

**ON DELETE CASCADE**: Deleted when parent segment deleted

#### seg_SegmentTransition

Flow edges defining result → next segment routing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| TransitionId | INT | PK, IDENTITY | Primary key |
| SourceSegmentId | INT | FK | Source segment reference |
| SourceSegmentName | VARCHAR(100) | NOT NULL | Source segment name |
| ResultName | VARCHAR(100) | NOT NULL | Result identifier (success/error/option_1) |
| NextSegmentName | VARCHAR(100) | NOT NULL | Target segment name |
| ContextKey | VARCHAR(100) | NULL | Context-specific routing key |
| RoutingId | VARCHAR(100) | NOT NULL | Flow identifier |
| ChangeSetId | UNIQUEIDENTIFIER | NULL | Draft UUID |
| IsActive | BIT | DEFAULT 1 | Active flag |
| CreatedBy | VARCHAR(100) | NOT NULL | Creator |
| CreatedAt | DATETIME | DEFAULT GETDATE() | Creation timestamp |

**Name-Based Resolution**: Uses segment names instead of IDs for flexibility

**ON DELETE CASCADE**: Deleted when source segment deleted

### Message Store Tables (v5.0.0)

#### msg_MessageStore

Container for customer/project messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| MessageStoreId | INT | PK, IDENTITY | Primary key |
| Name | NVARCHAR(200) | NOT NULL | Display name |
| CompanyProjectId | INT | FK | Customer/project reference |
| AllowedLanguages | NVARCHAR(MAX) | NOT NULL | JSON array of language codes |
| DefaultLanguage | VARCHAR(10) | FK | Fallback language |
| IsActive | BIT | DEFAULT 1 | Active flag |
| CreatedAt | DATETIME | DEFAULT GETDATE() | Creation timestamp |
| CreatedBy | VARCHAR(100) | NOT NULL | Creator |
| UpdatedAt | DATETIME | NULL | Update timestamp |
| UpdatedBy | VARCHAR(100) | NULL | Updater |

#### msg_MessageKey

Message identity with published version pointer (atomic versioning).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| MessageKeyId | INT | PK, IDENTITY | Primary key |
| MessageStoreId | INT | FK | Store reference |
| MessageKey | VARCHAR(64) | NOT NULL | UPPER_SNAKE_CASE identifier |
| MessageTypeId | INT | FK | Type reference (tts/audio/llm) |
| CategoryId | INT | FK | Category reference |
| PublishedVersion | INT | NULL | Active version (1-10) |
| DisplayName | NVARCHAR(200) | NULL | Human-readable name |
| IsActive | BIT | DEFAULT 1 | Active flag |
| CreatedAt | DATETIME | DEFAULT GETDATE() | Creation timestamp |
| CreatedBy | VARCHAR(100) | NOT NULL | Creator |
| UpdatedAt | DATETIME | NULL | Update timestamp |
| UpdatedBy | VARCHAR(100) | NULL | Updater |

**Unique Constraint**: (MessageStoreId, MessageKey)

**Check Constraint**: PublishedVersion BETWEEN 1 AND 10 (when not NULL)

#### msg_MessageKeyVersion

Atomic version container (all languages together).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| MessageKeyVersionId | UNIQUEIDENTIFIER | PK | Primary key (NEWID()) |
| MessageKeyId | INT | FK | Message key reference |
| Version | INT | NOT NULL | Version number (1-10) |
| VersionName | NVARCHAR(200) | NULL | Optional descriptive name |
| IsActive | BIT | DEFAULT 1 | Active flag |
| CreatedAt | DATETIME | DEFAULT GETDATE() | Creation timestamp |
| CreatedBy | VARCHAR(100) | NOT NULL | Creator |

**Unique Constraint**: (MessageKeyId, Version)

**Check Constraint**: Version BETWEEN 1 AND 10

#### msg_MessageLanguageContent

Language-specific content within version.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| MessageLanguageContentId | INT | PK, IDENTITY | Primary key |
| MessageKeyVersionId | UNIQUEIDENTIFIER | FK | Version reference |
| Language | VARCHAR(10) | FK | Language code |
| Content | NVARCHAR(MAX) | NOT NULL | Message content |
| TypeSettings | NVARCHAR(MAX) | NULL | JSON type-specific settings |
| CreatedAt | DATETIME | DEFAULT GETDATE() | Creation timestamp |
| CreatedBy | VARCHAR(100) | NOT NULL | Creator |
| UpdatedAt | DATETIME | NULL | Update timestamp |
| UpdatedBy | VARCHAR(100) | NULL | Updater |

**Unique Constraint**: (MessageKeyVersionId, Language)

**ON DELETE CASCADE**: Deleted when version deleted

## Data Patterns

### ChangeSet Pattern (Segment Store)

**Draft Isolation**:
- `ChangeSetId = NULL`: Published/active records (visible to runtime)
- `ChangeSetId = UUID`: Draft records (isolated workspace)

**Composite Keys with ChangeSet**:
```sql
UNIQUE (RoutingId, SegmentName, ChangeSetId)
```

**Publishing Process**:
1. Soft delete old published records (`IsActive = 0`)
2. Set draft records' `ChangeSetId = NULL`
3. Atomic transaction ensures consistency

**Query Patterns**:
```sql
-- Get published segments
SELECT * FROM seg_Segment
WHERE RoutingId = @routingId AND ChangeSetId IS NULL AND IsActive = 1

-- Get draft segments
SELECT * FROM seg_Segment
WHERE RoutingId = @routingId AND ChangeSetId = @changeSetId AND IsActive = 1
```

### Atomic Versioning Pattern (Message Store v5.0.0)

**Version Pointer**:
- `PublishedVersion`: Integer (1-10) pointing to active version
- Simpler than UUID lookups, business-user friendly

**All Languages Together**:
- Each `MessageKeyVersion` contains ALL languages
- No partial language versions allowed
- Publishing affects all languages atomically

**Runtime Query Path**:
```sql
-- Step 1: Get message key and published version
SELECT MessageKeyId, PublishedVersion
FROM msg_MessageKey
WHERE MessageStoreId = @storeId AND MessageKey = @key

-- Step 2: Get version container
SELECT MessageKeyVersionId
FROM msg_MessageKeyVersion
WHERE MessageKeyId = @keyId AND Version = @publishedVersion

-- Step 3: Get language content
SELECT Content, TypeSettings
FROM msg_MessageLanguageContent
WHERE MessageKeyVersionId = @versionId AND Language = @language
```

**Performance**: Indexed path achieves <30ms target

### Soft Delete Pattern

Tables use `IsActive` flag instead of hard delete:
- `IsActive = 1`: Active record
- `IsActive = 0`: Soft deleted (audit trail preserved)

**Benefits**:
- Audit trail preservation
- Rollback capability
- FK reference integrity maintained

### Audit Retention Pattern

`msg_MessageKeyAudit` has NO foreign keys:
- Allows audit retention after message deletion
- Records store IDs directly (orphaned after delete)
- Queries must handle missing references

## Indexes and Performance

### Critical Indexes

**Runtime Performance** (IVR call path):

```sql
-- Message runtime fetch (<30ms target)
CREATE INDEX IX_MessageKey_Lookup
ON msg_MessageKey (MessageStoreId, MessageKey, PublishedVersion)
INCLUDE (MessageKeyId);

CREATE INDEX IX_MessageKeyVersion_Lookup
ON msg_MessageKeyVersion (MessageKeyId, Version)
INCLUDE (MessageKeyVersionId);

CREATE INDEX IX_MessageLanguageContent_Lookup
ON msg_MessageLanguageContent (MessageKeyVersionId, Language)
INCLUDE (Content, TypeSettings);

-- Routing table lookup
CREATE UNIQUE INDEX IX_RoutingTable_SourceId
ON rt_RoutingTable (SourceId)
WHERE IsActive = 1;

-- Segment graph queries
CREATE INDEX IX_Segment_RoutingChangeSet
ON seg_Segment (RoutingId, ChangeSetId, IsActive);
```

**List Operations** (Management UI):

```sql
-- Message list with search
CREATE INDEX IX_MessageKey_Search
ON msg_MessageKey (MessageStoreId, IsActive, MessageKey);

-- Segment list
CREATE INDEX IX_Segment_List
ON seg_Segment (RoutingId, ChangeSetId, SegmentOrder, IsActive);
```

### Query Optimization

**Avoid N+1 Queries**:
- Use Prisma `include` for eager loading
- Join related tables in single query

**Pagination**:
- Use `OFFSET` / `FETCH NEXT` with consistent ordering
- Index sort columns

**JSON Queries**:
- Avoid querying inside JSON columns (no index support)
- Use dedicated columns for filterable fields

## Migrations

### Migration Strategy

**Prisma Migrations**:
```bash
# Create migration
cd services/backend
npx prisma migrate dev --name add_new_feature

# Apply to production
npx prisma migrate deploy
```

### Migration Files

Location: [services/backend/prisma/migrations/](../services/backend/prisma/migrations/)

**Baseline**: `20260120000000_baseline_schema`

### Safe Migration Practices

1. **Backward Compatible Changes**:
   - Add nullable columns
   - Add new tables
   - Add indexes

2. **Multi-Step Breaking Changes**:
   - Step 1: Add new column (nullable)
   - Step 2: Backfill data
   - Step 3: Make column NOT NULL
   - Step 4: Remove old column

3. **Production Checklist**:
   - ✅ Backup database before migration
   - ✅ Test migration on staging environment
   - ✅ Review generated SQL
   - ✅ Plan rollback procedure
   - ✅ Schedule maintenance window if needed

### Rollback Procedures

**Prisma doesn't support automatic rollback**. Manual process:

1. Restore database backup
2. Or create reverse migration manually

**Example Reverse Migration**:
```sql
-- If migration added column:
ALTER TABLE seg_Segment DROP COLUMN NewColumn;

-- If migration added table:
DROP TABLE NewTable;
```

## Related Documentation

- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Architecture overview
- [API_REFERENCE.md](API_REFERENCE.md) - API endpoints
- [BACKEND_GUIDE.md](BACKEND_GUIDE.md) - Prisma usage
- Design documents:
  - [ROUTING_TABLE_DESIGN.md](ROUTING_TABLE_DESIGN.md)
  - [SEGMENT_STORE_DESIGN.md](SEGMENT_STORE_DESIGN.md)
  - [MESSAGE_STORE_DESIGN.md](MESSAGE_STORE_DESIGN.md)
