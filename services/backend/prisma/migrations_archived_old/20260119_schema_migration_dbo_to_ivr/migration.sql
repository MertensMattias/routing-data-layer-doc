-- =====================================================================
-- Migration: Schema Migration dbo → ivr
-- Date: 2026-01-19
-- Purpose: Move all tables from dbo schema to ivr schema
-- =====================================================================
--
-- This migration:
-- 1. Creates the ivr schema if it doesn't exist
-- 2. Transfers all tables from dbo to ivr schema
-- 3. Updates all foreign key constraints to reference ivr schema
-- 4. Updates all indexes to reference ivr schema
-- 5. Updates triggers to reference ivr schema
--
-- IMPORTANT: This migration must be run BEFORE generating Prisma client
-- with the updated schema.prisma that references ivr schema.
--
-- =====================================================================

BEGIN TRY
BEGIN TRAN;

-- Step 1: Create ivr schema if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'ivr')
BEGIN
    EXEC('CREATE SCHEMA ivr');
    PRINT '✅ Created ivr schema';
END
ELSE
BEGIN
    PRINT 'ℹ️  ivr schema already exists';
END;

-- Step 2: Transfer all tables from dbo to ivr schema
-- Note: ALTER SCHEMA TRANSFER automatically updates all dependent objects (FKs, indexes, triggers)

-- Configuration tables (cfg_*)
IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'cfg_Dic_Environment')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.cfg_Dic_Environment;
    PRINT '✅ Moved cfg_Dic_Environment to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'cfg_Dic_CompanyProject')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.cfg_Dic_CompanyProject;
    PRINT '✅ Moved cfg_Dic_CompanyProject to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'cfg_Dic_Language')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.cfg_Dic_Language;
    PRINT '✅ Moved cfg_Dic_Language to ivr schema';
END;

-- Routing table tables (rt_*)
IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'rt_ChangeSet')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.rt_ChangeSet;
    PRINT '✅ Moved rt_ChangeSet to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'rt_RoutingTable')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.rt_RoutingTable;
    PRINT '✅ Moved rt_RoutingTable to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'rt_RoutingTableHistory')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.rt_RoutingTableHistory;
    PRINT '✅ Moved rt_RoutingTableHistory to ivr schema';
END;

-- Segment store tables (seg_*)
IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'seg_Dic_KeyType')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.seg_Dic_KeyType;
    PRINT '✅ Moved seg_Dic_KeyType to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'seg_Dic_SegmentType')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.seg_Dic_SegmentType;
    PRINT '✅ Moved seg_Dic_SegmentType to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'seg_Dic_Key')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.seg_Dic_Key;
    PRINT '✅ Moved seg_Dic_Key to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'seg_Segment')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.seg_Segment;
    PRINT '✅ Moved seg_Segment to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'seg_Key')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.seg_Key;
    PRINT '✅ Moved seg_Key to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'seg_SegmentTransition')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.seg_SegmentTransition;
    PRINT '✅ Moved seg_SegmentTransition to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'seg_SegmentUIState')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.seg_SegmentUIState;
    PRINT '✅ Moved seg_SegmentUIState to ivr schema';
END;

-- Message store tables (msg_*)
IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'msg_Dic_MessageType')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.msg_Dic_MessageType;
    PRINT '✅ Moved msg_Dic_MessageType to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'msg_Dic_MessageCategory')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.msg_Dic_MessageCategory;
    PRINT '✅ Moved msg_Dic_MessageCategory to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'msg_Dic_Voice')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.msg_Dic_Voice;
    PRINT '✅ Moved msg_Dic_Voice to ivr schema';
    -- Rename table from msg_Dic_Voice to cfg_Dic_Voice
    EXEC sp_rename 'ivr.msg_Dic_Voice', 'cfg_Dic_Voice';
    PRINT '✅ Renamed msg_Dic_Voice to cfg_Dic_Voice';
END;

-- Also handle if table was already moved to ivr schema but not renamed
IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('ivr') AND name = 'msg_Dic_Voice')
BEGIN
    EXEC sp_rename 'ivr.msg_Dic_Voice', 'cfg_Dic_Voice';
    PRINT '✅ Renamed ivr.msg_Dic_Voice to ivr.cfg_Dic_Voice';
END;

-- Update foreign key constraint in msg_MessageStoreVoiceConfig if it references the old table name
-- Note: sp_rename should automatically update FK references, but we verify and fix if needed
IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys fk
    INNER JOIN sys.objects ro ON fk.referenced_object_id = ro.object_id
    WHERE fk.parent_object_id = OBJECT_ID('ivr.msg_MessageStoreVoiceConfig')
    AND ro.name = 'msg_Dic_Voice'
)
BEGIN
    -- Drop and recreate the foreign key with correct reference
    DECLARE @FKName NVARCHAR(128);
    SELECT @FKName = fk.name
    FROM sys.foreign_keys fk
    INNER JOIN sys.objects ro ON fk.referenced_object_id = ro.object_id
    WHERE fk.parent_object_id = OBJECT_ID('ivr.msg_MessageStoreVoiceConfig')
    AND ro.name = 'msg_Dic_Voice';

    IF @FKName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE ivr.msg_MessageStoreVoiceConfig DROP CONSTRAINT ' + @FKName);
        EXEC('ALTER TABLE ivr.msg_MessageStoreVoiceConfig ADD CONSTRAINT ' + @FKName + ' FOREIGN KEY (DicVoiceId) REFERENCES ivr.cfg_Dic_Voice(VoiceId) ON DELETE NO ACTION ON UPDATE NO ACTION');
        PRINT '✅ Updated foreign key constraint to reference cfg_Dic_Voice';
    END
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'msg_MessageStore')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.msg_MessageStore;
    PRINT '✅ Moved msg_MessageStore to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'msg_MessageStoreVoiceConfig')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.msg_MessageStoreVoiceConfig;
    PRINT '✅ Moved msg_MessageStoreVoiceConfig to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'msg_Message')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.msg_Message;
    PRINT '✅ Moved msg_Message to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'msg_MessageVersion')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.msg_MessageVersion;
    PRINT '✅ Moved msg_MessageVersion to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'msg_MessageAudit')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.msg_MessageAudit;
    PRINT '✅ Moved msg_MessageAudit to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'msg_MessageKey')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.msg_MessageKey;
    PRINT '✅ Moved msg_MessageKey to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'msg_MessageKeyVersion')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.msg_MessageKeyVersion;
    PRINT '✅ Moved msg_MessageKeyVersion to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'msg_MessageLanguageContent')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.msg_MessageLanguageContent;
    PRINT '✅ Moved msg_MessageLanguageContent to ivr schema';
END;

IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'msg_MessageKeyAudit')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.msg_MessageKeyAudit;
    PRINT '✅ Moved msg_MessageKeyAudit to ivr schema';
END;

-- System tables (sys_*)
IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'sys_AuditLog')
BEGIN
    ALTER SCHEMA ivr TRANSFER dbo.sys_AuditLog;
    PRINT '✅ Moved sys_AuditLog to ivr schema';
END;

-- Step 3: Update trigger schema references
-- Note: Triggers are automatically moved with tables, but we need to update any schema references in trigger code
-- Drop trigger from any schema it might exist in (using dynamic SQL to handle schema-qualified names)
DECLARE @TriggerName NVARCHAR(128) = 'trg_MessageKey_ValidatePublishedVersion';
DECLARE @DropSQL NVARCHAR(MAX);

-- Check and drop from dbo schema
IF EXISTS (SELECT * FROM sys.triggers t
           INNER JOIN sys.objects o ON t.parent_id = o.object_id
           INNER JOIN sys.schemas s ON o.schema_id = s.schema_id
           WHERE t.name = @TriggerName AND s.name = 'dbo' AND o.name = 'msg_MessageKey')
BEGIN
    SET @DropSQL = 'DROP TRIGGER [dbo].[' + @TriggerName + ']';
    EXEC sp_executesql @DropSQL;
    PRINT '✅ Dropped trigger from dbo schema';
END;

-- Check and drop from ivr schema
IF EXISTS (SELECT * FROM sys.triggers t
           INNER JOIN sys.objects o ON t.parent_id = o.object_id
           INNER JOIN sys.schemas s ON o.schema_id = s.schema_id
           WHERE t.name = @TriggerName AND s.name = 'ivr' AND o.name = 'msg_MessageKey')
BEGIN
    SET @DropSQL = 'DROP TRIGGER [ivr].[' + @TriggerName + ']';
    EXEC sp_executesql @DropSQL;
    PRINT '✅ Dropped existing trigger from ivr schema';
END;

-- Create trigger in ivr schema with updated schema references
IF EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('ivr') AND name = 'msg_MessageKey')
BEGIN
    EXEC('
    CREATE TRIGGER [ivr].[trg_MessageKey_ValidatePublishedVersion]
    ON [ivr].[msg_MessageKey]
    AFTER INSERT, UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;

        -- Validate PublishedVersion exists for this MessageKey
        IF EXISTS (
            SELECT 1
            FROM inserted i
            WHERE i.PublishedVersion IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1
                  FROM ivr.msg_MessageKeyVersion mkv
                  WHERE mkv.MessageKeyId = i.MessageKeyId
                    AND mkv.Version = i.PublishedVersion
              )
        )
        BEGIN
            RAISERROR(''PublishedVersion must reference an existing MessageKeyVersion'', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
    END;
    ');
    PRINT '✅ Created trigger trg_MessageKey_ValidatePublishedVersion in ivr schema';
END;

COMMIT TRAN;
PRINT '✅ Schema migration completed successfully';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRAN;
    END;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    PRINT '❌ Schema migration failed: ' + @ErrorMessage;
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
