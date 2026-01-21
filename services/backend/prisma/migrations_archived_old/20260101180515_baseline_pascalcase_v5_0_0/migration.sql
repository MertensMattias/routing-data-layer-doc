BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[cfg_Dic_Environment] (
    [Environment] VARCHAR(20) NOT NULL,
    [DisplayName] NVARCHAR(128) NOT NULL,
    [Description] NVARCHAR(500),
    [UrlBase] VARCHAR(256),
    [Config] NVARCHAR(4000),
    [IsActive] BIT NOT NULL CONSTRAINT [cfg_Dic_Environment_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [cfg_Dic_Environment_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [DateUpdated] DATETIME2 NOT NULL,
    CONSTRAINT [cfg_Dic_Environment_pkey] PRIMARY KEY CLUSTERED ([Environment])
);

-- CreateTable
CREATE TABLE [dbo].[cfg_Dic_CompanyProject] (
    [CompanyProjectId] INT NOT NULL IDENTITY(1,1),
    [CustomerId] VARCHAR(64) NOT NULL,
    [ProjectId] VARCHAR(64) NOT NULL,
    [DisplayName] NVARCHAR(128) NOT NULL,
    [Description] NVARCHAR(512),
    [OktaGroup] VARCHAR(100) NOT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [cfg_Dic_CompanyProject_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [cfg_Dic_CompanyProject_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DateUpdated] DATETIME2 NOT NULL,
    [UpdatedBy] VARCHAR(100),
    CONSTRAINT [cfg_Dic_CompanyProject_pkey] PRIMARY KEY CLUSTERED ([CompanyProjectId]),
    CONSTRAINT [cfg_Dic_CompanyProject_CustomerId_ProjectId_key] UNIQUE NONCLUSTERED ([CustomerId],[ProjectId]),
    CONSTRAINT [cfg_Dic_CompanyProject_OktaGroup_key] UNIQUE NONCLUSTERED ([OktaGroup])
);

-- CreateTable
CREATE TABLE [dbo].[cfg_Dic_Language] (
    [LanguageCode] VARCHAR(10) NOT NULL,
    [DisplayName] NVARCHAR(128) NOT NULL,
    [NativeName] NVARCHAR(128),
    [SortOrder] INT NOT NULL CONSTRAINT [cfg_Dic_Language_SortOrder_df] DEFAULT 0,
    [IsActive] BIT NOT NULL CONSTRAINT [cfg_Dic_Language_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [cfg_Dic_Language_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [DateUpdated] DATETIME2 NOT NULL,
    CONSTRAINT [cfg_Dic_Language_pkey] PRIMARY KEY CLUSTERED ([LanguageCode])
);

-- CreateTable
CREATE TABLE [dbo].[rt_ChangeSet] (
    [ChangeSetId] UNIQUEIDENTIFIER NOT NULL,
    [RoutingId] VARCHAR(150) NOT NULL,
    [CustomerId] VARCHAR(64) NOT NULL,
    [ProjectId] VARCHAR(64) NOT NULL,
    [Status] VARCHAR(20) NOT NULL CONSTRAINT [rt_ChangeSet_Status_df] DEFAULT 'draft',
    [Description] NVARCHAR(500),
    [IsActive] BIT NOT NULL CONSTRAINT [rt_ChangeSet_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [rt_ChangeSet_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DatePublished] DATETIME2,
    [PublishedBy] VARCHAR(100),
    CONSTRAINT [rt_ChangeSet_pkey] PRIMARY KEY CLUSTERED ([ChangeSetId])
);

-- CreateTable
CREATE TABLE [dbo].[rt_RoutingTable] (
    [RoutingTableId] UNIQUEIDENTIFIER NOT NULL,
    [SourceId] VARCHAR(150) NOT NULL,
    [RoutingId] VARCHAR(150) NOT NULL,
    [DicCompanyProjectId] INT NOT NULL,
    [LanguageCode] VARCHAR(10),
    [MessageStoreId] INT,
    [SchedulerId] INT,
    [InitSegment] VARCHAR(100) NOT NULL CONSTRAINT [rt_RoutingTable_InitSegment_df] DEFAULT 'init',
    [FeatureFlags] NVARCHAR(4000) NOT NULL CONSTRAINT [rt_RoutingTable_FeatureFlags_df] DEFAULT '{}',
    [Config] NVARCHAR(4000) NOT NULL CONSTRAINT [rt_RoutingTable_Config_df] DEFAULT '{}',
    [IsActive] BIT NOT NULL CONSTRAINT [rt_RoutingTable_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [rt_RoutingTable_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DateUpdated] DATETIME2 NOT NULL,
    [UpdatedBy] VARCHAR(100),
    CONSTRAINT [rt_RoutingTable_pkey] PRIMARY KEY CLUSTERED ([RoutingTableId]),
    CONSTRAINT [rt_RoutingTable_SourceId_key] UNIQUE NONCLUSTERED ([SourceId])
);

-- CreateTable
CREATE TABLE [dbo].[rt_RoutingTableHistory] (
    [VersionId] UNIQUEIDENTIFIER NOT NULL,
    [RoutingId] VARCHAR(150) NOT NULL,
    [VersionNumber] INT NOT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [rt_RoutingTableHistory_IsActive_df] DEFAULT 0,
    [Snapshot] NVARCHAR(max) NOT NULL,
    [Comment] NVARCHAR(500),
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [rt_RoutingTableHistory_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    CONSTRAINT [rt_RoutingTableHistory_pkey] PRIMARY KEY CLUSTERED ([VersionId]),
    CONSTRAINT [rt_RoutingTableHistory_RoutingId_VersionNumber_key] UNIQUE NONCLUSTERED ([RoutingId],[VersionNumber])
);

-- CreateTable
CREATE TABLE [dbo].[seg_Dic_KeyType] (
    [DicTypeId] INT NOT NULL IDENTITY(1,1),
    [TypeName] VARCHAR(20) NOT NULL,
    [DisplayName] NVARCHAR(50),
    [Description] NVARCHAR(200),
    CONSTRAINT [seg_Dic_KeyType_pkey] PRIMARY KEY CLUSTERED ([DicTypeId]),
    CONSTRAINT [seg_Dic_KeyType_TypeName_key] UNIQUE NONCLUSTERED ([TypeName])
);

-- CreateTable
CREATE TABLE [dbo].[seg_Dic_SegmentType] (
    [DicSegmentTypeId] INT NOT NULL IDENTITY(1,1),
    [SegmentTypeName] VARCHAR(50) NOT NULL,
    [DisplayName] NVARCHAR(100),
    [Description] NVARCHAR(500),
    [Category] VARCHAR(50),
    [IsTerminal] BIT NOT NULL CONSTRAINT [seg_Dic_SegmentType_IsTerminal_df] DEFAULT 0,
    [IsActive] BIT NOT NULL CONSTRAINT [seg_Dic_SegmentType_IsActive_df] DEFAULT 1,
    CONSTRAINT [seg_Dic_SegmentType_pkey] PRIMARY KEY CLUSTERED ([DicSegmentTypeId]),
    CONSTRAINT [seg_Dic_SegmentType_SegmentTypeName_key] UNIQUE NONCLUSTERED ([SegmentTypeName])
);

-- CreateTable
CREATE TABLE [dbo].[seg_Dic_Key] (
    [DicKeyId] INT NOT NULL IDENTITY(1,1),
    [DicSegmentTypeId] INT NOT NULL,
    [KeyName] VARCHAR(100) NOT NULL,
    [DisplayName] NVARCHAR(100),
    [DicTypeId] INT NOT NULL,
    [IsRequired] BIT NOT NULL CONSTRAINT [seg_Dic_Key_IsRequired_df] DEFAULT 0,
    [DefaultValue] NVARCHAR(4000),
    [IsDisplayed] BIT NOT NULL CONSTRAINT [seg_Dic_Key_IsDisplayed_df] DEFAULT 1,
    [IsEditable] BIT NOT NULL CONSTRAINT [seg_Dic_Key_IsEditable_df] DEFAULT 1,
    [IsActive] BIT NOT NULL CONSTRAINT [seg_Dic_Key_IsActive_df] DEFAULT 1,
    CONSTRAINT [seg_Dic_Key_pkey] PRIMARY KEY CLUSTERED ([DicKeyId]),
    CONSTRAINT [seg_Dic_Key_DicSegmentTypeId_KeyName_key] UNIQUE NONCLUSTERED ([DicSegmentTypeId],[KeyName])
);

-- CreateTable
CREATE TABLE [dbo].[seg_Segment] (
    [SegmentId] UNIQUEIDENTIFIER NOT NULL,
    [RoutingId] VARCHAR(150) NOT NULL,
    [SegmentName] VARCHAR(100) NOT NULL,
    [DicSegmentTypeId] INT NOT NULL,
    [DisplayName] NVARCHAR(128),
    [ChangeSetId] UNIQUEIDENTIFIER,
    [IsActive] BIT NOT NULL CONSTRAINT [seg_Segment_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [seg_Segment_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DateUpdated] DATETIME2 NOT NULL,
    [UpdatedBy] VARCHAR(100),
    CONSTRAINT [seg_Segment_pkey] PRIMARY KEY CLUSTERED ([SegmentId]),
    CONSTRAINT [seg_Segment_RoutingId_SegmentName_ChangeSetId_key] UNIQUE NONCLUSTERED ([RoutingId],[SegmentName],[ChangeSetId]),
    CONSTRAINT [seg_Segment_RoutingId_ChangeSetId_SegmentId_key] UNIQUE NONCLUSTERED ([RoutingId],[ChangeSetId],[SegmentId])
);

-- CreateTable
CREATE TABLE [dbo].[seg_Key] (
    [DicSegmentTypeId] INT NOT NULL,
    [DicKeyId] INT NOT NULL,
    [SegmentId] UNIQUEIDENTIFIER NOT NULL,
    [Value] NVARCHAR(max),
    [IsDisplayed] BIT NOT NULL CONSTRAINT [seg_Key_IsDisplayed_df] DEFAULT 1,
    [IsEditable] BIT NOT NULL CONSTRAINT [seg_Key_IsEditable_df] DEFAULT 1,
    CONSTRAINT [seg_Key_pkey] PRIMARY KEY CLUSTERED ([DicSegmentTypeId],[DicKeyId],[SegmentId])
);

-- CreateTable
CREATE TABLE [dbo].[seg_SegmentTransition] (
    [SegmentTransitionId] UNIQUEIDENTIFIER NOT NULL,
    [SegmentId] UNIQUEIDENTIFIER NOT NULL,
    [RoutingId] VARCHAR(150) NOT NULL,
    [ChangeSetId] UNIQUEIDENTIFIER,
    [ContextKey] VARCHAR(100),
    [ResultName] VARCHAR(50) NOT NULL,
    [NextSegmentId] UNIQUEIDENTIFIER,
    [Params] NVARCHAR(4000),
    CONSTRAINT [seg_SegmentTransition_pkey] PRIMARY KEY CLUSTERED ([SegmentTransitionId]),
    CONSTRAINT [seg_SegmentTransition_SegmentId_ResultName_key] UNIQUE NONCLUSTERED ([SegmentId],[ResultName])
);

-- CreateTable
CREATE TABLE [dbo].[msg_Dic_MessageType] (
    [MessageTypeId] INT NOT NULL IDENTITY(1,1),
    [Code] VARCHAR(20) NOT NULL,
    [DisplayName] NVARCHAR(64) NOT NULL,
    [Description] NVARCHAR(256),
    [SettingsSchema] NVARCHAR(max),
    [DefaultSettings] NVARCHAR(max),
    [SortOrder] INT NOT NULL CONSTRAINT [msg_Dic_MessageType_SortOrder_df] DEFAULT 0,
    [IsActive] BIT NOT NULL CONSTRAINT [msg_Dic_MessageType_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [msg_Dic_MessageType_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [msg_Dic_MessageType_pkey] PRIMARY KEY CLUSTERED ([MessageTypeId]),
    CONSTRAINT [msg_Dic_MessageType_Code_key] UNIQUE NONCLUSTERED ([Code])
);

-- CreateTable
CREATE TABLE [dbo].[msg_Dic_MessageCategory] (
    [CategoryId] INT NOT NULL IDENTITY(1,1),
    [Code] VARCHAR(32) NOT NULL,
    [DisplayName] NVARCHAR(64) NOT NULL,
    [Description] NVARCHAR(256),
    [Icon] VARCHAR(32),
    [Color] CHAR(7),
    [SortOrder] INT NOT NULL CONSTRAINT [msg_Dic_MessageCategory_SortOrder_df] DEFAULT 0,
    [IsActive] BIT NOT NULL CONSTRAINT [msg_Dic_MessageCategory_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [msg_Dic_MessageCategory_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [msg_Dic_MessageCategory_pkey] PRIMARY KEY CLUSTERED ([CategoryId]),
    CONSTRAINT [msg_Dic_MessageCategory_Code_key] UNIQUE NONCLUSTERED ([Code])
);

-- CreateTable
CREATE TABLE [dbo].[msg_Dic_Voice] (
    [VoiceId] INT NOT NULL IDENTITY(1,1),
    [Code] VARCHAR(64) NOT NULL,
    [Engine] VARCHAR(20) NOT NULL,
    [Language] VARCHAR(10) NOT NULL,
    [DisplayName] NVARCHAR(128) NOT NULL,
    [Gender] VARCHAR(10),
    [Style] VARCHAR(32),
    [SampleUrl] VARCHAR(256),
    [SortOrder] INT NOT NULL CONSTRAINT [msg_Dic_Voice_SortOrder_df] DEFAULT 0,
    [IsActive] BIT NOT NULL CONSTRAINT [msg_Dic_Voice_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [msg_Dic_Voice_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [msg_Dic_Voice_pkey] PRIMARY KEY CLUSTERED ([VoiceId]),
    CONSTRAINT [msg_Dic_Voice_Code_key] UNIQUE NONCLUSTERED ([Code])
);

-- CreateTable
CREATE TABLE [dbo].[msg_MessageStore] (
    [MessageStoreId] INT NOT NULL IDENTITY(1,1),
    [DicCompanyProjectId] INT NOT NULL,
    [Name] NVARCHAR(128) NOT NULL,
    [Description] NVARCHAR(512),
    [AllowedLanguages] NVARCHAR(200) NOT NULL CONSTRAINT [msg_MessageStore_AllowedLanguages_df] DEFAULT '[]',
    [DefaultLanguage] VARCHAR(10),
    [IsActive] BIT NOT NULL CONSTRAINT [msg_MessageStore_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [msg_MessageStore_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DateUpdated] DATETIME2 NOT NULL,
    [UpdatedBy] VARCHAR(100),
    CONSTRAINT [msg_MessageStore_pkey] PRIMARY KEY CLUSTERED ([MessageStoreId])
);

-- CreateTable
CREATE TABLE [dbo].[msg_MessageStoreVoiceConfig] (
    [ConfigId] INT NOT NULL IDENTITY(1,1),
    [MessageStoreId] INT NOT NULL,
    [Language] VARCHAR(10) NOT NULL,
    [DicVoiceId] INT NOT NULL,
    [IsDefault] BIT NOT NULL CONSTRAINT [msg_MessageStoreVoiceConfig_IsDefault_df] DEFAULT 0,
    [SortOrder] INT NOT NULL CONSTRAINT [msg_MessageStoreVoiceConfig_SortOrder_df] DEFAULT 0,
    CONSTRAINT [msg_MessageStoreVoiceConfig_pkey] PRIMARY KEY CLUSTERED ([ConfigId]),
    CONSTRAINT [msg_MessageStoreVoiceConfig_MessageStoreId_Language_DicVoiceId_key] UNIQUE NONCLUSTERED ([MessageStoreId],[Language],[DicVoiceId])
);

-- CreateTable
CREATE TABLE [dbo].[msg_Message] (
    [MessageId] INT NOT NULL IDENTITY(1,1),
    [MessageStoreId] INT NOT NULL,
    [MessageKey] VARCHAR(64) NOT NULL,
    [Language] VARCHAR(10) NOT NULL,
    [DicMessageTypeId] INT NOT NULL,
    [CategoryId] INT NOT NULL,
    [MessageVersionId] UNIQUEIDENTIFIER,
    [DisplayName] NVARCHAR(128),
    [Description] NVARCHAR(512),
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [msg_Message_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DateUpdated] DATETIME2 NOT NULL,
    [UpdatedBy] VARCHAR(100),
    CONSTRAINT [msg_Message_pkey] PRIMARY KEY CLUSTERED ([MessageId]),
    CONSTRAINT [msg_Message_MessageStoreId_MessageKey_Language_key] UNIQUE NONCLUSTERED ([MessageStoreId],[MessageKey],[Language])
);

-- CreateTable
CREATE TABLE [dbo].[msg_MessageVersion] (
    [MessageVersionId] UNIQUEIDENTIFIER NOT NULL,
    [MessageId] INT NOT NULL,
    [Version] INT NOT NULL,
    [Content] NVARCHAR(max) NOT NULL,
    [TypeSettings] NVARCHAR(max),
    [IsActive] BIT NOT NULL CONSTRAINT [msg_MessageVersion_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [msg_MessageVersion_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DateUpdated] DATETIME2 NOT NULL,
    [UpdatedBy] VARCHAR(100),
    CONSTRAINT [msg_MessageVersion_pkey] PRIMARY KEY CLUSTERED ([MessageVersionId]),
    CONSTRAINT [msg_MessageVersion_MessageId_Version_key] UNIQUE NONCLUSTERED ([MessageId],[Version])
);

-- CreateTable
CREATE TABLE [dbo].[msg_MessageAudit] (
    [AuditId] UNIQUEIDENTIFIER NOT NULL,
    [MessageVersionId] UNIQUEIDENTIFIER NOT NULL,
    [Action] VARCHAR(20) NOT NULL,
    [ActionBy] VARCHAR(100) NOT NULL,
    [ActionReason] NVARCHAR(500),
    [AuditData] NVARCHAR(max),
    [DateAction] DATETIME2 NOT NULL CONSTRAINT [msg_MessageAudit_DateAction_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [msg_MessageAudit_pkey] PRIMARY KEY CLUSTERED ([AuditId])
);

-- CreateTable
CREATE TABLE [dbo].[sys_AuditLog] (
    [AuditLogId] UNIQUEIDENTIFIER NOT NULL,
    [UserId] VARCHAR(100) NOT NULL,
    [UserEmail] VARCHAR(256) NOT NULL,
    [Action] VARCHAR(256) NOT NULL,
    [EntityType] VARCHAR(100) NOT NULL,
    [EntityId] VARCHAR(150),
    [Timestamp] DATETIME2 NOT NULL CONSTRAINT [sys_AuditLog_Timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    [Duration] INT,
    [IpAddress] VARCHAR(45),
    [UserAgent] NVARCHAR(512),
    [RequestBody] NVARCHAR(max),
    [ResponseStatus] VARCHAR(20) NOT NULL,
    [ErrorMessage] NVARCHAR(max),
    CONSTRAINT [sys_AuditLog_pkey] PRIMARY KEY CLUSTERED ([AuditLogId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [cfg_Dic_CompanyProject_CustomerId_idx] ON [dbo].[cfg_Dic_CompanyProject]([CustomerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [cfg_Dic_CompanyProject_IsActive_idx] ON [dbo].[cfg_Dic_CompanyProject]([IsActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [cfg_Dic_CompanyProject_OktaGroup_idx] ON [dbo].[cfg_Dic_CompanyProject]([OktaGroup]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_changeset_routing] ON [dbo].[rt_ChangeSet]([RoutingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_changeset_status] ON [dbo].[rt_ChangeSet]([Status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_changeset_created] ON [dbo].[rt_ChangeSet]([DateCreated]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_routing_routingid] ON [dbo].[rt_RoutingTable]([RoutingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_routing_company] ON [dbo].[rt_RoutingTable]([DicCompanyProjectId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_routing_messagestore] ON [dbo].[rt_RoutingTable]([MessageStoreId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_history_routing] ON [dbo].[rt_RoutingTableHistory]([RoutingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_history_created] ON [dbo].[rt_RoutingTableHistory]([DateCreated]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_segment_routing] ON [dbo].[seg_Segment]([RoutingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_segment_type] ON [dbo].[seg_Segment]([DicSegmentTypeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_segment_changeset] ON [dbo].[seg_Segment]([ChangeSetId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [seg_SegmentTransition_SegmentId_idx] ON [dbo].[seg_SegmentTransition]([SegmentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [seg_SegmentTransition_NextSegmentId_idx] ON [dbo].[seg_SegmentTransition]([NextSegmentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_transition_contextkey] ON [dbo].[seg_SegmentTransition]([SegmentId], [ContextKey]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_voice_engine_lang] ON [dbo].[msg_Dic_Voice]([Engine], [Language]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_messagestore_companyproject] ON [dbo].[msg_MessageStore]([DicCompanyProjectId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_messagestore_active] ON [dbo].[msg_MessageStore]([IsActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_voiceconfig_store_lang] ON [dbo].[msg_MessageStoreVoiceConfig]([MessageStoreId], [Language]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_message_store] ON [dbo].[msg_Message]([MessageStoreId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_message_type] ON [dbo].[msg_Message]([DicMessageTypeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_message_category] ON [dbo].[msg_Message]([CategoryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_messageversion_message] ON [dbo].[msg_MessageVersion]([MessageId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_messageversion_created] ON [dbo].[msg_MessageVersion]([DateCreated]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_audit_messageversion] ON [dbo].[msg_MessageAudit]([MessageVersionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_audit_date] ON [dbo].[msg_MessageAudit]([DateAction]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [sys_AuditLog_UserId_idx] ON [dbo].[sys_AuditLog]([UserId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [sys_AuditLog_EntityType_EntityId_idx] ON [dbo].[sys_AuditLog]([EntityType], [EntityId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [sys_AuditLog_Timestamp_idx] ON [dbo].[sys_AuditLog]([Timestamp]);

-- AddForeignKey
ALTER TABLE [dbo].[rt_RoutingTable] ADD CONSTRAINT [rt_RoutingTable_DicCompanyProjectId_fkey] FOREIGN KEY ([DicCompanyProjectId]) REFERENCES [dbo].[cfg_Dic_CompanyProject]([CompanyProjectId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[rt_RoutingTable] ADD CONSTRAINT [rt_RoutingTable_LanguageCode_fkey] FOREIGN KEY ([LanguageCode]) REFERENCES [dbo].[cfg_Dic_Language]([LanguageCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[rt_RoutingTable] ADD CONSTRAINT [rt_RoutingTable_MessageStoreId_fkey] FOREIGN KEY ([MessageStoreId]) REFERENCES [dbo].[msg_MessageStore]([MessageStoreId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[seg_Dic_Key] ADD CONSTRAINT [seg_Dic_Key_DicSegmentTypeId_fkey] FOREIGN KEY ([DicSegmentTypeId]) REFERENCES [dbo].[seg_Dic_SegmentType]([DicSegmentTypeId]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[seg_Dic_Key] ADD CONSTRAINT [seg_Dic_Key_DicTypeId_fkey] FOREIGN KEY ([DicTypeId]) REFERENCES [dbo].[seg_Dic_KeyType]([DicTypeId]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[seg_Segment] ADD CONSTRAINT [seg_Segment_DicSegmentTypeId_fkey] FOREIGN KEY ([DicSegmentTypeId]) REFERENCES [dbo].[seg_Dic_SegmentType]([DicSegmentTypeId]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[seg_Segment] ADD CONSTRAINT [seg_Segment_ChangeSetId_fkey] FOREIGN KEY ([ChangeSetId]) REFERENCES [dbo].[rt_ChangeSet]([ChangeSetId]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[seg_Key] ADD CONSTRAINT [seg_Key_DicSegmentTypeId_fkey] FOREIGN KEY ([DicSegmentTypeId]) REFERENCES [dbo].[seg_Dic_SegmentType]([DicSegmentTypeId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[seg_Key] ADD CONSTRAINT [seg_Key_DicKeyId_fkey] FOREIGN KEY ([DicKeyId]) REFERENCES [dbo].[seg_Dic_Key]([DicKeyId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[seg_Key] ADD CONSTRAINT [seg_Key_SegmentId_fkey] FOREIGN KEY ([SegmentId]) REFERENCES [dbo].[seg_Segment]([SegmentId]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[seg_SegmentTransition] ADD CONSTRAINT [seg_SegmentTransition_SegmentId_fkey] FOREIGN KEY ([SegmentId]) REFERENCES [dbo].[seg_Segment]([SegmentId]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[seg_SegmentTransition] ADD CONSTRAINT [seg_SegmentTransition_NextSegmentId_fkey] FOREIGN KEY ([NextSegmentId]) REFERENCES [dbo].[seg_Segment]([SegmentId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[msg_Dic_Voice] ADD CONSTRAINT [msg_Dic_Voice_Language_fkey] FOREIGN KEY ([Language]) REFERENCES [dbo].[cfg_Dic_Language]([LanguageCode]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[msg_MessageStore] ADD CONSTRAINT [msg_MessageStore_DicCompanyProjectId_fkey] FOREIGN KEY ([DicCompanyProjectId]) REFERENCES [dbo].[cfg_Dic_CompanyProject]([CompanyProjectId]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[msg_MessageStore] ADD CONSTRAINT [msg_MessageStore_DefaultLanguage_fkey] FOREIGN KEY ([DefaultLanguage]) REFERENCES [dbo].[cfg_Dic_Language]([LanguageCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[msg_MessageStoreVoiceConfig] ADD CONSTRAINT [msg_MessageStoreVoiceConfig_MessageStoreId_fkey] FOREIGN KEY ([MessageStoreId]) REFERENCES [dbo].[msg_MessageStore]([MessageStoreId]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[msg_MessageStoreVoiceConfig] ADD CONSTRAINT [msg_MessageStoreVoiceConfig_DicVoiceId_fkey] FOREIGN KEY ([DicVoiceId]) REFERENCES [dbo].[msg_Dic_Voice]([VoiceId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[msg_MessageStoreVoiceConfig] ADD CONSTRAINT [msg_MessageStoreVoiceConfig_Language_fkey] FOREIGN KEY ([Language]) REFERENCES [dbo].[cfg_Dic_Language]([LanguageCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[msg_Message] ADD CONSTRAINT [msg_Message_MessageStoreId_fkey] FOREIGN KEY ([MessageStoreId]) REFERENCES [dbo].[msg_MessageStore]([MessageStoreId]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[msg_Message] ADD CONSTRAINT [msg_Message_DicMessageTypeId_fkey] FOREIGN KEY ([DicMessageTypeId]) REFERENCES [dbo].[msg_Dic_MessageType]([MessageTypeId]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[msg_Message] ADD CONSTRAINT [msg_Message_CategoryId_fkey] FOREIGN KEY ([CategoryId]) REFERENCES [dbo].[msg_Dic_MessageCategory]([CategoryId]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[msg_Message] ADD CONSTRAINT [msg_Message_Language_fkey] FOREIGN KEY ([Language]) REFERENCES [dbo].[cfg_Dic_Language]([LanguageCode]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[msg_MessageVersion] ADD CONSTRAINT [msg_MessageVersion_MessageId_fkey] FOREIGN KEY ([MessageId]) REFERENCES [dbo].[msg_Message]([MessageId]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
