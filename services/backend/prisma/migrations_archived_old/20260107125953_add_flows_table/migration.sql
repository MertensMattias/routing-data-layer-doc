BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[msg_MessageVersion] ADD [VersionName] NVARCHAR(128);

-- CreateTable
CREATE TABLE [dbo].[rt_Flow] (
    [FlowId] UNIQUEIDENTIFIER NOT NULL,
    [Name] NVARCHAR(128) NOT NULL,
    [Description] NVARCHAR(512),
    [FlowData] NVARCHAR(max) NOT NULL,
    [Version] INT NOT NULL CONSTRAINT [rt_Flow_Version_df] DEFAULT 1,
    [CompanyProjectId] INT,
    [RoutingId] VARCHAR(150),
    [IsActive] BIT NOT NULL CONSTRAINT [rt_Flow_IsActive_df] DEFAULT 1,
    [DateCreated] DATETIME2 NOT NULL CONSTRAINT [rt_Flow_DateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedBy] VARCHAR(100),
    [DateUpdated] DATETIME2 NOT NULL,
    [UpdatedBy] VARCHAR(100),
    CONSTRAINT [rt_Flow_pkey] PRIMARY KEY CLUSTERED ([FlowId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_flow_routing] ON [dbo].[rt_Flow]([RoutingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_flow_company] ON [dbo].[rt_Flow]([CompanyProjectId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_flow_created] ON [dbo].[rt_Flow]([DateCreated]);

-- AddForeignKey
ALTER TABLE [dbo].[rt_Flow] ADD CONSTRAINT [rt_Flow_CompanyProjectId_fkey] FOREIGN KEY ([CompanyProjectId]) REFERENCES [dbo].[cfg_Dic_CompanyProject]([CompanyProjectId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
