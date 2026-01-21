BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[seg_Segment] ADD [SegmentOrder] INT NULL;

-- CreateIndex
CREATE NONCLUSTERED INDEX [ix_segment_order] ON [dbo].[seg_Segment]([RoutingId], [SegmentOrder]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
