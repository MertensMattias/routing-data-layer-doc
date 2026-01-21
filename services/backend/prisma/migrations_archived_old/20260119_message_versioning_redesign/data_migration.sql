-- ============================================================================
-- Data Migration: Message Versioning Redesign v5.0.0
-- Created: 2026-01-19
-- Description: Migrate data from per-language versioning (msg_Message)
--              to messageKey-level versioning (msg_MessageKey)
-- ============================================================================
--
-- Migration Strategy:
-- 1. Group messages by (MessageStoreId, MessageKey)
-- 2. For each group, find all unique version numbers across all languages
-- 3. Create MessageKey record (one per messageKey)
-- 4. For each version number, create MessageKeyVersion
-- 5. For each language that has that version, create MessageLanguageContent
-- 6. Set PublishedVersion to most common published version across languages
-- 7. Migrate audit records (optional - can be done separately)
--
-- NOTE: This script should be run AFTER the schema migration
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

DECLARE @MessageStoreId INT;
DECLARE @MessageKey VARCHAR(64);
DECLARE @MessageKeyId INT;
DECLARE @PublishedVersion INT;
DECLARE @VersionNumber INT;
DECLARE @MessageKeyVersionId UNIQUEIDENTIFIER;
DECLARE @Language VARCHAR(10);
DECLARE @Content NVARCHAR(MAX);
DECLARE @TypeSettings NVARCHAR(MAX);
DECLARE @VersionName NVARCHAR(128);
DECLARE @CreatedBy VARCHAR(100);
DECLARE @DateCreated DATETIME2;
DECLARE @MessageId INT;
DECLARE @MessageVersionId UNIQUEIDENTIFIER;

-- Cursor to iterate through unique (MessageStoreId, MessageKey) combinations
DECLARE messageKey_cursor CURSOR FOR
SELECT DISTINCT MessageStoreId, MessageKey
FROM msg_Message
ORDER BY MessageStoreId, MessageKey;

OPEN messageKey_cursor;
FETCH NEXT FROM messageKey_cursor INTO @MessageStoreId, @MessageKey;

WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT 'Processing MessageKey: ' + @MessageKey + ' (Store: ' + CAST(@MessageStoreId AS VARCHAR) + ')';

    -- Get metadata from first message (all messages for same key should have same type/category)
    SELECT TOP 1
        @MessageId = MessageId,
        @CreatedBy = CreatedBy,
        @DateCreated = DateCreated
    FROM msg_Message
    WHERE MessageStoreId = @MessageStoreId
      AND MessageKey = @MessageKey;

    -- Get messageTypeId and categoryId (should be same for all languages of same key)
    DECLARE @MessageTypeId INT;
    DECLARE @CategoryId INT;
    DECLARE @DisplayName NVARCHAR(128);
    DECLARE @Description NVARCHAR(512);

    SELECT TOP 1
        @MessageTypeId = DicMessageTypeId,
        @CategoryId = CategoryId,
        @DisplayName = DisplayName,
        @Description = Description
    FROM msg_Message
    WHERE MessageStoreId = @MessageStoreId
      AND MessageKey = @MessageKey;

    -- Determine published version (most common published version across languages)
    -- If a language has messageVersionId set, find which version number that is
    SELECT TOP 1
        @PublishedVersion = mv.Version
    FROM msg_Message m
    INNER JOIN msg_MessageVersion mv ON m.MessageVersionId = mv.MessageVersionId
    WHERE m.MessageStoreId = @MessageStoreId
      AND m.MessageKey = @MessageKey
      AND m.MessageVersionId IS NOT NULL
    GROUP BY mv.Version
    ORDER BY COUNT(*) DESC;

    -- If no published version found, set to NULL
    IF @PublishedVersion IS NULL
        SET @PublishedVersion = NULL;

    -- Create MessageKey record
    INSERT INTO msg_MessageKey (
        MessageStoreId,
        MessageKey,
        DicMessageTypeId,
        DicMessageCategoryId,
        PublishedVersion,
        DisplayName,
        Description,
        DateCreated,
        CreatedBy,
        DateUpdated,
        UpdatedBy
    )
    VALUES (
        @MessageStoreId,
        @MessageKey,
        @MessageTypeId,
        @CategoryId,
        @PublishedVersion,
        @DisplayName,
        @Description,
        @DateCreated,
        @CreatedBy,
        GETUTCDATE(),
        @CreatedBy
    );

    SET @MessageKeyId = SCOPE_IDENTITY();
    PRINT '  Created MessageKey with ID: ' + CAST(@MessageKeyId AS VARCHAR);

    -- Find all unique version numbers across all languages for this messageKey
    -- We need to find versions that exist in ANY language
    DECLARE version_cursor CURSOR FOR
    SELECT DISTINCT mv.Version
    FROM msg_Message m
    INNER JOIN msg_MessageVersion mv ON m.MessageId = mv.MessageId
    WHERE m.MessageStoreId = @MessageStoreId
      AND m.MessageKey = @MessageKey
    ORDER BY mv.Version;

    OPEN version_cursor;
    FETCH NEXT FROM version_cursor INTO @VersionNumber;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        PRINT '  Processing Version: ' + CAST(@VersionNumber AS VARCHAR);

        -- Get version metadata from first occurrence (versionName, createdBy, dateCreated)
        SELECT TOP 1
            @VersionName = mv.VersionName,
            @CreatedBy = mv.CreatedBy,
            @DateCreated = mv.DateCreated
        FROM msg_Message m
        INNER JOIN msg_MessageVersion mv ON m.MessageId = mv.MessageId
        WHERE m.MessageStoreId = @MessageStoreId
          AND m.MessageKey = @MessageKey
          AND mv.Version = @VersionNumber;

        -- Set defaults if null
        IF @VersionName IS NULL
            SET @VersionName = 'v' + CAST(@VersionNumber AS VARCHAR);
        IF @CreatedBy IS NULL
            SET @CreatedBy = 'migration';
        IF @DateCreated IS NULL
            SET @DateCreated = GETUTCDATE();

        -- Determine if this version is published (matches PublishedVersion)
        DECLARE @IsActive BIT = 0;
        IF @PublishedVersion = @VersionNumber
            SET @IsActive = 1;

        -- Create MessageKeyVersion
        SET @MessageKeyVersionId = NEWID();
        INSERT INTO msg_MessageKeyVersion (
            MessageKeyVersionId,
            MessageKeyId,
            Version,
            VersionName,
            IsActive,
            DateCreated,
            CreatedBy
        )
        VALUES (
            @MessageKeyVersionId,
            @MessageKeyId,
            @VersionNumber,
            @VersionName,
            @IsActive,
            @DateCreated,
            @CreatedBy
        );

        PRINT '    Created MessageKeyVersion: ' + CAST(@MessageKeyVersionId AS VARCHAR(36));

        -- For each language that has this version, create MessageLanguageContent
        DECLARE language_cursor CURSOR FOR
        SELECT DISTINCT
            m.Language,
            mv.Content,
            mv.TypeSettings,
            mv.CreatedBy,
            mv.DateCreated,
            mv.DateUpdated,
            mv.UpdatedBy
        FROM msg_Message m
        INNER JOIN msg_MessageVersion mv ON m.MessageId = mv.MessageId
        WHERE m.MessageStoreId = @MessageStoreId
          AND m.MessageKey = @MessageKey
          AND mv.Version = @VersionNumber;

        OPEN language_cursor;
        FETCH NEXT FROM language_cursor INTO @Language, @Content, @TypeSettings, @CreatedBy, @DateCreated, @DateCreated, @CreatedBy;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Handle NULL values
            IF @CreatedBy IS NULL
                SET @CreatedBy = 'migration';
            IF @DateCreated IS NULL
                SET @DateCreated = GETUTCDATE();

            -- Create MessageLanguageContent
            INSERT INTO msg_MessageLanguageContent (
                MessageKeyVersionId,
                Language,
                Content,
                TypeSettings,
                DateCreated,
                CreatedBy,
                DateUpdated,
                UpdatedBy
            )
            VALUES (
                @MessageKeyVersionId,
                @Language,
                @Content,
                @TypeSettings,
                @DateCreated,
                @CreatedBy,
                GETUTCDATE(),
                @CreatedBy
            );

            PRINT '      Created LanguageContent: ' + @Language;

            FETCH NEXT FROM language_cursor INTO @Language, @Content, @TypeSettings, @CreatedBy, @DateCreated, @DateCreated, @CreatedBy;
        END;

        CLOSE language_cursor;
        DEALLOCATE language_cursor;

        FETCH NEXT FROM version_cursor INTO @VersionNumber;
    END;

    CLOSE version_cursor;
    DEALLOCATE version_cursor;

    FETCH NEXT FROM messageKey_cursor INTO @MessageStoreId, @MessageKey;
END;

CLOSE messageKey_cursor;
DEALLOCATE messageKey_cursor;

-- Validation: Check row counts
DECLARE @OldMessageCount INT;
DECLARE @NewMessageKeyCount INT;
DECLARE @NewVersionCount INT;
DECLARE @NewLanguageContentCount INT;

SELECT @OldMessageCount = COUNT(*) FROM msg_Message;
SELECT @NewMessageKeyCount = COUNT(*) FROM msg_MessageKey;
SELECT @NewVersionCount = COUNT(*) FROM msg_MessageKeyVersion;
SELECT @NewLanguageContentCount = COUNT(*) FROM msg_MessageLanguageContent;

PRINT '';
PRINT 'Migration Summary:';
PRINT '  Old Messages (per-language): ' + CAST(@OldMessageCount AS VARCHAR);
PRINT '  New MessageKeys: ' + CAST(@NewMessageKeyCount AS VARCHAR);
PRINT '  New MessageKeyVersions: ' + CAST(@NewVersionCount AS VARCHAR);
PRINT '  New MessageLanguageContents: ' + CAST(@NewLanguageContentCount AS VARCHAR);
PRINT '';

-- Verify: Each old message should have corresponding language content
DECLARE @MissingContentCount INT;
SELECT @MissingContentCount = COUNT(*)
FROM msg_Message m
INNER JOIN msg_MessageVersion mv ON m.MessageId = mv.MessageId
LEFT JOIN msg_MessageKey mk ON m.MessageStoreId = mk.MessageStoreId AND m.MessageKey = mk.MessageKey
LEFT JOIN msg_MessageKeyVersion mkv ON mk.MessageKeyId = mkv.MessageKeyId AND mv.Version = mkv.Version
LEFT JOIN msg_MessageLanguageContent mlc ON mkv.MessageKeyVersionId = mlc.MessageKeyVersionId AND m.Language = mlc.Language
WHERE mlc.MessageLanguageContentId IS NULL;

IF @MissingContentCount > 0
BEGIN
    PRINT 'WARNING: ' + CAST(@MissingContentCount AS VARCHAR) + ' message versions have missing language content!';
    ROLLBACK TRANSACTION;
    RETURN;
END
ELSE
BEGIN
    PRINT 'Validation passed: All message versions migrated successfully.';
    COMMIT TRANSACTION;
    PRINT 'Migration completed successfully!';
END;
