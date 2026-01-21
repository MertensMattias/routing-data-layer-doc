/*
  Warnings:

  - A unique constraint covering the columns `[SegmentId,ResultName]` on the table `seg_SegmentTransition` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `VersionName` to the `rt_ChangeSet` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
ALTER TABLE [dbo].[seg_SegmentTransition] DROP CONSTRAINT [seg_SegmentTransition_SegmentId_ResultName_ContextKey_key];

-- AlterTable
ALTER TABLE [dbo].[msg_MessageAudit] ADD CONSTRAINT [msg_MessageAudit_AuditId_df] DEFAULT NEWID() FOR [AuditId];

-- AlterTable
ALTER TABLE [dbo].[msg_MessageVersion] ADD CONSTRAINT [msg_MessageVersion_MessageVersionId_df] DEFAULT NEWID() FOR [MessageVersionId];

-- AlterTable
ALTER TABLE [dbo].[rt_ChangeSet] ADD CONSTRAINT [rt_ChangeSet_ChangeSetId_df] DEFAULT NEWID() FOR [ChangeSetId];
ALTER TABLE [dbo].[rt_ChangeSet] ADD [VersionName] NVARCHAR(128) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[rt_Flow] ADD CONSTRAINT [rt_Flow_FlowId_df] DEFAULT NEWID() FOR [FlowId];

-- AlterTable
ALTER TABLE [dbo].[rt_RoutingTable] ADD CONSTRAINT [rt_RoutingTable_RoutingTableId_df] DEFAULT NEWID() FOR [RoutingTableId];

-- AlterTable
ALTER TABLE [dbo].[rt_RoutingTableHistory] ADD CONSTRAINT [rt_RoutingTableHistory_VersionId_df] DEFAULT NEWID() FOR [VersionId];

-- AlterTable
ALTER TABLE [dbo].[seg_Segment] ADD CONSTRAINT [seg_Segment_SegmentId_df] DEFAULT NEWID() FOR [SegmentId];

-- AlterTable
ALTER TABLE [dbo].[seg_SegmentTransition] ADD CONSTRAINT [seg_SegmentTransition_SegmentTransitionId_df] DEFAULT NEWID() FOR [SegmentTransitionId];

-- AlterTable
ALTER TABLE [dbo].[sys_AuditLog] ADD CONSTRAINT [sys_AuditLog_AuditLogId_df] DEFAULT NEWID() FOR [AuditLogId];

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_changeset_routing_status_active] ON [dbo].[rt_ChangeSet]([RoutingId], [Status], [IsActive]);

-- CreateIndex
ALTER TABLE [dbo].[seg_SegmentTransition] ADD CONSTRAINT [seg_SegmentTransition_SegmentId_ResultName_key] UNIQUE NONCLUSTERED ([SegmentId], [ResultName]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
