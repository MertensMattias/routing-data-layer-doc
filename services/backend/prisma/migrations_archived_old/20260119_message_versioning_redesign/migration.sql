-- ============================================================================
-- Migration: Message Versioning Redesign v5.0.0
-- Created: 2026-01-19
-- Description: Create new MessageKey-level versioning tables
--              Replaces per-language versioning with atomic version containers
-- ============================================================================

-- ============================================================================
-- msg_MessageKey: Identity table (one per messageKey in store)
-- Note: Tables created in dbo schema first, will be moved to ivr by schema migration
-- ============================================================================
CREATE TABLE [dbo].[msg_MessageKey] (
    MessageKeyId        INT IDENTITY(1,1) PRIMARY KEY,
    MessageStoreId      INT NOT NULL,
    MessageKey          VARCHAR(64) NOT NULL,       -- UPPER_SNAKE_CASE
    DicMessageTypeId    INT NOT NULL,
    DicMessageCategoryId INT NOT NULL,              -- Maps to msg_Dic_MessageCategory(CategoryId)
    PublishedVersion    INT NULL,                   -- Currently published version (NULL = no published)
    DisplayName         NVARCHAR(128) NULL,
    Description         NVARCHAR(512) NULL,
    DateCreated         DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy           VARCHAR(100) NULL,
    DateUpdated         DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedBy           VARCHAR(100) NULL,

    CONSTRAINT FK_MK_Store FOREIGN KEY (MessageStoreId)
        REFERENCES [dbo].[msg_MessageStore](MessageStoreId) ON DELETE CASCADE,
    CONSTRAINT FK_MK_Type FOREIGN KEY (DicMessageTypeId)
        REFERENCES [dbo].[msg_Dic_MessageType](MessageTypeId),
    CONSTRAINT FK_MK_Category FOREIGN KEY (DicMessageCategoryId)
        REFERENCES [dbo].[msg_Dic_MessageCategory](CategoryId),
    CONSTRAINT UQ_MK_Store_Key UNIQUE (MessageStoreId, MessageKey)
);

CREATE INDEX IX_MK_Store ON [dbo].[msg_MessageKey](MessageStoreId);
CREATE INDEX IX_MK_Category ON [dbo].[msg_MessageKey](DicMessageCategoryId);
CREATE INDEX IX_MK_Type ON [dbo].[msg_MessageKey](DicMessageTypeId);

-- Composite index for runtime fetch (performance-critical)
-- Filtered index on published messages only
CREATE INDEX IX_MK_Runtime_Fetch
  ON [dbo].[msg_MessageKey](MessageStoreId, MessageKey, PublishedVersion)
  INCLUDE (MessageKeyId, DicMessageCategoryId)
  WHERE PublishedVersion IS NOT NULL;

-- ============================================================================
-- msg_MessageKeyVersion: Version container (groups all languages for a version)
-- ============================================================================
CREATE TABLE [dbo].[msg_MessageKeyVersion] (
    MessageKeyVersionId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    MessageKeyId        INT NOT NULL,
    Version             INT NOT NULL,               -- 1-10
    VersionName         NVARCHAR(128) NULL,         -- "Q1 2024 Release"
    IsActive            BIT NOT NULL DEFAULT 1,
    DateCreated         DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy           VARCHAR(100) NULL,

    CONSTRAINT FK_MKV_Key FOREIGN KEY (MessageKeyId)
        REFERENCES [dbo].[msg_MessageKey](MessageKeyId) ON DELETE CASCADE,
    CONSTRAINT UQ_MKV_Version UNIQUE (MessageKeyId, Version),
    CONSTRAINT CK_MKV_Range CHECK (Version > 0 AND Version <= 10)
);

CREATE INDEX IX_MKV_Key ON [dbo].[msg_MessageKeyVersion](MessageKeyId);
CREATE INDEX IX_MKV_Published ON [dbo].[msg_MessageKeyVersion](MessageKeyId, Version)
  INCLUDE (MessageKeyVersionId);

-- ============================================================================
-- msg_MessageLanguageContent: Language content within a version
-- ============================================================================
CREATE TABLE [dbo].[msg_MessageLanguageContent] (
    MessageLanguageContentId INT IDENTITY(1,1) PRIMARY KEY,
    MessageKeyVersionId UNIQUEIDENTIFIER NOT NULL,
    Language            VARCHAR(10) NOT NULL,       -- BCP47
    Content             NVARCHAR(MAX) NOT NULL,
    TypeSettings        NVARCHAR(MAX) NULL,         -- JSON
    DateCreated         DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy           VARCHAR(100) NULL,
    DateUpdated         DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedBy           VARCHAR(100) NULL,

    CONSTRAINT FK_MLC_Version FOREIGN KEY (MessageKeyVersionId)
        REFERENCES [dbo].[msg_MessageKeyVersion](MessageKeyVersionId) ON DELETE CASCADE,
    CONSTRAINT FK_MLC_Language FOREIGN KEY (Language)
        REFERENCES [dbo].[cfg_Dic_Language](LanguageCode),
    CONSTRAINT UQ_MLC_Version_Lang UNIQUE (MessageKeyVersionId, Language)
);

CREATE INDEX IX_MLC_Version ON [dbo].[msg_MessageLanguageContent](MessageKeyVersionId);
CREATE INDEX IX_MLC_Language ON [dbo].[msg_MessageLanguageContent](MessageKeyVersionId, Language)
  INCLUDE (Content, TypeSettings);

-- ============================================================================
-- msg_MessageKeyAudit: Audit trail (no FK for retention)
-- ============================================================================
CREATE TABLE [dbo].[msg_MessageKeyAudit] (
    AuditId             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    MessageKeyId        INT NOT NULL,               -- No FK for retention
    MessageKeyVersionId UNIQUEIDENTIFIER NULL,      -- Version involved (if applicable)
    Action              VARCHAR(20) NOT NULL,       -- created, edited, published, rollback, deleted, language_added, imported
    ActionBy            VARCHAR(100) NOT NULL,
    ActionReason        NVARCHAR(500) NULL,
    AuditData           NVARCHAR(MAX) NULL,         -- JSON with before/after snapshots
    DateAction          DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX IX_MKA_Key ON [dbo].[msg_MessageKeyAudit](MessageKeyId);
CREATE INDEX IX_MKA_Version ON [dbo].[msg_MessageKeyAudit](MessageKeyVersionId);
CREATE INDEX IX_MKA_Date ON [dbo].[msg_MessageKeyAudit](DateAction);
CREATE INDEX IX_MKA_Action ON [dbo].[msg_MessageKeyAudit](Action);

-- ============================================================================
-- Validation Trigger: Ensure PublishedVersion exists
-- Note: CREATE TRIGGER must be in its own batch, so we use EXEC
-- ============================================================================
EXEC('
CREATE TRIGGER [dbo].[trg_MessageKey_ValidatePublishedVersion]
ON [dbo].[msg_MessageKey]
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
              FROM [dbo].[msg_MessageKeyVersion] mkv
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
