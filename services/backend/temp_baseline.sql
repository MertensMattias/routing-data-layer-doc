BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ivr.cfg_Dic_Environment] (
    [Environment] VARCHAR(20) NOT NULL,
    [DisplayName] NVARCHAR(128) NOT NULL,
    [Description] NVARCHAR(500),
    [UrlBase] VARCHAR(256),
    [Config] NVARCHAR(4000),
    [IsActive] BIT NOT NULL CONSTRAINT [ivr.cfg_Dic_Environment_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [ivr.cfg_Dic_Environment_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [DateUpdated] DATETIME2 NOT NULL,
    CONSTRAINT [ivr.cfg_Dic_Environment_pkey] PRIMARY KEY CLUSTERED ([Environment])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.cfg_Dic_CompanyProject] (
    [CompanyProjectId] INT NOT NULL IDENTITY(1,1),
    [CustomerId] VARCHAR(64) NOT NULL,
    [ProjectId] VARCHAR(64) NOT NULL,
    [DisplayName] NVARCHAR(128) NOT NULL,
    [Description] NVARCHAR(512),
    [OktaGroup] VARCHAR(100) NOT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [ivr.cfg_Dic_CompanyProject_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [ivr.cfg_Dic_CompanyProject_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DateUpdated] DATETIME2 NOT NULL,
    [UpdatedBy] VARCHAR(100),
    CONSTRAINT [ivr.cfg_Dic_CompanyProject_pkey] PRIMARY KEY CLUSTERED ([CompanyProjectId]),
    CONSTRAINT [ivr.cfg_Dic_CompanyProject_CustomerId_ProjectId_key] UNIQUE NONCLUSTERED ([CustomerId],[ProjectId]),
    CONSTRAINT [ivr.cfg_Dic_CompanyProject_OktaGroup_key] UNIQUE NONCLUSTERED ([OktaGroup])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.cfg_Dic_Language] (
    [LanguageCode] VARCHAR(10) NOT NULL,
    [DisplayName] NVARCHAR(128) NOT NULL,
    [NativeName] NVARCHAR(128),
    [SortOrder] INT NOT NULL CONSTRAINT [ivr.cfg_Dic_Language_SortOrder_df] DEFAULT 0,
    [IsActive] BIT NOT NULL CONSTRAINT [ivr.cfg_Dic_Language_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [ivr.cfg_Dic_Language_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [DateUpdated] DATETIME2 NOT NULL,
    CONSTRAINT [ivr.cfg_Dic_Language_pkey] PRIMARY KEY CLUSTERED ([LanguageCode])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.rt_ChangeSet] (
    [ChangeSetId] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ivr.rt_ChangeSet_ChangeSetId_df] DEFAULT NEWID(),
    [RoutingId] VARCHAR(150) NOT NULL,
    [CustomerId] VARCHAR(64) NOT NULL,
    [ProjectId] VARCHAR(64) NOT NULL,
    [Status] VARCHAR(20) NOT NULL CONSTRAINT [ivr.rt_ChangeSet_Status_df] DEFAULT 'draft',
    [VersionName] NVARCHAR(128) NOT NULL,
    [Description] NVARCHAR(500),
    [IsActive] BIT NOT NULL CONSTRAINT [ivr.rt_ChangeSet_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [ivr.rt_ChangeSet_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DatePublished] DATETIME2,
    [PublishedBy] VARCHAR(100),
    CONSTRAINT [ivr.rt_ChangeSet_pkey] PRIMARY KEY CLUSTERED ([ChangeSetId])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.rt_RoutingTable] (
    [RoutingTableId] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ivr.rt_RoutingTable_RoutingTableId_df] DEFAULT NEWID(),
    [SourceId] VARCHAR(150) NOT NULL,
    [RoutingId] VARCHAR(150) NOT NULL,
    [DicCompanyProjectId] INT NOT NULL,
    [LanguageCode] VARCHAR(10),
    [MessageStoreId] INT,
    [SchedulerId] INT,
    [InitSegment] VARCHAR(100) NOT NULL CONSTRAINT [ivr.rt_RoutingTable_InitSegment_df] DEFAULT 'init',
    [FeatureFlags] NVARCHAR(4000) NOT NULL CONSTRAINT [ivr.rt_RoutingTable_FeatureFlags_df] DEFAULT '{}',
    [Config] NVARCHAR(4000) NOT NULL CONSTRAINT [ivr.rt_RoutingTable_Config_df] DEFAULT '{}',
    [IsActive] BIT NOT NULL CONSTRAINT [ivr.rt_RoutingTable_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [ivr.rt_RoutingTable_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DateUpdated] DATETIME2 NOT NULL,
    [UpdatedBy] VARCHAR(100),
    CONSTRAINT [ivr.rt_RoutingTable_pkey] PRIMARY KEY CLUSTERED ([RoutingTableId]),
    CONSTRAINT [ivr.rt_RoutingTable_SourceId_key] UNIQUE NONCLUSTERED ([SourceId])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.rt_RoutingTableHistory] (
    [VersionId] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ivr.rt_RoutingTableHistory_VersionId_df] DEFAULT NEWID(),
    [RoutingId] VARCHAR(150) NOT NULL,
    [VersionNumber] INT NOT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [ivr.rt_RoutingTableHistory_IsActive_df] DEFAULT 0,
    [Snapshot] NVARCHAR(max) NOT NULL,
    [Comment] NVARCHAR(500),
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [ivr.rt_RoutingTableHistory_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    CONSTRAINT [ivr.rt_RoutingTableHistory_pkey] PRIMARY KEY CLUSTERED ([VersionId]),
    CONSTRAINT [ivr.rt_RoutingTableHistory_RoutingId_VersionNumber_key] UNIQUE NONCLUSTERED ([RoutingId],[VersionNumber])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.seg_Dic_KeyType] (
    [DicTypeId] INT NOT NULL IDENTITY(1,1),
    [TypeName] VARCHAR(20) NOT NULL,
    [DisplayName] NVARCHAR(50),
    [Description] NVARCHAR(200),
    CONSTRAINT [ivr.seg_Dic_KeyType_pkey] PRIMARY KEY CLUSTERED ([DicTypeId]),
    CONSTRAINT [ivr.seg_Dic_KeyType_TypeName_key] UNIQUE NONCLUSTERED ([TypeName])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.seg_Dic_SegmentType] (
    [DicSegmentTypeId] INT NOT NULL IDENTITY(1,1),
    [SegmentTypeName] VARCHAR(50) NOT NULL,
    [DisplayName] NVARCHAR(100),
    [Description] NVARCHAR(500),
    [Category] VARCHAR(50),
    [IsTerminal] BIT NOT NULL CONSTRAINT [ivr.seg_Dic_SegmentType_IsTerminal_df] DEFAULT 0,
    [IsActive] BIT NOT NULL CONSTRAINT [ivr.seg_Dic_SegmentType_IsActive_df] DEFAULT 1,
    [Hooks] NVARCHAR(max),
    [HooksSchema] NVARCHAR(max),
    CONSTRAINT [ivr.seg_Dic_SegmentType_pkey] PRIMARY KEY CLUSTERED ([DicSegmentTypeId]),
    CONSTRAINT [ivr.seg_Dic_SegmentType_SegmentTypeName_key] UNIQUE NONCLUSTERED ([SegmentTypeName])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.seg_Dic_Key] (
    [DicKeyId] INT NOT NULL IDENTITY(1,1),
    [DicSegmentTypeId] INT NOT NULL,
    [KeyName] VARCHAR(100) NOT NULL,
    [DisplayName] NVARCHAR(100),
    [DicTypeId] INT NOT NULL,
    [IsRequired] BIT NOT NULL CONSTRAINT [ivr.seg_Dic_Key_IsRequired_df] DEFAULT 0,
    [DefaultValue] NVARCHAR(4000),
    [IsDisplayed] BIT NOT NULL CONSTRAINT [ivr.seg_Dic_Key_IsDisplayed_df] DEFAULT 1,
    [IsEditable] BIT NOT NULL CONSTRAINT [ivr.seg_Dic_Key_IsEditable_df] DEFAULT 1,
    [IsActive] BIT NOT NULL CONSTRAINT [ivr.seg_Dic_Key_IsActive_df] DEFAULT 1,
    CONSTRAINT [ivr.seg_Dic_Key_pkey] PRIMARY KEY CLUSTERED ([DicKeyId]),
    CONSTRAINT [ivr.seg_Dic_Key_DicSegmentTypeId_KeyName_key] UNIQUE NONCLUSTERED ([DicSegmentTypeId],[KeyName])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.seg_Segment] (
    [SegmentId] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ivr.seg_Segment_SegmentId_df] DEFAULT NEWID(),
    [RoutingId] VARCHAR(150) NOT NULL,
    [SegmentName] VARCHAR(100) NOT NULL,
    [DicSegmentTypeId] INT NOT NULL,
    [DisplayName] NVARCHAR(128),
    [ChangeSetId] UNIQUEIDENTIFIER,
    [SegmentOrder] INT,
    [Hooks] NVARCHAR(max),
    [IsActive] BIT NOT NULL CONSTRAINT [ivr.seg_Segment_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [ivr.seg_Segment_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DateUpdated] DATETIME2 NOT NULL,
    [UpdatedBy] VARCHAR(100),
    CONSTRAINT [ivr.seg_Segment_pkey] PRIMARY KEY CLUSTERED ([SegmentId]),
    CONSTRAINT [ivr.seg_Segment_RoutingId_SegmentName_ChangeSetId_key] UNIQUE NONCLUSTERED ([RoutingId],[SegmentName],[ChangeSetId]),
    CONSTRAINT [ivr.seg_Segment_RoutingId_ChangeSetId_SegmentId_key] UNIQUE NONCLUSTERED ([RoutingId],[ChangeSetId],[SegmentId])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.seg_Key] (
    [DicSegmentTypeId] INT NOT NULL,
    [DicKeyId] INT NOT NULL,
    [SegmentId] UNIQUEIDENTIFIER NOT NULL,
    [Value] NVARCHAR(max),
    [IsDisplayed] BIT NOT NULL CONSTRAINT [ivr.seg_Key_IsDisplayed_df] DEFAULT 1,
    [IsEditable] BIT NOT NULL CONSTRAINT [ivr.seg_Key_IsEditable_df] DEFAULT 1,
    [ConfigOrder] INT,
    CONSTRAINT [ivr.seg_Key_pkey] PRIMARY KEY CLUSTERED ([DicSegmentTypeId],[DicKeyId],[SegmentId])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.seg_SegmentTransition] (
    [SegmentTransitionId] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ivr.seg_SegmentTransition_SegmentTransitionId_df] DEFAULT NEWID(),
    [SegmentId] UNIQUEIDENTIFIER NOT NULL,
    [SourceSegmentName] VARCHAR(100),
    [NextSegmentId] UNIQUEIDENTIFIER,
    [NextSegmentName] VARCHAR(100),
    [RoutingId] VARCHAR(150) NOT NULL,
    [ChangeSetId] UNIQUEIDENTIFIER,
    [ContextKey] VARCHAR(100),
    [ResultName] VARCHAR(50) NOT NULL,
    [Params] NVARCHAR(4000),
    [TransitionOrder] INT,
    CONSTRAINT [ivr.seg_SegmentTransition_pkey] PRIMARY KEY CLUSTERED ([SegmentTransitionId]),
    CONSTRAINT [ivr.seg_SegmentTransition_SegmentId_ResultName_key] UNIQUE NONCLUSTERED ([SegmentId],[ResultName])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.seg_SegmentUIState] (
    [SegmentId] UNIQUEIDENTIFIER NOT NULL,
    [RoutingId] VARCHAR(150) NOT NULL,
    [ChangeSetId] UNIQUEIDENTIFIER,
    [PositionX] INT,
    [PositionY] INT,
    [Collapsed] BIT NOT NULL CONSTRAINT [ivr.seg_SegmentUIState_Collapsed_df] DEFAULT 0,
    [UiSettings] NVARCHAR(2000),
    [DateUpdated] DATETIME2 NOT NULL,
    CONSTRAINT [ivr.seg_SegmentUIState_pkey] PRIMARY KEY CLUSTERED ([SegmentId])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.msg_Dic_MessageType] (
    [MessageTypeId] INT NOT NULL IDENTITY(1,1),
    [Code] VARCHAR(20) NOT NULL,
    [DisplayName] NVARCHAR(64) NOT NULL,
    [Description] NVARCHAR(256),
    [SettingsSchema] NVARCHAR(max),
    [DefaultSettings] NVARCHAR(max),
    [SortOrder] INT NOT NULL CONSTRAINT [ivr.msg_Dic_MessageType_SortOrder_df] DEFAULT 0,
    [IsActive] BIT NOT NULL CONSTRAINT [ivr.msg_Dic_MessageType_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [ivr.msg_Dic_MessageType_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ivr.msg_Dic_MessageType_pkey] PRIMARY KEY CLUSTERED ([MessageTypeId]),
    CONSTRAINT [ivr.msg_Dic_MessageType_Code_key] UNIQUE NONCLUSTERED ([Code])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.msg_Dic_MessageCategory] (
    [CategoryId] INT NOT NULL IDENTITY(1,1),
    [Code] VARCHAR(32) NOT NULL,
    [DisplayName] NVARCHAR(64) NOT NULL,
    [Description] NVARCHAR(256),
    [Icon] NVARCHAR(32),
    [Color] CHAR(7),
    [SortOrder] INT NOT NULL CONSTRAINT [ivr.msg_Dic_MessageCategory_SortOrder_df] DEFAULT 0,
    [IsActive] BIT NOT NULL CONSTRAINT [ivr.msg_Dic_MessageCategory_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [ivr.msg_Dic_MessageCategory_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ivr.msg_Dic_MessageCategory_pkey] PRIMARY KEY CLUSTERED ([CategoryId]),
    CONSTRAINT [ivr.msg_Dic_MessageCategory_Code_key] UNIQUE NONCLUSTERED ([Code])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.cfg_Dic_Voice] (
    [VoiceId] INT NOT NULL IDENTITY(1,1),
    [Code] VARCHAR(64) NOT NULL,
    [Engine] VARCHAR(20) NOT NULL,
    [Language] VARCHAR(10) NOT NULL,
    [DisplayName] NVARCHAR(128) NOT NULL,
    [Gender] VARCHAR(10),
    [Style] VARCHAR(32),
    [SampleUrl] VARCHAR(256),
    [SortOrder] INT NOT NULL CONSTRAINT [ivr.cfg_Dic_Voice_SortOrder_df] DEFAULT 0,
    [IsActive] BIT NOT NULL CONSTRAINT [ivr.cfg_Dic_Voice_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [ivr.cfg_Dic_Voice_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ivr.cfg_Dic_Voice_pkey] PRIMARY KEY CLUSTERED ([VoiceId]),
    CONSTRAINT [ivr.cfg_Dic_Voice_Code_key] UNIQUE NONCLUSTERED ([Code])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.msg_MessageStore] (
    [MessageStoreId] INT NOT NULL IDENTITY(1,1),
    [DicCompanyProjectId] INT NOT NULL,
    [Name] NVARCHAR(128) NOT NULL,
    [Description] NVARCHAR(512),
    [AllowedLanguages] NVARCHAR(200) NOT NULL CONSTRAINT [ivr.msg_MessageStore_AllowedLanguages_df] DEFAULT '[]',
    [DefaultLanguage] VARCHAR(10),
    [IsActive] BIT NOT NULL CONSTRAINT [ivr.msg_MessageStore_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [ivr.msg_MessageStore_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DateUpdated] DATETIME2 NOT NULL,
    [UpdatedBy] VARCHAR(100),
    CONSTRAINT [ivr.msg_MessageStore_pkey] PRIMARY KEY CLUSTERED ([MessageStoreId])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.msg_MessageStoreVoiceConfig] (
    [ConfigId] INT NOT NULL IDENTITY(1,1),
    [MessageStoreId] INT NOT NULL,
    [Language] VARCHAR(10) NOT NULL,
    [DicVoiceId] INT NOT NULL,
    [IsDefault] BIT NOT NULL CONSTRAINT [ivr.msg_MessageStoreVoiceConfig_IsDefault_df] DEFAULT 0,
    [SortOrder] INT NOT NULL CONSTRAINT [ivr.msg_MessageStoreVoiceConfig_SortOrder_df] DEFAULT 0,
    CONSTRAINT [ivr.msg_MessageStoreVoiceConfig_pkey] PRIMARY KEY CLUSTERED ([ConfigId]),
    CONSTRAINT [ivr.msg_MessageStoreVoiceConfig_MessageStoreId_Language_DicVoiceId_key] UNIQUE NONCLUSTERED ([MessageStoreId],[Language],[DicVoiceId])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.msg_MessageKey] (
    [MessageKeyId] INT NOT NULL IDENTITY(1,1),
    [MessageStoreId] INT NOT NULL,
    [MessageKey] VARCHAR(64) NOT NULL,
    [DicMessageTypeId] INT NOT NULL,
    [DicMessageCategoryId] INT NOT NULL,
    [PublishedVersion] INT,
    [DisplayName] NVARCHAR(128),
    [Description] NVARCHAR(512),
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [ivr.msg_MessageKey_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DateUpdated] DATETIME2 NOT NULL,
    [UpdatedBy] VARCHAR(100),
    CONSTRAINT [ivr.msg_MessageKey_pkey] PRIMARY KEY CLUSTERED ([MessageKeyId]),
    CONSTRAINT [ivr.msg_MessageKey_MessageStoreId_MessageKey_key] UNIQUE NONCLUSTERED ([MessageStoreId],[MessageKey])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.msg_MessageKeyVersion] (
    [MessageKeyVersionId] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ivr.msg_MessageKeyVersion_MessageKeyVersionId_df] DEFAULT NEWID(),
    [MessageKeyId] INT NOT NULL,
    [Version] INT NOT NULL,
    [VersionName] NVARCHAR(128),
    [IsActive] BIT NOT NULL CONSTRAINT [ivr.msg_MessageKeyVersion_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [ivr.msg_MessageKeyVersion_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    CONSTRAINT [ivr.msg_MessageKeyVersion_pkey] PRIMARY KEY CLUSTERED ([MessageKeyVersionId]),
    CONSTRAINT [ivr.msg_MessageKeyVersion_MessageKeyId_Version_key] UNIQUE NONCLUSTERED ([MessageKeyId],[Version])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.msg_MessageLanguageContent] (
    [MessageLanguageContentId] INT NOT NULL IDENTITY(1,1),
    [MessageKeyVersionId] UNIQUEIDENTIFIER NOT NULL,
    [Language] VARCHAR(10) NOT NULL,
    [Content] NVARCHAR(max) NOT NULL,
    [TypeSettings] NVARCHAR(max),
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [ivr.msg_MessageLanguageContent_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DateUpdated] DATETIME2 NOT NULL,
    [UpdatedBy] VARCHAR(100),
    CONSTRAINT [ivr.msg_MessageLanguageContent_pkey] PRIMARY KEY CLUSTERED ([MessageLanguageContentId]),
    CONSTRAINT [ivr.msg_MessageLanguageContent_MessageKeyVersionId_Language_key] UNIQUE NONCLUSTERED ([MessageKeyVersionId],[Language])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.msg_MessageKeyAudit] (
    [AuditId] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ivr.msg_MessageKeyAudit_AuditId_df] DEFAULT NEWID(),
    [MessageKeyId] INT NOT NULL,
    [MessageKeyVersionId] UNIQUEIDENTIFIER,
    [Action] VARCHAR(20) NOT NULL,
    [ActionBy] VARCHAR(100) NOT NULL,
    [ActionReason] NVARCHAR(500),
    [AuditData] NVARCHAR(max),
    [DateAction] DATETIME2 NOT NULL CONSTRAINT [ivr.msg_MessageKeyAudit_DateAction_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ivr.msg_MessageKeyAudit_pkey] PRIMARY KEY CLUSTERED ([AuditId])
);

-- CreateTable
CREATE TABLE [dbo].[ivr.sys_AuditLog] (
    [AuditLogId] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ivr.sys_AuditLog_AuditLogId_df] DEFAULT NEWID(),
    [UserId] VARCHAR(100) NOT NULL,
    [UserEmail] VARCHAR(256) NOT NULL,
    [Action] VARCHAR(256) NOT NULL,
    [EntityType] VARCHAR(100) NOT NULL,
    [EntityId] VARCHAR(150),
    [Timestamp] DATETIME2 NOT NULL CONSTRAINT [ivr.sys_AuditLog_Timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    [Duration] INT,
    [IpAddress] VARCHAR(45),
    [UserAgent] NVARCHAR(512),
    [RequestBody] NVARCHAR(max),
    [ResponseStatus] VARCHAR(20) NOT NULL,
    [ErrorMessage] NVARCHAR(max),
    CONSTRAINT [ivr.sys_AuditLog_pkey] PRIMARY KEY CLUSTERED ([AuditLogId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ivr.cfg_Dic_CompanyProject_CustomerId_idx] ON [dbo].[ivr.cfg_Dic_CompanyProject]([CustomerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ivr.cfg_Dic_CompanyProject_IsActive_idx] ON [dbo].[ivr.cfg_Dic_CompanyProject]([IsActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ivr.cfg_Dic_CompanyProject_OktaGroup_idx] ON [dbo].[ivr.cfg_Dic_CompanyProject]([OktaGroup]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_changeset_routing] ON [dbo].[ivr.rt_ChangeSet]([RoutingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_changeset_status] ON [dbo].[ivr.rt_ChangeSet]([Status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_changeset_created] ON [dbo].[ivr.rt_ChangeSet]([DateCreated]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_changeset_routing_status_active] ON [dbo].[ivr.rt_ChangeSet]([RoutingId], [Status], [IsActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_routing_routingid] ON [dbo].[ivr.rt_RoutingTable]([RoutingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_routing_company] ON [dbo].[ivr.rt_RoutingTable]([DicCompanyProjectId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_routing_messagestore] ON [dbo].[ivr.rt_RoutingTable]([MessageStoreId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_history_routing] ON [dbo].[ivr.rt_RoutingTableHistory]([RoutingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_history_created] ON [dbo].[ivr.rt_RoutingTableHistory]([DateCreated]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_segment_routing] ON [dbo].[ivr.seg_Segment]([RoutingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_segment_type] ON [dbo].[ivr.seg_Segment]([DicSegmentTypeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_segment_changeset] ON [dbo].[ivr.seg_Segment]([ChangeSetId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_segment_order] ON [dbo].[ivr.seg_Segment]([RoutingId], [SegmentOrder]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_key_order] ON [dbo].[ivr.seg_Key]([SegmentId], [ConfigOrder]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ivr.seg_SegmentTransition_SegmentId_idx] ON [dbo].[ivr.seg_SegmentTransition]([SegmentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ivr.seg_SegmentTransition_NextSegmentId_idx] ON [dbo].[ivr.seg_SegmentTransition]([NextSegmentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_transition_source_name] ON [dbo].[ivr.seg_SegmentTransition]([RoutingId], [ChangeSetId], [SourceSegmentName]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_transition_target_name] ON [dbo].[ivr.seg_SegmentTransition]([RoutingId], [ChangeSetId], [NextSegmentName]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_transition_contextkey] ON [dbo].[ivr.seg_SegmentTransition]([SegmentId], [ContextKey]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_transition_order] ON [dbo].[ivr.seg_SegmentTransition]([SegmentId], [TransitionOrder]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_ui_state_routing] ON [dbo].[ivr.seg_SegmentUIState]([RoutingId], [ChangeSetId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_voice_engine_lang] ON [dbo].[ivr.cfg_Dic_Voice]([Engine], [Language]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_messagestore_companyproject] ON [dbo].[ivr.msg_MessageStore]([DicCompanyProjectId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_messagestore_active] ON [dbo].[ivr.msg_MessageStore]([IsActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_voiceconfig_store_lang] ON [dbo].[ivr.msg_MessageStoreVoiceConfig]([MessageStoreId], [Language]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_mk_store] ON [dbo].[ivr.msg_MessageKey]([MessageStoreId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_mk_category] ON [dbo].[ivr.msg_MessageKey]([DicMessageCategoryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_mk_type] ON [dbo].[ivr.msg_MessageKey]([DicMessageTypeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_mkv_key] ON [dbo].[ivr.msg_MessageKeyVersion]([MessageKeyId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_mlc_version] ON [dbo].[ivr.msg_MessageLanguageContent]([MessageKeyVersionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_mka_key] ON [dbo].[ivr.msg_MessageKeyAudit]([MessageKeyId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_mka_version] ON [dbo].[ivr.msg_MessageKeyAudit]([MessageKeyVersionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_mka_date] ON [dbo].[ivr.msg_MessageKeyAudit]([DateAction]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_mka_action] ON [dbo].[ivr.msg_MessageKeyAudit]([Action]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ivr.sys_AuditLog_UserId_idx] ON [dbo].[ivr.sys_AuditLog]([UserId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ivr.sys_AuditLog_EntityType_EntityId_idx] ON [dbo].[ivr.sys_AuditLog]([EntityType], [EntityId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ivr.sys_AuditLog_Timestamp_idx] ON [dbo].[ivr.sys_AuditLog]([Timestamp]);

-- AddForeignKey
ALTER TABLE [dbo].[ivr.rt_RoutingTable] ADD CONSTRAINT [ivr.rt_RoutingTable_DicCompanyProjectId_fkey] FOREIGN KEY ([DicCompanyProjectId]) REFERENCES [dbo].[ivr.cfg_Dic_CompanyProject]([CompanyProjectId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.rt_RoutingTable] ADD CONSTRAINT [ivr.rt_RoutingTable_LanguageCode_fkey] FOREIGN KEY ([LanguageCode]) REFERENCES [dbo].[ivr.cfg_Dic_Language]([LanguageCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.rt_RoutingTable] ADD CONSTRAINT [ivr.rt_RoutingTable_MessageStoreId_fkey] FOREIGN KEY ([MessageStoreId]) REFERENCES [dbo].[ivr.msg_MessageStore]([MessageStoreId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.seg_Dic_Key] ADD CONSTRAINT [ivr.seg_Dic_Key_DicSegmentTypeId_fkey] FOREIGN KEY ([DicSegmentTypeId]) REFERENCES [dbo].[ivr.seg_Dic_SegmentType]([DicSegmentTypeId]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.seg_Dic_Key] ADD CONSTRAINT [ivr.seg_Dic_Key_DicTypeId_fkey] FOREIGN KEY ([DicTypeId]) REFERENCES [dbo].[ivr.seg_Dic_KeyType]([DicTypeId]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.seg_Segment] ADD CONSTRAINT [ivr.seg_Segment_DicSegmentTypeId_fkey] FOREIGN KEY ([DicSegmentTypeId]) REFERENCES [dbo].[ivr.seg_Dic_SegmentType]([DicSegmentTypeId]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.seg_Segment] ADD CONSTRAINT [ivr.seg_Segment_ChangeSetId_fkey] FOREIGN KEY ([ChangeSetId]) REFERENCES [dbo].[ivr.rt_ChangeSet]([ChangeSetId]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.seg_Key] ADD CONSTRAINT [ivr.seg_Key_DicSegmentTypeId_fkey] FOREIGN KEY ([DicSegmentTypeId]) REFERENCES [dbo].[ivr.seg_Dic_SegmentType]([DicSegmentTypeId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.seg_Key] ADD CONSTRAINT [ivr.seg_Key_DicKeyId_fkey] FOREIGN KEY ([DicKeyId]) REFERENCES [dbo].[ivr.seg_Dic_Key]([DicKeyId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.seg_Key] ADD CONSTRAINT [ivr.seg_Key_SegmentId_fkey] FOREIGN KEY ([SegmentId]) REFERENCES [dbo].[ivr.seg_Segment]([SegmentId]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.seg_SegmentTransition] ADD CONSTRAINT [ivr.seg_SegmentTransition_SegmentId_fkey] FOREIGN KEY ([SegmentId]) REFERENCES [dbo].[ivr.seg_Segment]([SegmentId]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.seg_SegmentTransition] ADD CONSTRAINT [ivr.seg_SegmentTransition_NextSegmentId_fkey] FOREIGN KEY ([NextSegmentId]) REFERENCES [dbo].[ivr.seg_Segment]([SegmentId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.seg_SegmentUIState] ADD CONSTRAINT [ivr.seg_SegmentUIState_SegmentId_fkey] FOREIGN KEY ([SegmentId]) REFERENCES [dbo].[ivr.seg_Segment]([SegmentId]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.cfg_Dic_Voice] ADD CONSTRAINT [ivr.cfg_Dic_Voice_Language_fkey] FOREIGN KEY ([Language]) REFERENCES [dbo].[ivr.cfg_Dic_Language]([LanguageCode]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.msg_MessageStore] ADD CONSTRAINT [ivr.msg_MessageStore_DicCompanyProjectId_fkey] FOREIGN KEY ([DicCompanyProjectId]) REFERENCES [dbo].[ivr.cfg_Dic_CompanyProject]([CompanyProjectId]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.msg_MessageStore] ADD CONSTRAINT [ivr.msg_MessageStore_DefaultLanguage_fkey] FOREIGN KEY ([DefaultLanguage]) REFERENCES [dbo].[ivr.cfg_Dic_Language]([LanguageCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.msg_MessageStoreVoiceConfig] ADD CONSTRAINT [ivr.msg_MessageStoreVoiceConfig_MessageStoreId_fkey] FOREIGN KEY ([MessageStoreId]) REFERENCES [dbo].[ivr.msg_MessageStore]([MessageStoreId]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.msg_MessageStoreVoiceConfig] ADD CONSTRAINT [ivr.msg_MessageStoreVoiceConfig_DicVoiceId_fkey] FOREIGN KEY ([DicVoiceId]) REFERENCES [dbo].[ivr.cfg_Dic_Voice]([VoiceId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.msg_MessageStoreVoiceConfig] ADD CONSTRAINT [ivr.msg_MessageStoreVoiceConfig_Language_fkey] FOREIGN KEY ([Language]) REFERENCES [dbo].[ivr.cfg_Dic_Language]([LanguageCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.msg_MessageKey] ADD CONSTRAINT [ivr.msg_MessageKey_MessageStoreId_fkey] FOREIGN KEY ([MessageStoreId]) REFERENCES [dbo].[ivr.msg_MessageStore]([MessageStoreId]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.msg_MessageKey] ADD CONSTRAINT [ivr.msg_MessageKey_DicMessageTypeId_fkey] FOREIGN KEY ([DicMessageTypeId]) REFERENCES [dbo].[ivr.msg_Dic_MessageType]([MessageTypeId]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.msg_MessageKey] ADD CONSTRAINT [ivr.msg_MessageKey_DicMessageCategoryId_fkey] FOREIGN KEY ([DicMessageCategoryId]) REFERENCES [dbo].[ivr.msg_Dic_MessageCategory]([CategoryId]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.msg_MessageKeyVersion] ADD CONSTRAINT [ivr.msg_MessageKeyVersion_MessageKeyId_fkey] FOREIGN KEY ([MessageKeyId]) REFERENCES [dbo].[ivr.msg_MessageKey]([MessageKeyId]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.msg_MessageLanguageContent] ADD CONSTRAINT [ivr.msg_MessageLanguageContent_MessageKeyVersionId_fkey] FOREIGN KEY ([MessageKeyVersionId]) REFERENCES [dbo].[ivr.msg_MessageKeyVersion]([MessageKeyVersionId]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ivr.msg_MessageLanguageContent] ADD CONSTRAINT [ivr.msg_MessageLanguageContent_Language_fkey] FOREIGN KEY ([Language]) REFERENCES [dbo].[ivr.cfg_Dic_Language]([LanguageCode]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

