-- Migration: Drop Legacy Message Tables (v3.2.0)
-- Created: 2026-01-20
-- Description: Removes old Message/MessageVersion/MessageAudit tables after v5.0.0 migration
-- CRITICAL: Only run this after validating v5.0.0 data migration is complete

-- =============================================================================
-- PRE-MIGRATION VALIDATION
-- =============================================================================
-- Run these queries BEFORE executing this migration to ensure safety:
/*
-- 1. Verify MessageKey data exists
SELECT COUNT(*) as MessageKeyCount FROM msg_MessageKey;
-- Expected: > 0 (at least some messageKeys migrated)

-- 2. Verify MessageKeyVersion data exists
SELECT COUNT(*) as VersionCount FROM msg_MessageKeyVersion;
-- Expected: > 0 (at least some versions migrated)

-- 3. Verify MessageLanguageContent data exists
SELECT COUNT(*) as LanguageContentCount FROM msg_MessageLanguageContent;
-- Expected: > 0 (at least some language content migrated)

-- 4. Compare counts (old vs new)
SELECT
  (SELECT COUNT(DISTINCT MessageStoreId, MessageKey) FROM msg_Message) as OldMessageKeys,
  (SELECT COUNT(*) FROM msg_MessageKey) as NewMessageKeys,
  (SELECT COUNT(*) FROM msg_MessageVersion) as OldVersions,
  (SELECT COUNT(*) FROM msg_MessageKeyVersion) as NewVersions;
-- Expected: NewMessageKeys ≈ OldMessageKeys, NewVersions ≈ OldVersions

-- 5. Verify no active references
SELECT
  t.name AS TableName,
  fk.name AS ForeignKeyName,
  OBJECT_NAME(fk.parent_object_id) AS ReferencingTable
FROM sys.foreign_keys fk
INNER JOIN sys.tables t ON fk.referenced_object_id = t.object_id
WHERE t.name IN ('msg_Message', 'msg_MessageVersion', 'msg_MessageAudit');
-- Expected: Only expected FKs (MessageVersion → Message, etc.)
*/

-- =============================================================================
-- BACKUP RECOMMENDATION
-- =============================================================================
-- CRITICAL: Create a full database backup before running this migration!
-- Command: BACKUP DATABASE [YourDB] TO DISK = 'C:\Backups\pre_drop_legacy_messages.bak'

-- =============================================================================
-- STEP 1: Drop Foreign Key Constraints
-- =============================================================================
-- Drop FKs in order to avoid cascade issues

PRINT 'Dropping Foreign Key Constraints...';

-- MessageVersion → Message FK
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_MessageVersion_Message')
BEGIN
    PRINT '  Dropping FK: FK_MessageVersion_Message';
    ALTER TABLE msg_MessageVersion DROP CONSTRAINT FK_MessageVersion_Message;
END

-- Message → MessageStore FK
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Message_MessageStore')
BEGIN
    PRINT '  Dropping FK: FK_Message_MessageStore';
    ALTER TABLE msg_Message DROP CONSTRAINT FK_Message_MessageStore;
END

-- Message → MessageType FK
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Message_MessageType')
BEGIN
    PRINT '  Dropping FK: FK_Message_MessageType';
    ALTER TABLE msg_Message DROP CONSTRAINT FK_Message_MessageType;
END

-- Message → MessageCategory FK
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Message_Category')
BEGIN
    PRINT '  Dropping FK: FK_Message_Category';
    ALTER TABLE msg_Message DROP CONSTRAINT FK_Message_Category;
END

-- Message → Language FK
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Message_Language')
BEGIN
    PRINT '  Dropping FK: FK_Message_Language';
    ALTER TABLE msg_Message DROP CONSTRAINT FK_Message_Language;
END

-- =============================================================================
-- STEP 2: Drop Indexes
-- =============================================================================
-- Drop indexes before dropping tables for cleaner migration

PRINT 'Dropping Indexes...';

-- MessageVersion indexes
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_messageversion_message' AND object_id = OBJECT_ID('msg_MessageVersion'))
    DROP INDEX ix_messageversion_message ON msg_MessageVersion;

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_messageversion_created' AND object_id = OBJECT_ID('msg_MessageVersion'))
    DROP INDEX ix_messageversion_created ON msg_MessageVersion;

-- Message indexes
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_message_store' AND object_id = OBJECT_ID('msg_Message'))
    DROP INDEX ix_message_store ON msg_Message;

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_message_type' AND object_id = OBJECT_ID('msg_Message'))
    DROP INDEX ix_message_type ON msg_Message;

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_message_category' AND object_id = OBJECT_ID('msg_Message'))
    DROP INDEX ix_message_category ON msg_Message;

-- MessageAudit indexes
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_audit_messageversion' AND object_id = OBJECT_ID('msg_MessageAudit'))
    DROP INDEX ix_audit_messageversion ON msg_MessageAudit;

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_audit_date' AND object_id = OBJECT_ID('msg_MessageAudit'))
    DROP INDEX ix_audit_date ON msg_MessageAudit;

-- =============================================================================
-- STEP 3: Archive Data (Optional)
-- =============================================================================
-- Uncomment if you want to archive old data before deletion
/*
PRINT 'Archiving legacy data...';

-- Create archive tables
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'msg_Message_Archive')
    SELECT * INTO msg_Message_Archive FROM msg_Message;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'msg_MessageVersion_Archive')
    SELECT * INTO msg_MessageVersion_Archive FROM msg_MessageVersion;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'msg_MessageAudit_Archive')
    SELECT * INTO msg_MessageAudit_Archive FROM msg_MessageAudit;

PRINT '  Archived data to *_Archive tables';
*/

-- =============================================================================
-- STEP 4: Drop Legacy Tables
-- =============================================================================
-- Drop tables in reverse dependency order

PRINT 'Dropping Legacy Tables...';

-- Drop MessageAudit (no dependencies)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'msg_MessageAudit')
BEGIN
    PRINT '  Dropping table: msg_MessageAudit';
    DROP TABLE msg_MessageAudit;
    PRINT '  ✓ Dropped msg_MessageAudit';
END
ELSE
    PRINT '  ⚠ Table msg_MessageAudit does not exist, skipping';

-- Drop MessageVersion (depends on Message)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'msg_MessageVersion')
BEGIN
    PRINT '  Dropping table: msg_MessageVersion';
    DROP TABLE msg_MessageVersion;
    PRINT '  ✓ Dropped msg_MessageVersion';
END
ELSE
    PRINT '  ⚠ Table msg_MessageVersion does not exist, skipping';

-- Drop Message (root table)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'msg_Message')
BEGIN
    PRINT '  Dropping table: msg_Message';
    DROP TABLE msg_Message;
    PRINT '  ✓ Dropped msg_Message';
END
ELSE
    PRINT '  ⚠ Table msg_Message does not exist, skipping';

-- =============================================================================
-- POST-MIGRATION VALIDATION
-- =============================================================================
-- Verify tables are dropped

PRINT 'Post-Migration Validation...';

DECLARE @LegacyTableCount INT;
SELECT @LegacyTableCount = COUNT(*)
FROM sys.tables
WHERE name IN ('msg_Message', 'msg_MessageVersion', 'msg_MessageAudit');

IF @LegacyTableCount = 0
    PRINT '✓ SUCCESS: All legacy tables dropped';
ELSE
    PRINT '✗ ERROR: Some legacy tables still exist!';

-- Verify new tables exist
DECLARE @NewTableCount INT;
SELECT @NewTableCount = COUNT(*)
FROM sys.tables
WHERE name IN ('msg_MessageKey', 'msg_MessageKeyVersion', 'msg_MessageLanguageContent', 'msg_MessageKeyAudit');

IF @NewTableCount = 4
    PRINT '✓ SUCCESS: All v5.0.0 tables exist';
ELSE
    PRINT '✗ ERROR: v5.0.0 tables missing!';

-- =============================================================================
-- ROLLBACK INSTRUCTIONS
-- =============================================================================
/*
ROLLBACK STRATEGY:
==================
If you need to rollback this migration:

1. Restore from database backup (recommended):
   RESTORE DATABASE [YourDB] FROM DISK = 'C:\Backups\pre_drop_legacy_messages.bak' WITH REPLACE;

2. If archive tables were created:
   SELECT * INTO msg_Message FROM msg_Message_Archive;
   SELECT * INTO msg_MessageVersion FROM msg_MessageVersion_Archive;
   SELECT * INTO msg_MessageAudit FROM msg_MessageAudit_Archive;
   -- Then recreate indexes and FKs (see schema.prisma for definitions)

3. Revert Prisma schema:
   -- Re-add Message, MessageVersion, MessageAudit models
   -- Run: npx prisma migrate dev
*/

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
PRINT '';
PRINT '================================================';
PRINT 'Migration Complete: Legacy Tables Dropped';
PRINT 'Version: v3.2.0 → v5.0.0';
PRINT 'Date: 2026-01-20';
PRINT '================================================';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '1. Verify application works with v5.0.0 API';
PRINT '2. Test runtime fetch endpoint (<30ms)';
PRINT '3. Run integration tests';
PRINT '4. Monitor for 24-48 hours';
PRINT '5. Delete archive tables after validation period';
PRINT '';
