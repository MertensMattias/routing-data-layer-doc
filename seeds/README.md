# Seed Files - Development Environment Setup

This directory contains SQL seed files for populating the development (dvp) database with initial data.

## Overview

Seed files are organized by dependency order and module:

- **001-009**: Dictionary/Prerequisite seeds (must run first)
- **010**: Routing table seeds
- **020-022**: Message store seeds
- **030-032**: Segment store seeds

## Quick Start

**Easiest way to run all seeds:**

```bash
npm run seeds
```

This will automatically:
- Read database connection from `DATABASE_URL` environment variable or `services/backend/.env`
- Execute all seed files in the correct order
- Show progress and results for each file

**Custom database:**

```bash
npm run seeds -- --database RoutingDataLayer_ACC --server localhost --username sa --password "your-password"
```

## Execution Order

**CRITICAL**: Files must be executed in this exact order due to foreign key dependencies.

### Phase 1: Dictionary/Prerequisite Seeds (001-009)

```bash
# Run these first - no dependencies
sqlcmd -i seeds/001_seed_dictionaries_environments.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
sqlcmd -i seeds/002_seed_dictionaries_languages.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
sqlcmd -i seeds/003_seed_dictionaries_company_projects.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
sqlcmd -i seeds/004_seed_dictionaries_segment_types.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
sqlcmd -i seeds/005_seed_dictionaries_key_types.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
sqlcmd -i seeds/006_seed_dictionaries_segment_keys.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
sqlcmd -i seeds/007_seed_dictionaries_message_types.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
sqlcmd -i seeds/008_seed_dictionaries_message_categories.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
sqlcmd -i seeds/009_seed_dictionaries_voices.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
```

### Phase 2: Message Store Seeds (020-022)

```bash
# Message stores must be created before routing tables
sqlcmd -i seeds/020_seed_message_stores.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
sqlcmd -i seeds/021_seed_message_store_voice_configs.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
# Use 022_seed_message_keys.sql for new MessageKey-level versioning (v5.0.0)
sqlcmd -i seeds/022_seed_message_keys.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
# OR use 022_seed_messages.sql for legacy per-language versioning (deprecated)
# sqlcmd -i seeds/022_seed_messages.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
```

### Phase 3: Routing Table Seeds (010)

```bash
# Routing tables reference message stores
sqlcmd -i seeds/010_seed_routing_tables.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
```

### Phase 4: Segment Store Seeds (030-032)

```bash
# Segments reference routing IDs and segment types
sqlcmd -i seeds/030_seed_segments.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
sqlcmd -i seeds/031_seed_segment_keys.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
sqlcmd -i seeds/032_seed_segment_transitions.sql -S [server] -d RoutingDataLayer_DVP -U [user] -P [password]
```

## File Dependencies

```
001_environments (no deps)
002_languages (no deps)
003_company_projects (no deps)
004_segment_types (no deps)
005_key_types (no deps)
006_segment_keys (depends: 004, 005)
007_message_types (no deps)
008_message_categories (no deps)
009_voices (depends: 002)

020_message_stores (depends: 003, 002)
021_voice_configs (depends: 020, 009, 002)
022_message_keys (depends: 020, 007, 008, 002) - NEW: MessageKey-level versioning (v5.0.0)
022_messages (depends: 020, 007, 008, 002) - LEGACY: Per-language versioning (deprecated)

010_routing_tables (depends: 003, 002, 020)

030_segments (depends: 004)
031_segment_keys (depends: 030, 006)
032_segment_transitions (depends: 030)
```

## What Gets Seeded

### Dictionary Tables (001-009)

- **Environments**: dvp, acc, prd (3 records)
- **Languages**: nl-BE, fr-BE, en-US (3 records)
- **Company Projects**: ENGIE/ENERGYLINE, ENGIE/PROF, DIGIPOLIS/DEFAULT (3 records)
- **Segment Types**: routing, scheduler, intent_detection, event, kb_message, self_service, transfer, disconnect, menu, input, message (11 records)
- **Key Types**: string, int, bool, decimal, json (5 records)
- **Segment Keys**: Configuration keys per segment type (~25 records)
- **Message Types**: tts, audio_url, llm_message, llm_prompt, llm_dialog (5 records)
- **Message Categories**: welcome, menu, identification, queue, transfer, error, llm_system, llm_user, general (9 records)
- **Voices**: Google and Azure TTS voices (5 records)

### Routing Tables (010)

- **Routing Table Entries**: 3 sourceId → routingId mappings
  - `ENGIE-ENERGYLINE-DVP` → `ENGIE-ENERGYLINE`
  - `ENGIE-PROF-DVP` → `ENGIE-PROF`
  - `DIGIPOLIS-DEFAULT-DVP` → `DIGIPOLIS-DEFAULT`

### Message Store (020-022)

- **Message Stores**: 3 stores (one per company/project)
- **Voice Configs**: ~6 voice configurations per store/language
- **Message Keys** (v5.0.0): ~5 messageKeys with version 1 containing multiple languages (nl-BE, fr-BE)
  - Uses new atomic versioning: MessageKey → MessageKeyVersion → MessageLanguageContent
  - Each version contains all languages atomically
  - PublishedVersion set to 1 for all seeded messageKeys
- **Messages** (legacy): ~5 sample messages with initial versions (deprecated, use 022_seed_message_keys.sql instead)

### Segment Store (030-032)

- **Segments**: ~15 segments across 3 routings
- **Segment Keys**: ~15 configuration values
- **Segment Transitions**: ~15 transitions between segments

## Validation Queries

After running all seeds, use these queries to verify the data:

### Dictionary Validation

```sql
-- Check environments
SELECT Environment, DisplayName FROM [ivr].[cfg_Dic_Environment];
-- Expected: 3 records (dvp, acc, prd)

-- Check languages
SELECT LanguageCode, DisplayName, NativeName FROM [ivr].[cfg_Dic_Language];
-- Expected: 3 records (nl-BE, fr-BE, en-US)

-- Check company projects
SELECT CustomerId, ProjectId, DisplayName, OktaGroup FROM [ivr].[cfg_Dic_CompanyProject];
-- Expected: 3 records

-- Check segment types
SELECT SegmentTypeName, DisplayName, Category, IsTerminal FROM [ivr].[seg_Dic_SegmentType];
-- Expected: 11 records

-- Check message types
SELECT Code, DisplayName FROM [ivr].[msg_Dic_MessageType];
-- Expected: 5 records
```

### Routing Table Validation

```sql
-- Check routing table entries
SELECT SourceId, RoutingId, InitSegment, MessageStoreId
FROM [ivr].[rt_RoutingTable];
-- Expected: 3 records

-- Verify routing table links
SELECT
    rt.SourceId,
    rt.RoutingId,
    cp.CustomerId,
    cp.ProjectId,
    ms.Name AS MessageStoreName
FROM [ivr].[rt_RoutingTable] rt
JOIN [ivr].[cfg_Dic_CompanyProject] cp ON rt.DicCompanyProjectId = cp.CompanyProjectId
LEFT JOIN [ivr].[msg_MessageStore] ms ON rt.MessageStoreId = ms.MessageStoreId;
```

### Message Store Validation

```sql
-- Check message stores
SELECT Name, Description, AllowedLanguages, DefaultLanguage
FROM [ivr].[msg_MessageStore];
-- Expected: 3 records

-- Check message keys (v5.0.0 - new structure)
SELECT
    ms.Name AS MessageStoreName,
    mk.MessageKey,
    mk.PublishedVersion,
    mt.Code AS MessageType,
    mc.Code AS Category,
    (SELECT COUNT(*) FROM msg_MessageKeyVersion mkv WHERE mkv.MessageKeyId = mk.MessageKeyId) AS VersionCount
FROM [ivr].[msg_MessageKey] mk
JOIN [ivr].[msg_MessageStore] ms ON mk.MessageStoreId = ms.MessageStoreId
JOIN [ivr].[msg_Dic_MessageType] mt ON mk.DicMessageTypeId = mt.MessageTypeId
JOIN [ivr].[msg_Dic_MessageCategory] mc ON mk.CategoryId = mc.CategoryId;
-- Expected: ~5+ records

-- Check message key versions
SELECT
    mk.MessageKey,
    mkv.Version,
    mkv.VersionName,
    (SELECT COUNT(*) FROM msg_MessageLanguageContent mlc WHERE mlc.MessageKeyVersionId = mkv.MessageKeyVersionId) AS LanguageCount
FROM [ivr].[msg_MessageKeyVersion] mkv
JOIN [ivr].[msg_MessageKey] mk ON mkv.MessageKeyId = mk.MessageKeyId
ORDER BY mk.MessageKey, mkv.Version;
-- Expected: ~5+ versions (one per messageKey)

-- Check message language content
SELECT
    mk.MessageKey,
    mkv.Version,
    mlc.Language,
    LEFT(mlc.Content, 50) AS ContentPreview
FROM [ivr].[msg_MessageLanguageContent] mlc
JOIN [ivr].[msg_MessageKeyVersion] mkv ON mlc.MessageKeyVersionId = mkv.MessageKeyVersionId
JOIN [ivr].[msg_MessageKey] mk ON mkv.MessageKeyId = mk.MessageKeyId
ORDER BY mk.MessageKey, mkv.Version, mlc.Language;
-- Expected: ~10+ records (2 languages per messageKey)

-- Legacy messages (deprecated structure)
SELECT
    ms.Name AS MessageStoreName,
    m.MessageKey,
    m.Language,
    mt.Code AS MessageType,
    mc.Code AS Category
FROM [ivr].[msg_Message] m
JOIN [ivr].[msg_MessageStore] ms ON m.MessageStoreId = ms.MessageStoreId
JOIN [ivr].[msg_Dic_MessageType] mt ON m.DicMessageTypeId = mt.MessageTypeId
JOIN [ivr].[msg_Dic_MessageCategory] mc ON m.CategoryId = mc.CategoryId;
-- Expected: 0 records if using new structure, ~5+ if using legacy
```

### Segment Store Validation

```sql
-- Check segments per routing
SELECT
    RoutingId,
    SegmentName,
    st.SegmentTypeName,
    COUNT(*) AS SegmentCount
FROM [ivr].[seg_Segment] s
JOIN [ivr].[seg_Dic_SegmentType] st ON s.DicSegmentTypeId = st.DicSegmentTypeId
WHERE s.ChangeSetId IS NULL
GROUP BY RoutingId, SegmentName, st.SegmentTypeName
ORDER BY RoutingId, SegmentName;
-- Expected: ~15 segments across 3 routings

-- Check segment transitions
SELECT
    s1.RoutingId,
    s1.SegmentName AS FromSegment,
    st.ResultName,
    s2.SegmentName AS ToSegment
FROM [ivr].[seg_SegmentTransition] st
JOIN [ivr].[seg_Segment] s1 ON st.SegmentId = s1.SegmentId
LEFT JOIN [ivr].[seg_Segment] s2 ON st.NextSegmentId = s2.SegmentId
WHERE s1.ChangeSetId IS NULL
ORDER BY s1.RoutingId, s1.SegmentName, st.ResultName;
-- Expected: ~15 transitions

-- Verify transition chains
-- Example: GET_LANGUAGE → CHECK_SCHEDULER → IDENTIFICATION → GET_INTENT
WITH SegmentChain AS (
    SELECT
        s.SegmentId,
        s.SegmentName,
        s.RoutingId,
        CAST(s.SegmentName AS NVARCHAR(MAX)) AS Path,
        0 AS Depth
    FROM [ivr].[seg_Segment] s
    WHERE s.SegmentName = 'GET_LANGUAGE' AND s.RoutingId = 'ENGIE-ENERGYLINE' AND s.ChangeSetId IS NULL

    UNION ALL

    SELECT
        ns.SegmentId,
        ns.SegmentName,
        ns.RoutingId,
        CAST(sc.Path + ' → ' + ns.SegmentName AS NVARCHAR(MAX)),
        sc.Depth + 1
    FROM SegmentChain sc
    JOIN [ivr].[seg_SegmentTransition] st ON sc.SegmentId = st.SegmentId
    JOIN [ivr].[seg_Segment] ns ON st.NextSegmentId = ns.SegmentId
    WHERE sc.Depth < 5 AND ns.ChangeSetId IS NULL
)
SELECT Path, Depth
FROM SegmentChain
WHERE Depth <= 5
ORDER BY Depth, Path;
```

## Re-running Seeds

All seed files are **idempotent** - they can be safely re-run multiple times:

- Files use `MERGE` statements to update existing records or insert new ones
- Files check for existence before inserting to avoid duplicates
- Foreign key constraints ensure referential integrity

**Note**: Re-running seeds will update existing records with the seed values. If you've modified data manually, those changes will be overwritten.

## Using npm run seeds

The `npm run seeds` command provides a convenient way to run all seed files:

### Prerequisites

- `sqlcmd` must be installed and available in your PATH
  - Windows: Usually included with SQL Server or install [SQL Server Command Line Utilities](https://learn.microsoft.com/en-us/sql/tools/sqlcmd-utility)
  - Linux/Mac: Install via package manager or use Docker

### Connection Configuration

The script reads database connection from (in order):

1. **Command-line arguments**: `--server`, `--database`, `--username`, `--password`
2. **Environment variable**: `DATABASE_URL`
3. **`.env` file**: `services/backend/.env` (reads `DATABASE_URL` from file)
4. **Defaults**: `localhost`, database `RoutingDataLayer_DVP`, Windows authentication

### Examples

```bash
# Use default connection (from .env or Windows auth)
npm run seeds

# Specify custom database
npm run seeds -- --database RoutingDataLayer_ACC

# Full connection string
npm run seeds -- --server localhost --database RoutingDataLayer_DVP --username sa --password "YourPassword"

# Use environment variable
DATABASE_URL="Server=localhost;Database=RoutingDataLayer_DVP;User ID=sa;Password=YourPassword" npm run seeds
```

### DATABASE_URL Format

The script supports both ADO-style and URL-style connection strings:

**ADO-style:**
```
Server=localhost;Database=RoutingDataLayer_DVP;User ID=sa;Password=YourPassword
```

**URL-style:**
```
sqlserver://sa:YourPassword@localhost:1433;database=RoutingDataLayer_DVP
```

## Troubleshooting

### Error: "Invalid object name"

**Solution**: Ensure the database schema has been created. Run Prisma migrations first:

```bash
cd services/backend
npm run prisma:migrate
```

### Error: "The INSERT statement conflicted with the FOREIGN KEY constraint"

**Solution**: Ensure prerequisite seeds have been run. Check the dependency order above.

### Error: "Cannot insert duplicate key row"

**Solution**: Seeds may have already been run. This is normal - seeds are idempotent and will update existing records.

### Warning: Some segments/transitions are missing

**Solution**: Ensure all prerequisite seeds completed successfully. Check for error messages in previous seed executions.

## Related Documentation

- **ACC Migration Seeds**: See `README_ACC_MIGRATION.md` for production-like seed data
- **Schema Documentation**: See `services/backend/prisma/COMPLETE_DATABASE_SCHEMA.sql`
- **Design Documents**: See `docs/design/` for module-specific design documentation
